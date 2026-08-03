import { describe, expect, it } from 'vitest'
import { decodePesan, encodePesan, PROTOCOL_VERSION, type Pesan } from '@/lib/net/protocol'
import { buatSesi, halo, reduce, type Sesi } from '@/lib/net/session'
import { applyMove, createGame, currentLegalMoves, type GameState } from '@/lib/engine/apply'
import { PLAYER_A } from '@/lib/engine/board'
import { hashOf } from '@/lib/engine/hash'
import { createRng } from '@/lib/rng'
import { umum } from '../helpers'

const rules = umum()

function berjabat(): { a: Sesi; b: Sesi } {
  let a = buatSesi('tuan-rumah', rules.id, 0)
  let b = buatSesi('tamu', rules.id, 1)
  a = reduce(a, { type: 'terima', pesan: halo(b) }).sesi
  b = reduce(b, { type: 'terima', pesan: halo(a) }).sesi
  return { a, b }
}

describe('jabat tangan', () => {
  it('menerima lawan dengan ruleset dan versi yang sama', () => {
    const { a, b } = berjabat()
    expect(a.status).toBe('siap')
    expect(b.status).toBe('siap')
    expect(a.peerRulesetId).toBe(rules.id)
  })

  it('menolak sambungan kalau ruleset id berbeda', () => {
    // Dua pack berbeda akan menyimpang tanpa peringatan, jadi ditolak
    // di depan, bukan diketahui belakangan lewat hash yang tak cocok.
    const a = buatSesi('tuan-rumah', 'umum', 0)
    const lawan = buatSesi('tamu', 'jawa-sleman', 1)
    const hasil = reduce(a, { type: 'terima', pesan: halo(lawan) })

    expect(hasil.sesi.status).toBe('halt')
    expect(hasil.sesi.alasanHalt).toBe('ruleset-beda')
    expect(hasil.kirim).toEqual([{ type: 'halt', alasan: 'ruleset-beda', ply: 0 }])
  })

  it('menolak versi protokol yang berbeda', () => {
    const a = buatSesi('tuan-rumah', rules.id, 0)
    const pesan: Pesan = {
      type: 'halo',
      version: PROTOCOL_VERSION + 1,
      rulesetId: rules.id,
      player: 1,
    }
    expect(reduce(a, { type: 'terima', pesan }).sesi.alasanHalt).toBe('versi-beda')
  })

  it('menolak kalau kedua sisi mengaku pemain yang sama', () => {
    const a = buatSesi('tuan-rumah', rules.id, 0)
    const kembar = buatSesi('tamu', rules.id, 0)
    expect(reduce(a, { type: 'terima', pesan: halo(kembar) }).sesi.alasanHalt).toBe(
      'peran-bentrok',
    )
  })
})

describe('langkah melintas', () => {
  it('mengirim nomor urut, lubang, dan hash — tidak pernah papan', () => {
    const { a } = berjabat()
    const hasil = reduce(a, { type: 'langkah-lokal', hole: 3, hash: 'deadbeef' })

    expect(hasil.kirim).toEqual([{ type: 'langkah', ply: 0, hole: 3, hash: 'deadbeef' }])
    // Tidak ada papan, tidak ada jumlah biji, tidak ada keadaan apa pun.
    const wire = encodePesan(hasil.kirim[0])
    expect(wire).not.toMatch(/board|cells|biji|state/i)
    expect(hasil.sesi.moves).toEqual([3])
  })

  it('meneruskan langkah lawan untuk diterapkan pemanggil', () => {
    const { b } = berjabat()
    const hasil = reduce(b, {
      type: 'terima',
      pesan: { type: 'langkah', ply: 0, hole: 5, hash: 'aaaa1111' },
    })

    expect(hasil.terapkan).toEqual({ ply: 0, hole: 5, hash: 'aaaa1111' })
    expect(hasil.sesi.moves).toEqual([5])
  })

  it('mengabaikan pesan ganda yang isinya sama', () => {
    const { b } = berjabat()
    const pesan: Pesan = { type: 'langkah', ply: 0, hole: 5, hash: 'aaaa1111' }
    const sekali = reduce(b, { type: 'terima', pesan })
    const dua = reduce(sekali.sesi, { type: 'terima', pesan })

    expect(dua.sesi.status).toBe('siap')
    expect(dua.sesi.moves).toEqual([5])
    expect(dua.terapkan).toBeNull()
  })

  it('berhenti kalau ply yang sama datang dengan lubang berbeda', () => {
    const { b } = berjabat()
    const sekali = reduce(b, {
      type: 'terima',
      pesan: { type: 'langkah', ply: 0, hole: 5, hash: 'aaaa' },
    })
    const beda = reduce(sekali.sesi, {
      type: 'terima',
      pesan: { type: 'langkah', ply: 0, hole: 6, hash: 'bbbb' },
    })
    expect(beda.sesi.alasanHalt).toBe('urutan-kacau')
  })

  it('meminta sinkron kalau ada langkah yang terlewat, bukan menebak', () => {
    const { b } = berjabat()
    const hasil = reduce(b, {
      type: 'terima',
      pesan: { type: 'langkah', ply: 4, hole: 2, hash: 'cccc' },
    })
    expect(hasil.kirim).toEqual([{ type: 'minta-sinkron', ply: 0 }])
    expect(hasil.terapkan).toBeNull()
    expect(hasil.sesi.status).toBe('siap')
  })
})

