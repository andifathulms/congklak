import { PLAYER_A, type Player } from '@/lib/engine/board'

/**
 * Seed ownership is never colour alone (invariant 18). Player A's biji are
 * round and cream; player B's are faceted and tamarind. The form carries
 * the ownership on its own, so the board stays readable without colour
 * discrimination.
 */
export function Biji({ owner, size = 10 }: { owner: Player; size?: number }) {
  const isA = owner === PLAYER_A
  return (
    <span
      aria-hidden
      className={
        isA
          ? 'inline-block bg-seedA shadow-[inset_0_-1px_0_rgba(36,28,20,0.25)]'
          : 'inline-block bg-seedB shadow-[inset_0_-1px_0_rgba(240,231,212,0.2)]'
      }
      style={{
        width: size,
        height: size,
        // Bulat untuk A, bersegi untuk B — bentuk, bukan hanya warna.
        borderRadius: isA ? '50%' : '20%',
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

export function TumpukanBiji({ biji, owner }: { biji: number; owner: Player }) {
  if (biji === 0) return null

  if (biji > AMBANG_NUMERAL) {
    return (
      <span className="tnum font-display text-lg font-semibold text-seedA">{biji}</span>
    )
  }

  return (
    <span className="flex max-w-[80%] flex-wrap items-center justify-center gap-[2px]">
      {Array.from({ length: biji }, (_, i) => (
        <Biji key={i} owner={owner} />
      ))}
    </span>
  )
}
