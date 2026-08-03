/**
 * Minimax with alpha-beta and iterative deepening. Pure.
 *
 * Two things make congklak search different from a plain alternating game:
 *
 * 1. An extra turn means the same player moves again, so nodes do not
 *    alternate. Node type is read from state.toMove rather than assumed
 *    from depth parity — negamax's sign flip would be wrong here.
 * 2. The time budget cannot come from a clock in here, or this module
 *    stops being pure and reproducible. The caller injects a stop check;
 *    the worker is what owns the clock.
 *
 * The AI sees the same GameState a player sees, and picks from
 * currentLegalMoves. No hidden information, no illegal moves — congklak
 * is perfect information, so any advantage would be fabricated.
 */
import { applyMove, currentLegalMoves, type GameState } from '../engine/apply'
import { type Player } from '../engine/board'
import type { Ruleset } from '../rulesets/schema'
import { createRng } from '../rng'
import { SKOR_MENANG, evaluate, terminalScore } from './evaluate'

export type Kesulitan = 'mudah' | 'sedang' | 'sulit'

export interface Kekuatan {
  readonly depth: number
  /** Rentang gangguan skor di akar. 0 berarti main sebaik-baiknya. */
  readonly noise: number
}

/** Difficulty is search depth plus seeded noise, and nothing else. */
export const KEKUATAN: Record<Kesulitan, Kekuatan> = {
  mudah: { depth: 2, noise: 220 },
  sedang: { depth: 5, noise: 60 },
  sulit: { depth: 9, noise: 0 },
}

export interface SearchOptions {
  readonly ruleset: Ruleset
  readonly kesulitan: Kesulitan
  /** Benih gangguan. Sama benih, sama langkah — selalu. */
  readonly seed: number
  /** Diberi pemanggil; di sinilah jam berada, bukan di dalam sini. */
  readonly shouldStop?: () => boolean
}

export interface SearchResult {
  readonly move: number
  readonly score: number
  /** Kedalaman terdalam yang benar-benar selesai. */
  readonly depth: number
  readonly nodes: number
  /** True kalau pendalaman berhenti karena anggaran waktu. */
  readonly stopped: boolean
}

class Aborted extends Error {}

export function chooseMove(state: GameState, options: SearchOptions): SearchResult {
  const { ruleset, kesulitan, seed, shouldStop } = options
  const { depth: maxDepth, noise } = KEKUATAN[kesulitan]

  const root = state.toMove
  const moves = currentLegalMoves(state)
  if (moves.length === 0) {
    throw new Error('AI diminta bergerak padahal tidak ada langkah sah')
  }

  const rng = createRng(seed)
  // Gangguan dihitung sekali, sebelum pencarian, supaya kedalaman berapa
  // pun yang sempat selesai tetap memakai angka yang sama.
  const gangguan = moves.map(() => (noise === 0 ? 0 : rng.next(noise) - (noise >> 1)))

  let nodes = 0
  let best = { move: moves[0], score: -Infinity, depth: 0 }
  let stopped = false

  const check = (): void => {
    if (shouldStop?.()) throw new Aborted()
  }

  for (let depth = 1; depth <= maxDepth; depth++) {
    let bestThisDepth = { move: moves[0], score: -Infinity }
    let alpha = -Infinity

    try {
      for (let i = 0; i < moves.length; i++) {
        check()
        const move = moves[i]
        const { state: next } = applyMove(state, move, ruleset)
        nodes += 1
        const score = nilai(next, root, depth - 1, alpha, Infinity, ruleset, check, () => {
          nodes += 1
        }) + gangguan[i]

        if (score > bestThisDepth.score) bestThisDepth = { move, score }
        if (score > alpha) alpha = score
      }
      // Hanya kedalaman yang tuntas yang boleh menggantikan jawaban.
      best = { ...bestThisDepth, depth }
    } catch (error) {
      if (!(error instanceof Aborted)) throw error
      stopped = true
      break
    }

    // Kemenangan paksa sudah ketemu; memperdalam tidak menambah apa-apa.
    if (best.score >= SKOR_MENANG) break
  }

  return { move: best.move, score: best.score, depth: best.depth, nodes, stopped }
}

function nilai(
  state: GameState,
  root: Player,
  depth: number,
  alpha: number,
  beta: number,
  ruleset: Ruleset,
  check: () => void,
  count: () => void,
): number {
  if (state.status === 'selesai') return terminalScore(state.board, root)
  if (depth === 0) return evaluate(state.board, root, ruleset)

  check()

  const moves = currentLegalMoves(state)
  if (moves.length === 0) return evaluate(state.board, root, ruleset)

  // Giliran-lagi berarti pemain yang sama jalan lagi, jadi jenis simpul
  // dibaca dari state.toMove, bukan dari kedalaman.
  const maximizing = state.toMove === root

  let a = alpha
  let b = beta
  let best = maximizing ? -Infinity : Infinity

  for (const move of moves) {
    const { state: next } = applyMove(state, move, ruleset)
    count()
    const score = nilai(next, root, depth - 1, a, b, ruleset, check, count)

    if (maximizing) {
      if (score > best) best = score
      if (best > a) a = best
    } else {
      if (score < best) best = score
      if (best < b) b = best
    }
    if (b <= a) break // pangkas
  }

  return best
}
