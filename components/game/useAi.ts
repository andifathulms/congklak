'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { GameState } from '@/lib/engine/apply'
import type { Kesulitan } from '@/lib/ai/search'
import type { AiError, AiRequest, AiResponse } from '@/workers/ai.worker'

/** Anggaran waktu per langkah. AI tidak pernah menahan papan lebih lama. */
export const ANGGARAN_MS = 1200

/**
 * Runs the search in a worker, never on the main thread (invariant 16).
 *
 * The main thread stays free the whole time the AI is thinking, so the sow
 * animation of the player's own previous turn can still be running.
 */
export function useAi(rulesetId: string) {
  const worker = useRef<Worker | null>(null)
  const nextId = useRef(1)

  useEffect(() => {
    return () => {
      worker.current?.terminate()
      worker.current = null
    }
  }, [])

  const ensure = useCallback((): Worker => {
    if (!worker.current) {
      // Penentu jalur harus relatif dan tertulis apa adanya di sini.
      // Dengan alias '@/...' webpack tidak mengenalinya sebagai worker,
      // bundelnya tidak ikut diterbitkan, dan kegagalannya baru terlihat
      // saat dijalankan — bukan saat dibangun.
      worker.current = new Worker(new URL('../../workers/ai.worker.ts', import.meta.url))
    }
    return worker.current
  }, [])

  const pikirkan = useCallback(
    (state: GameState, kesulitan: Kesulitan, seed: number): Promise<AiResponse> => {
      const w = ensure()
      const id = nextId.current++

      const request: AiRequest = {
        id,
        cells: Array.from(state.board),
        toMove: state.toMove,
        status: state.status,
        moveCount: state.moveCount,
        seedsInPlay: state.seedsInPlay,
        hasil: state.hasil,
        rulesetId,
        kesulitan,
        seed,
        budgetMs: ANGGARAN_MS,
      }

      return new Promise<AiResponse>((resolve, reject) => {
        const onMessage = (event: MessageEvent<AiResponse | AiError>) => {
          if (event.data.id !== id) return
          w.removeEventListener('message', onMessage)
          if ('error' in event.data) reject(new Error(event.data.error))
          else resolve(event.data)
        }
        w.addEventListener('message', onMessage)
        w.postMessage(request)
      })
    },
    [ensure, rulesetId],
  )

  return { pikirkan }
}
