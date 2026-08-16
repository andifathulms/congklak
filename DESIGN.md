# DESIGN.md — Congklak

Design specification for the visual and structural rework. Read in full before changing any file. `PRD.md` fixes scope; `CLAUDE.md` governs the engine, the ruleset packs, and the working style. This file governs what the user sees.

Precedence: every invariant in `CLAUDE.md` outranks this document. In particular invariant 1 (seed conservation asserted, never assumed), invariant 7 (rule variation lives in packs, never in code branches), invariant 17 (the renderer never computes outcomes), invariant 18 (seed ownership is never colour alone), and invariant 19 (traditional vocabulary is preserved). Nothing here may put a rule in a component, present one ruleset as the rules, or flatten a Bugis— or Javanese-language term into an English approximation.

---

## 0. The thesis

Your own `CLAUDE.md` states it: *"When sources conflict on a rule, do not pick silently. Record both, cite both, and surface the divergence — **that is the product**."*

Divergence currently lives in three places: `/aturan` (the selector and sources), `/banding` (the side-by-side comparison), and `AturanLain` — a panel inside a 572-line game screen that tells you where other rulesets *would have* ruled differently on the move you already played.

All three are retrospective or separate. None of them is present at the only moment that matters, which is when a player is deciding between holes.

**The fix: the move preview shows the fork.** `preview/ringkas.ts` already runs `applyMove` on a scratch board copy to produce a real simulated preview rather than an approximation. Running it once per loaded pack is three pure calls on a 16-byte array. When the packs disagree about the move under consideration, say so — on the board, before the move, naming the pack.

Divergence stops being a thing the app reports and becomes a thing the app plays with.

Nothing else here is a craft problem. The token set is closed and semantic with zero raw hex in any component. `brass` is reserved to the active hole and captures, with a `CLAUDE.md` note listing every element that had borrowed it. Seed ownership is carried by shape as well as colour. The focus ring is defined once with one documented override for text on wood. Contrast ratios are measured per surface, after a version where 21 of 34 text styles failed. The board is one DOM at every size and stands upright on phones rather than forking into a second component. Keep all of it.

---

## 1. Decisions made — do not relitigate

1. **`PratinjauSimpang`** — the divergence preview — lives in the game (§4). `/banding` stays as the deliberate study surface; `AturanLain` keeps its retrospective role.
2. **The game screen becomes phase-aware** (§5), reconciled with the sibling project rather than diverging from it.
3. **Fixed light, deliberately** (§3.3). No dark mode, no toggle.
4. The palette, the elevations, the wood backgrounds, and the reserved meaning of `brass` are **frozen** (§3).
5. The board stays one DOM at every size. No mobile fork, ever.
6. No new animation mechanism. The existing frames player carries everything.

---

## 2. House layer — portable across the portfolio

**Version 6.** One new rule, and this project earned it more clearly than any other.

### 2.1 Core-object dominance
The core object is the largest element, first rendered, legible in full at default state.

### 2.2 The homepage asks the product's question
The front page is where the product's central question gets asked and answered.

### 2.3 Absorption requires shared axes
A component folds into the core object only if it plots the same data on the same axes.

### 2.4 The stated differentiator is never a disclosure
If the PRD names a thing as what makes the product different, it is not behind a toggle, a panel, a secondary route, or a retrospective note.

### 2.5 Theme count is set by the use environment
One theme or two, stated deliberately, decided by where and on what the app is used.

### 2.6 Verify what the document claims
A claim in a design document with nothing checking it is a bug in the document.

### 2.7 Document remediation in place
Record what was found, what was fixed, and why, in the file, in first person.

### 2.8 Make the wrong thing unrepresentable
Where a rule can be moved into a token override, a schema, or a failing test, move it. Prose then explains the constraint instead of being the constraint.

### 2.9 Verify against rendered output, not source — new

**A design system is only as real as the pixels it produces. Read the built artifact, in a real browser, with a ruler.**

