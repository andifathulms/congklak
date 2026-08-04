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
      // `on-teak` switches the global focus ring to seedA: an ink ring is
      // invisible against the wood.
      // w-full is load-bearing next to mx-auto: as a flex item, an auto
      // cross-axis margin cancels the stretch, and the board collapses to
      // its content width.
      className="on-teak mx-auto w-full max-w-[10.5rem] rounded-board bg-teak bg-grain p-3 shadow-carve ring-1 ring-teak-rim/40 sm:max-w-none sm:p-6"
      role="group"
      aria-label="Papan congklak"
    >
      {/*
        On a phone the board stands upright. Laid out lengthwise, fourteen
        holes and two lumbung across 390px leaves each hole about 34px —
        under any reasonable touch target, with biji too small to count.
        Standing it up is a rigid quarter turn of the whole figure, so the
        sow still reads clockwise and opposite holes still sit beside each
        other: A's lumbung at the top, A's row down the left, B's row down
        the right, B's lumbung at the bottom.

        One DOM either way. The rows are the same elements, laid out as
        columns and placed explicitly, so there is no second copy of the
        board for a screen reader or the keyboard to walk through.
      */}
      <div className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[minmax(3.5rem,1fr)_7fr_minmax(3.5rem,1fr)] sm:grid-rows-2 sm:gap-x-4 sm:gap-y-4 md:grid-cols-[minmax(5.5rem,1fr)_7fr_minmax(5.5rem,1fr)] md:gap-x-5">
        {/* A's lumbung stays at the left end and B's at the right: that is
            what makes the sow read clockwise on screen, and all three packs'
            sources describe clockwise sowing. Swapping these would put the
            board in visible contradiction with its own citation. */}
        <div className="col-span-2 sm:col-span-1 sm:col-start-1 sm:row-span-2 sm:row-start-1">
          <LumbungView
            owner={PLAYER_A}
            biji={cells[LUMBUNG_A]}
            active={active === LUMBUNG_A}
            name={namaA}
          />
        </div>

        <div className="col-start-2 row-start-2 grid grid-cols-1 gap-2 sm:col-start-2 sm:row-start-1 sm:grid-cols-7 sm:gap-3">
          {BARIS_ATAS.map(hole)}
        </div>
        <div className="col-start-1 row-start-2 grid grid-cols-1 gap-2 sm:col-start-2 sm:row-start-2 sm:grid-cols-7 sm:gap-3">
          {BARIS_BAWAH.map(hole)}
        </div>

        <div className="col-span-2 sm:col-span-1 sm:col-start-3 sm:row-span-2 sm:row-start-1">
          <LumbungView
            owner={PLAYER_B}
            biji={cells[LUMBUNG_B]}
            active={active === LUMBUNG_B}
            name={namaB}
          />
        </div>
      </div>
    </div>
  )
}
