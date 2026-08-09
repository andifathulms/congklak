'use client'

import { useCallback, useMemo, useState } from 'react'
import { scoreOf } from '@/lib/engine/apply'
import { PLAYER_A, PLAYER_B } from '@/lib/engine/board'
import { decodeRecord, replay, type ReplayResult } from '@/lib/engine/replay'
import { describeEvent } from '@/lib/engine/events'
import { getRuleset } from '@/lib/rulesets'
import { t, type Locale } from '@/lib/i18n'
import { Papan } from '@/components/board/Papan'
import { Panel } from '@/components/ui/Panel'
import { Tombol } from '@/components/ui/Tombol'

/**
 * Replay viewer (PRD §8.5). A game is a move list plus a ruleset id, so
 * a short code is all it takes to step through any game move by move —
 * no stored states, nothing to keep in sync.
 */
export function Ulang({ locale, kodeAwal }: { locale: Locale; kodeAwal?: string }) {
  const kata = t(locale)
  const [kode, setKode] = useState(kodeAwal ?? '')
  const [dimuat, setDimuat] = useState<string | null>(kodeAwal ?? null)

  const hasil = useMemo((): { ok: ReplayResult; rulesetId: string } | { error: string } | null => {
    if (!dimuat) return null
    try {
      const record = decodeRecord(dimuat)
      const ruleset = getRuleset(record.rulesetId)
      return { ok: replay(record, ruleset), rulesetId: record.rulesetId }
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) }
    }
  }, [dimuat])

  const [at, setAt] = useState(0)
  const muat = useCallback(() => {
    setDimuat(kode.trim())
    setAt(0)
  }, [kode])

  const steps = hasil && 'ok' in hasil ? hasil.ok.steps : []
  const state = at === 0 ? (hasil && 'ok' in hasil ? hasil.ok.initial : null) : steps[at - 1]?.state
  const events = at === 0 ? [] : (steps[at - 1]?.events ?? [])

  return (
    <div className="flex flex-col gap-5">
      <Panel judul={kata.kodePermainan}>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={kode}
            onChange={(e) => setKode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && muat()}
            placeholder="umum.0.0362…"
            aria-label={kata.kodePermainan}
            className="min-w-64 flex-1 rounded-full bg-mat-low px-4 py-2 font-mono text-sm text-fg ring-1 ring-inset ring-mat-edge placeholder:text-fg-muted"
          />
          <Tombol bobot="utama" onClick={muat}>
            {kata.muatKode}
          </Tombol>
        </div>
      </Panel>

      {hasil && 'error' in hasil && (
        <p className="rounded-panel bg-brass/15 p-3 font-sans text-sm ring-1 ring-inset ring-brass/40">
          {kata.kodeTakValid} <span className="font-mono text-xs text-fg-muted">{hasil.error}</span>
        </p>
      )}

      {hasil && 'ok' in hasil && state && (
        <>
          {/* Melangkah satu per satu harus mungkin tanpa menyeret apa pun:
              penggeser saja tidak cukup untuk papan tik atau untuk jempol. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-panel bg-mat-high p-3 shadow-raise ring-1 ring-mat-edge/60">
            <span className="font-mono text-xs text-fg-muted">
              {getRuleset(hasil.rulesetId).name}
            </span>
            <span className="tnum font-display text-sm font-medium">
              {kata.langkah} {at}/{steps.length}
            </span>
            <span className="flex items-center gap-1">
              <Tombol
                bobot="sunyi"
                onClick={() => setAt((v) => Math.max(0, v - 1))}
                disabled={at === 0}
                aria-label={`${kata.langkah} −1`}
                className="px-3"
              >
                ←
              </Tombol>
              <Tombol
                bobot="sunyi"
                onClick={() => setAt((v) => Math.min(steps.length, v + 1))}
                disabled={at === steps.length}
                aria-label={`${kata.langkah} +1`}
                className="px-3"
              >
                →
              </Tombol>
            </span>
            <input
              type="range"
              min={0}
              max={steps.length}
              value={at}
              onChange={(e) => setAt(Number(e.target.value))}
              className="w-full flex-1 accent-teak"
              aria-label={kata.langkah}
            />
          </div>

          <Papan
          locale={locale}
            cells={Array.from(state.board)}
            active={null}
            secondary={null}
            playable={[]}
            previewed={null}
            namaA={`${kata.pemain} A`}
            namaB={`${kata.pemain} B`}
          />

          <p className="flex flex-wrap items-baseline gap-x-3 font-sans text-sm text-fg">
            <span className="tnum font-display text-lg font-bold text-fg">
              {scoreOf(state.board, PLAYER_A)}–{scoreOf(state.board, PLAYER_B)}
            </span>
            <span className="text-fg-muted">{kata.skor}</span>
            {state.status === 'selesai' && (
              <span className="font-medium text-fg">
                {state.hasil === 'seri'
                  ? kata.seri
                  : `${kata.pemain} ${state.hasil === 'a' ? 'A' : 'B'} ${kata.menang}`}
              </span>
            )}
          </p>

          {events.length > 0 && (
            <Panel judul={kata.riwayat}>
              <ol className="flex max-h-40 flex-col gap-1 overflow-y-auto">
                {events.map((event, i) => (
                  <li
                    key={i}
                    className="border-l-2 border-teak/25 pl-2.5 font-sans text-sm leading-snug text-fg"
                  >
                    {describeEvent(event)}
                  </li>
                ))}
              </ol>
            </Panel>
          )}
        </>
      )}
    </div>
  )
}
