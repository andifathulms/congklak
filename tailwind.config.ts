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
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontVariantNumeric: {
        tabular: 'tabular-nums',
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
