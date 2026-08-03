/**
 * Events, not diffs (PRD §7).
 *
 * A sow emits an ordered stream. The renderer replays it and decides
 * nothing — it never recomputes an outcome. Every event carries enough
 * to draw the frame it describes without consulting the board.
 */
import type { Player } from './board'

/** Semua biji diambil dari sebuah lubang, di awal giliran. */
export interface ScoopEvent {
  readonly type: 'scoop'
  readonly index: number
  /** Biji yang terangkat ke tangan. */
  readonly biji: number
  readonly player: Player
}

/** Satu biji jatuh ke lubang kecil. */
export interface SowEvent {
  readonly type: 'sow'
  readonly index: number
  /** Isi lubang sesudah biji ini jatuh. */
  readonly biji: number
  /** Sisa biji di tangan sesudah biji ini jatuh. */
  readonly sisa: number
}

/** Satu biji jatuh ke lumbung sendiri. Terasa lebih berat saat digambar. */
export interface BankEvent {
  readonly type: 'bank'
  readonly index: number
  readonly biji: number
  readonly sisa: number
  readonly player: Player
}

/** Biji terakhir mendarat di lubang berisi, jadi lubang itu diangkat lagi. */
export interface RelayEvent {
  readonly type: 'relay'
  readonly index: number
  readonly biji: number
  /** Sambungan ke berapa dalam giliran ini, mulai dari 1. */
  readonly rantai: number
}

/**
 * Menembak. Biji terakhir mendarat di lubang kosong sisi sendiri; biji itu
 * beserta isi lubang seberang masuk ke lumbung.
 */
export interface MenembakEvent {
  readonly type: 'menembak'
  readonly lubang: number
  readonly seberang: number
  /** Dari lubang pendaratan — selalu 1. */
  readonly dariLubang: number
  /** Dari lubang seberang; boleh 0 jika ruleset mengizinkan. */
  readonly dariSeberang: number
  readonly total: number
  readonly lumbung: number
  readonly player: Player
}

/** Biji terakhir mendarat di lumbung sendiri. */
export interface ExtraTurnEvent {
  readonly type: 'extraTurn'
  readonly player: Player
}

export interface TurnEndEvent {
  readonly type: 'turnEnd'
  readonly player: Player
  readonly next: Player
}

/** Sapu akhir: biji yang tersisa di papan saat permainan selesai. */
export interface SweepEvent {
  readonly type: 'sweep'
  readonly from: number
  /** Lumbung tujuan, atau null jika ruleset membuang biji sisa. */
  readonly to: number | null
  readonly biji: number
}

export type Hasil = 'a' | 'b' | 'seri'

export interface EndEvent {
  readonly type: 'end'
  readonly skorA: number
  readonly skorB: number
  /** 98 genap, jadi 49–49 bisa terjadi. Seri adalah hasil yang sah. */
  readonly hasil: Hasil
}

export type SowEventUnion =
  | ScoopEvent
  | SowEvent
  | BankEvent
  | RelayEvent
  | MenembakEvent
  | ExtraTurnEvent
  | TurnEndEvent
  | SweepEvent
  | EndEvent

export type GameEvent = SowEventUnion

/** Human-readable line per event — also the reduced-motion summary (PRD §8.1). */
export function describeEvent(event: GameEvent): string {
  switch (event.type) {
    case 'scoop':
      return `Ambil ${event.biji} biji dari lubang ${event.index}.`
    case 'sow':
      return `Satu biji ke lubang ${event.index} (kini ${event.biji}).`
    case 'bank':
      return `Satu biji ke lumbung (kini ${event.biji}).`
    case 'relay':
      return `Sambung ke-${event.rantai}: angkat ${event.biji} biji dari lubang ${event.index}.`
    case 'menembak':
      return `Menembak lubang ${event.seberang}: ${event.total} biji masuk lumbung.`
    case 'extraTurn':
      return 'Biji terakhir jatuh di lumbung sendiri — jalan lagi.'
    case 'turnEnd':
      return 'Giliran habis.'
    case 'sweep':
      return event.to === null
        ? `${event.biji} biji sisa di lubang ${event.from} dibuang.`
        : `${event.biji} biji sisa dari lubang ${event.from} masuk lumbung.`
    case 'end':
      return event.hasil === 'seri'
        ? `Seri, ${event.skorA}–${event.skorB}.`
        : `Pemain ${event.hasil.toUpperCase()} menang, ${event.skorA}–${event.skorB}.`
    default: {
      const never: never = event
      return never
    }
  }
}
