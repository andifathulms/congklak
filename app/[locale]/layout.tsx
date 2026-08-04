import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navigasi } from '@/components/shell/Navigasi'
import { LOCALES, isLocale, t } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!isLocale(params.locale)) notFound()
  const kata = t(params.locale)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 sm:px-8">
      {/*
        The header stays put while the board scrolls, because on a phone the
        board is taller than the viewport and losing the way out of it means
        scrolling back up through a game in progress.
      */}
      <header className="sticky top-0 z-20 -mx-4 border-b border-mat-edge/70 bg-mat/90 px-4 backdrop-blur-sm sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pb-2 pt-3 sm:pt-4">
          <Link
            href={`/${params.locale}/main`}
            className="group flex items-baseline gap-2.5 rounded-lg"
          >
            <span className="font-display text-xl font-bold tracking-tight">{kata.judul}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/45">
              congklak · dakon
            </span>
          </Link>
          <Navigasi locale={params.locale} />
        </div>
      </header>

      <main className="flex-1 py-6 sm:py-8">{children}</main>

      <footer className="mt-8 border-t border-mat-edge/70 py-5">
        <p className="max-w-prose font-sans text-xs leading-relaxed text-ink/50">
          {kata.tagline}
        </p>
        <p className="mt-1.5 font-mono text-[11px] text-ink/40">
          Aturan adalah data bersumber, bukan kode.
        </p>
      </footer>
    </div>
  )
}
