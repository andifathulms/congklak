import type { MetadataRoute } from 'next'
import { BASE } from './dasar'

const ASAL = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? 'https://andifathulms.github.io'

/**
 * Nothing here is private and nothing is behind a query string, so the
 * whole site is open. Its only real job is naming the sitemap — the site
 * lives on a path of a shared origin, so a crawler has no way to guess it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${ASAL}${BASE}/sitemap.xml`,
  }
}
