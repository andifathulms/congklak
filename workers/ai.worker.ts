/// <reference lib="webworker" />

/**
 * The AI runs in a worker, never on the main thread (invariant 16).
 *
 * This is also where the clock lives. lib/ai stays pure and takes an
 * injected stop check; the wall-clock deadline is here, at the edge.
 */
import { BOARD_SIZE, type Player } from '@/lib/engine/board'
import type { GameState, Status } from '@/lib/engine/apply'
import type { Hasil } from '@/lib/engine/events'
import { getRuleset } from '@/lib/rulesets'
import { chooseMove, type Kesulitan } from '@/lib/ai/search'

export interface AiRequest {
  readonly id: number
  /** Papan sebagai larik biasa — Int8Array tidak melintasi postMessage utuh. */
  readonly cells: readonly number[]
  readonly toMove: Player
  readonly status: Status
  readonly moveCount: number
  readonly seedsInPlay: number
  readonly hasil: Hasil | null
  readonly rulesetId: string
  readonly kesulitan: Kesulitan
  readonly seed: number
  readonly budgetMs: number
}

export interface AiResponse {
  readonly id: number
  readonly move: number
  readonly depth: number
  readonly nodes: number
  readonly stopped: boolean
  readonly elapsedMs: number
}

export interface AiError {
  readonly id: number
  readonly error: string
}

function rebuild(request: AiRequest): GameState {
  const board = new Int8Array(BOARD_SIZE)
  for (let i = 0; i < BOARD_SIZE; i++) board[i] = request.cells[i]
  return {
    board,
    toMove: request.toMove,
    status: request.status,
    moveCount: request.moveCount,
    seedsInPlay: request.seedsInPlay,
    hasil: request.hasil,
  }
}

self.onmessage = (event: MessageEvent<AiRequest>) => {
  const request = event.data
  const started = Date.now()

  try {
    const ruleset = getRuleset(request.rulesetId)
    const deadline = started + request.budgetMs

    const result = chooseMove(rebuild(request), {
      ruleset,
      kesulitan: request.kesulitan,
      seed: request.seed,
      shouldStop: () => Date.now() > deadline,
    })

    const response: AiResponse = {
      id: request.id,
      move: result.move,
      depth: result.depth,
      nodes: result.nodes,
      stopped: result.stopped,
      elapsedMs: Date.now() - started,
    }
    self.postMessage(response)
  } catch (error) {
    const failure: AiError = {
      id: request.id,
      error: error instanceof Error ? error.message : String(error),
    }
    self.postMessage(failure)
  }
}
