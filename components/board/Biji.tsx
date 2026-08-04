import { PLAYER_A, type Player } from '@/lib/engine/board'

/**
 * Seed ownership is never colour alone (invariant 18). Player A's biji are
 * round and cream; player B's are faceted and tamarind. The form carries
 * the ownership on its own, so the board stays readable without colour
 * discrimination.
 */
export function Biji({ owner, size = 10 }: { owner: Player; size?: number | string }) {
  const isA = owner === PLAYER_A
  return (
    <span
      aria-hidden
      className={
        isA
          ? 'inline-block shrink-0 bg-seedA shadow-[inset_0_-1.5px_1px_rgba(36,28,20,0.28),0_1px_1px_rgba(0,0,0,0.35)]'
          : 'inline-block shrink-0 bg-seedB shadow-[inset_0_-1.5px_1px_rgba(0,0,0,0.35),0_1px_1px_rgba(0,0,0,0.35)]'
      }
      style={{
        width: size,
        height: size,
        // Bulat untuk A, bersegi untuk B — bentuk, bukan hanya warna.
        borderRadius: isA ? '50%' : '22%',
        transform: isA ? undefined : 'rotate(45deg)',
      }}
    />
  )
}

/**
 * Seeds cluster inside a hole up to a threshold, then switch to a numeral.
 * A hole with 23 biji should read as "23", not as an unreadable pile.
 */
export const AMBANG_NUMERAL = 12

/**
 * Fixed positions, not flow (PRD §11).
 *
 * Wrapping the biji with flex-wrap let the row breaks fall wherever the
 * hole width happened to put them, so seven biji piled up as a lopsided
 * blob that changed shape as the board resized — and a pile you cannot
 * count at a glance is the one thing a congklak board must not have. These
 * are the row patterns for every count up to the threshold: centred,
 * hexagonally packed, and identical at every size.
 */
const SUSUNAN: readonly (readonly number[])[] = [
  [], // 0
  [1],
  [2],
  [2, 1],
  [2, 2],
  [2, 3],
  [3, 3],
  [2, 3, 2],
  [3, 2, 3],
  [3, 3, 3],
  [3, 4, 3],
  [4, 3, 4],
  [4, 4, 4],
]

export function TumpukanBiji({
  biji,
  owner,
  // Biji scale with the board rather than with a breakpoint: the holes are
  // a fraction of the width at every size, so the seeds in them must be too.
  size = 'clamp(5px, 0.95vw, 11px)',
}: {
  biji: number
  owner: Player
  size?: number | string
}) {
  if (biji === 0) return null

  if (biji > AMBANG_NUMERAL) {
    return (
      <span className="tnum font-display text-base font-bold text-seedA sm:text-lg">{biji}</span>
    )
  }

  const rows = SUSUNAN[biji]
  let dealt = 0

  return (
    <span className="flex flex-col items-center justify-center gap-[2px]">
      {rows.map((n, r) => {
        const start = dealt
        dealt += n
        return (
          <span key={r} className="flex items-center justify-center gap-[2px]">
            {Array.from({ length: n }, (_, i) => (
              <Biji key={start + i} owner={owner} size={size} />
            ))}
          </span>
        )
      })}
    </span>
  )
}
