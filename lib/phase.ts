/**
 * Which screen phase a hotseat/AI game is in, and which regions of the
 * screen belong to it (DESIGN.md §5).
 *
 * Derived, never stored: `Permainan.tsx` already carries every input this
 * needs for other reasons — how many moves have been played, the engine's
 * own status, whether a move is still animating. Phase is computed fresh
 * from those each render rather than kept as its own `useState`, so it
 * cannot drift out of sync with what it describes.
 *
 * Reconciled 2026-08-17 against Chipfire's `lib/phase.ts`, the sibling
 * project this pattern was meant to come from first (`CLAUDE.md`).
 * `derivePhase`'s name and `movesPlayed`'s field name now match theirs
 * exactly — `siap`/`main`/`selesai` and the "an instrument with nothing to
 * say is not mounted, never greyed" rule were already the same idea
 * independently. Two things stay genuinely different, both forced by how
 * each engine updates state relative to its own animation, not by taste:
 *
 * - The third phase is content-gated in both apps, but on different
 *   content: Chipfire's `longsor` asks "was the cascade that just
 *   resolved big" (`cascadeDepth(lastCascadeEvents) >= 2`); this file's
 *   `setelah` asks only "did a move just resolve," and leaves whether
 *   there is anything to show (`AturanLain`, only when a move genuinely
 *   diverges) to `wilayahDi` below. Congklak has no per-move size to
 *   threshold on — a menembak or a long sambung is not "bigger" than a
 *   single quiet sow in the way a cascade's generation count is.
 * - Chipfire's `derivePhase` takes no animating flag at all: its
 *   `record.moves.length` and its cascade events update the instant a
 *   move is chosen, so gating only `winner` on `!animating` at the call
 *   site is enough. Here `record` (and so `movesPlayed`) is only written
 *   in `usePenaburan`'s `onDone`, after the sow finishes — so `busy` has
 *   to win inside `derivePhase` itself, or the very first move would
 *   render as `siap` for the length of its own animation.
 *
 * `wilayahDi` below has no Chipfire counterpart — `PlayScreen.tsx` derives
 * each region's visibility inline (`phase === 'main' || phase === '…'`)
 * rather than through a shared, independently testable table. Both are
 * legitimate; this file keeps the table because `tests/phase/phase.test.ts`
 * can then assert the exact region set per phase without touching React at
 * all, which an inline boolean per call site cannot offer on its own.
 */
import type { Status } from './engine/apply'

export type Phase = 'siap' | 'main' | 'setelah' | 'selesai'

export interface PhaseInput {
  /** `record.moves.length` — 0 sebelum langkah pertama. */
  readonly movesPlayed: number
  /** Status `GameState` yang terakhir terkonfirmasi (bukan yang akan berlaku sesudah animasi ini). */
  readonly status: Status
  /**
   * Sedang menabur — dari lubang dipilih sampai bingkai terakhirnya
   * selesai (`busy` di `Permainan.tsx`). Ini menang atas segalanya: selama
   * animasi berjalan, `status` yang dibaca masih status SEBELUM langkah
   * ini, jadi ia belum boleh memutuskan fase — termasuk untuk langkah
   * pertama, saat `movesPlayed` juga masih 0.
   */
  readonly busy: boolean
}

export function derivePhase({ movesPlayed, status, busy }: PhaseInput): Phase {
  if (busy) return 'main'
  if (status === 'selesai') return 'selesai'
  if (movesPlayed === 0) return 'siap'
  return 'setelah'
}

/**
 * Wilayah layar per fase (DESIGN.md §5, diselesaikan di langkah 4).
 *
 * `siap` dan `main` menegaskan tegas apa yang tidak ada ("No score strip,
 * no history, no stats" / "Ruleset picker and stats unmount"), jadi
 * keduanya di bawah ini lengkap dari teksnya sendiri.
 *
 * `selesai` cuma menyebut "Result, stats, share code, replay link" —
 * daftar pendek yang BARU di fase itu, bukan daftar lengkap semua yang
 * boleh tampil. Sebelum ini `kendaliGiliran` (urungkan, terutama) dan
 * `pratinjau` (yang juga membawa penjelasan "kenapa giliran berhenti
 * tanpa hasil") tampil terus tanpa peduli status permainan. Melepas
 * keduanya begitu saja di `selesai` akan membuang kemampuan yang sudah
 * ada — mengurungkan langkah terakhir yang mengakhiri permainan, dan
 * membaca kenapa langkah itu tidak menembak — tanpa DESIGN.md pernah
 * memintanya dilepas. Jadi `selesai` di sini adalah `main` ditambah
 * `statistik`, bukan penggantinya.
 */
export type Wilayah =
  | 'papan'
  | 'skor'
  | 'kendaliGiliran'
  | 'pratinjau'
  | 'riwayat'
  | 'pemilihAturan'
  | 'panelMode'
  | 'aturanLain'
  | 'statistik'
  | 'kodePermainan'

const DASAR_MAIN: readonly Wilayah[] = [
  'papan',
  'skor',
  'kendaliGiliran',
  'pratinjau',
  'riwayat',
  'kodePermainan',
]

const WILAYAH_TETAP: Record<Phase, readonly Wilayah[]> = {
  siap: ['papan', 'pemilihAturan', 'panelMode'],
  main: DASAR_MAIN,
  setelah: DASAR_MAIN,
  selesai: [...DASAR_MAIN, 'statistik'],
}

/**
 * `AturanLain` hanya bersyarat, di dua fase yang keduanya berarti "sebuah
 * langkah baru saja selesai" — giliran biasa (`setelah`) dan giliran yang
 * mengakhiri permainan (`selesai`, yang tidak pernah singgah di `setelah`
 * dulu karena `status` sudah berubah begitu animasinya selesai). Ia
 * promosi hanya kalau langkah itu memang bersimpang; kalau tidak, ia tidak
 * pernah dipasang sama sekali — bukan dipasang lalu disembunyikan.
 */
const BISA_SIMPANG: ReadonlySet<Phase> = new Set(['setelah', 'selesai'])

export function wilayahDi(fase: Phase, langkahBersimpang: boolean): readonly Wilayah[] {
  const dasar = WILAYAH_TETAP[fase]
  if (BISA_SIMPANG.has(fase) && langkahBersimpang) return [...dasar, 'aturanLain']
  return dasar
}
