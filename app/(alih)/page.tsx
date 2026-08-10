import Link from 'next/link'
import { BASE } from '../dasar'
import { DEFAULT_LOCALE, t } from '@/lib/i18n'

/**
 * `/` sends you to the default locale.
 *
 * This used to call `redirect()`, which in a static export emits Next's
 * error shell: a document with no content, no `lang`, and a redirect that
 * only happens once JavaScript has run. With scripting off or slow, the
 * site's front door was a blank page.
 *
 * A real page now, in three layers that degrade in order: a meta refresh in
 * the document head, which needs nothing; this content, which says where
 * you are going; and a link, for anyone the refresh does not carry.
 */
export default function Beranda() {
  const kata = t(DEFAULT_LOCALE)
  const tujuan = `/${DEFAULT_LOCALE}/main`

  return (
    <div className="mx-auto flex min-h-dvh max-w-prose flex-col justify-center gap-4 px-6">
      <h1 className="font-display text-xl font-bold sm:text-2xl">{kata.judul}</h1>
      <p className="font-sans leading-relaxed text-fg-muted">{kata.tagline}</p>
      <p className="font-sans">
        <Link
          href={tujuan}
          className="inline-flex min-h-target items-center rounded font-medium underline decoration-accent underline-offset-4"
        >
          {kata.bukaPapan} →
        </Link>
      </p>
      <p className="font-mono text-xs text-fg-muted">{BASE}/{DEFAULT_LOCALE}/main/</p>
    </div>
  )
}
