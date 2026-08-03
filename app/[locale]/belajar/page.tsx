import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Belajar } from '@/components/learn/Belajar'
import { LOCALES, isLocale, t } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function BelajarPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const kata = t(params.locale)

  return (
    <div className="flex flex-col gap-5">
      <Link
        href={`/${params.locale}/main`}
        className="font-sans text-sm underline underline-offset-4"
      >
        ← {kata.kembali}
      </Link>
      <h1 className="font-display text-3xl font-bold">{kata.belajar}</h1>
      <p className="max-w-prose font-sans text-sm text-ink/70">{kata.belajarIntro}</p>
      <Belajar locale={params.locale} />
    </div>
  )
}
