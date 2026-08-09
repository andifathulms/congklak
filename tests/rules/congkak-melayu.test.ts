import { describe, expect, it } from 'vitest'
import { applyMove } from '@/lib/engine/apply'
import { LUMBUNG_A, LUMBUNG_B, PLAYER_A, PLAYER_B } from '@/lib/engine/board'
import { countSeeds } from '@/lib/engine/conserve'
import { getRuleset } from '@/lib/rulesets'
import { alasanHenti, cellsOf, eventTypes, stateFrom } from '../helpers'

const melayu = getRuleset('congkak-melayu')
const umum = getRuleset('umum')

describe('syarat satu pusingan sebelum menembak', () => {
  // Sumber: JKKN Malaysia — "selepas melepasi rumah sendiri dan kembali ke
  // kawasan sendiri". Sebelum itu, mendarat di kampung kosong sendiri
  // hanyalah mati.

  it('tidak menembak kalau belum melewati rumah sendiri', () => {
    // A[0]=1 mendarat di A[1] yang kosong tanpa pernah menyentuh rumah A
    // di indeks 7. Di 'umum' ini tembakan; di sini hanya mati.
    const cells = [
      [0, 1],
      [8, 1],
      [13, 5],
    ] as const

    const { state: after, events } = applyMove(stateFrom(cells, PLAYER_A), 0, melayu)

    expect(eventTypes(events)).not.toContain('menembak')
    expect(after.board[LUMBUNG_A]).toBe(0)
    expect(after.board[1]).toBe(1) // biji ditinggal di tempatnya
    expect(after.board[13]).toBe(5) // seberang tidak tersentuh
    expect(after.toMove).toBe(PLAYER_B)
    expect(countSeeds(after.board)).toBe(7)

    // Pack umum, posisi yang sama, menembak 6 biji.
    const { state: lain } = applyMove(stateFrom(cells, PLAYER_A), 0, umum)
    expect(lain.board[LUMBUNG_A]).toBe(6)
  })

  it('menembak kalau pusingan sudah lengkap', () => {
    // A[6]=10 melewati rumah A di indeks 7, mengitari sisi B, dan kembali
    // ke A[1] yang kosong. Syaratnya terpenuhi.
    const state = stateFrom([[6, 10]], PLAYER_A)
    const { state: after, events } = applyMove(state, 6, melayu)

    expect(eventTypes(events)).toContain('menembak')
    // 1 biji tertabur ke rumah + tembakan 1 (biji pendaratan) + 1 seberang
    expect(after.board[LUMBUNG_A]).toBe(3)
    expect(after.board[LUMBUNG_B]).toBe(0)
    expect(countSeeds(after.board)).toBe(10)
  })

  it('menghitung pusingan lintas sambung, bukan per angkatan', () => {
    // Angkatan pertama melewati rumah A, sambungannya tidak. Tembakan di
    // akhir rantai tetap sah, karena pusingan dihitung untuk seluruh
    // giliran — lihat divergences pack ini.
    const state = stateFrom(
      [
        [6, 3],
        [8, 1],
        [12, 4],
      ],
      PLAYER_A,
    )
    const { state: after, events } = applyMove(state, 6, melayu)

    expect(eventTypes(events)).toContain('bank') // rumah sendiri dilewati
    expect(countSeeds(after.board)).toBe(after.seedsInPlay)
  })

  it('berlaku simetris untuk pemain B', () => {
    // B[8]=1 mendarat di B[9] yang kosong tanpa melewati rumah B di 15.
    const state = stateFrom(
      [
        [8, 1],
        [5, 4],
        [0, 1],
      ],
      PLAYER_B,
    )
    const { state: after, events } = applyMove(state, 8, melayu)

    expect(eventTypes(events)).not.toContain('menembak')
    expect(after.board[LUMBUNG_B]).toBe(0)
    expect(after.board[5]).toBe(4) // seberang dari 9 tidak tersentuh
  })

  it('mendarat di kampung kosong sisi lawan tetap tanpa tembakan', () => {
    const state = stateFrom(
      [
        [6, 2],
        [9, 1],
      ],
      PLAYER_A,
    )
    const { state: after, events } = applyMove(state, 6, melayu)
    expect(eventTypes(events)).toEqual(['scoop', 'bank', 'sow', 'henti', 'turnEnd'])
    expect(alasanHenti(events)).toEqual({ alasan: 'lubang-kosong-sisi-lawan', opsi: null })
    expect(after.board[LUMBUNG_A]).toBe(1)
  })

  it('sambung dan giliran tambahan tidak terpengaruh syarat pusingan', () => {
    // A[0]=1, A[1]=3 → sambung, lalu berhenti di A[5] yang kosong. Tanpa
    // melewati rumah, jadi tidak menembak — tapi sambungnya tetap jalan.
    const state = stateFrom(
      [
        [0, 1],
        [1, 3],
        [8, 1],
      ],
      PLAYER_A,
    )
    const { state: after, events } = applyMove(state, 0, melayu)

    expect(eventTypes(events)).toContain('relay')
    expect(eventTypes(events)).not.toContain('menembak')
    expect(cellsOf(after.board)).toEqual([0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0])
    expect(countSeeds(after.board)).toBe(5)
  })

  it('giliran tambahan di rumah sendiri tetap berlaku', () => {
    const state = stateFrom(
      [
        [0, 1],
        [6, 1],
      ],
      PLAYER_A,
    )
    const { state: after, events } = applyMove(state, 6, melayu)
    expect(eventTypes(events)).toContain('extraTurn')
    expect(after.toMove).toBe(PLAYER_A)
  })
})
