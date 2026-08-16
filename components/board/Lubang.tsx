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
  /** Biji ini baru saja jatuh ke lubang ini pada bingkai saat ini. */
  justLanded?: boolean
  onSelect?: (index: number) => void
  onPreview?: (index: number | null) => void
  label: string
  /** Kata "kosong" dalam bahasa yang berlaku. */
  kosongLabel: string
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
/*
 * `aria-pressed` used to ride on `active`, which means "the sow is passing
 * through here right now" — not a pressed state. Twenty-four holes then
 * announced as "toggle button, not pressed", and a hole is not a toggle.
 * The highlight is decoration; what matters is in the name.
 */
export function Lubang({
  index,
  biji,
  owner,
  active,
  secondary,
  playable,
  previewed,
  justLanded,
  onSelect,
  onPreview,
  label,
  kosongLabel,
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
          ? 'ring-2 ring-teak-rim'
          : 'ring-0'

  return (
    <div className="relative flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={!playable}
        aria-label={label}
        onClick={playable ? () => onSelect?.(index) : undefined}
        onMouseEnter={playable ? () => onPreview?.(index) : undefined}
        onMouseLeave={playable ? () => onPreview?.(null) : undefined}
        onFocus={playable ? () => onPreview?.(index) : undefined}
        onBlur={playable ? () => onPreview?.(null) : undefined}
        className={[
          'relative flex aspect-square w-full items-center justify-center rounded-full',
          'bg-pit shadow-recess transition duration-150',
          cincin,
          // Lubang yang bisa ditabur duduk sedikit lebih terang dari kayu
          // yang tidak bisa disentuh. Di mode belajar sering hanya dua dari
          // empat belas lubang yang sah, dan tanpa beda ini tidak ada apa
          // pun di layar yang mengatakan yang mana.
          playable
            ? 'cursor-pointer bg-hollow hover:-translate-y-px hover:brightness-110 active:translate-y-0'
            : 'cursor-default bg-hollow-deep',
        ].join(' ')}
      >
        {/* `settle`: yang paling menandai biji jatuh dalam permainan ini —
            dan sebelum ini definisinya duduk di tailwind.config.ts tanpa
            sekalipun dipakai (kelas cacat yang sama dengan tiga jenis huruf
            yang disebut tapi tak pernah dimuat). key membuat React memasang
            ulang bungkusnya tiap kali biji ini yang baru saja jatuh, supaya
            animasinya mulai dari awal, bukan hanya sekali di pemasangan
            pertama. */}
        <span
          key={justLanded ? 'mendarat' : 'diam'}
          className={justLanded ? 'inline-flex animate-settle' : 'inline-flex'}
        >
          <TumpukanBiji biji={biji} owner={owner} />
        </span>
        {biji === 0 && <span className="sr-only">{kosongLabel}</span>}
      </button>

      {/* Ukiran angka pada kayu.

          Angka ini duduk di atas teak, permukaan kayu paling terang, dan di
          sana hanya --fg-wood yang lolos 4.5:1 — 5.36 berbanding 3.67 untuk
          nada yang lebih redup dan 1.93 untuk brass. Jadi semua angka
          memakai satu warna, dan yang membedakannya adalah bobot huruf.
          Brass tetap menandai lubang aktif, tapi lewat cincinnya, bukan
          lewat angka yang harus terbaca.

          Di papan yang berdiri, angka duduk di bibir bawah lubang, bukan di
          bawahnya: tujuh baris masing-masing menuntut satu baris tambahan
          akan menambah tinggi papan seperempat layar. */}
      <span
        aria-hidden
        className={[
          'tnum absolute bottom-0.5 font-display text-2xs leading-none text-fg-wood transition-[font-weight]',
          'sm:static sm:bottom-auto',
          active ? 'font-bold' : playable ? 'font-medium' : 'font-normal',
        ].join(' ')}
      >
        {biji}
      </span>
    </div>
  )
}
