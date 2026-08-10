'use client'

import { useMemo, useState } from 'react'
import { applyMove } from '@/lib/engine/apply'
import { BOARD_SIZE, PLAYER_A, type Board } from '@/lib/engine/board'
import { countSeeds } from '@/lib/engine/conserve'
import { framesFor } from '@/components/sow/frames'
import { Papan } from '@/components/board/Papan'
import { Tombol } from '@/components/ui/Tombol'
import { getRuleset } from '@/lib/rulesets'
import { t, type Locale } from '@/lib/i18n'

/**
 * One turn, worked through, before the visitor touches anything.
 *
 * The app argues that congklak's rules differ by region — and never said
 * what the rules *are*. "98" appeared in no string on the site, nor did the
 * goal, nor what happens when you pick a hole. A newcomer was asked to make
 * a move whose consequences they had no way to predict, and then shown
 * nineteen lines of vocabulary nobody had given them.
 *
 * Stepped rather than narrated, because the point is to watch the seeds
 * move, and every line carries the arithmetic it is describing: which hole,
 * what it held, what it holds now, what is left in the hand.
 *
 * The position and the move are fixed, and the events come from the real
 * engine under the real default ruleset — so what this teaches is what the
 * app actually does, and cannot drift from it.
 */
const CONTOH_ATURAN = 'umum'
const CONTOH_CELLS: readonly (readonly [number, number])[] = [
  [4, 5],
  [10, 3],
]
const CONTOH_LANGKAH = 4

function papanAwal(): Board {
  const board = new Int8Array(BOARD_SIZE)
  for (const [i, n] of CONTOH_CELLS) board[i] = n
  return board
}

export function ContohGiliran({ locale }: { locale: Locale }) {
  const kata = t(locale)

  const { frames, teks } = useMemo(() => {
    const board = papanAwal()
    const { events } = applyMove(
      {
        board,
        toMove: PLAYER_A,
        status: 'berjalan',
        // Papan contoh sengaja kecil, jadi konservasi diuji terhadap
        // jumlahnya sendiri — sama seperti posisi pelajaran.
        seedsInPlay: countSeeds(board),
        moveCount: 0,
        hasil: null,
      },
      CONTOH_LANGKAH,
      getRuleset(CONTOH_ATURAN),
    )

    const semua = framesFor(papanAwal(), events)
    // Bingkai yang tidak mengajarkan apa pun dibuang: 'turnEnd' hanya
    // mengulang apa yang baru saja dikatakan 'henti'.
    const dipakai = semua.filter((f) => !f.event || f.event.type !== 'turnEnd')

    const teks = dipakai.map((f) => {
      const e = f.event
      // Bingkai pertama belum punya peristiwa: ia adalah posisi awalnya,
      // dan itu justru yang perlu dijelaskan lebih dulu.
      if (!e) return kata.contohAwal
      switch (e.type) {
        case 'scoop':
          return kata.contohAmbil.replace(/\{n\}/g, String(e.biji)).replace('{i}', String(e.index))
        case 'sow':
          return kata.contohJatuh
            .replace('{i}', String(e.index))
            .replace('{a}', String(e.biji - 1))
            .replace('{b}', String(e.biji))
            .replace('{s}', String(e.sisa))
        case 'bank':
          return kata.contohLumbung
            .replace('{a}', String(e.biji - 1))
            .replace('{b}', String(e.biji))
            .replace('{s}', String(e.sisa))
        default:
          return kata.contohSelesai
      }
    })

    return { frames: dipakai, teks }
  }, [kata])

  const [at, setAt] = useState(0)
  const frame = frames[at]
  const akhir = at === frames.length - 1

  return (
    <section className="flex flex-col gap-3 rounded-panel bg-mat-high p-4 shadow-raise ring-1 ring-mat-edge/60">
      <h2 className="font-display text-lg font-bold">{kata.contohJudul}</h2>
      <p className="max-w-prose font-sans text-sm leading-relaxed text-fg-muted">
        {kata.contohIntro} <strong className="font-medium text-fg">{kata.contohTujuan}</strong>
      </p>

      <Papan
        locale={locale}
        cells={frame.cells}
        active={frame.active}
        secondary={frame.secondary}
        // Papan contoh: tidak ada yang bisa diklik di sini, dan langkahnya
        // sudah ditentukan. Yang bergerak adalah tombol di bawahnya.
        playable={[]}
        previewed={null}
        namaA={`${kata.pemain} A`}
        namaB={`${kata.pemain} B`}
      />
      <p className="font-sans text-xs text-fg-muted">{kata.contohPapanIni}</p>

      {/* Tinggi tetap, supaya papan tidak melompat saat kalimatnya berganti
          panjang dari satu langkah ke langkah berikutnya. */}
      <p
        aria-live="polite"
        className="tnum flex min-h-[3.5rem] items-center rounded-lg bg-mat px-3 py-2 font-sans text-sm leading-relaxed text-fg ring-1 ring-inset ring-mat-edge/60"
      >
        {teks[at]}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Tombol onClick={() => setAt((i) => Math.max(0, i - 1))} disabled={at === 0}>
          ← {kata.contohSebelum}
        </Tombol>
        {akhir ? (
          <Tombol bobot="utama" onClick={() => setAt(0)}>
            {kata.contohUlang}
          </Tombol>
        ) : (
          <Tombol bobot="utama" onClick={() => setAt((i) => Math.min(frames.length - 1, i + 1))}>
            {kata.contohBerikut} →
          </Tombol>
        )}
        <span className="tnum font-sans text-xs text-fg-muted">
          {kata.contohLangkahKe
            .replace('{n}', String(at + 1))
            .replace('{total}', String(frames.length))}
        </span>
      </div>

      {/* Jujur soal apa yang tidak ditunjukkan contoh ini. */}
      <p className="max-w-prose font-sans text-xs leading-relaxed text-fg-muted">
        {kata.contohLewatiLumbung}
      </p>
    </section>
  )
}
