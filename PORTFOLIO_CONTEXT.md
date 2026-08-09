# PORTFOLIO_CONTEXT — Congklak

Raw material for a client-facing case study. Everything below is checked against the
repository as it stands (36 commits, `main` @ `f9c6807`), not against the PRD's intent.

---

## 1. One-line summary

A browser version of congklak — the traditional Indonesian seed-sowing board game — that
lets you pick *which region's rules* you're playing by, shows the source each ruleset came
from, and lets you play it against a friend on the same phone, against the computer, or
against someone on another device.

## 2. The problem

Congklak (also *dakon*, *congkak*, *sungka*, *dentuman lamban*, *aggalacang*, *nogarata*)
is played across the archipelago, and **the rules genuinely differ by region**. When does
the game end — when a player has no legal move, or as soon as they have three empty holes?
Does landing in an empty hole on your *own* side capture the opposite hole, or does it end
your turn? Must a seed complete a full lap before it can *menembak*?

Published sources contradict each other on all three. Every existing congklak app picks one
reading silently and presents it as "the rules". That flattens a living regional tradition
into one anonymous version, and it means two players who learned the game in different
places can't tell whether the app is wrong or they are.

**Who it's for:** Indonesian players who grew up with a specific local version and want to
recognise it; people who have never played and need to be taught; and anyone curious about
where the rules actually come from. Indonesian-first UI, English secondary.

The project treats the disagreement as the feature: rulesets are **cited data**, the active
one is always named, and where two documented readings conflict, both are recorded with
their sources and the weight of each source declared.

## 3. My role

**Sole author.** All 36 commits are from one contributor. Nothing here was inherited from a
starter template or a prior codebase — the scaffold, the game engine, the AI, the
networking layer, the design system, the ruleset research, and the test suite were all built
in this repo.

Used as-is (dependencies, five in total): Next.js, React, Tailwind, Zod for schema
validation, PeerJS for brokered WebRTC signalling. **No game framework, no state-management
library, no search library, no animation library.** The sowing engine, the minimax AI, the
event-stream animation player, and the P2P session reducer are all hand-written.

The rules research is original work: three ruleset packs sourced from Indonesian and
Malaysian government cultural documentation, a specialist mancala reference, and one mass-
media article — each read, cited, and weighted, with contradictions between them recorded
rather than resolved silently.

Design direction (palette, three typefaces, the carved-board metaphor) is specified in the
project's own PRD and implemented here.

## 4. Technical approach

**The rules live in one pure function.** `applyMove(state, move, ruleset) → { state, events }`
is the whole game. No clock, no randomness that isn't seeded, no floating point, no browser
APIs. Same inputs give byte-identical output on any device. Everything else in the app —
undo, replay, the AI's search, and peer-to-peer sync — is a consequence of that one property
rather than a separate feature.

**A game is its move list plus a ruleset id.** State is never the source of truth; it's
always reconstructible by replaying moves. That single decision is what makes shareable game
codes, the replay viewer, and desync recovery essentially free.

**Rules are data, not code branches.** There is no `if (region === 'jawa')` anywhere in the
engine. Each regional variant is a JSON pack (`data/rulesets/`) with its options, its
sources, and its documented divergences. A build-time validator refuses to ship a pack
without a citation. When a variant needed behaviour the schema couldn't express — the Malay
"complete a lap before you can capture" rule — the schema was extended rather than the
engine special-cased.

**Seed conservation is asserted, not assumed.** There are exactly 98 seeds. A relay loop
that drops or duplicates one is the classic mancala bug and it is completely silent — the
game plays on, wrongly. `lib/engine/conserve.ts` sums all 16 positions after every single
event, in every test and in dev builds. It was written *before* the sowing loop, not after.

**The renderer decides nothing.** A turn emits an ordered event stream (`scoop`, `sow`,
`relay`, `bank`, `capture`, `extraTurn`, `end`) and the animation replays it. The visual
layer can never disagree with the outcome, because it never computes one.

**The network layer doesn't know the rules.** Only moves and per-turn hashes cross the wire
— never board state. Both peers confirm the same ruleset id at connect and the connection is
refused on mismatch; if the per-turn hashes ever disagree, the game halts and reports it to
both sides rather than quietly trusting one.

**Board as a flat `Int8Array(16).`** Indices 0–6 are player A's holes, 7 is A's *lumbung*,
8–14 are B's, 15 is B's. Not objects, not a 2D grid — fast enough for minimax at depth 9,
and trivially hashable.

## 5. Actual tech stack

From `package.json` — five runtime dependencies:

