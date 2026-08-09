'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { t, type Locale } from '@/lib/i18n'

/**
 * Where you are, in a game that has five places to be.
 *
 * The nav was five underlined links with no current-page state, so nothing
 * on screen ever said which section you were in — the board, the sources
 * and the replay viewer all looked identically unvisited. The marker is a
 * teak underline rather than a brass one: brass means the active hole and
 * captures, and nothing else (PRD §11).
 */
export function Navigasi({ locale }: { locale: Locale }) {
  const kata = t(locale)
  const pathname = usePathname() ?? ''
  const other: Locale = locale === 'id' ? 'en' : 'id'

  const tautan = [
    { href: `/${locale}/main`, label: kata.papan },
    { href: `/${locale}/belajar`, label: kata.belajar },
    { href: `/${locale}/aturan`, label: kata.aturan },
    { href: `/${locale}/banding`, label: kata.banding },
    { href: `/${locale}/tanding`, label: kata.tanding },
    { href: `/${locale}/ulang`, label: kata.ulang },
  ]

  // Trailing slashes are on in the export, so compare on the segment.
  const segmen = pathname.replace(/\/+$/, '').split('/').pop() ?? ''

  return (
    <nav
      aria-label={kata.judul}
      className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      {tautan.map((l) => {
        const aktif = l.href.endsWith(`/${segmen}`)
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={aktif ? 'page' : undefined}
            className={[
              'relative whitespace-nowrap rounded-lg px-2.5 py-1.5 font-sans text-sm transition',
              'after:absolute after:inset-x-2.5 after:-bottom-px after:h-0.5 after:rounded-full after:transition',
              aktif
                ? 'font-medium text-fg after:bg-teak'
                : 'text-fg-muted hover:bg-mat-high hover:text-fg after:bg-transparent',
            ].join(' ')}
          >
            {l.label}
          </Link>
        )
      })}

      <Link
        href={`/${other}/main`}
        lang={other}
        aria-label={`${kata.bahasa}: ${other === 'id' ? 'Bahasa Indonesia' : 'English'}`}
        className="ml-2 shrink-0 rounded-lg border border-mat-edge px-2 py-1 font-mono text-2xs uppercase text-fg-muted transition hover:border-teak/40 hover:text-fg"
      >
        {other}
      </Link>
    </nav>
  )
}
