'use client'

import { TumpukanBiji } from './Biji'
import type { Player } from '@/lib/engine/board'

export interface LubangProps {
  index: number
  biji: number
  /** Pemilik lubang — menentukan bentuk biji yang digambar. */
  owner: Player
  active: boolean
  secondary: boolean
  playable: boolean
  previewed: boolean
  onSelect?: (index: number) => void
  onPreview?: (index: number | null) => void
  label: string
}

/**
 * A recess in the board, not a circle drawn on it.
 *
 * Depth comes from three layers that all have to agree: a dark pit, an
 * inner shadow cast from the top rim, and a lit rim on the wood around it.
 * A single flat fill reads as a sticker.
 *
 * The count sits engraved on the wood below the hole rather than inside
 * it, because inside it would fight the biji for the same few pixels.
 */
export function Lubang({
  index,
  biji,
  owner,
  active,
  secondary,
  playable,
  previewed,
  onSelect,
  onPreview,
  label,
}: LubangProps) {
  // brass hanya untuk lubang aktif dan peristiwa tembakan — tidak untuk
  // hal lain (PRD §11). Lubang yang bisa dipilih dan lubang yang sedang
  // dipertimbangkan memakai cahaya pada kayu, bukan brass.
  const cincin = active
    ? 'ring-[3px] ring-brass ring-offset-2 ring-offset-teak-grain'
    : secondary
      ? 'ring-2 ring-brass/60'
      : previewed
        ? 'ring-2 ring-seedA/45'
        : playable
          ? 'ring-1 ring-teak-rim/70'
          : 'ring-0'

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={!playable}
        aria-label={label}
        aria-pressed={active}
        onClick={playable ? () => onSelect?.(index) : undefined}
        onMouseEnter={playable ? () => onPreview?.(index) : undefined}
        onMouseLeave={playable ? () => onPreview?.(null) : undefined}
        onFocus={playable ? () => onPreview?.(index) : undefined}
        onBlur={playable ? () => onPreview?.(null) : undefined}
        className={[
          'relative flex aspect-square w-full items-center justify-center rounded-full',
          'bg-hollow bg-pit shadow-recess transition duration-150',
          cincin,
          playable
            ? 'cursor-pointer hover:-translate-y-px hover:bg-hollow-deep active:translate-y-0'
            : 'cursor-default',
        ].join(' ')}
      >
        <TumpukanBiji biji={biji} owner={owner} />
        {biji === 0 && <span className="sr-only">kosong</span>}
      </button>

      {/* Ukiran angka pada kayu: cukup terbaca untuk dihitung, cukup samar
          untuk tidak bersaing dengan biji di dalam lubang. */}
      <span
        aria-hidden
        className={[
          'tnum font-display text-[11px] leading-none transition-colors',
          active ? 'font-bold text-brass' : playable ? 'text-seedA/60' : 'text-seedA/35',
        ].join(' ')}
      >
        {biji}
      </span>
    </div>
  )
}
