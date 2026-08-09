import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GantiBahasa } from '@/components/shell/GantiBahasa'
import { Navigasi } from '@/components/shell/Navigasi'
import { TandaPembuat } from '@/components/shell/TandaPembuat'
import { LOCALES, isLocale, t } from '@/lib/i18n'
import { BASE } from '../layout'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!isLocale(params.locale)) notFound()
  const kata = t(params.locale)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 sm:px-8">
      {/*
        The header stays put while the board scrolls, because on a phone the
        board is taller than the viewport and losing the way out of it means
        scrolling back up through a game in progress.
      */}
      <header className="sticky top-0 z-20 -mx-4 border-b border-mat-edge/70 bg-mat/90 px-4 backdrop-blur-sm sm:-mx-8 sm:px-8">
        {/* Satu baris di layar lebar, dua di ponsel: nama dan pemindah
            bahasa selalu di baris atas, tujuh tujuan membungkus di bawahnya
            alih-alih menggulir keluar layar. */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pb-2 pt-3 sm:pt-4">
          <Link href={`/${params.locale}/main`} className="group flex items-center gap-2.5 rounded-lg">
            {/*
              The mark, at the size the brand rules ask for: below 40px it
              has to be the four-seed form, never seven seeds shrunk down —
              and that is exactly what favicon.svg is, so the tab icon and
              the header mark stay the same file.

              Plain <img>, not next/image: it is a fixed-colour brand mark
              at a fixed size, and images are unoptimized in a static export
              anyway. The path carries the basePath by hand, since nothing
              rewrites a src string.
            */}
            {/* eslint-disable-next-line @next/next/no-img-element -- images are
                unoptimized in a static export, so next/image would add a
                component and change nothing about what ships. */}
            <img
              src={`${BASE}/favicon.svg`}
              alt=""
              width={28}
              height={28}
              // No CSS rounding: the mark draws its own corner radius, and
              // clipping it again only shaves the wood.
              className="h-7 w-7 shrink-0"
            />
            <span className="font-display text-xl font-bold tracking-tight">{kata.judul}</span>
            {/* Nama daerah lain untuk permainan yang sama, bukan pengulangan
                judulnya: congklak di Jawa juga disebut dakon, dan congkak di
                Sumatera dan semenanjung. */}
            <span className="hidden font-mono text-2xs uppercase tracking-[0.18em] text-fg-muted sm:inline">
              dakon · congkak
            </span>
          </Link>
          <span className="order-2 ml-auto sm:order-3 sm:ml-0">
            <GantiBahasa locale={params.locale} />
          </span>
          <Navigasi
            locale={params.locale}
            className="order-3 w-full sm:order-2 sm:ml-auto sm:w-auto"
          />
        </div>
      </header>

      <main className="flex-1 py-6 sm:py-8">{children}</main>

      {/* Satu jahitan saja: garis atas footer ini. Tanda pembuat memakai
          baris bawah yang sudah ada — berseberangan dengan keterangan
          proyek, bukan digabung dengannya, karena yang satu kredit pribadi
          dan yang satu keterangan tentang datanya. */}
      <footer className="mt-8 border-t border-mat-edge/70 py-5">
        <p className="max-w-prose font-sans text-xs leading-relaxed text-fg-muted">
          {kata.tagline}
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <p className="font-mono text-2xs text-fg-muted">
            Aturan adalah data bersumber, bukan kode.
          </p>
          <TandaPembuat />
        </div>
      </footer>
    </div>
  )
}
