import { describe, expect, it } from 'vitest'
import { applyMove } from '@/lib/engine/apply'
import { LUMBUNG_A, PLAYER_A } from '@/lib/engine/board'
import { countSeeds } from '@/lib/engine/conserve'
import { alasanHenti, eventTypes, stateFrom, umum, withOptions } from '../helpers'

const rules = umum()

/**
 * A turn that ends with nothing banked has to say which clause ended it.
 *
 * These are the cases a player experiences as the app being broken: the
 * last seed lands in an empty hole on their own side — the textbook capture
 * — and nothing happens, because this pack reads the rule differently. Each
 * fixture states the board, the move, and the exact clause expected to
 * speak.
 */
describe('alasan berhenti', () => {
  it('lubang kosong sisi lawan — universal, tanpa opsi', () => {
    const state = stateFrom([[6, 3]], PLAYER_A)
    const { state: after, events } = applyMove(state, 6, rules)

    expect(alasanHenti(events)).toEqual({ alasan: 'lubang-kosong-sisi-lawan', opsi: null })
    expect(countSeeds(after.board)).toBe(3)
  })

  it('belum satu pusingan — menembak.requireLapCompleted', () => {
    // A menabur dari 5, biji terakhir mendarat di lubang kosong 6 di sisi
    // sendiri, tanpa pernah melewati lumbung. Pack yang mensyaratkan satu
    // pusingan menolak tembakan itu.
    const varian = withOptions(rules, {
      menembak: { enabled: true, requireOppositeNonEmpty: false, requireLapCompleted: true },
    })
    const state = stateFrom(
      [
        [5, 1],
        [8, 4],
      ],
      PLAYER_A,
    )
    const { state: after, events } = applyMove(state, 5, varian)

    expect(alasanHenti(events)).toEqual({
      alasan: 'belum-satu-pusingan',
      opsi: 'menembak.requireLapCompleted',
    })
    expect(after.board[LUMBUNG_A]).toBe(0)
    expect(countSeeds(after.board)).toBe(5)
  })

  it('seberang kosong — menembak.requireOppositeNonEmpty', () => {
    const varian = withOptions(rules, {
      menembak: { enabled: true, requireOppositeNonEmpty: true, requireLapCompleted: false },
    })
    // Biji terakhir mendarat di lubang kosong 5 sisi sendiri; seberangnya
    // (9) kosong, jadi pack ini tidak menembak sama sekali. B diberi biji
    // supaya permainannya belum selesai — kalau papan habis, sapu akhir
    // yang memindahkan biji, bukan aturan yang sedang diuji.
    const state = stateFrom(
      [
        [4, 1],
        [10, 2],
      ],
      PLAYER_A,
    )
    const { state: after, events } = applyMove(state, 4, varian)

    expect(alasanHenti(events)).toEqual({
      alasan: 'seberang-kosong',
      opsi: 'menembak.requireOppositeNonEmpty',
    })
    expect(after.board[LUMBUNG_A]).toBe(0)
    expect(after.status).toBe('berjalan')
    expect(countSeeds(after.board)).toBe(3)
  })

  it('pack tanpa menembak — menembak.enabled', () => {
    const varian = withOptions(rules, {
      menembak: { enabled: false, requireOppositeNonEmpty: false, requireLapCompleted: false },
    })
    const state = stateFrom(
      [
        [4, 1],
        [10, 2],
      ],
      PLAYER_A,
    )
    const { events } = applyMove(state, 4, varian)

    expect(alasanHenti(events)).toEqual({ alasan: 'tanpa-menembak', opsi: 'menembak.enabled' })
  })

  it('lumbung tanpa giliran lagi — extraTurnOnOwnLumbung', () => {
    const varian = withOptions(rules, { extraTurnOnOwnLumbung: false })
    const state = stateFrom(
      [
        [6, 1],
        [10, 2],
      ],
      PLAYER_A,
    )
    const { state: after, events } = applyMove(state, 6, varian)

    expect(eventTypes(events)).toEqual(['scoop', 'bank', 'henti', 'turnEnd'])
    expect(alasanHenti(events)).toEqual({
      alasan: 'lumbung-tanpa-giliran-lagi',
      opsi: 'extraTurnOnOwnLumbung',
    })
    expect(after.board[LUMBUNG_A]).toBe(1)
  })

  /**
   * A successful capture or an extra turn is its own explanation, so no
   * `henti` should appear alongside them — otherwise the history would
   * report a turn both banking seeds and ending for want of them.
   */
  it('tidak muncul saat menembak berhasil atau dapat giliran lagi', () => {
    const menembak = applyMove(
      stateFrom(
        [
          [4, 1],
          [9, 3],
        ],
        PLAYER_A,
      ),
      4,
      rules,
    )
    expect(eventTypes(menembak.events)).toContain('menembak')
    expect(alasanHenti(menembak.events)).toBeNull()

    const lagi = applyMove(stateFrom([[6, 1]], PLAYER_A), 6, rules)
    expect(eventTypes(lagi.events)).toContain('extraTurn')
    expect(alasanHenti(lagi.events)).toBeNull()
  })
})
