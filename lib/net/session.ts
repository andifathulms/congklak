/**
 * The P2P session, as a pure reducer.
 *
 * Transport only (invariant 12). This file knows that moves are numbered
 * and that hashes have to agree. It does not know what a move means, whose
 * turn it is, or whether a hole is legal — the caller owns the engine and
 * feeds in results that have already been applied.
 *
 * That is why an incoming move arrives with both hashes already computed:
 * the caller applies it, hashes its own resulting state, and hands both
 * over. Comparing them here would otherwise require importing the engine,
 * and then this layer would know the rules.
 */
import {
  PROTOCOL_VERSION,
  type AlasanHalt,
  type Pesan,
} from './protocol'

export type Peran = 'tuan-rumah' | 'tamu'
export type StatusSesi = 'menunggu-halo' | 'siap' | 'halt'

export interface Sesi {
  readonly peran: Peran
  readonly rulesetId: string
  readonly player: 0 | 1
  readonly status: StatusSesi
  /** Daftar langkah yang sudah disepakati kedua sisi. */
  readonly moves: readonly number[]
  /** Hash per giliran, sejajar dengan moves. */
  readonly hashes: readonly string[]
  readonly alasanHalt: AlasanHalt | null
  /** Halo dari lawan sudah diterima dan cocok. */
  readonly peerRulesetId: string | null
}

export type Aksi =
  | { readonly type: 'terima'; readonly pesan: Pesan }
  /** Aku bergerak; hash adalah hash keadaanku sesudah langkah itu. */
  | { readonly type: 'langkah-lokal'; readonly hole: number; readonly hash: string }
  /**
   * Lawan bergerak dan aku sudah menerapkannya. hashLokal adalah hasil
   * mesinku sendiri; hashPeer datang dari pesannya.
   */
  | { readonly type: 'langkah-diterapkan'; readonly ply: number; readonly hashLokal: string }
  /** Mesinku menolak langkah lawan sebagai tidak sah. */
  | { readonly type: 'tolak-langkah'; readonly ply: number }
  | { readonly type: 'minta-sinkron' }

export interface Hasil {
  readonly sesi: Sesi
  /** Pesan yang harus dikirim ke lawan, urut. */
  readonly kirim: readonly Pesan[]
  /**
   * Langkah lawan yang harus diterapkan pemanggil ke mesinnya, lalu
   * dilaporkan balik lewat 'langkah-diterapkan'.
   */
  readonly terapkan: { readonly ply: number; readonly hole: number; readonly hash: string } | null
  /** Daftar langkah utuh untuk diputar ulang dari nol. */
  readonly putarUlang: readonly number[] | null
}

export function buatSesi(peran: Peran, rulesetId: string, player: 0 | 1): Sesi {
  return {
    peran,
    rulesetId,
    player,
    status: 'menunggu-halo',
    moves: [],
    hashes: [],
    alasanHalt: null,
    peerRulesetId: null,
  }
}

export function halo(sesi: Sesi): Pesan {
  return {
    type: 'halo',
    version: PROTOCOL_VERSION,
    rulesetId: sesi.rulesetId,
    player: sesi.player,
  }
}

function berhenti(sesi: Sesi, alasan: AlasanHalt, kirimHalt = true): Hasil {
  return {
    sesi: { ...sesi, status: 'halt', alasanHalt: alasan },
    kirim: kirimHalt ? [{ type: 'halt', alasan, ply: sesi.moves.length }] : [],
    terapkan: null,
    putarUlang: null,
  }
}

const diam = (sesi: Sesi): Hasil => ({ sesi, kirim: [], terapkan: null, putarUlang: null })

