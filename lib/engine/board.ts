/**
 * Board topology. The single place that knows where anything sits.
 *
 * A flat Int8Array of 16 — never a 2D structure, never objects per hole.
 *   0..6   lubang pemain A
 *   7      lumbung pemain A
 *   8..14  lubang pemain B
 *   15     lumbung pemain B
 *
 * Sowing always proceeds by increasing index, wrapping at 16. Clockwise
 * versus counterclockwise is board orientation and belongs to rendering,
 * not here (PRD §6).
 */

export const HOLES_PER_SIDE = 7
export const SEEDS_PER_HOLE = 7
export const BOARD_SIZE = 16
export const TOTAL_SEEDS = HOLES_PER_SIDE * 2 * SEEDS_PER_HOLE // 98

/** 0 = pemain A, 1 = pemain B. */
export type Player = 0 | 1

export const PLAYER_A: Player = 0
export const PLAYER_B: Player = 1

export const LUMBUNG_A = 7
export const LUMBUNG_B = 15

export type Board = Int8Array

export function createBoard(): Board {
  const board = new Int8Array(BOARD_SIZE)
  for (let i = 0; i < BOARD_SIZE; i++) {
    board[i] = isLumbung(i) ? 0 : SEEDS_PER_HOLE
  }
  return board
}

export function cloneBoard(board: Board): Board {
  return Int8Array.from(board)
}

export function isLumbung(index: number): boolean {
  return index === LUMBUNG_A || index === LUMBUNG_B
}

export function lumbungOf(player: Player): number {
  return player === PLAYER_A ? LUMBUNG_A : LUMBUNG_B
}

export function opponentOf(player: Player): Player {
  return player === PLAYER_A ? PLAYER_B : PLAYER_A
}

/** Index of the first small hole on a player's side. */
export function firstHoleOf(player: Player): number {
  return player === PLAYER_A ? 0 : 8
}

/** Index of the last small hole on a player's side. */
export function lastHoleOf(player: Player): number {
  return player === PLAYER_A ? 6 : 14
}

/** True for a small hole belonging to `player`. Lumbung are not holes. */
export function isOwnHole(index: number, player: Player): boolean {
  return index >= firstHoleOf(player) && index <= lastHoleOf(player)
}

/**
 * The hole facing `index` across the board. Defined once, here — the
 * arithmetic is never inlined anywhere else (invariant 6).
 * Throws for a lumbung, which faces nothing.
 */
export function opposite(index: number): number {
  if (isLumbung(index)) {
    throw new Error(`opposite() dipanggil untuk lumbung (${index}); lumbung tidak punya seberang`)
  }
  return 14 - index
}

/**
 * The next position a seed falls into, for `player`.
 * A player never sows into the opponent's lumbung — universal across every
 * variant, so it lives here rather than in a ruleset option (invariant 5).
 */
export function nextIndex(index: number, player: Player): number {
  const skip = lumbungOf(opponentOf(player))
  const next = (index + 1) % BOARD_SIZE
  return next === skip ? (next + 1) % BOARD_SIZE : next
}

/** Seeds sitting in a player's small holes. Excludes their lumbung. */
export function seedsOnSide(board: Board, player: Player): number {
  let total = 0
  for (let i = firstHoleOf(player); i <= lastHoleOf(player); i++) total += board[i]
  return total
}

/** Empty small holes on a player's side. Drives the tiga-lubang-kosong terminal. */
export function emptyHolesOnSide(board: Board, player: Player): number {
  let count = 0
  for (let i = firstHoleOf(player); i <= lastHoleOf(player); i++) {
    if (board[i] === 0) count++
  }
  return count
}

/**
 * Legal moves, always in ascending index order. Ordered output matters:
 * AI search and replay must agree byte-for-byte across devices.
 */
export function legalMoves(board: Board, player: Player): number[] {
  const moves: number[] = []
  for (let i = firstHoleOf(player); i <= lastHoleOf(player); i++) {
    if (board[i] > 0) moves.push(i)
  }
  return moves
}

export function isLegalMove(board: Board, player: Player, hole: number): boolean {
  return isOwnHole(hole, player) && board[hole] > 0
}
