'use client'

import { PLAYER_A, type Player } from '@/lib/engine/board'
import { TumpukanBiji } from './Biji'

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
  const isA = owner === PLAYER_A

  // brass hanya untuk lubang aktif dan peristiwa tembakan — tidak untuk
  // hal lain (PRD §11). Sorotan pertimbangan dibuat samar, bukan brass.
  const ring = active
    ? 'ring-4 ring-brass'
    : secondary
      ? 'ring-4 ring-brass/60'
      : previewed
        ? 'ring-2 ring-seedA/50'
        : 'ring-0'

  return (
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
        'bg-hollow shadow-[inset_0_3px_8px_rgba(0,0,0,0.55)] transition-[box-shadow,transform]',
        ring,
        playable ? 'cursor-pointer hover:brightness-110 focus-visible:outline-none' : 'cursor-default',
        playable ? '' : 'opacity-95',
      ].join(' ')}
    >
      <TumpukanBiji biji={biji} owner={owner} />
      {biji === 0 && <span className="sr-only">kosong</span>}
      <span
        aria-hidden
        className={[
          'absolute -bottom-5 tnum font-mono text-[10px]',
          isA ? 'text-ink/45' : 'text-ink/45',
        ].join(' ')}
      >
        {biji}
      </span>
    </button>
  )
}
