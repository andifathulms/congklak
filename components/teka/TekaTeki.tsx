'use client'

import { useCallback, useMemo, useState } from 'react'
import { applyMove, currentLegalMoves, type GameState } from '@/lib/engine/apply'
import { BOARD_SIZE, PLAYER_A } from '@/lib/engine/board'
import { countSeeds } from '@/lib/engine/conserve'
import { capaian, nilaiGiliran, tercapai, type Sasaran } from '@/lib/teka/sasaran'
import { TEKA, TEKA_RULESET, type TekaTeki as Teka } from '@/lib/teka/teka'
import { getRuleset } from '@/lib/rulesets'
import { t, type Locale } from '@/lib/i18n'
import { Papan } from '@/components/board/Papan'
import { usePenaburan } from '@/components/sow/usePenaburan'
import { Panel } from '@/components/ui/Panel'
import { Tombol, TautanTombol } from '@/components/ui/Tombol'

const rules = getRuleset(TEKA_RULESET)

function stateOf(teka: Teka): GameState {
  const board = new Int8Array(BOARD_SIZE)
  for (const [index, biji] of teka.cells) board[index] = biji
  return {
    board,
    toMove: PLAYER_A,
    status: 'berjalan',
    // Papan teka-teki sengaja kecil, jadi konservasi diuji terhadap
    // jumlahnya sendiri, bukan 98 — sama seperti posisi pelajaran.
    seedsInPlay: countSeeds(board),
    moveCount: 0,
    hasil: null,
  }
}

type Jawab = { readonly status: 'belum' } | { readonly status: 'sudah'; readonly capai: number }

/**
 * Puzzle mode. Learn mode teaches the rules; this asks you to use them.
 *
 * Any legal move can be played and the sow runs either way — the miss is
 * where the learning is, and it comes back with the number that move
 * actually produced rather than a scolding.
 */
