'use client'

import { useCallback, useMemo, useState } from 'react'
import { applyMove, createGame, currentLegalMoves, scoreOf, type GameState } from '@/lib/engine/apply'
import { PLAYER_A, PLAYER_B } from '@/lib/engine/board'
import { encodeRecord, emptyRecord, replay, withMove, withoutLastMove, type GameRecord } from '@/lib/engine/replay'
import type { Ruleset } from '@/lib/rulesets'
import { t, type Locale } from '@/lib/i18n'
import { Papan } from '@/components/board/Papan'
import { KECEPATAN, usePenaburan, type Kecepatan } from '@/components/sow/usePenaburan'

/**
 * Hotseat. Two players, one device.
 *
 * The move list is the game (invariant 11). State is held alongside it as
 * a cache, and undo simply replays a shorter list rather than unwinding
 * anything.
 */
export function Permainan({ ruleset, locale }: { ruleset: Ruleset; locale: Locale }) {
  const kata = t(locale)

  const [record, setRecord] = useState<GameRecord>(() => emptyRecord(ruleset.id))
  const [state, setState] = useState<GameState>(() => createGame())
  const [kecepatan, setKecepatan] = useState<Kecepatan>('sedang')
  const [busy, setBusy] = useState(false)
  const [previewed, setPreviewed] = useState<number | null>(null)

  const player = usePenaburan(state.board, kecepatan)

  const legal = useMemo(() => currentLegalMoves(state), [state])
  const playable = busy || state.status === 'selesai' ? [] : legal

  const pilih = useCallback(
    (hole: number) => {
      if (busy || state.status === 'selesai') return
      const { state: next, events } = applyMove(state, hole, ruleset)
      setBusy(true)
      setPreviewed(null)
      player.play(state.board, events, () => {
        setState(next)
        setRecord((r) => withMove(r, hole))
        setBusy(false)
      })
    },
    [busy, state, ruleset, player],
  )

  const baru = useCallback(() => {
    const fresh = createGame()
    setRecord(emptyRecord(ruleset.id))
    setState(fresh)
    setBusy(false)
    player.reset(fresh.board)
  }, [ruleset.id, player])

  const urung = useCallback(() => {
    if (busy || record.moves.length === 0) return
    const shorter = withoutLastMove(record)
    const { final } = replay(shorter, ruleset)
    setRecord(shorter)
    setState(final)
    player.reset(final.board)
  }, [busy, record, ruleset, player])

  const frame = player.frame
  const skorA = frame.cells[7]
  const skorB = frame.cells[15]

  return (
    <div className="flex flex-col gap-6">
      <Giliran state={state} kata={kata} skorA={skorA} skorB={skorB} hand={frame.hand} />

      <Papan
        cells={frame.cells}
        active={frame.active}
        secondary={frame.secondary}
        playable={playable}
        previewed={previewed}
        onSelect={pilih}
        onPreview={setPreviewed}
        namaA={`${kata.pemain} A`}
        namaB={`${kata.pemain} B`}
      />

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
          <span className="font-sans text-xs uppercase tracking-wide text-ink/60">
            {kata.kecepatan}
          </span>
          {KECEPATAN.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKecepatan(k)}
              aria-pressed={kecepatan === k}
              className={[
                'rounded-full px-3 py-1 font-sans text-xs transition',
                kecepatan === k ? 'bg-ink text-mat' : 'border border-teak/30 text-ink/70',
              ].join(' ')}
            >
              {kata[k]}
            </button>
          ))}
        </span>
      </div>

      <Riwayat lines={player.ringkasan} kata={kata} />

      <p className="font-mono text-xs text-ink/50">
        {kata.kodePermainan}: {encodeRecord(record)}
      </p>
    </div>
  )
}

function Giliran({
  state,
  kata,
  skorA,
  skorB,
  hand,
}: {
  state: GameState
  kata: ReturnType<typeof t>
  skorA: number
  skorB: number
  hand: number
}) {
  if (state.status === 'selesai') {
    // Seri adalah hasil yang sah — 98 genap, jadi 49–49 terjangkau.
    const teks =
      state.hasil === 'seri'
        ? `${kata.seri}, ${skorA}–${skorB}`
        : `${kata.pemain} ${state.hasil === 'a' ? 'A' : 'B'} ${kata.menang}, ${
            state.hasil === 'a' ? `${skorA}–${skorB}` : `${skorB}–${skorA}`
          }`
    return (
      <p className="font-display text-2xl font-bold" role="status">
        {teks}
      </p>
    )
  }

  const giliran = state.toMove === PLAYER_A ? 'A' : 'B'
  return (
    <p className="flex items-baseline gap-3 font-display text-xl" role="status">
      <span className="font-bold">
        {kata.giliran}: {kata.pemain} {giliran}
      </span>
      <span className="tnum font-sans text-sm text-ink/60">
        {kata.skor} {skorA}–{skorB}
      </span>
      {hand > 0 && (
        <span className="tnum font-sans text-sm text-brass">{hand} biji di tangan</span>
      )}
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

export { PLAYER_A, PLAYER_B, scoreOf }
