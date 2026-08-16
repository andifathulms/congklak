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
import { Tombol, TautanTombol } from '@/components/ui/Tombol'

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
      {/* Tiga posisi, dan mana yang sedang dikerjakan: sebuah langkah, bukan
          sebaris tombol yang semuanya terlihat sama. */}
      <nav className="flex flex-wrap items-center gap-1.5" aria-label={kata.belajar}>
        {PELAJARAN.map((p, i) => (
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
            <span
              className={[
                'tnum flex h-5 w-5 items-center justify-center rounded-full font-display text-2xs font-bold',
                i === ke ? 'bg-teak text-fg-wood' : 'bg-mat-low text-fg-muted',
              ].join(' ')}
            >
              {i + 1}
            </span>
            {p.judul[locale]}
          </button>
        ))}
      </nav>

      <div>
        <h2 className="font-display text-xl font-bold">{pelajaran.judul[locale]}</h2>
        <p className="mt-1 max-w-prose font-sans leading-relaxed text-fg">
          {pelajaran.ajakan[locale]}
        </p>
      </div>

      <Papan
          locale={locale}
        cells={frame.cells}
        active={frame.active}
        secondary={frame.secondary}
        highlight={frame.highlight}
        playable={playable}
        previewed={null}
        onSelect={pilih}
        namaA={`${kata.pemain} A`}
        namaB={`${kata.pemain} B`}
      />

      {/* Tinggi tetap: kotak jawaban yang muncul tiba-tiba akan mendorong
          papan ke atas tepat saat pemain sedang melihatnya. */}
      <div aria-live="polite" className="min-h-24">
        {jawab === 'belum' && <p className="font-sans text-sm text-fg-muted">{kata.pilihLubang}</p>}
        {jawab !== 'belum' && (
          // Benar dan meleset dibedakan oleh bobot, bukan oleh brass —
          // brass hanya untuk lubang aktif dan tembakan (PRD §11).
          <div
            className={[
              'rounded-panel p-3.5 ring-1',
              jawab === 'tepat'
                ? 'bg-mat-high shadow-raise ring-teak/40'
                : 'bg-mat-low/60 ring-mat-edge',
            ].join(' ')}
          >
            <p className="font-display text-base font-bold">
              {jawab === 'tepat' ? kata.tepat : kata.belumTepat}
            </p>
            <p className="mt-1 max-w-prose font-sans text-sm leading-relaxed text-fg">
              {jawab === 'tepat' ? pelajaran.kenapa[locale] : pelajaran.meleset[locale]}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Tombol onClick={ulangi}>{kata.ulangiPosisi}</Tombol>
        {jawab === 'tepat' && ke < PELAJARAN.length - 1 && (
          <Tombol bobot="utama" onClick={() => muat(ke + 1)}>
            {kata.pelajaranBerikutnya}
          </Tombol>
        )}
        {jawab === 'tepat' && ke === PELAJARAN.length - 1 && (
          <TautanTombol href={`/${locale}/main`} bobot="utama">
            {kata.mainSekarang}
          </TautanTombol>
        )}
      </div>

      <p className="max-w-prose font-sans text-xs leading-relaxed text-fg-muted">
        {kata.belajarCatatan}
      </p>
    </div>
  )
}
