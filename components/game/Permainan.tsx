'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { applyMove, createGame, currentLegalMoves, type GameState } from '@/lib/engine/apply'
import { PLAYER_A, PLAYER_B } from '@/lib/engine/board'
import { Biji, TumpukanBiji } from '@/components/board/Biji'
import {
  encodeRecord,
  emptyRecord,
  replay,
  withMove,
  withoutLastMove,
  type GameRecord,
} from '@/lib/engine/replay'
import type { Kesulitan } from '@/lib/ai/search'
import { RULESETS, getRuleset, type Ruleset } from '@/lib/rulesets'
import { t, type Locale } from '@/lib/i18n'
import { Papan } from '@/components/board/Papan'
import { KECEPATAN, usePenaburan, type Kecepatan } from '@/components/sow/usePenaburan'
import { TombolSuara } from '@/components/sow/TombolSuara'
import { pratinjauTeks, ringkasPratinjau } from '@/components/preview/ringkas'
import {
  pratinjauSimpang,
  BATAS_TAMPIL_SIMPANG,
  type SimpangPratinjau,
} from '@/components/preview/simpang'
import { describeEvent, describeHenti } from '@/lib/engine/events'
import { Panel } from '@/components/ui/Panel'
import { Salin } from '@/components/ui/Salin'
import { Segmen } from '@/components/ui/Segmen'
import { Tombol } from '@/components/ui/Tombol'
import { Lencana } from '@/components/ui/Lencana'
import { phaseOf, wilayahDi } from '@/lib/phase'
import { AturanLain, adaSimpang } from './AturanLain'
import { aturanUntukOpsi, sumberUntukOpsi } from './rujukan'
import { PemilihAturan } from './PemilihAturan'
import { Skor } from './Skor'
import { useAi } from './useAi'
import { bacaStatistik, catatHasil, dariRekaman, type Statistik } from './stats'

export type Mode = 'hotseat' | 'ai'

const KESULITAN: readonly Kesulitan[] = ['mudah', 'sedang', 'sulit']

/**
 * The board. Hotseat, or against the AI.
 *
 * The move list is the game (invariant 11). State is held alongside it as
 * a cache, and undo replays a shorter list rather than unwinding anything.
 */
