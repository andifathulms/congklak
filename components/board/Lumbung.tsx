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
        // Berdiri di ponsel, memanjang di layar lebar — bentuknya mengikuti
        // arah papannya, dan tetap satu cekungan yang lebih dalam dari lubang.
        'flex h-full w-full items-center justify-center gap-2.5 rounded-[45%]',
        'min-h-[4.25rem] flex-row px-4 py-3',
        'sm:min-h-[8.5rem] sm:flex-col sm:gap-1.5 sm:px-2 sm:py-6',
        'bg-hollow bg-pit shadow-bank transition-shadow',
        active ? 'ring-[3px] ring-brass ring-offset-2 ring-offset-teak-grain' : 'ring-0',
      ].join(' ')}
      role="status"
      aria-label={`Lumbung ${name}: ${biji} biji`}
    >
      <span className="tnum font-display text-3xl font-bold leading-none text-fg-wood sm:text-4xl">
        {biji}
      </span>
      {/* Bentuk biji, bukan hanya warna, yang menandai sisi siapa ini. */}
      <span className="flex max-w-full items-center gap-1.5 px-1">
        <Biji owner={owner} size={8} />
        {/* Papan yang berdiri punya lumbung selebar layar, jadi namanya muat.
            Papan yang memanjang tidak: kolomnya sempit dan namanya terpotong
            jadi "PEMAI…", yang tidak memberi tahu siapa pun apa pun. Di sana
            bentuk biji yang menandai sisi, papan skor tepat di atas menyebut
            namanya, dan aria-label tetap lengkap di keduanya. */}
        <span className="truncate font-sans text-2xs uppercase tracking-widest text-fg-wood-muted sm:hidden">
          {name}
        </span>
      </span>
    </div>
  )
}
