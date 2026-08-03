'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { applyMove, createGame, currentLegalMoves, type GameState } from '@/lib/engine/apply'
import { PLAYER_A, PLAYER_B } from '@/lib/engine/board'
import {
  encodeRecord,
  emptyRecord,
  replay,
  withMove,
  withoutLastMove,
  type GameRecord,
} from '@/lib/engine/replay'
import type { Kesulitan } from '@/lib/ai/search'
import { RULESETS, getRuleset, type Ruleset } from '@/lib/rulesets'
import { t, type Locale } from '@/lib/i18n'
import { Papan } from '@/components/board/Papan'
import { KECEPATAN, usePenaburan, type Kecepatan } from '@/components/sow/usePenaburan'
import { pratinjauTeks, ringkasPratinjau } from '@/components/preview/ringkas'
import { PemilihAturan } from './PemilihAturan'
import { useAi } from './useAi'
import { bacaStatistik, catatHasil, dariRekaman, type Statistik } from './stats'

export type Mode = 'hotseat' | 'ai'

const KESULITAN: readonly Kesulitan[] = ['mudah', 'sedang', 'sulit']

/**
 * The board. Hotseat, or against the AI.
 *
 * The move list is the game (invariant 11). State is held alongside it as
 * a cache, and undo replays a shorter list rather than unwinding anything.
 */
