import { LOCALES, t, type Locale } from './i18n'

/**
 * One table of what each page is, read by both the page and its metadata.
 *
 * Every route shipped the same title and the same description — all
 * fourteen of them, including the English half, which was described in
 * Indonesian. The seven pages were indistinguishable in a search result and
 * in every shared link.
 *
 * The fix is not to write fourteen more strings. A description that drifts
 * from its page is worse than none, so the title and description *are* the
 * heading and the opening paragraph the page renders — the same i18n
 * entries, resolved here once. Changing the page copy changes the metadata,
 * because they are the same string.
 */
export const SEGMEN = ['main', 'belajar', 'teka', 'aturan', 'banding', 'tanding', 'ulang'] as const
export type Segmen = (typeof SEGMEN)[number]

type Kata = ReturnType<typeof t>

interface Halaman {
  readonly judul: (kata: Kata) => string
  readonly ringkas: (kata: Kata) => string
}

export const HALAMAN: Record<Segmen, Halaman> = {
  main: { judul: (k) => k.beranda, ringkas: (k) => k.berandaIntro },
  belajar: { judul: (k) => k.belajar, ringkas: (k) => k.belajarIntro },
  teka: { judul: (k) => k.teka, ringkas: (k) => k.tekaIntro },
  aturan: { judul: (k) => k.aturan, ringkas: (k) => k.aturanIntro },
  banding: { judul: (k) => k.banding, ringkas: (k) => k.bandingIntro },
  tanding: { judul: (k) => k.tanding, ringkas: (k) => k.tandingIntro },
  ulang: { judul: (k) => k.ulang, ringkas: (k) => k.ulangIntro },
}

export function judulHalaman(locale: Locale, segmen: Segmen): string {
  return HALAMAN[segmen].judul(t(locale))
}

/**
 * The page's own opening paragraph, cut to a length a search result will
 * actually show — at a word boundary, never mid-word. Shortening is not
 * drifting: it is the same sentence, and the page carries it in full.
 */
export function ringkasHalaman(locale: Locale, segmen: Segmen, maks = 155): string {
  const penuh = HALAMAN[segmen].ringkas(t(locale))
  if (penuh.length <= maks) return penuh
  const potong = penuh.slice(0, maks)
  const spasi = potong.lastIndexOf(' ')
  return `${potong.slice(0, spasi > 0 ? spasi : maks).replace(/[,;:—-]$/, '')}…`
}

/** Setiap alamat kanonik untuk satu halaman, per bahasa. */
export function alamatSemuaBahasa(segmen: Segmen): Record<Locale, string> {
  const out = {} as Record<Locale, string>
  for (const l of LOCALES) out[l] = `${l}/${segmen}/`
  return out
}
