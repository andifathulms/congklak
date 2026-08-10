import type { Ruleset } from '@/lib/rulesets'

/**
 * Which sources in this pack speak to the clause that just decided
 * something.
 *
 * The app cites everything — on the sources page. At the moment a rule
 * actually fires, the board said what happened and never which reading
 * produced it or who says so. A citation the reader has to go and look for
 * is a footnote, and the brief for this work is that the source belongs
 * where the rule is applied.
 *
 * The link already exists in the data: a divergence names the option it
 * turns on, and lists the source titles in its own pack that discuss it.
 * This walks that link backwards, from option path to source titles.
 *
 * Reading only — it never decides anything. A clause with no divergence
 * recorded against it yields nothing, and the caller says so rather than
 * inventing a citation.
 */
export function sumberUntukOpsi(ruleset: Ruleset, opsi: string): readonly string[] {
  const judul: string[] = []
  for (const d of ruleset.divergences) {
    if (d.banding?.opsi !== opsi) continue
    for (const s of d.sources) {
      // Dedup dengan indexOf, bukan Set: urutannya harus sama persis di
      // mana pun ini berjalan, dan urutan itu adalah urutan pack-nya.
      if (judul.indexOf(s) === -1) judul.push(s)
    }
  }
  return judul
}

/** Aturan yang diperselisihkan itu sendiri, dalam bahasa manusia. */
export function aturanUntukOpsi(ruleset: Ruleset, opsi: string): string | null {
  const cocok = ruleset.divergences.find((d) => d.banding?.opsi === opsi)
  return cocok ? cocok.rule : null
}