`CLAUDE.md`'s "Current state" section lists five UI defects that a green test suite and a clean static export could not see — an AI that never moved at any animated speed, a stats panel that never appeared, a handshake captured by value and never sent, a broker that could hang forever with no error, and a board that collapsed to 160px on a phone. Two of them are design defects outright. And the sixth is the one every project in this portfolio should fear:

> The three typefaces the PRD specifies were named as CSS variables that nothing ever loaded, so every one fell through to the system UI face — a design system that existed only on paper, and no test could see it.

That is a complete typographic system, specified, documented, tokenised, and absent from the running app. No linter, no type check, no unit test, and no reading of the stylesheet would find it. Only opening the built site and looking would.

Every project in this portfolio ships a design document full of claims about rendered output. This is the rule that makes those claims checkable: **before calling a visual change done, serve the production build, open it on a real device, and measure.**

---

## 3. Identity — frozen

### 3.1 Do not re-tune

- The full token set: `mat` (4 steps), `teak` (3), `hollow` (2), `ink`, `seedA`, `seedB`, `brass`, `fg` (4), `accent` (2)
- The named elevations `carve` / `recess` / `bank` / `raise`, and the `grain` / `pit` backgrounds
- The type scale and its `--step-*` backing
- The single focus-visible treatment and its one `.on-teak` override
- The measured contrast ratios in `globals.css:44-55`

### 3.2 `brass` stays reserved

`brass` marks the active hole and captures. Nothing else. `CLAUDE.md` already lists every element that borrowed it — focus, learn-mode correctness, desync, ruleset divergence — and every one was taken back.

**This constrains §4 directly.** The divergence marking uses `bg-ink text-mat`, the treatment already assigned to it, not brass. A fork in the rules is not a capture and must not look like one.

### 3.3 One theme, stated

Fixed light. No `darkMode` key, no `dark:` classes, no toggle.

This is a deliberate choice, not an omission. The palette is a carved teak board on a woven mat — the material has no dark mode, it has lighting. And every ratio in `globals.css` was measured against these specific surfaces after a version in which 21 of 34 text styles were under 4.5:1. Re-deriving eighteen tokens and re-measuring every pairing to obtain a mode the material metaphor rejects is a bad trade.

---

## 4. `PratinjauSimpang` — the divergence preview

### 4.1 What it does

On hover or focus of a playable hole, the existing preview shows where the sow ends under the active ruleset. `PratinjauSimpang` adds: **where it would end under each other implemented pack, when that differs.**

### 4.2 Data

`preview/ringkas.ts` already runs the real engine on a scratch copy. Call it once per implemented pack. Three packs, one pure function, a 16-byte `Int8Array` — this is free.

Per invariant 17, the renderer still computes nothing; it calls the engine, exactly as the existing preview does.

### 4.3 What is shown

- The active ruleset's outcome is always shown, in the current preview treatment.
- Another pack's outcome is shown **only where it differs** — a different landing hole, a relay that continues or stops, a capture that fires or doesn't.
- Where a pack agrees, nothing is drawn for it. Silence means agreement, and that has to be reliable enough to be read as information.

### 4.4 How it is marked

- Divergent continuation: the `bg-ink text-mat` treatment (§3.2), as a dashed trace and a marked hole. Never `brass`.
- **The diverging pack is named**, by its readable id, with its `Lencana` source-confidence badge. Never "another ruleset" — the whole point is that variants have provenance.
- One line of plain copy states what differs, in the register the app already uses: *"jawa-sleman: relay lanjut dua lubang."*
- At most two divergent packs shown at once. Beyond that, a count plus a link to `/banding`.

### 4.5 Implemented divergence, not recorded divergence

`CLAUDE.md` draws a distinction this component must respect. Some divergences are **implemented** — they exist as packs and produce different engine output. Others are **recorded** — a source contradicts the others and the contradiction is documented without being implemented, because recording a contradiction is not treating it as equally weighted. detikEdu's inversion of *menembak* is recorded, not implemented.

- `PratinjauSimpang` shows only differences between implemented packs, because those are the only ones with a computed outcome to show.
- Recorded-but-not-implemented divergences stay where they are: in the source note and on `/aturan`, described in prose with their weight declared.
- Do not infer a preview from a recorded divergence. That would be the app picking a reading, which is the one thing this product is designed not to do.

