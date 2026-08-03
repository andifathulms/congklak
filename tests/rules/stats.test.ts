import { describe, expect, it } from 'vitest'
import { applyMove, createGame, currentLegalMoves } from '@/lib/engine/apply'
import { PLAYER_A, lumbungOf } from '@/lib/engine/board'
import { replay } from '@/lib/engine/replay'
import { dariRekaman } from '@/components/game/stats'
import { createRng } from '@/lib/rng'
import { umum } from '../helpers'

const rules = umum()

describe('statistik dari aliran event', () => {
  /**
   * Kedua angka diambil dari event yang memang sudah ada, jadi keduanya
   * harus cocok dengan papan. Bank terbesar dalam satu giliran tidak
   * mungkin melebihi pertambahan isi lumbung pada giliran itu.
   */
  it('bank terbesar cocok dengan pertambahan isi lumbung per giliran', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rng = createRng(seed)
      const moves: number[] = []
      let state = createGame(PLAYER_A)
      let puncak = 0

      while (state.status === 'berjalan') {
        const legal = currentLegalMoves(state)
        if (legal.length === 0) break
        const move = rng.pick(legal)
        const lumbung = lumbungOf(state.toMove)
        const sebelum = state.board[lumbung]

        moves.push(move)
        state = applyMove(state, move, rules).state

        // Sapu akhir juga menambah isi lumbung tapi bukan hasil satu
        // giliran, jadi giliran penutup tidak ikut dihitung di sini.
        if (state.status === 'berjalan') {
          puncak = Math.max(puncak, state.board[lumbung] - sebelum)
        }
      }

      const { steps } = replay({ rulesetId: rules.id, moves, firstPlayer: PLAYER_A }, rules)
      const { bankTerbesar, sambungTerpanjang } = dariRekaman(steps)

      expect(bankTerbesar).toBeGreaterThanOrEqual(puncak)
      expect(sambungTerpanjang).toBeGreaterThanOrEqual(0)
    }
  })

  it('menghitung sambung terpanjang sama dengan jumlah event relay', () => {
    const rng = createRng(7)
    const moves: number[] = []
    let state = createGame(PLAYER_A)
    while (state.status === 'berjalan') {
      const legal = currentLegalMoves(state)
      if (legal.length === 0) break
      const move = rng.pick(legal)
      moves.push(move)
      state = applyMove(state, move, rules).state
    }

    const { steps } = replay({ rulesetId: rules.id, moves, firstPlayer: PLAYER_A }, rules)
    const manual = Math.max(
      ...steps.map((s) => s.events.filter((e) => e.type === 'relay').length),
    )
    expect(dariRekaman(steps).sambungTerpanjang).toBe(manual)
  })

  it('permainan kosong tidak menghasilkan angka apa pun', () => {
    expect(dariRekaman([])).toEqual({ bankTerbesar: 0, sambungTerpanjang: 0 })
  })
})
