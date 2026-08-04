'use client'

/**
 * Layer 2: brokered signalling via PeerJS.
 *
 * Optional, and it has to stay that way. PeerJS is loaded with a dynamic
 * import so it never enters the main bundle and never has to succeed —
 * if the broker is unreachable, or the import fails outright, manual
 * paste in `manual.ts` is unaffected and the UI falls back to it.
 *
 * The broker only introduces the two peers. Once the data channel is up
 * the game is peer-to-peer exactly as in Layer 1, and moves and hashes
 * never travel through the broker. There is still no TURN relay, so the
 * same connections that fail manually will fail here too.
 *
 * Transport only. This file has never heard of a lumbung.
 */
import type { StatusKoneksi, PengaturBerkas, Saluran } from './manual'

/**
 * Ids are namespaced, because the default PeerJS broker is a shared public
 * server and a bare short code would collide with unrelated apps.
 */
const AWALAN = 'lumbung-'

/** Tanpa huruf dan angka yang mudah tertukar saat dibacakan atau disalin. */
const ABJAD = '23456789abcdefghjkmnpqrstuvwxyz'

/**
 * True for something shaped like a short code rather than a manual-paste
 * introduction.
 *
 * The two routes produce very different strings, and a player pastes
 * whatever their friend sent them into whichever box is in front of them.
 * Feeding a short code to the manual path used to surface the JSON parser's
 * own complaint — "Unexpected token 'ß'" — which tells a player nothing.
 */
export function miripKode(teks: string): boolean {
  return new RegExp(`^[${ABJAD}]{8}$`).test(teks.trim().toLowerCase())
}

export function buatKode(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  let out = ''
  for (const b of bytes) out += ABJAD[b % ABJAD.length]
  return out
}

export class BrokerTakTersedia extends Error {
  constructor(cause: string) {
    super(`Broker tidak bisa dipakai: ${cause}`)
    this.name = 'BrokerTakTersedia'
  }
}

/**
 * The public broker sometimes accepts the socket and then never answers.
 * Without a deadline the player sits on a blank screen with no code and no
 * error, which is worse than being told it failed — the manual path is
 * right there and works.
 */
const BATAS_MS = 10_000

function denganBatas<T>(kerja: Promise<T>, apa: string): Promise<T> {
  return Promise.race([
    kerja,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new BrokerTakTersedia(`${apa} tidak menjawab`)), BATAS_MS),
    ),
  ])
}

type PeerModule = typeof import('peerjs')
type PeerInstance = InstanceType<PeerModule['Peer']>
type DataConnection = ReturnType<PeerInstance['connect']>

async function muatPeer(): Promise<PeerModule['Peer']> {
  try {
    // Import dinamis: inilah yang membuat lapisan ini benar-benar
    // pilihan, bukan syarat.
    const mod = await import('peerjs')
    return mod.Peer
  } catch (error) {
    throw new BrokerTakTersedia(error instanceof Error ? error.message : String(error))
  }
}

/**
 * PeerJS does not necessarily hand back what was put in. Depending on the
 * negotiated serialisation a sent string can arrive as a string, as an
 * already-parsed object, or as raw bytes — and the protocol layer above
 * only accepts a string. Dropping anything that is not already a string
 * loses the handshake silently: both sides report "connected" and neither
 * ever shows a board.
 */
function keTeks(data: unknown): string | null {
  if (typeof data === 'string') return data
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data)
  if (ArrayBuffer.isView(data)) {
    return new TextDecoder().decode(data.buffer as ArrayBuffer)
  }
  if (typeof data === 'object' && data !== null) {
    try {
      return JSON.stringify(data)
    } catch {
      return null
    }
  }
  return null
}

function pasang(conn: DataConnection, handler: PengaturBerkas): void {
  conn.on('data', (data: unknown) => {
    const raw = keTeks(data)
    if (raw !== null) handler.onPesan(raw)
  })
  conn.on('open', () => handler.onStatus('tersambung'))
  conn.on('close', () => handler.onStatus('putus'))
  conn.on('error', () => handler.onStatus('gagal'))
}

/**
 * The connection is read at send time, never captured.
 *
 * The host builds its Saluran before any guest exists, so a captured
 * reference is null forever: its halo is silently dropped, the guest never
 * learns which ruleset the host is on, and the guest sits at the
 * connection screen while the host shows a board. Reading through a getter
 * is what makes the host's side work at all.
 */
function bungkusSaluran(ambilConn: () => DataConnection | null, peer: PeerInstance): Saluran {
  return {
    kirim: (raw: string) => {
      const conn = ambilConn()
      if (conn && conn.open) conn.send(raw)
    },
    tutup: () => {
      ambilConn()?.close()
      peer.destroy()
    },
  }
}

export interface SisiBroker {
  /** Kode pendek yang dibacakan ke lawan. Kosong untuk sisi tamu. */
  readonly kode: string
  readonly saluran: () => Saluran
  readonly tutup: () => void
}

/** Host: claims a short code and waits for the guest to dial it. */
export async function brokerTuanRumah(handler: PengaturBerkas): Promise<SisiBroker> {
  const Peer = await muatPeer()
  const kode = buatKode()
  const peer = new Peer(AWALAN + kode)
  let conn: DataConnection | null = null

  await denganBatas(
    new Promise<void>((resolve, reject) => {
      peer.on('open', () => resolve())
      peer.on('error', (error: Error) => reject(new BrokerTakTersedia(error.message)))
    }),
    'broker',
  ).catch((error: unknown) => {
    peer.destroy()
    throw error
  })

  handler.onStatus('menunggu')
  peer.on('connection', (masuk: DataConnection) => {
    conn = masuk
    pasang(masuk, handler)
  })
  peer.on('error', () => handler.onStatus('gagal'))
  peer.on('disconnected', () => handler.onStatus('putus'))

  return {
    kode,
    saluran: () => bungkusSaluran(() => conn, peer),
    tutup: () => peer.destroy(),
  }
}

/** Guest: dials the host's short code. */
export async function brokerTamu(kode: string, handler: PengaturBerkas): Promise<SisiBroker> {
  const Peer = await muatPeer()
  const peer = new Peer()

  await denganBatas(
    new Promise<void>((resolve, reject) => {
      peer.on('open', () => resolve())
      peer.on('error', (error: Error) => reject(new BrokerTakTersedia(error.message)))
    }),
    'broker',
  ).catch((error: unknown) => {
    peer.destroy()
    throw error
  })

  handler.onStatus('menunggu')
  const conn = peer.connect(AWALAN + kode.trim().toLowerCase(), { reliable: true })
  pasang(conn, handler)
  peer.on('error', () => handler.onStatus('gagal'))
  peer.on('disconnected', () => handler.onStatus('putus'))

  return {
    kode: '',
    saluran: () => bungkusSaluran(() => conn, peer),
    tutup: () => {
      conn.close()
      peer.destroy()
    },
  }
}

export type { StatusKoneksi }
