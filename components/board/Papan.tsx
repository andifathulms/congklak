'use client'

import { LUMBUNG_A, LUMBUNG_B, PLAYER_A, PLAYER_B, type Player } from '@/lib/engine/board'
import { t, type Locale } from '@/lib/i18n'
import type { Highlight } from '@/components/sow/frames'
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
  /**
   * Dipanggil papan supaya pemanggilnya bisa mengembalikan fokus ke sini
   * sesudah giliran selesai. Lubang yang baru ditekan langsung jadi
   * disabled, dan peramban membuang fokus dari elemen disabled ke <body>.
   */
  papanRef?: React.RefObject<HTMLDivElement>
  cells: readonly number[]
  active: number | null
  secondary: number | null
  /** Lubang yang boleh diklik sekarang. Kosong saat animasi berjalan. */
  playable: readonly number[]
  previewed: number | null
  /**
   * Peristiwa bingkai saat ini, untuk lubang mana pun yang aktif — dipakai
   * hanya untuk memutuskan biji mana yang baru saja mendarat (`settle`).
   * Papan statis (replay, bukti aturan, banding) tidak mengirimkan ini,
   * jadi bertahan pada 'none' dan tidak ada yang pernah mendarat di sana.
   */
  highlight?: Highlight
  /**
   * Lubang tempat rantai *pack lain* berakhir, kalau berbeda dari bacaan
   * aktif pada langkah yang sedang dipertimbangkan (`PratinjauSimpang`,
   * DESIGN.md §4). Papan statis tidak mengirimkan ini.
   */
  simpangHoles?: readonly number[]
  onSelect?: (index: number) => void
  onPreview?: (index: number | null) => void
  namaA: string
  namaB: string
  /**
   * Papan ini ikut berbicara, jadi ia harus tahu bahasanya. Namanya dulu
   * ditulis langsung dalam bahasa Indonesia di kedua locale, jadi pembaca
   * layar berbahasa Inggris mendengar "Lubang 8, 7 biji" — dan lumbungnya
   * keluar setengah-setengah, "Lumbung Player A: 0 biji". Istilah
   * tradisionalnya tetap (invariant 19); perancahnya yang diterjemahkan.
   */
  locale: Locale
}

