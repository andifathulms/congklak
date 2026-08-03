/**
 * Seeded PRNG — mulberry32.
 *
 * Deliberately outside lib/engine. The engine has no randomness at all;
 * congklak is perfect information. This exists for AI difficulty noise and
 * for simulation, both of which must still be reproducible from a seed.
 */
export interface Rng {
  /** Bilangan bulat dalam [0, bound). */
  next(bound: number): number
  /** Ambil satu unsur; larik harus urut agar hasilnya stabil. */
  pick<T>(items: readonly T[]): T
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0
  const nextUint32 = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return (t ^ (t >>> 14)) >>> 0
  }

  return {
    next(bound: number): number {
      if (bound <= 0) throw new Error(`bound harus positif, diberi ${bound}`)
      // Modulo, tidak ada float — bias-nya tak berarti untuk ukuran di sini.
      return nextUint32() % bound
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error('tidak bisa memilih dari larik kosong')
      return items[nextUint32() % items.length]
    },
  }
}
