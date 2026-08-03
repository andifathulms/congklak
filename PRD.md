# PRD — Lumbung

**Congklak / dakon, with the regional rule variants made explicit, cited, and selectable — instead of one anonymous ruleset presented as "the" rules.**

> *lumbung* — the large end hole where seeds are banked; a granary. Also called *gunung* or *rumah*.
> Alternate names if preferred: **Dakon**, **Congklak**. The slug is used throughout as `lumbung`.

| | |
|---|---|
| **Status** | Draft — pre-implementation |
| **Owner** | Andi Fathul Mukminin Salahuddin |
| **Type** | Personal portfolio project, open source, cultural |
| **Deployment** | GitHub Pages (static export, no server) |
| **Language** | Indonesian-first UI; English secondary |
| **Relationship to Rantai** | Shares the engine architecture — pure `applyMove`, event stream, move-list-as-truth, hotseat → AI → P2P. Build Rantai first; this reuses the pattern. |

---

## 1. The game

A board of 16 holes: two rows of seven small holes (*lubang*) facing each other, and one large hole (*lumbung*) at each end belonging to one player. Each small hole starts with seven seeds — 98 in total.

On your turn you scoop all the seeds from one of your holes and sow them one at a time around the board, dropping one into your own *lumbung* as you pass it and skipping your opponent's. Then:

- If the last seed falls into a hole that already had seeds, **you scoop those up and keep going**. A single turn can circle the board many times.
- If the last seed falls into your own *lumbung*, you go again.
- If the last seed falls into an empty hole **on your own side**, you capture it plus everything in the hole directly opposite — this is *menembak*, "shooting".
- If it falls into an empty hole on your opponent's side, your turn simply ends.

The winner is whoever has banked more seeds.

The relay-sowing rule is what gives congklak its depth. A well-chosen opening can chain through dozens of holes before it terminates, and reading that chain ahead is the entire skill of the game.

## 2. Why this project

**The relay chain is inherently visual.** Watching a turn travel around the board, scooping and re-sowing, is compelling in a way a static board is not — and it's the same animation architecture as Rantai's cascade. It also makes a good five-second clip.

**Nobody has treated the rule variance honestly.** Congklak is played across the archipelago under many names — <cite index="1-1">congklak or dakon in Java, congkak in Sumatra, aggalacang or nogarata in Sulawesi, dentuman lamban in Lampung</cite> — and the rules genuinely differ. Every existing app picks one silently. Making the ruleset explicit, cited, and switchable is both the honest approach and the distinctive one.

**It is cheap, because the architecture already exists.** If Rantai is built first, this is the same pure engine, the same event stream, the same hotseat/AI/P2P layering, with different rules inside. Two shipped games for substantially less than twice the work.

**And it is a genuinely deep game** — deep enough that the AI is interesting rather than decorative.

## 3. The rule-variance problem

Sources contradict each other, and at least one admits the contradiction openly.

| Question | Variant A | Variant B |
|---|---|---|
| **Terminal condition** | Play continues until a side's holes cannot be sown at all | Play ends once one player has three empty holes on their side |
| **Empty-hole landing** | Capture opposite hole (*menembak*) when landing on your own side | Explicitly noted in some sources as having two different understandings |
| **Sowing direction** | Described as clockwise in Javanese sources | Described as counterclockwise elsewhere — largely a matter of board orientation, but must be fixed in the model |
| **Remaining seeds at end** | Go to the owner of the side they sit on | Discarded, or handled differently |
| **Multi-round play** | Winner refills; holes that cannot be filled are "burnt" and skipped in later rounds | Single round only |
| **First move** | Determined by *suit* | Both players move simultaneously (documented in some Malay congkak traditions) |

**The design response: rulesets are cited data, not code.** Each is a JSON pack in `data/rulesets/` naming its region, its options, and its source. The UI states which ruleset is active and why it differs from the others. A "compare rulesets" view replays the same move list under two rulesets and shows where they diverge.

This is the Rinci contradiction-ledger pattern applied to a game, and it is what makes this more than another congklak clone.

