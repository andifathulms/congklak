'use client'

import { useCallback, useMemo, useState } from 'react'
import { scoreOf } from '@/lib/engine/apply'
import { PLAYER_A, PLAYER_B } from '@/lib/engine/board'
import { decodeRecord, replay, type ReplayResult } from '@/lib/engine/replay'
import { describeEvent } from '@/lib/engine/events'
import { getRuleset } from '@/lib/rulesets'
import { t, type Locale } from '@/lib/i18n'
import { Papan } from '@/components/board/Papan'

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
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={kode}
          onChange={(e) => setKode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && muat()}
          placeholder="umum.0.0362..."
          aria-label={kata.kodePermainan}
          className="min-w-64 flex-1 rounded-full border border-teak/40 bg-mat px-4 py-2 font-mono text-sm"
        />
        <button
          type="button"
          onClick={muat}
          className="rounded-full bg-teak px-4 py-2 font-sans text-sm text-seedA transition hover:brightness-110"
        >
          {kata.muatKode}
        </button>
      </div>

      {hasil && 'error' in hasil && (
        <p className="rounded-2xl border border-brass/50 bg-brass/10 p-3 font-sans text-sm">
          {kata.kodeTakValid} <span className="font-mono text-xs text-ink/60">{hasil.error}</span>
        </p>
      )}

      {hasil && 'ok' in hasil && state && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs text-ink/50">
              {getRuleset(hasil.rulesetId).name}
            </span>
            <span className="font-sans text-sm text-ink/60">
              {kata.langkah} {at}/{steps.length}
            </span>
            <input
              type="range"
              min={0}
              max={steps.length}
              value={at}
              onChange={(e) => setAt(Number(e.target.value))}
              className="w-full max-w-md accent-brass"
              aria-label={kata.langkah}
            />
          </div>

          <Papan
            cells={Array.from(state.board)}
            active={null}
            secondary={null}
            playable={[]}
            previewed={null}
            namaA={`${kata.pemain} A`}
            namaB={`${kata.pemain} B`}
          />

          <p className="tnum font-sans text-sm text-ink/70">
            {kata.skor} {scoreOf(state.board, PLAYER_A)}–{scoreOf(state.board, PLAYER_B)}
            {state.status === 'selesai' && (
              <span className="ml-2 font-medium">
                {state.hasil === 'seri'
                  ? kata.seri
                  : `${kata.pemain} ${state.hasil === 'a' ? 'A' : 'B'} ${kata.menang}`}
              </span>
            )}
          </p>

          {events.length > 0 && (
            <ol className="max-h-40 overflow-y-auto rounded-2xl border border-teak/20 p-3">
              {events.map((event, i) => (
                <li key={i} className="font-sans text-sm text-ink/75">
                  {describeEvent(event)}
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  )
}
