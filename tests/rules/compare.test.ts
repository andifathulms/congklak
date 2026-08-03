import { describe, expect, it } from 'vitest'
import { compareRulesets, contohLangkah } from '@/lib/engine/compare'
import { getRuleset } from '@/lib/rulesets'
import { createRng } from '@/lib/rng'
import { withOptions } from '../helpers'

const umum = getRuleset('umum')
const sleman = getRuleset('jawa-sleman')

describe('perbandingan ruleset', () => {
  it('menemukan simpang pertama antara umum dan jawa-sleman', () => {
    const rng = createRng(11)
    const moves = contohLangkah(umum, (n) => rng.next(n))
    const hasil = compareRulesets(moves, umum, sleman)

    expect(hasil.simpangDi).toBeGreaterThanOrEqual(0)
    expect(hasil.alasan).not.toBeNull()

    // Semua giliran sebelum simpang harus identik. Kalau ada yang tidak,
    // "simpang pertama" bukan yang pertama.
    for (let i = 0; i < hasil.simpangDi; i++) {
      expect(hasil.steps[i].sama).toBe(true)
    }
    expect(hasil.steps[hasil.simpangDi].sama).toBe(false)
  })

  it('menyimpang karena jawa-sleman berhenti lebih dulu, bukan karena penaburan beda', () => {
    // Kedua pack menabur dengan cara yang sama persis; yang berbeda hanya
    // kapan permainan dinyatakan selesai dan apa yang dihitung.
    const rng = createRng(5)
    const moves = contohLangkah(umum, (n) => rng.next(n))
    const hasil = compareRulesets(moves, umum, sleman)

    expect(hasil.alasan).toBe('satu-sudah-selesai')
    expect(hasil.finalKanan.status).toBe('selesai')
    expect(hasil.finalKiri.status).toBe('berjalan')
  })

  it('tidak menemukan simpang apa pun antara satu pack dan dirinya sendiri', () => {
    const rng = createRng(9)
    const moves = contohLangkah(umum, (n) => rng.next(n))
    const hasil = compareRulesets(moves, umum, umum)

    expect(hasil.simpangDi).toBe(-1)
    expect(hasil.alasan).toBeNull()
    expect(hasil.steps.every((s) => s.sama)).toBe(true)
    expect(hasil.steps).toHaveLength(moves.length)
  })

  it('menandai langkah yang jadi tak sah di satu sisi', () => {
    const rng = createRng(3)
    const moves = contohLangkah(umum, (n) => rng.next(n))
    const hasil = compareRulesets(moves, umum, sleman)

    const step = hasil.steps[hasil.simpangDi]
    // Di titik simpang, satu sisi masih bisa jalan dan satunya tidak.
    expect(step.kiri === null || step.kanan === null || !step.sama).toBe(true)
  })

  it('menemukan simpang yang murni soal isi lumbung, bukan soal berhenti', () => {
    // Dua pack yang hanya beda pada menembak saat seberang kosong. Syarat
    // berhentinya sama, jadi simpangnya harus 'papan-berbeda'.
    const longgar = umum
    const ketat = withOptions(umum, {
      menembak: { enabled: true, requireOppositeNonEmpty: true, requireLapCompleted: false },
    })

    const rng = createRng(21)
    const moves = contohLangkah(longgar, (n) => rng.next(n))
    const hasil = compareRulesets(moves, longgar, ketat)

    expect(hasil.simpangDi).toBeGreaterThanOrEqual(0)
    expect(hasil.alasan).toBe('papan-berbeda')
  })

  it('daftar langkah kosong tidak menyimpang', () => {
    const hasil = compareRulesets([], umum, sleman)
    expect(hasil.simpangDi).toBe(-1)
    expect(hasil.steps).toHaveLength(0)
  })
})
