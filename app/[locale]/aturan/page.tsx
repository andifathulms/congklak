import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RULESETS } from '@/lib/rulesets'
import { LOCALES, isLocale, t } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function AturanPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const kata = t(params.locale)

  return (
    <div className="flex flex-col gap-8">
      <Link
        href={`/${params.locale}/main`}
        className="font-sans text-sm underline underline-offset-4"
      >
        ← {kata.kembali}
      </Link>

      {RULESETS.map((ruleset) => (
        <article key={ruleset.id} className="flex flex-col gap-4">
          <header>
            <h1 className="font-display text-3xl font-bold">{ruleset.name}</h1>
            <p className="font-sans text-sm text-ink/60">
              {ruleset.region} · <span className="font-mono text-xs">{ruleset.id}</span>
            </p>
            {ruleset.aka.length > 0 && (
              <p className="mt-1 font-sans text-sm text-ink/60">
                {ruleset.aka.join(' · ')}
              </p>
            )}
          </header>

          <p className="max-w-prose font-sans text-ink/85">{ruleset.summary}</p>

          <section>
            <h2 className="mb-2 font-sans text-xs uppercase tracking-widest text-ink/50">
              {kata.sumber}
            </h2>
            <ul className="flex flex-col gap-2">
              {ruleset.sources.map((source, i) => (
                <li key={i} className="border-l-2 border-teak/30 pl-3">
                  <p className="font-mono text-sm">
                    {source.title}
                    {source.year ? `, ${source.year}` : ''}
                  </p>
                  <p className="font-sans text-sm text-ink/60">
                    {source.publisher}
                    {source.locator ? ` — ${source.locator}` : ''}
                  </p>
                  {/* Sumber yang belum dicek ditampilkan apa adanya. */}
                  <p className="mt-0.5 font-sans text-xs">
                    <span
                      className={
                        source.confidence === 'terverifikasi'
                          ? 'rounded-full bg-teak/15 px-2 py-0.5 text-ink/70'
                          : 'rounded-full bg-brass/20 px-2 py-0.5 text-ink/80'
                      }
                    >
                      {source.confidence === 'terverifikasi' ? kata.terverifikasi : kata.perluCek}
                    </span>
                  </p>
                  {source.note && (
                    <p className="mt-1 max-w-prose font-sans text-xs text-ink/55">{source.note}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {ruleset.divergences.length > 0 && (
            <section>
              <h2 className="mb-2 font-sans text-xs uppercase tracking-widest text-ink/50">
                {kata.perbedaan}
              </h2>
              <ul className="flex flex-col gap-3">
                {ruleset.divergences.map((d, i) => (
                  <li key={i} className="rounded-2xl border border-teak/20 p-3">
                    <h3 className="font-display text-base font-semibold">{d.rule}</h3>
                    <p className="mt-1 max-w-prose font-sans text-sm text-ink/85">
                      {d.thisPack}
                    </p>
                    <p className="mt-1 max-w-prose font-sans text-sm text-ink/60">
                      <span className="font-medium">{kata.bacaanLain}:</span> {d.otherReading}
                    </p>
                    {d.note && (
                      <p className="mt-1 max-w-prose font-sans text-xs text-ink/50">{d.note}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      ))}

      <section>
        <h2 className="mb-2 font-sans text-xs uppercase tracking-widest text-ink/50">
          {kata.glosarium}
        </h2>
        <ul className="flex max-w-prose flex-col gap-1 font-sans text-sm text-ink/75">
          <li>{kata.lumbungGloss}</li>
          <li>{kata.bijiGloss}</li>
          <li>{kata.menembakGloss}</li>
        </ul>
      </section>
    </div>
  )
}
