import { describe, expect, it } from 'vitest'
import { IllegalMoveError, applyMove, createGame } from '@/lib/engine/apply'
import { LUMBUNG_A, LUMBUNG_B, PLAYER_A, PLAYER_B } from '@/lib/engine/board'
import { countSeeds } from '@/lib/engine/conserve'
import { cellsOf, eventTypes, stateFrom, umum, withOptions } from '../helpers'

const rules = umum()

describe('sow sederhana', () => {
  // Papan: A[6]=3. A menabur dari 6 → lumbung A, lalu B[8], B[9].
  // Biji terakhir mendarat di lubang kosong milik lawan → giliran habis.
  it('menjatuhkan satu biji per posisi dan mengakhiri giliran di lubang kosong lawan', () => {
    const state = stateFrom([[6, 3]], PLAYER_A)
    const { state: after, events } = applyMove(state, 6, rules)

    expect(cellsOf(after.board)).toEqual([0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0])
    expect(eventTypes(events)).toEqual(['scoop', 'bank', 'sow', 'sow', 'turnEnd'])
    expect(after.toMove).toBe(PLAYER_B)
    expect(after.status).toBe('berjalan')
    expect(countSeeds(after.board)).toBe(3)
  })
})

describe('lumbung lawan dilewati', () => {
  // Papan: A[6]=10. Sepuluh biji melewati seluruh sisi B; indeks 15 —
  // lumbung B — tidak boleh menerima satu pun. Universal di semua varian.
  it('tidak pernah menjatuhkan biji ke lumbung lawan', () => {
    const state = stateFrom([[6, 10]], PLAYER_A)
    const { state: after, events } = applyMove(state, 6, rules)

    expect(after.board[LUMBUNG_B]).toBe(0)
    expect(events.some((e) => 'index' in e && e.index === LUMBUNG_B)).toBe(false)
    expect(countSeeds(after.board)).toBe(10)
  })

  it('berlaku simetris untuk pemain B', () => {
    // B menabur 10 biji dari 14: lumbung B, lalu 0–6, lalu 8 dan 9,
    // melewati lumbung A di indeks 7. Biji terakhir mendarat di B[9] yang
    // kosong → menembak lubang seberang 5, yang baru saja terisi satu.
    const state = stateFrom([[14, 10]], PLAYER_B)
    const { state: after } = applyMove(state, 14, rules)

    expect(after.board[LUMBUNG_A]).toBe(0)
    expect(after.board[LUMBUNG_B]).toBe(3) // 1 tabur + tembakan 1 + 1
    expect(countSeeds(after.board)).toBe(10)
  })
})

describe('jalan lagi', () => {
  // Papan: A[0]=1, A[6]=1. Biji terakhir jatuh di lumbung sendiri.
  it('mengembalikan giliran ke pemain yang sama', () => {
    const state = stateFrom(
      [
        [0, 1],
        [6, 1],
      ],
      PLAYER_A,
    )
    const { state: after, events } = applyMove(state, 6, rules)

    expect(after.board[LUMBUNG_A]).toBe(1)
    expect(after.toMove).toBe(PLAYER_A)
    expect(eventTypes(events)).toEqual(['scoop', 'bank', 'extraTurn'])
    // Giliran lagi tidak memancarkan turnEnd.
    expect(eventTypes(events)).not.toContain('turnEnd')
  })
})

describe('menembak', () => {
  // Papan: A[0]=1, B[13]=5, B[8]=1. Biji terakhir mendarat di A[1] yang
  // kosong → biji itu plus isi lubang seberang (13) masuk lumbung A.
  it('mengambil biji pendaratan beserta isi lubang seberang', () => {
    const state = stateFrom(
      [
        [0, 1],
        [8, 1],
        [13, 5],
      ],
      PLAYER_A,
    )
    const { state: after, events } = applyMove(state, 0, rules)

    expect(after.board[LUMBUNG_A]).toBe(6)
    expect(after.board[1]).toBe(0)
    expect(after.board[13]).toBe(0)
    expect(after.toMove).toBe(PLAYER_B)

    const tembakan = events.find((e) => e.type === 'menembak')
    expect(tembakan).toMatchObject({
      lubang: 1,
      seberang: 13,
      dariLubang: 1,
      dariSeberang: 5,
      total: 6,
      player: PLAYER_A,
    })
    expect(countSeeds(after.board)).toBe(7)
  })

  it('tidak menembak saat mendarat di lubang kosong sisi lawan', () => {
    // Papan: A[6]=2, B[9]=1. Biji terakhir mendarat di B[8] yang kosong.
    const state = stateFrom(
      [
        [6, 2],
        [9, 1],
      ],
      PLAYER_A,
    )
    const { state: after, events } = applyMove(state, 6, rules)

    expect(after.board[LUMBUNG_A]).toBe(1)
    expect(after.board[8]).toBe(1)
    expect(eventTypes(events)).toEqual(['scoop', 'bank', 'sow', 'turnEnd'])
    expect(countSeeds(after.board)).toBe(3)
  })

  it('tetap mengambil biji pendaratan walau lubang seberang kosong', () => {
    // Bacaan pack umum. Lihat divergences pada data/rulesets/umum.json.
    const state = stateFrom(
      [
        [0, 1],
        [8, 1],
      ],
      PLAYER_A,
    )
    const { state: after } = applyMove(state, 0, rules)

    expect(after.board[LUMBUNG_A]).toBe(1)
    expect(after.board[1]).toBe(0)
  })

  it('bacaan lain: tidak menembak sama sekali kalau seberang kosong', () => {
    // Opsi menembak.requireOppositeNonEmpty — bukan cabang kode per daerah.
    const ketat = withOptions(rules, {
      menembak: { enabled: true, requireOppositeNonEmpty: true, requireLapCompleted: false },
    })
    const state = stateFrom(
      [
        [0, 1],
        [8, 1],
      ],
      PLAYER_A,
    )
    const { state: after, events } = applyMove(state, 0, ketat)

    expect(after.board[LUMBUNG_A]).toBe(0)
    expect(after.board[1]).toBe(1)
    expect(eventTypes(events)).not.toContain('menembak')
  })
})