export function TekaTeki({ locale }: { locale: Locale }) {
  const kata = t(locale)
  const [ke, setKe] = useState(0)
  const [jawab, setJawab] = useState<Jawab>({ status: 'belum' })
  const [petunjuk, setPetunjuk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [selesai, setSelesai] = useState<readonly string[]>([])

  const teka = TEKA[ke]
  const awal = useMemo(() => stateOf(teka), [teka])
  const [state, setState] = useState<GameState>(awal)
  // Posisi teka-teki sengaja padat, dan rantai delapan sambung di kecepatan
  // sedang berjalan belasan detik — terlalu lama untuk sesuatu yang mau
  // dicoba berkali-kali. Cepat, dengan jalan keluar kalau masih kelamaan.
  const player = usePenaburan(awal.board, 'cepat')

  const muat = useCallback(
    (index: number) => {
      const fresh = stateOf(TEKA[index])
      setKe(index)
      setState(fresh)
      setJawab({ status: 'belum' })
      setPetunjuk(false)
      setBusy(false)
      player.reset(fresh.board)
    },
    [player],
  )

  const pilih = useCallback(
    (hole: number) => {
      if (busy || jawab.status === 'sudah') return
      const { state: next, events } = applyMove(state, hole, rules)
      const hasil = nilaiGiliran(events)
      const kena = tercapai(teka.sasaran, hasil)

      setBusy(true)
      player.play(state.board, events, () => {
        setState(next)
        setJawab({ status: 'sudah', capai: capaian(teka.sasaran, hasil) })
        setBusy(false)
        if (kena) setSelesai((s) => (s.includes(teka.id) ? s : [...s, teka.id]))
      })
    },
    [busy, jawab.status, state, player, teka],
  )

  const legal = useMemo(() => currentLegalMoves(state), [state])
  const playable = busy || jawab.status === 'sudah' ? [] : legal
  const frame = player.frame
  const kena = jawab.status === 'sudah' && tercapai(teka.sasaran, { ...kosong, ...isi(teka.sasaran, jawab.capai) })
  const semua = selesai.length === TEKA.length

  return (
    <div className="flex flex-col gap-5">
      <nav className="flex flex-wrap items-center gap-1.5" aria-label={kata.teka}>
        {TEKA.map((p, i) => {
          const beres = selesai.includes(p.id)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => muat(i)}
              aria-current={i === ke ? 'step' : undefined}
              className={[
                'flex items-center gap-2 rounded-full py-1 pl-1 pr-3 font-sans text-xs transition',
                i === ke
                  ? 'bg-mat-high text-fg shadow-raise ring-1 ring-teak/30'
                  : 'text-fg-muted hover:bg-mat-high hover:text-fg',
              ].join(' ')}
            >
              {/* Sudah selesai, sedang dikerjakan, dan belum disentuh adalah
                  tiga keadaan berbeda, dan kemajuan lima teka-teki adalah
                  satu-satunya hal yang dilacak layar ini. Dua cabang pertama
                  dulu identik, jadi lingkarannya tidak mengatakan apa-apa dan
                  hanya pilnya yang membedakan. */}
              <span
                className={[
                  'tnum flex h-5 w-5 items-center justify-center rounded-full font-display text-2xs font-bold',
                  beres
                    ? 'bg-teak text-fg-wood'
                    : i === ke
                      ? 'bg-mat text-fg ring-2 ring-inset ring-teak'
                      : 'bg-mat-low text-fg-muted',
                ].join(' ')}
              >
                {beres ? '✓' : i + 1}
              </span>
              {p.judul[locale]}
            </button>
          )
        })}
      </nav>

      <div>
        <h2 className="font-display text-xl font-bold">{teka.judul[locale]}</h2>
        <p className="mt-1 max-w-prose font-sans leading-relaxed text-fg-muted">
          {teka.ajakan[locale]}
        </p>
        <p className="mt-2 inline-flex items-baseline gap-2 rounded-full bg-mat-low px-3 py-1 font-sans text-sm ring-1 ring-inset ring-mat-edge">
          <span className="text-2xs uppercase tracking-[0.14em] text-fg-muted">
            {kata.tekaSasaran}
          </span>
          <span className="tnum font-medium">{sasaranTeks(teka.sasaran, locale)}</span>
        </p>
      </div>

      <Papan
        cells={frame.cells}
        active={frame.active}
        secondary={frame.secondary}
        playable={playable}
        previewed={null}
        onSelect={pilih}
        namaA={`${kata.pemain} A`}
        namaB={`${kata.pemain} B`}
      />

      {/* Tinggi tetap: kotak hasil yang muncul tiba-tiba akan mendorong
          papan ke atas persis saat pemain sedang melihatnya. */}
      <div aria-live="polite" className="min-h-24">
        {jawab.status === 'belum' && (
          <p className="font-sans text-sm text-fg-muted">{kata.pilihLubang}</p>
        )}
        {jawab.status === 'sudah' && (
          <div
            className={[
              'rounded-panel p-3.5 ring-1',
              kena ? 'bg-mat-high shadow-raise ring-teak/40' : 'bg-mat-low/60 ring-mat-edge',
            ].join(' ')}
          >
            <p className="font-display text-base font-bold">
              {kena ? kata.tekaBerhasil : kata.tekaBelum}
            </p>
            <p className="tnum mt-1 max-w-prose font-sans text-sm leading-relaxed text-fg">
              {kena
                ? teka.kenapa[locale]
                : teka.sasaran.jenis === 'giliran-lagi'
                  ? // Sasaran ya-atau-tidak: "menghasilkan 0 dari —" tidak
                    // mengatakan apa pun kepada siapa pun.
                    kata.tekaCapaiLagi
                  : kata.tekaCapai
                      .replace('{n}', String(jawab.capai))
                      .replace('{target}', String(teka.sasaran.minimal))}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {player.playing && <Tombol onClick={player.skip}>{kata.lewati}</Tombol>}
        <Tombol onClick={() => muat(ke)}>{kata.tekaUlangi}</Tombol>
        {kena && ke < TEKA.length - 1 && (
          <Tombol bobot="utama" onClick={() => muat(ke + 1)}>
            {kata.tekaBerikutnya}
          </Tombol>
        )}
        {semua && (
          <TautanTombol href={`/${locale}/main`} bobot="utama">
            {kata.mainSekarang}
          </TautanTombol>
        )}
        {!kena && jawab.status === 'belum' && !petunjuk && (
          <Tombol bobot="sunyi" onClick={() => setPetunjuk(true)}>
            {kata.tekaLihatPetunjuk}
          </Tombol>
        )}
      </div>

      {petunjuk && jawab.status === 'belum' && (
        <Panel judul={kata.tekaPetunjuk}>
          <p className="max-w-prose font-sans text-sm leading-relaxed text-fg">
            {teka.petunjuk[locale]}
          </p>
        </Panel>
      )}

      {semua && <p className="font-sans font-medium">{kata.tekaSelesai}</p>}

      <p className="max-w-prose font-sans text-xs leading-relaxed text-fg-muted">
        {kata.tekaCatatan}
      </p>
    </div>
  )
}

const kosong = { tabung: 0, tembak: 0, sambung: 0, giliranLagi: false }

/** Membangun ulang hasil dari satu angka capaian, supaya `tercapai` tetap
 *  jadi satu-satunya tempat aturan menang-kalahnya ditulis. */
function isi(sasaran: Sasaran, capai: number) {
  switch (sasaran.jenis) {
    case 'tabung':
      return { tabung: capai }
    case 'menembak':
      return { tembak: capai }
    case 'sambung':
      return { sambung: capai }
    case 'giliran-lagi':
      return { giliranLagi: capai > 0 }
  }
}

function sasaranTeks(sasaran: Sasaran, locale: Locale): string {
  const id = locale === 'id'
  switch (sasaran.jenis) {
    case 'tabung':
      return id ? `Tabung ${sasaran.minimal} biji` : `Bank ${sasaran.minimal} seeds`
    case 'menembak':
      return id ? `Menembak ${sasaran.minimal} biji` : `Capture ${sasaran.minimal} seeds`
    case 'sambung':
      return id ? `Sambung ${sasaran.minimal} kali` : `Relay ${sasaran.minimal} times`
    case 'giliran-lagi':
      return id ? 'Dapat giliran lagi' : 'Earn another turn'
  }
}
