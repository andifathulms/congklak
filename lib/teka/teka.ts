/**
 * Puzzle mode. Five positions, each with exactly one move that works.
 *
 * Learn mode teaches the rules; this is for after that, when the rules are
 * known and the skill left to learn is reading a relay chain before playing
 * it. Congklak's depth is entirely in that — a well-chosen opening can
 * circle the board for dozens of holes — and nothing in the app asked
 * anyone to look ahead.
 *
 * Every puzzle carries the answer it claims and the tests replay each one
 * through the engine: the stated move must hit the target, and no other
 * legal move may hit it. A puzzle with two answers is a coin flip, and one
 * with none is a lie. Both fail the build.
 *
 * Positions are stated under a named ruleset, because they have to be.
 * "Bank thirteen in one turn" is not a well-formed question until you say
 * whose reading of menembak is in force — which is the same reason this app
 * exists at all.
 */
import type { Cells } from '../learn/types'
import type { Sasaran } from './sasaran'

/** Semua teka-teki dimainkan di bawah aturan ini. */
export const TEKA_RULESET = 'umum'

interface Teks {
  readonly id: string
  readonly en: string
}

export interface TekaTeki {
  readonly id: string
  readonly judul: Teks
  /** Apa yang diminta, dalam satu kalimat. */
  readonly ajakan: Teks
  readonly cells: Cells
  readonly sasaran: Sasaran
  /** Satu-satunya lubang yang mencapainya. */
  readonly jawaban: number
  /** Kenapa lubang itu, sesudah pemain menemukannya. */
  readonly kenapa: Teks
  /** Dorongan kalau tersangkut, tanpa menyebutkan lubangnya. */
  readonly petunjuk: Teks
}

