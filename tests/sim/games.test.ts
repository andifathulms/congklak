import { describe, expect, it } from 'vitest'
import { applyMove, createGame, currentLegalMoves, scoreOf, type GameState } from '@/lib/engine/apply'
import { PLAYER_A, PLAYER_B, TOTAL_SEEDS, seedsOnSide } from '@/lib/engine/board'
import { assertConservation, countSeeds } from '@/lib/engine/conserve'
import type { GameEvent } from '@/lib/engine/events'
import { RULESETS } from '@/lib/rulesets'
import { createRng } from '@/lib/rng'

/** Turns before a game is called stuck. Real games end far sooner. */
const MAX_TURNS = 5000
const GAMES_PER_RULESET = 2000

interface SimResult {
  readonly turns: number
  readonly longestRelay: number
  readonly final: GameState
}

function simulate(seed: number, ruleset: (typeof RULESETS)[number]): SimResult {
  const rng = createRng(seed)
  let state = createGame(seed % 2 === 0 ? PLAYER_A : PLAYER_B)
  let turns = 0
  let longestRelay = 0

  while (state.status === 'berjalan') {
    const legal = currentLegalMoves(state)
    // Ruleset tak-ada-langkah mengakhiri permainan sebelum ini bisa terjadi;
    // pack lain boleh berbeda, jadi keadaannya ditangani, bukan diandaikan.
    if (legal.length === 0) break

    const move = rng.pick(legal)
    const { state: next, events } = applyMove(state, move, ruleset)

    // Konservasi sesudah setiap giliran, di setiap permainan. Tanpa kecuali.
    assertConservation(next.board, `sim seed ${seed} giliran ${turns}`, next.seedsInPlay)

    longestRelay = Math.max(longestRelay, countRelays(events))
    state = next
    turns += 1
    if (turns > MAX_TURNS) throw new Error(`sim seed ${seed}: permainan tidak berhenti`)
  }

  return { turns, longestRelay, final: state }
}

function countRelays(events: readonly GameEvent[]): number {
  return events.filter((e) => e.type === 'relay').length
}

describe.each(RULESETS.map((r) => [r.id, r] as const))('simulasi — %s', (id, ruleset) => {
  it(`menyelesaikan ${GAMES_PER_RULESET} permainan acak dengan biji tetap utuh`, () => {
    let draws = 0
    let maxTurns = 0
    let maxRelay = 0

    for (let seed = 1; seed <= GAMES_PER_RULESET; seed++) {
      const { turns, longestRelay, final } = simulate(seed, ruleset)

      expect(final.status).toBe('selesai')
      expect(final.hasil).not.toBeNull()

      // Keadaan akhir yang sah: tak ada biji tersisa di lubang mana pun,
      // dan skor kedua lumbung menjumlah persis biji yang masih dihitung.
      expect(seedsOnSide(final.board, PLAYER_A)).toBe(0)
      expect(seedsOnSide(final.board, PLAYER_B)).toBe(0)
      expect(scoreOf(final.board, PLAYER_A) + scoreOf(final.board, PLAYER_B)).toBe(
        final.seedsInPlay,
      )
      expect(countSeeds(final.board)).toBe(final.seedsInPlay)

      // Pack yang tidak membuang biji harus tetap di 98.
      if (ruleset.options.finalSweep !== 'dibuang') {
        expect(final.seedsInPlay).toBe(TOTAL_SEEDS)
      }

      const hasil = final.hasil
      const skorA = scoreOf(final.board, PLAYER_A)
      const skorB = scoreOf(final.board, PLAYER_B)
      if (hasil === 'seri') {
        expect(skorA).toBe(skorB)
        draws += 1
      } else if (hasil === 'a') {
        expect(skorA).toBeGreaterThan(skorB)
      } else {
        expect(skorB).toBeGreaterThan(skorA)
      }

      maxTurns = Math.max(maxTurns, turns)
      maxRelay = Math.max(maxRelay, longestRelay)
    }

    // Seri bukan kasus teoretis: 98 genap, jadi 49–49 memang muncul.
    console.log(
      `  ${id}: ${GAMES_PER_RULESET} permainan, giliran terbanyak ${maxTurns},` +
        ` sambung terpanjang ${maxRelay}, seri ${draws}`,
    )
    expect(maxTurns).toBeLessThan(MAX_TURNS)
  })
})
