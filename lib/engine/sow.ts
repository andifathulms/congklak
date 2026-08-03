/**
 * The sow, with relay. The heart of the game.
 *
 * Iterative, never recursive — relay chains can be long (invariant 4).
 * Conservation is checked after every event, so a dropped or duplicated
 * seed surfaces at the step that caused it rather than a turn later.
 */
import {
  isLumbung,
  isOwnHole,
  lumbungOf,
  nextIndex,
  opposite,
  type Board,
  type Player,
} from './board'
import { checkConservation } from './conserve'
import type { GameEvent } from './events'
import type { Ruleset } from '../rulesets/schema'

/**
 * Backstop only. A chain terminates by the rules; hitting this budget means
 * something is wrong and is reported as a bug, never swallowed as a normal
 * exit (invariant 9).
 */
export const MAX_RELAY_STEPS = 2000
export const MAX_SEED_DROPS = 200_000

export class RelayBudgetError extends Error {
  constructor(
    readonly relaySteps: number,
    readonly seedDrops: number,
    readonly board: Board,
  ) {
    super(
      `Anggaran sambung habis setelah ${relaySteps} sambungan / ${seedDrops} jatuhan biji.` +
        ' Rantai sambung seharusnya berhenti sendiri menurut aturan — ini bug, bukan jalan keluar normal.' +
        ` Papan [${Array.from(board).join(',')}]`,
    )
    this.name = 'RelayBudgetError'
  }
}

export interface SowOutcome {
  /** Mutated in place — the caller owns the clone. */
  readonly board: Board
  readonly events: readonly GameEvent[]
  /** Pemain yang sama jalan lagi. */
  readonly extraTurn: boolean
  /** Sambungan terpanjang dalam giliran ini, untuk statistik lokal. */
  readonly relayLength: number
}

/**
 * Sows `from` for `player`, mutating `board`. Emits the full event stream
 * for the turn, ending with extraTurn or turnEnd.
 */
export function sow(
  board: Board,
  from: number,
  player: Player,
  ruleset: Ruleset,
  expectedSeeds: number,
): SowOutcome {
  const events: GameEvent[] = []
  const lumbungSendiri = lumbungOf(player)
  const opts = ruleset.options

  let relaySteps = 0
  let seedDrops = 0
  let extraTurn = false

  let hand = board[from]
  board[from] = 0
  events.push({ type: 'scoop', index: from, biji: hand, player })
  checkConservation(board, `scoop lubang ${from}`, expectedSeeds - hand)

  let at = from

  // Outer loop is the relay chain; inner loop is one handful of seeds.
  for (;;) {
    while (hand > 0) {
      at = nextIndex(at, player)
      board[at] += 1
      hand -= 1
      seedDrops += 1

      if (at === lumbungSendiri) {
        events.push({ type: 'bank', index: at, biji: board[at], sisa: hand, player })
      } else {
        events.push({ type: 'sow', index: at, biji: board[at], sisa: hand })
      }
      checkConservation(board, `sow ke ${at}`, expectedSeeds - hand)

      if (seedDrops > MAX_SEED_DROPS) throw new RelayBudgetError(relaySteps, seedDrops, board)
    }

    // Biji terakhir sudah mendarat di `at`. Tiga kemungkinan.

    // 1. Lumbung sendiri. Lumbung lawan mustahil — nextIndex melewatinya.
    if (isLumbung(at)) {
      if (opts.extraTurnOnOwnLumbung) {
        extraTurn = true
        events.push({ type: 'extraTurn', player })
      }
      break
    }

    // 2. Lubang yang tadinya berisi → sambung. Berlaku di kedua sisi.
    if (board[at] > 1) {
      hand = board[at]
      board[at] = 0
      relaySteps += 1
      events.push({ type: 'relay', index: at, biji: hand, rantai: relaySteps })
      checkConservation(board, `relay dari ${at}`, expectedSeeds - hand)

      if (relaySteps > MAX_RELAY_STEPS) throw new RelayBudgetError(relaySteps, seedDrops, board)
      continue
    }

    // 3. Lubang yang tadinya kosong. Di sisi sendiri berarti menembak;
    //    di sisi lawan giliran habis begitu saja.
    if (opts.menembak.enabled && isOwnHole(at, player)) {
      const seberang = opposite(at)
      const dariSeberang = board[seberang]

      // Sumber terbagi soal lubang seberang yang kosong: sebagian tetap
      // memberi biji terakhir, sebagian tidak menembak sama sekali.
      // Lihat divergences pada pack — sumber: data/rulesets/*.json
      if (dariSeberang > 0 || !opts.menembak.requireOppositeNonEmpty) {
        const dariLubang = board[at]
        const total = dariLubang + dariSeberang
        board[at] = 0
        board[seberang] = 0
        board[lumbungSendiri] += total
        events.push({
          type: 'menembak',
          lubang: at,
          seberang,
          dariLubang,
          dariSeberang,
          total,
          lumbung: board[lumbungSendiri],
          player,
        })
        checkConservation(board, `menembak di ${at}`, expectedSeeds)
      }
    }
    break
  }

  checkConservation(board, 'akhir giliran', expectedSeeds)
  return { board, events, extraTurn, relayLength: relaySteps }
}
