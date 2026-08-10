import { notFound } from 'next/navigation'
import { metaHalaman } from '@/app/dasar'
import { Banding } from '@/components/game/Banding'
import { Kepala } from '@/components/shell/Kepala'
import { LOCALES, isLocale, t } from '@/lib/i18n'

export function generateMetadata({ params }: { params: { locale: string } }) {
  // Judul dan deskripsinya diambil dari entri i18n yang sama dengan yang
  // dirender halaman ini — bukan pasangan teks kedua yang bisa menyimpang.
  if (!isLocale(params.locale)) return {}
  return metaHalaman(params.locale, 'banding')
}

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
