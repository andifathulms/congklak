import { describe, expect, it } from 'vitest'
import { RULESETS } from '@/lib/rulesets'
import { BENIH_MAKS, cariBukti, denganBacaanLain } from '@/lib/engine/bukti'
import { compareRulesets, contohLangkah } from '@/lib/engine/compare'
import { createRng } from '@/lib/rng'

const dapatDibandingkan = RULESETS.flatMap((r) =>
  r.divergences.filter((d) => d.banding).map((d) => ({ r, d, b: d.banding! })),
)

describe('bukti simpang', () => {
  it('setiap pack punya perbedaan yang dapat dibandingkan', () => {
    expect(dapatDibandingkan.length).toBeGreaterThan(0)
  })

  /**
   * A pack that claims a divergence is comparable and then cannot show it
   * on any board has made an unsupported claim. This is the assertion that
   * keeps the ledger honest, and it is deliberately strict: if a rule ever
   * stops mattering, this fails and someone has to relabel it rather than
   * leave the page asserting something untrue.
   */
  it.each(dapatDibandingkan.map(({ r, d, b }) => [r.id, d.rule, b.opsi] as const))(
    '%s — "%s" (%s) terbukti berbeda di papan',
    (id, rule, opsi) => {
      const found = dapatDibandingkan.find(
        (x) => x.r.id === id && x.d.rule === rule && x.b.opsi === opsi,
      )!
      const bukti = cariBukti(found.r, found.b)
      expect(bukti, `${id}/${rule}: tidak ada papan yang membuktikannya`).not.toBeNull()
      expect(bukti!.giliran).toBeGreaterThan(0)
      expect(bukti!.seed).toBeLessThanOrEqual(BENIH_MAKS)
    },
  )

  it('membalik satu klausa hanya mengubah klausa itu', () => {
    const { r, b } = dapatDibandingkan[0]
    const lain = denganBacaanLain(r, b)
    // Semua yang bukan options harus identik — id, sumber, perbedaan.
    expect({ ...lain, options: null }).toEqual({ ...r, options: null })
    expect(lain.options).not.toEqual(r.options)
  })

  it('bukti bersifat deterministik — benih yang sama, hasil yang sama', () => {
    for (const { r, b } of dapatDibandingkan) {
      expect(cariBukti(r, b)).toEqual(cariBukti(r, b))
    }
  })

  /**
   * The proof must be reproducible from its own seed: someone who does not
   * trust the claim can replay exactly the game it points at.
   */
  it('benih yang dilaporkan benar-benar menghasilkan simpang itu', () => {
    for (const { r, b } of dapatDibandingkan) {
      const bukti = cariBukti(r, b)!
      const rng = createRng(bukti.seed)
      const moves = contohLangkah(r, (n) => rng.next(n))
      const ulang = compareRulesets(moves, r, denganBacaanLain(r, b))
      expect(ulang.simpangDi + 1).toBe(bukti.giliran)
      expect(ulang.alasan).toBe(bukti.alasan)
      expect(moves.length).toBe(bukti.panjang)
    }
  })

  it('perbedaan yang hanya dicatat tidak mengaku punya pembanding', () => {
    for (const r of RULESETS) {
      for (const d of r.divergences) {
        if (d.status === 'dapat-dibandingkan') expect(d.banding).toBeDefined()
        else expect(d.banding).toBeUndefined()
      }
    }
  })
})
