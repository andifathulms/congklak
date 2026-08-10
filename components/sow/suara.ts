'use client'

/**
 * The sow, heard.
 *
 * PRD §11 calls the rhythm of a turn — seed, seed, scoop, heavier drop into
 * the lumbung — the game itself. That rhythm was only ever visual. This is
 * the same event stream the animation replays, rendered as sound instead:
 * the audio decides nothing, exactly as the renderer decides nothing.
 *
 * Synthesised, not sampled. Seven short tones from an oscillator cost no
 * download, no dependency, and no asset pipeline, and they stay in tune
 * with a board that is deliberately a diagram rather than a photograph.
 *
 * Nothing here can make a sound before the player has touched something —
 * every call arrives from an event produced by their own move — so there is
 * no autoplay to fight and nothing plays unbidden on arrival.
 */
import type { GameEvent } from '@/lib/engine/events'

const KUNCI = 'congklak.suara.v1'

let ctx: AudioContext | null = null
let aktif = true
let dibaca = false

type WindowDenganAudio = Window & { webkitAudioContext?: typeof AudioContext }

/** Preferensi tersimpan; dibaca sekali, sesudah mount. */
export function suaraAktif(): boolean {
  if (!dibaca && typeof window !== 'undefined') {
    dibaca = true
    try {
      const simpan = window.localStorage.getItem(KUNCI)
      if (simpan !== null) aktif = simpan === '1'
    } catch {
      /* mode privat atau kuota — bunyinya tidak cukup penting untuk ribut */
    }
  }
  return aktif
}

export function setSuaraAktif(next: boolean): void {
  aktif = next
  try {
    window.localStorage.setItem(KUNCI, next ? '1' : '0')
  } catch {
    /* abaikan */
  }
  if (!next && ctx) void ctx.suspend()
}

/**
 * Build the audio context ahead of time, while nothing is happening.
 *
 * Constructing an AudioContext is synchronous and slow — measured at 168ms
 * on the first move of a session, the only main-thread task over 50ms the
 * app produced. It landed inside the move because that was the first time
 * anything asked for sound. Second and subsequent moves cost nothing, and
 * with sound off the task never existed at all, which is how it was
 * identified.
 *
 * Creating one without a user gesture is allowed: it starts suspended, and
 * `konteks()` already resumes it when the first sound actually plays. So
 * the cost moves to idle time after load, where nobody is waiting.
 */
export function siapkanSuara(): void {
  if (!suaraAktif()) return
  konteks()
}

function konteks(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (ctx === null) {
    const Ctor = window.AudioContext ?? (window as WindowDenganAudio).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  // Dibuat di dalam gerakan pemain, tapi bisa tersuspensi kalau tab pernah
  // ditinggalkan.
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

interface Nada {
  readonly freq: number
  /** Sapuan ke frekuensi ini, kalau ada — dipakai tembakan dan giliran lagi. */
  readonly ke?: number
  readonly dur: number
  readonly gain: number
  readonly type?: OscillatorType
  readonly tunda?: number
}

function bunyikan(nada: Nada): void {
  const ac = konteks()
  if (!ac) return

  const t0 = ac.currentTime + (nada.tunda ?? 0)
  const osc = ac.createOscillator()
  const amp = ac.createGain()

  osc.type = nada.type ?? 'triangle'
  osc.frequency.setValueAtTime(nada.freq, t0)
  if (nada.ke !== undefined) osc.frequency.exponentialRampToValueAtTime(nada.ke, t0 + nada.dur)

  // Serangan sangat singkat lalu peluruhan: bentuk biji kayu yang jatuh,
  // bukan nada organ yang menyala dan padam.
  amp.gain.setValueAtTime(0.0001, t0)
  amp.gain.exponentialRampToValueAtTime(nada.gain, t0 + 0.006)
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + nada.dur)

  osc.connect(amp).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + nada.dur + 0.02)
}

