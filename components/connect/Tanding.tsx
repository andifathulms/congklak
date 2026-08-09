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
import { brokerTamu, brokerTuanRumah, miripKode, type SisiBroker } from '@/lib/net/broker'
import { RULESETS, getRuleset, type Ruleset } from '@/lib/rulesets'
import { t, type Locale } from '@/lib/i18n'
import { Papan } from '@/components/board/Papan'
import { usePenaburan } from '@/components/sow/usePenaburan'
import { Panel } from '@/components/ui/Panel'
import { Salin } from '@/components/ui/Salin'
import { Segmen } from '@/components/ui/Segmen'
import { Tombol } from '@/components/ui/Tombol'

/**
 * Two devices, one game. Moves and hashes cross the wire and nothing else
 * (invariant 12); the hash is compared every turn and a mismatch halts
 * both sides rather than being reconciled (invariant 13).
 */
export function Tanding({ locale }: { locale: Locale }) {
  const kata = t(locale)

  const [ruleset, setRuleset] = useState<Ruleset>(RULESETS[0])
  /**
   * Dua lapisan pengenalan. Broker lebih enak dipakai; tempel manual tidak
   * bergantung pada apa pun. Kalau broker gagal — servernya mati, impor
   * dinamisnya tidak sampai, jaringannya memblokir — kita jatuh ke manual
   * dan mengatakannya, bukan membiarkan layarnya menggantung.
   */
  const [jalur, setJalur] = useState<'broker' | 'manual'>('broker')
  const [kodeBroker, setKodeBroker] = useState('')
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

      // Lewat broker, tuan rumah cukup mengumumkan satu kode pendek dan
      // tamu memanggilnya. Kalau lapisan itu gagal dengan alasan apa pun,
      // kita turun ke tempel manual dan mengatakannya — bukan berhenti.
      if (jalur === 'broker' && sebagai === 'tuan-rumah') {
        try {
          const sisi = await brokerTuanRumah(handler)
          brokerRef.current = sisi
          saluran.current = sisi.saluran()
          setKodeBroker(sisi.kode)
          return
        } catch (error) {
          setGalat(
            `${error instanceof Error ? error.message : String(error)} — ${kata.brokerGagal}`,
          )
          setJalur('manual')
        }
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
    [ruleset.id, onPesan, jalur, kata.brokerGagal],
  )

  /** Tamu memanggil kode tuan rumah lewat broker. */
  const panggilKode = useCallback(async () => {
    setGalat(null)
    // Mistyping a code once is normal, so retrying has to be clean. The
    // previous attempt's peer keeps its own error handler alive, and it
    // would go on reporting "gagal" over a connection that has since
    // succeeded — the second attempt looking broken because the first one
    // was still talking.
    brokerRef.current?.tutup()
    brokerRef.current = null
    try {
      const sisi = await brokerTamu(tempel, {
        onPesan,
        onStatus: (s: StatusKoneksi) => {
          setKoneksi(s)
          if (s === 'tersambung') {
            saluran.current?.kirim(encodePesan(halo(sesiRef.current!)))
          }
        },
      })
      brokerRef.current = sisi
      saluran.current = sisi.saluran()
    } catch (error) {
      setGalat(`${error instanceof Error ? error.message : String(error)} — ${kata.brokerGagal}`)
      setJalur('manual')
    }
  }, [tempel, onPesan, kata.brokerGagal])

  const hostRef = useRef<Awaited<ReturnType<typeof mulaiTuanRumah>> | null>(null)
  const brokerRef = useRef<SisiBroker | null>(null)

  const terimaTempelan = useCallback(async () => {
    setGalat(null)
    // Kode pendek yang ditempel ke kotak manual bukan kesalahan pemain: dua
    // orang memilih caranya sendiri-sendiri, dan yang satu mengirimkan apa
    // yang dilihatnya. Katakan persis apa yang harus dilakukan, jangan
    // teruskan keluhan pengurai JSON.
    if (miripKode(tempel)) {
      setGalat(kata.iniKodePendek)
      return
    }
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
    } catch {
      // Apa pun bentuk kegagalannya di bawah sana, bagi pemain artinya satu
      // hal: teks yang ditempel tidak utuh.
      setGalat(kata.tempelanTakTerbaca)
    }
  }, [peran, tempel, onPesan, kata.iniKodePendek, kata.tempelanTakTerbaca])

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
        {/* Menyambung punya tiga keputusan: aturan mana, lewat jalur apa,
            dan jadi siapa. Sebelumnya ketiganya mengalir sebagai satu
            tumpukan tanpa urutan; sekarang dinomori. */}
        <Panel judul={`1 · ${kata.rulesetAktif}`}>
          <select
            value={ruleset.id}
            onChange={(e) => setRuleset(getRuleset(e.target.value))}
            aria-label={kata.rulesetAktif}
            className="rounded-full bg-mat-low px-3 py-1.5 font-sans text-sm text-fg ring-1 ring-inset ring-mat-edge"
          >
            {RULESETS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          {/* Kedua sisi harus memakai aturan yang sama, dan itu diperiksa
              saat berkenalan — bukan diperbaiki diam-diam nanti. */}
          <p className="mt-2 max-w-prose font-sans text-xs leading-relaxed text-fg-muted">
            {kata.tandingIntro}
          </p>
        </Panel>

        <Panel judul={`2 · ${kata.caraSambung}`} className="flex flex-col gap-2.5">
          <Segmen
            options={[
              ['broker', kata.jalurBroker],
              ['manual', kata.jalurManual],
            ]}
            value={jalur}
            onChange={setJalur}
            label={kata.caraSambung}
          />
          {/* Ini bukan selera masing-masing: dua orang yang memilih cara
              berbeda tidak akan pernah bertemu, dan sebelumnya tidak ada
              apa pun di layar yang mengatakannya. */}
          <p className="max-w-prose font-sans text-xs font-medium leading-relaxed text-fg">
            {kata.caraHarusSama}
          </p>
          <p className="max-w-prose font-sans text-xs leading-relaxed text-fg-muted">
            {jalur === 'broker' ? kata.jalurBrokerCatatan : kata.jalurManualCatatan}
          </p>
        </Panel>

        <Panel judul={`3 · ${kata.tanding}`}>
          <div className="flex flex-wrap gap-2">
            <Tombol bobot="utama" onClick={() => mulai('tuan-rumah')}>
              {kata.jadiTuanRumah}
            </Tombol>
            <Tombol onClick={() => mulai('tamu')}>{kata.jadiTamu}</Tombol>
          </div>
        </Panel>

        <p className="max-w-prose font-sans text-xs leading-relaxed text-fg-muted">
          {kata.tanpaTurn}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <Panel className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-sm">
          <span className="font-medium">
            {peran === 'tuan-rumah' ? kata.jadiTuanRumah : kata.jadiTamu}
          </span>
          <span aria-hidden className="text-fg-muted">
            ·
          </span>
          <span className="font-mono text-xs text-fg-muted">{ruleset.name}</span>
          {/* Status sambungan dibaca sekilas, jadi ia punya penanda sendiri
              — bukan potongan ketiga dari sebuah kalimat. */}
          <span
            className={[
              'ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-sans text-xs',
              koneksi === 'tersambung'
                ? 'bg-teak/15 text-fg'
                : koneksi === 'putus' || koneksi === 'gagal'
                  ? 'bg-seedB/15 text-seedB'
                  : 'bg-mat-low text-fg-muted',
            ].join(' ')}
          >
            <span
              aria-hidden
              className={[
                'h-1.5 w-1.5 rounded-full',
                koneksi === 'tersambung'
                  ? 'bg-teak'
                  : koneksi === 'putus' || koneksi === 'gagal'
                    ? 'bg-seedB'
                    : 'bg-ink/35',
              ].join(' ')}
            />
            {kata[`koneksi_${koneksi}`]}
          </span>
        </div>

        {/* Jalur broker: satu kode pendek yang cukup dibacakan. */}
        {kodeBroker && (
          <div className="flex flex-col gap-1">
            <span className="font-sans text-2xs uppercase tracking-[0.14em] text-fg-muted">
              {kata.kodeSambungan}
            </span>
            <span className="flex flex-wrap items-center gap-3">
              <span className="tnum select-all font-display text-2xl font-bold tracking-[0.2em]">
                {kodeBroker}
              </span>
              <Salin teks={kodeBroker} locale={locale} />
            </span>
          </div>
        )}

        {jalur === 'broker' && peran === 'tamu' && sesi?.status !== 'siap' && (
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-2xs uppercase tracking-[0.14em] text-fg-muted">
              {kata.masukkanKode}
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <input
                value={tempel}
                onChange={(e) => setTempel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && panggilKode()}
                className="w-48 rounded-full bg-mat-low px-4 py-2 font-mono text-lg tracking-widest text-fg ring-1 ring-inset ring-mat-edge"
                aria-label={kata.kodeSambungan}
              />
              <Tombol bobot="utama" onClick={panggilKode}>
                {kata.sambung}
              </Tombol>
            </span>
          </label>
        )}

        {/* Sesudah tersambung, blok teks perkenalan tidak berguna lagi —
            dan ia besar, jadi ia akan menutupi status sambungan. */}
        {tawaran && sesi?.status !== 'siap' && (
          <label className="flex flex-col gap-1.5">
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-sans text-2xs uppercase tracking-[0.14em] text-fg-muted">
                {peran === 'tuan-rumah' ? kata.salinTawaran : kata.salinJawaban}
              </span>
              {/* Blok teks ini panjang dan harus utuh; menyeretnya dengan
                  tangan adalah cara sambungan salah tersalin. */}
              <Salin teks={tawaran} locale={locale} />
            </span>
            <textarea
              readOnly
              value={tawaran}
              onFocus={(e) => e.currentTarget.select()}
              rows={3}
              className="w-full rounded-xl bg-mat-low p-2 font-mono text-2xs leading-relaxed text-fg ring-1 ring-inset ring-mat-edge"
            />
          </label>
        )}

        {jalur === 'manual' && sesi?.status !== 'siap' && (
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-2xs uppercase tracking-[0.14em] text-fg-muted">
              {peran === 'tuan-rumah' ? kata.tempelJawaban : kata.tempelTawaran}
            </span>
            <textarea
              value={tempel}
              onChange={(e) => setTempel(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-mat-low p-2 font-mono text-2xs leading-relaxed text-fg ring-1 ring-inset ring-mat-edge"
            />
            <Tombol bobot="utama" className="self-start" onClick={terimaTempelan}>
              {kata.sambung}
            </Tombol>
          </label>
        )}

        {/*
          Sebuah sambungan yang gagal dulu hanya mengubah satu keping kecil
          dari "belum tersambung" jadi "gagal tersambung", tanpa satu kata
          pun tentang apa yang harus dilakukan. Yang dirasakan pemain: tombol
          Sambungkan ditekan, lalu tidak terjadi apa-apa.

          brokerTamu tidak melempar untuk kode yang salah — ia selesai begitu
          soket brokernya terbuka, dan kegagalan memanggil kode itu datang
          belakangan lewat onStatus. Jadi pesannya harus datang dari status,
          bukan dari blok catch.
        */}
        {(galat || koneksi === 'gagal') && (
          <p
            role="alert"
            className="rounded-panel bg-seedB/10 p-3 font-sans text-sm leading-relaxed text-fg ring-1 ring-inset ring-seedB/40"
          >
            {galat ?? kata.sambungGagal}
          </p>
        )}

        {sesi?.status === 'halt' && sesi.alasanHalt && (
          // Desync dilaporkan ke kedua pemain, dan tidak ada sisi yang
          // diam-diam dipercaya untuk memperbaikinya. Ditandai tamarind,
          // bukan brass: brass hanya milik lubang aktif dan tembakan.
          <p
            role="alert"
            className="rounded-panel bg-seedB/10 p-3 font-sans text-sm ring-1 ring-inset ring-seedB/50"
          >
            {alasanTeks(sesi.alasanHalt)}
          </p>
        )}
      </Panel>

      {sesi?.status === 'siap' && (
        <>
          <p
            className="rounded-panel bg-mat-high p-3 font-display text-lg font-bold shadow-raise ring-1 ring-mat-edge/60"
            role="status"
          >
            {giliranku ? kata.giliranmu : kata.giliranLawan}
          </p>
          <Papan
          locale={locale}
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
