# CLAUDE.md — Lumbung

Congklak / dakon with selectable, cited regional rulesets. Hotseat, AI opponent, WebRTC peer-to-peer. Static site, GitHub Pages, no backend.

Read `PRD.md` before starting any task. It fixes scope; this file describes how to work in the repo.

**Three things shape everything:**

1. **Seed conservation.** There are exactly 98 seeds. After every single event of every sow, all 16 positions must sum to 98. A relay loop that drops or duplicates a seed is the classic mancala bug and it is completely silent — the game plays on, wrongly.
2. **Determinism.** `applyMove` must give byte-identical results on any device. Replay, undo, AI search, and P2P sync all rest on it.
3. **There is no single "correct" congklak.** Regional variants genuinely differ and published sources contradict each other. Rulesets are cited data; the app names the active one and shows where variants diverge. Never present one ruleset as the rules.

**Sibling project:** Rantai. Same engine architecture, same event-stream renderer, same hotseat → AI → P2P layering. Follow those patterns rather than inventing new ones.

---

## Stack

- Next.js 14, App Router, `output: 'export'` — static only
- TypeScript, `strict: true`
- Tailwind CSS
- Zod for ruleset schema validation
- Vitest
- pnpm
- PeerJS for brokered signaling only — optional layer, never a hard dependency
- No game framework, no state library

## Commands

```bash
pnpm dev
pnpm build                 # static export to ./out; runs rulesets:validate first
pnpm preview               # serve ./out under the production basePath
pnpm test                  # vitest watch
pnpm test:run              # vitest once — before every commit
pnpm test:determinism      # replay + cross-instance agreement; before any engine commit
pnpm test:sim              # thousands of random games per ruleset
pnpm rulesets:validate     # schema + citation presence
pnpm typecheck
pnpm lint
```

## Layout

```
app/
  [locale]/                # id (default), en
    main/                  # hotseat + AI
    tanding/               # P2P
    ulang/                 # replay viewer
    aturan/                # ruleset selector, sources, comparison
components/
  board/                   # carved board, holes, seeds, lumbung
  sow/                     # event-stream animation player
  preview/                 # move preview overlay
  connect/                 # offer/answer paste, QR, status
lib/
  engine/                  # THE CORE. Pure. No React, no DOM, no clock, no network.
    board.ts               # Int8Array(16), indexing, opposite()
    apply.ts               # applyMove — the pure function everything rests on
    sow.ts                 # sowing loop, relay, termination cases
    events.ts
    hash.ts
    replay.ts
    conserve.ts            # seed-conservation assertion
  rulesets/                # schema, loader, validator
  ai/                      # minimax, alpha-beta, evaluation. Pure.
  net/                     # transport only. Knows nothing about rules.
workers/
  ai.worker.ts
data/
  rulesets/                # JSON packs: id, region, options, source
tests/
  rules/                   # hand-authored fixtures, per ruleset
  conserve/
  relay/                   # adversarial long-chain positions
  determinism/
  sim/
```

## Invariants

1. **Seed conservation is asserted, not assumed.** `conserve.ts` sums all 16 positions and checks it equals the starting total. Called after every event in tests and in dev builds. Never remove it to speed something up.

2. **`applyMove(state, move, ruleset) → { state, events }` is pure and deterministic.** No clock, no `Date`, no `Math.random`, no floating point, no module-level mutable state. Seeded PRNG only, carried in state.

3. **Never iterate an unordered collection in engine code.** No `Set` iteration, no `Object.keys`, no `Map` order dependence. This is the likeliest cross-device divergence and it will not appear in single-machine testing.

4. **The sow loop is iterative, never recursive.** Relay chains can be long.

5. **A player never sows into the opponent's *lumbung*.** Universal across all variants, so it lives in the engine, not in a ruleset option.

6. **`opposite(i)` is defined once**, in `board.ts`. Never inline the arithmetic anywhere else.

7. **Rule variation lives in ruleset packs, not in code branches.** No `if (region === 'jawa')` anywhere. If a variant needs behaviour the ruleset schema can't express, extend the schema — do not special-case.

8. **Every ruleset pack carries a cited source.** Validator-enforced; the build fails without it. If you cannot cite a variant, do not add it — say so instead.

