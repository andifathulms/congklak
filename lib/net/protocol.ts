/**
 * Wire format. Only moves and hashes cross (invariant 12).
 *
 * There is no board here, no seed count, no state of any kind. If a
 * message ever needs to carry a position, the design has gone wrong —
 * both peers reconstruct by replaying the move list.
 *
 * This module knows nothing about congklak's rules. It does not know what
 * a lumbung is, whose turn it is, or whether a move is legal. It knows
 * that moves are numbered and that hashes must agree.
 */

/** Naik kalau bentuk pesan berubah dengan cara yang tidak kompatibel. */
export const PROTOCOL_VERSION = 1

export interface HaloPesan {
  readonly type: 'halo'
  readonly version: number
  /**
   * Kedua peer harus berada di ruleset yang sama, diperiksa saat
   * menyambung dan ditolak kalau beda (invariant 12).
   */
  readonly rulesetId: string
  /** Pemain mana yang dipegang pengirim: 0 atau 1. */
  readonly player: 0 | 1
}

export interface LangkahPesan {
  readonly type: 'langkah'
  /** Nomor urut langkah, mulai 0. Menangkap pesan hilang atau ganda. */
  readonly ply: number
  readonly hole: number
  /** Hash keadaan pengirim sesudah langkah ini. */
  readonly hash: string
}

export interface MintaSinkronPesan {
  readonly type: 'minta-sinkron'
  readonly ply: number
}

/** Pemulihan: daftar langkah utuh, bukan keadaan. */
export interface SinkronPesan {
  readonly type: 'sinkron'
  readonly moves: readonly number[]
}

export type AlasanHalt =
  | 'ruleset-beda'
  | 'versi-beda'
  | 'hash-beda'
  | 'urutan-kacau'
  | 'langkah-tak-sah'
  | 'peran-bentrok'

export interface HaltPesan {
  readonly type: 'halt'
  readonly alasan: AlasanHalt
  readonly ply: number
}

export type Pesan =
  | HaloPesan
  | LangkahPesan
  | MintaSinkronPesan
  | SinkronPesan
  | HaltPesan

export function encodePesan(pesan: Pesan): string {
  return JSON.stringify(pesan)
}

/**
 * Anything off the wire is untrusted. A peer running an older build, or
 * something that is not a peer at all, must produce a null rather than a
 * half-valid object that fails somewhere deeper.
 */
export function decodePesan(raw: string): Pesan | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  const p = parsed as Record<string, unknown>

  switch (p.type) {
    case 'halo':
      return typeof p.version === 'number' &&
        typeof p.rulesetId === 'string' &&
        (p.player === 0 || p.player === 1)
        ? { type: 'halo', version: p.version, rulesetId: p.rulesetId, player: p.player }
        : null

    case 'langkah':
      return typeof p.ply === 'number' &&
        Number.isInteger(p.ply) &&
        p.ply >= 0 &&
        typeof p.hole === 'number' &&
        Number.isInteger(p.hole) &&
        p.hole >= 0 &&
        p.hole <= 14 &&
        typeof p.hash === 'string'
        ? { type: 'langkah', ply: p.ply, hole: p.hole, hash: p.hash }
        : null

    case 'minta-sinkron':
      return typeof p.ply === 'number' && Number.isInteger(p.ply)
        ? { type: 'minta-sinkron', ply: p.ply }
        : null

    case 'sinkron':
      return Array.isArray(p.moves) &&
        p.moves.every((m) => Number.isInteger(m) && m >= 0 && m <= 14)
        ? { type: 'sinkron', moves: p.moves as number[] }
        : null

    case 'halt':
      return typeof p.alasan === 'string' && typeof p.ply === 'number'
        ? { type: 'halt', alasan: p.alasan as AlasanHalt, ply: p.ply }
        : null

    default:
      return null
  }
}

export function alasanTeks(alasan: AlasanHalt): string {
  switch (alasan) {
    case 'ruleset-beda':
      return 'Kedua sisi memakai aturan yang berbeda. Sambungan ditolak.'
    case 'versi-beda':
      return 'Versi protokol berbeda. Salah satu sisi perlu memuat ulang.'
    case 'hash-beda':
      return 'Papan kedua sisi tidak lagi sama. Permainan dihentikan.'
    case 'urutan-kacau':
      return 'Urutan langkah tidak berurut. Permainan dihentikan.'
    case 'langkah-tak-sah':
      return 'Lawan mengirim langkah yang tidak sah menurut aturan ini.'
    case 'peran-bentrok':
      return 'Kedua sisi mengaku memegang pemain yang sama.'
    default: {
      const never: never = alasan
      return never
    }
  }
}