describe('sambung', () => {
  // Papan: A[0]=1, A[1]=3, B[8]=1.
  // A menabur dari 0 → mendarat di A[1] yang berisi → angkat 4 biji,
  // sebar ke 2,3,4,5 → mendarat di A[5] yang kosong → menembak (seberang
  // 9 kosong, jadi hanya biji itu sendiri).
  it('mengangkat lubang berisi dan melanjutkan penaburan', () => {
    const state = stateFrom(
      [
        [0, 1],
        [1, 3],
        [8, 1],
      ],
      PLAYER_A,
    )
    const { state: after, events } = applyMove(state, 0, rules)

    expect(eventTypes(events)).toEqual([
      'scoop',
      'sow',
      'relay',
      'sow',
      'sow',
      'sow',
      'sow',
      'menembak',
      'turnEnd',
    ])
    expect(cellsOf(after.board)).toEqual([0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0])

    const relay = events.find((e) => e.type === 'relay')
    expect(relay).toMatchObject({ index: 1, biji: 4, rantai: 1 })
    expect(countSeeds(after.board)).toBe(5)
  })

  it('menyambung juga saat mendarat di lubang berisi milik lawan', () => {
    // Papan: A[6]=2, B[8]=1, B[10]=1. Biji terakhir mendarat di B[8] yang
    // berisi → sambung, walau itu sisi lawan.
    const state = stateFrom(
      [
        [6, 2],
        [8, 1],
        [10, 1],
      ],
      PLAYER_A,
    )
    const { events } = applyMove(state, 6, rules)
    expect(eventTypes(events)).toContain('relay')
  })
})