export function Permainan({ ruleset: awal, locale }: { ruleset: Ruleset; locale: Locale }) {
  const kata = t(locale)

  const [ruleset, setRuleset] = useState<Ruleset>(awal)
  const [mode, setMode] = useState<Mode>('hotseat')
  const [kesulitan, setKesulitan] = useState<Kesulitan>('sedang')
  const [record, setRecord] = useState<GameRecord>(() => emptyRecord(ruleset.id))
  const [state, setState] = useState<GameState>(() => createGame())
  const [kecepatan, setKecepatan] = useState<Kecepatan>('sedang')
  const [busy, setBusy] = useState(false)
  const [previewed, setPreviewed] = useState<number | null>(null)
  const [berpikir, setBerpikir] = useState(false)
  /**
   * Dinaikkan sesudah statistik ditulis. Panel statistik adalah anak, dan
   * efek anak berjalan sebelum efek induk — tanpa penanda ini panel
   * membaca localStorage tepat sebelum hasil permainan ditulis ke sana,
   * lalu tidak pernah membaca lagi, jadi statistik tidak pernah muncul.
   */
  const [statVersi, setStatVersi] = useState(0)
  /**
   * Apa yang terjadi pada giliran barusan, diumumkan sekali.
   *
   * Sebelumnya panel riwayat sendiri yang jadi wilayah live, jadi tiap baris
   * baru memicu pembacaan: satu giliran menghasilkan 43 pengumuman, delapan
   * belas di antaranya hitungan mundur biji di tangan. Ringkasan tertulis
   * memang jalur akses utamanya (PRD §8.1) — yang salah adalah menyiarkannya
   * baris demi baris, bukan sekali saat gilirannya selesai.
   *
   * Baris per biji dibuang; yang tersisa adalah peristiwa yang menentukan —
   * angkat, sambung, tembak, giliran lagi, alasan berhenti, sapu, selesai —
   * lalu skornya. Semuanya kalimat yang sudah ada, tidak ada klaim baru.
   */
  const [umumkan, setUmumkan] = useState('')

  const player = usePenaburan(state.board, kecepatan)

  /**
   * Fokus sesudah giliran.
   *
   * Lubang yang baru ditekan langsung menjadi disabled — bukan gilirannya
   * lagi — dan peramban membuang fokus dari elemen disabled ke <body>. Jadi
   * tiap giliran, pemain papan tik terlempar kembali ke puncak dokumen dan
   * harus menekan Tab sembilan kali untuk kembali ke papan.
   *
   * Yang dikembalikan adalah papannya, bukan sebuah lubang: dari sana satu
   * Tab masuk ke lubang pertama yang bisa ditabur, dan tidak ada tebakan
   * soal lubang mana yang "seharusnya" dipilih berikutnya.
   *
   * Hanya dikembalikan kalau fokusnya memang hilang karena kita sendiri —
   * pemain yang sengaja pindah ke kendali lain tidak boleh direbut fokusnya.
   */
  const papanRef = useRef<HTMLDivElement>(null)
  const fokusDiPapan = useRef(false)

  const kembalikanFokus = useCallback(() => {
    if (!fokusDiPapan.current) return
    fokusDiPapan.current = false
    const aktif = document.activeElement
    if (aktif && aktif !== document.body) return
    papanRef.current?.focus()
  }, [])
  const { pikirkan } = useAi(ruleset.id)

  // AI selalu pemain B, supaya sisi manusia tetap di baris bawah.
  const giliranAi = mode === 'ai' && state.toMove === PLAYER_B && state.status === 'berjalan'

  const legal = useMemo(() => currentLegalMoves(state), [state])
  const playable = busy || giliranAi || state.status === 'selesai' ? [] : legal

  const jalankan = useCallback(
    (hole: number) => {
      const { state: next, events } = applyMove(state, hole, ruleset)
      // Dicatat sebelum papan berubah: sesudahnya elemen yang tadi fokus
      // sudah tidak ada di dokumen untuk ditanyai.
      fokusDiPapan.current = papanRef.current?.contains(document.activeElement) ?? false
      setBusy(true)
      setPreviewed(null)
      player.play(state.board, events, () => {
        setState(next)
        setRecord((r) => withMove(r, hole))
        setBusy(false)
        kembalikanFokus()
        const penting = events
          .filter((e) => e.type !== 'sow' && e.type !== 'bank')
          .map(describeEvent)
        setUmumkan(
          `${penting.join(' ')} ${kata.skor} ${next.board[7]}–${next.board[15]}.`,
        )
      })
    },
    [state, ruleset, player, kembalikanFokus, kata.skor],
  )

  const pilih = useCallback(
    (hole: number) => {
      if (busy || giliranAi || state.status === 'selesai') return
      jalankan(hole)
    },
    [busy, giliranAi, state.status, jalankan],
  )

  /**
   * Giliran AI. Pencarian berjalan di worker, jadi utas utama tetap bebas
   * dan animasi giliran sebelumnya tidak tersendat.
   *
   * Efek ini hanya boleh bergantung pada hal yang berubah sekali per
   * giliran. usePenaburan mengembalikan objek baru tiap render, jadi
   * `jalankan` ikut berganti identitas tiap bingkai animasi; kalau efek
   * ini bergantung padanya, tiap bingkai membatalkan pencarian yang
   * sedang jalan dan memulai yang baru — dan pada kecepatan animasi apa
   * pun AI tidak pernah sempat selesai berpikir. Karena itu semuanya
   * lewat ref, dan pemicunya adalah nomor giliran.
   */
  const aiRef = useRef(0)
  const jalankanRef = useRef(jalankan)
  const stateRef = useRef(state)
  const pikirkanRef = useRef(pikirkan)
  useEffect(() => {
    jalankanRef.current = jalankan
    stateRef.current = state
    pikirkanRef.current = pikirkan
  })

  useEffect(() => {
    if (!giliranAi || busy) {
      setBerpikir(false)
      return
    }
    let batal = false
    const token = ++aiRef.current
    const posisi = stateRef.current
    setBerpikir(true)

    pikirkanRef
      .current(posisi, kesulitan, posisi.moveCount * 31 + 7)
      .then((response) => {
        if (batal || token !== aiRef.current) return
        setBerpikir(false)
        jalankanRef.current(response.move)
      })
      .catch(() => {
        if (batal || token !== aiRef.current) return
        setBerpikir(false)
        // Kalau worker gagal, papan tidak boleh menggantung: mainkan
        // langkah sah pertama daripada membekukan permainan.
        const fallback = currentLegalMoves(stateRef.current)[0]
        if (fallback !== undefined) jalankanRef.current(fallback)
      })

    return () => {
      batal = true
    }
  }, [giliranAi, busy, kesulitan, state.moveCount])

  const baru = useCallback(() => {
    aiRef.current++
    const fresh = createGame()
    setRecord(emptyRecord(ruleset.id))
    setState(fresh)
    setBusy(false)
    setBerpikir(false)
    player.reset(fresh.board)
  }, [ruleset.id, player])

  const urung = useCallback(() => {
    if (busy || record.moves.length === 0) return
    aiRef.current++
    // Lawan AI, urungkan sampai giliran manusia lagi — kalau tidak, AI
    // langsung menjawab dan tidak ada yang berubah bagi pemain.
    let shorter = withoutLastMove(record)
    let hasil = replay(shorter, ruleset)
    while (mode === 'ai' && shorter.moves.length > 0 && hasil.final.toMove === PLAYER_B) {
      shorter = withoutLastMove(shorter)
      hasil = replay(shorter, ruleset)
    }
    setRecord(shorter)
    setState(hasil.final)
    setBerpikir(false)
    player.reset(hasil.final.board)
  }, [busy, record, ruleset, player, mode])

  const gantiMode = useCallback(
    (next: Mode) => {
      setMode(next)
      aiRef.current++
      const fresh = createGame()
      setRecord(emptyRecord(ruleset.id))
      setState(fresh)
      setBusy(false)
      setBerpikir(false)
      player.reset(fresh.board)
    },
    [ruleset.id, player],
  )

  const gantiAturan = useCallback(
    (id: string) => {
      // Aturan hanya boleh berganti di antara permainan. Mengganti di
      // tengah jalan akan membuat daftar langkah tidak lagi cocok dengan
      // ruleset-nya, dan daftar langkah plus id itulah permainannya.
      if (busy || record.moves.length > 0) return
      const next = getRuleset(id)
      aiRef.current++
      const fresh = createGame()
      setRuleset(next)
      setRecord(emptyRecord(next.id))
      setState(fresh)
      setBusy(false)
      setBerpikir(false)
      player.reset(fresh.board)
    },
    [busy, record.moves.length, player],
  )

  // Statistik dicatat sekali per permainan selesai, dari aliran event yang
  // memang sudah ada — tidak ada yang dilacak selama bermain.
  const dicatat = useRef<string | null>(null)
  useEffect(() => {
    if (state.status !== 'selesai' || state.hasil === null || busy) return
    const kunci = `${ruleset.id}:${record.moves.join('')}`
    if (dicatat.current === kunci) return
    dicatat.current = kunci

    const { steps } = replay(record, ruleset)
    const { bankTerbesar, sambungTerpanjang } = dariRekaman(steps)
    catatHasil({ rulesetId: ruleset.id, hasil: state.hasil, bankTerbesar, sambungTerpanjang })
    setStatVersi((v) => v + 1)
  }, [state.status, state.hasil, busy, record, ruleset])

  const pratinjau = useMemo(() => {
    if (previewed === null || busy || giliranAi) return null
    return ringkasPratinjau(state, previewed, ruleset)
  }, [previewed, busy, giliranAi, state, ruleset])

  // Simpang untuk langkah yang sedang dipertimbangkan — sama syaratnya
  // dengan pratinjau di atas, jadi keduanya tampil dan hilang bersamaan.
  // Diam kalau tidak ada pack yang benar-benar berbeda di sini (DESIGN.md
  // §4.3): itu bedanya dengan AturanLain, yang bicara sesudah giliran usai.
  const simpang = useMemo(() => {
    if (previewed === null || busy || giliranAi) return null
    return pratinjauSimpang(state, previewed, ruleset)
  }, [previewed, busy, giliranAi, state, ruleset])
  const simpangTampil = simpang?.berbeda.slice(0, BATAS_TAMPIL_SIMPANG) ?? []
  const simpangLebih = (simpang?.berbeda.length ?? 0) - simpangTampil.length
  const simpangHoles = Array.from(
    new Set(
      simpangTampil
        .map((s) => s.pratinjau?.berhentiDi)
        .filter((n): n is number => n !== undefined),
    ),
  )

  const frame = player.frame
  const skorA = frame.cells[7]
  const skorB = frame.cells[15]

  const namaA = `${kata.pemain} A`
  const namaB = mode === 'ai' ? kata.ai : `${kata.pemain} B`

  // Ajakan yang tidak bergantung pada tetikus. Petunjuk lama berbunyi
  // "arahkan ke lubangmu" — tidak ada artinya di layar sentuh, yaitu di
  // perangkat tempat kebanyakan orang membuka ini.
  const ajakan =
    state.status === 'selesai'
      ? null
      : busy
        ? null
        : giliranAi
          ? kata.giliranLawanAjakan
          : kata.giliranmuAjakan

  // Fase layar (DESIGN.md §5), dihitung ulang tiap render dari state yang
  // sudah ada untuk alasan lain — bukan useState-nya sendiri, jadi tidak
  // bisa melenceng dari apa yang sebenarnya sedang terjadi (lib/phase.ts).
  const fase = phaseOf({ movesPlayed: record.moves.length, status: state.status, busy })
  const langkahBersimpang = useMemo(
    () => adaSimpang(record.moves, ruleset),
    [record.moves, ruleset],
  )
  const wilayah = wilayahDi(fase, langkahBersimpang)
  const tampil = (w: (typeof wilayah)[number]) => wilayah.includes(w)

  return (
    <div className="flex flex-col gap-4">
      {/* siap: papan saja, kosong-siap, dan setup di bawah. main/setelah/
          selesai: skor di atasnya. Board sendiri tidak pernah bergantung
          pada fase (DESIGN.md §5: ukurannya tetap sepanjang sesi) — hanya
          apa yang duduk di sekitarnya yang berubah. */}
      {tampil('skor') && (
        <Skor
          state={state}
          kata={kata}
          namaA={namaA}
          namaB={namaB}
          skorA={skorA}
          skorB={skorB}
          hand={frame.hand}
          berpikir={berpikir}
        />
      )}

      {/* Satu wilayah live untuk seluruh layar papan, dibacakan sekali per
          giliran. Tidak terlihat karena isinya sudah terlihat di tempat
          lain — papan skor, panel riwayat — hanya waktunya yang berbeda. */}
      <p className="sr-only" aria-live="polite">
        {umumkan}
      </p>

      <Papan
        locale={locale}
        papanRef={papanRef}
        cells={frame.cells}
        active={frame.active}
        secondary={frame.secondary}
        highlight={frame.highlight}
        playable={playable}
        previewed={previewed}
        simpangHoles={simpangHoles}
        onSelect={pilih}
        onPreview={setPreviewed}
        namaA={namaA}
        namaB={namaB}
      />

      {tampil('pratinjau') && (
        // Satu blok, dua pekerjaan. Kalau belum ada lubang yang ditunjuk,
        // ia mengatakan apa yang harus dilakukan — dalam kata-kata yang
        // berlaku untuk jari maupun tetikus. Begitu ada, ia berganti jadi
        // pratinjau langkah: ke mana rantai berakhir, berapa yang ditabung,
        // apakah menembak atau dapat giliran lagi (PRD §8.2) — dan kalau
        // bacaan lain akan berbuat beda di langkah yang sama, itu juga di
        // sini, di wilayah live yang sama, supaya terbaca sekali diumumkan
        // (DESIGN.md §4.7) alih-alih di wilayah terpisah yang diam.
        //
        // Tinggi minimumnya tetap, supaya papan tidak melompat naik-turun
        // setiap kali kursor melewati sebuah lubang.
        <div
          className="flex min-h-[3rem] flex-col gap-2 rounded-panel bg-mat-low/70 px-3 py-2 font-sans text-fg ring-1 ring-inset ring-mat-edge/50"
          aria-live="polite"
        >
          <p className="flex items-center gap-2">
            {pratinjau ? (
              <>
                <span className="tnum shrink-0 rounded-md bg-mat-high px-1.5 py-0.5 font-mono text-xs text-fg-muted">
                  {kata.pratinjau} {pratinjau.hole}
                </span>
                <span>{pratinjauTeks(pratinjau)}</span>
              </>
            ) : player.alasanHenti ? (
              // Kenapa giliran barusan berhenti tanpa hasil, dan klausa mana
              // yang memutuskannya. Ini pertanyaan yang dibawa pemain ke layar
              // saat biji terakhirnya mendarat di lubang kosong sendiri dan
              // tidak terjadi apa-apa — tanpa jawaban, aplikasinya terbaca
              // rusak, bukan beraturan lain.
              <span>
                {describeHenti(player.alasanHenti)}{' '}
                {/* Aturan yang memutuskan, dan siapa yang mengatakannya —
                    di tempat aturannya baru berlaku, bukan di catatan kaki
                    halaman lain. */}
                <Rujukan opsi={player.alasanHenti.opsi} ruleset={ruleset} kata={kata} />
              </span>
            ) : (
              <span className="font-medium">{ajakan ?? kata.pratinjauPetunjuk}</span>
            )}
          </p>

          {simpangTampil.length > 0 && (
            <PratinjauSimpangDaftar
              berbeda={simpangTampil}
              lebih={simpangLebih}
              locale={locale}
              kata={kata}
            />
          )}
        </div>
      )}

      {/* Begitu sebuah langkah selesai — giliran biasa atau yang mengakhiri
          permainan — pertanyaan berikutnya bukan lagi "aturan mana yang
          ada" melainkan "apa jadinya langkah barusan di aturan yang lain".
          Panelnya cuma dipasang kalau langkah itu memang bersimpang
          (DESIGN.md §5: promosi hanya untuk itu, tidak pernah dipasang lalu
          disembunyikan kalau tidak). */}
      {tampil('aturanLain') && <AturanLain record={record} aktif={ruleset} locale={locale} />}

      {tampil('kendaliGiliran') && (
        // Yang sering disentuh saat bermain duduk langsung di bawah papan;
        // yang jarang — mode dan kesulitan — turun ke panel setup, yang
        // sudah tidak terpasang lagi begitu ada langkah pertama.
        <div className="flex flex-wrap items-center gap-2">
          <Tombol bobot="utama" onClick={baru}>
            {kata.permainanBaru}
          </Tombol>
          <Tombol onClick={urung} disabled={busy || record.moves.length === 0}>
            {kata.urung}
          </Tombol>
          {player.playing && <Tombol onClick={player.skip}>{kata.lewati}</Tombol>}
          <span className="ml-auto flex items-center gap-1">
            <TombolSuara locale={locale} />
            <Segmen
              options={KECEPATAN.map((k) => [k, kata[k]] as const)}
              value={kecepatan}
              onChange={setKecepatan}
              label={kata.kecepatan}
              labelVisible
              size="sm"
            />
          </span>
        </div>
      )}

      {tampil('riwayat') && <Riwayat lines={player.ringkasan} kata={kata} />}

      {tampil('panelMode') && (
        <Panel judul={kata.permainan} className="flex flex-col gap-3">
          <Segmen
            // Label pendek di dalam kendali, kalimat panjangnya di tempat
            // lain: "Satu perangkat, dua pemain" tidak muat sebagai segmen.
            options={[
              ['hotseat', kata.duaPemain],
              ['ai', kata.lawanAi],
            ]}
            value={mode}
            onChange={gantiMode}
            label={kata.mode}
          />
          {/* Apa AI itu sebenarnya, di panel tempat ia dinyalakan. Aplikasi
              ini menjual "tiap angka bisa ditelusuri ke aturan bersumber",
              lalu menaruh lawan yang menilai papan dengan bobot karangan
              sendiri — dan tidak pernah mengatakannya. */}
          {mode === 'ai' && (
            <Segmen
              options={KESULITAN.map((k) => [k, kata[k]] as const)}
              value={kesulitan}
              onChange={setKesulitan}
              label={kata.kesulitan}
              labelVisible
              size="sm"
            />
          )}
          {mode === 'ai' && (
            <p className="max-w-prose font-sans text-xs leading-relaxed text-fg-muted">
              {kata.aiJujur}
            </p>
          )}
        </Panel>
      )}

      {tampil('pemilihAturan') && (
        // Aturan yang dipakai duduk di bawah papan, bukan di atasnya. Ini
        // bagian paling penting dari produknya dan pembukaan yang paling
        // buruk: "6 perbedaan tercatat" tidak berarti apa-apa sebelum orang
        // tahu permainan apa yang sedang dilihatnya. Papan menjelaskan
        // dirinya sendiri; panel ini menjelaskan papannya.
        <PemilihAturan
          rulesets={RULESETS}
          active={ruleset}
          onChange={gantiAturan}
          locale={locale}
          // Ini hanya pernah dipasang pada fase siap, dan siap berarti
          // persis busy===false dan record.moves.length===0 — jadi
          // disabled di sini selalu false. Bukan digrayscale, hanya
          // dilepas sama sekali begitu ada langkah pertama (DESIGN.md §5:
          // "not greyed, not collapsed to a header. Absent.").
          disabled={false}
        />
      )}

      {(tampil('kodePermainan') || tampil('statistik')) && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-mat-edge/70 pt-3">
          {tampil('kodePermainan') && (
            <p className="flex items-center gap-2 font-mono text-xs text-fg-muted">
              <span className="text-fg-muted">{kata.kodePermainan}</span>
              <span className="tnum text-fg">{encodeRecord(record)}</span>
              <Salin teks={encodeRecord(record)} locale={locale} />
            </p>
          )}
          {tampil('statistik') && (
            <PanelStatistik rulesetId={ruleset.id} kata={kata} versi={statVersi} />
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Local stats, per ruleset (PRD §8.7). Read after mount only — reading
 * localStorage during render would make the server-rendered HTML and the
 * first client render disagree.
 */
function PanelStatistik({
  rulesetId,
  kata,
  versi,
}: {
  rulesetId: string
  kata: ReturnType<typeof t>
  versi: number
}) {
  const [stat, setStat] = useState<Statistik | null>(null)
  useEffect(() => {
    setStat(bacaStatistik(rulesetId))
  }, [rulesetId, versi])

  if (!stat || stat.dimainkan === 0) return null

  return (
    // Angkanya yang jadi isi, bukan kalimatnya: dulu semuanya dirangkai jadi
    // satu baris mono yang harus dibaca kata per kata untuk menemukan satu
    // bilangan. Ini masih benar untuk permainan dan bank terbesar — yang
    // berubah adalah menang/kalah dan sambung, dua angka yang di papan
    // selalu duduk berdampingan dengan biji sungguhan, bukan sendirian.
    <dl className="flex flex-col gap-1.5" aria-label={kata.statistik}>
      <div className="flex items-baseline gap-1.5">
        <dt className="font-sans text-2xs text-fg-muted">{kata.dimainkan}</dt>
        <dd className="tnum font-display text-sm font-semibold text-fg">{stat.dimainkan}</dd>
      </div>

      {/* Menang dan kalah sebagai proporsi di seedA/seedB (DESIGN.md §7).
          Bukan warnanya saja: tiap angka dipasangi bentuk bijinya sendiri
          — bulat untuk A, bersegi untuk B — jadi bacaan mana punya siapa
          tidak pernah bersandar pada warna sendirian (invariant 18). Batang
          di antaranya cuma mengulang secara visual apa yang angkanya sudah
          katakan, jadi ia disembunyikan dari pembaca layar. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <dt className="sr-only">{kata.menangA}</dt>
        <dd className="flex items-center gap-1.5">
          <Biji owner={PLAYER_A} size={9} />
          <span className="tnum font-display text-sm font-semibold text-fg">{stat.menangA}</span>
        </dd>

        <span
          aria-hidden
          className="flex h-2 w-10 shrink-0 overflow-hidden rounded-full bg-mat-edge/60"
        >
          {stat.menangA + stat.menangB > 0 && (
            <>
              <span className="bg-seedA" style={{ flexGrow: stat.menangA }} />
              <span className="bg-seedB" style={{ flexGrow: stat.menangB }} />
            </>
          )}
        </span>

        <dt className="sr-only">{kata.menangB}</dt>
        <dd className="flex items-center gap-1.5">
          <span className="tnum font-display text-sm font-semibold text-fg">{stat.menangB}</span>
          <Biji owner={PLAYER_B} size={9} />
        </dd>

        {stat.seri > 0 && (
          <>
            <dt className="font-sans text-2xs text-fg-muted">{kata.seri}</dt>
            <dd className="tnum font-display text-sm font-semibold text-fg">{stat.seri}</dd>
          </>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <dt className="font-sans text-2xs text-fg-muted">{kata.bankTerbesar}</dt>
        <dd className="tnum font-display text-sm font-semibold text-fg">{stat.bankTerbesar}</dd>
      </div>

      {/* Sambung terpanjang sebagai deretan biji, bukan cuma angkanya.
          TumpukanBiji sudah tahu kapan berhenti menghitung titik dan
          berganti ke angka (AMBANG_NUMERAL) — rantai yang sangat panjang
          tetap terbaca alih-alih jadi tumpukan tak terhitung. Pemiliknya
          di sini bukan klaim: sambung terpanjang bukan milik satu sisi,
          bentuknya cuma dipinjam supaya baris ini terbaca seperti biji
          sungguhan, bukan digit sendirian. */}
      <div className="flex items-center gap-2">
        <dt className="font-sans text-2xs text-fg-muted">{kata.sambungTerpanjang}</dt>
        <dd className="tnum font-display text-sm font-semibold text-fg">
          {stat.sambungTerpanjang > 0 ? (
            <>
              {/* Deretannya sendiri aria-hidden (TumpukanBiji, seperti di
                  papan) — angkanya masih harus terbaca tanpa dia. */}
              <span aria-hidden>
                <TumpukanBiji biji={stat.sambungTerpanjang} owner={PLAYER_A} size={8} />
              </span>
              <span className="sr-only">{stat.sambungTerpanjang}</span>
            </>
          ) : (
            0
          )}
        </dd>
      </div>
    </dl>
  )
}

/**
 * PratinjauSimpang's own text carrier (DESIGN.md §4.4) — the board already
 * marks the diverging hole with a dashed ring; this names which pack and
 * says in one line what it would do differently. Never brass (§3.2): the
 * swatch borrows the board marker's own dashed-ink language instead, so a
 * reader can connect the two without needing colour to do it.
 */
function PratinjauSimpangDaftar({
  berbeda,
  lebih,
  locale,
  kata,
}: {
  berbeda: readonly SimpangPratinjau[]
  lebih: number
  locale: Locale
  kata: ReturnType<typeof t>
}) {
  return (
    <ul className="flex flex-col gap-1 border-t border-mat-edge/60 pt-2">
      {berbeda.map(({ ruleset, teks }) => {
        const perluCek = ruleset.sources.filter((s) => s.confidence === 'perlu-cek').length
        return (
          <li key={ruleset.id} className="flex flex-wrap items-baseline gap-x-1.5 text-sm">
            <span
              aria-hidden
              className="mr-0.5 h-2 w-2 shrink-0 translate-y-[0.05em] rounded-sm border border-dashed border-ink"
            />
            <span className="font-medium">{ruleset.name}</span>
            {perluCek > 0 && (
              <Lencana nada="perhatian">
                {perluCek} {kata.perluCek}
              </Lencana>
            )}
            <span className="text-fg-muted">{teks}</span>
          </li>
        )
      })}
      {lebih > 0 && (
        <li className="text-sm text-fg-muted">
          +{lebih}{' '}
          <Link
            href={`/${locale}/banding`}
            className="rounded text-accent-strong underline decoration-accent/40 underline-offset-4 transition hover:decoration-accent-strong"
          >
            {kata.banding} →
          </Link>
        </li>
      )}
    </ul>
  )
}

function Riwayat({ lines, kata }: { lines: readonly string[]; kata: ReturnType<typeof t> }) {
  return (
    <Panel judul={kata.riwayat}>
      {lines.length === 0 ? (
        <p className="font-sans text-sm text-fg-muted">{kata.belumAdaLangkah}</p>
      ) : (
        <ol className="flex max-h-32 flex-col gap-1 overflow-y-auto">
          {lines.map((line, i) => (
            <li
              key={i}
              className="border-l-2 border-teak/25 pl-2.5 font-sans text-sm leading-snug text-fg"
            >
              {line}
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}

/**
 * The clause that just decided a turn, and the source behind it.
 *
 * Universal rules say so plainly instead of borrowing a citation: landing
 * in an empty hole on the opponent's side ends the turn under every reading
 * there is, and dressing that in a source would imply a choice nobody made.
 */
function Rujukan({
  opsi,
  ruleset,
  kata,
}: {
  opsi: string | null
  ruleset: Ruleset
  kata: ReturnType<typeof t>
}) {
  if (opsi === null) {
    return <span className="text-fg-muted">{kata.rujukanUniversal}</span>
  }

  const aturan = aturanUntukOpsi(ruleset, opsi)
  const sumber = sumberUntukOpsi(ruleset, opsi)

  return (
    <span className="text-fg-muted">
      {aturan && (
        <>
          {kata.rujukanAturan}: <span className="text-fg">{aturan}</span>
          {' · '}
        </>
      )}
      <code className="rounded bg-mat-high px-1 py-0.5 font-mono text-2xs">{opsi}</code>
      {sumber.length > 0 && (
        <>
          {' · '}
          {kata.rujukanSumber}: {sumber.join('; ')}
        </>
      )}
    </span>
  )
}