export function Permainan({ ruleset: awal, locale }: { ruleset: Ruleset; locale: Locale }) {
  const kata = t(locale)

  const [ruleset, setRuleset] = useState<Ruleset>(awal)
  const [mode, setMode] = useState<Mode>('hotseat')
  const [kesulitan, setKesulitan] = useState<Kesulitan>('sedang')
  const [record, setRecord] = useState<GameRecord>(() => emptyRecord(ruleset.id))
  const [state, setState] = useState<GameState>(() => createGame())
  const [kecepatan, setKecepatan] = useState<Kecepatan>('sedang')
  const [busy, setBusy] = useState(false)
  const [previewed, setPreviewed] = useState<number | null>(null)
  const [berpikir, setBerpikir] = useState(false)
  /**
   * Dinaikkan sesudah statistik ditulis. Panel statistik adalah anak, dan
   * efek anak berjalan sebelum efek induk — tanpa penanda ini panel
   * membaca localStorage tepat sebelum hasil permainan ditulis ke sana,
   * lalu tidak pernah membaca lagi, jadi statistik tidak pernah muncul.
   */
  const [statVersi, setStatVersi] = useState(0)

  const player = usePenaburan(state.board, kecepatan)
  const { pikirkan } = useAi(ruleset.id)

  // AI selalu pemain B, supaya sisi manusia tetap di baris bawah.
  const giliranAi = mode === 'ai' && state.toMove === PLAYER_B && state.status === 'berjalan'

  const legal = useMemo(() => currentLegalMoves(state), [state])
  const playable = busy || giliranAi || state.status === 'selesai' ? [] : legal

  const jalankan = useCallback(
    (hole: number) => {
      const { state: next, events } = applyMove(state, hole, ruleset)
      setBusy(true)
      setPreviewed(null)
      player.play(state.board, events, () => {
        setState(next)
        setRecord((r) => withMove(r, hole))
        setBusy(false)
      })
    },
    [state, ruleset, player],
  )

  const pilih = useCallback(
    (hole: number) => {
      if (busy || giliranAi || state.status === 'selesai') return
      jalankan(hole)
    },
    [busy, giliranAi, state.status, jalankan],
  )

  /**
   * Giliran AI. Pencarian berjalan di worker, jadi utas utama tetap bebas
   * dan animasi giliran sebelumnya tidak tersendat.
   *
   * Efek ini hanya boleh bergantung pada hal yang berubah sekali per
   * giliran. usePenaburan mengembalikan objek baru tiap render, jadi
   * `jalankan` ikut berganti identitas tiap bingkai animasi; kalau efek
   * ini bergantung padanya, tiap bingkai membatalkan pencarian yang
   * sedang jalan dan memulai yang baru — dan pada kecepatan animasi apa
   * pun AI tidak pernah sempat selesai berpikir. Karena itu semuanya
   * lewat ref, dan pemicunya adalah nomor giliran.
   */
  const aiRef = useRef(0)
  const jalankanRef = useRef(jalankan)
  const stateRef = useRef(state)
  const pikirkanRef = useRef(pikirkan)
  useEffect(() => {
    jalankanRef.current = jalankan
    stateRef.current = state
    pikirkanRef.current = pikirkan
  })

  useEffect(() => {
    if (!giliranAi || busy) {
      setBerpikir(false)
      return
    }
    let batal = false
    const token = ++aiRef.current
    const posisi = stateRef.current
    setBerpikir(true)

    pikirkanRef
      .current(posisi, kesulitan, posisi.moveCount * 31 + 7)
      .then((response) => {
        if (batal || token !== aiRef.current) return
        setBerpikir(false)
        jalankanRef.current(response.move)
      })
      .catch(() => {
        if (batal || token !== aiRef.current) return
        setBerpikir(false)
        // Kalau worker gagal, papan tidak boleh menggantung: mainkan
        // langkah sah pertama daripada membekukan permainan.
        const fallback = currentLegalMoves(stateRef.current)[0]
        if (fallback !== undefined) jalankanRef.current(fallback)
      })

    return () => {
      batal = true
    }
  }, [giliranAi, busy, kesulitan, state.moveCount])

  const baru = useCallback(() => {
    aiRef.current++
    const fresh = createGame()
    setRecord(emptyRecord(ruleset.id))
    setState(fresh)
    setBusy(false)
    setBerpikir(false)
    player.reset(fresh.board)
  }, [ruleset.id, player])

  const urung = useCallback(() => {
    if (busy || record.moves.length === 0) return
    aiRef.current++
    // Lawan AI, urungkan sampai giliran manusia lagi — kalau tidak, AI
    // langsung menjawab dan tidak ada yang berubah bagi pemain.
    let shorter = withoutLastMove(record)
    let hasil = replay(shorter, ruleset)
    while (mode === 'ai' && shorter.moves.length > 0 && hasil.final.toMove === PLAYER_B) {
      shorter = withoutLastMove(shorter)
      hasil = replay(shorter, ruleset)
    }
    setRecord(shorter)
    setState(hasil.final)
    setBerpikir(false)
    player.reset(hasil.final.board)
  }, [busy, record, ruleset, player, mode])

  const gantiMode = useCallback(
    (next: Mode) => {
      setMode(next)
      aiRef.current++
      const fresh = createGame()
      setRecord(emptyRecord(ruleset.id))
      setState(fresh)
      setBusy(false)
      setBerpikir(false)
      player.reset(fresh.board)
    },
    [ruleset.id, player],
  )

  const gantiAturan = useCallback(
    (id: string) => {
      // Aturan hanya boleh berganti di antara permainan. Mengganti di
      // tengah jalan akan membuat daftar langkah tidak lagi cocok dengan
      // ruleset-nya, dan daftar langkah plus id itulah permainannya.
      if (busy || record.moves.length > 0) return
      const next = getRuleset(id)
      aiRef.current++
      const fresh = createGame()
      setRuleset(next)
      setRecord(emptyRecord(next.id))
      setState(fresh)
      setBusy(false)
      setBerpikir(false)
      player.reset(fresh.board)
    },
    [busy, record.moves.length, player],
  )

  // Statistik dicatat sekali per permainan selesai, dari aliran event yang
  // memang sudah ada — tidak ada yang dilacak selama bermain.
  const dicatat = useRef<string | null>(null)
  useEffect(() => {
    if (state.status !== 'selesai' || state.hasil === null || busy) return
    const kunci = `${ruleset.id}:${record.moves.join('')}`
    if (dicatat.current === kunci) return
    dicatat.current = kunci

    const { steps } = replay(record, ruleset)
    const { bankTerbesar, sambungTerpanjang } = dariRekaman(steps)
    catatHasil({ rulesetId: ruleset.id, hasil: state.hasil, bankTerbesar, sambungTerpanjang })
    setStatVersi((v) => v + 1)
  }, [state.status, state.hasil, busy, record, ruleset])

  const pratinjau = useMemo(() => {
    if (previewed === null || busy || giliranAi) return null
    return ringkasPratinjau(state, previewed, ruleset)
  }, [previewed, busy, giliranAi, state, ruleset])

  const frame = player.frame
  const skorA = frame.cells[7]
  const skorB = frame.cells[15]

  return (
    <div className="flex flex-col gap-5">
      <PemilihAturan
        rulesets={RULESETS}
        active={ruleset}
        onChange={gantiAturan}
        locale={locale}
        disabled={busy || record.moves.length > 0}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Pilihan
          options={[
            ['hotseat', kata.hotseat],
            ['ai', kata.lawanAi],
          ]}
          value={mode}
          onChange={gantiMode}
          label={kata.mode}
        />
        {mode === 'ai' && (
          <Pilihan
            options={KESULITAN.map((k) => [k, kata[k]] as const)}
            value={kesulitan}
            onChange={setKesulitan}
            label={kata.kesulitan}
          />
        )}
      </div>

      <Giliran
        state={state}
        kata={kata}
        mode={mode}
        skorA={skorA}
        skorB={skorB}
        hand={frame.hand}
        berpikir={berpikir}
      />

      <Papan
        cells={frame.cells}
        active={frame.active}
        secondary={frame.secondary}
        playable={playable}
        previewed={previewed}
        onSelect={pilih}
        onPreview={setPreviewed}
        namaA={`${kata.pemain} A`}
        namaB={mode === 'ai' ? kata.ai : `${kata.pemain} B`}
      />

      {/* Pratinjau langkah: ke mana rantai berakhir, berapa yang ditabung,
          apakah menembak atau dapat giliran lagi (PRD §8.2). */}
      <p className="min-h-6 font-sans text-sm text-ink/75" aria-live="polite">
        {pratinjau ? (
          <>
            <span className="font-mono text-xs text-ink/50">
              {kata.pratinjau} {pratinjau.hole} →{' '}
            </span>
            {pratinjauTeks(pratinjau)}
          </>
        ) : (
          <span className="text-ink/35">{kata.pratinjauPetunjuk}</span>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={baru}
          className="rounded-full bg-teak px-4 py-2 font-sans text-sm text-seedA transition hover:brightness-110"
        >
          {kata.permainanBaru}
        </button>
        <button
          type="button"
          onClick={urung}
          disabled={busy || record.moves.length === 0}
          className="rounded-full border border-teak/40 px-4 py-2 font-sans text-sm text-ink transition enabled:hover:bg-teak/10 disabled:opacity-40"
        >
          {kata.urung}
        </button>
        {player.playing && (
          <button
            type="button"
            onClick={player.skip}
            className="rounded-full border border-brass px-4 py-2 font-sans text-sm text-ink transition hover:bg-brass/15"
          >
            {kata.lewati}
          </button>
        )}

        <span className="ml-auto flex items-center gap-1">
          <span className="mr-1 font-sans text-xs uppercase tracking-wide text-ink/60">
            {kata.kecepatan}
          </span>
          <Pilihan
            options={KECEPATAN.map((k) => [k, kata[k]] as const)}
            value={kecepatan}
            onChange={setKecepatan}
            label={kata.kecepatan}
          />
        </span>
      </div>

      <Riwayat lines={player.ringkasan} kata={kata} />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-xs text-ink/50">
          {kata.kodePermainan}: {encodeRecord(record)}
        </p>
        <PanelStatistik rulesetId={ruleset.id} kata={kata} versi={statVersi} />
      </div>
    </div>
  )
}

function Pilihan<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly (readonly [T, string])[]
  value: T
  onChange: (next: T) => void
  /**
   * Nama grup, wajib. Beberapa pilihan memakai kata yang sama — "Sedang"
   * ada di kesulitan dan di kecepatan — jadi tanpa nama grup keduanya
   * tidak bisa dibedakan oleh pembaca layar maupun oleh siapa pun yang
   * menavigasi dengan papan tik.
   */
  label: string
}) {
  return (
    <span role="group" aria-label={label} className="flex items-center gap-1">
      {options.map(([key, teks]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={value === key}
          aria-label={`${label}: ${teks}`}
          className={[
            'rounded-full px-3 py-1 font-sans text-xs transition',
            value === key ? 'bg-ink text-mat' : 'border border-teak/30 text-ink/70',
          ].join(' ')}
        >
          {teks}
        </button>
      ))}
    </span>
  )
}

