/**
 * The maker's mark — a quiet credit in the site footer, on every page.
 *
 * Deliberately not a badge and not a corner sticker: it sits in the
 * footer's existing bottom bar, opposite the project's own line, and adds
 * no divider of its own. Everything identifying the author lives in the
 * one object below, so updating a link or the name is a single edit.
 *
 * A server component, so the year is stamped when the site is built. The
 * export is static, which means the year is fixed until the next deploy —
 * fine for a footer, and the alternative would be shipping a clock to the
 * client for a four-digit number.
 */
const PEMBUAT = {
  nama: 'Andi Fathul Mukminin',
  tautan: [
    { nama: 'Portfolio', href: 'https://andifathulms.github.io/en/', ikon: IkonGlobe },
    { nama: 'GitHub', href: 'https://github.com/andifathulms', ikon: IkonGitHub },
    { nama: 'LinkedIn', href: 'https://www.linkedin.com/in/andifathulmukminin/', ikon: IkonLinkedIn },
    { nama: 'Instagram', href: 'https://www.instagram.com/andifathulms/', ikon: IkonInstagram },
  ],
} as const

export function TandaPembuat() {
  const tahun = new Date().getFullYear()
  const portofolio = PEMBUAT.tautan[0].href

  return (
    <div className="flex flex-col gap-1.5 sm:items-end">
      <p className="font-sans text-[11px] leading-relaxed text-ink/45">
        Designed &amp; built by{' '}
        <a
          href={portofolio}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink/70 underline decoration-ink/25 underline-offset-4 transition hover:text-ink hover:decoration-teak"
        >
          {PEMBUAT.nama}
        </a>{' '}
        <span aria-hidden className="text-ink/25">
          ·
        </span>{' '}
        {/* Angka tahun ikut aturan angka di seluruh situs: mono, tabular. */}
        <span className="tnum font-mono">© {tahun}</span>
      </p>

      <ul className="-mx-2 flex items-center gap-0.5 sm:-mr-2 sm:ml-0">
        {PEMBUAT.tautan.map(({ nama, href, ikon: Ikon }) => (
          <li key={nama}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={nama}
              className="flex rounded-lg p-2 text-ink/45 transition hover:bg-mat-high hover:text-ink"
            >
              <Ikon />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Icons are inline and hand-written rather than pulled from a package:
 * four marks at 18px do not justify a dependency, and the rule against
 * adding dependencies for anything the project can draw itself applies
 * here as much as anywhere.
 */
const UKURAN = { width: 18, height: 18, viewBox: '0 0 24 24', 'aria-hidden': true } as const

function IkonGlobe() {
  return (
    <svg {...UKURAN} fill="none" stroke="currentColor" strokeWidth={1.6}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z" />
    </svg>
  )
}

function IkonGitHub() {
  return (
    <svg {...UKURAN} fill="currentColor">
      <path d="M12 1.5A10.5 10.5 0 0 0 8.68 22a.79.79 0 0 0 .72-.51.75.75 0 0 0 0-.26v-1.8c-2.92.64-3.54-1.4-3.54-1.4a2.79 2.79 0 0 0-1.17-1.54c-.95-.66.08-.64.08-.64a2.2 2.2 0 0 1 1.61 1.08 2.24 2.24 0 0 0 3.05.87 2.24 2.24 0 0 1 .67-1.4c-2.33-.27-4.78-1.17-4.78-5.2a4.07 4.07 0 0 1 1.08-2.82 3.78 3.78 0 0 1 .1-2.78s.88-.28 2.9 1.07a9.9 9.9 0 0 1 5.28 0c2-1.35 2.89-1.07 2.89-1.07a3.78 3.78 0 0 1 .1 2.78 4.07 4.07 0 0 1 1.08 2.82c0 4.04-2.46 4.93-4.8 5.19a2.5 2.5 0 0 1 .71 1.94v2.88a.75.75 0 0 0 .53.74A10.5 10.5 0 0 0 12 1.5Z" />
    </svg>
  )
}

function IkonLinkedIn() {
  return (
    <svg {...UKURAN} fill="currentColor">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3.2 9.25h3.56v11.3H3.2zM10.1 9.25h3.4v1.55h.05a3.74 3.74 0 0 1 3.36-1.85c3.6 0 4.26 2.37 4.26 5.45v5.65h-3.55v-5c0-1.2 0-2.73-1.66-2.73s-1.92 1.3-1.92 2.64v5.09H10.1Z" />
    </svg>
  )
}

function IkonInstagram() {
  return (
    <svg {...UKURAN} fill="none" stroke="currentColor" strokeWidth={1.6}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}
