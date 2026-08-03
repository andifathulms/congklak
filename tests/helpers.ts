import { BOARD_SIZE, type Board, type Player } from '@/lib/engine/board'
import type { GameState } from '@/lib/engine/apply'
import { countSeeds } from '@/lib/engine/conserve'
import { getRuleset, type Ruleset } from '@/lib/rulesets'
import type { GameEvent } from '@/lib/engine/events'

/**
 * Hand-authored fixtures state a board, a move, and a result. Positions are
 * given as ordered [index, biji] pairs so a fixture reads as a diagram and
 * nothing depends on object key order.
 */
export type Cells = ReadonlyArray<readonly [number, number]>

export function boardFrom(cells: Cells): Board {
  const board = new Int8Array(BOARD_SIZE)
  for (const [index, biji] of cells) {
    if (index < 0 || index >= BOARD_SIZE) throw new Error(`indeks di luar papan: ${index}`)
    board[index] = biji
  }
  return board
}

/**
 * Fixture boards hold fewer than 98 seeds on purpose — a diagram with three
 * seeds is readable and a diagram with ninety-eight is not. seedsInPlay is
 * set to the fixture's own total, so conservation is still asserted after
 * every event, just against the fixture's number.
 */
export function stateFrom(cells: Cells, toMove: Player): GameState {
  const board = boardFrom(cells)
  return {
    board,
    toMove,
    status: 'berjalan',
    moveCount: 0,
    seedsInPlay: countSeeds(board),
    hasil: null,
  }
}

/** Board as a plain array, for readable equality assertions. */
export function cellsOf(board: Board): number[] {
  return Array.from(board)
}

export function eventTypes(events: readonly GameEvent[]): string[] {
  return events.map((e) => e.type)
}

export function umum(): Ruleset {
  return getRuleset('umum')
}

/**
 * A pack that differs from the given one in exactly the stated options.
 * Test-local: used to prove an option actually drives behaviour, without
 * shipping an uncited pack.
 */
export function withOptions(base: Ruleset, options: Partial<Ruleset['options']>): Ruleset {
  return { ...base, options: { ...base.options, ...options } }
}
