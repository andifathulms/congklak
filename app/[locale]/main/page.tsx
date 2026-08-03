import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Permainan } from '@/components/game/Permainan'
import { defaultRuleset } from '@/lib/rulesets'
import { LOCALES, isLocale, t } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function MainPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const kata = t(params.locale)
  const ruleset = defaultRuleset()

  return (
    <div className="flex flex-col gap-5">
      {/* Aturan yang sedang berlaku selalu disebut namanya, satu ketukan
          dari papan. Tidak ada aturan anonim di sini (PRD §8.3). */}
      <p className="font-sans text-sm text-ink/70">
        {kata.hotseat} · {kata.rulesetAktif}:{' '}
        <Link
          href={`/${params.locale}/aturan`}
          className="font-medium underline underline-offset-4"
        >
          {ruleset.name}
        </Link>{' '}
        <span className="text-ink/50">({ruleset.region})</span>
      </p>

      <Permainan ruleset={ruleset} locale={params.locale} />
    </div>
  )
}
