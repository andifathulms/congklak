import { describe, expect, it } from 'vitest'
import { applyMove, createGame, currentLegalMoves, type GameState } from '@/lib/engine/apply'
import { PLAYER_A } from '@/lib/engine/board'
import { assertConservation, countSeeds } from '@/lib/engine/conserve'
import { hashOf } from '@/lib/engine/hash'
import { RULESETS, getRuleset, type Ruleset } from '@/lib/rulesets'
import { BARIS_ATAS, BARIS_BAWAH } from '@/components/board/Papan'
import { opposite } from '@/lib/engine/board'
import { createRng } from '@/lib/rng'

const umum = getRuleset('umum')
const sleman = getRuleset('jawa-sleman')
const melayu = getRuleset('congkak-melayu')

/** Semua kunci opsi tempat dua pack boleh berbeda. */
function optionKeys(r: Ruleset): Record<string, string> {
  return {
    relay: String(r.options.relay),
    extraTurnOnOwnLumbung: String(r.options.extraTurnOnOwnLumbung),
    'menembak.enabled': String(r.options.menembak.enabled),
    'menembak.requireOppositeNonEmpty': String(r.options.menembak.requireOppositeNonEmpty),
    'menembak.requireLapCompleted': String(r.options.menembak.requireLapCompleted),
    terminal: r.options.terminal,
    finalSweep: r.options.finalSweep,
  }
}

function bedanya(a: Ruleset, b: Ruleset): string[] {
  const ka = optionKeys(a)
  const kb = optionKeys(b)
  // Kunci diurutkan — tidak ada yang bergantung pada urutan Object.keys.
  return Object.keys(ka)
    .sort()
    .filter((key) => ka[key] !== kb[key])
}

describe('pemisahan ruleset', () => {
  it('umum dan jawa-sleman hanya berbeda pada syarat berhenti dan sapu akhir', () => {
    // Kalau daftar ini bertambah, ada aturan yang bocor antar-pack dan
    // perbedaannya tidak punya sumber. Perbedaan yang disengaja saja.
    expect(bedanya(umum, sleman)).toEqual(['finalSweep', 'terminal'])
  })

  it('umum dan congkak-melayu hanya berbeda pada syarat satu pusingan', () => {
    // Satu opsi, satu sumber. Pack yang berbeda di tempat yang tidak ada
    // sumbernya bukan ruleset, hanya selera.
    expect(bedanya(umum, melayu)).toEqual(['menembak.requireLapCompleted'])
  })

  it('congkak-melayu berbeda dari jawa-sleman di ketiga tempat itu sekaligus', () => {
    expect(bedanya(melayu, sleman)).toEqual([
      'finalSweep',
      'menembak.requireLapCompleted',
      'terminal',
    ])
  })

  it('setiap perbedaan yang disengaja tercatat di daftar divergences', () => {
    for (const pack of RULESETS) {
      expect(pack.divergences.length).toBeGreaterThan(0)
      for (const d of pack.divergences) {
        // Setiap sumber yang dirujuk sebuah perbedaan harus benar-benar
        // ada di pack itu; rujukan yang menggantung tidak bisa ditelusuri.
        for (const title of d.sources) {
          expect(pack.sources.map((s) => s.title)).toContain(title)
        }
      }
    }
  })

  it('setiap pack menyajikan arah yang sama dengan yang dinyatakan sumbernya', () => {
    // Ketiga sumber utama menyebut menyebar searah jarum jam.
    for (const pack of RULESETS) {
      expect(pack.presentation.direction).toBe('searah-jarum-jam')
    }
  })

  it('daftar langkah yang sama menyimpang hanya di tempat aturannya memang beda', () => {
    // Satu daftar langkah, dua ruleset. Sebelum titik simpang, tiap giliran
    // harus menghasilkan papan yang sama persis di kedua pack.
    const rng = createRng(2026)
    let a: GameState = createGame(PLAYER_A)
    let b: GameState = createGame(PLAYER_A)
    let simpang = -1
    const moves: number[] = []

    for (let turn = 0; turn < 200; turn++) {
      if (a.status === 'selesai' || b.status === 'selesai') break
      const legal = currentLegalMoves(a)
      if (legal.length === 0) break
      const move = rng.pick(legal)
      moves.push(move)

      a = applyMove(a, move, umum).state
      b = applyMove(b, move, sleman).state

      if (hashOf(a, 'x') !== hashOf(b, 'x')) {
        simpang = turn
        break
      }
    }

    // Simpangnya harus benar-benar terjadi — kalau tidak, pack keduanya
    // tidak membedakan apa pun dan tidak layak jadi pack terpisah.
    expect(simpang).toBeGreaterThanOrEqual(0)

    // Dan simpang pertama harus jatuh tepat di giliran tempat jawa-sleman
    // berhenti lebih awal, bukan di tengah penaburan biasa.
    expect(b.status).toBe('selesai')
    expect(a.status).toBe('berjalan')
  })

  it('setiap pack menjaga biji tetap terhitung sepanjang permainan penuh', () => {
    for (const pack of RULESETS) {
      for (let seed = 1; seed <= 200; seed++) {
        const rng = createRng(seed)
        let state = createGame(PLAYER_A)
        while (state.status === 'berjalan') {
          const legal = currentLegalMoves(state)
          if (legal.length === 0) break
          state = applyMove(state, rng.pick(legal), pack).state
          assertConservation(state.board, `${pack.id} seed ${seed}`, state.seedsInPlay)
        }
        expect(state.status).toBe('selesai')

        // Hanya pack yang membuang biji yang boleh turun dari 98.
        if (pack.options.finalSweep === 'dibuang') {
          expect(countSeeds(state.board)).toBeLessThanOrEqual(98)
        } else {
          expect(countSeeds(state.board)).toBe(98)
        }
      }
    }
  })

  it('id pack stabil — id muncul di kode permainan dan jabat tangan P2P', () => {
    expect(RULESETS.map((r) => r.id).sort()).toEqual([
      'congkak-melayu',
      'jawa-sleman',
      'umum',
    ])
  })
})

describe('tata letak papan', () => {
  /**
   * Papan sempat digambar berlawanan arah jarum jam sementara kedua
   * sumbernya menyebut searah jarum jam. Uji ini ada supaya papan tidak
   * bisa lagi diam-diam membantah kutipannya sendiri.
   */
  it('menempatkan lubang seberang tepat berhadapan atas-bawah', () => {
    expect(BARIS_ATAS).toHaveLength(7)
    expect(BARIS_BAWAH).toHaveLength(7)
    for (let k = 0; k < 7; k++) {
      expect(opposite(BARIS_BAWAH[k])).toBe(BARIS_ATAS[k])
    }
  })

  it('menjalankan penaburan pemain A searah jarum jam di layar', () => {
    // Indeks naik: baris bawah bergerak ke kiri, baris atas ke kanan.
    // Itulah yang membuat lintasannya terbaca searah jarum jam.
    for (let k = 0; k < 6; k++) {
      expect(BARIS_BAWAH[k + 1]).toBe(BARIS_BAWAH[k] - 1)
      expect(BARIS_ATAS[k + 1]).toBe(BARIS_ATAS[k] + 1)
    }
  })
})
