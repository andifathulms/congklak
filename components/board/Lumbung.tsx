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
  justLanded,
  simpang,
  name,
  label,
}: {
  owner: Player
  biji: number
  active: boolean
  /** Biji baru saja jatuh ke lumbung ini pada bingkai saat ini. */
  justLanded?: boolean
  /** Lumbung ini tempat rantai pack lain berakhir (`PratinjauSimpang`). */
  simpang?: boolean
  name: string
  /** Nama yang dibacakan, sudah dalam bahasa yang benar. */
  label: string
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
        simpang ? 'border-2 border-dashed border-ink' : '',
      ].join(' ')}
      /**
       * Sebuah angka, bukan wilayah status. Dengan role="status" isinya
       * diumumkan tiap kali berubah — dan ia berubah tiap bingkai animasi,
       * jadi satu giliran membacakan hitungannya berkali-kali. Papan skor
       * di atas papan sudah menyebutkan kedua angka, dan ringkasan giliran
       * mengatakan apa yang terjadi. Ini cukup dibaca saat disinggahi.
       */
      aria-label={`${label}: ${biji} biji`}
    >
      <span
        key={justLanded ? 'mendarat' : 'diam'}
        className={[
          'tnum inline-block font-display text-2xl font-bold leading-none text-fg-wood',
          justLanded ? 'animate-settle' : '',
        ].join(' ')}
      >
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
