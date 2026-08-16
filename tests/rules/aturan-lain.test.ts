import { describe, expect, it } from 'vitest'
import { adaSimpang } from '@/components/game/AturanLain'
import { contohLangkah } from '@/lib/engine/compare'
import { getRuleset } from '@/lib/rulesets'
import { createRng } from '@/lib/rng'

const umum = getRuleset('umum')

describe('adaSimpang', () => {
  it('daftar langkah kosong tidak pernah bersimpang', () => {
    expect(adaSimpang([], umum)).toBe(false)
  })

  it('true begitu sebuah permainan penuh memang bersimpang pada satu pack lain', () => {
    const rng = createRng(11)
    const moves = contohLangkah(umum, (n) => rng.next(n))
    expect(adaSimpang(moves, umum)).toBe(true)
  })

  it('false selagi belum ada langkah yang bisa membedakan pack mana pun — satu langkah pembuka di papan penuh', () => {
    // Papan penuh, satu sowing biasa: tidak ada lubang kosong untuk
    // menembak, tidak ada sambungan, dan belum ada giliran yang bisa
    // berhenti berbeda antar pack. Tiga pack itu harus tetap sepakat.
    const rng = createRng(11)
    const satuLangkah = contohLangkah(umum, (n) => rng.next(n)).slice(0, 1)
    expect(adaSimpang(satuLangkah, umum)).toBe(false)
  })
})
