import { notFound } from 'next/navigation'
import { RULESETS } from '@/lib/rulesets'
import { LOCALES, isLocale, t } from '@/lib/i18n'
import { Panel } from '@/components/ui/Panel'
import { Lencana } from '@/components/ui/Lencana'
import { TautanTombol } from '@/components/ui/Tombol'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

/**
 * The contradiction ledger, and the reason this is not another congklak
 * clone (PRD §3).
 *
 * It was one running column in which a pack's name, its sources and the
 * places those sources disagree were all set at roughly the same weight —
 * so the one thing worth reading, *where they diverge*, looked like an
 * appendix. Each divergence is now a comparison: what this pack does, set
 * against the reading it did not take.
 */
export default function AturanPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const kata = t(params.locale)

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{kata.aturan}</h1>
        <p className="max-w-prose font-sans leading-relaxed text-ink/70">{kata.aturanIntro}</p>
        <nav className="flex flex-wrap gap-2 pt-1">
          {RULESETS.map((r) => (
            <a
              key={r.id}
              href={`#${r.id}`}
              className="rounded-full border border-teak/30 px-3 py-1 font-sans text-xs text-ink/70 transition hover:border-teak/60 hover:text-ink"
            >
              {r.name}
            </a>
          ))}
        </nav>
      </header>

      {RULESETS.map((ruleset) => (
        <article
          key={ruleset.id}
          id={ruleset.id}
          // Ditautkan dari pemilih aturan di layar papan, jadi judulnya
          // tidak boleh berhenti di balik header yang menempel.
          className="flex scroll-mt-24 flex-col gap-4"
        >
          <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-display text-2xl font-bold">{ruleset.name}</h2>
            <p className="font-sans text-sm text-ink/60">{ruleset.region}</p>
            <code className="rounded bg-mat-low px-1.5 py-0.5 font-mono text-xs text-ink/55">
              {ruleset.id}
            </code>
            {ruleset.aka.length > 0 && (
              <p className="font-sans text-sm text-ink/45">{ruleset.aka.join(' · ')}</p>
            )}
          </header>

          <p className="max-w-prose font-sans leading-relaxed text-ink/85">{ruleset.summary}</p>

          <Panel judul={kata.sumber}>
            <ul className="flex flex-col gap-3">
              {ruleset.sources.map((source, i) => (
                <li key={i} className="border-l-2 border-teak/25 pl-3">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="font-sans font-medium">
                      {source.title}
                      {source.year ? `, ${source.year}` : ''}
                    </p>
                    {/* Sumber yang belum dicek ditampilkan apa adanya. */}
                    <Lencana nada={source.confidence === 'terverifikasi' ? 'netral' : 'perhatian'}>
                      {source.confidence === 'terverifikasi' ? kata.terverifikasi : kata.perluCek}
                    </Lencana>
                  </div>
                  <p className="font-mono text-xs text-ink/55">
                    {source.publisher}
                    {source.locator ? ` — ${source.locator}` : ''}
                  </p>
                  {source.note && (
                    <p className="mt-1 max-w-prose font-sans text-sm leading-relaxed text-ink/60">
                      {source.note}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Panel>

          {ruleset.divergences.length > 0 && (
            <Panel judul={kata.perbedaan}>
              <ul className="flex flex-col gap-4">
                {ruleset.divergences.map((d, i) => (
                  <li
                    key={i}
                    className="border-t border-mat-edge/70 pt-4 first:border-0 first:pt-0"
                  >
                    <h3 className="font-display text-base font-semibold">{d.rule}</h3>
                    {/* Bacaan yang dipakai dan bacaan yang tidak diambil,
                        berdampingan: itulah isi produknya. */}
                    <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                      <div className="rounded-lg bg-mat p-2.5 ring-1 ring-mat-edge/60">
                        <p className="mb-1 font-sans text-[11px] uppercase tracking-[0.14em] text-ink/45">
                          {kata.dipakaiDiSini}
                        </p>
                        <p className="font-sans text-sm leading-relaxed text-ink/85">
                          {d.thisPack}
                        </p>
                      </div>
                      <div className="rounded-lg p-2.5 ring-1 ring-dashed ring-mat-edge">
                        <p className="mb-1 font-sans text-[11px] uppercase tracking-[0.14em] text-ink/45">
                          {kata.bacaanLain}
                        </p>
                        <p className="font-sans text-sm leading-relaxed text-ink/65">
                          {d.otherReading}
                        </p>
                      </div>
                    </div>
                    {d.note && (
                      <p className="mt-2 max-w-prose font-sans text-xs leading-relaxed text-ink/50">
                        {d.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </article>
      ))}

      <Panel judul={kata.glosarium}>
        {/* Kosakatanya tidak diterjemahkan — itu justru yang dijaga di sini. */}
        <dl className="flex max-w-prose flex-col gap-2 font-sans text-sm leading-relaxed text-ink/75">
          {[kata.lumbungGloss, kata.bijiGloss, kata.menembakGloss].map((baris) => {
            const [istilah, ...sisa] = baris.split(' — ')
            return (
              <div key={istilah}>
                <dt className="inline font-medium italic text-ink">{istilah}</dt>
                <dd className="inline"> — {sisa.join(' — ')}</dd>
              </div>
            )
          })}
        </dl>
      </Panel>

      <div>
        <TautanTombol href={`/${params.locale}/main`} bobot="utama">
          {kata.kembali}
        </TautanTombol>
      </div>
    </div>
  )
}
