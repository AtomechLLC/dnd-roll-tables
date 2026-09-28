# Phase 5: Hits-to-Kill - Research

**Researched:** 2026-09-27
**Domain:** Exact kill-time probability (renewal DP over remaining HP) in the existing single-file vanilla-JS engine, plus control, stat-card and simulator integration
**Confidence:** HIGH. Every engine claim below was measured this session by running the page's own `#dice-math`, `#dice-sim` and `#view-model` blocks in Node 24.15 and headless Chrome, and checked exhaustively against independent exact oracles (BigInt rationals, and a second DP method).

## Summary

The kill numbers depend on the attack only through **(hitFaces, die, dmg)**: the d20 enters only through how many faces hit, which is the same fact the existing `leverMemo` and check-engine (p) rely on. That gives **2,470 distinct attack keys × HP 1..500 = 1,235,000 (key, HP) pairs**, a domain small enough for check-engine to verify exhaustively in about 15 s. Build one **kill table per attack key** covering every HP from 1 to 500 at once. Editing HP (typing, or the ±1 hit buttons) is then an O(1) lookup, and the DP runs only when the attack changes. `[VERIFIED: local measurement]`

Three measured findings change the UI-SPEC's suggested implementation (its copy and formats stay as approved):

1. **The naive round-by-round median DP misses the 16 ms budget.** It takes 13–27 ms at worst in headless Chrome at cap 1,000 (nat-20-only d10/d12 with low damage). Lowering the cap to 500 still gives 7–18 ms and doubles the "over the cap" copy. A **thinning formulation** keeps cap 1,000 at 7.6–12 ms worst in Chrome (≤ 6 ms in Node). It rolls rounds into damaging hits with a binomial, P(dead by t) = Σⱼ Bin(t, p′)(j) · P(Sⱼ ≥ HP), so its cost is bounded by about HP² instead of cap × HP × support. It matches the round DP on all 1,235,000 medians. `[VERIFIED: local measurement]`
2. **Floats alone print the wrong tenths.** E[H] and E[R] land within 1e-9 of an x.x5 rounding boundary at thousands of pairs. Nat-20-only E[H](n) converges to a straight line, and some values are exact ties. Plain `Math.round(10 * x)` disagrees with round-half-up of the exact rational at **590 (E[H]) and 1,259 (E[R])** pairs. A float result with an **exact BigInt tie-breaker inside a ±1e-6 window** fixes every one: 0 mismatches over all 1,235,000 pairs, with 1,523 fallbacks taken.
3. **The median has exact 1/2 ties.** For example, at AC 16 / +5 (a 50% hit chance) and HP 1, P(kill in round 1) is exactly 1/2, and the float DP gives 0.49999999999999994. A plain `>= 0.5` would print "by round 2" at a common setting. **Use `>= 0.5 − 1e-9`.** All 657 near-ties found are exact ties (BigInt-verified, t ≤ 5, hit faces 10–13), and the tolerance reproduces the exact median everywhere.

**Primary recommendation:** Put `DiceMath.hitPmf` / `killTable` / `killHitsExact` in `#dice-math`: an E[H] recursion plus thinning for the median and P20, cap 1,000, with the tie epsilon. Memoize the table in `VM` per `(hitFaces, die, dmg)` with a small LRU. Build every string through one rounding helper with an exact fallback. Keep the round-by-round DP and BigInt rationals as **independent oracles in check-engine**, exhaustive over all 2,470 keys × HP 1..500. Build the plans as three sequential slices: engine + checks → control + cards → 20-round roll.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Enemy health control
- **D-01:** New control: "Enemy HP", an integer number box from 1 to 500, default 40. It goes through the same `VM.CONTROL_SPEC` / `VM.parseControl` path as every other control (new key, e.g. `hp`), so blank, non-numeric, and out-of-range input clamps like the others (CTRL-05). It sits in the controls strip at the top with the other settings.
- **D-02:** Next to the box are "−1 hit" and "+1 hit" buttons. One hit is the **average damage when the attack hits**, crits included. This is the same quantity as the existing "Average damage on a hit" stat card (`DiceMath.hitAverages`), 4.91 at the defaults (AC 15, d8, +5 to hit, +0 damage). It is not the per-attack average, which includes misses (2.70).
- **D-03:** The buttons change HP by that average rounded to the **nearest whole HP**, and never below 1 or above 500. Each button's label shows the exact step it will apply, for example "+1 hit (+5 HP)". A short line under the control shows the current HP in average hits, for example "≈ 8.1 average hits (1 hit ≈ 4.91 HP)". When the attack can't damage at all, the step is 0: the buttons must not loop, lie, or divide by zero, and the line says so.

#### Kill numbers (exact math)
- **D-04:** New stat cards show three exact values. None of them is simulated.
  - **Hits to kill:** the exact expected number of hits to bring the enemy to 0 HP. The per-hit damage distribution is conditional on hitting, crits rolled as real 2dX. The card also shows the simple division for contrast, for example "8.7 on average (simple division says 8.1)".
  - **Rounds to kill:** the exact expected number of attack rounds, misses included, with the median round, for example "15.8 on average, half of fights by round 15".
  - **Kill within 20 rounds:** the exact chance the enemy is dead by the end of round 20, for example 85%.
- **D-05:** Reference values at the defaults with 40 HP, computed exactly during discussion:
  - average hit 4.909, simple division 8.148 hits, exact expected hits 8.700, median 9, minimum 3;
  - per-attack average 2.70, simple division 14.81 rounds, exact expected rounds 15.818, median 15, minimum 3;
  - P(kill within 20 rounds) 0.8466, P(kill within 10 rounds) 0.1114.

  These should become self-test or check-engine assertions.
- **D-06:** Kill math follows the one damage rule (RULES-05, `DiceMath.damageFor`): a natural 1 always misses, a natural 20 crits with two real dice, and damage never goes below 0. Death is HP reaching 0 or below. The distribution is computed by exact dynamic programming over remaining HP, not Monte Carlo (PROJECT.md exact-math rule). Very long fights, such as 500 HP when only a natural 20 hits, need a documented cutoff or closed-form tail, so the page never hangs and never shows a wrong number.
- **D-07:** Show the kill numbers with a short designer-voice note, following Phase 4 D-02's two to four plain sentences. It explains why the exact numbers beat the simple division: the last hit usually overshoots. Every number in that note must equal the card's own number (Phase 4 D-04 rule).

