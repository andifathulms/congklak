/**
 * applyMove — the pure function everything rests on.
 *
 * No clock, no Date, no Math.random, no floating point, no module-level
 * mutable state, no iteration over unordered collections. Same inputs,
 * byte-identical output, on any device. Replay, undo, AI search and P2P
 * sync all rest on that.
 *
 * (Congklak is a perfect-information game with no chance element, so no
 * PRNG is carried in state. If a variant ever needs one it goes in the
 * state, seeded — never Math.random.)
 */
import {
  TOTAL_SEEDS,
  cloneBoard,
  createBoard,
  emptyHolesOnSide,
  isLegalMove,
  legalMoves,
  lumbungOf,
  opponentOf,
  seedsOnSide,
  firstHoleOf,
  lastHoleOf,
  PLAYER_A,
  PLAYER_B,
  type Board,
  type Player,
} from './board'
import { assertConservation } from './conserve'
import type { GameEvent, Hasil } from './events'
import { sow } from './sow'
import type { Ruleset } from '../rulesets/schema'

export type Status = 'berjalan' | 'selesai'

export interface GameState {
  readonly board: Board
  readonly toMove: Player
  readonly status: Status
  /** Giliran yang sudah dijalankan, termasuk giliran-lagi. */
  readonly moveCount: number
  /**
   * Biji yang masih dihitung. Selalu 98, kecuali ruleset membuang biji
   * sisa pada sapu akhir — lalu turun sekali, di event sapu itu.
   */
  readonly seedsInPlay: number
  readonly hasil: Hasil | null
}

export interface MoveResult {
  readonly state: GameState
  readonly events: readonly GameEvent[]
}

export class IllegalMoveError extends Error {
  constructor(readonly hole: number, readonly player: Player, reason: string) {
    super(`Langkah tidak sah: lubang ${hole} untuk pemain ${player} — ${reason}`)
    this.name = 'IllegalMoveError'
  }
}

export function createGame(firstPlayer: Player = PLAYER_A): GameState {
  return {
    board: createBoard(),
    toMove: firstPlayer,
    status: 'berjalan',
    moveCount: 0,
    seedsInPlay: TOTAL_SEEDS,
    hasil: null,
  }
}

export function scoreOf(board: Board, player: Player): number {
  return board[lumbungOf(player)]
}

function decideHasil(board: Board): Hasil {
  const a = scoreOf(board, PLAYER_A)
  const b = scoreOf(board, PLAYER_B)
  // 98 genap — 49–49 terjangkau dan harus ditangani (invariant 14).
  if (a > b) return 'a'
  if (b > a) return 'b'
  return 'seri'
}

/** Ruleset-dependent. Both readings are implemented; one is active per pack. */
function isTerminal(board: Board, toMove: Player, ruleset: Ruleset): boolean {
  switch (ruleset.options.terminal) {
    case 'tak-ada-langkah':
      return legalMoves(board, toMove).length === 0
    case 'tiga-lubang-kosong':
      return (
        emptyHolesOnSide(board, PLAYER_A) >= 3 || emptyHolesOnSide(board, PLAYER_B) >= 3
      )
    default: {
      const never: never = ruleset.options.terminal
      return never
    }
  }
}

/**
 * Sapu akhir. Mutates `board`, returns the events and the number of seeds
 * removed from play (non-zero only when the ruleset discards them).
 */
function finalSweep(
  board: Board,
  lastMover: Player,
  ruleset: Ruleset,
): { events: GameEvent[]; discarded: number } {
  const events: GameEvent[] = []
  let discarded = 0

  for (const player of [PLAYER_A, PLAYER_B] as const) {
    for (let i = firstHoleOf(player); i <= lastHoleOf(player); i++) {
      const biji = board[i]
      if (biji === 0) continue

      let to: number | null
      switch (ruleset.options.finalSweep) {
        case 'pemilik-sisi':
          to = lumbungOf(player)
          break
        case 'pemain-terakhir':
          to = lumbungOf(lastMover)
          break
        case 'dibuang':
          to = null
          break
        default: {
          const never: never = ruleset.options.finalSweep
          return never
        }
      }

      board[i] = 0
      if (to === null) discarded += biji
      else board[to] += biji
      events.push({ type: 'sweep', from: i, to, biji })
    }
  }

  return { events, discarded }
}

/**
 * The one entry point. Returns a new state; never mutates the one given.
 */
export function applyMove(state: GameState, hole: number, ruleset: Ruleset): MoveResult {
  if (state.status === 'selesai') {
    throw new IllegalMoveError(hole, state.toMove, 'permainan sudah selesai')
  }
  if (!isLegalMove(state.board, state.toMove, hole)) {
    const reason = seedsOnSide(state.board, state.toMove) === 0
      ? 'tidak ada biji di sisi pemain'
      : 'bukan lubang sendiri, atau lubang kosong'
    throw new IllegalMoveError(hole, state.toMove, reason)
  }

  const board = cloneBoard(state.board)
  const player = state.toMove

  const outcome = sow(board, hole, player, ruleset, state.seedsInPlay)
  const events: GameEvent[] = [...outcome.events]

  let next: Player = outcome.extraTurn ? player : opponentOf(player)
  let status: Status = 'berjalan'
  let hasil: Hasil | null = null
  let seedsInPlay = state.seedsInPlay

  if (isTerminal(board, next, ruleset)) {
    const swept = finalSweep(board, player, ruleset)
    events.push(...swept.events)
    seedsInPlay -= swept.discarded
    status = 'selesai'
    hasil = decideHasil(board)
    events.push({
      type: 'end',
      skorA: scoreOf(board, PLAYER_A),
      skorB: scoreOf(board, PLAYER_B),
      hasil,
    })
  } else if (!outcome.extraTurn) {
    events.push({ type: 'turnEnd', player, next })
  }

  // Whatever happened above, every seed is still accounted for.
  assertConservation(board, 'sesudah applyMove', seedsInPlay)

  return {
    state: {
      board,
      toMove: next,
      status,
      moveCount: state.moveCount + 1,
      seedsInPlay,
      hasil,
    },
    events,
  }
}

/**
 * A player who cannot move when the ruleset does not end the game there
 * would stall the turn order. No shipped ruleset reaches this — the
 * tak-ada-langkah terminal fires first — but the AI and the UI need a
 * total function, so it is stated rather than assumed.
 */
export function currentLegalMoves(state: GameState): number[] {
  if (state.status === 'selesai') return []
  return legalMoves(state.board, state.toMove)
}

export { PLAYER_A, PLAYER_B }
export type { Player, Board }
