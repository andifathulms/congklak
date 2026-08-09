'use client'

import { useEffect, useState } from 'react'
import { setSuaraAktif, suaraAktif } from './suara'
import { t, type Locale } from '@/lib/i18n'

/**
 * Sound on or off, remembered.
 *
 * Read after mount rather than during render: the preference lives in
 * localStorage, and reading it while rendering would make the server's HTML
 * and the first client render disagree. Until it is read the button shows
 * the default, which is the state the audio layer is actually in.
 */
export function TombolSuara({ locale }: { locale: Locale }) {
  const kata = t(locale)
  const [hidup, setHidup] = useState(true)

  useEffect(() => setHidup(suaraAktif()), [])

  return (
    <button
      type="button"
      onClick={() => {
        const next = !hidup
        setHidup(next)
        setSuaraAktif(next)
      }}
      aria-pressed={hidup}
      aria-label={hidup ? kata.suaraHidup : kata.suaraMati}
      title={hidup ? kata.suaraHidup : kata.suaraMati}
      className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 font-sans text-xs text-fg-muted transition hover:bg-mat-high hover:text-fg"
    >
      <Ikon hidup={hidup} />
      <span className="hidden sm:inline">{kata.suara}</span>
    </button>
  )
}

function Ikon({ hidup }: { hidup: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4Z" />
      {hidup ? (
        <>
          <path d="M15.8 9.2a4 4 0 0 1 0 5.6" />
          <path d="M18.4 6.6a7.6 7.6 0 0 1 0 10.8" />
        </>
      ) : (
        // Dicoret, bukan sekadar tanpa gelombang: keadaan mati harus terbaca
        // sendiri, bukan hanya sebagai ketiadaan sesuatu.
        <path d="m16.5 10 5 5m0-5-5 5" />
      )}
    </svg>
  )
}
