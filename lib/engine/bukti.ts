/**
 * Proof that a recorded divergence actually changes a game.
 *
 * The sources page can state that two readings of a rule disagree, and cite
 * both. It could not, until now, show that the disagreement ever reaches a
 * board — which left the project's central claim resting on prose.
 *
 * The method matters. Comparing two whole packs conflates every difference
 * between them, so nothing can point at the clause responsible. Here the
 * pack is run against *itself with one clause flipped* to the value the
 * other reading uses, everything else held constant. Any divergence that
 * turns up is therefore caused by that clause and nothing else.
 *
 * Pure, seeded, deterministic: the same pack yields the same proof on every
 * build and on every machine.
 */
import { compareRulesets, contohLangkah, type AlasanSimpang } from './compare'
import { createRng } from '../rng'
import type { Divergence, Ruleset } from '../rulesets/schema'

export interface Bukti {
  /** Benih permainan contoh — permainan yang sama bisa diputar ulang. */
  readonly seed: number
  /** Giliran ke berapa kedua bacaan pertama berpisah, mulai dari 1. */
  readonly giliran: number
  /** Bentuk perpisahannya: papan berbeda, satu sudah selesai, langkah tak sah. */
  readonly alasan: AlasanSimpang
  /** Panjang daftar langkah permainan contohnya. */
  readonly panjang: number
  /**
   * Kedua papan pada giliran tempat mereka berpisah.
   *
   * Tanpa ini halaman Aturan menyatakan sebuah papan tanpa pernah
   * menunjukkannya — meminta pembaca percaya, di halaman yang seluruh
   * pekerjaannya justru tidak meminta itu. null di sisi mana pun berarti
   * langkahnya sudah tidak sah di bacaan itu, dan itu sendiri perbedaannya.
   */
  readonly papanIni: readonly number[] | null
  readonly papanLain: readonly number[] | null
}

type Banding = NonNullable<Divergence['banding']>

/**
 * The pack with exactly one clause set to the other reading's value.
 *
 * An explicit switch rather than a dynamic path write: the option paths are
 * a closed set in the schema, and a typo should fail to compile rather than
 * silently produce a pack identical to the original — which would look like
 * "this rule changes nothing" and be a lie.
 */
export function denganBacaanLain(ruleset: Ruleset, banding: Banding): Ruleset {
  const o = ruleset.options
  const bool = banding.nilaiLain === 'true'

  switch (banding.opsi) {
    case 'terminal':
      return { ...ruleset, options: { ...o, terminal: banding.nilaiLain as typeof o.terminal } }
    case 'finalSweep':
      return { ...ruleset, options: { ...o, finalSweep: banding.nilaiLain as typeof o.finalSweep } }
    case 'extraTurnOnOwnLumbung':
      return { ...ruleset, options: { ...o, extraTurnOnOwnLumbung: bool } }
    case 'menembak.requireOppositeNonEmpty':
      return {
        ...ruleset,
        options: { ...o, menembak: { ...o.menembak, requireOppositeNonEmpty: bool } },
      }
    case 'menembak.requireLapCompleted':
      return {
        ...ruleset,
        options: { ...o, menembak: { ...o.menembak, requireLapCompleted: bool } },
      }
    default: {
      const habis: never = banding.opsi
      throw new Error(`opsi banding tidak dikenal: ${String(habis)}`)
    }
  }
}

/**
 * How many seeded sample games to try before reporting that no proof was
 * found. A rule can be real, cited, and still almost never decide a game;
 * saying so is a finding, not a failure, and is why this returns null rather
 * than searching until it gets the answer it wants.
 */
export const BENIH_MAKS = 60

/**
 * Deliberately reports no score and no winner.
 *
 * `compareRulesets` stops at the first divergence, so the states it hands
 * back are the boards *at that moment*, not the end of two finished games —
 * and once the two readings have parted, the same move list is no longer
 * the same game under both. A final score taken from here would be a number
 * that traces to nothing. What is provable is where they part and how, and
 * that is all this returns.
 */
export function cariBukti(
  ruleset: Ruleset,
  banding: Banding,
  benihMaks: number = BENIH_MAKS,
): Bukti | null {
  const lain = denganBacaanLain(ruleset, banding)

  for (let seed = 1; seed <= benihMaks; seed++) {
    // Daftar langkahnya dibuat di bawah bacaan pack ini, lalu diputar di
    // keduanya — persis seperti seseorang yang memainkan permainannya dengan
    // satu bacaan lalu bertanya apa jadinya di bacaan satunya.
    const rng = createRng(seed)
    const moves = contohLangkah(ruleset, (n) => rng.next(n))
    const hasil = compareRulesets(moves, ruleset, lain)
    if (hasil.simpangDi < 0 || hasil.alasan === null) continue

    // Langkah tempat keduanya berpisah — papan sesudah giliran itu
    // dimainkan, di kedua bacaan.
    const langkah = hasil.steps[hasil.simpangDi]

    return {
      seed,
      giliran: hasil.simpangDi + 1,
      alasan: hasil.alasan,
      panjang: moves.length,
      papanIni: langkah?.kiri ? Array.from(langkah.kiri.board) : null,
      papanLain: langkah?.kanan ? Array.from(langkah.kanan.board) : null,
    }
  }

  return null
}
