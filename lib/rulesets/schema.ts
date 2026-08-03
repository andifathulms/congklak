import { z } from 'zod'

/**
 * Rule variation lives here, as data, never as a code branch on region.
 * Every option below is something published sources genuinely disagree
 * about (PRD §3). If a variant needs behaviour this schema cannot express,
 * extend the schema — do not special-case it in the engine.
 */

/**
 * Every pack states how well its rules are actually sourced. This is the
 * product, not a caveat: an unverified reading is shown as unverified
 * rather than laundered into "the rules".
 */
export const ConfidenceSchema = z.enum(['terverifikasi', 'perlu-cek'])
export type Confidence = z.infer<typeof ConfidenceSchema>

export const SourceSchema = z
  .object({
    /** Judul terbitan atau halaman. */
    title: z.string().min(3),
    /** Penerbit, lembaga, atau situs. */
    publisher: z.string().min(2),
    year: z.number().int().min(1800).max(2100).optional(),
    /** Books and reports have no URL; that is not a missing citation. */
    url: z.string().url().optional(),
    /** Halaman, bab, atau bagian yang dirujuk. */
    locator: z.string().optional(),
    confidence: ConfidenceSchema,
    note: z.string().optional(),
  })
  .strict()
export type Source = z.infer<typeof SourceSchema>

/**
 * Where this pack knowingly disagrees with another reading. Surfaced in the
 * UI — when sources conflict we record both rather than picking silently.
 */
export const DivergenceSchema = z
  .object({
    /** Aturan yang diperselisihkan, dalam bahasa manusia. */
    rule: z.string().min(3),
    /** Yang dipakai pack ini. */
    thisPack: z.string().min(3),
    /** Bacaan lain yang terdokumentasi. */
    otherReading: z.string().min(3),
    /**
     * Judul sumber dalam pack ini yang berbicara soal perbedaan ini.
     * Sebuah perbedaan yang tidak bisa ditelusuri ke sumber hanyalah
     * pendapat, dan pendapat bukan yang dijual proyek ini.
     */
    sources: z.array(z.string().min(3)).default([]),
    note: z.string().optional(),
  })
  .strict()
export type Divergence = z.infer<typeof DivergenceSchema>

export const OptionsSchema = z
  .object({
    /**
     * Universal across every variant, so it is asserted rather than chosen.
     * Present as an explicit literal so a pack cannot silently disable the
     * rule that defines the game.
     */
    relay: z.literal(true),

    /** Biji terakhir jatuh di lumbung sendiri → jalan lagi. */
    extraTurnOnOwnLumbung: z.boolean(),

    menembak: z
      .object({
        enabled: z.boolean(),
        /**
         * Sources split on landing in an empty own hole whose opposite is
         * also empty: some award the single seed, some award nothing and
         * simply end the turn. PRD §3.
         */
        requireOppositeNonEmpty: z.boolean(),

        /**
         * Malay congkak allows menembak only after a full lap — the sow
         * must have passed the player's own rumah and come back round to
         * their own side. Landing in an empty own hole before that is
         * simply *mati*: the turn ends with no capture.
         *
         * Sumber: JKKN Malaysia — "selepas melepasi rumah sendiri dan
         * kembali ke kawasan sendiri". Lihat pack congkak-melayu.
         */
        requireLapCompleted: z.boolean(),
      })
      .strict(),

    /** PRD §3, "Terminal condition". Both readings are implemented. */
    terminal: z.enum(['tak-ada-langkah', 'tiga-lubang-kosong']),

    /** PRD §3, "Remaining seeds at end". */
    finalSweep: z.enum(['pemilik-sisi', 'pemain-terakhir', 'dibuang']),
  })
  .strict()
export type Options = z.infer<typeof OptionsSchema>

export const RulesetSchema = z
  .object({
    /**
     * Stable and readable. Ids appear in shared game codes and in the P2P
     * handshake — renaming one breaks every existing link.
     */
    id: z
      .string()
      .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/, 'id harus kebab-case huruf kecil'),
    name: z.string().min(2),
    region: z.string().min(2),
    /** Nama lokal lain untuk permainan yang sama. */
    aka: z.array(z.string().min(2)).default([]),
    summary: z.string().min(10),

    /**
     * Orientation only. Sowing in the engine always runs by increasing
     * index; clockwise vs counterclockwise is a rendering question and must
     * not be encoded twice (PRD §6).
     */
    presentation: z
      .object({
        direction: z.enum(['searah-jarum-jam', 'berlawanan-jarum-jam']),
      })
      .strict(),

    options: OptionsSchema,
    sources: z.array(SourceSchema).min(1, 'setiap ruleset wajib bersumber'),
    divergences: z.array(DivergenceSchema).default([]),
  })
  .strict()

export type Ruleset = z.infer<typeof RulesetSchema>

export function parseRuleset(input: unknown): Ruleset {
  return RulesetSchema.parse(input)
}