| | |
|---|---|
| **Framework** | Next.js 14.2.15, App Router, `output: 'export'` (fully static) |
| **UI** | React 18.3.1, Tailwind CSS 3.4.6 |
| **Language** | TypeScript 5.5.3, `strict: true` — no `any`, no non-null assertions in engine code |
| **Validation** | Zod 3.23.8 (ruleset schema, build-gated) |
| **Networking** | PeerJS 1.5.4 — dynamically imported, brokered signalling only; manual paste works without it |
| **Testing** | Vitest 2.0.5 |
| **Tooling** | pnpm 9.15.9, tsx, ESLint, PostCSS/Autoprefixer |
| **CI/Hosting** | GitHub Actions → GitHub Pages, Node 24 |

No backend, no database, no analytics, no accounts. Local stats in `localStorage`.
The AI runs in a Web Worker (`workers/ai.worker.ts`).

## 6. Notable features

- **Three cited regional rulesets** — `umum` (the most widely-used reading), `jawa-sleman`
  (Sleman/Yogyakarta cultural documentation: three-empty-holes ending), `congkak-melayu`
  (Malaysian JKKN: capture only after a completed lap) — with a selector, a sources page
  showing each source's confidence level, and a ledger of documented divergences.
- **Ruleset comparison view** — replays the same move list under two rulesets side by side
  and marks the first point where they diverge.
- **Animated relay sowing with speed control** — the signature moment of congklak, where a
  single turn can chain around the board many times. `prefers-reduced-motion` resolves
  instantly to a written summary instead.
- **Move preview** — hover or long-press a legal hole to see where the chain ends, how many
  seeds bank, and whether it triggers a capture or an extra turn.
- **Minimax AI in a worker** — alpha-beta with iterative deepening, three difficulty levels
  (depth 2/5/9 plus seeded noise). Perfect-information: no hidden state, no illegal moves.
  Handles congklak's extra-turn rule, where nodes don't alternate between players.
- **Peer-to-peer play over WebRTC** — manual offer/answer paste *and* a short code via a
  broker, with ruleset-id handshake at connect and a state hash exchanged every turn.
- **Replay from a shareable game code**, and a **learn mode** of three interactive board
  positions teaching relay sowing, *menembak*, and the extra turn.

## 7. Challenges and tradeoffs

**Every UI bug in this project was invisible to a green test suite.** Seven of them, all
found by driving the built site in real browsers with a ruler, not by reading code or
running tests. The commit history shows them: `e709993` (the AI never moved at any animated
speed — an unstable effect dependency re-firing every frame; and the stats panel never
appeared because a child effect ran before the parent wrote), `f7166f3` (a P2P connection
could fail silently with no reason shown), `f638e42` (the three typefaces the design spec
required were declared as CSS variables that nothing ever loaded — every one silently fell
back to the system font, a design system that existed only on paper), `231634d` (the board
collapsed to 160px on a phone, because `mx-auto` on a flex item cancels the stretch). The
takeaway, recorded in the repo's own guidance: never trust a UI change because the tests pass.

**Two P2P bugs came from the transport lying about its own shape** — the brokered channel
captured its connection by value so the host's handshake was never sent, and PeerJS returned
received data in a different shape than it was sent, silently dropping the handshake. Both
are the reason the network layer is a pure reducer with 22 tests that run without any
networking at all.

**Sources contradict each other, and one contradicts itself.** The Sleman government source
gives two different accounts of when the game ends; both readings are recorded in the pack
and the one stated most firmly is the one implemented. detikEdu inverts the *menembak* rule
relative to both the Malaysian government source and the specialist reference — recorded as
a divergence, explicitly **not** implemented, with a note that it's logged because it
circulates widely, not because it carries equal weight. Source weight is declared per source
(government / specialist reference / mass media) rather than flattened.

**The board rendered the wrong way round at first**, contradicting its own citation. All
three sources say clockwise; the first implementation went counterclockwise. A layout test
now pins it.

**A large design rework mid-project** (commits `f638e42` through `103d90a`, ~11 commits)
replaced a functional-but-generic UI with the carved-teak material direction: the board is
now one continuous carved form rather than fourteen circles, controls were consolidated into
five reusable primitives so visual weight tracks consequence, and `brass` was reclaimed as
the marker for the active hole and captures *only* — five other things had borrowed it.

**Deliberate deferrals, documented rather than hidden.** Simultaneous first move and
multi-round play with "burnt" holes are real traditional variants but were declared
non-goals. Five/nine/eleven-hole boards would need a resizable topology, and the board is
`Int8Array(16)` throughout. All three are recorded as divergences inside the packs that
document them, so the deferral is visible to a user rather than silently absent.

