import { notFound } from 'next/navigation'
import { RULESETS } from '@/lib/rulesets'
import { LOCALES, isLocale, t } from '@/lib/i18n'
import { Panel } from '@/components/ui/Panel'
import { Lencana } from '@/components/ui/Lencana'
import type { StatusPerbedaan as Status } from '@/lib/rulesets/schema'
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
        <p className="max-w-prose font-sans leading-relaxed text-fg">{kata.aturanIntro}</p>
        <nav className="flex flex-wrap gap-2 pt-1">
          {RULESETS.map((r) => (
            <a
              key={r.id}
              href={`#${r.id}`}
              className="rounded-full border border-teak/30 px-3 py-1 font-sans text-xs text-fg transition hover:border-teak/60 hover:text-fg"
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
            <p className="font-sans text-sm text-fg-muted">{ruleset.region}</p>
            <code className="rounded bg-mat-low px-1.5 py-0.5 font-mono text-xs text-fg-muted">
              {ruleset.id}
            </code>
            {ruleset.aka.length > 0 && (
              <p className="font-sans text-sm text-fg-muted">{ruleset.aka.join(' · ')}</p>
            )}
          </header>

          <p className="max-w-prose font-sans leading-relaxed text-fg">{ruleset.summary}</p>

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
                  <p className="font-mono text-xs text-fg-muted">
                    {source.publisher}
                    {source.locator ? ` — ${source.locator}` : ''}
                  </p>
                  {source.note && (
                    <p className="mt-1 max-w-prose font-sans text-sm leading-relaxed text-fg-muted">
                      {source.note}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Panel>

          {ruleset.divergences.length > 0 && (
            <Panel judul={kata.perbedaan}>
              {/* Berapa banyak dari daftar ini yang benar-benar sampai ke
                  mesin, dikatakan sebelum daftarnya — karena selama ini
                  daftar ini terbaca seolah semuanya dimainkan. */}
              <p className="mb-4 font-sans text-sm text-fg-muted">
                {kata.perbedaanRingkas
                  .replace('{n}', String(ruleset.divergences.length))
                  .replace(
                    '{a}',
                    String(ruleset.divergences.filter((d) => d.status !== 'dicatat').length),
                  )
                  .replace(
                    '{b}',
                    String(ruleset.divergences.filter((d) => d.status === 'dicatat').length),
                  )}
              </p>
              <ul className="flex flex-col gap-4">
                {ruleset.divergences.map((d, i) => (
                  <li
                    key={i}
                    className="border-t border-mat-edge/70 pt-4 first:border-0 first:pt-0"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                      <h3 className="font-display text-base font-semibold">{d.rule}</h3>
                      <StatusPerbedaan status={d.status} kata={kata} />
                    </div>
                    {/* Bacaan yang dipakai dan bacaan yang tidak diambil,
                        berdampingan: itulah isi produknya. */}
                    <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                      <div className="rounded-lg bg-mat p-2.5 ring-1 ring-mat-edge/60">
                        <p className="mb-1 font-sans text-2xs uppercase tracking-[0.14em] text-fg-muted">
                          {kata.dipakaiDiSini}
                        </p>
                        <p className="font-sans text-sm leading-relaxed text-fg">
                          {d.thisPack}
                        </p>
                      </div>
                      <div className="rounded-lg p-2.5 ring-1 ring-dashed ring-mat-edge">
                        <p className="mb-1 font-sans text-2xs uppercase tracking-[0.14em] text-fg-muted">
                          {kata.bacaanLain}
                        </p>
                        <p className="font-sans text-sm leading-relaxed text-fg-muted">
                          {d.otherReading}
                        </p>
                      </div>
                    </div>
                    {d.note && (
                      <p className="mt-2 max-w-prose font-sans text-xs leading-relaxed text-fg-muted">
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
        <dl className="flex max-w-prose flex-col gap-2 font-sans text-sm leading-relaxed text-fg">
          {[kata.lumbungGloss, kata.bijiGloss, kata.menembakGloss].map((baris) => {
            const [istilah, ...sisa] = baris.split(' — ')
            return (
              <div key={istilah}>
                <dt className="inline font-medium italic text-fg">{istilah}</dt>
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

/**
 * Seberapa jauh sebuah perbedaan sampai ke mesin.
 *
 * Yang dijalankan mesin dan yang baru dicatat sebelumnya tampil sama
 * persis, jadi halaman ini menyiratkan aplikasinya memainkan semua yang
 * didokumentasikannya. Delapan dari delapan belas tidak.
 */
function StatusPerbedaan({ status, kata }: { status: Status; kata: ReturnType<typeof t> }) {
  const label =
    status === 'dapat-dibandingkan'
      ? kata.statusDapatDibandingkan
      : status === 'diterapkan'
        ? kata.statusDiterapkan
        : kata.statusDicatat
  const jelas =
    status === 'dapat-dibandingkan'
      ? kata.statusJelasDibandingkan
      : status === 'diterapkan'
        ? kata.statusJelasDiterapkan
        : kata.statusJelasDicatat

  return (
    <span
      title={jelas}
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-sans text-2xs',
        status === 'dicatat'
          ? 'bg-mat-low text-fg-muted ring-1 ring-inset ring-mat-edge'
          : 'bg-teak/12 text-fg ring-1 ring-inset ring-teak/30',
      ].join(' ')}
    >
      <span
        aria-hidden
        className={[
          'h-1.5 w-1.5 rounded-full',
          status === 'dapat-dibandingkan'
            ? 'bg-teak'
            : status === 'diterapkan'
              ? 'bg-teak/50'
              : 'bg-fg-muted/40',
        ].join(' ')}
      />
      {label}
    </span>
  )
}
