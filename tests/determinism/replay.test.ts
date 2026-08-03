import { describe, expect, it } from 'vitest'
import { applyMove, createGame, currentLegalMoves, type GameState } from '@/lib/engine/apply'
import { PLAYER_A, PLAYER_B, type Player } from '@/lib/engine/board'
import { countSeeds } from '@/lib/engine/conserve'
import { hashOf } from '@/lib/engine/hash'
import { decodeRecord, encodeRecord, replay, type GameRecord } from '@/lib/engine/replay'
import { createRng } from '@/lib/rng'
import { cellsOf, umum } from '../helpers'

const rules = umum()

/** Plays one random legal game and returns its move list. */
function randomGame(seed: number, firstPlayer: Player = PLAYER_A): GameRecord {
  const rng = createRng(seed)
  const moves: number[] = []
  let state: GameState = createGame(firstPlayer)

  while (state.status === 'berjalan') {
    const legal = currentLegalMoves(state)
    if (legal.length === 0) break
    const move = rng.pick(legal)
    moves.push(move)
    state = applyMove(state, move, rules).state
  }

  return { rulesetId: rules.id, moves, firstPlayer }
}

describe('putar ulang', () => {
  it('menghasilkan keadaan akhir yang identik byte demi byte', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const record = randomGame(seed)
      const first = replay(record, rules)
      const second = replay(record, rules)

      expect(cellsOf(second.final.board)).toEqual(cellsOf(first.final.board))
      expect(second.final.toMove).toBe(first.final.toMove)
      expect(second.final.status).toBe(first.final.status)
      expect(second.final.hasil).toBe(first.final.hasil)
      expect(second.hashes).toEqual(first.hashes)
    }
  })

  it('cocok dengan permainan aslinya, bukan hanya dengan dirinya sendiri', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = createRng(seed)
      const moves: number[] = []
      let live = createGame(PLAYER_A)
      while (live.status === 'berjalan') {
        const legal = currentLegalMoves(live)
        if (legal.length === 0) break
        const move = rng.pick(legal)
        moves.push(move)
        live = applyMove(live, move, rules).state
      }

      const replayed = replay({ rulesetId: rules.id, moves, firstPlayer: PLAYER_A }, rules)
      expect(cellsOf(replayed.final.board)).toEqual(cellsOf(live.board))
      expect(hashOf(replayed.final, rules.id)).toBe(hashOf(live, rules.id))
    }
  })

  it('bekerja untuk kedua pemain pertama', () => {
    for (const first of [PLAYER_A, PLAYER_B] as const) {
      const record = randomGame(77, first)
      expect(replay(record, rules).final.board).toEqual(replay(record, rules).final.board)
    }
  })

  it('menolak rekaman dari ruleset lain', () => {
    const record: GameRecord = { rulesetId: 'bukan-umum', moves: [0], firstPlayer: PLAYER_A }
    expect(() => replay(record, rules)).toThrow(/Ruleset tidak cocok/)
  })
})

describe('kode permainan', () => {
  it('bolak-balik tanpa berubah', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const record = randomGame(seed)
      const decoded = decodeRecord(encodeRecord(record))
      expect(decoded.rulesetId).toBe(record.rulesetId)
      expect(decoded.firstPlayer).toBe(record.firstPlayer)
      expect(decoded.moves).toEqual([...record.moves])
      expect(replay(decoded, rules).hashes).toEqual(replay(record, rules).hashes)
    }
  })
})

describe('kesepakatan antar-instans', () => {
  // Jaminan P2P, diuji tanpa jaringan sama sekali (PRD §10).
  it('dua instans mesin sepakat pada setiap hash giliran', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = createRng(seed)
      let kiri = createGame(PLAYER_A)
      let kanan = createGame(PLAYER_A)

      while (kiri.status === 'berjalan') {
        const legal = currentLegalMoves(kiri)
        if (legal.length === 0) break
        const move = rng.pick(legal)

        kiri = applyMove(kiri, move, rules).state
        kanan = applyMove(kanan, move, rules).state

        expect(hashOf(kanan, rules.id)).toBe(hashOf(kiri, rules.id))
        expect(countSeeds(kanan.board)).toBe(kanan.seedsInPlay)
      }

      expect(kanan.hasil).toBe(kiri.hasil)
    }
  })

  it('memberi hash berbeda untuk papan berbeda', () => {
    const a = createGame(PLAYER_A)
    const b = applyMove(a, 0, rules).state
    expect(hashOf(b, rules.id)).not.toBe(hashOf(a, rules.id))
  })

  it('mengikat hash pada ruleset id, supaya pack berbeda tidak menyamar', () => {
    const state = createGame(PLAYER_A)
    expect(hashOf(state, 'umum')).not.toBe(hashOf(state, 'lainnya'))
  })
})