function Giliran({
  state,
  kata,
  mode,
  skorA,
  skorB,
  hand,
  berpikir,
}: {
  state: GameState
  kata: ReturnType<typeof t>
  mode: Mode
  skorA: number
  skorB: number
  hand: number
  berpikir: boolean
}) {
  if (state.status === 'selesai') {
    // Seri adalah hasil yang sah — 98 genap, jadi 49–49 terjangkau.
    const teks =
      state.hasil === 'seri'
        ? `${kata.seri}, ${skorA}–${skorB}`
        : `${kata.pemain} ${state.hasil === 'a' ? 'A' : 'B'} ${kata.menang}, ${skorA}–${skorB}`
    return (
      <p className="font-display text-2xl font-bold" role="status">
        {teks}
      </p>
    )
  }

  const namaGiliran =
    state.toMove === PLAYER_A
      ? `${kata.pemain} A`
      : mode === 'ai'
        ? kata.ai
        : `${kata.pemain} B`

  return (
    <p className="flex flex-wrap items-baseline gap-x-3 font-display text-xl" role="status">
      <span className="font-bold">
        {kata.giliran}: {namaGiliran}
      </span>
      <span className="tnum font-sans text-sm text-ink/60">
        {kata.skor} {skorA}–{skorB}
      </span>
      {hand > 0 && (
        <span className="tnum font-sans text-sm text-brass">
          {hand} {kata.diTangan}
        </span>
      )}
      {berpikir && <span className="font-sans text-sm text-ink/50">{kata.berpikir}</span>}
    </p>
  )
}

