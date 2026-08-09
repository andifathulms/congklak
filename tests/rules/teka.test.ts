import { describe, expect, it } from 'vitest'
import { applyMove, currentLegalMoves } from '@/lib/engine/apply'
import { PLAYER_A, isLegalMove } from '@/lib/engine/board'
import { countSeeds } from '@/lib/engine/conserve'
import { getRuleset } from '@/lib/rulesets'
import { TEKA, TEKA_RULESET } from '@/lib/teka/teka'
import { capaian, nilaiGiliran, tercapai } from '@/lib/teka/sasaran'
import { stateFrom } from '../helpers'

const rules = getRuleset(TEKA_RULESET)

/**
 * Every puzzle states an answer. Here that statement is put to the engine.
 *
 * Two properties matter and both are load-bearing: the stated move must hit
 * the target, and *no other legal move may*. A puzzle with a second answer
 * is a coin flip dressed as a problem, and one with no answer wastes the
 * time of someone who trusted it. Neither should be able to ship.
 */
describe('mode teka-teki', () => {
  it('punya lima teka-teki dengan id berbeda', () => {
    expect(TEKA).toHaveLength(5)
    expect(new Set(TEKA.map((t) => t.id)).size).toBe(TEKA.length)
  })

  it('semuanya memakai ruleset yang benar-benar ada', () => {
    expect(() => getRuleset(TEKA_RULESET)).not.toThrow()
  })

  describe.each(TEKA.map((t) => [t.id, t] as const))('%s', (_id, teka) => {
    it('jawabannya langkah sah milik pemain A', () => {
      const state = stateFrom(teka.cells, PLAYER_A)
      expect(isLegalMove(state.board, PLAYER_A, teka.jawaban)).toBe(true)
    })

    it('jawabannya mencapai sasaran', () => {
      const state = stateFrom(teka.cells, PLAYER_A)
      const { state: after, events } = applyMove(state, teka.jawaban, rules)
      const hasil = nilaiGiliran(events)

      expect(tercapai(teka.sasaran, hasil), `${teka.id}: jawaban tidak mencapai sasaran`).toBe(true)
      // Konservasi biji tetap dijaga, seperti di setiap uji lain.
      expect(countSeeds(after.board)).toBe(after.seedsInPlay)
    })

    it('tidak ada langkah lain yang mencapainya', () => {
      const state = stateFrom(teka.cells, PLAYER_A)
      const lain = currentLegalMoves(state).filter((h) => h !== teka.jawaban)

      for (const hole of lain) {
        const { events } = applyMove(state, hole, rules)
        expect(
          tercapai(teka.sasaran, nilaiGiliran(events)),
          `${teka.id}: lubang ${hole} juga mencapai sasaran — teka-tekinya punya dua jawaban`,
        ).toBe(false)
      }
    })

    it('menawarkan pilihan sungguhan, bukan satu-satunya langkah', () => {
      const state = stateFrom(teka.cells, PLAYER_A)
      expect(currentLegalMoves(state).length).toBeGreaterThanOrEqual(3)
    })

    /**
     * The target is stated as a number a player reads, so it has to be the
     * number the engine actually produces — not a rounder one nearby.
     */
    it('angka sasarannya persis yang dihasilkan mesin', () => {
      if (teka.sasaran.jenis === 'giliran-lagi') return
      const state = stateFrom(teka.cells, PLAYER_A)
      const { events } = applyMove(state, teka.jawaban, rules)
      expect(capaian(teka.sasaran, nilaiGiliran(events))).toBe(teka.sasaran.minimal)
    })
  })
})

describe('penilaian sasaran', () => {
  it('menghitung tembakan terpisah dari tabungan biasa', () => {
    // Papan dengan tembakan: biji terakhir di lubang kosong sisi sendiri.
    const state = stateFrom(
      [
        [4, 1],
        [9, 3],
      ],
      PLAYER_A,
    )
    const { events } = applyMove(state, 4, rules)
    const hasil = nilaiGiliran(events)

    expect(hasil.tembak).toBe(4)
    // Tembakan ikut masuk hitungan tabungan — keduanya masuk lumbung.
    expect(hasil.tabung).toBe(4)
  })

  it('giliran tanpa apa-apa bernilai nol', () => {
    const state = stateFrom([[6, 3]], PLAYER_A)
    const { events } = applyMove(state, 6, rules)
    const hasil = nilaiGiliran(events)

    expect(hasil).toEqual({ tabung: 1, tembak: 0, sambung: 0, giliranLagi: false })
  })
})
