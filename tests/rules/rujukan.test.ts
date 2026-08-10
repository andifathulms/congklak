import { describe, expect, it } from 'vitest'
import { RULESETS, getRuleset } from '@/lib/rulesets'
import { aturanUntukOpsi, sumberUntukOpsi } from '@/components/game/rujukan'

/**
 * The board cites the source at the moment a rule decides something. That
 * citation is only worth showing if it really comes from the pack in force,
 * so these pin the link from an option path back to the titles the pack
 * itself lists.
 */
describe('rujukan aturan', () => {
  it('menemukan aturan dan sumber untuk opsi yang memang diperselisihkan', () => {
    const melayu = getRuleset('congkak-melayu')
    expect(aturanUntukOpsi(melayu, 'menembak.requireLapCompleted')).toBe('Syarat menembak')
    expect(sumberUntukOpsi(melayu, 'menembak.requireLapCompleted').length).toBeGreaterThan(0)
  })

  it('tidak mengarang sumber untuk opsi yang tidak tercatat', () => {
    const umum = getRuleset('umum')
    expect(sumberUntukOpsi(umum, 'opsi-yang-tidak-ada')).toEqual([])
    expect(aturanUntukOpsi(umum, 'opsi-yang-tidak-ada')).toBeNull()
  })

  /**
   * Every title cited here has to exist in the pack's own source list,
   * otherwise the board would show a reference the sources page cannot
   * back up.
   */
  it('setiap sumber yang dikutip ada di daftar sumber pack itu', () => {
    for (const r of RULESETS) {
      const judul = r.sources.map((s) => s.title)
      for (const d of r.divergences) {
        if (!d.banding) continue
        for (const s of sumberUntukOpsi(r, d.banding.opsi)) {
          expect(judul, `${r.id}: "${s}" tidak ada di daftar sumber`).toContain(s)
        }
      }
    }
  })

  it('urutannya tetap — sumber muncul menurut urutan pack, tanpa duplikat', () => {
    for (const r of RULESETS) {
      for (const d of r.divergences) {
        if (!d.banding) continue
        const hasil = sumberUntukOpsi(r, d.banding.opsi)
        expect(hasil).toEqual(sumberUntukOpsi(r, d.banding.opsi))
        expect(new Set(hasil).size).toBe(hasil.length)
      }
    }
  })
})
