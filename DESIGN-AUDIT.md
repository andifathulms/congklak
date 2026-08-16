# Design Audit — Congklak

Factual survey of the codebase as it stands. No recommendations.

## 1. What this app is

Congklak is a static, open-source implementation of congklak/dakon (a mancala-family board game) built as a personal project, distinguished from a generic mancala engine by treating regional rule variants (Javanese/Sleman, a general Indonesian ruleset, and a Malay/Sumatran variant) as explicit, cited, selectable data rather than one silent default. It ships hotseat play first, then a minimax AI opponent running in a worker, then WebRTC peer-to-peer play, plus a rules-comparison view, a learn mode, and a puzzle mode. UI is Indonesian-first with English as a second locale.

The core object is the 16-hole board (`Int8Array(16)` in the engine: holes 0–6 and 8–14, lumbung/granary at 7 and 15). It is rendered by `components/board/Papan.tsx`, which composes `Lubang.tsx` (a hole), `Lumbung.tsx` (a granary), and `Biji.tsx` (seed glyphs) into one continuous carved-board object rather than 14 separate card elements.

## 2. Stack & constraints

- **Framework/build:** Next.js 14.2.15, App Router, React/React-DOM 18.3.1, TypeScript 5.5.3, Tailwind CSS 3.4.6, Zod 3.23.8, Vitest 2.0.5, pnpm 9.15.9 (`packageManager` field).
- **Deploy target:** `next.config.js` sets `output: 'export'` (static export), `basePath` from env `BASE_PATH` (default `/congklak`), `trailingSlash: true`, `images: { unoptimized: true }`, `reactStrictMode: true`. `package.json`'s `build` script runs `pnpm rulesets:validate && next build`; deployment itself is handled by a GitHub Actions workflow, not a package.json script.
- **Routing:** App Router with a `[locale]` dynamic segment (`app/[locale]/...`) for `id`/`en`, plus a separate `app/(alih)/page.tsx` route group outside the locale segment that redirects `/` to a default locale.
- **Network dependency:** `peerjs` 1.5.4, used for WebRTC signaling only (P2P play).
- **Styling approach:** Tailwind CSS with a closed, semantic-only token set defined in `tailwind.config.ts` (no raw hex permitted in components per the file's own header comment). Theme block, verbatim:

```ts
theme: {
  extend: {
    colors: {
      mat: {
        DEFAULT: '#E4DDCD',
        high: '#EFEAE0',
        low: '#D7CFBC',
        edge: '#C6BCA5',
      },
      teak: {
        DEFAULT: '#7B5533',
        rim: '#9C7047',
        grain: '#66442A',
      },
      hollow: {
        DEFAULT: '#5A3D25',
        deep: '#3A2617',
      },
      ink: '#241C14',
      seedA: '#F0E7D4',
      seedB: '#8E3B2E',
      brass: '#A8863C',
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
    fontVariantNumeric: { tabular: 'tabular-nums' },
    minHeight: { target: 'var(--target-min)' },
    minWidth: { target: 'var(--target-min)' },
    borderRadius: {
      board: '2.75rem',
      panel: '1.25rem',
    },
    boxShadow: {
      carve: '0 22px 44px -18px rgba(36,28,20,0.55), inset 0 2px 0 rgba(240,231,212,0.12), inset 0 -16px 26px -20px rgba(0,0,0,0.5)',
      recess: 'inset 0 4px 9px rgba(0,0,0,0.6), inset 0 -2px 0 rgba(240,231,212,0.07)',
      bank: 'inset 0 7px 16px rgba(0,0,0,0.68), inset 0 -2px 0 rgba(240,231,212,0.08)',
      raise: '0 1px 2px rgba(36,28,20,0.06), 0 8px 20px -14px rgba(36,28,20,0.35)',
    },
    backgroundImage: {
      grain: 'repeating-linear-gradient(91deg, rgba(58,38,23,0.05) 0 1px, rgba(58,38,23,0) 1px 13px), repeating-linear-gradient(89.4deg, rgba(58,38,23,0.045) 0 1px, rgba(58,38,23,0) 1px 31px), radial-gradient(130% 90% at 50% -10%, rgba(240,231,212,0.15), rgba(240,231,212,0) 58%)',
      pit: 'radial-gradient(85% 75% at 50% 22%, rgba(0,0,0,0.34), rgba(0,0,0,0) 70%)',
    },
    keyframes: {
      settle: {
        '0%': { transform: 'translateY(-14%) scale(0.94)' },
        '60%': { transform: 'translateY(2%) scale(1.02)' },
        '100%': { transform: 'translateY(0) scale(1)' },
      },
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
```
No `darkMode` key is set in this config.

- **Vis/animation/chart libraries actually imported:** none. Grepping `app/`, `components/`, `lib/` for `framer-motion`, `d3`, `gsap`, `recharts`, `three` returns zero real imports (only false-positive text matches on the English word "three"). None of these packages appear in `package.json`. All motion is hand-built: Tailwind `@keyframes`/CSS transitions plus a custom event-stream animation player in `components/sow/`.
- **i18n:** `lib/i18n.ts` defines `LOCALES = ['id', 'en']`, `DEFAULT_LOCALE = 'id'`; every route lives under `app/[locale]/`.
- **Mobile:** `Papan.tsx` switches from a 2-column stacked grid below the `sm:` breakpoint to a 3-column grid (`sm:grid-cols-[minmax(3.5rem,1fr)_7fr_minmax(3.5rem,1fr)] sm:grid-rows-2`) at and above it, with an inline comment documenting this as the board "standing upright" on phones — same DOM, no separate mobile component. Only `sm:` and `md:` breakpoints are used in the board component; no `lg:`/`xl:`/`2xl:`.
- **Other constraints stated in the repo:** static hosting (GitHub Pages), no backend, `images: { unoptimized: true }` (no image-optimization server), a minimum touch target of `1.5rem` (24px, WCAG 2.5.8) wired through a single CSS variable.

## 3. Visual system as-built

**Colours.** All colours are defined once in `tailwind.config.ts` (block above): `mat` (4 steps), `teak` (3 steps), `hollow` (2 steps), `ink`, `seedA`, `seedB`, `brass`, `fg` (4 steps, via CSS vars), `accent` (2 steps, via CSS vars) — 18 named values total. Grepping for raw hex (`#[0-9a-fA-F]{3,8}`) outside `tailwind.config.ts` across `app/` and `components/` returns 9 matches, all in `app/globals.css` (6, the `--fg`/`--accent` CSS-variable definitions shown below) and `app/dasar.ts` (1, a `theme-color` meta tag, `#E4DDCD`). Zero raw hex values appear inside any component file. Colours are fully centralised in `tailwind.config.ts` + `app/globals.css:44-55`.

**Fonts.** Three families loaded via `next/font/google` in `app/dasar.ts`: `Space_Grotesk` (`--font-display`), `IBM_Plex_Sans` (`--font-sans`, weights 400/500/600), `IBM_Plex_Mono` (`--font-mono`, weights 400/500). CSS variables are applied to `<html>` in `app/[locale]/layout.tsx`. Font sizes are a single 7-step scale defined as CSS vars in `globals.css:25-31` (12px, 13px, 14px, 16px, 20px, 26px, 34px) and mapped into Tailwind's `fontSize` key. Usage counts across `components/`+`app/`: `text-sm` 39, `text-xs` 37, `text-2xs` 28, `text-lg` 9, `text-xl` 7, `text-base` 6, `text-2xl` 5. Weight usage: `font-bold` 22, `font-medium` 20, `font-semibold` 2, `font-normal` 1.

**Spacing.** A second, separate spacing scale is defined as CSS variables in `globals.css:70-76` (`--space-1` through `--space-7`, 0.25rem to 3rem), documented in a comment as "the rhythm the page is built on." This scale is not wired into Tailwind's `spacing` theme key (only `minHeight`/`minWidth: target` are extended for the touch-target token). Tailwind spacing utilities (`p-`, `gap-`, `m-`) used throughout components therefore draw on Tailwind's own default spacing scale, not on `--space-*`.

**Border-radius.** Two custom tokens: `board: 2.75rem`, `panel: 1.25rem`. Usage counts: `rounded-full` 24, `rounded-panel` 14, `rounded-lg` 9, `rounded-xl` 3, `rounded-md` 1, `rounded-board` 1, plus 2 arbitrary-value instances.

**Shadows.** Four custom tokens defined in `tailwind.config.ts` (`carve`, `recess`, `bank`, `raise`, values above). Usage: `shadow-raise` 13 (general panel elevation), `shadow-recess` 1, `shadow-carve` 1, `shadow-bank` 1 — each token is used at least once.

**Dark mode.** No `darkMode` key in `tailwind.config.ts`; grepping `dark:` across `components/`, `app/`, and the config returns zero occurrences. Dark mode is entirely absent from the codebase.

**Focus ring / contrast.** A single focus-visible treatment is defined once in `globals.css:107-112` (`outline: 2px solid theme('colors.ink')`), with one documented override for the board surface (`globals.css:115`, switches outline colour to `seedA` inside `.on-teak`). `globals.css:44-55` states measured contrast ratios for every `fg`/`accent` token against every surface it is used on, and a comment at `tailwind.config.ts:53` records that a prior version of the app had "21 of the app's 34 text styles" under 4.5:1 contrast, tied to using `ink` at various opacities instead of named tones.

## 4. Screen & component inventory

**Routes** (`app/[locale]/*/page.tsx`, 7 total, plus one outside the locale segment):

- `main/page.tsx` — hotseat + AI game. Renders `Pembuka` (landing intro) then `Permainan` (the game screen itself).
- `tanding/page.tsx` — P2P play. Renders `Kepala` (page header) then `Tanding` (connect/host/join flow).
- `ulang/page.tsx` — replay viewer. Renders `Kepala` then `Ulang` (decode a shared game code, replay it).
- `aturan/page.tsx` — ruleset selector and sources. Renders `Kepala`, then per-ruleset `Panel`s containing a `Papan` board preview and `Lencana` source-confidence badges, plus `TautanTombol` links.
- `banding/page.tsx` — ruleset comparison. Renders `Kepala` then `Banding` (side-by-side divergence replay).
- `belajar/page.tsx` — learn mode. Renders `Kepala` then `Belajar` (3 curated positions).
- `teka/page.tsx` — puzzle mode. Renders `Kepala` then `TekaTeki`.
- `app/(alih)/page.tsx` — a route-group page (not under `[locale]`) that redirects `/` to the default locale.

**components/ directory structure:** `board/`, `connect/`, `game/`, `learn/`, `preview/`, `shell/`, `sow/`, `teka/`, `ui/`. There is no `stats/` or `dashboard/` directory — stats logic lives in `components/game/stats.ts`.

**Component-by-component, one line each:**

- `board/Papan.tsx` — the full 16-hole board: rows, lumbungs, clockwise orientation, mobile stacked layout.
- `board/Lubang.tsx` — a single hole rendered as a button: seed pile, count, active/secondary/playable/preview states, ARIA label.
- `board/Lumbung.tsx` — a granary end-hole, visually deeper than a lubang, owner name + banked count.
- `board/Biji.tsx` — individual/stacked seed glyphs; shape (round vs. faceted), not colour alone, distinguishes the two owners.
- `game/Permainan.tsx` (572 lines, largest file in the app) — main game screen: board, score header, move controls, ruleset picker, source panel, history panel, AI hook, local stats panel.
- `game/Skor.tsx` — score/turn-status strip above the board: both sides' banked counts, lead, "in hand"/AI-thinking status line.
- `game/Ulang.tsx` — decodes and replays a shared game code; renders an inline error string on invalid input.
- `game/Banding.tsx` — side-by-side replay showing where two rulesets diverge on the same move sequence.
- `game/PemilihAturan.tsx` — ruleset selector, built on the shared `Segmen` control.
- `game/AturanLain.tsx` — panel listing where other rulesets would have ruled differently on the move just played.
- `game/rujukan.ts`, `game/stats.ts` — non-visual: citation lookup, local win/loss stats persisted to `localStorage`.
- `game/useAi.ts` — hook wrapping the AI Web Worker; promise-based, no explicit boolean loading flag.
- `connect/Tanding.tsx` (512 lines, second-largest file) — full P2P host/join flow over PeerJS with manual-paste fallback, inline error state.
- `learn/Belajar.tsx` — 3-position guided learning mode using the real engine (`applyMove`) plus the board and preview components.
- `teka/TekaTeki.tsx` — puzzle mode (reach a target seed count), uses board, preview, and reduced-motion-aware sowing.
- `preview/ringkas.ts` — runs `applyMove` on a scratch board copy to produce move-chain previews (a real simulation, not an approximation).
- `sow/frames.ts`, `sow/usePenaburan.ts`, `sow/suara.ts`, `sow/TombolSuara.tsx` — the sowing animation/sound system (detailed in §5).
- `ui/Panel.tsx` — the app's one raised-surface container primitive.
- `ui/Tombol.tsx` / `TautanTombol.tsx` — buttons in 3 weights (`utama`/`kedua`/`sunyi`).
- `ui/Segmen.tsx` — the one segmented-control primitive, reused for mode, difficulty, speed, and ruleset selection.
- `ui/Lencana.tsx` — a source-confidence badge.
- `ui/Salin.tsx` — copy-to-clipboard control for game codes.
- `shell/Kepala.tsx` — shared page header/h1.
- `shell/Navigasi.tsx` — top navigation, marks the current section.
- `shell/Pembuka.tsx` — landing-page intro text/hero content.
- `shell/ContohGiliran.tsx` — an animated example-turn demo shown on the landing page.
- `shell/GantiBahasa.tsx` — language switcher.
- `shell/TandaPembuat.tsx` — creator credit line with inline SVG icons.

**Board sizing (`Papan.tsx`):** container is `mx-auto w-full max-w-[10.5rem] p-3 ... sm:max-w-none sm:p-6` — below `sm:`, the board is capped at 10.5rem (168px) wide; at and above `sm:`, the max-width cap is removed and the board grows to fill its container (itself inside a `max-w-5xl` page shell set in `app/[locale]/layout.tsx`). The inner grid switches from `grid-cols-2` (mobile) to `sm:grid-cols-[minmax(3.5rem,1fr)_7fr_minmax(3.5rem,1fr)] sm:grid-rows-2` (desktop). No `aspect-ratio` or viewport-unit (`vw`/`vh`) sizing is used anywhere in the board component; sizing is rem/grid-driven, not viewport-relative.

## 5. Interaction & state

**Inputs.** Grepping `onClick|onKeyDown|onTouchStart|onPointerDown|onDrag` across `components/**/*.tsx` returns 29 matches across 10 files (`Belajar.tsx`, `Lubang.tsx`, `ContohGiliran.tsx`, `TekaTeki.tsx`, `TombolSuara.tsx`, `Permainan.tsx`, `Banding.tsx`, `Tanding.tsx`, `Salin.tsx`, `Ulang.tsx`). No matches for `onTouchStart`, `onPointerDown`, or `onDrag` specifically — holes are standard clickable elements; there is no custom touch or drag handling.

**Accessibility hooks present.** `aria-label` 23 occurrences, `aria-hidden` 12, `aria-live` 6, `aria-pressed` 3, `aria-current` 3, `role=` 8, `tabIndex` 1 (a deliberate `tabIndex={-1}` on the board container, used as a focus-return target after a move rather than a tab stop).

**Animation mechanism.** No animation library is used. `components/sow/frames.ts` converts engine `GameEvent[]` output into a sequence of `Frame` objects (cell values, hand contents, active/secondary highlights); `components/sow/usePenaburan.ts` steps through those frames on a `setTimeout` loop with 4 named speed multipliers (`pelan`/`sedang`/`cepat`/`langsung`) and checks `window.matchMedia('(prefers-reduced-motion: reduce)')`. `transition` classes are used 18 times, `transition-shadow` once. The Tailwind `animate-settle` and `animate-breathe` utilities are defined in the config but grepping for their class usage across `components/` and `app/` returns zero matches. No `requestAnimationFrame` call exists anywhere in `components/` or `app/`.

**Reduced motion.** Handled in two places: `globals.css:126-135` forces `animation-duration`/`transition-duration` to `0.01ms` globally under `prefers-reduced-motion: reduce`; `usePenaburan.ts` separately checks the same media query in JS and substitutes a written text summary of the sow instead of animating it.

**Loading/empty/error states.**
- No `isLoading` boolean exists anywhere in the codebase (zero grep matches).
- AI "thinking" state is passed as a `berpikir: boolean` prop into `Skor.tsx` and rendered as a status line, not a spinner.
- `Ulang.tsx` returns a `{ error: string }` union on a bad game code and renders that string inline.
- `Tanding.tsx` sets a `galat` (error) state in 3 catch blocks, surfaced inline in the connect UI.
- `Permainan.tsx` has an `emptyRecord()` function used for a fresh/reset game — a data-model reset rather than a distinct empty-state UI treatment.
- No dedicated first-visit state, empty-state illustration, or no-result state was found.

## 6. Weak points, stated plainly

- `PanelStatistik` (`components/game/Permainan.tsx:472-505`) renders the local win/loss/streak stats as a `<dl>` of plain label/number pairs (`dt`/`dd` text), with no chart, bar, or other visual encoding — the only numeric summary display in the app that is rendered as bare text rather than paired with a visual form, in contrast to the board itself where every count is paired with a rendered seed pile.
- `animate-settle` and `animate-breathe` are defined as Tailwind animation tokens in `tailwind.config.ts` but have zero matching class usages anywhere in `components/` or `app/`.
- Two parallel spacing systems coexist: a `--space-*` CSS-variable scale in `globals.css` (documented as "the rhythm the page is built on") and Tailwind's own default spacing scale, which is what `p-`/`gap-`/`m-` utility classes actually draw from, since `spacing` is not extended in `tailwind.config.ts`.
- No `Card` component exists anywhere in `components/` (zero grep matches for `Card`); `flex` is used 98 times across `components/`+`app/` versus `grid-cols-*` only 9 times, and the grid usage is concentrated in the board itself and its rows rather than used as a general page-layout mechanism.
- Dark mode has no implementation: no `darkMode` config key, zero `dark:` class usages anywhere in the codebase.
- There is no custom touch/drag/pointer handling for board interaction (no `onTouchStart`, `onPointerDown`, or `onDrag` in any component) — hole selection relies on native click/keyboard semantics only.
- A single focus-visible outline style is defined for the whole app (`globals.css:107-112`), with one explicit override for text sitting on the wood surface (`globals.css:115`); no other exceptions or additional focus treatments were found.
- `globals.css:44-55` documents specific contrast ratios for every text/surface pairing and states that a prior version of the app had 21 of 34 text styles under 4.5:1 contrast; the current values as read in the file meet or exceed 4.5:1 in every documented pairing.

## Open questions

- Whether `animate-settle`/`animate-breathe` are truly dead code, or are applied through a mechanism (dynamic class construction, inline `style`, a `cva`/`clsx` variant map) that a static grep for the literal class strings would miss — this would require tracing every call site that touches `Biji.tsx` or `Lubang.tsx` render paths at runtime to confirm.
- Whether the `--space-*` CSS variables in `globals.css` are consumed anywhere via inline `style` attributes or raw CSS rather than Tailwind utility classes — this audit found the variables declared but did not exhaustively trace every consumer.
- The exact viewport-width breakpoint at which the board's `sm:` mobile-to-desktop layout switch occurs was not measured against real device widths, only read from the Tailwind default `sm:` breakpoint (640px) implied by the class names.
- Whether any additional loading/error/empty treatments exist inside the AI worker (`workers/ai.worker.ts`) or the P2P transport layer (`lib/net/`) beyond what surfaces in the `Tanding.tsx`/`useAi.ts` component code reviewed here — those files were not read in full.
