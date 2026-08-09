/**
 * What a puzzle asks for, and whether a turn delivered it.
 *
 * Every figure here is counted off the event stream the sow already emits —
 * seeds banked, seeds captured, relays chained. Nothing is scored, rated or
 * estimated: a puzzle is solved when the rules say it is, and the number on
 * screen is the same number the engine produced.
 *
 * Pure, like everything it reads.
 */
import type { GameEvent } from '../engine/events'

export type Sasaran =
  /** Tabung sekian biji ke lumbung dalam satu giliran. */
  | { readonly jenis: 'tabung'; readonly minimal: number }
  /** Menembak, dan bawa pulang sekian biji sekaligus. */
  | { readonly jenis: 'menembak'; readonly minimal: number }
  /** Rantai sambung sepanjang sekian. */
  | { readonly jenis: 'sambung'; readonly minimal: number }
  /** Berhenti di lumbung sendiri, jadi jalan lagi. */
  | { readonly jenis: 'giliran-lagi' }

export interface HasilGiliran {
  /** Biji yang masuk lumbung giliran ini, dari tabur maupun tembakan. */
  readonly tabung: number
  /** Biji terbanyak yang dibawa satu tembakan. */
  readonly tembak: number
  /** Panjang rantai sambung. */
  readonly sambung: number
  readonly giliranLagi: boolean
}

/**
 * Counted from events rather than from the board, because the board only
 * shows the total: a turn that banks four and captures nine looks the same
 * afterwards as one that banked thirteen, and a puzzle asking for a capture
 * has to be able to tell those apart.
 */
export function nilaiGiliran(events: readonly GameEvent[]): HasilGiliran {
  let tabung = 0
  let tembak = 0
  let sambung = 0
  let giliranLagi = false

  for (const event of events) {
    switch (event.type) {
      case 'bank':
        tabung += 1
        break
      case 'menembak':
        tabung += event.total
        if (event.total > tembak) tembak = event.total
        break
      case 'relay':
        sambung += 1
        break
      case 'extraTurn':
        giliranLagi = true
        break
      default:
        break
    }
  }

  return { tabung, tembak, sambung, giliranLagi }
}

export function tercapai(sasaran: Sasaran, hasil: HasilGiliran): boolean {
  switch (sasaran.jenis) {
    case 'tabung':
      return hasil.tabung >= sasaran.minimal
    case 'menembak':
      return hasil.tembak >= sasaran.minimal
    case 'sambung':
      return hasil.sambung >= sasaran.minimal
    case 'giliran-lagi':
      return hasil.giliranLagi
    default: {
      const habis: never = sasaran
      return habis
    }
  }
}

/** Angka yang dicapai untuk sasaran ini — untuk dibandingkan dengan targetnya. */
export function capaian(sasaran: Sasaran, hasil: HasilGiliran): number {
  switch (sasaran.jenis) {
    case 'tabung':
      return hasil.tabung
    case 'menembak':
      return hasil.tembak
    case 'sambung':
      return hasil.sambung
    case 'giliran-lagi':
      return hasil.giliranLagi ? 1 : 0
    default: {
      const habis: never = sasaran
      return habis
    }
  }
}
