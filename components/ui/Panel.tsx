/**
 * A surface raised off the mat.
 *
 * Every grouping in the app was a transparent box with a faint teak border,
 * which meant a panel and the page background were the same material and
 * nothing looked contained by anything. A panel sits slightly above the
 * mat and casts a shadow for it; the board keeps the heaviest elevation on
 * the page, so panels stay light enough not to compete with it.
 */
export function Panel({
  judul,
  aksi,
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  /** Group name, rendered as a small engraved-looking label. */
  judul?: string
  /** Optional control aligned to the far end of the title row. */
  aksi?: React.ReactNode
}) {
  return (
    <section
      {...props}
      className={[
        'rounded-panel bg-mat-high p-4 shadow-raise ring-1 ring-mat-edge/60',
        className,
      ].join(' ')}
    >
      {(judul || aksi) && (
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          {judul && (
            <h2 className="font-sans text-2xs font-medium uppercase tracking-[0.14em] text-fg-muted">
              {judul}
            </h2>
          )}
          {aksi}
        </div>
      )}
      {children}
    </section>
  )
}
