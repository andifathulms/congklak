import type { Config } from 'tailwindcss'

/**
 * Semantic tokens only — PRD §11. Components never use raw hex.
 * `brass` marks the active hole and capture events, and nothing else.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mat: '#E4DDCD',
        teak: '#7B5533',
        hollow: '#5A3D25',
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
    },
  },
  plugins: [],
}

export default config
