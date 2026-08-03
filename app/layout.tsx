import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lumbung — congklak dengan aturan yang bersumber',
  description:
    'Congklak / dakon dengan ruleset kedaerahan yang eksplisit, bersumber, dan bisa dipilih.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  )
}
