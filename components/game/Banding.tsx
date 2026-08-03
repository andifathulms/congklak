'use client'

import { useMemo, useState } from 'react'
import { compareRulesets, contohLangkah, type CompareResult } from '@/lib/engine/compare'
import { scoreOf } from '@/lib/engine/apply'
import { PLAYER_A, PLAYER_B } from '@/lib/engine/board'
import { RULESETS, getRuleset } from '@/lib/rulesets'
import { createRng } from '@/lib/rng'
import { t, type Locale } from '@/lib/i18n'
import { Papan } from '@/components/board/Papan'

/**
 * Replay one move list under two rulesets and mark the first divergence
 * (PRD §8.3). Two packs that claim to differ have to show it on a board.
 */
export function Banding({ locale }: { locale: Locale }) {
  const kata = t(locale)

  const [kiriId, setKiriId] = useState(RULESETS[0].id)
  const [kananId, setKananId] = useState(RULESETS[RULESETS.length - 1].id)
  const [seed, setSeed] = useState(11)

  const kiri = getRuleset(kiriId)
  const kanan = getRuleset(kananId)

  const hasil: CompareResult = useMemo(() => {
    // Daftar langkah dibuat di bawah ruleset kiri, lalu diputar di
    // keduanya. Berbenih, jadi perbandingan yang sama bisa diulang.
    const rng = createRng(seed)
    const moves = contohLangkah(kiri, (n) => rng.next(n))
    return compareRulesets(moves, kiri, kanan)
  }, [kiri, kanan, seed])

  const [lihat, setLihat] = useState<number | null>(null)
  const langkahKe = lihat ?? (hasil.simpangDi >= 0 ? hasil.simpangDi : hasil.steps.length - 1)
  const step = hasil.steps[langkahKe]

  const alasanTeks =
    hasil.alasan === 'papan-berbeda'
      ? kata.alasanPapan
      : hasil.alasan === 'satu-sudah-selesai'
        ? kata.alasanSelesai
        : hasil.alasan === 'langkah-tak-sah-di-satu-sisi'
          ? kata.alasanTakSah
          : null

  return (
    <div className="flex flex-col gap-5">
      <p className="max-w-prose font-sans text-sm text-ink/70">{kata.bandingIntro}</p>

      <div className="flex flex-wrap items-center gap-3">
        <PilihPack label="A" value={kiriId} onChange={setKiriId} />
        <PilihPack label="B" value={kananId} onChange={setKananId} />
        <button
          type="button"
          onClick={() => {
            setSeed((s) => s + 1)
            setLihat(null)
          }}
          className="rounded-full border border-teak/40 px-4 py-1.5 font-sans text-sm transition hover:bg-teak/10"
        >
          {kata.acakUlang}
        </button>
      </div>

      <div className="rounded-2xl border border-teak/20 bg-mat/60 p-4">
        {hasil.simpangDi >= 0 ? (
          <>
            <p className="font-display text-lg font-bold">
              {kata.simpangDi} {hasil.simpangDi + 1}
            </p>
            {alasanTeks && <p className="font-sans text-sm text-ink/70">{alasanTeks}</p>}
          </>
        ) : (
          <p className="font-display text-lg">{kata.takAdaSimpang}</p>
        )}
        <p className="mt-1 font-mono text-xs text-ink/45">
          {kiri.name} · {kiri.options.terminal} / {kiri.options.finalSweep}
          {'   ↔   '}
          {kanan.name} · {kanan.options.terminal} / {kanan.options.finalSweep}
        </p>
      </div>

      {hasil.steps.length > 0 && (
        <label className="flex items-center gap-3 font-sans text-sm">
          <span className="whitespace-nowrap text-ink/60">
            {kata.giliranKe} {langkahKe + 1}/{hasil.steps.length}
          </span>
          <input
            type="range"
            min={0}
            max={hasil.steps.length - 1}
            value={langkahKe}
            onChange={(e) => setLihat(Number(e.target.value))}
            className="w-full accent-brass"
            aria-label={kata.giliranKe}
          />
        </label>
      )}

      {step && (
        <div className="grid gap-5 lg:grid-cols-2">
          <SisiPapan
            nama={kiri.name}
            state={step.kiri}
            sama={step.sama}
            kata={kata}
          />
          <SisiPapan
            nama={kanan.name}
            state={step.kanan}
            sama={step.sama}
            kata={kata}
          />
        </div>
      )}
    </div>
  )
}

function PilihPack({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (id: string) => void
}) {
  return (
    <label className="flex items-center gap-2 font-sans text-sm">
      <span className="text-ink/50">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full border border-teak/40 bg-mat px-3 py-1.5 font-sans text-sm"
      >
        {RULESETS.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </label>
  )
}

function SisiPapan({
  nama,
  state,
  sama,
  kata,
}: {
  nama: string
  state: ReturnType<typeof compareRulesets>['steps'][number]['kiri']
  sama: boolean
  kata: ReturnType<typeof t>
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="flex items-baseline gap-2 font-display text-base font-bold">
        {nama}
        {!sama && (
          // brass menandai simpang, sejalan dengan pemakaiannya di papan.
          <span className="rounded-full bg-brass/25 px-2 py-0.5 font-sans text-xs">
            {kata.simpangDi.toLowerCase()}
          </span>
        )}
      </h2>
      {state === null ? (
        <p className="rounded-2xl border border-teak/20 p-6 font-sans text-sm text-ink/55">
          {kata.alasanTakSah}
        </p>
      ) : (
        <>
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
              <span className="ml-2 text-ink/50">
                {state.hasil === 'seri'
                  ? kata.seri
                  : `${kata.pemain} ${state.hasil === 'a' ? 'A' : 'B'} ${kata.menang}`}
              </span>
            )}
          </p>
        </>
      )}
    </div>
  )
}
