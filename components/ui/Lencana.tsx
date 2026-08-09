/**
 * Source weight is declared, not flattened.
 *
 * A verified government source and a source still needing checking are not
 * the same claim, and the app says so wherever either appears. The two
 * states were being restyled by hand at each call site with slightly
 * different colours; one badge keeps them consistent, and keeps
 * "needs checking" visible rather than polite.
 */
export function Lencana({
  nada = 'netral',
  children,
}: {
  nada?: 'netral' | 'perhatian'
  children: React.ReactNode
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 font-sans text-2xs leading-tight',
        nada === 'perhatian'
          ? 'bg-brass/20 text-fg ring-1 ring-inset ring-brass/40'
          : 'bg-teak/10 text-fg-muted ring-1 ring-inset ring-teak/20',
      ].join(' ')}
    >
      {children}
    </span>
  )
}
