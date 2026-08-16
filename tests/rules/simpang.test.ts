import { describe, expect, it } from 'vitest'
import { PLAYER_A } from '@/lib/engine/board'
import { pratinjauSimpang, BATAS_TAMPIL_SIMPANG } from '@/components/preview/simpang'
import { RULESETS, getRuleset } from '@/lib/rulesets'
import { stateFrom } from '../helpers'

const umum = getRuleset('umum')
const sleman = getRuleset('jawa-sleman')
const melayu = getRuleset('congkak-melayu')

describe('pratinjauSimpang', () => {
  it('semua pack sepakat pada papan penuh: tidak ada yang bersimpang', () => {
    // Satu sowing biasa di papan penuh: tidak ada lubang kosong untuk
    // menembak, tidak ada sambungan, dan belum ada apa pun yang bisa
    // membedakan tiga pack ini (tests/rules/aturan-lain.test.ts membuktikan
    // hal yang sama di tingkat satu langkah penuh).
    const state = stateFrom(
      Array.from({ length: 7 }, (_, i) => [i, 7] as const).concat(
        Array.from({ length: 7 }, (_, i) => [8 + i, 7] as const),
      ),
      PLAYER_A,
    )
    const hasil = pratinjauSimpang(state, 6, umum)
    expect(hasil.aktif).not.toBeNull()
    expect(hasil.berbeda).toEqual([])
  })

  it('pasangan umum/jawa-sleman: tiga-lubang-kosong mengakhiri permainan hanya di sana', () => {
    // A[6]=1 → menabur satu biji ke lumbung sendiri (giliran lagi di
    // ketiganya). Sisi B sudah punya tiga lubang kosong (8,9,10) dari
    // awal, jadi tiga-lubang-kosong jawa-sleman langsung menyala begitu
    // langkah ini selesai — tak-ada-langkah umum/congkak-melayu tidak,
    // karena B masih punya lubang berisi untuk giliran berikutnya.
    const state = stateFrom(
      [
        [0, 2],
        [1, 2],
        [2, 2],
        [3, 2],
        [4, 2],
        [5, 2],
        [6, 1],
        [8, 0],
        [9, 0],
        [10, 0],
        [11, 2],
        [12, 2],
        [13, 2],
        [14, 2],
      ],
      PLAYER_A,
    )
    const hasil = pratinjauSimpang(state, 6, umum, [umum, sleman])

    expect(hasil.aktif?.mengakhiriPermainan).toBe(false)
    expect(hasil.berbeda).toHaveLength(1)
    expect(hasil.berbeda[0].ruleset.id).toBe('jawa-sleman')
    expect(hasil.berbeda[0].pratinjau?.mengakhiriPermainan).toBe(true)
    expect(hasil.berbeda[0].teks).toBe('permainan berakhir di sini')
  })

  it('pasangan umum/congkak-melayu: requireLapCompleted menahan tembakan yang langsung menyala di umum', () => {
    // A[0]=1 mendarat di A[1] yang kosong, seberangnya (13) berisi 5 —
    // menembak langsung di umum dan jawa-sleman. congkak-melayu menuntut
    // satu pusingan penuh dulu (menembak.requireLapCompleted), dan satu
    // biji tunggal tidak pernah menyelesaikan pusingan apa pun, jadi di
    // sana biji itu cuma berhenti di lubang kosong tanpa menembak.
    const state = stateFrom(
      [
        [0, 1],
        [2, 2],
        [3, 2],
        [4, 2],
        [5, 2],
        [6, 2],
        [8, 1],
        [9, 2],
        [10, 2],
        [11, 2],
        [12, 2],
        [13, 5],
        [14, 2],
      ],
      PLAYER_A,
    )
    const hasil = pratinjauSimpang(state, 0, umum, [umum, melayu])

    expect(hasil.aktif?.menembak).toBe(6)
    expect(hasil.berbeda).toHaveLength(1)
    expect(hasil.berbeda[0].ruleset.id).toBe('congkak-melayu')
    expect(hasil.berbeda[0].pratinjau?.menembak).toBe(0)
    expect(hasil.berbeda[0].teks).toBe('tidak menembak di sini')
  })

  it('batas tampil dua pack: jawa-sleman dan congkak-melayu bersimpang sekaligus, dari umum yang sama', () => {
    // Sama seperti fixture requireLapCompleted di atas, tapi tanpa lubang
    // pengisi A[2..6]/B[9..12,14] — sisi A jadi kosong seluruhnya sesudah
    // langkah ini (tujuh lubang), jadi tiga-lubang-kosong jawa-sleman ikut
    // menyala di saat yang sama congkak-melayu menahan tembakannya. Dengan
    // hanya tiga pack yang ada, "dua pack lain" memang batas tertingginya
    // — bukan kasus potong-di-tengah, karena tidak ada pack keempat untuk
    // dipotong.
    const state = stateFrom(
      [
        [0, 1],
        [8, 1],
        [13, 5],
      ],
      PLAYER_A,
    )
    const hasil = pratinjauSimpang(state, 0, umum)

    expect(hasil.berbeda).toHaveLength(RULESETS.length - 1)
    expect(hasil.berbeda.length).toBeLessThanOrEqual(BATAS_TAMPIL_SIMPANG)
    expect(hasil.berbeda.map((b) => b.ruleset.id).sort()).toEqual([
      'congkak-melayu',
      'jawa-sleman',
    ])
  })

  it('tidak pernah membandingkan pack aktif dengan dirinya sendiri', () => {
    const state = stateFrom([[0, 1]], PLAYER_A)
    const hasil = pratinjauSimpang(state, 0, umum)
    expect(hasil.berbeda.some((b) => b.ruleset.id === umum.id)).toBe(false)
  })
})
