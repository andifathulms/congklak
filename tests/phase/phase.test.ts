import { describe, expect, it } from 'vitest'
import { applyMove, createGame, currentLegalMoves } from '@/lib/engine/apply'
import { PLAYER_A, PLAYER_B } from '@/lib/engine/board'
import { createRng } from '@/lib/rng'
import { phaseOf, wilayahDi, type Phase } from '@/lib/phase'
import { umum } from '../helpers'

const ruleset = umum()

describe('phaseOf', () => {
  it('siap sebelum langkah pertama', () => {
    expect(phaseOf({ movesPlayed: 0, status: 'berjalan', busy: false })).toBe('siap')
  })

  it('main saat langkah pertama sedang ditabur — movesPlayed masih 0', () => {
    expect(phaseOf({ movesPlayed: 0, status: 'berjalan', busy: true })).toBe('main')
  })

  it('setelah begitu langkah selesai ditabur dan permainan berlanjut', () => {
    expect(phaseOf({ movesPlayed: 1, status: 'berjalan', busy: false })).toBe('setelah')
  })

  it('main lagi begitu langkah berikutnya mulai ditabur', () => {
    expect(phaseOf({ movesPlayed: 1, status: 'berjalan', busy: true })).toBe('main')
  })

  it('selesai begitu status berjalan menjadi selesai dan animasinya sudah berhenti', () => {
    expect(phaseOf({ movesPlayed: 8, status: 'selesai', busy: false })).toBe('selesai')
  })

  it('busy menang atas status: selagi bingkai terakhir masih diputar, tetap main', () => {
    // `status` yang dibawa di sini masih status SEBELUM langkah yang sedang
    // ditabur — component belum menulis `next` ke state. Kalau langkah ini
    // yang mengakhiri permainan, `status` masih 'berjalan' pada titik ini,
    // tapi diuji juga dengan 'selesai' untuk memastikan busy tetap menang
    // walau pemanggilnya keliru meneruskan status yang salah.
    expect(phaseOf({ movesPlayed: 7, status: 'selesai', busy: true })).toBe('main')
  })
})

describe('phaseOf — permainan acak yang direkam', () => {
  const JUMLAH_PERMAINAN = 25

  for (let seed = 1; seed <= JUMLAH_PERMAINAN; seed++) {
    it(`permainan #${seed}: fase mengikuti status GameState per giliran`, () => {
      const rng = createRng(seed)
      let state = createGame(seed % 2 === 0 ? PLAYER_A : PLAYER_B)
      let movesPlayed = 0

      // Sebelum langkah apa pun direkam: siap.
      expect(phaseOf({ movesPlayed, status: state.status, busy: false })).toBe('siap')

      const faseTerlihat = new Set<Phase>(['siap'])

      while (state.status === 'berjalan') {
        const legal = currentLegalMoves(state)
        if (legal.length === 0) break
        const move = rng.pick(legal)

        // Selagi langkah ini "ditabur" (busy), fase selalu main — tidak
        // peduli berapa movesPlayed atau apa status sebelum langkah ini.
        expect(phaseOf({ movesPlayed, status: state.status, busy: true })).toBe('main')

        const { state: next } = applyMove(state, move, ruleset)
        state = next
        movesPlayed += 1

        // Begitu bingkai terakhirnya berhenti (busy: false), fase membaca
        // status GameState yang baru: setelah kalau berlanjut, selesai
        // kalau langkah ini yang mengakhirinya — never 'siap' lagi, dan
        // tidak pernah kembali ke 'main' tanpa langkah baru.
        const fase = phaseOf({ movesPlayed, status: state.status, busy: false })
        expect(fase).toBe(state.status === 'selesai' ? 'selesai' : 'setelah')
        faseTerlihat.add(fase)
      }

      // Setiap permainan acak yang cukup panjang harus benar-benar melalui
      // ketiga fase turn-taking — kalau tidak, salah satu cabang di
      // phaseOf tidak pernah teruji oleh jalur ini.
      expect(faseTerlihat.has('setelah')).toBe(true)
      expect(faseTerlihat.has('selesai')).toBe(true)
    })
  }
})

describe('wilayahDi', () => {
  it('siap: hanya papan, pemilihAturan, panelMode — tidak ada skor, riwayat, statistik', () => {
    const wilayah = wilayahDi('siap', false)
    expect(wilayah).toEqual(['papan', 'pemilihAturan', 'panelMode'])
    expect(wilayah).not.toContain('skor')
    expect(wilayah).not.toContain('riwayat')
    expect(wilayah).not.toContain('statistik')
    expect(wilayah).not.toContain('aturanLain')
  })

  it('main: papan, skor, kendaliGiliran, pratinjau, riwayat, kodePermainan — tidak pemilihAturan atau statistik', () => {
    const wilayah = wilayahDi('main', false)
    expect(wilayah).toEqual(['papan', 'skor', 'kendaliGiliran', 'pratinjau', 'riwayat', 'kodePermainan'])
    expect(wilayah).not.toContain('pemilihAturan')
    expect(wilayah).not.toContain('panelMode')
    expect(wilayah).not.toContain('statistik')
    expect(wilayah).not.toContain('aturanLain')
  })

  it('main tidak pernah menampilkan aturanLain, bahkan kalau langkahnya bersimpang', () => {
    expect(wilayahDi('main', true)).not.toContain('aturanLain')
  })

  it('setelah: sama seperti main, plus aturanLain hanya kalau langkahnya bersimpang', () => {
    expect(wilayahDi('setelah', false)).toEqual(wilayahDi('main', false))
    expect(wilayahDi('setelah', true)).toEqual([...wilayahDi('main', false), 'aturanLain'])
  })

  it('selesai: main ditambah statistik, plus aturanLain kalau langkah terakhir bersimpang — bukan pengganti main', () => {
    // kendaliGiliran dan pratinjau tetap ada: mengurungkan langkah yang
    // mengakhiri permainan, dan membaca kenapa langkah itu tidak menembak,
    // adalah kemampuan yang sudah ada dan tidak diminta dilepas.
    expect(wilayahDi('selesai', false)).toEqual([...wilayahDi('main', false), 'statistik'])
    expect(wilayahDi('selesai', true)).toEqual([
      ...wilayahDi('main', false),
      'statistik',
      'aturanLain',
    ])
    expect(wilayahDi('selesai', false)).toContain('kendaliGiliran')
    expect(wilayahDi('selesai', false)).toContain('pratinjau')
    expect(wilayahDi('selesai', false)).not.toContain('pemilihAturan')
    expect(wilayahDi('selesai', false)).not.toContain('panelMode')
  })
})
