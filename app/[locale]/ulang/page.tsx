import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Ulang } from '@/components/game/Ulang'
import { LOCALES, isLocale, t } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function UlangPage({ params }: { params: { locale: string } }) {
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
      <h1 className="font-display text-3xl font-bold">{kata.ulang}</h1>
      {/* Sebuah permainan adalah daftar langkah plus id aturan, jadi kode
          pendek dari layar papan sudah cukup untuk memutarnya kembali. */}
      <Ulang locale={params.locale} />
    </div>
  )
}
