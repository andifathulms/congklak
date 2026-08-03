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
- Tailwind utilities inline; semantic tokens in `tailwind.config.ts` — `mat`, `teak`, `hollow`, `ink`, `seedA`, `seedB`, `brass`. Never raw hex in components. **`brass` marks the active hole and captures only.** See PRD §11.

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

M3 done. Static export deploys, validator gates the build, engine passes its fixtures, hotseat and AI both playable, move preview live.

Next: M4 — a second and third ruleset pack, the selector, and the comparison view that replays one move list under two rulesets. The engine already implements both terminal conditions and all three final-sweep options, so a new pack is data plus an isolation test, not code.

Two things to settle before adding packs:

- **The `umum` pack's sources are marked `perlu-cek`.** They were written from general knowledge of the DepDikBud provincial *Permainan Rakyat* series, not checked against the originals. Verify them, or replace them, before treating the default as sourced. The confidence field exists so this is visible rather than implied.
- **The two final-sweep readings are indistinguishable under the `tak-ada-langkah` terminal**, because the stuck side is by definition already empty. They only diverge under `tiga-lubang-kosong`. Worth knowing before designing the comparison view around them.

**Note: Rantai should ship first.** This project reuses its architecture, and proving that architecture once is the point. Lumbung was built ahead of that at the owner's request; the patterns here are the ones Rantai was meant to establish, so they should be reconciled rather than diverged.
