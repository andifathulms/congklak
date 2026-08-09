'use client'

import Link from 'next/link'
import type { Ruleset } from '@/lib/rulesets'
import { t, type Locale } from '@/lib/i18n'
import { Panel } from '@/components/ui/Panel'
import { Segmen } from '@/components/ui/Segmen'
import { Lencana } from '@/components/ui/Lencana'

/**
 * Which ruleset is active, and one tap to where it came from (PRD §8.3).
 * There is no anonymous ruleset anywhere in this app.
 *
 * This is the differentiator, so it gets to look like one: the choice sits
 * in a proper control, the region and the recorded divergences are stated
 * next to it, and anything still needing checking is said in brass rather
 * than buried. The board screen used to repeat all of this in a sentence
 * above the panel; the panel is the one place it belongs.
 */
export function PemilihAturan({
  rulesets,
  active,
  onChange,
  locale,
  disabled,
}: {
  rulesets: readonly Ruleset[]
  active: Ruleset
  onChange: (id: string) => void
  locale: Locale
  disabled: boolean
}) {
  const kata = t(locale)
  const perluCek = active.sources.filter((s) => s.confidence === 'perlu-cek').length

  return (
    <Panel
      judul={kata.rulesetAktif}
      aksi={
        <Link
          href={`/${locale}/aturan#${active.id}`}
          className="rounded font-sans text-xs text-fg-muted underline underline-offset-4 transition hover:text-fg"
        >
          {kata.sumber} →
        </Link>
      }
      className="flex flex-col gap-2.5"
    >
      <Segmen
        options={rulesets.map((r) => [r.id, r.name] as const)}
        value={active.id}
        onChange={onChange}
        label={kata.rulesetAktif}
        disabled={disabled}
      />

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span className="font-mono text-xs text-fg-muted">{active.region}</span>
        <span aria-hidden className="text-fg-muted">
          ·
        </span>
        <Link
          href={`/${locale}/aturan#${active.id}`}
          className="rounded font-sans text-xs text-fg-muted underline decoration-teak/30 underline-offset-4 transition hover:text-fg"
        >
          {active.divergences.length} {kata.perbedaanCount}
        </Link>
        {perluCek > 0 && (
          <Lencana nada="perhatian">
            {perluCek} {kata.perluCek}
          </Lencana>
        )}
      </div>

      {/* Mengganti aturan mengubah permainan, jadi katakan begitu, bukan
          diam-diam mereset papan di belakang pemain. */}
      {disabled && <p className="font-sans text-xs text-fg-muted">{kata.gantiSaatJalan}</p>}
    </Panel>
  )
}