describe('akhir permainan', () => {
  it('menyapu biji sisa ke lumbung pemilik sisinya lalu mengumumkan pemenang', () => {
    // Papan: A[0]=1, A[3]=5, lumbung A=40, lumbung B=52.
    // Sesudah giliran A, B tidak punya langkah sah → permainan selesai.
    const state = stateFrom(
      [
        [0, 1],
        [3, 5],
        [LUMBUNG_A, 40],
        [LUMBUNG_B, 52],
      ],
      PLAYER_A,
    )
    const { state: after, events } = applyMove(state, 0, rules)

    expect(after.status).toBe('selesai')
    expect(after.hasil).toBe('b')
    expect(after.board[LUMBUNG_A]).toBe(46) // 40 + 1 tembakan + 5 sapuan
    expect(after.board[LUMBUNG_B]).toBe(52)
    expect(countSeeds(after.board)).toBe(98)

    expect(eventTypes(events).slice(-2)).toEqual(['sweep', 'end'])
    expect(events.at(-1)).toMatchObject({ type: 'end', skorA: 46, skorB: 52, hasil: 'b' })
  })

  it('menangani seri 49–49', () => {
    // 98 genap, jadi seri terjangkau dan tidak boleh merusak layar hasil.
    const state = stateFrom(
      [
        [6, 1],
        [LUMBUNG_A, 48],
        [LUMBUNG_B, 49],
      ],
      PLAYER_A,
    )
    const { state: after, events } = applyMove(state, 6, rules)

    expect(after.status).toBe('selesai')
    expect(after.hasil).toBe('seri')
    expect(events.at(-1)).toMatchObject({ hasil: 'seri', skorA: 49, skorB: 49 })
  })

  it('bacaan lain: biji sisa ikut pemain yang bergerak terakhir', () => {
    // Kedua opsi sapu akhir hanya berbeda kalau masih ada biji di sisi
    // pemain yang bukan penggerak terakhir. Di bawah terminal
    // tak-ada-langkah itu mustahil — sisi yang macet selalu sudah kosong —
    // jadi divergensi ini hanya terlihat di bawah tiga-lubang-kosong.
    const cells = [
      [0, 1],
      [3, 5],
      [5, 2],
      [9, 3],
      [12, 4],
      [LUMBUNG_A, 40],
      [LUMBUNG_B, 43],
    ] as const

    const terminal = { terminal: 'tiga-lubang-kosong' } as const
    const keMover = withOptions(rules, { ...terminal, finalSweep: 'pemain-terakhir' })
    const kePemilik = withOptions(rules, { ...terminal, finalSweep: 'pemilik-sisi' })

    const a = applyMove(stateFrom(cells, PLAYER_A), 0, keMover).state
    const b = applyMove(stateFrom(cells, PLAYER_A), 0, kePemilik).state

    expect(a.status).toBe('selesai')
    expect(b.status).toBe('selesai')

    // Penggerak terakhir adalah A, jadi seluruh 14 biji sisa jadi miliknya.
    expect(a.board[LUMBUNG_A]).toBe(55) // 40 + 1 tembakan + 7 sisa A + 7 sisa B
    expect(a.board[LUMBUNG_B]).toBe(43)

    // Bacaan satunya membagi sisa menurut sisinya, dan membalik hasilnya.
    expect(b.board[LUMBUNG_A]).toBe(48)
    expect(b.board[LUMBUNG_B]).toBe(50)

    expect(a.hasil).toBe('a')
    expect(b.hasil).toBe('b')
    expect(countSeeds(a.board)).toBe(98)
    expect(countSeeds(b.board)).toBe(98)
  })

  it('bacaan lain: biji sisa dibuang, dan yang dibuang tetap tercatat', () => {
    // Satu-satunya jalan biji keluar dari hitungan. seedsInPlay turun
    // sekali, di sapu akhir, dan konservasi diuji terhadap angka baru itu.
    const dibuang = withOptions(rules, {
      terminal: 'tiga-lubang-kosong',
      finalSweep: 'dibuang',
    })
    const state = stateFrom(
      [
        [0, 1],
        [3, 5],
        [5, 2],
        [9, 3],
        [12, 4],
        [LUMBUNG_A, 40],
        [LUMBUNG_B, 43],
      ],
      PLAYER_A,
    )
    const { state: after, events } = applyMove(state, 0, dibuang)

    expect(after.status).toBe('selesai')
    expect(after.seedsInPlay).toBe(84) // 98 − 14 biji sisa
    expect(countSeeds(after.board)).toBe(84)
    expect(after.board[LUMBUNG_A]).toBe(41)
    expect(after.board[LUMBUNG_B]).toBe(43)

    const dibuangTotal = events
      .filter((e): e is Extract<typeof e, { type: 'sweep' }> => e.type === 'sweep')
      .reduce((sum, e) => sum + e.biji, 0)
    expect(dibuangTotal).toBe(14)
  })

  it('bacaan lain: berhenti begitu satu sisi punya tiga lubang kosong', () => {
    const tigaLubang = withOptions(rules, { terminal: 'tiga-lubang-kosong' })
    const state = stateFrom(
      [
        [0, 1],
        [5, 4],
        [6, 4],
        [8, 4],
        [12, 4],
        [LUMBUNG_A, 40],
        [LUMBUNG_B, 41],
      ],
      PLAYER_A,
    )
    const { state: after } = applyMove(state, 0, tigaLubang)
    expect(after.status).toBe('selesai')
    expect(countSeeds(after.board)).toBe(98)
  })
})

describe('langkah tidak sah', () => {
  it('menolak lubang lawan', () => {
    expect(() => applyMove(createGame(), 8, rules)).toThrow(IllegalMoveError)
  })

  it('menolak lubang kosong', () => {
    const state = stateFrom(
      [
        [0, 0],
        [1, 3],
      ],
      PLAYER_A,
    )
    expect(() => applyMove(state, 0, rules)).toThrow(IllegalMoveError)
  })

  it('menolak lumbung sebagai langkah', () => {
    expect(() => applyMove(createGame(), LUMBUNG_A, rules)).toThrow(IllegalMoveError)
  })

  it('menolak langkah sesudah permainan selesai', () => {
    const state = stateFrom(
      [
        [6, 1],
        [LUMBUNG_A, 48],
        [LUMBUNG_B, 49],
      ],
      PLAYER_A,
    )
    const { state: selesai } = applyMove(state, 6, rules)
    expect(() => applyMove(selesai, 0, rules)).toThrow(IllegalMoveError)
  })
})

describe('applyMove murni', () => {
  it('tidak mengubah state yang diberikan', () => {
    const before = createGame()
    const snapshot = cellsOf(before.board)
    applyMove(before, 3, rules)
    expect(cellsOf(before.board)).toEqual(snapshot)
    expect(before.moveCount).toBe(0)
  })
})
