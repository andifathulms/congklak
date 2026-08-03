'use client'

import { LUMBUNG_A, LUMBUNG_B, PLAYER_A, PLAYER_B, type Player } from '@/lib/engine/board'
import { Lubang } from './Lubang'
import { LumbungView } from './Lumbung'

/**
 * The board is one continuous carved form with the holes as recesses in
 * it — not fourteen separate cards (PRD §11).
 *
 * Orientation. A's lubang run right to left along the bottom as 0..6, with
 * A's lumbung at the left end; B's run left to right along the top as
 * 8..14, with B's lumbung at the right. Opposite holes sit one above the
 * other: bottom position k is hole 6−k, top position k is hole 8+k, and
 * opposite(6−k) = 8+k.
 *
 * That layout makes the sow read clockwise on screen — bottom-right, along
 * to the left, up into the lumbung, across the top, down the right side.
 * Both shipped packs' sources describe clockwise sowing, so a board that
 * animated the other way would visibly contradict its own citation.
 *
 * It stays a rendering choice, exactly as PRD §6 requires: the engine only
 * ever sows by increasing index, and direction is never encoded twice.
 */
export const BARIS_ATAS = [8, 9, 10, 11, 12, 13, 14] as const
export const BARIS_BAWAH = [6, 5, 4, 3, 2, 1, 0] as const

export function ownerOfHole(index: number): Player {
  return index <= 6 ? PLAYER_A : PLAYER_B
}

export interface PapanProps {
  cells: readonly number[]
  active: number | null
  secondary: number | null
  /** Lubang yang boleh diklik sekarang. Kosong saat animasi berjalan. */
  playable: readonly number[]
  previewed: number | null
  onSelect?: (index: number) => void
  onPreview?: (index: number | null) => void
  namaA: string
  namaB: string
}

export function Papan({
  cells,
  active,
  secondary,
  playable,
  previewed,
  onSelect,
  onPreview,
  namaA,
  namaB,
}: PapanProps) {
  const canPlay = (index: number) => playable.includes(index)

  const hole = (index: number) => (
    <Lubang
      key={index}
      index={index}
      biji={cells[index]}
      // Bentuk biji menandai sisi siapa lubang itu — itulah kepemilikan
      // yang bisa dibaca tanpa membedakan warna.
      owner={ownerOfHole(index)}
      active={active === index}
      secondary={secondary === index}
      playable={canPlay(index)}
      previewed={previewed === index}
      onSelect={onSelect}
      onPreview={onPreview}
      label={`Lubang ${index}, ${cells[index]} biji${canPlay(index) ? ', bisa ditabur' : ''}`}
    />
  )

  return (
    <div
      className="rounded-[2.5rem] bg-teak p-4 shadow-[0_18px_40px_rgba(36,28,20,0.35),inset_0_2px_0_rgba(240,231,212,0.12)] sm:p-6"
      role="group"
      aria-label="Papan congklak"
    >
      <div className="grid grid-cols-[minmax(3.5rem,1fr)_7fr_minmax(3.5rem,1fr)] items-center gap-3 sm:gap-4">
        <LumbungView
          owner={PLAYER_A}
          biji={cells[LUMBUNG_A]}
          active={active === LUMBUNG_A}
          name={namaA}
        />

        <div className="grid grid-rows-2 gap-6 sm:gap-7">
          <div className="grid grid-cols-7 gap-2 sm:gap-3">{BARIS_ATAS.map(hole)}</div>
          <div className="grid grid-cols-7 gap-2 sm:gap-3">{BARIS_BAWAH.map(hole)}</div>
        </div>

        <LumbungView
          owner={PLAYER_B}
          biji={cells[LUMBUNG_B]}
          active={active === LUMBUNG_B}
          name={namaB}
        />
      </div>
    </div>
  )
}
