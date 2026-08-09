import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'

/**
 * The language switch, with a fixed home beside the wordmark.
 *
 * It used to sit at the end of the nav row, which on a phone put it past
 * the right edge of a scrolling strip with nothing to say it was there —
 * so the one control an English speaker needs was the least reachable
 * thing on the page, in an app that ships an English translation.
 */
export function GantiBahasa({ locale }: { locale: Locale }) {
  const kata = t(locale)
  const other: Locale = locale === 'id' ? 'en' : 'id'

  return (
    <Link
      href={`/${other}/main`}
      lang={other}
      aria-label={`${kata.bahasa}: ${other === 'id' ? 'Bahasa Indonesia' : 'English'}`}
      className="shrink-0 rounded-lg border border-mat-edge px-2 py-1 font-mono text-2xs uppercase text-fg-muted transition hover:border-teak/40 hover:text-fg"
    >
      {other}
    </Link>
  )
}
