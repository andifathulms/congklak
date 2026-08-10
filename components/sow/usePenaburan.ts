'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Board } from '@/lib/engine/board'
import { describeEvent, type GameEvent, type HentiEvent } from '@/lib/engine/events'
import { framesFor, frameDuration, initialFrame, type Frame } from './frames'
import { mainkanRingkas, mainkanSuara, siapkanSuara } from './suara'

export type Kecepatan = 'pelan' | 'sedang' | 'cepat' | 'langsung'

/** Long relays are unwatchable at full speed and incomprehensible at none. */
const PENGALI: Record<Kecepatan, number> = {
  pelan: 2,
  sedang: 1,
  cepat: 0.4,
  langsung: 0,
}

export const KECEPATAN: readonly Kecepatan[] = ['pelan', 'sedang', 'cepat', 'langsung']

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export interface Penaburan {
  readonly frame: Frame
  readonly playing: boolean
  /** Ringkasan tertulis peristiwa yang sudah lewat, untuk gerak-terbatas. */
  readonly ringkasan: readonly string[]
  /**
   * Kenapa giliran terakhir berhenti tanpa hasil, kalau memang begitu.
   * Bertahan sampai langkah berikutnya, karena inilah pertanyaan yang
   * dibawa pemain ke layar: kenapa tidak menembak?
   */
  readonly alasanHenti: HentiEvent | null
  play: (before: Board, events: readonly GameEvent[], onDone: () => void) => void
  /** Loncat ke akhir; animasi yang sedang jalan dibatalkan. */
  skip: () => void
  reset: (board: Board) => void
}

/**
 * Plays one turn's event stream. It decides only *when* to show a frame —
 * never *what* the frame contains.
 */
export function usePenaburan(board: Board, kecepatan: Kecepatan): Penaburan {
  const [frames, setFrames] = useState<Frame[]>(() => [initialFrame(board)])
  const [at, setAt] = useState(0)
  const [playing, setPlaying] = useState(false)

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const done = useRef<(() => void) | null>(null)

  const clear = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const finish = useCallback(() => {
    const callback = done.current
    done.current = null
    setPlaying(false)
    callback?.()
  }, [])

  useEffect(() => clear, [clear])

  /**
   * Warm the audio context once, during idle time, on every screen that can
   * make a sound — rather than paying for it inside the player's first move.
   */
  useEffect(() => {
    const jadwal =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback
        : (cb: () => void) => window.setTimeout(cb, 300)
    const batal =
      typeof window.cancelIdleCallback === 'function'
        ? window.cancelIdleCallback
        : window.clearTimeout
    const id = jadwal(() => siapkanSuara())
    return () => batal(id as number)
  }, [])

  // Satu langkah per bingkai, dijadwalkan dari durasi bingkai itu sendiri.
  useEffect(() => {
    if (!playing) return
    if (at >= frames.length - 1) {
      finish()
      return
    }

    const next = frames[at + 1]
    const ms = frameDuration(next) * PENGALI[kecepatan]

    if (ms <= 0) {
      setAt(frames.length - 1)
      return
    }

    timer.current = setTimeout(() => {
      // Bunyi menumpang pada langkah bingkai yang sama: satu peristiwa, satu
      // bingkai, satu bunyi. Ia tidak pernah menghitung apa pun sendiri.
      if (next.event) mainkanSuara(next.event)
      setAt((i) => i + 1)
    }, ms)
    return clear
  }, [playing, at, frames, kecepatan, clear, finish])

  const play = useCallback(
    (before: Board, events: readonly GameEvent[], onDone: () => void) => {
      clear()
      const next = framesFor(before, events)
      done.current = onDone
      setFrames(next)

      // Gerak-terbatas diselesaikan seketika, dengan ringkasan tertulis
      // tentang apa yang terjadi (PRD §8.1).
      if (prefersReducedMotion() || kecepatan === 'langsung') {
        mainkanRingkas(events)
        setAt(next.length - 1)
        setPlaying(false)
        onDone()
        done.current = null
        return
      }

      setAt(0)
      setPlaying(true)
    },
    [clear, kecepatan],
  )

  const skip = useCallback(() => {
    clear()
    // Melewati animasi tetap menyisakan hasilnya, jadi hasil itu tetap
    // berbunyi — sekali, bukan sisa bingkai yang belum sempat diputar.
    mainkanRingkas(frames.slice(at + 1).map((f) => f.event).filter((e): e is GameEvent => !!e))
    setAt(frames.length - 1)
  }, [clear, frames, at])

  const reset = useCallback(
    (next: Board) => {
      clear()
      done.current = null
      setFrames([initialFrame(next)])
      setAt(0)
      setPlaying(false)
    },
    [clear],
  )

  const alasanHenti = useMemo(() => {
    for (let i = at; i >= 1; i--) {
      const e = frames[i]?.event
      if (e && e.type === 'henti') return e
      // Hanya giliran terakhir yang dihitung — begitu ketemu awal giliran,
      // berhenti mencari ke belakang.
      if (e && e.type === 'scoop') return null
    }
    return null
  }, [frames, at])

  const ringkasan = useMemo(
    () =>
      frames
        .slice(1, at + 1)
        .map((f) => (f.event ? describeEvent(f.event) : ''))
        .filter(Boolean),
    [frames, at],
  )

  return { frame: frames[at] ?? frames[0], playing, ringkasan, alasanHenti, play, skip, reset }
}