export function Papan({
  papanRef,
  cells,
  active,
  secondary,
  playable,
  previewed,
  onSelect,
  onPreview,
  namaA,
  namaB,
  locale,
  highlight = 'none',
  simpangHoles = [],
}: PapanProps) {
  const kata = t(locale)
  const canPlay = (index: number) => playable.includes(index)
  const isSimpang = (index: number) => simpangHoles.includes(index)

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
      // Satu biji jatuh ke lubang kecil — settle hanya di situ, sekali per
      // peristiwa 'sow' (invariant 17: hanya membaca event, tidak menghitung).
      justLanded={highlight === 'sow' && active === index}
      simpang={isSimpang(index)}
      onSelect={onSelect}
      onPreview={onPreview}
      /**
       * Sisi siapa lubang ini, disebutkan. Empat belas tombol bernama
       * "Lubang N, X biji" tidak mengatakan bahwa 8–14 milik lawan —
       * pemain yang melihat membacanya dari dua baris dan dua bentuk biji,
       * pemain yang mendengar tidak mendapat apa-apa (WCAG 1.3.1).
       */
      label={[
        kata.lubangLabel.replace('{n}', String(index)),
        `${cells[index]} biji`,
        ownerOfHole(index) === PLAYER_A ? kata.sisimu : kata.sisiLawan,
        canPlay(index) ? kata.bisaDitabur : '',
      ]
        .filter(Boolean)
        .join(', ')}
      kosongLabel={kata.kosongLabel}
    />
  )

  return (
    <div
      ref={papanRef}
      /**
       * Sasaran fokus, bukan perhentian tab: tabindex negatif tidak
       * menambah satu langkah pun ke urutan Tab. Sesudah sebuah giliran,
       * lubang yang ditekan menjadi disabled dan fokus jatuh ke <body> —
       * pemain papan tik terlempar ke puncak halaman tiap giliran. Fokus
       * dikembalikan ke sini, dan satu Tab membawanya ke lubang pertama
       * yang bisa ditabur.
       */
      tabIndex={-1}
      // `on-teak` switches the global focus ring to seedA: an ink ring is
      // invisible against the wood.
      // w-full is load-bearing next to mx-auto: as a flex item, an auto
      // cross-axis margin cancels the stretch, and the board collapses to
      // its content width.
      //
      // Below `sm:`, width is sized from the viewport's *height*, not a
      // fixed rem cap (DESIGN.md §6). Below `sm:` the board is a fixed
      // linear function of its own width: two `min-h-[4.25rem]` (68px)
      // lumbung, `p-3` (12px) padding on every side, `gap-2` (8px) between
      // the two lumbung and the seven-hole column, and seven aspect-square
      // holes stacked with `gap-2` between them —
      //   height(w) = 112 + 3.5w
      // Measured on the production build, 2026-08-17, at 360×640 (`Skor`
      // mounted, DESIGN.md §5 `main`): the sticky header is 131.5px, `Skor`
      // is 101.03125px, and the gap between them and the board is 16px —
      // 248.53125px of chrome sits above the board before it can start,
      // rounded up to 249px, plus 16px so the board doesn't touch the very
      // bottom of the viewport. Solving height(w) = 100dvh − 265px for w:
      //   w = (100dvh − 265 − 112) / 3.5 = (100dvh − 377) / 3.5
      // `max()` keeps a 140px floor — comfortably above the 24px WCAG
      // 2.5.8 target even at that width — so a very short viewport
      // shrinks the board rather than pushing it off both bounds at once.
      // `Skor`'s own height is `main`'s budget precisely because the board
      // is exactly this size at every phase, never larger and never
      // smaller (§5): sizing from `siap`, which has no `Skor` above the
      // board, would make the board grow the moment the first move is
      // played.
      className="on-teak mx-auto w-full max-w-[max(140px,calc((100dvh_-_377px)/3.5))] rounded-board bg-teak bg-grain p-3 shadow-carve ring-1 ring-teak-rim/40 sm:max-w-none sm:p-6"
      role="group"
      aria-label={kata.papanLabel}
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
            // Biji terakhir jatuh ke lumbung sendiri — settle di situ.
            justLanded={highlight === 'bank' && active === LUMBUNG_A}
            simpang={isSimpang(LUMBUNG_A)}
            name={namaA}
            label={kata.lumbungLabel.replace('{nama}', namaA)}
          />
        </div>

        {/* Tiap baris bernama, jadi strukturnya dua-baris papan ini bisa
            didengar dan bukan hanya dilihat. */}
        <div
          role="group"
          aria-label={kata.barisLabel.replace('{nama}', namaB)}
          className="col-start-2 row-start-2 grid grid-cols-1 gap-2 sm:col-start-2 sm:row-start-1 sm:grid-cols-7 sm:gap-3"
        >
          {BARIS_ATAS.map(hole)}
        </div>
        <div
          role="group"
          aria-label={kata.barisLabel.replace('{nama}', namaA)}
          className="col-start-1 row-start-2 grid grid-cols-1 gap-2 sm:col-start-2 sm:row-start-2 sm:grid-cols-7 sm:gap-3"
        >
          {BARIS_BAWAH.map(hole)}
        </div>

        <div className="col-span-2 sm:col-span-1 sm:col-start-3 sm:row-span-2 sm:row-start-1">
          <LumbungView
            owner={PLAYER_B}
            biji={cells[LUMBUNG_B]}
            active={active === LUMBUNG_B}
            justLanded={highlight === 'bank' && active === LUMBUNG_B}
            simpang={isSimpang(LUMBUNG_B)}
            name={namaB}
            label={kata.lumbungLabel.replace('{nama}', namaB)}
          />
        </div>
      </div>
    </div>
  )
}
