'use client'

import type { Player } from '@/lib/engine/board'
import { Biji } from './Biji'

/**
 * The lumbung — the granary at each end where biji are banked. Larger and
 * deeper than a lubang, because that is what it is on a carved board.
 *
 * The banked count is the largest number on the screen. It is what the
 * game is played for, and until now it sat at the same weight as the seven
 * seeds in any ordinary hole.
 */
export function LumbungView({
  owner,
  biji,
  active,
  name,
}: {
  owner: Player
  biji: number
  active: boolean
  name: string
}) {
  return (
    <div
      className={[
        'flex h-full min-h-[8.5rem] w-full flex-col items-center justify-center gap-1.5',
        'rounded-[45%] bg-hollow bg-pit px-2 py-6 shadow-bank transition-shadow',
        active ? 'ring-[3px] ring-brass ring-offset-2 ring-offset-teak-grain' : 'ring-0',
      ].join(' ')}
      role="status"
      aria-label={`Lumbung ${name}: ${biji} biji`}
    >
      <span className="tnum font-display text-3xl font-bold leading-none text-seedA sm:text-4xl">
        {biji}
      </span>
      {/* Bentuk biji, bukan hanya warna, yang menandai sisi siapa ini. */}
      <span className="flex max-w-full items-center gap-1.5 px-1">
        <Biji owner={owner} size={8} />
        <span className="truncate font-sans text-[10px] uppercase tracking-widest text-seedA/60">
          {name}
        </span>
      </span>
    </div>
  )
}
