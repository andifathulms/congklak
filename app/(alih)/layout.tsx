import { BASE, KELAS_FONT } from '../dasar'
import { DEFAULT_LOCALE } from '@/lib/i18n'

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
      <head>
        {/*
          Pengalihan yang tidak butuh JavaScript. Halaman di bawahnya tetap
          punya isi dan tautan, jadi kalau refresh ini diabaikan pun tidak
          ada yang menatap layar kosong.
        */}
        <meta httpEquiv="refresh" content={`0; url=${BASE}/${DEFAULT_LOCALE}/main/`} />
      </head>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  )
}
