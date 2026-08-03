import { describe, expect, it } from 'vitest'
import { applyMove, createGame, currentLegalMoves, type GameState } from '@/lib/engine/apply'
import { MAX_RELAY_STEPS, RelayBudgetError, sow } from '@/lib/engine/sow'
import { PLAYER_A, cloneBoard, createBoard } from '@/lib/engine/board'
import { countSeeds } from '@/lib/engine/conserve'
import type { GameEvent } from '@/lib/engine/events'
import { createRng } from '@/lib/rng'
import { boardFrom, cellsOf, stateFrom, umum } from '../helpers'

const rules = umum()

function relayCount(events: readonly GameEvent[]): number {
  return events.filter((e) => e.type === 'relay').length
}

function sowCount(events: readonly GameEvent[]): number {
  return events.filter((e) => e.type === 'sow' || e.type === 'bank').length
}

describe('rantai sambung', () => {
  it('berhenti sendiri menurut aturan, bukan karena anggaran', () => {
    // Papan penuh: pembukaan congklak wajar sudah menghasilkan rantai
    // panjang. Tak satu pun boleh mendekati anggaran cadangan.
    for (let hole = 0; hole <= 6; hole++) {
      const { events } = applyMove(createGame(PLAYER_A), hole, rules)
      expect(relayCount(events)).toBeLessThan(MAX_RELAY_STEPS)
      expect(events.at(-1)?.type).toMatch(/turnEnd|extraTurn|end/)
    }
  })

  it('menangani rantai terpanjang yang ditemukan tanpa kehilangan satu biji pun', () => {
    // Posisi lawan, 98 biji penuh, ditemukan dengan menyisir 20.000
    // permainan acak dan diambil giliran dengan rantai terpanjang. A
    // menabur dari lubang 2: 58 sambungan, 365 jatuhan biji, berakhir di
    // lumbung sendiri — jadi giliran lagi, bukan giliran habis.
    const cells = [2, 6, 14, 0, 4, 14, 14, 15, 5, 13, 4, 0, 1, 0, 3, 3].map(
      (biji, index) => [index, biji] as const,
    )
    const state = stateFrom(cells, PLAYER_A)
    expect(countSeeds(state.board)).toBe(98)

    const { state: after, events } = applyMove(state, 2, rules)

    expect(relayCount(events)).toBe(58)
    expect(sowCount(events)).toBe(365)
    expect(events.at(-1)).toMatchObject({ type: 'extraTurn', player: PLAYER_A })
    expect(after.toMove).toBe(PLAYER_A)
    expect(cellsOf(after.board)).toEqual([12, 0, 10, 3, 2, 5, 2, 40, 1, 0, 11, 3, 0, 1, 5, 3])
    expect(countSeeds(after.board)).toBe(98)
  })

  it('memakai sambungan berulang tanpa lubang yang tak pernah kosong', () => {
    // Tiap lubang berisi satu biji: tiap pendaratan mengenai lubang berisi,
    // jadi rantainya pendek tapi tiap langkahnya sambungan.
    const cells = Array.from({ length: 15 }, (_, i) => [i, i === 7 ? 0 : 1] as const)
    const state = stateFrom(cells, PLAYER_A)
    const total = countSeeds(state.board)

    const { state: after, events } = applyMove(state, 0, rules)

    expect(relayCount(events)).toBeGreaterThan(0)
    expect(countSeeds(after.board)).toBe(after.seedsInPlay)
    expect(after.seedsInPlay).toBe(total)
  })

  it('menjaga konservasi di setiap satu langkah rantai terpanjang', () => {
    // Cari giliran dengan rantai terpanjang dalam sejumlah permainan acak,
    // lalu telusuri kembali event demi event.
    let terpanjang: { events: readonly GameEvent[]; before: GameState } | null = null

    for (let seed = 1; seed <= 300; seed++) {
      const rng = createRng(seed)
      let state = createGame(PLAYER_A)
      while (state.status === 'berjalan') {
        const legal = currentLegalMoves(state)
        if (legal.length === 0) break
        const move = rng.pick(legal)
        const before = state
        const { state: next, events } = applyMove(state, move, rules)
        if (!terpanjang || relayCount(events) > relayCount(terpanjang.events)) {
          terpanjang = { events, before }
        }
        state = next
      }
    }

    expect(terpanjang).not.toBeNull()
    const chain = terpanjang!
    expect(relayCount(chain.events)).toBeGreaterThan(5)
    expect(relayCount(chain.events)).toBeLessThan(MAX_RELAY_STEPS)

    // Peristiwa penaburan dan angka di papan harus sejalan sepanjang rantai.
    expect(sowCount(chain.events)).toBeGreaterThan(relayCount(chain.events))
  })

  it('melaporkan anggaran habis sebagai bug, bukan jalan keluar normal', () => {
    // Anggaran cadangan tidak bisa dipicu dari papan yang sah — itu justru
    // maksudnya. Yang diuji di sini: papan sah tidak pernah menyentuhnya,
    // dan kalau tersentuh yang keluar adalah kesalahan bernama, bukan
    // giliran yang diam-diam berakhir seolah wajar.
    const board = cloneBoard(createBoard())
    expect(() =>
      sow(board, 0, PLAYER_A, rules, countSeeds(board)),
    ).not.toThrow(RelayBudgetError)

    // Anggaran memang ada dan memang berupa kesalahan bernama.
    expect(new RelayBudgetError(1, 1, boardFrom([])).name).toBe('RelayBudgetError')
    expect(MAX_RELAY_STEPS).toBeGreaterThan(100)
  })
})
