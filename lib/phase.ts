/**
 * Which screen phase a hotseat/AI game is in, and which regions of the
 * screen belong to it (DESIGN.md §5).
 *
 * Derived, never stored: `Permainan.tsx` already carries every input this
 * needs for other reasons — how many moves have been played, the engine's
 * own status, whether a move is still animating. Phase is computed fresh
 * from those each render rather than kept as its own `useState`, so it
 * cannot drift out of sync with what it describes.
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

export function phaseOf({ movesPlayed, status, busy }: PhaseInput): Phase {
  if (busy) return 'main'
  if (status === 'selesai') return 'selesai'
  if (movesPlayed === 0) return 'siap'
  return 'setelah'
}

/**
 * Wilayah layar yang disebut namanya di DESIGN.md §5, per fase. Hanya yang
 * dinyatakan tegas di sana — bukan tebakan atas yang tidak disebut. `siap`
 * dan `main` masing-masing menegaskan yang tidak ada ("No score strip, no
 * history, no stats" / "Ruleset picker and stats unmount"), jadi keduanya
 * di bawah ini lengkap. `selesai` hanya menyebut "Result, stats, share
 * code, replay link" — di mana tombol "permainan baru" duduk dari sana
 * bukan yang diputuskan di sini, itu urusan langkah 4 (menggerbangi
 * `Permainan.tsx`).
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

const WILAYAH_TETAP: Record<Phase, readonly Wilayah[]> = {
  siap: ['papan', 'pemilihAturan', 'panelMode'],
  main: ['papan', 'skor', 'kendaliGiliran', 'pratinjau', 'riwayat'],
  setelah: ['papan', 'skor', 'kendaliGiliran', 'pratinjau', 'riwayat'],
  selesai: ['papan', 'skor', 'statistik', 'kodePermainan'],
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
