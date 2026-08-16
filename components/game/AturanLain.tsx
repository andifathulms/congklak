'use client'

import { useMemo } from 'react'
import { compareRulesets } from '@/lib/engine/compare'
import type { GameRecord } from '@/lib/engine/replay'
import { RULESETS, type Ruleset } from '@/lib/rulesets'
import { t, type Locale } from '@/lib/i18n'
import { Panel } from '@/components/ui/Panel'

/**
 * The game you just played, replayed under every other ruleset.
 *
 * The sources page argues in general that the readings disagree. This
 * answers the same question about the one game the player actually cares
 * about, at the moment they care most — the screen has just told them they
 * won, and this says whether that was true under only one reading of the
 * rules.
 *
 * A game is its move list plus a ruleset id, and the engine is pure, so
 * this costs one replay per pack and needs nothing stored.
 *
 * It reports no alternative score, deliberately. The comparison stops at
 * the first divergence, and past that point the same move list is not the
 * same game any more — a "you would have lost 44–54" would be a number
 * traceable to nothing. Where the readings part, and how, is provable.
 */

/**
 * Whether any other pack would have parted ways with this move list at
 * all — the same check the component below makes to decide whether it has
 * anything to say, exposed standalone so the phase gate (DESIGN.md §5,
 * `setelah`/`selesai`) can decide *before* mounting whether this panel is
 * one of the wilayah in play, without duplicating the component itself.
 */
export function adaSimpang(moves: readonly number[], aktif: Ruleset): boolean {
  return RULESETS.some(
    (lain) => lain.id !== aktif.id && compareRulesets(moves, aktif, lain).simpangDi >= 0,
  )
}

export function AturanLain({
  record,
  aktif,
  locale,
}: {
  record: GameRecord
  aktif: Ruleset
  locale: Locale
}) {
  const kata = t(locale)

  const hasil = useMemo(
    () =>
      RULESETS.filter((r) => r.id !== aktif.id).map((lain) => ({
        lain,
        banding: compareRulesets(record.moves, aktif, lain),
      })),
    [record.moves, aktif],
  )

  // "If no pack diverged, it does not appear at all" (DESIGN.md §5) — not
  // rendered and left to show every reading agreeing, which used to be the
  // only outcome here whenever nothing had actually diverged.
  const punyaSimpang = hasil.some(({ banding }) => banding.simpangDi >= 0)
  if (record.moves.length === 0 || !punyaSimpang) return null

  return (
    <Panel judul={kata.aturanLainJudul}>
      <ul className="flex flex-col gap-2">
        {hasil.map(({ lain, banding }) => {
          const sama = banding.simpangDi < 0
          const alasan =
            banding.alasan === 'papan-berbeda'
              ? kata.alasanRingkasPapan
              : banding.alasan === 'satu-sudah-selesai'
                ? kata.alasanRingkasSelesai
                : kata.alasanRingkasTakSah

          return (
            <li key={lain.id} className="flex flex-wrap items-baseline gap-x-1.5">
              <span
                aria-hidden
                className={[
                  'mr-0.5 h-1.5 w-1.5 shrink-0 translate-y-[-0.1em] rounded-full',
                  sama ? 'bg-fg-muted/40' : 'bg-teak',
                ].join(' ')}
              />
              <span className="font-sans font-medium">{lain.name}</span>
              <span className="tnum font-sans text-fg-muted">
                {sama
                  ? kata.aturanLainSama
                  : kata.aturanLainBeda
                      .replace('{n}', String(banding.simpangDi + 1))
                      .replace('{alasan}', alasan)}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 max-w-prose font-sans text-xs leading-relaxed text-fg-muted">
        {kata.aturanLainCatatan}
      </p>
    </Panel>
  )
}
