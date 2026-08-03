import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Tanding } from '@/components/connect/Tanding'
import { LOCALES, isLocale, t } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function TandingPage({ params }: { params: { locale: string } }) {
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
      <h1 className="font-display text-3xl font-bold">{kata.tanding}</h1>
      <Tanding locale={params.locale} />
    </div>
  )
}
