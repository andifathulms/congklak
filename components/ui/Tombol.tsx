import Link from 'next/link'

/**
 * Three button weights, and only three.
 *
 * Buttons were being written inline everywhere — a solid teak one here, an
 * outlined one there, a bordered brass one for skipping the animation — so
 * the visual weight of a control had stopped tracking how consequential it
 * was. `utama` is the one action a screen wants you to take, `kedua` is
 * everything else you might do, `sunyi` is a control that should be
 * available without asking for attention.
 */
type Bobot = 'utama' | 'kedua' | 'sunyi'

const BOBOT: Record<Bobot, string> = {
  utama: 'bg-teak text-seedA shadow-raise enabled:hover:bg-teak-rim',
  kedua: 'border border-teak/35 text-ink enabled:hover:border-teak/60 enabled:hover:bg-teak/10',
  sunyi: 'text-ink/60 enabled:hover:bg-mat-high enabled:hover:text-ink',
}

const DASAR =
  'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2 font-sans text-sm transition disabled:cursor-not-allowed disabled:opacity-40'

export function Tombol({
  bobot = 'kedua',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { bobot?: Bobot }) {
  return <button {...props} className={[DASAR, BOBOT[bobot], className].join(' ')} />
}

/** The same weights, for a link that acts as an action. */
export function TautanTombol({
  bobot = 'kedua',
  className = '',
  ...props
}: React.ComponentProps<typeof Link> & { bobot?: Bobot }) {
  return <Link {...props} className={[DASAR, BOBOT[bobot], className].join(' ')} />
}