export function reduce(sesi: Sesi, aksi: Aksi): Hasil {
  // Sekali berhenti, tetap berhenti. Tidak ada rekonsiliasi otomatis dan
  // tidak ada sisi yang boleh memaksa sisi lain melanjutkan (invariant 13).
  if (sesi.status === 'halt') return diam(sesi)

  switch (aksi.type) {
    case 'terima':
      return terima(sesi, aksi.pesan)

    case 'langkah-lokal': {
      if (sesi.status !== 'siap') return diam(sesi)
      const ply = sesi.moves.length
      return {
        sesi: {
          ...sesi,
          moves: [...sesi.moves, aksi.hole],
          hashes: [...sesi.hashes, aksi.hash],
        },
        kirim: [{ type: 'langkah', ply, hole: aksi.hole, hash: aksi.hash }],
        terapkan: null,
        putarUlang: null,
      }
    }

    case 'langkah-diterapkan': {
      const diharap = sesi.hashes[aksi.ply]
      // Hash dibandingkan setiap giliran, dan yang beda menghentikan
      // permainan — bukan diperbaiki diam-diam dengan mempercayai satu sisi.
      if (diharap !== undefined && diharap !== aksi.hashLokal) {
        return berhenti(sesi, 'hash-beda')
      }
      return diam(sesi)
    }

    case 'tolak-langkah':
      return berhenti(sesi, 'langkah-tak-sah')

    case 'minta-sinkron':
      return {
        sesi,
        kirim: [{ type: 'minta-sinkron', ply: sesi.moves.length }],
        terapkan: null,
        putarUlang: null,
      }

    default: {
      const never: never = aksi
      return never
    }
  }
}

function terima(sesi: Sesi, pesan: Pesan): Hasil {
  switch (pesan.type) {
    case 'halo': {
      if (pesan.version !== PROTOCOL_VERSION) return berhenti(sesi, 'versi-beda')
      // Ruleset id diperiksa saat menyambung dan sambungan ditolak kalau
      // beda. Dua pack yang berbeda akan menyimpang tanpa peringatan.
      if (pesan.rulesetId !== sesi.rulesetId) return berhenti(sesi, 'ruleset-beda')
      if (pesan.player === sesi.player) return berhenti(sesi, 'peran-bentrok')

      return {
        sesi: { ...sesi, status: 'siap', peerRulesetId: pesan.rulesetId },
        kirim: [],
        terapkan: null,
        putarUlang: null,
      }
    }

    case 'langkah': {
      if (sesi.status !== 'siap') return berhenti(sesi, 'urutan-kacau')

      // Sudah pernah diterima: pesan ganda, bukan kesalahan.
      if (pesan.ply < sesi.moves.length) {
        return sesi.moves[pesan.ply] === pesan.hole
          ? diam(sesi)
          : berhenti(sesi, 'urutan-kacau')
      }
      // Ada yang terlewat di tengah — jangan tebak, minta sinkron.
      if (pesan.ply > sesi.moves.length) {
        return {
          sesi,
          kirim: [{ type: 'minta-sinkron', ply: sesi.moves.length }],
          terapkan: null,
          putarUlang: null,
        }
      }

      return {
        sesi: {
          ...sesi,
          moves: [...sesi.moves, pesan.hole],
          hashes: [...sesi.hashes, pesan.hash],
        },
        kirim: [],
        // Pemanggil yang menerapkan dan menghitung hash-nya sendiri, lalu
        // melapor balik lewat 'langkah-diterapkan'.
        terapkan: { ply: pesan.ply, hole: pesan.hole, hash: pesan.hash },
        putarUlang: null,
      }
    }

    case 'minta-sinkron':
      return {
        sesi,
        kirim: [{ type: 'sinkron', moves: [...sesi.moves] }],
        terapkan: null,
        putarUlang: null,
      }

    case 'sinkron': {
      // Pemulihan dengan memutar ulang daftar langkah, bukan dengan
      // menerima keadaan dari lawan.
      const cocok = sesi.moves.every((m, i) => pesan.moves[i] === m)
      if (!cocok) return berhenti(sesi, 'hash-beda')
      return {
        sesi: { ...sesi, moves: [...pesan.moves], hashes: sesi.hashes.slice(0, pesan.moves.length) },
        kirim: [],
        terapkan: null,
        putarUlang: [...pesan.moves],
      }
    }

    case 'halt':
      // Lawan berhenti: kita ikut berhenti, tanpa mengirim halt balik.
      return berhenti(sesi, pesan.alasan, false)

    default: {
      const never: never = pesan
      return never
    }
  }
}
