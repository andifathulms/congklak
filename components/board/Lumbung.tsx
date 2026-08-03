'use client'

import { PLAYER_A, type Player } from '@/lib/engine/board'
import { Biji } from './Biji'

/**
 * The lumbung — the granary at each end where biji are banked. Larger and
 * deeper than a lubang, because that is what it is on a carved board.
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
        'flex h-full min-h-[7rem] w-full flex-col items-center justify-center gap-2 rounded-[45%]',
        'bg-hollow px-2 py-6 shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)] transition-shadow',
        active ? 'ring-4 ring-brass' : 'ring-0',
      ].join(' ')}
      role="status"
      aria-label={`Lumbung ${name}: ${biji} biji`}
    >
      <Biji owner={owner} size={12} />
      <span className="tnum font-display text-3xl font-bold text-seedA">{biji}</span>
      <span className="font-sans text-[10px] uppercase tracking-widest text-seedA/60">
        {owner === PLAYER_A ? 'A' : 'B'}
      </span>
    </div>
  )
}