**Ship one default ruleset well.** Others are additive. Do not attempt six at launch.

## 4. Non-goals

- **No accounts, no ranking, no matchmaking.** Local stats only.
- **No monetisation, no ads, no gameplay analytics.**
- **No simultaneous-start variant in v1.** It breaks the turn model fundamentally and is a v2 ruleset flag at best.
- **No multi-round / burnt-house play in v1.** Real and traditional, but it adds a whole meta-layer. Deferred, and documented as deferred.
- **No 3D board, no physics, no seed-scattering simulation.** The board is a diagram.
- **No TURN relay** — same constraint as Rantai. Some P2P connections will fail; disclose it.
- **No ML.** AI is minimax plus a hand-written evaluation.
- **Not a general mancala engine.** Oware, kalah, and bao share machinery but differ in ways that would dilute the cultural specificity. If they ever land, they are separate rulesets with their own sources — never a generic "mancala" abstraction.

## 5. Modes

| Mode | Players | Needs |
|---|---|---|
| **Hotseat** | 2, one device | Nothing. Ships first. |
| **Versus AI** | 1 human, 1 AI at selectable strength | Search in a worker |
| **Peer-to-peer** | 2, two devices | WebRTC data channel — same layering as Rantai |

## 6. Rules — precise model

Fixed here because ambiguity becomes desync and disputed games.

- **Board.** A flat array of 16 positions: indices 0–6 player A's holes, 7 player A's *lumbung*, 8–14 player B's holes, 15 player B's *lumbung*. Sowing proceeds by increasing index, wrapping at 16.
- **Direction is fixed in the model, presented per the ruleset.** Clockwise versus counterclockwise is a rendering and orientation question, not an engine one. Do not encode direction twice.
- **Skip rule.** A player never sows into the opponent's *lumbung*. This is universal across every variant and is not a ruleset option.
- **Legal move.** A hole on the current player's own side containing at least one seed.
- **Sowing.** Scoop the hole to zero. Drop one seed per subsequent position, skipping the opponent's *lumbung*.
- **Relay (universal).** If the final seed lands in a small hole that was non-empty before that seed, scoop that hole and continue sowing from it. Loops until the turn terminates.
- **Termination cases.** Final seed lands in: own *lumbung* → extra turn. Empty hole on own side → *menembak*, capture that seed plus the opposite hole into own *lumbung*, turn ends. Empty hole on opponent's side → turn ends, no capture.
- **Opposite hole.** `opposite(i) = 14 - i` for small holes. Defined once, in the topology module.
- **Game end.** Ruleset-dependent: either no legal move exists for the player to move, or the three-empty-holes condition. Both implemented; one active per ruleset.
- **Final sweep.** Ruleset-dependent handling of seeds still on the board at game end.
- **Winner.** More seeds in *lumbung*. Ties are possible and must be handled — 98 is even, so a 49–49 draw is reachable and must not crash the win screen.

**Seed conservation is an invariant, not a hope.** Total seeds across all 16 positions must equal 98 after every single step of every sow. Assert it in development builds. A relay loop that drops or duplicates a seed is the classic bug in mancala implementations and it is silent.

**Relay termination.** A relay chain always terminates, because every relay step ends on a hole that had seeds and empties it, while seeds accumulate irreversibly in *lumbung*. Nonetheless enforce a step budget as a backstop — hitting it is a bug to report, never a normal exit.

## 7. Determinism

Identical to Rantai, and load-bearing for the same reasons.

**`applyMove(state, move, ruleset) → { state, events }` is pure.** No clock, no unseeded randomness, no floating point, no iteration over unordered collections. Same inputs, byte-identical output, on any device.

**A game is its move list plus its ruleset id.** State is always reconstructible by replay. This yields replay, undo, desync recovery, and shareable games from one property.

**Events, not diffs.** The sow emits an ordered stream — `scoop`, `sow`, `relay`, `bank`, `capture`, `extraTurn`, `end`. The renderer replays it and decides nothing.

## 8. Features

