import { describe, expect, it } from 'vitest'
import {
  BOARD_SIZE,
  LUMBUNG_A,
  LUMBUNG_B,
  PLAYER_A,
  PLAYER_B,
  TOTAL_SEEDS,
  createBoard,
  emptyHolesOnSide,
  isOwnHole,
  legalMoves,
  nextIndex,
  opposite,
  seedsOnSide,
} from '@/lib/engine/board'
import { ConservationError, assertConservation, countSeeds } from '@/lib/engine/conserve'

describe('papan awal', () => {
  it('berisi tepat 98 biji', () => {
    expect(countSeeds(createBoard())).toBe(98)
    expect(TOTAL_SEEDS).toBe(98)
  })

  it('memberi 7 biji ke tiap lubang dan mengosongkan kedua lumbung', () => {
    const board = createBoard()
    expect(board[LUMBUNG_A]).toBe(0)
    expect(board[LUMBUNG_B]).toBe(0)
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (i !== LUMBUNG_A && i !== LUMBUNG_B) expect(board[i]).toBe(7)
    }
  })

  it('membagi 49 biji ke tiap sisi', () => {
    const board = createBoard()
    expect(seedsOnSide(board, PLAYER_A)).toBe(49)
    expect(seedsOnSide(board, PLAYER_B)).toBe(49)
    expect(emptyHolesOnSide(board, PLAYER_A)).toBe(0)
  })
})

describe('opposite()', () => {
  it('memasangkan lubang seberang secara timbal balik', () => {
    for (let i = 0; i <= 6; i++) {
      expect(opposite(i)).toBe(14 - i)
      expect(opposite(opposite(i))).toBe(i)
      expect(isOwnHole(opposite(i), PLAYER_B)).toBe(true)
    }
  })

  it('menolak lumbung, yang tidak punya seberang', () => {
    expect(() => opposite(LUMBUNG_A)).toThrow()
    expect(() => opposite(LUMBUNG_B)).toThrow()
  })
})

describe('nextIndex()', () => {
  it('melewati lumbung lawan, tidak pernah lumbung sendiri', () => {
    // A berjalan 6 → 7 (lumbung sendiri) → 8, dan 14 → 0, melewati 15.
    expect(nextIndex(6, PLAYER_A)).toBe(LUMBUNG_A)
    expect(nextIndex(LUMBUNG_A, PLAYER_A)).toBe(8)
    expect(nextIndex(14, PLAYER_A)).toBe(0)

    // B berjalan 14 → 15 (lumbung sendiri) → 0, dan 6 → 8, melewati 7.
    expect(nextIndex(14, PLAYER_B)).toBe(LUMBUNG_B)
    expect(nextIndex(LUMBUNG_B, PLAYER_B)).toBe(0)
    expect(nextIndex(6, PLAYER_B)).toBe(8)
  })

  it('mengunjungi 15 posisi lalu kembali, karena satu lumbung dilewati', () => {
    for (const player of [PLAYER_A, PLAYER_B] as const) {
      const seen = new Set<number>()
      let at = 0
      for (let step = 0; step < BOARD_SIZE * 2; step++) {
        at = nextIndex(at, player)
        seen.add(at)
      }
      expect(seen.size).toBe(BOARD_SIZE - 1)
      expect(seen.has(LUMBUNG_A)).toBe(player === PLAYER_A)
      expect(seen.has(LUMBUNG_B)).toBe(player === PLAYER_B)
    }
  })
})

describe('legalMoves()', () => {
  it('mengembalikan lubang berisi milik sendiri, urut menaik', () => {
    const board = createBoard()
    expect(legalMoves(board, PLAYER_A)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(legalMoves(board, PLAYER_B)).toEqual([8, 9, 10, 11, 12, 13, 14])
  })

  it('membuang lubang kosong', () => {
    const board = createBoard()
    board[2] = 0
    board[5] = 0
    expect(legalMoves(board, PLAYER_A)).toEqual([0, 1, 3, 4, 6])
  })
})

describe('assertConservation()', () => {
  it('lolos untuk papan awal', () => {
    expect(() => assertConservation(createBoard(), 'papan awal')).not.toThrow()
  })

  it('menangkap biji yang hilang', () => {
    const board = createBoard()
    board[3] -= 1
    expect(() => assertConservation(board, 'uji')).toThrow(ConservationError)
  })

  it('menangkap biji yang berlipat', () => {
    const board = createBoard()
    board[3] += 1
    expect(() => assertConservation(board, 'uji')).toThrow(ConservationError)
  })
})
