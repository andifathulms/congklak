import umum from '@/data/rulesets/umum.json'
import { parseRuleset, type Ruleset } from './schema'

/**
 * Packs are listed in a fixed order and validated once at module load.
 * An array, never a map — engine-adjacent code must never depend on the
 * iteration order of an unordered collection.
 */
const RAW_PACKS: readonly unknown[] = [umum]

export const RULESETS: readonly Ruleset[] = RAW_PACKS.map(parseRuleset)

export const DEFAULT_RULESET_ID = 'umum'

export function getRuleset(id: string): Ruleset {
  const found = RULESETS.find((r) => r.id === id)
  if (!found) throw new Error(`ruleset tidak dikenal: ${id}`)
  return found
}

export function defaultRuleset(): Ruleset {
  return getRuleset(DEFAULT_RULESET_ID)
}

export * from './schema'
