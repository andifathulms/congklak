/**
 * Replay one move list under two rulesets and find where they part.
 *
 * This is the product, not a feature (PRD §3, §8.3). Two packs that claim
 * to differ have to be able to show it on a real game, and a divergence
 * nobody can point at on a board is just prose.
 *
 * Pure — no React, no DOM. Lives in the engine because it is replay, and
 * replay is the engine's own property.
 */
import { applyMove, createGame, currentLegalMoves, type GameState } from './apply'
import { PLAYER_A, type Player } from './board'
import { hashState } from './hash'
import type { GameEvent } from './events'
import type { Ruleset } from '../rulesets/schema'

export interface CompareStep {
  readonly move: number
  readonly kiri: GameState | null
  readonly kanan: GameState | null
  readonly eventsKiri: readonly GameEvent[]
  readonly eventsKanan: readonly GameEvent[]
  /** Papan kedua sisi masih identik sesudah giliran ini. */
  readonly sama: boolean
}

export type AlasanSimpang =
  | 'papan-berbeda'
  | 'satu-sudah-selesai'
  | 'langkah-tak-sah-di-satu-sisi'

export interface CompareResult {
  readonly kiriId: string
  readonly kananId: string
  readonly steps: readonly CompareStep[]
  /** Indeks giliran tempat keduanya pertama berbeda; -1 kalau tidak pernah. */
  readonly simpangDi: number
  readonly alasan: AlasanSimpang | null
  readonly finalKiri: GameState
  readonly finalKanan: GameState
}

/**
 * Runs `moves` under both rulesets, stopping at the first turn where they
 * disagree — on the board, on whether the game is over, or on whether the
 * move is even legal.
 *
 * The move list is generated against one ruleset, so under the other a
 * move can become illegal (the game may already have ended). That is a
 * divergence too, and a more interesting one than a differing count.
 */
export function compareRulesets(
  moves: readonly number[],
  kiri: Ruleset,
  kanan: Ruleset,
  firstPlayer: Player = PLAYER_A,
): CompareResult {
  const steps: CompareStep[] = []
  let a: GameState = createGame(firstPlayer)
  let b: GameState = createGame(firstPlayer)
  let simpangDi = -1
  let alasan: AlasanSimpang | null = null

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]

    const bisaA = a.status === 'berjalan' && currentLegalMoves(a).includes(move)
    const bisaB = b.status === 'berjalan' && currentLegalMoves(b).includes(move)

    if (!bisaA || !bisaB) {
      if (bisaA !== bisaB) {
        simpangDi = i
        alasan =
          a.status !== b.status ? 'satu-sudah-selesai' : 'langkah-tak-sah-di-satu-sisi'
        steps.push({
          move,
          kiri: bisaA ? a : null,
          kanan: bisaB ? b : null,
          eventsKiri: [],
          eventsKanan: [],
          sama: false,
        })
      }
      break
    }

    const hasilA = applyMove(a, move, kiri)
    const hasilB = applyMove(b, move, kanan)
    a = hasilA.state
    b = hasilB.state

    // Hash mengikat papan, giliran, dan status sekaligus. Id ruleset
    // sengaja disamakan di sini — yang dibandingkan keadaannya, bukan
    // pack-nya, dan hash yang mengikat id akan selalu berbeda.
    const sama = hashState(a, '') === hashState(b, '')

    steps.push({
      move,
      kiri: a,
      kanan: b,
      eventsKiri: hasilA.events,
      eventsKanan: hasilB.events,
      sama,
    })

    if (!sama && simpangDi === -1) {
      simpangDi = i
      alasan = a.status !== b.status ? 'satu-sudah-selesai' : 'papan-berbeda'
      break
    }
  }

  return { kiriId: kiri.id, kananId: kanan.id, steps, simpangDi, alasan, finalKiri: a, finalKanan: b }
}

/**
 * Plays a random legal game under `ruleset` and returns its move list.
 * Seeded, so a comparison is reproducible and shareable.
 */
export function contohLangkah(
  ruleset: Ruleset,
  nextIndex: (bound: number) => number,
  firstPlayer: Player = PLAYER_A,
): number[] {
  const moves: number[] = []
  let state = createGame(firstPlayer)
  while (state.status === 'berjalan') {
    const legal = currentLegalMoves(state)
    if (legal.length === 0) break
    const move = legal[nextIndex(legal.length)]
    moves.push(move)
    state = applyMove(state, move, ruleset).state
  }
  return moves
}