### 8.1 The sow animation
The signature moment. Seeds travel hole to hole in event order, relays visibly re-scooping, the *lumbung* filling. Speed control, because a long relay at full speed is unwatchable and at no speed is incomprehensible. `prefers-reduced-motion` resolves instantly with a written summary of what happened.

### 8.2 Move preview
Hover or long-press a legal hole to see where the chain would end, how many seeds would bank, and whether it would trigger a capture or an extra turn. This is the strategic core of the game made visible, and it is the single feature most likely to make a casual visitor stay. Toggleable, and off by default in P2P unless both agree.

### 8.3 Ruleset selector and comparison
Which ruleset is active, what it specifies, and where it came from — always visible, one tap from the board. Comparison mode replays a move list under two rulesets and marks the first divergence.

### 8.4 AI
Minimax with alpha-beta, iterative deepening under a time budget, in a worker. Evaluation: *lumbung* difference, seeds on own side, capture threats available, extra-turn opportunities, and vulnerability of own holes to opponent *menembak*. Difficulty is depth plus seeded noise. **No hidden information, no illegal moves** — congklak is a perfect-information game, so any AI advantage would be fabricated.

### 8.5 Replay and share
A game is a move list plus a ruleset id, so it exports as a short code and a URL hash. Step through any game move by move.

### 8.6 Learn mode
A short guided sequence teaching relay sowing, *menembak*, and the extra turn, using real board positions rather than text. Congklak's rules are simple to state and hard to feel; three interactive positions do more than three paragraphs.

### 8.7 Local stats
Games played, win rate, largest single-turn bank, longest relay chain. localStorage.

## 9. Architecture

Static Next.js 14 App Router export. No backend, no runtime fetches.

```
move + ruleset
  → applyMove (pure)  → { state, events }
                      → renderer replays events
                      → hash exchanged with peer
                      → move appended to the move list
```

**The engine is pure and isolated.** `lib/engine` imports nothing from React, Next, the DOM, or the network, and is the only place that knows the rules.

**Rulesets are validated data.** JSON packs with an id, region, options, and a cited source. Schema-checked at build time; the build fails on an uncited ruleset.

**Board as a flat `Int8Array` of 16.** Not objects, not a 2D structure. Fast for AI search, trivially serialisable, trivially hashable.

**AI in a worker.** Never the main thread.

**Network is transport only.** Moves and hashes cross the wire; never state. Both peers must be on the same ruleset id, verified at connection time and refused if mismatched.

## 10. Testing

**Seed conservation.** Asserted after every event in every test. 98 seeds, always.

**Rules fixtures.** Hand-authored boards with a stated move and stated result, per ruleset: a simple sow, a relay chain, a *menembak*, an extra turn, landing empty on the opponent's side, and the skip-opponent-lumbung rule.

**Relay termination.** Adversarial positions constructed to maximise chain length. Must terminate via the natural rule, never via the step budget.

**Determinism.** Move-list replay reproduces final state byte-identically across a large generated corpus.

**Cross-instance agreement.** Two engine instances on the same move list and ruleset produce identical hashes every turn. This is the P2P guarantee, tested without networking.

**Ruleset isolation.** The same move list under two rulesets produces divergence only where the rulesets actually differ. Catches rule leakage between packs.

**AI sanity.** No illegal moves, respects its time budget, higher difficulty beats lower over a series.

**Simulation.** Thousands of random legal games to completion under every ruleset: no crash, no infinite relay, seed count intact, valid terminal state including draws.

## 11. Design direction

The material world is the carved wooden board — a single length of hardwood, hollowed, worn smooth at the rims where hands have passed for years, sitting on a mat.

**Palette.** Mat ground `#E4DDCD`, a woven-fibre neutral. Carved teak `#7B5533` for the board body, with a darker hollow `#5A3D25` for the holes so depth reads without shading tricks. Ink `#241C14` for text and rules. Seed cream `#F0E7D4` for player one's seeds, deep tamarind `#8E3B2E` for player two's — and, because ownership matters at a glance, seeds are also distinguishable by form, never by colour alone. Old brass `#A8863C` marks the active hole and capture events, and nothing else.

