/**
 * Move preview (PRD §8.2). Reading the chain ahead is the entire skill of
 * congklak, and this makes it visible.
 *
 * It is the real applyMove on a throwaway copy, not an approximation — a
 * preview that disagreed with what then happened would be worse than none.
 * applyMove is pure and cheap, so there is no reason to approximate.
 */
import { applyMove, type GameState } from '@/lib/engine/apply'
import { lumbungOf } from '@/lib/engine/board'
import type { Ruleset } from '@/lib/rulesets'

export interface Pratinjau {
  readonly hole: number
  /** Posisi tempat biji terakhir berhenti. */
  readonly berhentiDi: number
  /** Biji yang masuk lumbung sendiri, termasuk hasil tembakan. */
  readonly keLumbung: number
  /** Biji yang didapat dari menembak, 0 kalau tidak menembak. */
  readonly menembak: number
  /** Lubang seberang yang ditembak, null kalau tidak menembak. */
  readonly seberang: number | null
  /**
   * Biji yang jatuh ke lumbung sambil menabur, terpisah dari hasil
   * tembakan. Tanpa pemisahan ini "+10 ke lumbung" adalah satu angka tanpa
   * asal-usul; dengan pemisahan, 1 + 9 bisa ditelusuri.
   */
  readonly keLumbungLangsung: number
  readonly giliranLagi: boolean
  /** Panjang rantai sambung. */
  readonly sambung: number
  readonly mengakhiriPermainan: boolean
}

export function ringkasPratinjau(
  state: GameState,
  hole: number,
  ruleset: Ruleset,
): Pratinjau | null {
  let result
  try {
    result = applyMove(state, hole, ruleset)
  } catch {
    return null
  }

  const lumbung = lumbungOf(state.toMove)
  const sebelum = state.board[lumbung]

  let berhentiDi = hole
  let menembak = 0
  let seberang: number | null = null
  let sambung = 0
  let giliranLagi = false

  for (const event of result.events) {
    switch (event.type) {
      case 'sow':
      case 'bank':
        berhentiDi = event.index
        break
      case 'relay':
        sambung += 1
        break
      case 'menembak':
        menembak = event.total
        seberang = event.seberang
        berhentiDi = event.lubang
        break
      case 'extraTurn':
        giliranLagi = true
        break
      default:
        break
    }
  }

  return {
    hole,
    berhentiDi,
    // Diambil dari papan hasil, bukan dijumlah sendiri dari event — biar
    // pratinjau dan papan sesudahnya tidak mungkin berbeda.
    keLumbung: result.state.board[lumbung] - sebelum,
    menembak,
    seberang,
    // Sisa dari total dikurangi tembakan: dua-duanya berasal dari papan
    // hasil, jadi bagiannya tidak mungkin tidak berjumlah totalnya.
    keLumbungLangsung: result.state.board[lumbung] - sebelum - menembak,
    giliranLagi,
    sambung,
    mengakhiriPermainan: result.state.status === 'selesai',
  }
}

/**
 * The preview, showing its working.
 *
 * It used to read "+10 ke lumbung · 1× sambung · menembak 9": three
 * numbers, no derivation, in two words a newcomer has only ever met on a
 * different page. Where does the chain end? Which hole gets captured? Why
 * ten — is that one banked plus nine taken, or something else?
 *
 * Now it says where the seeds stop, splits the total into the part that
 * fell in while sowing and the part that was captured, and explains its own
 * vocabulary in the clause that uses it. Glossing where the word is used,
 * rather than in a glossary on another screen, is the whole point — and it
 * stays as visible text rather than a tooltip nobody on a touchscreen can
 * open.
 */
export function pratinjauTeks(p: Pratinjau): string {
  const bagian: string[] = []

  bagian.push(`Berhenti di lubang ${p.berhentiDi}`)

  if (p.menembak > 0 && p.seberang !== null) {
    bagian.push(
      `${p.keLumbungLangsung} biji jatuh ke lumbung sambil lewat, ` +
        `lalu menembak — biji terakhir mendarat di lubang kosong sisimu, ` +
        `jadi isi lubang seberangnya (${p.seberang}) ikut terbawa: ` +
        `+${p.menembak}. Semuanya ${p.keLumbung} biji ke lumbung`,
    )
  } else {
    bagian.push(`${p.keLumbung} biji ke lumbung`)
  }

  if (p.sambung > 0) {
    bagian.push(
      `${p.sambung}× sambung — biji terakhir mendarat di lubang yang sudah berisi, ` +
        `jadi lubang itu diangkat dan ditabur lagi`,
    )
  }
  if (p.giliranLagi) bagian.push('berhenti tepat di lumbungmu, jadi kamu jalan lagi')
  if (p.mengakhiriPermainan) bagian.push('permainan selesai')

  return bagian.join(' · ')
}