describe('hash tiap giliran', () => {
  it('berhenti kalau hash lokal dan hash lawan berbeda', () => {
    const { b } = berjabat()
    const masuk = reduce(b, {
      type: 'terima',
      pesan: { type: 'langkah', ply: 0, hole: 5, hash: 'aaaa1111' },
    })
    const hasil = reduce(masuk.sesi, {
      type: 'langkah-diterapkan',
      ply: 0,
      hashLokal: 'ffff9999',
    })

    expect(hasil.sesi.status).toBe('halt')
    expect(hasil.sesi.alasanHalt).toBe('hash-beda')
    expect(hasil.kirim).toEqual([{ type: 'halt', alasan: 'hash-beda', ply: 1 }])
  })

  it('melanjutkan kalau hash cocok', () => {
    const { b } = berjabat()
    const masuk = reduce(b, {
      type: 'terima',
      pesan: { type: 'langkah', ply: 0, hole: 5, hash: 'aaaa1111' },
    })
    const hasil = reduce(masuk.sesi, {
      type: 'langkah-diterapkan',
      ply: 0,
      hashLokal: 'aaaa1111',
    })
    expect(hasil.sesi.status).toBe('siap')
  })

  it('tidak pernah bangkit kembali sesudah berhenti', () => {
    const { b } = berjabat()
    const mati = reduce(b, { type: 'tolak-langkah', ply: 0 }).sesi
    expect(mati.status).toBe('halt')

    const coba = reduce(mati, { type: 'langkah-lokal', hole: 1, hash: 'x' })
    expect(coba.sesi.status).toBe('halt')
    expect(coba.kirim).toEqual([])
  })
})

describe('pemulihan', () => {
  it('menjawab minta-sinkron dengan daftar langkah, bukan keadaan', () => {
    const { a } = berjabat()
    const s1 = reduce(a, { type: 'langkah-lokal', hole: 2, hash: 'h1' }).sesi
    const s2 = reduce(s1, { type: 'langkah-lokal', hole: 4, hash: 'h2' }).sesi
    const hasil = reduce(s2, { type: 'terima', pesan: { type: 'minta-sinkron', ply: 0 } })

    expect(hasil.kirim).toEqual([{ type: 'sinkron', moves: [2, 4] }])
    expect(JSON.stringify(hasil.kirim)).not.toMatch(/board|cells/i)
  })

  it('memutar ulang dari daftar langkah yang diterima', () => {
    const { b } = berjabat()
    const hasil = reduce(b, { type: 'terima', pesan: { type: 'sinkron', moves: [1, 2, 3] } })
    expect(hasil.putarUlang).toEqual([1, 2, 3])
    expect(hasil.sesi.moves).toEqual([1, 2, 3])
  })

  it('berhenti kalau daftar langkah lawan bertentangan dengan yang sudah disepakati', () => {
    const { a } = berjabat()
    const s1 = reduce(a, { type: 'langkah-lokal', hole: 2, hash: 'h1' }).sesi
    const hasil = reduce(s1, { type: 'terima', pesan: { type: 'sinkron', moves: [6, 6] } })
    expect(hasil.sesi.alasanHalt).toBe('hash-beda')
  })

  it('ikut berhenti saat lawan berhenti, tanpa memantulkan halt balik', () => {
    const { a } = berjabat()
    const hasil = reduce(a, {
      type: 'terima',
      pesan: { type: 'halt', alasan: 'hash-beda', ply: 3 },
    })
    expect(hasil.sesi.status).toBe('halt')
    expect(hasil.kirim).toEqual([])
  })
})

describe('pesan dari kabel tidak dipercaya', () => {
  it('menolak yang bukan JSON, bukan objek, atau tipenya asing', () => {
    expect(decodePesan('bukan json')).toBeNull()
    expect(decodePesan('null')).toBeNull()
    expect(decodePesan('[1,2,3]')).toBeNull()
    expect(decodePesan('{"type":"entah"}')).toBeNull()
  })

  it('menolak langkah dengan lubang di luar papan atau ply negatif', () => {
    expect(decodePesan('{"type":"langkah","ply":0,"hole":15,"hash":"a"}')).toBeNull()
    expect(decodePesan('{"type":"langkah","ply":-1,"hole":3,"hash":"a"}')).toBeNull()
    expect(decodePesan('{"type":"langkah","ply":0,"hole":3}')).toBeNull()
  })

  it('menolak sinkron dengan langkah yang tidak masuk akal', () => {
    expect(decodePesan('{"type":"sinkron","moves":[1,99]}')).toBeNull()
    expect(decodePesan('{"type":"sinkron","moves":"bukan larik"}')).toBeNull()
  })

  it('bolak-balik utuh untuk pesan yang sah', () => {
    const semua: Pesan[] = [
      { type: 'halo', version: PROTOCOL_VERSION, rulesetId: 'umum', player: 1 },
      { type: 'langkah', ply: 7, hole: 12, hash: '0badf00d' },
      { type: 'minta-sinkron', ply: 3 },
      { type: 'sinkron', moves: [0, 3, 14] },
      { type: 'halt', alasan: 'hash-beda', ply: 2 },
    ]
    for (const pesan of semua) {
      expect(decodePesan(encodePesan(pesan))).toEqual(pesan)
    }
  })
})

