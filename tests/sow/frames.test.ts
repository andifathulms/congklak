import { describe, expect, it } from 'vitest'
import { applyMove, createGame, currentLegalMoves } from '@/lib/engine/apply'
import { PLAYER_A } from '@/lib/engine/board'
import { describeEvent } from '@/lib/engine/events'
import { framesFor, frameDuration, initialFrame } from '@/components/sow/frames'
import { createRng } from '@/lib/rng'
import { cellsOf, stateFrom, umum } from '../helpers'

const rules = umum()

describe('bingkai penaburan', () => {
  /**
   * Yang paling penting di sini: bingkai terakhir harus sama persis dengan
   * papan hasil applyMove. Kalau meleset, berarti penggambar diam-diam
   * menghitung sendiri, dan pemain akan melihat papan yang bukan papannya.
   */
  it('berakhir tepat di papan yang dihasilkan mesin, di setiap giliran', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = createRng(seed)
      let state = createGame(PLAYER_A)

      while (state.status === 'berjalan') {
        const legal = currentLegalMoves(state)
        if (legal.length === 0) break
        const move = rng.pick(legal)
        const before = state.board
        const { state: after, events } = applyMove(state, move, rules)

        const frames = framesFor(before, events)
        expect(frames).toHaveLength(events.length + 1)
        expect(frames[0].cells).toEqual(cellsOf(before))
        expect(frames.at(-1)!.cells).toEqual(cellsOf(after.board))

        state = after
      }
    }
  })

  it('menjaga jumlah biji — di tangan plus di papan — di setiap bingkai', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = createRng(seed)
      let state = createGame(PLAYER_A)

      while (state.status === 'berjalan') {
        const legal = currentLegalMoves(state)
        if (legal.length === 0) break
        const move = rng.pick(legal)
        const before = state.board
        const { state: after, events } = applyMove(state, move, rules)

        for (const frame of framesFor(before, events)) {
          const onBoard = frame.cells.reduce((sum, n) => sum + n, 0)
          // Sesudah sapu akhir yang membuang, jumlahnya memang turun; pack
          // umum tidak membuang, jadi di sini selalu 98.
          expect(onBoard + frame.hand).toBe(98)
        }

        state = after
      }
    }
  })

  it('menyorot lubang sasaran dan lubang seberang saat menembak', () => {
    const state = stateFrom(
      [
        [0, 1],
        [8, 1],
        [13, 5],
      ],
      PLAYER_A,
    )
    const { events } = applyMove(state, 0, rules)
    const tembakan = framesFor(state.board, events).find((f) => f.highlight === 'menembak')

    expect(tembakan).toBeDefined()
    expect(tembakan!.active).toBe(1)
    expect(tembakan!.secondary).toBe(13)
    expect(tembakan!.cells[7]).toBe(6)
    expect(tembakan!.hand).toBe(0)
  })

  it('memberi lumbung durasi lebih panjang daripada lubang biasa', () => {
    const state = stateFrom([[6, 3]], PLAYER_A)
    const frames = framesFor(state.board, applyMove(state, 6, rules).events)
    const bank = frames.find((f) => f.highlight === 'bank')!
    const sow = frames.find((f) => f.highlight === 'sow')!
    expect(frameDuration(bank)).toBeGreaterThan(frameDuration(sow))
    expect(frameDuration(frames[0])).toBe(0)
  })

  it('punya ringkasan tertulis untuk setiap event, demi gerak-terbatas', () => {
    const state = stateFrom(
      [
        [0, 1],
        [1, 3],
        [8, 1],
      ],
      PLAYER_A,
    )
    const { events } = applyMove(state, 0, rules)
    for (const event of events) {
      const line = describeEvent(event)
      expect(line.length).toBeGreaterThan(0)
      expect(line).not.toContain('undefined')
    }
  })

  it('bingkai awal tidak menyorot apa pun', () => {
    const frame = initialFrame(createGame().board)
    expect(frame.active).toBeNull()
    expect(frame.hand).toBe(0)
    expect(frame.highlight).toBe('none')
  })
})
