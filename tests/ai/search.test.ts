import { describe, expect, it } from 'vitest'
import { applyMove, createGame, currentLegalMoves, scoreOf, type GameState } from '@/lib/engine/apply'
import { LUMBUNG_A, LUMBUNG_B, PLAYER_A, PLAYER_B, isLegalMove } from '@/lib/engine/board'
import { assertConservation } from '@/lib/engine/conserve'
import { KEKUATAN, chooseMove, type Kesulitan } from '@/lib/ai/search'
import { evaluate } from '@/lib/ai/evaluate'
import { stateFrom, umum } from '../helpers'

const rules = umum()

function play(state: GameState, kesulitan: Kesulitan, seed: number): number {
  return chooseMove(state, { ruleset: rules, kesulitan, seed }).move
}

describe('AI', () => {
  it('tidak pernah memilih langkah tidak sah, di sepanjang permainan penuh', () => {
    for (const kesulitan of ['mudah', 'sedang'] as const) {
      for (let seed = 1; seed <= 10; seed++) {
        let state = createGame(PLAYER_A)
        let turns = 0

        while (state.status === 'berjalan' && turns < 500) {
          const move = play(state, kesulitan, seed * 1000 + turns)
          expect(isLegalMove(state.board, state.toMove, move)).toBe(true)
          state = applyMove(state, move, rules).state
          // Konservasi berlaku di uji AI juga. Tanpa kecuali.
          assertConservation(state.board, `ai ${kesulitan} seed ${seed}`, state.seedsInPlay)
          turns++
        }

        expect(state.status).toBe('selesai')
      }
    }
  })

  it('deterministik: benih sama, langkah sama', () => {
    const state = createGame(PLAYER_A)
    for (const kesulitan of ['mudah', 'sedang', 'sulit'] as const) {
      const a = chooseMove(state, { ruleset: rules, kesulitan, seed: 42 })
      const b = chooseMove(state, { ruleset: rules, kesulitan, seed: 42 })
      expect(b.move).toBe(a.move)
      expect(b.score).toBe(a.score)
      expect(b.nodes).toBe(a.nodes)
    }
  })

  it('menemukan kemenangan paksa dan berhenti mendalami', () => {
    const state = stateFrom(
      [
        [0, 3],
        [3, 2],
        [6, 1],
        [9, 4],
        [12, 3],
      ],
      PLAYER_A,
    )
    const result = chooseMove(state, { ruleset: rules, kesulitan: 'sulit', seed: 7 })
    expect(result.score).toBeGreaterThan(1_000_000)
    // Pendalaman berhenti begitu menang paksa ketemu, jauh sebelum depth 9.
    expect(result.depth).toBeLessThan(KEKUATAN.sulit.depth)
    expect(result.stopped).toBe(false)
  })

  it('mengambil tembakan besar kalau ada', () => {
    // A[5]=1 mendarat di A[6] yang kosong; seberangnya, lubang 8, berisi
    // 12 biji. Langkah lain tidak mendekati nilai itu.
    const state = stateFrom(
      [
        [0, 2],
        [5, 1],
        [6, 0],
        [8, 12],
        [11, 3],
      ],
      PLAYER_A,
    )
    const move = play(state, 'sedang', 3)
    const { state: after } = applyMove(state, move, rules)
    expect(after.board[LUMBUNG_A]).toBeGreaterThanOrEqual(13)
  })

  it('menghormati anggaran waktu dan tetap menjawab', () => {
    const state = createGame(PLAYER_A)
    let calls = 0
    const result = chooseMove(state, {
      ruleset: rules,
      kesulitan: 'sulit',
      seed: 1,
      // Berhenti hampir seketika: yang diuji adalah tetap ada jawabannya.
      shouldStop: () => ++calls > 50,
    })

    expect(result.stopped).toBe(true)
    expect(result.depth).toBeGreaterThanOrEqual(0)
    expect(isLegalMove(state.board, PLAYER_A, result.move)).toBe(true)
  })

  it('menolak bergerak kalau memang tidak ada langkah sah', () => {
    const state = stateFrom([[LUMBUNG_A, 10]], PLAYER_A)
    expect(() => chooseMove(state, { ruleset: rules, kesulitan: 'mudah', seed: 1 })).toThrow()
  })
})

