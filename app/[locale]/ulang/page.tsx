import { notFound } from 'next/navigation'
import { Ulang } from '@/components/game/Ulang'
import { Kepala } from '@/components/shell/Kepala'
import { LOCALES, isLocale, t } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function UlangPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const kata = t(params.locale)

  return (
    <div className="flex flex-col gap-6">
      {/* Sebuah permainan adalah daftar langkah plus id aturan, jadi kode
          pendek dari layar papan sudah cukup untuk memutarnya kembali. */}
      <Kepala judul={kata.ulang} intro={kata.ulangIntro} />
      <Ulang locale={params.locale} />
    </div>
  )
}
