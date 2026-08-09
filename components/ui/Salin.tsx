'use client'

import { useEffect, useState } from 'react'
import { t, type Locale } from '@/lib/i18n'

/**
 * A game is its move list plus its ruleset id (invariant 11), so the game
 * code is the whole game — shareable, replayable, and until now printed as
 * plain text you had to select by hand. Codes are also the entire P2P
 * handshake, where hand-selecting a long string is how a connection gets
 * mistyped.
 *
 * Falls back to leaving the text selectable if the clipboard is refused,
 * which it is on any page not served over a secure origin.
 */
export function Salin({
  teks,
  locale,
  label,
}: {
  teks: string
  locale: Locale
  label?: string
}) {
  const kata = t(locale)
  const [tersalin, setTersalin] = useState(false)

  useEffect(() => {
    if (!tersalin) return
    const id = setTimeout(() => setTersalin(false), 1600)
    return () => clearTimeout(id)
  }, [tersalin])

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          ?.writeText(teks)
          .then(() => setTersalin(true))
          .catch(() => setTersalin(false))
      }}
      aria-label={`${label ?? kata.salin}: ${teks}`}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-teak/30 px-2.5 py-1 font-sans text-2xs text-fg-muted transition hover:border-teak/60 hover:text-fg"
    >
      <span aria-live="polite">{tersalin ? kata.tersalin : (label ?? kata.salin)}</span>
    </button>
  )
}