/** Sapuan derau pendek — bunyi biji diangkat segenggam, untuk sambung. */
function desis(gain: number): void {
  const ac = konteks()
  if (!ac) return

  const panjang = Math.floor(ac.sampleRate * 0.13)
  const buffer = ac.createBuffer(1, panjang, ac.sampleRate)
  const data = buffer.getChannelData(0)
  // Deret deterministik, bukan Math.random: bunyinya harus sama tiap kali,
  // dan tidak ada alasan memasukkan keacakan ke dalam aplikasi ini.
  let x = 0.7
  for (let i = 0; i < panjang; i++) {
    x = (x * 1103515245 + 12345) % 1
    const luruh = 1 - i / panjang
    data[i] = (x * 2 - 1) * luruh * luruh
  }

  const src = ac.createBufferSource()
  src.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 1600
  filter.Q.value = 0.8
  const amp = ac.createGain()
  amp.gain.value = gain

  src.connect(filter).connect(amp).connect(ac.destination)
  src.start()
}

/**
 * One sound per event, chosen so the turn can be followed with eyes closed:
 * a run of light clicks rising as the hand empties, a heavier drop when one
 * lands in the lumbung, a scooping hiss on every relay, and a distinctly
 * brighter two-tone for *menembak* — the moment that decides games.
 */
export function mainkanSuara(event: GameEvent): void {
  if (!suaraAktif()) return

  switch (event.type) {
    case 'scoop':
      desis(0.05)
      break

    case 'sow': {
      // Naik sedikit demi sedikit saat genggaman menipis, jadi telinga tahu
      // pendaratannya sudah dekat tanpa menghitung.
      const naik = Math.min(event.sisa, 12)
      bunyikan({ freq: 520 + (12 - naik) * 16, dur: 0.05, gain: 0.045, type: 'triangle' })
      break
    }

    case 'bank':
      bunyikan({ freq: 196, dur: 0.16, gain: 0.09, type: 'sine' })
      break

    case 'relay':
      desis(0.07)
      break

    case 'menembak':
      bunyikan({ freq: 660, ke: 990, dur: 0.11, gain: 0.08, type: 'triangle' })
      bunyikan({ freq: 330, ke: 495, dur: 0.22, gain: 0.06, type: 'sine', tunda: 0.05 })
      break

    case 'extraTurn':
      bunyikan({ freq: 523, dur: 0.1, gain: 0.06, type: 'sine' })
      bunyikan({ freq: 784, dur: 0.16, gain: 0.06, type: 'sine', tunda: 0.09 })
      break

    case 'henti':
      bunyikan({ freq: 392, ke: 311, dur: 0.16, gain: 0.05, type: 'sine' })
      break

    case 'sweep':
      desis(0.035)
      break

    case 'end':
      // Akor yang menutup: sama untuk menang, kalah, dan seri. Bunyi
      // kemenangan yang berbeda akan menghakimi hasil, dan seri di sini
      // adalah hasil yang sah, bukan kegagalan.
      bunyikan({ freq: 262, dur: 0.5, gain: 0.07, type: 'sine' })
      bunyikan({ freq: 392, dur: 0.45, gain: 0.05, type: 'sine', tunda: 0.07 })
      bunyikan({ freq: 523, dur: 0.4, gain: 0.045, type: 'sine', tunda: 0.14 })
      break

    case 'turnEnd':
      break

    default: {
      const habis: never = event
      return habis
    }
  }
}

/**
 * The whole turn in one sound, for when the board resolves at once —
 * instant speed, a skipped animation, or reduced motion. Forty clicks
 * arriving in the same millisecond is noise, not rhythm, so only the
 * outcome speaks.
 */
export function mainkanRingkas(events: readonly GameEvent[]): void {
  if (!suaraAktif()) return
  const penting =
    events.find((e) => e.type === 'menembak') ??
    events.find((e) => e.type === 'extraTurn') ??
    events.find((e) => e.type === 'end') ??
    events.find((e) => e.type === 'henti')
  if (penting) mainkanSuara(penting)
  else desis(0.05)
}
