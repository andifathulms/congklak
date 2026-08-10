import umum from '@/data/rulesets/umum.json'
import jawaSleman from '@/data/rulesets/jawa-sleman.json'
import congkakMelayu from '@/data/rulesets/congkak-melayu.json'
import type { Ruleset } from './schema'

/**
 * Packs are listed in a fixed order. An array, never a map — engine-adjacent
 * code must never depend on the iteration order of an unordered collection.
 *
 * They are *not* validated here, and that is deliberate.
 *
 * This module load used to run the full zod schema over all three packs, in
 * the browser, on six of the seven routes — 13 kB gzipped of validator plus
 * the schema itself, to re-derive a fact the build had already established.
 * `pnpm build` runs `rulesets:validate` first and fails on a pack that does
 * not parse, so nothing malformed can reach a browser to be caught.
 *
 * The cast is sound because the validator proves the stronger property it
 * needs: parsing must not *change* a pack. If a schema default ever filled
 * in a missing field, the client would receive an object its own type
 * claims is complete and is not — so the build refuses, and the field has
 * to be written out in the JSON instead.
 */
const RAW_PACKS = [umum, jawaSleman, congkakMelayu]

export const RULESETS = RAW_PACKS as readonly Ruleset[]

export const DEFAULT_RULESET_ID = 'umum'

export function getRuleset(id: string): Ruleset {
  const found = RULESETS.find((r) => r.id === id)
  if (!found) throw new Error(`ruleset tidak dikenal: ${id}`)
  return found
}

export function defaultRuleset(): Ruleset {
  return getRuleset(DEFAULT_RULESET_ID)
}

/**
 * Types only. Re-exporting the module wholesale would pull the zod schema
 * values back into every bundle that wanted a type from here — which is how
 * the validator ended up on the client in the first place.
 */
export type {
  Confidence,
  Divergence,
  Options,
  Ruleset,
  Source,
  StatusPerbedaan,
} from './schema'
