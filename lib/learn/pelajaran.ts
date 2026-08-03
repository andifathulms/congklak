/**
 * Learn mode (PRD §8.6). Three real board positions, not three paragraphs.
 *
 * Congklak's rules are simple to state and hard to feel. Each position is
 * built so that one hole demonstrates the idea and another, plausible hole
 * does not — the contrast is the teaching, not the prose.
 *
 * Every lesson carries the outcome it claims, and the tests replay each
 * one through the engine to check the claim actually holds. A lesson that
 * promised a capture and did not produce one would teach the wrong rule,
 * which is worse than teaching nothing.
 */
import type { Cells } from './types'

export interface Klaim {
  readonly relay?: boolean
  readonly menembak?: boolean
  readonly extraTurn?: boolean
  /** Biji yang masuk lumbung pemain dalam giliran ini. */
  readonly keLumbung?: number
  /** Giliran pemain sesudah langkah ini. */
  readonly toMoveAfter?: 0 | 1
}

export interface Pelajaran {
  readonly id: string
  readonly judul: { readonly id: string; readonly en: string }
  readonly ajakan: { readonly id: string; readonly en: string }
  readonly cells: Cells
  /** Lubang yang menunjukkan pelajarannya. */
  readonly jawaban: number
  /** Lubang lain yang masuk akal tapi tidak menunjukkan apa-apa. */
  readonly pembanding: number
  readonly kenapa: { readonly id: string; readonly en: string }
  readonly meleset: { readonly id: string; readonly en: string }
  readonly klaim: Klaim
  readonly klaimPembanding: Klaim
}

export const PELAJARAN: readonly Pelajaran[] = [
  {
    id: 'sambung',
    judul: {
      id: 'Sambung',
      en: 'The relay',
    },
    ajakan: {
      id: 'Biji terakhir yang jatuh di lubang yang sudah ada isinya tidak berhenti di situ — lubang itu diangkat dan ditabur lagi. Cari langkah yang menyambung.',
      en: 'A last biji landing in a hole that already had seeds does not stop there — that hole is scooped up and sown onward. Find the move that relays.',
    },
    // A[5]=1 mendarat di A[6] yang berisi 3 → diangkat, disebar terus
    // melewati lumbung ke sisi lawan. A[6] langsung hanya menabur biasa.
    cells: [
      [5, 1],
      [6, 3],
      [12, 2],
    ],
    jawaban: 5,
    pembanding: 6,
    kenapa: {
      id: 'Satu biji mendarat di lubang 6 yang sudah berisi tiga. Keempatnya diangkat dan ditabur lagi — satu langkah kecil berjalan jauh. Membaca rantai inilah seluruh keahlian congklak.',
      en: 'One biji lands in hole 6, which already held three. All four are scooped and sown onward — a small move travels a long way. Reading that chain ahead is the whole skill of congklak.',
    },
    meleset: {
      id: 'Itu langkah yang sah, tapi biji terakhirnya mendarat di lubang kosong, jadi berhenti di situ. Coba lubang yang mendarat di lubang yang sudah ada isinya.',
      en: 'A legal move, but its last biji lands in an empty hole and stops. Try the one that lands in a hole with seeds already in it.',
    },
    klaim: { relay: true, keLumbung: 1, toMoveAfter: 1 },
    klaimPembanding: { relay: false },
  },
  {
    id: 'jalan-lagi',
    judul: {
      id: 'Jalan lagi',
      en: 'The extra turn',
    },
    ajakan: {
      id: 'Kalau biji terakhir jatuh tepat di lumbung sendiri, giliranmu belum habis. Cari lubang yang berhenti persis di sana.',
      en: 'If your last biji falls exactly into your own lumbung, your turn is not over. Find the hole that stops precisely there.',
    },
    // A[4]=3 → 5, 6, lalu tepat di lumbung 7. A[0]=2 menembak kecil dan
    // menyerahkan giliran.
    cells: [
      [0, 2],
      [4, 3],
      [9, 2],
    ],
    jawaban: 4,
    pembanding: 0,
    kenapa: {
      id: 'Lubang 4 berisi tepat tiga biji, dan lumbungmu tiga langkah jauhnya. Biji terakhir jatuh di lumbung, jadi kamu jalan lagi — dan kali ini bebas memilih lubang mana pun.',
      en: 'Hole 4 holds exactly three biji, and your lumbung is three steps away. The last one lands in the lumbung, so you go again — and this time you may pick any hole.',
    },
    meleset: {
      id: 'Langkah itu menembak satu biji, tapi giliranmu langsung habis. Ada lubang lain yang berhenti tepat di lumbung dan memberimu giliran kedua.',
      en: 'That move shoots a single biji, but ends your turn at once. Another hole stops exactly in the lumbung and buys you a second turn.',
    },
    klaim: { extraTurn: true, keLumbung: 1, toMoveAfter: 0 },
    klaimPembanding: { extraTurn: false, toMoveAfter: 1 },
  },
  {
    id: 'menembak',
    judul: {
      id: 'Menembak',
      en: 'Menembak — shooting',
    },
    ajakan: {
      id: 'Biji terakhir yang jatuh di lubang kosong di sisimu sendiri menembak: biji itu beserta seluruh isi lubang seberang masuk ke lumbungmu. Dua langkah di sini sama-sama menembak — pilih yang seberangnya paling gemuk.',
      en: 'A last biji landing in an empty hole on your own side shoots: that biji plus everything in the hole opposite goes to your lumbung. Two moves here both shoot — take the one whose opposite is fattest.',
    },
    // A[5]=1 mendarat di A[6] yang kosong; seberangnya lubang 8 berisi 12.
    // A[0]=2 juga menembak, tapi seberangnya kosong — hanya 1 biji.
    cells: [
      [0, 2],
      [5, 1],
      [8, 12],
      [11, 1],
    ],
    jawaban: 5,
    pembanding: 0,
    kenapa: {
      id: 'Biji terakhir mendarat di lubang 6 yang kosong. Seberangnya, lubang 8, sedang menumpuk dua belas biji — semuanya ikut masuk ke lumbungmu bersama biji pendaratan. Tiga belas biji dari satu biji.',
      en: 'The last biji lands in empty hole 6. Opposite it, hole 8 has twelve piled up — all of them go to your lumbung along with the landing biji. Thirteen from one.',
    },
    meleset: {
      id: 'Itu memang menembak, tapi lubang seberangnya kosong, jadi hasilnya hanya satu biji. Lubang yang satunya menghadap tumpukan yang jauh lebih besar.',
      en: 'That does shoot, but the hole opposite is empty, so it yields a single biji. The other one faces a far bigger pile.',
    },
    klaim: { menembak: true, keLumbung: 13, toMoveAfter: 1 },
    klaimPembanding: { menembak: true, keLumbung: 1 },
  },
]

/** Pelajaran memakai pack default; syarat pusingan akan mengubah nomor 3. */
export const PELAJARAN_RULESET = 'umum'