9. **Relay has a step budget as a backstop.** Chains terminate naturally by the rules; hitting the budget means something is wrong, and it is reported as a bug, never swallowed as a normal exit.

10. **The engine imports nothing from React, Next, `components/`, the DOM, or `lib/net`.** No browser globals.

11. **A game is its move list plus its ruleset id.** State is always reconstructible by replay. Never treat derived state as the source of truth.

12. **Only moves and hashes cross the wire. Never state.** `lib/net` is transport — if it knows the rules, the design is wrong. Both peers must confirm the same ruleset id at connect; refuse the connection on mismatch.

13. **Hash every turn; halt on mismatch.** Report desync to both players and offer resync by replaying the move list. Never auto-reconcile by trusting one side.

14. **Draws are a real outcome.** 98 is even; 49–49 happens. Handle and display it. Do not assume a winner exists.

15. **The AI gets no hidden information and no illegal moves.** Congklak is perfect-information — any AI advantage would be fabricated. Difficulty is search depth plus seeded noise.

16. **AI runs in a worker with a time budget.**

17. **Animation replays the event stream.** The renderer never computes outcomes.

18. **Seed ownership is never colour alone.** Pair colour with form. Ownership is game state and must be readable without colour discrimination.

19. **Traditional vocabulary is preserved.** *lumbung*, *biji*, *menembak*, *dakon*, *congklak* — in code identifiers, comments, and UI. Do not flatten to "store", "stones", "capture".

## Working style

- **Engine before UI.** Fixtures first, then implement. The UI is easy; a silent rules bug is not.
- **Add the conservation assertion before writing the sow loop**, not after. It is how you find the bug the same hour you write it.
- **When a determinism test fails, stop and find the cause.** Never retry, reseed, or add tolerance.
- **Ship one ruleset well before adding a second.** Six half-verified packs is worse than one cited one.
- **When sources conflict on a rule, do not pick silently.** Record both, cite both, and surface the divergence — that is the product.
- **Follow Rantai's patterns** for the engine, event stream, worker, and networking rather than inventing parallel ones.
- **Don't touch `next.config.js`, the Actions workflow, or the validator without saying so explicitly.**
- **Don't add dependencies** for game logic, state, search, or animation. PeerJS is the only permitted network dependency, for Layer 2 only.
- **Never weaken a test to make something pass**, especially in `tests/conserve/` or `tests/determinism/`.

## Conventions

- Named exports; defaults only where Next requires them.
- Discriminated unions for events and moves, keyed on `type`. Exhaustive `switch` with a `never` default.
- No `any`. No non-null `!` in engine code.
- Board as a flat `Int8Array(16)`: 0–6 A's holes, 7 A's *lumbung*, 8–14 B's holes, 15 B's *lumbung*. Never a 2D structure, never objects per hole.
- Integers only in the engine, including AI evaluation weights. No floats anywhere.
- Ruleset ids stable and readable: `jawa-sleman`, `umum`, `sumatra`. They appear in shared game codes and in P2P handshakes — renaming breaks existing links.
- Comments cite the source of any rule they implement. `// aturan tiga lubang kosong — sumber: <citation>` is the highest-value comment style here.
- Tailwind utilities inline; semantic tokens in `tailwind.config.ts` — `mat`, `teak`, `hollow`, `ink`, `seedA`, `seedB`, `brass`, each with steps within the hue (`mat-high`, `mat-low`, `mat-edge`, `teak-rim`, `teak-grain`, `hollow-deep`) plus named elevations (`shadow-carve`, `recess`, `bank`, `raise`) and the wood (`bg-grain`, `bg-pit`). Never raw hex in components; a new *step* belongs in the config, a new *hue* does not exist. See PRD §11.
- **`brass` marks the active hole and captures only.** Not focus (that is `ink`, or `seedA` inside `.on-teak`), not a correct answer in learn mode, not a desync (that is `seedB`), not a ruleset divergence (that is `bg-ink text-mat`). Every one of those had borrowed it.
- Reach for `components/ui/` before writing a control: `Segmen` (any set of choices — the group name is required, since "Sedang" is both a difficulty and a speed), `Tombol`/`TautanTombol` (`utama` / `kedua` / `sunyi`, and weight must track consequence), `Panel`, `Lencana` (source confidence), `Salin` (any code a human would otherwise select by hand). `components/shell/Kepala` is the page header; no page writes its own back link, because the nav marks the current section.
- The board is one DOM at every size. On phones it stands upright — a rigid quarter turn, so the sow still reads clockwise and opposite holes still sit beside each other. Do not fork it into a second mobile board.

