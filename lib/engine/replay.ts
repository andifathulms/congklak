/**
 * A game is its move list plus its ruleset id (invariant 11).
 *
 * State is always reconstructible by replay. Undo, the replay viewer,
 * shareable games, and P2P desync recovery are all this one property.
 * Derived state is never the source of truth.
 */
import { PLAYER_A, type Player } from './board'
import { applyMove, createGame, type GameState } from './apply'
import type { GameEvent } from './events'
import { hashOf } from './hash'
import type { Ruleset } from '../rulesets/schema'

export interface GameRecord {
  readonly rulesetId: string
  /** Lubang yang ditabur, urut. */
  readonly moves: readonly number[]
  readonly firstPlayer: Player
}

export interface ReplayStep {
  readonly move: number
  readonly state: GameState
  readonly events: readonly GameEvent[]
  readonly hash: string
}

export interface ReplayResult {
  readonly initial: GameState
  readonly steps: readonly ReplayStep[]
  readonly final: GameState
  /** Hash per turn, dengan hash keadaan awal di indeks 0. */
  readonly hashes: readonly string[]
}

export class ReplayError extends Error {
  constructor(readonly index: number, readonly move: number, cause: string) {
    super(`Putar ulang gagal di langkah ${index} (lubang ${move}): ${cause}`)
    this.name = 'ReplayError'
  }
}

export function replay(record: GameRecord, ruleset: Ruleset): ReplayResult {
  if (record.rulesetId !== ruleset.id) {
    throw new Error(
      `Ruleset tidak cocok: rekaman "${record.rulesetId}", diberi "${ruleset.id}"`,
    )
  }

  const initial = createGame(record.firstPlayer)
  const steps: ReplayStep[] = []
  const hashes: string[] = [hashOf(initial, ruleset.id)]

  let state = initial
  for (let i = 0; i < record.moves.length; i++) {
    const move = record.moves[i]
    try {
      const result = applyMove(state, move, ruleset)
      state = result.state
      const hash = hashOf(state, ruleset.id)
      hashes.push(hash)
      steps.push({ move, state, events: result.events, hash })
    } catch (error) {
      throw new ReplayError(i, move, error instanceof Error ? error.message : String(error))
    }
  }

  return { initial, steps, final: state, hashes }
}

export function emptyRecord(rulesetId: string, firstPlayer: Player = PLAYER_A): GameRecord {
  return { rulesetId, moves: [], firstPlayer }
}

export function withMove(record: GameRecord, move: number): GameRecord {
  return { ...record, moves: [...record.moves, move] }
}

/** Undo is a shorter move list — nothing is unwound. */
export function withoutLastMove(record: GameRecord): GameRecord {
  return { ...record, moves: record.moves.slice(0, -1) }
}

/**
 * Shareable form: ruleset id, first player, then the moves as one
 * character each. Holes are 0–14, so a single base-16 digit carries one.
 */
export function encodeRecord(record: GameRecord): string {
  const moves = record.moves.map((m) => m.toString(16)).join('')
  return `${record.rulesetId}.${record.firstPlayer}.${moves}`
}

export function decodeRecord(code: string): GameRecord {
  const parts = code.split('.')
  if (parts.length !== 3) throw new Error(`Kode permainan tidak valid: ${code}`)
  const [rulesetId, first, moves] = parts
  if (first !== '0' && first !== '1') throw new Error(`Pemain pertama tidak valid: ${first}`)
  const parsed: number[] = []
  for (const ch of moves) {
    const value = Number.parseInt(ch, 16)
    if (Number.isNaN(value) || value > 14) throw new Error(`Langkah tidak valid: ${ch}`)
    parsed.push(value)
  }
  return { rulesetId, firstPlayer: first === '0' ? 0 : 1, moves: parsed }
}
