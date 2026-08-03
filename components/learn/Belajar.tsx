'use client'

import { useCallback, useMemo, useState } from 'react'
import { applyMove, currentLegalMoves, type GameState } from '@/lib/engine/apply'
import { BOARD_SIZE, PLAYER_A } from '@/lib/engine/board'
import { countSeeds } from '@/lib/engine/conserve'
import { PELAJARAN, PELAJARAN_RULESET, type Pelajaran } from '@/lib/learn/pelajaran'
import { getRuleset } from '@/lib/rulesets'
import { t, type Locale } from '@/lib/i18n'
import { Papan } from '@/components/board/Papan'
import { usePenaburan } from '@/components/sow/usePenaburan'

const rules = getRuleset(PELAJARAN_RULESET)

function stateOf(pelajaran: Pelajaran): GameState {
  const board = new Int8Array(BOARD_SIZE)
  for (const [index, biji] of pelajaran.cells) board[index] = biji
  return {
    board,
    toMove: PLAYER_A,
    status: 'berjalan',
    // Papan pelajaran sengaja kecil supaya terbaca sebagai diagram, jadi
    // konservasi diuji terhadap jumlahnya sendiri, bukan 98.
    seedsInPlay: countSeeds(board),
    moveCount: 0,
    hasil: null,
  }
}

type Jawab = 'belum' | 'tepat' | 'meleset'

/**
 * Learn mode (PRD §8.6). Three real positions rather than three
 * paragraphs — you are shown a board and asked to find the move, not told
 * a rule and asked to believe it.
 *
 * Any legal move can be played, and the sow runs either way. Being wrong
 * is the point of a lesson; it just says what happened and offers another
 * go.
 */
export function Belajar({ locale }: { locale: Locale }) {
  const kata = t(locale)
  const [ke, setKe] = useState(0)
  const [jawab, setJawab] = useState<Jawab>('belum')
  const [busy, setBusy] = useState(false)

  const pelajaran = PELAJARAN[ke]
  const awal = useMemo(() => stateOf(pelajaran), [pelajaran])
  const [state, setState] = useState<GameState>(awal)

  const player = usePenaburan(awal.board, 'sedang')

  const muat = useCallback(
    (index: number) => {
      const p = PELAJARAN[index]
      const fresh = stateOf(p)
      setKe(index)
      setState(fresh)
      setJawab('belum')
      setBusy(false)
      player.reset(fresh.board)
    },
    [player],
  )

  const ulangi = useCallback(() => muat(ke), [muat, ke])

  const pilih = useCallback(
    (hole: number) => {
      if (busy || jawab !== 'belum') return
      const { state: next, events } = applyMove(state, hole, rules)
      setBusy(true)
      player.play(state.board, events, () => {
        setState(next)
        setJawab(hole === pelajaran.jawaban ? 'tepat' : 'meleset')
        setBusy(false)
      })
    },
    [busy, jawab, state, player, pelajaran.jawaban],
  )

  const legal = useMemo(() => currentLegalMoves(state), [state])
  const playable = busy || jawab !== 'belum' ? [] : legal
  const frame = player.frame

  return (
    <div className="flex flex-col gap-5">
      <nav className="flex flex-wrap items-center gap-2" aria-label={kata.belajar}>
        {PELAJARAN.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => muat(i)}
            aria-current={i === ke}
            className={[
              'rounded-full px-3 py-1 font-sans text-xs transition',
              i === ke ? 'bg-ink text-mat' : 'border border-teak/30 text-ink/70',
            ].join(' ')}
          >
            {i + 1}. {p.judul[locale]}
          </button>
        ))}
      </nav>

      <div>
        <h2 className="font-display text-2xl font-bold">{pelajaran.judul[locale]}</h2>
        <p className="mt-1 max-w-prose font-sans text-ink/80">{pelajaran.ajakan[locale]}</p>
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

      <div aria-live="polite" className="min-h-24">
        {jawab === 'belum' && (
          <p className="font-sans text-sm text-ink/50">{kata.pilihLubang}</p>
        )}
        {jawab === 'tepat' && (
          <div className="rounded-2xl border border-brass bg-brass/10 p-3">
            <p className="font-display text-base font-bold">{kata.tepat}</p>
            <p className="mt-1 max-w-prose font-sans text-sm text-ink/85">
              {pelajaran.kenapa[locale]}
            </p>
          </div>
        )}
        {jawab === 'meleset' && (
          <div className="rounded-2xl border border-teak/30 p-3">
            <p className="font-display text-base font-bold">{kata.belumTepat}</p>
            <p className="mt-1 max-w-prose font-sans text-sm text-ink/85">
              {pelajaran.meleset[locale]}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={ulangi}
          className="rounded-full border border-teak/40 px-4 py-2 font-sans text-sm transition hover:bg-teak/10"
        >
          {kata.ulangiPosisi}
        </button>
        {jawab === 'tepat' && ke < PELAJARAN.length - 1 && (
          <button
            type="button"
            onClick={() => muat(ke + 1)}
            className="rounded-full bg-teak px-4 py-2 font-sans text-sm text-seedA transition hover:brightness-110"
          >
            {kata.pelajaranBerikutnya}
          </button>
        )}
        {jawab === 'tepat' && ke === PELAJARAN.length - 1 && (
          <a
            href={`/${locale}/main/`}
            className="rounded-full bg-teak px-4 py-2 font-sans text-sm text-seedA transition hover:brightness-110"
          >
            {kata.mainSekarang}
          </a>
        )}
      </div>

      <p className="max-w-prose font-mono text-xs text-ink/45">{kata.belajarCatatan}</p>
    </div>
  )
}