**The fourth ruleset was refused.** The bar set was "only if a source turns up a rule the
schema cannot already express" — which is exactly how `congkak-melayu` earned its place (the
lap requirement). Packs that differ where no source supports the difference are taste, not
rulesets.

**The `congklak` product rename came late** (`817d048`), and deliberately did *not* rename
the traditional vocabulary. *lumbung*, *biji*, *menembak*, *dakon* remain in identifiers,
comments and UI — never flattened to "store", "stones", "capture".

## 8. Status

- **Live** at https://andifathulms.github.io/congklak/ — deployed from `main` via GitHub
  Actions, with ruleset validation gating the deploy (an uncited pack fails CI rather than
  shipping).
- **Public repository:** `github.com/andifathulms/congklak`.
- **Complete, not a prototype.** Every milestone in the PRD (M0–M6) is implemented:
  hotseat, AI, P2P over both manual paste and a brokered code, three cited rulesets with
  selector and comparison, replay, learn mode, local stats. Verified by driving the built
  static export in two real browsers, not only by tests.
- Personal portfolio / open-source cultural project. No monetisation, no ads, no analytics.

## 9. Metrics

| | |
|---|---|
| **Commits** | 36, all from one author |
| **Time span** | 3–4 August 2026 (repo created 2026-08-03; last push 2026-08-04) |
| **Source lines** | ~8,600 TS/TSX total |
| | engine + AI + net + rulesets (`lib/`): ~2,720 |
| | UI components: ~3,100 · routes (`app/`): ~456 · worker: 88 |
| | tests: ~2,083 — roughly one line of test per three lines of source |
| **Tests** | 120 test cases across 13 files — conservation, rules fixtures per ruleset, relay long-chains, determinism/replay, ruleset isolation, AI sanity, P2P session, animation frames, plus a simulation suite running thousands of random games per ruleset |
| **Routes** | 7 pages × 2 locales (`main` hotseat/AI, `tanding` P2P, `banding` comparison, `aturan` rulesets + sources, `ulang` replay, `belajar` learn, home) |
| **Rulesets** | 3 packs, 5 distinct cited sources, with a per-pack divergence ledger |
| **Runtime dependencies** | 5 |
| **Board model** | 16 positions, 98 seeds, asserted after every event |

## 10. Suggested screenshots

1. **The board mid-relay, hotseat** — the signature image: carved teak board, seeds
   travelling, the *lumbung* filling, active hole in brass, speed control visible. Ideally
   captured mid-animation on a long chain. Also worth a second shot in the phone layout,
   where the board stands upright as a rigid quarter-turn so the sow still reads clockwise.
   → [components/board/Papan.tsx](components/board/Papan.tsx),
   [components/board/Lubang.tsx](components/board/Lubang.tsx),
   [components/game/Permainan.tsx](components/game/Permainan.tsx),
   [components/sow/usePenaburan.ts](components/sow/usePenaburan.ts)

2. **The rulesets / sources page (`/aturan`)** — this is the page that carries the whole
   argument of the project: three packs, each source with its publisher and confidence
   badge, and the divergence ledger showing where readings conflict and which one is
   implemented. Frame it so the citations and the "not implemented, recorded because it
   circulates widely" note are legible.
   → [app/[locale]/aturan/page.tsx](app/[locale]/aturan/page.tsx),
   [components/game/PemilihAturan.tsx](components/game/PemilihAturan.tsx),
   [components/ui/Lencana.tsx](components/ui/Lencana.tsx)

3. **The comparison view (`/banding`)** — two boards stacked, the same move list under two
   rulesets, with the first divergence marked. The clearest single-image proof that the
   rule-variance claim is real and mechanical rather than a disclaimer.
   → [app/[locale]/banding/page.tsx](app/[locale]/banding/page.tsx),
   [components/game/Banding.tsx](components/game/Banding.tsx),
   [lib/engine/compare.ts](lib/engine/compare.ts)

4. **Move preview on a legal hole** — hover state showing where the chain ends, seeds
   banked, and whether it captures or grants an extra turn. This is the strategic depth of
   the game made visible in one frame, and it photographs well.
   → [components/preview/ringkas.ts](components/preview/ringkas.ts),
   [components/board/Lubang.tsx](components/board/Lubang.tsx)

5. *(optional fifth)* **P2P connect screen (`/tanding`)** — the three numbered decisions,
   the short code with copy affordance, and the ruleset-id handshake state. Useful if the
   case study wants to show the networking work, which is otherwise invisible.
   → [components/connect/Tanding.tsx](components/connect/Tanding.tsx),
   [components/ui/Salin.tsx](components/ui/Salin.tsx)
