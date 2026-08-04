'use client'

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
 * The group name is required, not optional: several groups share the same
 * option word — "Sedang" is both a difficulty and a speed — and without the
 * group they cannot be told apart by a screen reader or by anyone
 * navigating with a keyboard.
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
  label: string
  labelVisible?: boolean
  disabled?: boolean
  size?: 'sm' | 'md'
}) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'

  return (
    <div className="flex min-w-0 items-center gap-2">
      {labelVisible && (
        <span aria-hidden className="shrink-0 font-sans text-xs text-ink/50">
          {label}
        </span>
      )}
      <div
        role="group"
        aria-label={label}
        // Membungkus, bukan memotong: nama aturan yang terpotong jadi
        // "Congklak U…" menghapus satu-satunya hal yang membedakannya.
        className="flex min-w-0 flex-wrap items-center gap-0.5 rounded-[1.25rem] bg-mat-low p-0.5 ring-1 ring-inset ring-mat-edge/60"
      >
        {options.map(([key, teks]) => {
          const dipilih = value === key
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onChange(key)}
              aria-pressed={dipilih}
              aria-label={`${label}: ${teks}`}
              className={[
                'rounded-full font-sans transition disabled:opacity-40',
                pad,
                dipilih
                  ? 'bg-mat-high font-medium text-ink shadow-raise'
                  : 'text-ink/55 enabled:hover:text-ink',
              ].join(' ')}
            >
              {teks}
            </button>
          )
        })}
      </div>
    </div>
  )
}
