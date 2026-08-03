import Link from 'next/link'
import { notFound } from 'next/navigation'
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
  const other = params.locale === 'id' ? 'en' : 'id'

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-6 p-4 sm:p-8">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <Link href={`/${params.locale}/main`} className="font-display text-2xl font-bold">
          {kata.judul}
        </Link>
        <p className="font-sans text-sm text-ink/60">{kata.tagline}</p>
        <nav className="ml-auto flex flex-wrap items-center gap-3 font-sans text-sm">
          <Link href={`/${params.locale}/aturan`} className="underline underline-offset-4">
            {kata.aturan}
          </Link>
          <Link href={`/${params.locale}/banding`} className="underline underline-offset-4">
            {kata.banding}
          </Link>
          <Link href={`/${params.locale}/ulang`} className="underline underline-offset-4">
            {kata.ulang}
          </Link>
          <Link href={`/${other}/main`} className="text-ink/60 underline underline-offset-4">
            {other.toUpperCase()}
          </Link>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="font-mono text-[11px] text-ink/40">
        Lumbung — congklak / dakon. Aturan adalah data bersumber, bukan kode.
      </footer>
    </div>
  )
}
