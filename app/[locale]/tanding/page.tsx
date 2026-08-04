import { notFound } from 'next/navigation'
import { Tanding } from '@/components/connect/Tanding'
import { Kepala } from '@/components/shell/Kepala'
import { LOCALES, isLocale, t } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function TandingPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const kata = t(params.locale)

  return (
    <div className="flex flex-col gap-6">
      {/* Pengantarnya duduk di langkah pertama, tempat aturan dipilih —
          di situ pula alasannya penting. */}
      <Kepala judul={kata.tanding} />
      <Tanding locale={params.locale} />
    </div>
  )
}