## Testing rules

- `pnpm test:run` before every commit; `pnpm test:determinism` before any engine or AI commit.
- Every new rule behaviour → a hand-authored fixture with stated input and stated output, per affected ruleset.
- Every test asserts seed conservation. No exceptions, including AI and simulation tests.
- New ruleset → validator passes, source cited, isolation test proving it diverges from the default only where intended.
- New relay behaviour → an adversarial long-chain fixture.
- Bug fix → failing test first.
- `pnpm test:sim` before any release: thousands of random games per ruleset, no crash, no runaway relay, seed count intact, valid terminal state including draws.

## Deployment

`main` builds and deploys via Actions; ruleset validation gates it. `basePath` must match the repository name; `.nojekyll` must exist in `out/`. Verify with `pnpm preview` before pushing.

## Current state

Every PRD milestone is in place: M0 through M6. Hotseat, AI, and P2P over both manual paste and a brokered short code; three cited rulesets with a selector and a comparison view; replay from a game code; learn mode; local stats.

Verified by driving the built export in two real browsers, not only by tests. That is not optional here — **every UI bug found in this project was invisible to a green test suite and a clean static export**, and there have been five:

- The AI never moved at any animated speed (unstable effect dependency re-firing on every frame).
- The stats panel never appeared (child effect ran before the parent wrote).
- The brokered channel captured its connection by value, so the host's handshake was never sent.
- PeerJS returned data in a different shape than it was sent, silently dropping the handshake.
- The broker could hang forever with no code and no error.
- The three typefaces the PRD specifies were named as CSS variables that nothing ever loaded, so every one fell through to the system UI face — a design system that existed only on paper, and no test could see it.
- The board collapsed to 160px on a phone, because `mx-auto` on a flex item cancels the stretch.

Run the app. Drive both sides of a connection. Measure the rendered page — several of the above were only visible with a ruler on real output, not by reading the CSS. Do not trust a UI change because the tests pass.

Remaining, all deliberate:

- **Simultaneous first move**, **multi-round play with burnt houses**, and **five/nine/eleven-hole boards.** The first two are PRD §4 non-goals; the third needs a resizable topology, and the board is `Int8Array(16)` everywhere. All three are recorded as divergences in the packs that document them, so the deferral is visible rather than silent.
- **A fourth ruleset**, only if a source turns up a rule the schema cannot already express. That is the bar `congkak-melayu` cleared; anything less is padding.

Things worth knowing before touching this:

- **Source weight is declared, not flattened.** Government (Sleman, Bantul, JKKN Malaysia), specialist reference (gambiter.com), and mass media (detikEdu) are distinguished in each source note. detikEdu inverts *menembak* relative to both other kinds and is recorded as a divergence, not implemented — recording a contradiction is not treating it as equally weighted.
- **The Sleman source contradicts itself** on when the game ends. Both readings are recorded; the pack implements the one stated most firmly.
- **`jawa-sleman`'s final sweep is an inference**, not a quote. Flagged as such in its divergence entry.
- **The two final-sweep readings cannot diverge under the `tak-ada-langkah` terminal**, because the stuck side is by definition already empty. Only visible under `tiga-lubang-kosong`.
- **The board renders clockwise because all three sources say clockwise.** It rendered the other way at first, contradicting its own citation. A layout test pins this.
- **`evaluate()` must stay antisymmetric.** It is called from both sides of the search. Two separate bugs came from weighting one direction differently; a term that cannot be written antisymmetrically does not belong.
- **Learn-mode lessons carry the outcome they claim, and the tests check it.** A lesson promising a capture that does not happen teaches the wrong rule.
- **PeerJS must stay dynamically imported.** It is the only permitted network dependency and it is Layer 2 only. Manual paste has to keep working when the broker does not.

**Note: Rantai should ship first.** This project reuses its architecture, and proving that architecture once is the point. Lumbung was built ahead of that at the owner's request; the patterns here are the ones Rantai was meant to establish, so they should be reconciled rather than diverged.