#### The 20-round roll (Phase 3 simulation)
- **D-08:** All 20 rounds are still rolled and logged, so the damage total stays comparable with the exact 20-round expected value. The log gains an "Enemy HP" column showing remaining HP after each round. The round where HP reaches 0 is highlighted, and later rounds are dimmed and labeled "enemy down". The result line reports "Killed in round 12 (9 hits)", or "Survived with 2 HP left" when it lives.
- **D-09:** Changing HP after a roll does **not** stale the run. HP changes no die, so the same rolls are re-scored live: the HP column, the kill round, and the result line update as HP is edited. AC, die, and the two bonuses still stale the run exactly as in Phase 3 D-08. The compare +N slider still does not.
- **D-10:** The tally of the last 5 runs shows each run's total and outcome, for example "61 · killed R12" or "38 · 2 HP left". Tally outcomes re-score live with HP too (D-09), so each tally entry keeps its per-round damage. The tally still clears when AC, die, or a bonus changes (Phase 3 D-13).
- **D-11:** The outcome-table marks from Phase 3 (rings, ×N badges, row-label counts) are unchanged.

#### Scope boundary
- **D-12:** The compare tables and the sweep chart are **not** extended with kill numbers in this phase. The user picked only the 20-round roll from those options.

### Claude's Discretion
- Exact wording of labels, button text, the hits line, the kill cards, and the note, within the Phase 4 voice rules.
- Where the kill cards sit in the stat-card area, and the phone layout. Keep the space-dense layout from quick task 260927-1ty: 32 px controls and the 4/8/12/16/20/24 spacing scale.
- The DP cutoff or tail method for extreme settings, and how "never" or "under 0.1%" chances are worded.
- Whether "Try this" presets touch HP. The recommendation is that they don't, so presets keep changing only the attack.
- Whether the formulas card gets a hits-to-kill line.
- The accessible names for the new controls. The a11y guards (9)–(13) and the exact tab-order list in `tools/check-page.mjs` must be updated to include them.

### Deferred Ideas (OUT OF SCOPE)
- **Kill speed in the compare tables:** rounds-to-kill in each of the three tables' stats lines, so +N to hit vs +N to damage is compared by kill speed. Offered, not chosen.
- **A rounds-to-kill mode for the sweep chart:** a switch to plot rounds-to-kill for +0 to +20. Offered, not chosen; the chart's crossover and band text is written for damage.
- **A full rounds-to-kill distribution chart:** offered as a headline option, not chosen.
- **"Next enemy steps in":** counting kills per 20 rounds. Offered, not chosen.