export const TEKA: readonly TekaTeki[] = [
  {
    id: 'giliran-lagi',
    judul: { id: 'Jalan lagi', en: 'Go again' },
    ajakan: {
      id: 'Biji terakhir yang jatuh tepat di lumbung sendiri memberi giliran lagi. Satu lubang di sini bisa melakukannya.',
      en: 'A last biji landing exactly in your own lumbung earns another turn. One hole here can do it.',
    },
    // A[4]=3 → 5, 6, lumbung. Yang lain lewat atau kurang.
    cells: [
      [1, 2],
      [4, 3],
      [5, 4],
      [9, 3],
      [12, 2],
    ],
    sasaran: { jenis: 'giliran-lagi' },
    jawaban: 4,
    kenapa: {
      id: 'Tiga biji dari lubang 4 jatuh di 5, 6, lalu lumbung — pas. Hitung jaraknya ke lumbung, dan cari lubang yang isinya sama dengan jarak itu.',
      en: 'Three biji from hole 4 land on 5, 6, then the lumbung — exactly. Count the distance to the lumbung and find the hole holding exactly that many.',
    },
    petunjuk: {
      id: 'Hitung berapa langkah tiap lubang ke lumbung, lalu bandingkan dengan isinya.',
      en: 'Count how many steps each hole is from the lumbung, then compare that with what it holds.',
    },
  },
  {
    id: 'menembak',
    judul: { id: 'Menembak besar', en: 'A big capture' },
    ajakan: {
      id: 'Biji terakhir yang jatuh di lubang kosong sisi sendiri menembak isi lubang seberangnya. Bawa pulang sepuluh biji sekaligus.',
      en: 'A last biji landing in an empty hole on your own side captures whatever sits opposite. Bring home ten at once.',
    },
    cells: [
      [2, 2],
      [3, 9],
      [5, 4],
      [6, 6],
      [10, 9],
      [11, 3],
    ],
    sasaran: { jenis: 'menembak', minimal: 10 },
    jawaban: 2,
    kenapa: {
      id: 'Dua biji dari lubang 2 berhenti di lubang 4 yang kosong; seberangnya lubang 10 berisi sembilan, jadi sepuluh biji sekaligus masuk lumbung.',
      en: 'Two biji from hole 2 stop in empty hole 4; opposite it hole 10 holds nine, so ten seeds go into the lumbung at once.',
    },
    petunjuk: {
      id: 'Cari lubang seberang yang paling gemuk dulu, baru cari cara berhenti tepat di hadapannya.',
      en: 'Find the fattest hole on the far side first, then work out how to stop exactly opposite it.',
    },
  },
  {
    id: 'sambung',
    judul: { id: 'Rantai panjang', en: 'The long chain' },
    ajakan: {
      id: 'Biji terakhir yang jatuh di lubang berisi mengangkat lubang itu dan menabur lagi. Cari langkah yang menyambung delapan kali.',
      en: 'A last biji landing in a hole that already had seeds scoops it up and sows on. Find the move that relays eight times.',
    },
    cells: [
      [0, 3],
      [3, 5],
      [4, 4],
      [6, 5],
      [8, 9],
      [9, 2],
    ],
    sasaran: { jenis: 'sambung', minimal: 8 },
    jawaban: 4,
    kenapa: {
      id: 'Empat biji dari lubang 4 mendarat di lubang berisi, dan tiap pendaratan berikutnya juga — rantainya menyambung delapan kali sebelum habis.',
      en: 'Four biji from hole 4 land in a filled hole, and so does every landing after it — the chain relays eight times before it runs out.',
    },
    petunjuk: {
      id: 'Rantai berhenti begitu mendarat di lubang kosong. Cari langkah yang setiap pendaratannya jatuh di lubang berisi.',
      en: 'A chain stops the moment it lands somewhere empty. Look for the move whose every landing falls on a filled hole.',
    },
  },
  {
    id: 'tabung',
    judul: { id: 'Tiga belas', en: 'Thirteen' },
    ajakan: {
      id: 'Tabung tiga belas biji dalam satu giliran. Tiga lubang lain hanya memberimu satu.',
      en: 'Bank thirteen seeds in a single turn. The other three holes give you one apiece.',
    },
    cells: [
      [0, 8],
      [2, 2],
      [4, 4],
      [6, 9],
      [8, 1],
      [14, 8],
    ],
    sasaran: { jenis: 'tabung', minimal: 13 },
    jawaban: 6,
    kenapa: {
      id: 'Sembilan biji dari lubang 6 mengelilingi papan, menyambung, dan lewat lumbung lebih dari sekali — semuanya dari satu langkah.',
      en: 'Nine biji from hole 6 travel the board, relay, and pass the lumbung more than once — all from one move.',
    },
    petunjuk: {
      id: 'Lubang yang paling penuh belum tentu yang paling menguntungkan, tapi di sini jarak ke lumbung yang menentukan.',
      en: 'The fullest hole is not always the best one, but here it is the distance to the lumbung that decides.',
    },
  },
  {
    id: 'tabung-sulit',
    judul: { id: 'Dua belas, tersembunyi', en: 'Twelve, hidden' },
    ajakan: {
      id: 'Tabung dua belas biji dalam satu giliran. Lubang yang paling menggoda bukan jawabannya.',
      en: 'Bank twelve seeds in a single turn. The most tempting hole is not the answer.',
    },
    cells: [
      [1, 7],
      [3, 1],
      [4, 9],
      [5, 1],
      [10, 9],
      [14, 4],
    ],
    sasaran: { jenis: 'tabung', minimal: 12 },
    jawaban: 3,
    kenapa: {
      id: 'Satu biji dari lubang 3 mendarat di lubang 4 yang berisi sembilan, mengangkatnya, dan dari situ rantainya berjalan. Lubang paling penuh justru membuang isinya ke sisi lawan.',
      en: 'A single biji from hole 3 lands in hole 4 with its nine, scoops them, and the chain runs from there. The fullest hole simply spills its seeds onto the far side.',
    },
    petunjuk: {
      id: 'Satu biji bisa jadi langkah terkuat kalau ia mendarat di tempat yang tepat.',
      en: 'A single seed can be the strongest move if it lands in the right place.',
    },
  },
]
