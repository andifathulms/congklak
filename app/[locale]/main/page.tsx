import { notFound } from 'next/navigation'
import { metaHalaman } from '@/app/dasar'
import { Permainan } from '@/components/game/Permainan'
import { Pembuka } from '@/components/shell/Pembuka'
import { defaultRuleset } from '@/lib/rulesets'
import { LOCALES, isLocale } from '@/lib/i18n'

export function generateMetadata({ params }: { params: { locale: string } }) {
  // Judul dan deskripsinya diambil dari entri i18n yang sama dengan yang
  // dirender halaman ini — bukan pasangan teks kedua yang bisa menyimpang.
  if (!isLocale(params.locale)) return {}
  return metaHalaman(params.locale, 'main')
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function MainPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const ruleset = defaultRuleset()

  // Aturan yang sedang berlaku selalu disebut namanya, satu ketukan dari
  // papan (PRD §8.3) — tapi sekali, di dalam pemilihnya, bukan diulang
  // dalam kalimat di atasnya.
  return (
    <div className="flex flex-col gap-6">
      <Pembuka locale={params.locale} />
      <Permainan ruleset={ruleset} locale={params.locale} />
    </div>
  )
}
