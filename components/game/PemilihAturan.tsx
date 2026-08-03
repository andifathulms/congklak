'use client'

import Link from 'next/link'
import type { Ruleset } from '@/lib/rulesets'
import { t, type Locale } from '@/lib/i18n'

/**
 * Which ruleset is active, and one tap to where it came from (PRD §8.3).
 * There is no anonymous ruleset anywhere in this app.
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
    <div className="flex flex-col gap-2 rounded-2xl border border-teak/20 bg-mat/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-sans text-xs uppercase tracking-widest text-ink/50">
          {kata.rulesetAktif}
        </span>
        {rulesets.map((r) => (
          <button
            key={r.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(r.id)}
            aria-pressed={r.id === active.id}
            title={r.region}
            className={[
              'rounded-full px-3 py-1 font-sans text-xs transition disabled:opacity-40',
              r.id === active.id ? 'bg-ink text-mat' : 'border border-teak/30 text-ink/70',
            ].join(' ')}
          >
            {r.name}
          </button>
        ))}
        <Link
          href={`/${locale}/aturan`}
          className="ml-auto font-sans text-xs underline underline-offset-4"
        >
          {kata.sumber} →
        </Link>
      </div>

      <p className="font-sans text-xs text-ink/60">
        <span className="font-mono text-ink/45">{active.region}</span>
        {' · '}
        {active.divergences.length} {kata.perbedaanCount}
        {perluCek > 0 && (
          <>
            {' · '}
            <span className="rounded-full bg-brass/20 px-2 py-0.5">
              {perluCek} {kata.perluCek}
            </span>
          </>
        )}
      </p>

      {/* Mengganti aturan mengubah permainan, jadi katakan begitu, bukan
          diam-diam mereset papan di belakang pemain. */}
      {disabled && <p className="font-sans text-xs text-ink/45">{kata.gantiSaatJalan}</p>}
    </div>
  )
}
