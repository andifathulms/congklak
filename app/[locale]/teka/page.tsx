import { notFound } from 'next/navigation'
import { metaHalaman } from '@/app/dasar'
import { TekaTeki } from '@/components/teka/TekaTeki'
import { Kepala } from '@/components/shell/Kepala'
import { LOCALES, isLocale, t } from '@/lib/i18n'

export function generateMetadata({ params }: { params: { locale: string } }) {
  // Judul dan deskripsinya diambil dari entri i18n yang sama dengan yang
  // dirender halaman ini — bukan pasangan teks kedua yang bisa menyimpang.
  if (!isLocale(params.locale)) return {}
  return metaHalaman(params.locale, 'teka')
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function TekaPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const kata = t(params.locale)

  return (
    <div className="flex flex-col gap-6">
      <Kepala judul={kata.teka} intro={kata.tekaIntro} />
      <TekaTeki locale={params.locale} />
    </div>
  )
}