describe('dua sesi memainkan permainan penuh', () => {
  /**
   * Jaminan P2P yang sebenarnya: dua sesi terpisah, masing-masing dengan
   * mesinnya sendiri, hanya bertukar langkah dan hash — dan tidak sekali
   * pun berhenti karena hash tak cocok.
   */
  it('sepakat di setiap giliran tanpa pernah mengirim keadaan', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rng = createRng(seed)
      let { a: sesiA, b: sesiB } = berjabat()
      let mesinA: GameState = createGame(PLAYER_A)
      let mesinB: GameState = createGame(PLAYER_A)
      let bytes = 0

      while (mesinA.status === 'berjalan') {
        const legal = currentLegalMoves(mesinA)
        if (legal.length === 0) break
        const hole = rng.pick(legal)
        const pemainSekarang = mesinA.toMove

        // Sisi yang mendapat giliran menerapkan lalu mengumumkan.
        mesinA = applyMove(mesinA, hole, rules).state
        const hashA = hashOf(mesinA, rules.id)
        const keluar = reduce(pemainSekarang === 0 ? sesiA : sesiB, {
          type: 'langkah-lokal',
          hole,
          hash: hashA,
        })
        if (pemainSekarang === 0) sesiA = keluar.sesi
        else sesiB = keluar.sesi

        for (const pesan of keluar.kirim) bytes += encodePesan(pesan).length

        // Sisi lain menerima, menerapkan di mesinnya, lalu melapor.
        const wire = encodePesan(keluar.kirim[0])
        const diterima = decodePesan(wire)
        expect(diterima).not.toBeNull()

        const masuk = reduce(pemainSekarang === 0 ? sesiB : sesiA, {
          type: 'terima',
          pesan: diterima!,
        })
        expect(masuk.terapkan).not.toBeNull()

        mesinB = applyMove(mesinB, masuk.terapkan!.hole, rules).state
        const lapor = reduce(masuk.sesi, {
          type: 'langkah-diterapkan',
          ply: masuk.terapkan!.ply,
          hashLokal: hashOf(mesinB, rules.id),
        })
        if (pemainSekarang === 0) sesiB = lapor.sesi
        else sesiA = lapor.sesi

        expect(lapor.sesi.status).toBe('siap')
      }

      expect(sesiA.status).toBe('siap')
      expect(sesiB.status).toBe('siap')
      expect(sesiA.moves).toEqual(sesiB.moves)
      expect(hashOf(mesinA, rules.id)).toBe(hashOf(mesinB, rules.id))
      // Seluruh permainan melintas dalam byte yang sangat sedikit, karena
      // yang dikirim hanya nomor langkah dan hash.
      expect(bytes).toBeLessThan(sesiA.moves.length * 80 + 100)
    }
  })

  it('menangkap sisi yang menyimpang, walau langkahnya sah', () => {
    // Satu sisi diam-diam memakai ruleset lain. Langkahnya tetap sah, tapi
    // papannya berbeda — dan hash per giliran itulah yang menangkapnya.
    const { a, b } = berjabat()
    const sleman = { ...rules, options: { ...rules.options, terminal: 'tiga-lubang-kosong' as const } }

    let mesinA = createGame(PLAYER_A)
    let mesinB = createGame(PLAYER_A)
    let sesiA = a
    let sesiB = b
    let berhenti = false

    for (let i = 0; i < 30 && !berhenti; i++) {
      const legal = currentLegalMoves(mesinA)
      if (legal.length === 0) break
      const hole = legal[0]

      mesinA = applyMove(mesinA, hole, rules).state
      const keluar = reduce(sesiA, { type: 'langkah-lokal', hole, hash: hashOf(mesinA, rules.id) })
      sesiA = keluar.sesi

      const masuk = reduce(sesiB, { type: 'terima', pesan: keluar.kirim[0] })
      if (masuk.terapkan === null) break

      // Sisi B memakai pack yang berbeda.
      mesinB = applyMove(mesinB, masuk.terapkan.hole, sleman).state
      const lapor = reduce(masuk.sesi, {
        type: 'langkah-diterapkan',
        ply: masuk.terapkan.ply,
        hashLokal: hashOf(mesinB, rules.id),
      })
      sesiB = lapor.sesi
      if (sesiB.status === 'halt') berhenti = true
    }

    expect(berhenti).toBe(true)
    expect(sesiB.alasanHalt).toBe('hash-beda')
  })
})