**Type.** Counts are the content — seeds per hole, seeds banked — so **Space Grotesk** for numerals and display, with tabular figures wherever counts sit in a column. **IBM Plex Sans** for UI and prose. Ruleset citations and connection codes in **IBM Plex Mono**.

**Structure.** The board is one continuous carved form, holes as recesses in it, not fourteen separate cards. Seeds cluster inside a hole in fixed positions up to a threshold, then switch to a numeral — a hole with 23 seeds should read as "23", not as an unreadable pile.

**Motion.** One orchestrated moment: the sow travelling hole to hole, with a small settle as each seed lands, a visible scoop on relay, and a heavier drop into the *lumbung*. That rhythm is the game. Nothing else moves except a faint highlight on the hole under consideration.

**Copy.** Indonesian first, with the traditional vocabulary used and glossed on first use — *lumbung*, *biji*, *menembak*, *dakon*. Regional names acknowledged in the ruleset selector. Never flatten it to "store", "stones", "capture".

## 12. Milestones

| | | |
|---|---|---|
| **M0** | Scaffold | Static export deploying, ruleset schema and validator. |
| **M1** | Engine | Board model, sowing with relay, *menembak*, extra turn, terminal conditions, event stream. Seed conservation and rules fixtures green. Console only. |
| **M2** | Hotseat | Board rendering, sow animation, turn handling, win and draw states. **Playable and shippable.** |
| **M3** | AI + preview | Minimax, evaluation, difficulty, worker; move preview. Solo-playable and genuinely teachable. |
| **M4** | Rulesets | Second and third packs, selector, comparison view, sources page. |
| **M5** | P2P | Manual paste signaling, then brokered. Ruleset-id verification at connect. |
| **M6** | Polish | Replay export, learn mode, stats, a11y, reduced motion. |

Ship publicly at M2. M3 is what makes it worth visiting; M4 is what makes it distinctive.

## 13. Success criteria

- Seed count is exactly 98 after every event in every simulated game — no exceptions.
- Move-list replay reproduces final state byte-identically across 10,000 generated games per ruleset.
- Two engine instances agree on every turn hash.
- No relay ever terminates by hitting the step budget.
- Every shipped ruleset carries a cited source, enforced by the build.
- Draws are handled correctly and displayed properly.
- Hard AI beats easy AI over a series; neither ever plays an illegal move.
- Fully playable offline (hotseat and AI) after first load.
- Total JS ≤ 200 KB gzipped. Lighthouse performance and accessibility ≥ 95.
- Someone who has never played can complete learn mode and then win a game against easy AI.

## 14. Deployment

`output: 'export'`, `basePath` matching the repository name, `images.unoptimized`, `trailingSlash: true`, `.nojekyll` in the output root. Ruleset validation gates the deploy. Verify under the production `basePath` with `pnpm preview` before pushing.

## 15. Risks

| Risk | Mitigation |
|---|---|
| **Seed loss or duplication in the relay loop.** | Conservation assertion after every event, in every test and in dev builds. The classic silent mancala bug. |
| **Picking a ruleset and implying it is "the" rules.** | Ruleset packs are cited data; the active one is always named; divergences are shown rather than hidden. This is the project's differentiator, not a caveat. |
| **Rule sources are secondary and disagree.** | Record what each source says and where it came from. Where sources conflict, present the conflict. Prefer regional cultural and government sources over listicles, and say which is which. |
| **Long relays make turns feel slow.** | Speed control from M2, tuned against genuinely long chains. Move preview reduces the need to watch every relay in full. |
| **Silent desync in P2P.** | Move-only transport, per-turn hashing, ruleset-id verification at connect, halt-and-report on mismatch. |
| **Scope creep into a general mancala engine.** | §4 is binding. Cultural specificity is the point; a generic abstraction would erase it. |
| **Building this before Rantai ships.** | Don't. The architecture is meant to be proven once and reused. Two unfinished games is worse than one finished one. |
