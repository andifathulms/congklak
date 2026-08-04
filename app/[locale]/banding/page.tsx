import { notFound } from 'next/navigation'
import { Banding } from '@/components/game/Banding'
import { Kepala } from '@/components/shell/Kepala'
import { LOCALES, isLocale, t } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function BandingPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const kata = t(params.locale)

  return (
    <div className="flex flex-col gap-6">
      <Kepala judul={kata.banding} intro={kata.bandingIntro} />
      <Banding locale={params.locale} />
    </div>
  )
}
