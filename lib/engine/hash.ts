/**
 * Turn hashing. Exchanged with the peer every turn; a mismatch halts the
 * game rather than being auto-reconciled (invariant 13).
 *
 * FNV-1a, 32-bit, integers only. No floats anywhere in the engine, so the
 * hash is byte-identical on any device — which is the entire point of it.
 */
import { BOARD_SIZE, type Board, type Player } from './board'
import type { GameState } from './apply'

const FNV_OFFSET = 0x811c9dc5
const FNV_PRIME = 0x01000193

function fnv1a(bytes: readonly number[] | Uint8Array, seed: number = FNV_OFFSET): number {
  let hash = seed
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i] & 0xff
    // Math.imul keeps the multiply in 32-bit integer space; a plain `*`
    // would drift into float territory and diverge across engines.
    hash = Math.imul(hash, FNV_PRIME)
  }
  return hash >>> 0
}

/** Hash of the board alone. Positions in index order, never a collection. */
export function hashBoard(board: Board): number {
  const bytes = new Uint8Array(BOARD_SIZE)
  for (let i = 0; i < BOARD_SIZE; i++) bytes[i] = board[i] & 0xff
  return fnv1a(bytes)
}

/**
 * Hash of everything both peers must agree on: the board, whose turn it
 * is, whether the game is over, and which ruleset produced it.
 */
export function hashState(state: GameState, rulesetId: string): number {
  const head: number[] = []
  for (let i = 0; i < rulesetId.length; i++) head.push(rulesetId.charCodeAt(i) & 0xff)
  head.push(0) // pemisah, supaya id dan papan tidak bisa saling menyamar
  for (let i = 0; i < BOARD_SIZE; i++) head.push(state.board[i] & 0xff)
  head.push(state.toMove)
  head.push(state.status === 'selesai' ? 1 : 0)
  return fnv1a(head)
}

/** Eight lowercase hex digits — what actually crosses the wire. */
export function formatHash(hash: number): string {
  return hash.toString(16).padStart(8, '0')
}

export function hashOf(state: GameState, rulesetId: string): string {
  return formatHash(hashState(state, rulesetId))
}

export type { Player }
