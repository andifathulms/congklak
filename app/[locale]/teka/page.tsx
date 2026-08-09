import { notFound } from 'next/navigation'
import { TekaTeki } from '@/components/teka/TekaTeki'
import { Kepala } from '@/components/shell/Kepala'
import { LOCALES, isLocale, t } from '@/lib/i18n'

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
