import { t, type Locale } from '@/lib/i18n'

/**
 * What this is, above the board, in the first screen.
 *
 * The landing view used to open on a game board with no heading and no
 * sentence: the first words a visitor read were "ATURAN YANG DIPAKAI"
 * followed by three proper nouns. A stranger could tell it was a mancala
 * game and nothing else — the claim that makes this different from every
 * other congklak clone lived only in the footer, below the fold.
 *
 * It stays deliberately short. This is a game, and the board should still
 * be the thing you reach: one heading, one sentence, three facts, and out
 * of the way.
 */
export function Pembuka({ locale }: { locale: Locale }) {
  const kata = t(locale)
  const nilai = [kata.nilai1, kata.nilai2, kata.nilai3]

  return (
    <header className="flex flex-col gap-3">
      <h1 className="max-w-[22ch] font-display text-xl font-bold leading-tight sm:max-w-none sm:text-2xl">
        {kata.beranda}
      </h1>
      <p className="max-w-prose font-sans leading-relaxed text-fg-muted">{kata.berandaIntro}</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {nilai.map((n) => (
          <li key={n} className="flex items-baseline gap-1.5 font-sans text-sm text-fg-muted">
            {/* Seed-shaped bullets: the same mark the board is made of. */}
            <span aria-hidden className="h-1.5 w-1.5 shrink-0 translate-y-[-0.1em] rounded-full bg-accent" />
            {n}
          </li>
        ))}
      </ul>
    </header>
  )
}
