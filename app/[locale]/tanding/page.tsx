import { notFound } from 'next/navigation'
import { metaHalaman } from '@/app/dasar'
import { Tanding } from '@/components/connect/Tanding'
import { Kepala } from '@/components/shell/Kepala'
import { LOCALES, isLocale, t } from '@/lib/i18n'

export function generateMetadata({ params }: { params: { locale: string } }) {
  // Judul dan deskripsinya diambil dari entri i18n yang sama dengan yang
  // dirender halaman ini — bukan pasangan teks kedua yang bisa menyimpang.
  if (!isLocale(params.locale)) return {}
  return metaHalaman(params.locale, 'tanding')
}

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