describe('kesulitan', () => {
  it('sulit mencari lebih dalam daripada mudah, dan tanpa gangguan', () => {
    expect(KEKUATAN.sulit.depth).toBeGreaterThan(KEKUATAN.sedang.depth)
    expect(KEKUATAN.sedang.depth).toBeGreaterThan(KEKUATAN.mudah.depth)
    expect(KEKUATAN.sulit.noise).toBe(0)
    expect(KEKUATAN.mudah.noise).toBeGreaterThan(KEKUATAN.sedang.noise)
  })

  it('sulit mengungguli mudah dalam satu seri', () => {
    // Kedua sisi dimainkan bergantian, supaya keunggulan langkah pertama
    // tidak tersamar sebagai kekuatan AI.
    let sulitMenang = 0
    let mudahMenang = 0
    const SERI = 12

    for (let game = 0; game < SERI; game++) {
      const sulitSebagai = game % 2 === 0 ? PLAYER_A : PLAYER_B
      let state = createGame(PLAYER_A)
      let turns = 0

      while (state.status === 'berjalan' && turns < 500) {
        const kesulitan: Kesulitan = state.toMove === sulitSebagai ? 'sulit' : 'mudah'
        const move = chooseMove(state, {
          ruleset: rules,
          kesulitan,
          seed: game * 100 + turns,
          // Kedalaman 9 tanpa anggaran terlalu lambat untuk sebuah uji.
          shouldStop: (() => {
            let n = 0
            return () => ++n > 40_000
          })(),
        }).move
        state = applyMove(state, move, rules).state
        turns++
      }

      const skorSulit = scoreOf(state.board, sulitSebagai)
      const skorMudah = state.seedsInPlay - skorSulit
      if (skorSulit > skorMudah) sulitMenang++
      else if (skorMudah > skorSulit) mudahMenang++
    }

    expect(sulitMenang).toBeGreaterThan(mudahMenang)
  }, 120_000)
})

describe('evaluasi', () => {
  it('simetris: nilai satu sisi adalah kebalikan nilai sisi lain', () => {
    const state = stateFrom(
      [
        [0, 3],
        [4, 6],
        [9, 2],
        [13, 8],
        [LUMBUNG_A, 20],
        [LUMBUNG_B, 14],
      ],
      PLAYER_A,
    )
    expect(evaluate(state.board, PLAYER_A, rules)).toBe(
      -evaluate(state.board, PLAYER_B, rules),
    )
  })

  it('memakai bilangan bulat saja', () => {
    const state = createGame(PLAYER_A)
    const score = evaluate(state.board, PLAYER_A, rules)
    expect(Number.isInteger(score)).toBe(true)
  })

  it('menghargai peluang giliran lagi', () => {
    // Menguji sukunya langsung, bukan lewat pilihan langkah AI.
    //
    // Dua kali uji ini ditulis sebagai "AI pasti memilih lubang X", dan
    // dua kali AI memilih lain — dan benar: di kedua posisi langkah
    // pilihannya menang paksa, sementara langkah yang saya kira jelas
    // benar tidak. Akhir permainan congklak melawan intuisi; posisi kecil
    // yang disusun tangan bukan cara yang sah untuk menegaskan sebuah suku
    // evaluasi.
    const punya = stateFrom(
      [
        [4, 3], // 7 − 4 = 3, jadi biji terakhir tepat di lumbung
        [9, 3],
        [LUMBUNG_A, 10],
        [LUMBUNG_B, 10],
      ],
      PLAYER_A,
    )
    const tidak = stateFrom(
      [
        [4, 5], // lewat lumbung, tidak berhenti di sana
        [9, 3],
        [LUMBUNG_A, 10],
        [LUMBUNG_B, 10],
      ],
      PLAYER_A,
    )
    expect(evaluate(punya.board, PLAYER_A, rules)).toBeGreaterThan(
      evaluate(tidak.board, PLAYER_A, rules),
    )
  })

  it('lebih menyukai lumbung yang lebih penuh', () => {
    const kurang = stateFrom([[LUMBUNG_A, 10], [LUMBUNG_B, 10]], PLAYER_A)
    const lebih = stateFrom([[LUMBUNG_A, 30], [LUMBUNG_B, 10]], PLAYER_A)
    expect(evaluate(lebih.board, PLAYER_A, rules)).toBeGreaterThan(
      evaluate(kurang.board, PLAYER_A, rules),
    )
  })
})
