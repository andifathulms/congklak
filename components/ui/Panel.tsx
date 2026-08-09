/**
 * A surface raised off the mat.
 *
 * Every grouping in the app was a transparent box with a faint teak border,
 * which meant a panel and the page background were the same material and
 * nothing looked contained by anything. A panel sits slightly above the
 * mat and casts a shadow for it; the board keeps the heaviest elevation on
 * the page, so panels stay light enough not to compete with it.
 *
 * The title is a label, not a heading, unless a caller says otherwise.
 * Every panel used to emit an <h2>, so a document outline read h1 (26px
 * page title) → h2 (12px uppercase micro-label), and someone navigating by
 * heading landed on "Aturan yang dipakai" as a peer of the page title.
 * Most of these panels are controls, and controls are not sections. The
 * three on the sources page that genuinely are sections ask for a level.
 */
export function Panel({
  judul,
  tingkat,
  aksi,
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  /** Group name, rendered as a small engraved-looking label. */
  judul?: string
  /**
   * Naikkan judulnya jadi tajuk sungguhan pada tingkat ini. Hanya untuk
   * panel yang memang sebuah bagian dokumen — bukan sekadar kelompok
   * kendali yang kebetulan punya nama.
   */
  tingkat?: 2 | 3 | 4
  /** Optional control aligned to the far end of the title row. */
  aksi?: React.ReactNode
}) {
  const Judul = (tingkat ? `h${tingkat}` : 'p') as 'h2' | 'h3' | 'h4' | 'p'

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
            <Judul className="font-sans text-2xs font-medium uppercase tracking-[0.14em] text-fg-muted">
              {judul}
            </Judul>
          )}
          {aksi}
        </div>
      )}
      {children}
    </section>
  )
}
