import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from 'next/font/google'
import './globals.css'

/**
 * The three typefaces PRD §11 asks for, actually loaded.
 *
 * They were named in `globals.css` as CSS variables from the start but no
 * font was ever fetched or declared, so every one of them silently fell
 * through to `ui-sans-serif` — the whole app rendered in the system UI
 * face. `next/font` self-hosts them into the static export, so there is no
 * runtime request and no layout shift.
 *
 * Space Grotesk carries the counts: seeds per hole, seeds banked, scores.
 * Counts are the content here, so the display face is a numeral face
 * first and a heading face second.
 */
const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

/** Citations and connection codes — PRD §11. */
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Lumbung — congklak dengan aturan yang bersumber',
  description:
    'Congklak / dakon dengan ruleset kedaerahan yang eksplisit, bersumber, dan bisa dipilih.',
}

export const viewport: Viewport = {
  themeColor: '#E4DDCD',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  )
}
