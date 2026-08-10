import { describe, expect, it } from 'vitest'
import { applyMove, currentLegalMoves } from '@/lib/engine/apply'
import { PLAYER_A, isLegalMove, lumbungOf } from '@/lib/engine/board'
import { countSeeds } from '@/lib/engine/conserve'
import { PELAJARAN, PELAJARAN_RULESET, type Klaim } from '@/lib/learn/pelajaran'
import { getRuleset } from '@/lib/rulesets'
import { stateFrom } from '../helpers'

const rules = getRuleset(PELAJARAN_RULESET)

/**
 * Setiap pelajaran menyatakan apa yang akan terjadi. Di sini pernyataan itu
 * diadu dengan mesin. Pelajaran yang menjanjikan tembakan lalu tidak
 * menghasilkannya mengajarkan aturan yang salah — lebih buruk daripada
 * tidak mengajarkan apa-apa.
 */
function periksaKlaim(cells: Parameters<typeof stateFrom>[0], hole: number, klaim: Klaim) {
  const state = stateFrom(cells, PLAYER_A)
  const lumbung = lumbungOf(PLAYER_A)
  const sebelum = state.board[lumbung]
  const { state: after, events } = applyMove(state, hole, rules)
  const jenis = events.map((e) => e.type)

  if (klaim.relay !== undefined) expect(jenis.includes('relay')).toBe(klaim.relay)
  if (klaim.menembak !== undefined) expect(jenis.includes('menembak')).toBe(klaim.menembak)
  if (klaim.extraTurn !== undefined) expect(jenis.includes('extraTurn')).toBe(klaim.extraTurn)
  if (klaim.keLumbung !== undefined) {
    expect(after.board[lumbung] - sebelum).toBe(klaim.keLumbung)
  }
  if (klaim.toMoveAfter !== undefined) expect(after.toMove).toBe(klaim.toMoveAfter)

  expect(countSeeds(after.board)).toBe(after.seedsInPlay)
}

describe('mode belajar', () => {
  it('punya empat pelajaran dengan id yang berbeda', () => {
    expect(PELAJARAN).toHaveLength(4)
    expect(new Set(PELAJARAN.map((p) => p.id)).size).toBe(4)
    // Menabur lebih dulu: tiga pelajaran lama semuanya kasus khusus dari
    // aturan yang tidak pernah diajarkan.
    expect(PELAJARAN.map((p) => p.id)).toEqual(['menabur', 'sambung', 'jalan-lagi', 'menembak'])
  })

  describe.each(PELAJARAN.map((p) => [p.id, p] as const))('%s', (_id, pelajaran) => {
    it('menempatkan jawaban dan pembanding sebagai langkah sah pemain A', () => {
      const state = stateFrom(pelajaran.cells, PLAYER_A)
      expect(isLegalMove(state.board, PLAYER_A, pelajaran.jawaban)).toBe(true)
      expect(isLegalMove(state.board, PLAYER_A, pelajaran.pembanding)).toBe(true)
      expect(pelajaran.jawaban).not.toBe(pelajaran.pembanding)
    })

    it('menepati apa yang dijanjikan jawabannya', () => {
      periksaKlaim(pelajaran.cells, pelajaran.jawaban, pelajaran.klaim)
    })

    it('menepati apa yang dijanjikan pembandingnya', () => {
      periksaKlaim(pelajaran.cells, pelajaran.pembanding, pelajaran.klaimPembanding)
    })

    it('benar-benar membedakan jawaban dari pembanding', () => {
      // Kalau kedua langkah menghasilkan hal yang sama, tidak ada yang
      // diajarkan — posisinya cuma tampak seperti pelajaran.
      expect(pelajaran.klaim).not.toEqual(pelajaran.klaimPembanding)
    })

    it('menawarkan pilihan, bukan satu-satunya langkah', () => {
      const state = stateFrom(pelajaran.cells, PLAYER_A)
      expect(currentLegalMoves(state).length).toBeGreaterThan(1)
    })

    it('punya teks dalam kedua bahasa', () => {
      for (const teks of [pelajaran.judul, pelajaran.ajakan, pelajaran.kenapa, pelajaran.meleset]) {
        expect(teks.id.length).toBeGreaterThan(3)
        expect(teks.en.length).toBeGreaterThan(3)
      }
    })
  })

  it('pelajaran menembak memang mengajarkan memilih tembakan terbesar', () => {
    // Kedua langkah menembak; yang membedakan besarnya. Kalau selisihnya
    // menyempit, pelajarannya kehilangan maksudnya.
    const menembak = PELAJARAN.find((p) => p.id === 'menembak')!
    expect(menembak.klaim.keLumbung! - menembak.klaimPembanding.keLumbung!).toBeGreaterThan(8)
  })
})