### 4.6 It is not advice

The preview says *these rules disagree here.* It never says which move to play, never ranks packs, and never implies the active pack is the correct one.

- No "recommended" marking, no ordering by outcome quality.
- The active pack is named as active, not as right.
- `PRD.md`'s framing holds: the app names the active ruleset and shows where variants diverge. Never presents one as the rules.

### 4.7 Accessibility

- Holes are already buttons; the preview must fire on focus as well as hover, and the divergence line must be announced through the existing live region.
- The marking never relies on colour: the dashed trace, the named pack, and the copy line are three independent carriers.
- Static. No animation on a preview — the player is reading, not watching.

---

## 5. The game screen becomes phase-aware

`Permainan.tsx` is 572 lines and mounts everything at once: board, score header, move controls, ruleset picker, source panel, history panel, AI hook, stats panel. The ruleset picker sits below the board during an active game; the stats panel is present before a game has been played.

This is the same failure the sibling project has, in the project that was meant to inherit its patterns. Reconcile rather than diverge — same phase model, same names, same derivation.

Four phases, **derived from state, never stored**, computed in `lib/` beside the other readings:

- **`siap`** — before the first move. Ruleset picker, mode, difficulty, board at full size and empty-ready. No score strip, no history, no stats.
- **`main`** — in progress. Board, `Skor`, move controls, preview, history. Ruleset picker and stats unmount; a way back to setup stays in the controls.
- **`setelah`** — a move has just resolved. `AturanLain` promotes for that turn if another pack would have ruled differently, then demotes. If no pack diverged, it does not appear at all.
- **`selesai`** — game over, **including draws** (invariant 14: 98 is even, 49–49 happens, and the terminal UI must handle it as a real outcome rather than an absent winner). Result, stats, share code, replay link. Board stays at full size with the final position.

**The board's rendered size is constant across phases within a session**, fixed at `main`'s budget. A board that grows when the game ends makes the final position visually different from the position that was played.

An instrument with nothing to say is not mounted — not greyed, not collapsed to a header. Absent.

---

## 6. The board on a phone — measure first

`Papan.tsx` caps the board at `max-w-[10.5rem]` — 168px — below the `sm:` breakpoint, and no `aspect-ratio` or viewport-unit sizing exists anywhere in the component. Upright, that is two columns of seven holes plus two *lumbung*, at a width that leaves each hole around 70px and a total height that almost certainly exceeds the viewport once `Skor` and the controls are accounted for.

`CLAUDE.md` records that this board already collapsed to 160px once, from a bug no test could see.

**Measure before changing anything.** Serve the production build, open it at 360×640, 390×844 and 430×932, and record the board's rendered width and height and how much of it is above the fold in each phase. Then size it from the viewport the way the sibling project does — height budget minus measured chrome, per phase — with the measured constants and their measurement date in a comment.

Do not fork a second mobile board. The upright quarter turn is correct: the sow still reads clockwise and opposite holes still sit beside each other, which is what `opposite()` and *menembak* depend on being visible.

#### Measured — 2026-08-16

Production export (`pnpm build && pnpm preview`), driven headless at `/id/main/`, fresh hotseat game (`siap`/`main` boundary, no move played), device-pixel-ratio 2 for screenshot legibility, CSS-px numbers below. Route `/main` renders the landing page (`Pembuka`, including the `ContohGiliran` demo board) directly above `Permainan`, and the page header is `position: sticky; top: 0` (`app/[locale]/layout.tsx:42`), permanently occluding the top of the viewport at every scroll position. Both facts turned out to matter more than the board's own CSS.

**Sticky header height, all three widths: 131.5px**, constant (same mobile nav layout at 360, 390 and 430 — the header only reflows at the `sm:`/`md:` breakpoints, none of which these three widths reach).

**Cold load, no scrolling — the board is not on screen at any of the three sizes:**

| Viewport | Board's distance down the page | Board visible at first paint |
|---|---|---|
| 360×640 | 1916.8px | 0% |
| 390×844 | 1822.2px | 0% |
| 430×932 | 1769.3px | 0% |