### Also locked: `05-UI-SPEC.md` (status: approved)
Exact copy, formats, edge wordings, DOM ids, tab order, the median cap of 1,000 rounds with "over 1,000" copy, and assumptions A1–A12 are locked by the approved UI-SPEC. This research does not change any of them. It changes only **how** the numbers are computed (the UI-SPEC's "round-by-round DP" and "lower the cap if > 16 ms" performance rule). That falls under the CONTEXT discretion item "The DP cutoff or tail method for extreme settings".
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| KILL-01 | "Enemy HP" control, 1..500, default 40, same parse path | `CONTROL_SPEC.hp = {min:1,max:500}`, `DEFAULT_STATE.hp = 40`, box carries `data-key="hp"`. The existing `onControl` / `onChange` / `renderControls` handle it with no new code (Pattern 5). |
| KILL-02 | ±1 hit buttons, step = round(avg hit), clamped, labels show the applied step, hits line, no loop/div-by-zero | Integer step `floor((2·e20Num + den)/(2·den))`, den = e20Den × hitFaces. Verified over all 70,980 settings: 1,412 step-0, 99 exact ties, 0 mismatches with the card string. Click handler reads the step from `state`, not from the painted label (Pattern 6). |
| KILL-03 | Exact E[hits], E[rounds] + median, P(kill ≤ 20); no hang, no wrong number | `DiceMath.killTable` (E[H] recursion + thinning, cap 1,000, tie ε) with exact BigInt tie-break for displayed rounding. Exhaustively verified over 1,235,000 (key, HP) pairs (Patterns 1–3). |
| KILL-04 | Note true at every setting; its numbers equal the cards; checked against the engine | Wald's identity makes sentence 2 true everywhere: E[H] × avg hit > HP at all 1,235,000 pairs, and exact E[H] tenths exceed simple tenths by ≥ 1 at all 1,218,297 pairs under 1,000. check-engine compares note numbers with engine values, not rebuilt strings (Pattern 8). |
| KILL-05 | Log HP column, kill row, enemy-down rows, kill line; HP edits re-score without staling | Pure `VM.killTrack(rounds, hp)`. In-place HP-cell updates keyed by `(run.id, hp)`. `Sim.sameAttack` stays unchanged, so HP never stales a run (Pattern 7). |
| KILL-06 | Tally shows total + outcome, re-scored live, cleared on attack change | `sim.tally` stores the frozen runs, not bare totals. The outcome is re-scored with `killTrack` at render time (Pattern 7). |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- One `index.html`: inline CSS and classic inline `<script>` blocks, no build step, no npm/package.json, no frameworks, no CDN, no external files.
- Node is **dev-only** (`tools/check-engine.mjs`, `tools/check-page.mjs`) and must never become a build or deploy dependency.
- Exact math derived by enumeration. **No Monte Carlo for displayed stats.** Monte Carlo is allowed only for the Roll button.
- DOM: `textContent` / `createElement`, `addEventListener` (no inline `onclick`), the `input` event for live controls (not `change`), and `innerHTML` only for integers and fixed literals (Phase 3 T-03-07).
- Randomness is injected: exactly one `Math.random` in the file, in `onRoll`. check-engine gate 0 fails on any mention in a pure block, comments included.
- Formatting stays exact: `VM.fixed` on scaled integers, U+2212 minus, and U+00A0 written as `String.fromCharCode(0xa0)`, because the Edit tool and Git Bash sed mangle escapes.
- GSD workflow: edits happen only inside `/gsd-execute-phase`. Commit locally. **Do not push**: every push to `main` redeploys the live site, and the user pushes only on request.

## Architectural Responsibility Map

Everything runs in the browser tier. The "tiers" here are the page's script blocks and the dev tools.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Per-hit pmf, E[H] recursion, median / P20 DP, exact BigInt E[H] | `#dice-math` (pure engine) | — | One damage rule (RULES-05). Pure and memo-free like the rest of DiceMath. |
| Kill-table memo (LRU per `hitFaces,die,dmg`), rounding with exact fallback, every string (cards, note, hits line, step labels, status) | `#view-model` | — | VM already owns memos (`leverMemo`, `chartMemo`) and all copy (D-04 of Phase 4). |
| `killTrack(rounds, hp)` re-scoring | `#view-model` (pure) | `#app` (paint) | A pure function of stored rolls and HP. No re-roll, draw order untouched. |
| HP box, step-button click, status write, in-place log/tally updates, init enable / failPage disable | `#app` (DOM layer) | — | Same pattern as Roll and the presets. |
| O(1) pins (defaults strings, one hand-made `killTrack`) | `#dice-selftest` | — | Node self-test is already at 191.5 ms of its 200 ms budget. |
| Exhaustive engine proofs, string/claim checks, timing report | `tools/check-engine.mjs` | — | The finite domain allows exhaustive checks. |
| Tab order, names, enabled state, `--expect`, fault modes, seeded re-score smoke | `tools/check-page.mjs` + the in-page `?test` UI smoke | — | Existing guard framework. |

## Standard Stack

### Core (all already in use, nothing new installed)
| Piece | Version | Purpose | Why Standard |
|-------|---------|---------|--------------|
| `Float64Array` / `Int32Array` | ES2015 | DP vectors, per-HP result tables | Tight, JIT-friendly loops. The measured budgets depend on them. `[VERIFIED: local measurement]` |
| `BigInt` | ES2020, evergreen browsers | Exact rational tie-breaker for displayed E[H] / E[R] rounding, and check-engine oracles | Only way to decide x.x5 ties exactly. Denominators reach c^500 ≈ 10^1718. `[VERIFIED: local measurement]` |
| Existing `DiceMath.damageFor`, `DiceMath.threshold`, `VM.parseControl`, `VM.fixed`, `setText`, `num()` | in repo | Damage rule, clamping, exact formatting, no-op writes | Reuse. No second copy (RULES-05, CTRL-05). |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Thinning for the median | Round-by-round DP over remaining HP (the UI-SPEC's method) | Simpler, but 13–27 ms worst in Chrome at cap 1,000. Use it as the **check-engine oracle**. Fall back to it in-page only with cap 500 (7–18 ms, 82,797 pairs "over 500" vs 40,163 "over 1,000"). |
| Float + exact tie-break | Float only | 590 E[H] / 1,259 E[R] pairs print a tenths digit that disagrees with the exact rational (off by 1 in the last digit, true value within ~1e-10 of the boundary). This violates D-06 "never a wrong number" under the page's round-half-up convention. |
| Float + exact tie-break | BigInt always | ~2 ms per key in Node for all 500 HP. Too slow to stack on the DP on every attack change. The fallback runs on ~0.1% of pairs. |
| Manual comma grouping | `toLocaleString()` / `Intl.NumberFormat()` without a locale | The default locale prints `1.296` in de-DE. The page's copy is English with fixed formatting. |

**Installation:** none. No packages.

## Package Legitimacy Audit

This phase installs no external packages: no npm, no pip, no CDN. The slopcheck gate does not apply. **Packages removed:** none. **Packages flagged:** none.

## Architecture Patterns

### System Architecture Diagram

```
 controls (input / click)                     Roll click (Math.random, the only one)
        │                                              │
        ▼                                              ▼
 onControl / onStepClick ── parseControl ──► state {ac,die,atk,dmg,n,hp}      rollWith(rng) → sim.run (frozen rounds),
        │                                    │                                 sim.tally = [run, ...] (runs, not totals)
        ▼ setState → rAF → render()          │
                                             ▼
                           VM.computeView(state) ── statsView (unchanged, per-combo callers)
                                             │
                                             ├─ killView(sv, hp) ──► memo key "hf,die,dmg" ──miss──► DiceMath.killTable(p)
                                             │      │                  (LRU ~8)                        ├ hitPmf via damageFor (true 2dX crit)
                                             │      │                                                  ├ E[H][1..500] recursion
                                             │      │                                                  └ thinning: medianRound[1..500], p10, p20
                                             │      ├─ roundKill(x, scale, exact) ── |frac−½|<1e-6? ──► DiceMath.killHitsExact (BigInt)
                                             │      └─ strings: step labels, hits line, heading, cards, note, status
                                             │
        render(): stale = !Sim.sameAttack(run.params, view.params)   (hp never compared)
                 │
                 ├─ renderControls / renderHp (labels, aria-disabled, hits line)
                 ├─ renderStats → kill heading, 3 cards, note
                 └─ renderSim → rows built once per run.id; HP cells / kill|down classes / tfoot / #sim-kill /
                               tally outcomes re-scored in place when (run.id, hp) changes ← VM.killTrack(rounds, hp)
```

### Recommended Structure (inside `index.html`)
```
<script id="dice-math">   + hitPmf(p), killTable(p), killHitsExact(table, hp), KILL_* constants
<script id="dice-sim">    unchanged (draw order contract untouched)
<script id="view-model">  + CONTROL_SPEC.hp, DEFAULT_STATE.hp, hpStep(sv, hp), killTrack(rounds, hp),
                            roundKill(), killNumText(), pctText(), group3(),
                            killViewFrom(table, sv, hp) [pure], killView(sv, hp) [memo wrapper],
                            hpStatus(), killLine(), tallyEntry(); computeView adds `kill`
<script id="dice-selftest"> + O(1) pins only
<script id="app">         + HP group refs, onStepClick, renderHp, kill cards in renderStats, renderSim HP scoring,
                            init enable / failPage disable of the step buttons, UI smoke blocks
tools/check-engine.mjs    + kill section (exhaustive per key × HP; per-setting strings at an HP sample)
tools/check-page.mjs      + guard 11 list, (7) enabled incl. .btn-step, fault: .btn-step disabled, expects
```

### Pattern 1: The kill math (what is computed)

The per-hit pmf comes from weights over `den = hitFaces × X²`, enumerated through `damageFor`:
- each normal face contributes `(hitFaces − 1) × X` per die face `k` → `max(0, k + D)`;
- the crit contributes 1 per pair `(a, b)` → `max(0, a + b + D)` (true 2dX).

Let `w0` be the zero-damage weight. Zero-damage hits are **counted as hits** in E[H], matching the "Average damage on a hit" card, which includes them.

- **E[H] (hits to kill):** h(n) = (den + Σ_{d≥1} w_d · h(n−d)) / (den − w0), with h(n ≤ 0) = 0. One pass fills HP 1..500 in O(500 × support). No cutoff. `den − w0 > 0` always, because the best crit (2X + D ≥ 3) always deals damage.
- **E[R] (rounds to kill):** `E[R] = 20 · E[H] / hitFaces`. This is exact (Wald's identity, or geometric thinning: each round is a hit with probability hitFaces/20, independent of damage). check-engine verifies it against an independent per-round recursion.
- **P(dead by round t):** damage is ≥ 0, so "dead by t" ⇔ cumulative damage after t rounds ≥ HP. Thinning: a round lands a *damaging* hit with `p′ = (hitFaces/20) · (1 − w0/den)`, and damaging hits deal iid damage with pmf `w_d / Σ_{d≥1} w_d`. With `F_j(hp) = P(S_j ≥ hp)`:
  `P(dead by t) = Σ_j Bin(t, p′)(j) · F_j(hp)`.
  The `F_j` rows come from a hit DP over 0..499 with an absorbing "≥ 500" bucket and suffix sums, and are built lazily as j grows. `Bin(t, ·)` updates in place: `b[j] = b[j]·(1−p′) + b[j−1]·p′`.
- **Median round:** the first t ≤ 1,000 with `P(dead by t) ≥ 0.5 − 1e-9`. Medians are non-decreasing in HP, so one pointer walks HP 1..500 during a single t loop, and the loop stops when HP 500 is placed or t = 1,000. `medianRound[hp] = 0` means past the cap. `P(dead by 1000) < 0.5` then means "half of fights last over 1,000 rounds", which is true.
- **P20 (and P10 for the D-05 pin):** the same sum at t = 20 (and t = 10) for every HP.
- **Fastest kill:** `ceil(hp / (2X + D))`, an integer. **"0%" iff fastest > 20.** Never derive it from the float: the 1e-30 truncation makes `p20 === 0` at 190 pairs where a kill is possible but below 1e-30, and those correctly print `<0.1%`.

Measured at the defaults (AC 15 / d8 / +5 / +0, HP 40): E[H] 8.69985, simple 8.14815, E[R] 15.81790, median 15, P20 0.846580, P10 0.111420. **This matches D-05.** `[VERIFIED: local run of page blocks]`

### Pattern 2: Performance: one table per attack key, HP edits are lookups

| Method (all HP 1..500 at once, per key) | Node 24 worst / mean | Headless Chrome worst (2 runs, noisy) | Notes |
|---|---|---|---|
| Round DP, naive (Map/destructuring) | 100–140 ms | — | Do not ship. |
| Round DP, typed arrays, cap 1,000 | ~10 ms / 1.6 ms | 12.8–27.5 ms (cold 13–34) | Over 16 ms. Worst at hitFaces 1, d10/d12, low D. |
| Round DP, typed arrays, cap 500 | — | 7.1–17.9 ms | 82,797 pairs print "over 500". |
| **Thinning, typed arrays, cap 1,000 (recommended)** | **≤ 6 ms / 1.1 ms** | **7.6–12.2 ms (cold 10–14)**, p99 2.9–6.9 | 0 median mismatches vs round DP. P10/P20 within 3e-15. |
| Existing `computeView` cold (for scale) | — | ≤ 4.1 ms, median 0.6 | Budget headroom for the rest of render(). |

`[VERIFIED: local measurement, Node 24.15.0 and Chrome headless=new on this machine, 2026-09-27]`

- **Memo key:** `${hitFaces},${die},${dmg}`, where `hitFaces = 21 − DiceMath.threshold(p)`. This is broader than the UI-SPEC's `(ac, die, atk, dmg, hp)`: dragging AC within a stretch that keeps the same hit faces reuses the table, and so does every HP edit and N drag. Keep a small LRU (Map, delete the oldest past ~8 entries; each entry ≈ 14 KB) plus a single-entry string memo keyed `hf,die,dmg,hp`.
- The self-test pin at the defaults warms the memo, so the first render reuses it and load time does not grow.
- check-engine must **not** call the memo wrapper in its 70,980-combo loop (LRU thrash). Split the view into a pure `VM.killViewFrom(table, sv, hp)` plus the memo wrapper `VM.killView(sv, hp)`. check-engine builds its own `Map` of 2,470 tables (~35 MB, fine in Node) and calls the pure builder. This mirrors how `explainChart` is pure and `chartView` memoizes.

### Pattern 3: Displayed rounding with an exact tie-breaker

- Float E[H] has a maximum absolute error of **1.3e-10** (relative 1.7e-12), and E[R] of 1.75e-10, over all 1,235,000 pairs. That is at most ~1.7e-8 in tenths units for values under 1,000.
- Use a **window of 1e-6 in display units**, 50x+ margin. Inside the window, decide exactly from `E[H] = N_n / c^n` (BigInt), where `c = den − w0` and `N_n = den·c^(n−1) + Σ_{d≥1} w_d·c^(d−1)·N_(n−d)` (derivation: multiply the recursion by cⁿ).
  - E[H] at scale s: `floor((2·s·N + cⁿ) / (2·cⁿ))`.
  - E[R] at scale s: numerator `20·N`, denominator `hitFaces·cⁿ`.
- Choose the format by the **rounded** value: tenths `t = roundKill(x, 10)`. If t < 10,000, print `fixed(t, 1)`. Otherwise print `group3(roundKill(x, 1))`. This avoids `1000.0` at 999.96.
- **Simple division** needs no fallback. It is an integer ratio: `tenths = floor((20·hp·X²·hf + e20Num) / (2·e20Num))`, with numerators ≤ 2.8e7. It is "under 0.1" iff `20·hp·X²·hf < e20Num` (539 pairs).
- **Percent (card 3):** keep the UI-SPEC rule. The measured nearest distance of any P20 to a percent-rounding boundary or branch threshold is > 1e-9 at every pair (0 within 1e-9), so floats decide it safely.

### Pattern 4: Median tie handling
`KILL_TIE_EPS = 1e-9` on the probability scale. The measured float error of the DPs is ~1e-13, and 81 non-tie values sit between 1e-9 and 1e-6 from 1/2 (the closest ~1e-7). check-engine must re-prove after any engine change that every `|P − 0.5| < 1e-9` case is an exact tie (BigInt round DP; all such cases have t ≤ 5, about 90 ms total). It should also print the smallest non-tie gap.

### Pattern 5: The HP control needs no new parse code
`CONTROL_SPEC.hp = Object.freeze({ min: 1, max: 500 })`, `DEFAULT_STATE.hp = 40`, and `<input type="number" id="hp-num" data-key="hp">` inside `form#controls`. The existing delegated `input` → `onControl`, `change` → `onChange` (normalizes the committed box), and `renderControls` (never overwrites a focused number box) cover it. `Object.assign(state, VM.DEFAULT_STATE, patch)` in every UI smoke then resets HP to 40 automatically.

### Pattern 6: The step buttons (click path)
- One delegated `click` listener on `form#controls`, added in `init()` after the first successful render, next to the others. **Buttons carry `data-step`, never `data-key`** (renderControls writes `.value` on every `[data-key]`).
- Compute the step and applied change **from `state` at click time**, not from the painted label or `aria-disabled`, which lag one rAF. Two quick clicks at HP 499 must give 500 and then do nothing.
- Inert means `aria-disabled="true"`, never `disabled`, so focus stays and guard 11's "no control disabled after init" holds. The markup ships `disabled`: init removes it with Roll and the presets, and `failPage` sets it again.
- The status follows the `#sim-status` pattern: clear, then write in the next rAF, guarded so a later HP change drops a stale message. The UI smoke must clear `#hp-status` in `finally` (like `#explore-status`) so the DOM dump never carries it.

### Pattern 7: Re-scoring the run without staling or flicker
- `sim.tally` stores the **frozen runs**: `[run, ...sim.tally].slice(0, 5)`, with the reset rule unchanged. Every existing reader of `sim.tally` must change: `join(' · ')`, `sim.tally[0] | 0`, `.length`, and the smoke expectations.
- `renderSim`: rows stay built once per `run.id`. Add a `killShown = {runId, hp}` cache. When it differs, update only cell 5 of each body row, the `kill` / `down` row classes, the tfoot HP cell, `#sim-kill`, and the tally text. **Never rebuild rows.** Reset the cache in `resetSim()` and in the no-run branch, and clear and hide `#sim-kill` there, so the markup matches a fresh load (03-REVIEW WR-02).
- The no-run branch already empties the log, which keeps check-page's 80 row headers at load. The new smoke blocks must end with `resetSim()` in `finally`.
- `Sim.simulate` and the draw-order contract do not change. The seeded totals (1 → 47, 5 → 54, 6 → 71) stay pinned.

### Pattern 8: Copy claims checked against the engine (Phase 4 lesson IN-02)
check-engine computes the expected number for each claim from its **own oracle values** and compares it with the digits the page prints. It never re-runs the VM's own formatter on the VM's own output. Examples:
- note sentence 1 `{EH}` must equal the exact-rational rounding of E[H];
- `{simple}` must equal the integer-ratio rounding;
- `{hitPct}` must equal `hitFaces × 5`;
- `{ER}` must equal the exact rounding of 20·N/(hf·cⁿ);
- "every hit kills" iff E[H] = 1 exactly (integer test `2 + D ≥ hp` and, when hitFaces ≥ 2, `1 + D ≥ hp`; 22,055 pairs, 0 mismatches);
- the displayed E[H] is strictly greater than the displayed simple number (0 ties or reversals at both scales);
- Wald's identity E[H] × avgHit > HP holds at every pair, which makes sentence 2 true everywhere.

### Anti-Patterns to Avoid
- **`>= 0.5` for the median:** wrong at HP 1 and a 50% hit chance (prints round 2), and at 657 exact-tie pairs.
- **Deriving "0%" from `p20 === 0`:** use the integer fastest-kill test.
- **Choosing the decimal format by the raw value (`x < 1000`):** 999.96 prints `1000.0`. Choose by the rounded tenths.
- **Memo keyed on `(ac, atk, …)` only, recomputed per HP:** every keystroke pays up to 12 ms. Key on `(hitFaces, die, dmg)` and cover all HP.
- **`renderSim` rebuilding rows on HP change:** breaks the Phase 3 no-flicker contract and the smoke check "rows are not rebuilt by later renders".
- **Reading the foot total as the last cell:** the new last tfoot cell is the HP left. The existing smoke `footCells[footCells.length - 1]` must become the damage cell (index 1, since `Total` spans 4 columns).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Damage per hit / crit | New damage arithmetic in the kill code | `DiceMath.damageFor(20, [k] or [a,b], p)` | RULES-05: one rule. The floor at 0 and the true 2dX crit come for free. |
| Clamping HP input | A new parser or `parseInt` | `VM.parseControl('hp', raw, prev)` | CTRL-05. Handles blank, `12abc`, and out-of-range values. |
| Hit faces | Re-deriving from ac/atk | `21 − DiceMath.threshold(p)` | Same as `e20At`. Clamped 1..19. |
| Decimal formatting | `toFixed` on floats | `VM.fixed(intScaled, d)` after integer rounding | The page never formats floats directly. |
| Thousands separator | `toLocaleString()` | `String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')` | Locale-independent. |
| Seeded runs in checks | New PRNG | `Sim.mulberry32(seed)` + `Sim.simulate` | Pinned draw order. |
| No-op DOM writes | Ad-hoc `textContent =` | `setText(el, text)` and the `num()` helper | Existing no-flicker helpers. |

**Key insight:** the hard part is not the DP. It is making the displayed digits provably right. The domain is finite (1,235,000 pairs), so check-engine should prove display correctness exhaustively against exact oracles, as Phase 4 did for copy.

## Common Pitfalls

### Pitfall 1: The median's exact 1/2 ties
**What goes wrong:** At a 50% hit chance and HP 1, the card reads "half of fights by round 2" instead of round 1.
**Why it happens:** The float sum of `w/320` pieces is 0.49999999999999994, not 0.5. Summation order decides which way it falls.
**How to avoid:** `>= 0.5 − 1e-9`. check-engine proves every near-tie is exact (Pattern 4).
**Warning signs:** The median changes when the DP loop order changes.

### Pitfall 2: Tenths that disagree with the exact value
**What goes wrong:** Nat-20-only d4, HP 114 prints `23.3` where the exact value rounds to `23.2`. 590 E[H] and 1,259 E[R] pairs are affected.
**Why it happens:** E[H](n) approaches a line geometrically, so exact values sit within 1e-11 or less of x.x5, and some are exact ties.
**How to avoid:** Pattern 3 exact fallback. check-engine compares every pair with BigInt.
**Warning signs:** Any float-only `Math.round(10 * eh)` in the view-model.

### Pitfall 3: The 16 ms budget at nat-20-only settings
**What goes wrong:** A 25 ms frame on the first render after the AC slider enters the hitFaces = 1 region at HP 500.
**Why it happens:** The round DP costs cap × 500 × ~24.
**How to avoid:** Thinning (Pattern 2) plus the per-key LRU. check-engine prints the worst `killTable` time over 2,470 keys and **warns** above 8 ms in Node (≈ 16 ms in Chrome). It does not fail on time, because timing is flaky.

### Pitfall 4: The step button and stale labels
**What goes wrong:** A double click near 500 overshoots, or a click right after an attack change uses the old step.
**How to avoid:** Compute from `state` in the handler (Pattern 6). Never parse the label.

### Pitfall 5: check-page guards that break on the new controls
- **(11)** The tab order must become `ac-range, ac-num, die, atk-num, dmg-num, hp-num, hp-minus, hp-plus, n-range, roll, cross, dmg, cap, #chart, #controls`. The same list lives in the in-page `a11y ui` smoke (`order` array). Update both.
- **(11)** "no control `disabled`": step buttons must be enabled in init. Inert uses `aria-disabled`.
- **(7)** Extend it to "Roll, three presets and the two `.btn-step` buttons enabled after init". **Fault modes:** add "every `.btn-step` disabled".
- **(9) / (10)** pass without changes: the buttons are named by their text, and the box by `<label for>`. Verified against the guard code.
- **(14)** page order is unchanged: the HP group is inside `form#controls`, and the kill cards are inside `section#stats`.
- **(3)** 80 row headers at load are unchanged: the log is empty at load, and the tfoot `Total` keeps `colspan="4"`.

### Pitfall 6: Existing smoke checks that the tally and tfoot changes break
`'sim log ui: seed 6 foot total'` reads the last tfoot cell. `'sim log ui: tally text'` expects `71 · 54 · 47 (expected 54.0)`, which becomes `71 · killed R15; 54 · killed R11; 47 · killed R16 (expected 54.0)` at HP 40. `'sim log ui: newest tally total is bold'` stays. Seeded pins, computed this session:

| Seed (defaults) | Total | HP 40 | HP 47 | HP 48 | HP 71 | HP 72 |
|---|---|---|---|---|---|---|
| 1 | 47 | killed R16 (8 hits) | killed R20 (10 hits), the last-round edge, no "down" rows | survived, 1 HP left | 24 left | 25 left |
| 5 | 54 | killed R11 (9 hits) | killed R17 (11) | killed R17 (11) | 17 left | 18 left |
| 6 | 71 | killed R15 (9 hits) | killed R16 (10) | killed R16 (10) | killed R18 (12) | survived, 1 HP left |

### Pitfall 7: Node self-test budget
The Node self-test is at 191.5 ms of 200 ms (only a **warning** in check-engine). The Chrome gate in check-page is 37–40 ms of 200. Add only O(1) pins: the defaults card strings, one hand-made 3-round `killTrack`, and the default step. The defaults `killTable` costs ~1–3 ms cold and is reused by the first render through the memo.

### Pitfall 8: check-engine letters are exhausted
All 26 of `a`..`z` are used in `names`. Use new keys such as `K1`..`K9`. The report loop iterates `Object.keys(names)`, so any string key works.

### Pitfall 9: Static markup vs VM strings
If the markup ships default labels (`−1 hit (−5 HP)` and the hits line) for the no-JS state, add a parity check like Phase 4 (x): static markup equals the VM output at `DEFAULT_STATE`.

## Code Examples

### Engine (validated this session: 0 display / median mismatches over 1,235,000 pairs)
```js
// #dice-math. Pure, memo-free. Constants documented for D-06.
const KILL_HP_MAX = 500, KILL_MEDIAN_CAP = 1000, KILL_TIE_EPS = 1e-9, KILL_TINY = 1e-30;

// Per-hit damage weights over den = hitFaces * X^2, conditional on hitting (true 2dX crit).
function hitPmf(p) {
  assertParams(p);
  const X = p.die, hf = 21 - threshold(p);
  const w = new Map(), add = (d, k) => w.set(d, (w.get(d) || 0) + k);
  for (let k = 1; k <= X; k++) add(damageFor(20, [k], p), (hf - 1) * X);                 // normal faces
  for (let a = 1; a <= X; a++) for (let b = 1; b <= X; b++) add(damageFor(20, [a, b], p), 1);
  return { hitFaces: hf, den: hf * X * X, w: [...w].sort((x, y) => x[0] - y[0]) };
}

// Every HP 1..500 at once: eHits, p10, p20, medianRound (0 = past the cap).
function killTable(p) {
  const H = KILL_HP_MAX, W = H + 1, { hitFaces: hf, den, w } = hitPmf(p);
  let w0 = 0, wpos = 0; const ds = [], ws = [];
  for (const [d, k] of w) if (d === 0) w0 = k; else { ds.push(d); ws.push(k); wpos += k; }
  const K = ds.length;
  const eHits = new Float64Array(W);                  // h(n) = (den + sum w_d h(n-d)) / (den - w0)
  for (let n = 1; n <= H; n++) {
    let s = den;
    for (let k = 0; k < K; k++) if (n > ds[k]) s += ws[k] * eHits[n - ds[k]];
    eHits[n] = s / (den - w0);
  }
  // Thinning: damaging hit per round with pp; F[j*W + hp] = P(damage of j damaging hits >= hp).
  const pp = (hf * wpos) / (20 * den), qq = 1 - pp, hq = ws.map((k) => k / wpos);
  let F = new Float64Array(64 * W), rows = 0;
  let cur = new Float64Array(H), nxt = new Float64Array(H), dead = 0, top = 0;
  cur[0] = 1;
  const pushRow = () => {
    if ((rows + 1) * W > F.length) { const G = new Float64Array(F.length * 2); G.set(F); F = G; }
    const o = rows * W; F[o + H] = dead;
    for (let s = H - 1; s >= 1; s--) F[o + s] = F[o + s + 1] + cur[s];
    rows++;
  };
  const hitStep = () => {
    nxt.fill(0);
    let nt = top;
    for (let k = 0; k < K; k++) {
      const d = ds[k], q = hq[k], lim = Math.min(top, H - 1 - d);
      for (let s = 0; s <= lim; s++) nxt[s + d] += cur[s] * q;
      for (let s = Math.max(0, lim + 1); s <= top; s++) dead += cur[s] * q;
      if (lim + d > nt) nt = lim + d;
    }
    top = nt; const t = cur; cur = nxt; nxt = t; pushRow();
  };
  pushRow();                                           // j = 0
  const b = new Float64Array(KILL_MEDIAN_CAP + 2); b[0] = 1;   // Bin(t, pp) on [lo, hi]
  let lo = 0, hi = 0, open = 1;
  const pDead = (hp) => { let s = 0; for (let j = lo, o = lo * W + hp; j <= hi; j++, o += W) s += b[j] * F[o]; return s; };
  const p10 = new Float64Array(W), p20 = new Float64Array(W), medianRound = new Int32Array(W);
  for (let t = 1; t <= KILL_MEDIAN_CAP; t++) {
    b[hi + 1] = b[hi] * pp;
    for (let j = hi; j > lo; j--) b[j] = b[j] * qq + b[j - 1] * pp;
    b[lo] *= qq; hi++;
    while (b[lo] < KILL_TINY && lo < hi) b[lo++] = 0;           // tails < 1e-30: invisible in doubles
    while (b[hi] < KILL_TINY && hi > lo) b[hi--] = 0;
    while (rows <= hi) hitStep();
    if (t === 10 || t === 20) { const a = t === 10 ? p10 : p20; for (let hp = 1; hp <= H; hp++) a[hp] = pDead(hp); }
    while (open <= H && pDead(open) >= 0.5 - KILL_TIE_EPS) medianRound[open++] = t;   // exact 1/2 ties
    if (open > H && t >= 20) break;
  }
  return { hitFaces: hf, den, w0, pos: ds.map((d, i) => [d, ws[i]]), eHits, p10, p20, medianRound };
}

// Exact E[H] at hp as BigInt num/den, for the display tie-breaker only (bounded: hp <= 500).
function killHitsExact(t, hp) {
  const den = BigInt(t.den), c = den - BigInt(t.w0);
  const a = t.pos.map(([d, w]) => [d, BigInt(w) * c ** BigInt(d - 1)]);
  const N = [0n]; let cn = 1n;
  for (let n = 1; n <= hp; n++) {
    let s = den * cn;
    for (const [d, x] of a) if (n > d) s += x * N[n - d];
    N.push(s); cn *= c;
  }
  return { num: N[hp], den: cn };                    // E[H] = num / den
}
```

### View-model rounding and formats
```js
const ROUND_WINDOW = 1e-6;   // display units; >= 50x the worst float error measured (1.7e-8)
// round-half-up(x * scale); exact rational decision when within the window of k + 1/2
function roundKill(x, scale, exact) {
  const y = x * scale, f = y - Math.floor(y);
  if (Math.abs(f - 0.5) >= ROUND_WINDOW) return Math.round(y);
  const { num, den } = exact(), S = BigInt(scale);
  return Number((2n * S * num + den) / (2n * den));
}
const group3 = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
function killNumText(x, exact) {                       // "8.7", "652.0", "1,296", "15,215"
  const t = roundKill(x, 10, exact);
  return t < 10000 ? fixed(t, 1) : group3(roundKill(x, 1, exact));
}
// E[R] exact = 20 * E[H] / hitFaces:
//   const exR = () => { const e = DiceMath.killHitsExact(T, hp); return { num: 20n * e.num, den: BigInt(T.hitFaces) * e.den }; };
// Step (D-02/D-03), all integers: num = e20Num, den = e20Den * hitFaces
//   step = Math.floor((2 * num + den) / (2 * den)); minus = Math.min(step, hp - 1); plus = Math.min(step, 500 - hp);
// Simple tenths (integers): sT = Math.floor((20*hp*X*X*hf + e20Num) / (2*e20Num)); "under 0.1" iff 20*hp*X*X*hf < e20Num
```

### Pure re-scoring
```js
// VM.killTrack: HP left after each round (null after the kill), the kill round, hits up to it
// (hit or crit, 0-damage hits included, like E[H]), and HP left after round 20.
function killTrack(rounds, hp) {
  let left = hp, killRound = null, hits = 0, total = 0;
  const hpAfter = [];
  for (const r of rounds) {
    total += r.damage;
    if (killRound !== null) { hpAfter.push(null); continue; }
    if (r.result !== 'miss') hits++;                   // a nat 1 is already 'miss'
    left = Math.max(0, left - r.damage);
    if (left === 0) killRound = r.round;
    hpAfter.push(left);
  }
  return Object.freeze({ hpAfter, killRound, hits: killRound === null ? null : hits,
    leftAfter: Math.max(0, hp - total) });
}
```

### Step click (app)
```js
function onStepClick(e) {
  const b = e.target.closest('button[data-step]');
  if (!b || b.disabled) return;
  const s = VM.hpStep(VM.statsView(state), state.hp);        // from state, never the painted label
  const applied = Number(b.dataset.step) < 0 ? -s.minus : s.plus;
  if (applied === 0) return;                                  // inert (aria-disabled): nothing happens
  const hp = VM.parseControl('hp', state.hp + applied, state.hp);
  setState({ hp });
  hpStatusEl.textContent = '';
  const msg = VM.hpStatus(VM.statsView(state), hp);
  requestAnimationFrame(() => { if (state.hp === hp) hpStatusEl.textContent = msg; });
}
```

### check-engine oracles (independent of the page's method)
```js
// Round-by-round DP over cumulative damage (truncated at 500, absorbing), all HP in one pass:
// per-round weights = hit weights scaled to 20*X^2 plus (20 - hf) * X^2 at 0. Suffix sums give
// P(dead by t) for every hp; medians by the same pointer with >= 0.5 - 1e-9. ~4.4 s for 2,470 keys.
// BigInt E[H]: N_n recurrence for n = 1..500 per key (~4.7 s for 2,470 keys) -> exact tenths /
// whole of E[H] and E[R] at every pair. Near-ties (|P - 1/2| < 1e-9): BigInt round DP over
// (20 X^2)^t, t <= 5, ~90 ms total.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| UI-SPEC: per-HP round DP, lower the cap if > 16 ms | Per-key thinning table for all HP, cap stays 1,000, round DP kept as oracle | This research | Budget met without degrading copy. HP edits become free. |
| `sim.tally` = totals | `sim.tally` = frozen runs | This phase | Outcomes can re-score with HP (D-10). |

**Deprecated/outdated:** none.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Headless Chrome timings on this machine represent a typical laptop within ~2x. The runs varied 2x run to run. | Pattern 2 | A slow machine may see ~20 ms on the first entry into a rare key. That is one frame, once, cached afterwards. |
| A2 | Dropping binomial tail entries below 1e-30 is within the D-06 "exact DP" spirit | Pattern 1 | None for display: verified 0 mismatches vs the untruncated DP. If the user wants no truncation at all, use the round DP with cap 500 instead. |
| A3 | BigInt in an inline classic script is acceptable (ES2020, all evergreen browsers). It is used only for the rare tie-break. | Pattern 3 | If it is ruled out: accept ±1 in the last digit at ~0.15% of pairs and document it. |
| A4 | An LRU of ~8 kill tables is enough | Pattern 2 | Only performance: a user toggling among many keys recomputes (≤ 12 ms each). |
| A5 | Keep the UI-SPEC percent rule even though p in [0.0095, 0.01) prints `1.0%` (1,263 pairs) while 0.010 prints `1%` | Pattern 3 | Cosmetic only. Both are true statements. |

## Open Questions

1. **Accept the thinning method, which deviates from the UI-SPEC's "round-by-round DP"?**
   - What we know: it meets the budget at cap 1,000, and the round DP becomes the oracle. The copy is unchanged.
   - Recommendation: adopt it under the CONTEXT discretion "DP cutoff or tail method". Record it as a deviation in the plan summary.
2. **Percent branch by raw p vs rounded value (`1.0%`)?**
   - Recommendation: keep the approved rule. Optionally choose branches from the rounded value in a later polish pass.
3. **check-engine runtime grows from ~46 s to ~65 s.**
   - Recommendation: accept it (dev-only). Put the exhaustive kill section in its own loop over the 2,470 keys, outside the 70,980-combo loop. The per-setting string checks run inside the combo loop at an HP sample.

## Suggested Plan Breakdown (MVP vertical slices; all edit `index.html`, so waves are sequential; no publish plan)

| Plan | Wave | Scope | Requirements | Verify |
|------|------|-------|--------------|--------|
| **05-01 Kill engine + proofs** | 1 | `DiceMath.hitPmf/killTable/killHitsExact`. VM `CONTROL_SPEC.hp`, `DEFAULT_STATE.hp`, `hpStep`, `roundKill`/formats, `killViewFrom` + memo `killView`, `killTrack`, `computeView.kill`. Self-test O(1) pins. check-engine K-section: exhaustive per key × HP vs round DP + BigInt; per-setting strings at HP sample {1, 2, 3, 5, 40, 45, 100, 499, 500, 1+D, 2+D, 3+D, 20·(2X+D), 20·(2X+D)+1, m·step±1 for m = 1..3} clamped to 1..500; D-05 pins; claim checks (Pattern 8); timing report | KILL-02 (math), KILL-03, KILL-04 (claims) | `node tools/check-engine.mjs` PASS; existing pages unchanged (`check-page` PASS) |
| **05-02 Enemy HP control + kill cards** | 2 | HP group markup and CSS (UI-SPEC), `onStepClick`, `renderHp`, init enable / failPage disable, kill heading + 3 cards + note in `#stats`, `#hp-status`. check-page guard 11 list, (7), fault `.btn-step`, `--expect` defaults. `a11y ui` order list. UI smoke: typing clamps, step clicks, bounds, step-0 inert, focus kept | KILL-01, KILL-02, KILL-03, KILL-04 | check-engine + check-page in all five modes (`?test`, `--plain`, `--fault render`, `--fault later`, `--width 390`) |
| **05-03 The 20-round roll kills** | 3 | Log 6th column, `tr.kill` / `tr.down`, tfoot HP, `#sim-kill`, tally stores runs, `; ` entries with outcomes, roll-status sentence, sim intro sentence, CSS. Update the Phase 3 smoke (foot cell index, tally text). New seeded smoke: HP edit re-scores in place (same `run.id`, same row nodes, no `is-stale`, `tr.kill` moves, seed 6: R15 at HP 40, survives at HP 72), attack change still stales and hides the tally. Manual gate at 1366 / 360 in both schemes | KILL-05, KILL-06 | check-engine + check-page all modes + UI-SPEC manual gate |

05-01 and 05-02 can merge into one plan if the planner prefers fewer, larger slices (granularity: coarse). Keeping the engine separate lets the hardest math be proven before any UI depends on it.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | check-engine, check-page | ✓ | 24.15.0 | — |
| Chrome (headless) | check-page | ✓ | `C:\Program Files\Google\Chrome\Application\chrome.exe` | Edge (check-page candidate list) |
| BigInt | page tie-break, oracles | ✓ | Node 24 / Chrome evergreen | — |

Baseline this session: `check-engine` PASS (251/251, 70,980 combos, 46 s, Node self-test 191.5 ms). `check-page` PASS (Chrome self-test 37–40 ms).

**Missing dependencies:** none.

## Validation Architecture

Skipped: `workflow.nyquist_validation` is `false` in `.planning/config.json`. The verification commands are listed per plan above.

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | `VM.parseControl` with `CONTROL_SPEC.hp` (clamp 1..500, reject non-numeric). The step path goes through the same parser. |
| V6 Cryptography | no | `Math.random` is only for the Roll button (non-crypto, existing). |

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| HTML injection through the log / tally | Tampering | Keep T-03-07: `innerHTML` only with `| 0` integers and fixed literals. Kill cells are built with `createElement` + `textContent`. |
| CPU exhaustion from extreme settings | DoS | Bounded work: HP ≤ 500, cap 1,000, BigInt only for hp ≤ 500 inside the tie window. Worst case measured at ≤ 12 ms. |
| Script injection via markup | Tampering | CSP `<meta>` unchanged (`script-src 'unsafe-inline'` only, no network). No new sources. |

## Sources

### Primary (HIGH confidence)
- `index.html` blocks `#dice-math`, `#dice-sim`, `#view-model`, `#app` (read and executed in Node and Chrome this session)
- `tools/check-engine.mjs`, `tools/check-page.mjs` (guards 3, 7, 9–14, fault modes, report loop)
- `05-CONTEXT.md`, `05-UI-SPEC.md` (approved), `REQUIREMENTS.md`, `STATE.md`, `PROJECT.md`, `04-REVIEW-FIX.md`, `03-RESEARCH.md`
- Local scratch measurements (scratchpad `t1`..`t16`): D-05 values; timings (Node / headless Chrome); exhaustive comparisons over 2,470 keys × HP 1..500 against the round DP and BigInt rationals; step scan over 70,980 settings

### Secondary (MEDIUM confidence)
- Wald's identity and binomial thinning of a Bernoulli hit process: standard probability. Confirmed numerically here (E[R]·hf = 20·E[H]; thinning medians = round-DP medians at all pairs).

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. No new dependencies. BigInt and typed arrays were exercised in both runtimes.
- Architecture: HIGH. Traced in the code: control path, renderSim cache, tally readers, guards.
- Kill math and precision: HIGH. Exhaustive over the whole finite domain against two independent oracles.
- Performance: MEDIUM-HIGH. Measured, but headless Chrome varied 2x between runs.

**Research date:** 2026-09-27
**Valid until:** stable (no external dependencies). Re-measure if `damageFor`, the control domains or `KILL_*` constants change.
