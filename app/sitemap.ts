import type { MetadataRoute } from 'next'
import { LOCALES } from '@/lib/i18n'
import { SEGMEN, alamatSemuaBahasa } from '@/lib/halaman'
import { BASE } from './dasar'

const ASAL = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? 'https://andifathulms.github.io'

/**
 * Every page, in every language, from the same route table the pages and
 * their metadata come from. Nothing here is a hand-kept list, so a new
 * route cannot be added and forgotten.
 *
 * Absolute URLs by hand rather than through metadataBase: a sitemap is a
 * file a crawler fetches on its own, not a tag resolved against a page.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const akar = `${ASAL}${BASE}`
  return SEGMEN.flatMap((segmen) => {
    const bahasa = alamatSemuaBahasa(segmen)
    return LOCALES.map((locale) => ({
      url: `${akar}/${bahasa[locale]}`,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [l, `${akar}/${bahasa[l]}`]),
        ),
      },
      // Papan adalah pintu masuknya; sisanya sama pentingnya satu sama lain.
      priority: segmen === 'main' ? 1 : 0.7,
    }))
  })
}
