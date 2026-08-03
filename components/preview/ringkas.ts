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
    giliranLagi,
    sambung,
    mengakhiriPermainan: result.state.status === 'selesai',
  }
}

export function pratinjauTeks(p: Pratinjau): string {
  const bagian: string[] = []
  bagian.push(`+${p.keLumbung} ke lumbung`)
  if (p.sambung > 0) bagian.push(`${p.sambung}× sambung`)
  if (p.menembak > 0) bagian.push(`menembak ${p.menembak}`)
  if (p.giliranLagi) bagian.push('jalan lagi')
  if (p.mengakhiriPermainan) bagian.push('permainan selesai')
  return bagian.join(' · ')
}
