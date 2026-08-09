'use client'

import { useId } from 'react'

/**
 * One segmented control for the whole app.
 *
 * Mode, difficulty, speed, ruleset and connection route were five separate
 * hand-rolled pill rows that all looked identical, so nothing on screen
 * distinguished "which ruleset am I playing" from "how fast does the
 * animation run" — choices of completely different consequence rendered at
 * the same weight. A segmented control sits in a sunk track and shows its
 * group name, so the choices read as belonging to something.
 *
 * Built on native radios, not buttons.
 *
 * These were toggle buttons carrying `aria-pressed`, which says "this is a
 * thing you switch on and off" about a set where exactly one option is
 * always chosen. To make the announcement comprehensible each button then
 * repeated the group name — "Mode: Dua pemain" — on top of a group that
 * already carried it, so a screen reader said the group name again on every
 * option. Radios in a fieldset say it once on entry, and the option only
 * has to name itself. The duplication is gone rather than suppressed.
 *
 * Native radios also bring arrow-key navigation within the group for free,
 * which the button version never had.
 */
export function Segmen<T extends string>({
  options,
  value,
  onChange,
  label,
  labelVisible = false,
  disabled = false,
  size = 'md',
}: {
  options: readonly (readonly [T, string])[]
  value: T
  onChange: (next: T) => void
  /**
   * Nama grup, wajib. Beberapa grup memakai kata yang sama — "Sedang" ada
   * di kesulitan dan di kecepatan — jadi tanpa nama grup keduanya tidak
   * bisa dibedakan oleh siapa pun yang mendengarkan, bukan melihat.
   */
  label: string
  labelVisible?: boolean
  disabled?: boolean
  size?: 'sm' | 'md'
}) {
  const nama = useId()
  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'

  return (
    <fieldset className="flex min-w-0 items-center gap-2" disabled={disabled}>
      {/*
        Legend membawa nama grup untuk pembaca layar. Saat namanya juga
        ditampilkan, ia tampil apa adanya; saat tidak, ia disembunyikan
        secara visual tapi tetap dibacakan — bukan dihapus.
      */}
      <legend className={labelVisible ? 'float-left mr-2 font-sans text-xs text-fg-muted' : 'sr-only'}>
        {label}
      </legend>
      <div className="flex min-w-0 flex-wrap items-center gap-0.5 rounded-[1.25rem] bg-mat-low p-0.5 ring-1 ring-inset ring-mat-edge/60">
        {options.map(([key, teks]) => {
          const dipilih = value === key
          return (
            <label
              key={key}
              className={[
                'cursor-pointer rounded-full font-sans transition has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-40',
                // Cincin fokus mengikuti radio yang tersembunyi, karena
                // radionya sendiri tidak digambar.
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-fg',
                pad,
                dipilih ? 'bg-mat-high font-medium text-fg shadow-raise' : 'text-fg-muted hover:text-fg',
              ].join(' ')}
            >
              <input
                type="radio"
                name={nama}
                value={key}
                checked={dipilih}
                onChange={() => onChange(key)}
                className="sr-only"
              />
              {teks}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
