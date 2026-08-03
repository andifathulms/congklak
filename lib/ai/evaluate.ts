/**
 * Evaluation. Integers only, including the weights — no floats anywhere
 * in the engine or the search, so two devices score a position alike.
 *
 * Terms are the ones PRD §8.4 names: lumbung difference, seeds held on
 * one's own side, extra-turn opportunities, and how exposed one's own
 * holes are to the opponent's menembak.
 */
import {
  emptyHolesOnSide,
  firstHoleOf,
  lastHoleOf,
  lumbungOf,
  opponentOf,
  opposite,
  seedsOnSide,
  type Board,
  type Player,
} from '../engine/board'
import type { Ruleset } from '../rulesets/schema'

/** Banked biji are the game; everything else is a tiebreak. */
const BOBOT_LUMBUNG = 100
const BOBOT_SISI = 3
const BOBOT_GILIRAN_LAGI = 18
/**
 * Satu bobot untuk kedua arah, bukan dua.
 *
 * Sempat dipakai bobot berbeda untuk "yang bisa kita tembak" dan "yang
 * bisa ditembak dari kita", untuk membuat AI lebih penakut daripada
 * rakus. Itu membuat evaluate() tidak lagi antisimetris, padahal fungsi
 * ini dipanggil dari kedua sisi pencarian: posisi yang sama bisa bernilai
 * +594 bagi A dan +613 bagi B sekaligus, dan alpha-beta memangkas
 * berdasarkan perbandingan yang tak lagi berarti. Kecondongan seperti itu
 * harus lewat suku yang memang antisimetris, bukan lewat bobot timpang.
 */
const BOBOT_ANCAMAN = 6

/**
 * Steps from `hole` to that player's lumbung. A hole holding exactly this
 * many biji banks its last seed and earns another turn.
 */
function langkahKeLumbung(hole: number, player: Player): number {
  return lumbungOf(player) - hole
}

function peluangGiliranLagi(board: Board, player: Player): number {
  // Satu rumus untuk kedua sisi: lumbung A di 7 untuk lubang 0–6, lumbung
  // B di 15 untuk lubang 8–14, jaraknya sama-sama lumbung − lubang.
  let count = 0
  for (let i = firstHoleOf(player); i <= lastHoleOf(player); i++) {
    if (board[i] === langkahKeLumbung(i, player)) count++
  }
  return count
}

/**
 * Biji sitting opposite one of the player's own empty holes: what the
 * player could shoot if a last seed lands there.
 */
function ancaman(board: Board, player: Player): number {
  let total = 0
  for (let i = firstHoleOf(player); i <= lastHoleOf(player); i++) {
    if (board[i] === 0) total += board[opposite(i)]
  }
  return total
}

/**
 * Positive score favours `player`. Called from both sides of the search,
 * so it must be symmetric.
 */
export function evaluate(board: Board, player: Player, ruleset: Ruleset): number {
  const lawan = opponentOf(player)

  const lumbung = board[lumbungOf(player)] - board[lumbungOf(lawan)]
  const sisi = seedsOnSide(board, player) - seedsOnSide(board, lawan)

  let score = BOBOT_LUMBUNG * lumbung + BOBOT_SISI * sisi

  if (ruleset.options.extraTurnOnOwnLumbung) {
    score +=
      BOBOT_GILIRAN_LAGI *
      (peluangGiliranLagi(board, player) - peluangGiliranLagi(board, lawan))
  }

  if (ruleset.options.menembak.enabled) {
    // Apa yang bisa kita tembak, dikurangi apa yang bisa ditembak dari kita.
    score += BOBOT_ANCAMAN * (ancaman(board, player) - ancaman(board, lawan))
  }

  if (ruleset.options.terminal === 'tiga-lubang-kosong') {
    // Di bawah aturan ini lubang kosong mempercepat akhir permainan, dan
    // akhir yang cepat menguntungkan yang sedang unggul.
    //
    // Bentuknya harus dijaga: "kedekatan ke akhir" simetris — sama saja
    // dilihat dari sisi mana pun — dan dikalikan selisih lumbung yang
    // antisimetris, hasilnya tetap antisimetris. Menuliskannya sebagai
    // "lubang kosongku dikurangi lubang kosongnya, dibalik tandanya kalau
    // aku tertinggal" terlihat sama maksudnya, tapi tidak antisimetris.
    const dekatAkhir = Math.max(emptyHolesOnSide(board, player), emptyHolesOnSide(board, lawan))
    score += 4 * lumbung * dekatAkhir
  }

  return score
}

/** Skor akhir permainan, jauh di luar jangkauan evaluasi biasa. */
export const SKOR_MENANG = 1_000_000

export function terminalScore(board: Board, player: Player): number {
  const selisih = board[lumbungOf(player)] - board[lumbungOf(opponentOf(player))]
  if (selisih > 0) return SKOR_MENANG + selisih
  if (selisih < 0) return -SKOR_MENANG + selisih
  return 0 // seri
}
