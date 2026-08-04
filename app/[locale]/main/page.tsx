import { notFound } from 'next/navigation'
import { Permainan } from '@/components/game/Permainan'
import { defaultRuleset } from '@/lib/rulesets'
import { LOCALES, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function MainPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const ruleset = defaultRuleset()

  // Aturan yang sedang berlaku selalu disebut namanya, satu ketukan dari
  // papan (PRD §8.3) — tapi sekali, di dalam pemilihnya. Halaman ini dulu
  // mengulanginya dalam satu kalimat tepat di atas panel yang sudah
  // mengatakan hal yang sama.
  return <Permainan ruleset={ruleset} locale={params.locale} />
}
