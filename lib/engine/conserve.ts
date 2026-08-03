/**
 * Seed conservation is asserted, not assumed.
 *
 * There are exactly 98 seeds. After every single event of every sow, all
 * 16 positions must sum to 98. A relay loop that drops or duplicates a
 * seed is the classic mancala bug and it is completely silent — the game
 * plays on, wrongly.
 *
 * Never remove these calls to speed something up.
 */
import { BOARD_SIZE, TOTAL_SEEDS, type Board } from './board'

/** Enabled outside production builds, and always on under test. */
export const CONSERVATION_CHECKS = process.env.NODE_ENV !== 'production'

export class ConservationError extends Error {
  constructor(
    readonly counted: number,
    readonly expected: number,
    readonly board: Board,
    context: string,
  ) {
    super(
      `Biji hilang atau berlipat: terhitung ${counted}, seharusnya ${expected}` +
        ` (${context}) — papan [${Array.from(board).join(',')}]`,
    )
    this.name = 'ConservationError'
  }
}

export function countSeeds(board: Board): number {
  let total = 0
  for (let i = 0; i < BOARD_SIZE; i++) total += board[i]
  return total
}

/** Throws unless the board holds exactly `expected` seeds. Always runs. */
export function assertConservation(
  board: Board,
  context: string,
  expected: number = TOTAL_SEEDS,
): void {
  const counted = countSeeds(board)
  if (counted !== expected) throw new ConservationError(counted, expected, board, context)
}

/** The same check, skipped in production builds. Used inside the sow loop. */
export function checkConservation(
  board: Board,
  context: string,
  expected: number = TOTAL_SEEDS,
): void {
  if (CONSERVATION_CHECKS) assertConservation(board, context, expected)
}
