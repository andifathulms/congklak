'use client'

/**
 * Local stats (PRD §8.7). localStorage only — no accounts, no ranking,
 * no gameplay analytics leaving the device (PRD §4).
 *
 * Kept per ruleset id: a win rate that mixes two rulesets together is not
 * a win rate at anything.
 */
import type { Hasil } from '@/lib/engine/events'
import type { ReplayStep } from '@/lib/engine/replay'

const KEY = 'lumbung.statistik.v1'

export interface Statistik {
  readonly dimainkan: number
  readonly menangA: number
  readonly menangB: number
  readonly seri: number
  /** Biji terbanyak yang masuk lumbung dalam satu giliran. */
  readonly bankTerbesar: number
  /** Rantai sambung terpanjang yang pernah terjadi. */
  readonly sambungTerpanjang: number
}

export const KOSONG: Statistik = {
  dimainkan: 0,
  menangA: 0,
  menangB: 0,
  seri: 0,
  bankTerbesar: 0,
  sambungTerpanjang: 0,
}

type Simpanan = Record<string, Statistik>

function baca(): Simpanan {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    return parsed as Simpanan
  } catch {
    // Simpanan rusak atau localStorage ditolak: statistik tidak cukup
    // penting untuk menghalangi permainan.
    return {}
  }
}

function tulis(data: Simpanan): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* kuota penuh atau mode privat — abaikan */
  }
}

export function bacaStatistik(rulesetId: string): Statistik {
  return baca()[rulesetId] ?? KOSONG
}

export interface HasilPermainan {
  readonly rulesetId: string
  readonly hasil: Hasil
  readonly bankTerbesar: number
  readonly sambungTerpanjang: number
}

export function catatHasil(input: HasilPermainan): Statistik {
  const data = baca()
  const kini = data[input.rulesetId] ?? KOSONG

  const next: Statistik = {
    dimainkan: kini.dimainkan + 1,
    menangA: kini.menangA + (input.hasil === 'a' ? 1 : 0),
    menangB: kini.menangB + (input.hasil === 'b' ? 1 : 0),
    seri: kini.seri + (input.hasil === 'seri' ? 1 : 0),
    bankTerbesar: Math.max(kini.bankTerbesar, input.bankTerbesar),
    sambungTerpanjang: Math.max(kini.sambungTerpanjang, input.sambungTerpanjang),
  }

  tulis({ ...data, [input.rulesetId]: next })
  return next
}

/**
 * Both headline numbers come out of the event stream, which already holds
 * everything that happened. Nothing extra is tracked during play.
 */
export function dariRekaman(steps: readonly ReplayStep[]): {
  bankTerbesar: number
  sambungTerpanjang: number
} {
  let bankTerbesar = 0
  let sambungTerpanjang = 0

  for (const step of steps) {
    let bank = 0
    let sambung = 0
    for (const event of step.events) {
      // Satu biji per event bank, plus seluruh isi tembakan.
      if (event.type === 'bank') bank += 1
      else if (event.type === 'menembak') bank += event.total
      else if (event.type === 'relay') sambung += 1
    }
    bankTerbesar = Math.max(bankTerbesar, bank)
    sambungTerpanjang = Math.max(sambungTerpanjang, sambung)
  }

  return { bankTerbesar, sambungTerpanjang }
}

export function hapusStatistik(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* abaikan */
  }
}
