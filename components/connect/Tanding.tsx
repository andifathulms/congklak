'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { applyMove, createGame, currentLegalMoves, type GameState } from '@/lib/engine/apply'
import { PLAYER_A, PLAYER_B, isLegalMove } from '@/lib/engine/board'
import { hashOf } from '@/lib/engine/hash'
import { replay } from '@/lib/engine/replay'
import { alasanTeks, decodePesan, encodePesan } from '@/lib/net/protocol'
import { buatSesi, halo, reduce, type Peran, type Sesi } from '@/lib/net/session'
import {
  mulaiTamu,
  mulaiTuanRumah,
  type Saluran,
  type StatusKoneksi,
} from '@/lib/net/manual'
import { RULESETS, getRuleset, type Ruleset } from '@/lib/rulesets'
import { t, type Locale } from '@/lib/i18n'
import { Papan } from '@/components/board/Papan'
import { usePenaburan } from '@/components/sow/usePenaburan'

/**
 * Two devices, one game. Moves and hashes cross the wire and nothing else
 * (invariant 12); the hash is compared every turn and a mismatch halts
 * both sides rather than being reconciled (invariant 13).
 */
export function Tanding({ locale }: { locale: Locale }) {
  const kata = t(locale)

  const [ruleset, setRuleset] = useState<Ruleset>(RULESETS[0])
  const [peran, setPeran] = useState<Peran | null>(null)
  const [koneksi, setKoneksi] = useState<StatusKoneksi>('baru')
  const [tawaran, setTawaran] = useState('')
  const [tempel, setTempel] = useState('')
  const [galat, setGalat] = useState<string | null>(null)

  const [sesi, setSesi] = useState<Sesi | null>(null)
  const [state, setState] = useState<GameState>(() => createGame())

  const saluran = useRef<Saluran | null>(null)
  const sesiRef = useRef<Sesi | null>(null)
  const stateRef = useRef<GameState>(state)
  const rulesetRef = useRef<Ruleset>(ruleset)

  useEffect(() => {
    sesiRef.current = sesi
  }, [sesi])
  useEffect(() => {
    stateRef.current = state
  }, [state])
  useEffect(() => {
    rulesetRef.current = ruleset
  }, [ruleset])

  const player = usePenaburan(state.board, 'sedang')

  const kirimSemua = useCallback((pesan: readonly Parameters<typeof encodePesan>[0][]) => {
    for (const p of pesan) saluran.current?.kirim(encodePesan(p))
  }, [])

  /** Everything that arrives off the wire lands here. */
  const onPesan = useCallback(
    (raw: string) => {
      const pesan = decodePesan(raw)
      const kini = sesiRef.current
      if (!pesan || !kini) return

      const hasil = reduce(kini, { type: 'terima', pesan })
      kirimSemua(hasil.kirim)

      // Sinkron ulang: putar daftar langkah dari nol, jangan pernah
      // menerima keadaan dari lawan.
      if (hasil.putarUlang) {
        try {
          const { final } = replay(
            {
              rulesetId: rulesetRef.current.id,
              moves: hasil.putarUlang,
              firstPlayer: PLAYER_A,
            },
            rulesetRef.current,
          )
          setState(final)
          player.reset(final.board)
          setSesi(hasil.sesi)
        } catch {
          const mati = reduce(hasil.sesi, { type: 'tolak-langkah', ply: 0 })
          kirimSemua(mati.kirim)
          setSesi(mati.sesi)
        }
        return
      }

      if (!hasil.terapkan) {
        setSesi(hasil.sesi)
        return
      }

      // Langkah lawan diperiksa mesinku sendiri sebelum diterapkan. AI dan
      // lawan sama-sama tidak boleh memainkan langkah tidak sah.
      const sekarang = stateRef.current
      const { hole, ply } = hasil.terapkan
      if (sekarang.status !== 'berjalan' || !isLegalMove(sekarang.board, sekarang.toMove, hole)) {
        const mati = reduce(hasil.sesi, { type: 'tolak-langkah', ply })
        kirimSemua(mati.kirim)
        setSesi(mati.sesi)
        return
      }

      const { state: next, events } = applyMove(sekarang, hole, rulesetRef.current)
      const lapor = reduce(hasil.sesi, {
        type: 'langkah-diterapkan',
        ply,
        hashLokal: hashOf(next, rulesetRef.current.id),
      })
      kirimSemua(lapor.kirim)
      setSesi(lapor.sesi)

      player.play(sekarang.board, events, () => setState(next))
    },
    [kirimSemua, player],
  )

  const mulai = useCallback(
    async (sebagai: Peran) => {
      setGalat(null)
      setPeran(sebagai)
      // Tuan rumah memegang pemain A, tamu memegang B. Disepakati di jabat
      // tangan dan ditolak kalau keduanya mengaku sama.
      const baru = buatSesi(sebagai, ruleset.id, sebagai === 'tuan-rumah' ? 0 : 1)
      setSesi(baru)
      sesiRef.current = baru

      const handler = {
        onPesan,
        onStatus: (s: StatusKoneksi) => {
          setKoneksi(s)
          if (s === 'tersambung') {
            // Jabat tangan dikirim begitu saluran terbuka: ruleset id
            // diperiksa sebelum satu langkah pun berpindah.
            saluran.current?.kirim(encodePesan(halo(sesiRef.current!)))
          }
        },
      }

      try {
        if (sebagai === 'tuan-rumah') {
          const sisi = await mulaiTuanRumah(handler)
          saluran.current = sisi.saluran()
          setTawaran(sisi.tawaran)
          hostRef.current = sisi
        } else {
          setTawaran('')
        }
      } catch (error) {
        setGalat(error instanceof Error ? error.message : String(error))
        setKoneksi('gagal')
      }
    },
    [ruleset.id, onPesan],
  )

  const hostRef = useRef<Awaited<ReturnType<typeof mulaiTuanRumah>> | null>(null)

  const terimaTempelan = useCallback(async () => {
    setGalat(null)
    try {
      if (peran === 'tuan-rumah') {
        await hostRef.current?.terimaJawaban(tempel)
      } else {
        const sisi = await mulaiTamu(tempel, {
          onPesan,
          onStatus: (s: StatusKoneksi) => {
            setKoneksi(s)
            if (s === 'tersambung') {
              saluran.current?.kirim(encodePesan(halo(sesiRef.current!)))
            }
          },
        })
        saluran.current = sisi.saluran()
        setTawaran(sisi.jawaban)
      }
    } catch (error) {
      setGalat(error instanceof Error ? error.message : String(error))
    }
  }, [peran, tempel, onPesan])

  const akuPemain = peran === 'tuan-rumah' ? PLAYER_A : PLAYER_B
  const giliranku = sesi?.status === 'siap' && state.status === 'berjalan' && state.toMove === akuPemain
  const legal = useMemo(() => currentLegalMoves(state), [state])

  const pilih = useCallback(
    (hole: number) => {
      if (!giliranku || !sesi) return
      const { state: next, events } = applyMove(state, hole, ruleset)
      const hasil = reduce(sesi, {
        type: 'langkah-lokal',
        hole,
        hash: hashOf(next, ruleset.id),
      })
      kirimSemua(hasil.kirim)
      setSesi(hasil.sesi)
      player.play(state.board, events, () => setState(next))
    },
    [giliranku, sesi, state, ruleset, kirimSemua, player],
  )

  useEffect(() => () => saluran.current?.tutup(), [])

  const frame = player.frame

  if (!peran) {
    return (
      <div className="flex flex-col gap-4">
        <p className="max-w-prose font-sans text-sm text-ink/70">{kata.tandingIntro}</p>
        <label className="flex items-center gap-2 font-sans text-sm">
          <span className="text-ink/60">{kata.rulesetAktif}</span>
          <select
            value={ruleset.id}
            onChange={(e) => setRuleset(getRuleset(e.target.value))}
            className="rounded-full border border-teak/40 bg-mat px-3 py-1.5 text-sm"
          >
            {RULESETS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => mulai('tuan-rumah')}
            className="rounded-full bg-teak px-4 py-2 font-sans text-sm text-seedA"
          >
            {kata.jadiTuanRumah}
          </button>
          <button
            type="button"
            onClick={() => mulai('tamu')}
            className="rounded-full border border-teak/40 px-4 py-2 font-sans text-sm"
          >
            {kata.jadiTamu}
          </button>
        </div>
        <p className="max-w-prose font-sans text-xs text-ink/50">{kata.tanpaTurn}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-teak/20 bg-mat/60 p-3">
        <p className="font-sans text-sm">
          <span className="text-ink/60">{peran === 'tuan-rumah' ? kata.jadiTuanRumah : kata.jadiTamu}</span>
          {' · '}
          <span className="font-mono text-xs">{ruleset.name}</span>
          {' · '}
          <span className="font-mono text-xs text-ink/60">{kata[`koneksi_${koneksi}`]}</span>
        </p>

        {tawaran && (
          <label className="flex flex-col gap-1">
            <span className="font-sans text-xs uppercase tracking-widest text-ink/50">
              {peran === 'tuan-rumah' ? kata.salinTawaran : kata.salinJawaban}
            </span>
            <textarea
              readOnly
              value={tawaran}
              onFocus={(e) => e.currentTarget.select()}
              rows={3}
              className="w-full rounded-xl border border-teak/30 bg-mat p-2 font-mono text-[10px]"
            />
          </label>
        )}

        {sesi?.status !== 'siap' && (
          <label className="flex flex-col gap-1">
            <span className="font-sans text-xs uppercase tracking-widest text-ink/50">
              {peran === 'tuan-rumah' ? kata.tempelJawaban : kata.tempelTawaran}
            </span>
            <textarea
              value={tempel}
              onChange={(e) => setTempel(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-teak/30 bg-mat p-2 font-mono text-[10px]"
            />
            <button
              type="button"
              onClick={terimaTempelan}
              className="self-start rounded-full bg-teak px-4 py-1.5 font-sans text-sm text-seedA"
            >
              {kata.sambung}
            </button>
          </label>
        )}

        {galat && <p className="font-sans text-sm text-seedB">{galat}</p>}

        {sesi?.status === 'halt' && sesi.alasanHalt && (
          // Desync dilaporkan ke kedua pemain, dan tidak ada sisi yang
          // diam-diam dipercaya untuk memperbaikinya.
          <p
            role="alert"
            className="rounded-xl border border-brass bg-brass/15 p-3 font-sans text-sm"
          >
            {alasanTeks(sesi.alasanHalt)}
          </p>
        )}
      </div>

      {sesi?.status === 'siap' && (
        <>
          <p className="font-display text-lg font-bold" role="status">
            {giliranku ? kata.giliranmu : kata.giliranLawan}
          </p>
          <Papan
            cells={frame.cells}
            active={frame.active}
            secondary={frame.secondary}
            playable={giliranku && !player.playing ? legal : []}
            previewed={null}
            onSelect={pilih}
            namaA={`${kata.pemain} A`}
            namaB={`${kata.pemain} B`}
          />
        </>
      )}
    </div>
  )
}