At every tested width, the full first screen is landing copy — the hero heading, three bullet points, and the `ContohGiliran` demo panel — not the playable board. Reaching the real board takes roughly 1.9–2.8 screen-heights of scrolling (fewer screen-heights at the taller sizes, since the landing content above it doesn't grow with viewport height).

**Scrolled to the game section** (Skor placed directly under the sticky header — the closest the board can get to the top without the header itself covering it):

| Viewport | Effective height below header | Skor visible | Board visible | Preview line + controls row visible |
|---|---|---|---|---|
| 360×640 | 508.5px | 100% (101px) | 55.9% (391 of 700px — cut mid-way through the 4th hole row) | 0% |
| 390×844 | 712.5px | 99.7% | 85.1% (cut in the last hole row, before B's *lumbung*) | 0% |
| 430×932 | 800.5px | 99.8% | 97.7% (only the base of B's *lumbung* clipped) | 0% |

The board's own rendered footprint is **168×700px at all three widths** — the `max-w-[10.5rem]` cap (168px) governs it below `sm:`, so 360, 390 and 430 produce an identical board size; only the surrounding chrome (the sticky header, and how much viewport height is left over) changes what fraction of it clears the fold. This is a smaller version of the same defect class `CLAUDE.md` records the board once collapsing to 160px from — not that bug specifically (this build is stable at 168px, doesn't collapse further), but the same shape: a fixed pixel cap that ignores the viewport it's rendered into.

The move-preview line and the controls row (New game / Undo / speed) never clear the fold at any of the three sizes once scrolled to the game section — Skor plus the board alone (101 + 16 gap + 700 = 817px) already exceeds every effective height in the table above. The full stack from Skor's top through the controls row is **≈900–1004px** (101 Skor + 16 gap + 700 board + 16 gap + 48 preview line + 16 gap + up to 107 controls, which wraps to two rows at the narrower widths) against effective heights of 508.5–800.5px — none of the three tested sizes fit it.

#### Sized from the viewport — 2026-08-17

Below `sm:`, `Papan`'s `max-w-[10.5rem]` is replaced with a value derived from `100dvh`. The mobile layout is a fixed linear function of the board's own width — two `min-h-[4.25rem]` (68px) *lumbung*, `p-3` (12px) padding on all four sides, `gap-2` (8px) between the *lumbung* and the seven-hole column and between the seven holes themselves, each hole `aspect-square`:

```
height(w) = 112 + 3.5w
```

Verified against the 2026-08-16 measurement itself: at the old fixed 168px width, `112 + 3.5×168 = 700` — exactly the measured board height. Solving for `w` from an available-height budget `H`: `w = (H − 112) / 3.5`.

`H` is `100dvh` minus the chrome that sits above the board specifically in `main`/`setelah` — the sticky header (131.5px) plus `Skor` (101.03125px, re-measured this session, unchanged) plus the 16px gap between them — 248.53125px, rounded up to 249px, plus a further 16px so the board doesn't touch the very bottom of the viewport. 265px total:

```
w = (100dvh − 265 − 112) / 3.5 = (100dvh − 377) / 3.5
```

Implemented as `max-w-[max(140px,calc((100dvh_-_377px)/3.5))]` — the `max(140px, …)` floor keeps hole width comfortably above the 24px WCAG 2.5.8 target even when the formula alone would go smaller. Sized from `main`'s chrome specifically, never `siap`'s (which has no `Skor` above the board) — per §5, the board is this size at every phase, and sizing from `siap` would make it grow the moment the first move is played.

Re-measured on the production build, same methodology as 2026-08-16, scrolled to the game section:

| Viewport | Board width | Board height | Board visible | Note |
|---|---|---|---|---|
| 360×640 | 140px (floor) | 602px | 65.0% | Formula alone would ask for ~75px — the 140px floor wins, and even the floor doesn't fully fit this viewport's height budget. |
| 390×844 | 140px (floor) | 602px | 99.0% | Formula alone would ask for ~133px, just under the floor. |
| 430×932 | 158.5625px | 666.96875px | **100%** | First of the three sizes where the whole board clears the fold. |

430×932 goes from 97.7% to fully visible. 390×844 goes from 85.1% to 99.0%. 360×640 goes from 55.9% to 65.0% — a real improvement, though the 140px floor means it still doesn't fully fit; a viewport this short genuinely cannot hold the sticky header, `Skor`, and a touch-target-legal board all at once, and the floor chooses touch targets over the last fraction of the board rather than shrinking silently past 24px.

One observed side effect at the 140px floor: the *lumbung* name (`PEMAIN A` / `PEMAIN B`) truncates to `PEMAIN…` at 360×640 and 390×844, where it previously fit at the old fixed 168px. The `truncate` fallback already existed for this (`Lumbung.tsx`, written for the wide desktop *lumbung* running out of column width) and the full name stays available in `Skor` above the board and in the hole's own `aria-label` either way, so nothing is unreadable — it just triggers in one more case than before.

Board sizing above `sm:` (`sm:max-w-none`) is untouched — desktop was never the problem this section measures.

---

## 7. Token hygiene

Three findings, all mechanical, all worth doing while the above is open.

**`animate-settle` and `animate-breathe` are defined and never used.** `settle` describes a seed dropping into a hole — the single most characteristic physical gesture in the game — and it exists only in the config. Wire it into the frames player at the moment a seed lands, or delete it. A motion token for the game's defining gesture, defined and unused, is the same class of defect as the three typefaces that were specified and never loaded.

**Two spacing systems coexist.** `globals.css` declares a `--space-*` scale documented as "the rhythm the page is built on," and `spacing` is not extended in `tailwind.config.ts`, so every `p-`, `gap-` and `m-` utility draws from Tailwind's defaults instead. The declared rhythm is not the rhythm.

Fix it per §2.8: extend `spacing` from the `--space-*` variables so the utilities resolve to the declared scale and an off-rhythm value cannot be written. Do not fix it by discipline.

**The stats panel is the app's one unpaired number.** `PanelStatistik` renders win/loss/streak as a `<dl>` of bare label/number pairs, in an app where every other count on screen is paired with a rendered seed pile. Give it form using what exists: wins and losses as a proportion in `seedA`/`seedB`, streak as a row of `Biji` glyphs. Shape carries ownership there too (invariant 18), so this stays readable without colour.

---

## 8. Build order

1. **Measure the board** at three real phone widths, all four phases, on the production build. Record the numbers. Nothing else first.
2. **`spacing` extension** and the `settle` wiring or deletion. Small, and they change layout, so they go before anything is measured against.
3. **Derive `Phase`** in `lib/`, with a test asserting which components mount at each phase over a set of recorded games. No UI change yet.
4. **Gate `Permainan.tsx` by phase**, with the board's fixed-size rule. Re-measure.
5. **`PratinjauSimpang`**, built against existing rules fixtures — one case per pack pair that diverges, one case where all packs agree, one case at the two-pack display limit.
6. **Board sizing from the viewport**, per-phase budgets recorded with dates.
7. **Stats panel** given form.
8. Reconcile the phase model back into the sibling project so the two do not drift.

After steps 4, 5 and 6: serve the build and drive it in two real browsers, both sides of a P2P connection included. Per §2.9 and per this project's own history, that is not optional.

---

## 9. Do not

- Do not use `brass` for divergence, focus, correctness, or desync. Active hole and captures only.
- Do not show a divergence inferred from a recorded-but-not-implemented source. Only implemented packs have an outcome to show.
- Do not rank packs, mark one as recommended, or imply the active one is correct.
- Do not animate the preview.
- Do not store phase, or let a component compute an outcome to decide one.
- Do not let the board change size between phases.
- Do not fork a second mobile board.
- Do not flatten *lumbung*, *biji*, *menembak*, *dakon* into English (invariant 19).
- Do not add a dependency for the preview, the phase model, or the stats form. Nothing here needs one.
- Do not treat a draw as an absent winner (invariant 14).
- Do not call a visual change done because the tests pass and the export is clean. Measure the rendered page.
