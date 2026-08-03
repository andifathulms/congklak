'use client'

/**
 * Manual paste signalling over a raw WebRTC data channel.
 *
 * No dependency at all — this is Layer 1, and it has to work when nothing
 * else does. PeerJS would only ever broker the same handshake; keeping it
 * out of this file is what makes it optional rather than load-bearing.
 *
 * Transport only. This file has never heard of a lumbung.
 *
 * No TURN relay, so a connection behind symmetric NAT on both sides will
 * simply fail. That is disclosed to the player rather than retried
 * forever (PRD §4).
 */

const STUN: RTCConfiguration = {
  iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }],
}

export type StatusKoneksi = 'baru' | 'menunggu' | 'tersambung' | 'putus' | 'gagal'

export interface Saluran {
  readonly kirim: (raw: string) => void
  readonly tutup: () => void
}

export interface PengaturBerkas {
  onPesan: (raw: string) => void
  onStatus: (status: StatusKoneksi) => void
}

/**
 * ICE candidates are gathered fully before the blob is handed back, so
 * one paste carries the whole offer. Trickle ICE would mean several
 * round trips of copy-paste, which nobody will do.
 */
function tungguIce(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve()
  return new Promise((resolve) => {
    const cek = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', cek)
        resolve()
      }
    }
    pc.addEventListener('icegatheringstatechange', cek)
    // Beberapa jaringan tidak pernah menyelesaikan pengumpulan; jangan
    // menggantung selamanya.
    setTimeout(() => {
      pc.removeEventListener('icegatheringstatechange', cek)
      resolve()
    }, 3000)
  })
}

function bungkus(sdp: RTCSessionDescriptionInit): string {
  return btoa(JSON.stringify(sdp)).replace(/=+$/, '')
}

export function bukaBungkus(kode: string): RTCSessionDescriptionInit {
  const pad = kode.trim() + '='.repeat((4 - (kode.trim().length % 4)) % 4)
  const parsed: unknown = JSON.parse(atob(pad))
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as RTCSessionDescriptionInit).type !== 'string'
  ) {
    throw new Error('Kode sambungan tidak bisa dibaca')
  }
  return parsed as RTCSessionDescriptionInit
}

function pasangSaluran(channel: RTCDataChannel, handler: PengaturBerkas): void {
  channel.onmessage = (event: MessageEvent<string>) => handler.onPesan(event.data)
  channel.onopen = () => handler.onStatus('tersambung')
  channel.onclose = () => handler.onStatus('putus')
  channel.onerror = () => handler.onStatus('gagal')
}

export interface SisiTuanRumah {
  readonly tawaran: string
  readonly terimaJawaban: (kode: string) => Promise<void>
  readonly saluran: () => Saluran
  readonly tutup: () => void
}

/** Host: makes the offer, waits for the guest's answer. */
export async function mulaiTuanRumah(handler: PengaturBerkas): Promise<SisiTuanRumah> {
  const pc = new RTCPeerConnection(STUN)
  const channel = pc.createDataChannel('lumbung', { ordered: true })
  pasangSaluran(channel, handler)

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'failed') handler.onStatus('gagal')
    if (pc.connectionState === 'disconnected') handler.onStatus('putus')
  }

  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  await tungguIce(pc)
  handler.onStatus('menunggu')

  return {
    tawaran: bungkus(pc.localDescription ?? offer),
    terimaJawaban: async (kode: string) => {
      await pc.setRemoteDescription(bukaBungkus(kode))
    },
    saluran: () => ({
      kirim: (raw) => channel.readyState === 'open' && channel.send(raw),
      tutup: () => pc.close(),
    }),
    tutup: () => pc.close(),
  }
}

export interface SisiTamu {
  readonly jawaban: string
  readonly saluran: () => Saluran
  readonly tutup: () => void
}

/** Guest: takes the host's offer, returns an answer to paste back. */
export async function mulaiTamu(
  kodeTawaran: string,
  handler: PengaturBerkas,
): Promise<SisiTamu> {
  const pc = new RTCPeerConnection(STUN)
  let channel: RTCDataChannel | null = null

  pc.ondatachannel = (event) => {
    channel = event.channel
    pasangSaluran(channel, handler)
  }
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'failed') handler.onStatus('gagal')
    if (pc.connectionState === 'disconnected') handler.onStatus('putus')
  }

  await pc.setRemoteDescription(bukaBungkus(kodeTawaran))
  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)
  await tungguIce(pc)
  handler.onStatus('menunggu')

  return {
    jawaban: bungkus(pc.localDescription ?? answer),
    saluran: () => ({
      kirim: (raw) => channel?.readyState === 'open' && channel.send(raw),
      tutup: () => pc.close(),
    }),
    tutup: () => pc.close(),
  }
}
