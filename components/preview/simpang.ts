/**
 * PratinjauSimpang — where the other implemented packs would take this
 * same hypothetical move, from the same board (DESIGN.md §4).
 *
 * Same principle as ringkas.ts: the real engine, on a throwaway copy, once
 * per pack. Nothing here computes an outcome the engine didn't already
 * decide (invariant 17) — this only compares what ringkasPratinjau already
 * returns for each pack against the active one, and states the first thing
 * that differs.
 *
 * Only implemented packs have a computed outcome to show (DESIGN.md §4.5).
 * A divergence that is recorded but not implemented in the schema has no
 * board here to disagree on, and this never infers one.
 */
import type { GameState } from '@/lib/engine/apply'
import { RULESETS, type Ruleset } from '@/lib/rulesets'
import { ringkasPratinjau, type Pratinjau } from './ringkas'

export interface SimpangPratinjau {
  readonly ruleset: Ruleset
  /** null kalau langkah ini sendiri sudah tidak sah di bacaan pack ini. */
  readonly pratinjau: Pratinjau | null
  /** Satu baris yang menyebut apa yang berbeda — bukan skor alternatif. */
  readonly teks: string
}

export interface PratinjauSimpang {
  readonly aktif: Pratinjau | null
  /**
   * Hanya pack yang benar-benar berbeda. Diam berarti sepakat (§4.3): pack
   * yang mendarat di lubang yang sama, dengan hasil yang sama, tidak masuk
   * daftar ini sama sekali.
   */
  readonly berbeda: readonly SimpangPratinjau[]
}

/** Berapa yang ditunjuk langsung; sisanya jadi hitungan plus tautan ke /banding. */
export const BATAS_TAMPIL_SIMPANG = 2

function berbeda(aktif: Pratinjau | null, lain: Pratinjau | null): boolean {
  if (aktif === null || lain === null) return aktif !== lain
  return (
    aktif.berhentiDi !== lain.berhentiDi ||
    aktif.menembak !== lain.menembak ||
    aktif.seberang !== lain.seberang ||
    aktif.sambung !== lain.sambung ||
    aktif.giliranLagi !== lain.giliranLagi ||
    aktif.keLumbung !== lain.keLumbung ||
    aktif.mengakhiriPermainan !== lain.mengakhiriPermainan
  )
}

/**
 * Satu klausa, yang paling terlihat dulu — sambungan yang beda panjang,
 * lalu tembakan yang menyala atau padam, lalu giliran tambahan, lalu
 * permainan yang berakhir atau tidak, baru posisi pendaratan dan jumlah
 * ke lumbung sebagai jaring pengaman kalau semuanya di atas kebetulan
 * sama tapi sesuatu yang lain tetap beda.
 */
function teksSimpang(aktif: Pratinjau | null, lain: Pratinjau | null): string {
  if (aktif === null || lain === null) {
    return lain === null
      ? 'langkah ini sudah tidak sah di bacaan ini'
      : 'langkah ini belum sah di bacaan yang aktif'
  }
  if (aktif.sambung !== lain.sambung) {
    return lain.sambung > aktif.sambung
      ? `sambung lanjut ${lain.sambung - aktif.sambung} lubang lagi`
      : `sambung berhenti ${aktif.sambung - lain.sambung} lubang lebih awal`
  }
  if ((aktif.menembak > 0) !== (lain.menembak > 0)) {
    return lain.menembak > 0
      ? `menembak lubang ${lain.seberang} — +${lain.menembak} ke lumbung`
      : 'tidak menembak di sini'
  }
  if (aktif.giliranLagi !== lain.giliranLagi) {
    return lain.giliranLagi ? 'dapat giliran lagi' : 'gilirannya berakhir di sini'
  }
  if (aktif.mengakhiriPermainan !== lain.mengakhiriPermainan) {
    return lain.mengakhiriPermainan ? 'permainan berakhir di sini' : 'permainan berlanjut'
  }
  if (aktif.berhentiDi !== lain.berhentiDi) {
    return `berhenti di lubang ${lain.berhentiDi}`
  }
  return `${lain.keLumbung} biji ke lumbung, bukan ${aktif.keLumbung}`
}

export function pratinjauSimpang(
  state: GameState,
  hole: number,
  aktif: Ruleset,
  paket: readonly Ruleset[] = RULESETS,
): PratinjauSimpang {
  const punyaAktif = ringkasPratinjau(state, hole, aktif)
  const hasil: SimpangPratinjau[] = []

  for (const ruleset of paket) {
    if (ruleset.id === aktif.id) continue
    const punya = ringkasPratinjau(state, hole, ruleset)
    if (!berbeda(punyaAktif, punya)) continue
    hasil.push({ ruleset, pratinjau: punya, teks: teksSimpang(punyaAktif, punya) })
  }

  return { aktif: punyaAktif, berbeda: hasil }
}
