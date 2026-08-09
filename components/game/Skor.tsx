'use client'

import { PLAYER_A, PLAYER_B, type Player } from '@/lib/engine/board'
import type { GameState } from '@/lib/engine/apply'
import { Biji } from '@/components/board/Biji'
import type { t } from '@/lib/i18n'

/**
 * Who is winning, whose turn it is, and what is happening right now.
 *
 * This was one sentence — "Giliran: Pemain A" — with the score set beside
 * it in small grey type. But the banked count *is* the game: it is the
 * only thing being played for, and PRD §11 puts the counts at the centre
 * of the type system for exactly that reason. Two banks, the lead between
 * them, and the state of the turn in the middle.
 *
 * Everything here reads from the animation frame rather than from state,
 * so the numbers climb with the seeds as they drop instead of jumping when
 * the turn is over.
 */
export function Skor({
  state,
  kata,
  namaA,
  namaB,
  skorA,
  skorB,
  hand,
  berpikir,
}: {
  state: GameState
  kata: ReturnType<typeof t>
  namaA: string
  namaB: string
  skorA: number
  skorB: number
  hand: number
  berpikir: boolean
}) {
  const selesai = state.status === 'selesai'
  const beda = Math.abs(skorA - skorB)

  return (
    <div className="flex items-stretch gap-2 rounded-panel bg-mat-high p-2.5 shadow-raise ring-1 ring-mat-edge/60 sm:gap-3 sm:p-3">
      <Sisi
        owner={PLAYER_A}
        nama={namaA}
        skor={skorA}
        giliran={!selesai && state.toMove === PLAYER_A}
        menang={selesai && state.hasil === 'a'}
        kata={kata}
      />

      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-center">
        <p className="font-display text-sm font-bold leading-tight sm:text-base" role="status">
          {/* Seri adalah hasil yang sah — 98 genap, jadi 49–49 terjangkau. */}
          {selesai
            ? state.hasil === 'seri'
              ? kata.seri
              : `${state.hasil === 'a' ? namaA : namaB} ${kata.menang}`
            : `${kata.giliran} ${state.toMove === PLAYER_A ? namaA : namaB}`}
        </p>

        {/* Satu baris kedua, dan tiga hal bisa menempatinya menurut urutan
            kepentingannya: biji yang sedang di tangan selama animasi, lalu
            AI yang sedang berpikir, lalu selisih yang berlaku sekarang. */}
        <p aria-live="polite" className="min-h-4 font-sans text-2xs leading-tight text-fg-muted">
          {hand > 0 ? (
            <span className="tnum text-brass">
              {hand} {kata.diTangan}
            </span>
          ) : berpikir ? (
            kata.berpikir
          ) : (
            <span className="tnum">
              {beda === 0
                ? kata.imbang
                : `${skorA > skorB ? namaA : namaB} ${kata.unggul} ${beda}`}
            </span>
          )}
        </p>
      </div>

      <Sisi
        owner={PLAYER_B}
        nama={namaB}
        skor={skorB}
        giliran={!selesai && state.toMove === PLAYER_B}
        menang={selesai && state.hasil === 'b'}
        kata={kata}
        kanan
      />
    </div>
  )
}

function Sisi({
  owner,
  nama,
  skor,
  giliran,
  menang,
  kata,
  kanan = false,
}: {
  owner: Player
  nama: string
  skor: number
  giliran: boolean
  menang: boolean
  kata: ReturnType<typeof t>
  kanan?: boolean
}) {
  return (
    <div
      className={[
        // Sisi pemain selebar isinya, bukan separuh layar: yang di tengah —
        // giliran siapa sekarang — yang berhak melebar.
        'flex min-w-0 shrink-0 flex-col gap-0.5 rounded-xl px-2.5 py-2 transition sm:px-3',
        kanan ? 'items-end text-right' : 'items-start text-left',
        giliran || menang ? 'bg-mat ring-1 ring-teak/30' : 'ring-1 ring-transparent',
      ].join(' ')}
    >
      <span
        className={[
          'flex min-w-0 max-w-full items-center gap-1.5',
          kanan ? 'flex-row-reverse' : '',
        ].join(' ')}
      >
        {/* Bentuk biji, bukan warna, yang menandai sisi siapa (invariant 18). */}
        <Biji owner={owner} size={8} />
        <span className="truncate font-sans text-xs text-fg">{nama}</span>
      </span>
      <span className="tnum font-display text-xl font-bold leading-none sm:text-2xl">{skor}</span>
      {/* Giliran ditandai oleh latar dan cincin kartu ini; kata "giliran"
          sendiri sudah ada di tengah, dan tidak perlu dikatakan dua kali. */}
      <span
        className={[
          'font-sans text-2xs uppercase tracking-[0.14em]',
          menang ? 'text-teak' : 'text-transparent',
        ].join(' ')}
      >
        {kata.menang}
      </span>
    </div>
  )
}
