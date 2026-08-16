import type { Config } from 'tailwindcss'

/**
 * Semantic tokens only — PRD §11. Components never use raw hex.
 * `brass` marks the active hole and capture events, and nothing else.
 *
 * The hues are the ones §11 fixes: the woven mat, carved teak, the darker
 * hollow of a recess, ink, the two seed colours, brass. What is added here
 * are *steps within those hues* — a raised and a sunk mat, a lit rim and a
 * grain in shadow on the teak — because a carved board needs light falling
 * across it to read as carved, and one flat brown does not. No new colour
 * enters the palette.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mat: {
          DEFAULT: '#E4DDCD',
          /** Raised on the mat: panels, cards, the header rail. */
          high: '#EFEAE0',
          /** Set into the mat: wells, inputs, code fields. */
          low: '#D7CFBC',
          /** The fibre reading darker where a panel edge meets it. */
          edge: '#C6BCA5',
        },
        teak: {
          DEFAULT: '#7B5533',
          /** Where light catches a rim worn smooth by hands. */
          rim: '#9C7047',
          /** The grain in shadow along the length of the board. */
          grain: '#66442A',
        },
        hollow: {
          DEFAULT: '#5A3D25',
          /** The bottom of a recess, where no light reaches. */
          deep: '#3A2617',
        },
        ink: '#241C14',
        seedA: '#F0E7D4',
        seedB: '#8E3B2E',
        brass: '#A8863C',

        /**
         * Text tones, from the CSS variables in globals.css. These are the
         * only colours text should ever use: `text-fg` and `text-fg-muted`
         * on the mat, `text-fg-wood` and `text-fg-wood-muted` on the board.
         *
         * They are deliberately not opacity steps of `ink`. Text built out
         * of `text-ink/45` looked like hierarchy and was actually a
         * contrast failure — 21 of the app's 34 text styles sat under
         * 4.5:1. A named tone can be measured once and trusted.
         */
        fg: {
          DEFAULT: 'var(--fg)',
          muted: 'var(--fg-muted)',
          wood: 'var(--fg-wood)',
          'wood-muted': 'var(--fg-wood-muted)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          strong: 'var(--accent-strong)',
        },
      },
      /**
       * One scale. `text-xs` and up are reading sizes; `text-2xs` exists
       * only for counts on the board and the odd chip, and nothing is
       * smaller than that.
       *
       * Seven steps, seven names. There used to be nine names over the same
       * seven steps — xl and 2xl were the same size, 3xl and 4xl were the
       * same size — so `sm:text-4xl` was a class that did nothing and two
       * different names rendered identically. A name now predicts a size.
       */
      fontSize: {
        '2xs': ['var(--step-000)', { lineHeight: '1.35' }],
        xs: ['var(--step-00)', { lineHeight: '1.45' }],
        sm: ['var(--step-0)', { lineHeight: '1.5' }],
        base: ['var(--step-1)', { lineHeight: '1.55' }],
        lg: ['var(--step-2)', { lineHeight: '1.4' }],
        xl: ['var(--step-3)', { lineHeight: '1.25' }],
        '2xl': ['var(--step-4)', { lineHeight: '1.15' }],
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontVariantNumeric: {
        tabular: 'tabular-nums',
      },
      /** Sasaran tekan terkecil (WCAG 2.5.8), dari satu variabel. */
      minHeight: { target: 'var(--target-min)' },
      minWidth: { target: 'var(--target-min)' },
      /**
       * The rhythm declared in globals.css's `--space-*` — seven steps, the
       * same count and the same idea as the type scale above. Named rather
       * than overriding Tailwind's own `1`–`7`: this app's spacing already
       * leans on that default scale's finer steps (`0.5`, `1.5`, `2.5`,
       * `w-5`, `gap-6`, and so on) throughout, at their default meanings,
       * and silently redefining those numerals out from under existing
       * classes is exactly the kind of change a clean build and a green
       * test suite would not catch (CLAUDE.md's own "Current state" lists
       * five UI defects of that shape). `p-space-4` now resolves to the
       * declared rhythm; `p-4` keeps meaning what it already meant.
       */
      spacing: {
        'space-1': 'var(--space-1)',
        'space-2': 'var(--space-2)',
        'space-3': 'var(--space-3)',
        'space-4': 'var(--space-4)',
        'space-5': 'var(--space-5)',
        'space-6': 'var(--space-6)',
        'space-7': 'var(--space-7)',
      },
      borderRadius: {
        /** One continuous carved form, not fourteen cards (PRD §11). */
        board: '2.75rem',
        panel: '1.25rem',
      },
      boxShadow: {
        /** The board sitting on the mat, with a lit top rim. */
        carve:
          '0 22px 44px -18px rgba(36,28,20,0.55), inset 0 2px 0 rgba(240,231,212,0.12), inset 0 -16px 26px -20px rgba(0,0,0,0.5)',
        /** A lubang: a recess, read by depth and not by a border. */
        recess: 'inset 0 4px 9px rgba(0,0,0,0.6), inset 0 -2px 0 rgba(240,231,212,0.07)',
        /** The lumbung is deeper than a lubang, because it is. */
        bank: 'inset 0 7px 16px rgba(0,0,0,0.68), inset 0 -2px 0 rgba(240,231,212,0.08)',
        /** A panel raised off the mat. Light, or it competes with the board. */
        raise: '0 1px 2px rgba(36,28,20,0.06), 0 8px 20px -14px rgba(36,28,20,0.35)',
      },
      backgroundImage: {
        /**
         * A single length of hardwood, hollowed (PRD §11): grain running the
         * length of the board, and the light falling on it from above. Both
         * are needed for the slab to read as carved rather than as a brown
         * rectangle.
         */
        grain:
          'repeating-linear-gradient(91deg, rgba(58,38,23,0.05) 0 1px, rgba(58,38,23,0) 1px 13px), repeating-linear-gradient(89.4deg, rgba(58,38,23,0.045) 0 1px, rgba(58,38,23,0) 1px 31px), radial-gradient(130% 90% at 50% -10%, rgba(240,231,212,0.15), rgba(240,231,212,0) 58%)',
        /** The inside of a recess: darkest at the bottom, where hands never reach. */
        pit: 'radial-gradient(85% 75% at 50% 22%, rgba(0,0,0,0.34), rgba(0,0,0,0) 70%)',
      },
      keyframes: {
        /** A seed landing: §11's small settle, and nothing louder. */
        settle: {
          '0%': { transform: 'translateY(-14%) scale(0.94)' },
          '60%': { transform: 'translateY(2%) scale(1.02)' },
          '100%': { transform: 'translateY(0) scale(1)' },
        },
        /** The faint highlight on the hole under consideration. */
        breathe: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.85' },
        },
      },
      animation: {
        settle: 'settle 180ms cubic-bezier(0.2, 0.8, 0.3, 1)',
        breathe: 'breathe 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
