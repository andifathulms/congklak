import { KELAS_FONT } from '../dasar'

export { metadata, viewport } from '../dasar'

/**
 * Root layout for `/` alone — the redirect into the default locale.
 *
 * It exists because the locale layout is now itself a root layout, so that
 * `<html lang>` can name the language of the page it wraps. This one wraps
 * the redirect, which is Indonesian by definition: it is the default locale
 * it redirects to.
 */
export default function AlihLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={KELAS_FONT}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  )
}
