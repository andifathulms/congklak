'use client'

import { useMemo, useState } from 'react'
import { compareRulesets, contohLangkah, type CompareResult } from '@/lib/engine/compare'
import { scoreOf } from '@/lib/engine/apply'
import { PLAYER_A, PLAYER_B } from '@/lib/engine/board'
import { RULESETS, getRuleset } from '@/lib/rulesets'
import { createRng } from '@/lib/rng'
import { t, type Locale } from '@/lib/i18n'
import { Papan } from '@/components/board/Papan'
import { Panel } from '@/components/ui/Panel'
import { Tombol } from '@/components/ui/Tombol'

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
      <Panel className="flex flex-wrap items-end gap-3">
        <PilihPack label={`${kata.aturan} 1`} value={kiriId} onChange={setKiriId} />
        <span aria-hidden className="pb-2 font-display text-lg text-fg-muted">
          ↔
        </span>
        <PilihPack label={`${kata.aturan} 2`} value={kananId} onChange={setKananId} />
        <Tombol
          className="ml-auto"
          onClick={() => {
            setSeed((s) => s + 1)
            setLihat(null)
          }}
        >
          {kata.acakUlang}
        </Tombol>
      </Panel>

      {/* Simpang adalah isi halaman ini, jadi ia yang paling berat di layar.
          Bukan brass: brass hanya untuk lubang aktif dan tembakan (§11). */}
      <div
        className={[
          'rounded-panel p-4 ring-1',
          hasil.simpangDi >= 0
            ? 'bg-ink text-mat ring-ink'
            : 'bg-mat-high text-fg shadow-raise ring-mat-edge/60',
        ].join(' ')}
      >
        {hasil.simpangDi >= 0 ? (
          <>
            <p className="tnum font-display text-lg font-bold">
              {kata.simpangDi} {hasil.simpangDi + 1}
            </p>
            {alasanTeks && <p className="font-sans text-sm text-mat">{alasanTeks}</p>}
          </>
        ) : (
          <p className="font-display text-lg">{kata.takAdaSimpang}</p>
        )}
        <p
          className={[
            'mt-2 font-mono text-xs',
            hasil.simpangDi >= 0 ? 'text-mat-edge' : 'text-fg-muted',
          ].join(' ')}
        >
          {kiri.name} · {kiri.options.terminal} / {kiri.options.finalSweep}
          {'   ↔   '}
          {kanan.name} · {kanan.options.terminal} / {kanan.options.finalSweep}
        </p>
      </div>

      {hasil.steps.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-panel bg-mat-high p-3 shadow-raise ring-1 ring-mat-edge/60">
          <span className="tnum whitespace-nowrap font-display text-sm font-medium">
            {kata.giliranKe} {langkahKe + 1}/{hasil.steps.length}
          </span>
          <span className="flex items-center gap-1">
            <Tombol
              bobot="sunyi"
              className="px-3"
              aria-label={`${kata.giliranKe} −1`}
              disabled={langkahKe === 0}
              onClick={() => setLihat(Math.max(0, langkahKe - 1))}
            >
              ←
            </Tombol>
            <Tombol
              bobot="sunyi"
              className="px-3"
              aria-label={`${kata.giliranKe} +1`}
              disabled={langkahKe === hasil.steps.length - 1}
              onClick={() => setLihat(Math.min(hasil.steps.length - 1, langkahKe + 1))}
            >
              →
            </Tombol>
          </span>
          <input
            type="range"
            min={0}
            max={hasil.steps.length - 1}
            value={langkahKe}
            onChange={(e) => setLihat(Number(e.target.value))}
            className="w-full flex-1 accent-teak"
            aria-label={kata.giliranKe}
          />
        </div>
      )}

      {/* Dua papan bertumpuk, tidak berdampingan: papannya lebar, dan
          lubang yang harus dibandingkan itu yang persis di atas-bawahnya. */}
      {step && (
        <div className="flex flex-col gap-5">
          <SisiPapan nama={kiri.name} state={step.kiri} sama={step.sama} kata={kata} />
          <SisiPapan nama={kanan.name} state={step.kanan} sama={step.sama} kata={kata} />
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
    <label className="flex flex-col gap-1 font-sans text-sm">
      <span className="text-2xs uppercase tracking-[0.14em] text-fg-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full bg-mat-low px-3 py-1.5 font-sans text-sm text-fg ring-1 ring-inset ring-mat-edge"
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
          // Penanda simpang memakai tinta pekat, bukan brass — brass tetap
          // milik lubang aktif dan tembakan saja (PRD §11).
          <span className="rounded-full bg-ink px-2 py-0.5 font-sans text-xs font-medium text-mat">
            {kata.berbeda}
          </span>
        )}
      </h2>
      {state === null ? (
        <p className="rounded-panel bg-mat-low/60 p-6 font-sans text-sm text-fg-muted ring-1 ring-inset ring-mat-edge">
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
        </>
      )}
    </div>
  )
}