/**
 * Local stats, per ruleset (PRD §8.7). Read after mount only — reading
 * localStorage during render would make the server-rendered HTML and the
 * first client render disagree.
 */
function PanelStatistik({
  rulesetId,
  kata,
  versi,
}: {
  rulesetId: string
  kata: ReturnType<typeof t>
  versi: number
}) {
  const [stat, setStat] = useState<Statistik | null>(null)
  useEffect(() => {
    setStat(bacaStatistik(rulesetId))
  }, [rulesetId, versi])

  if (!stat || stat.dimainkan === 0) return null
  return (
    <p className="tnum font-mono text-xs text-ink/50">
      {kata.statistik}: {stat.dimainkan} {kata.dimainkan.toLowerCase()} · {kata.menangA}{' '}
      {stat.menangA} · {kata.seri.toLowerCase()} {stat.seri} · bank {stat.bankTerbesar} ·
      sambung {stat.sambungTerpanjang}
    </p>
  )
}

function Riwayat({ lines, kata }: { lines: readonly string[]; kata: ReturnType<typeof t> }) {
  return (
    <div
      // Ringkasan tertulis adalah jalur utama untuk prefers-reduced-motion,
      // dan sekaligus tempat pembaca layar mengikuti giliran.
      aria-live="polite"
      className="max-h-32 overflow-y-auto rounded-2xl border border-teak/20 bg-mat/60 p-3"
    >
      <h2 className="mb-1 font-sans text-xs uppercase tracking-widest text-ink/50">
        {kata.riwayat}
      </h2>
      {lines.length === 0 ? (
        <p className="font-sans text-sm text-ink/50">{kata.belumAdaLangkah}</p>
      ) : (
        <ol className="flex flex-col gap-0.5">
          {lines.map((line, i) => (
            <li key={i} className="font-sans text-sm text-ink/75">
              {line}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
