# Phase 3: Roll-20-Rounds Simulation - Research

**Researched:** 2026-09-26
**Domain:** Seeded dice simulation, exact variance by enumeration, and event-driven UI state (with staleness) in a single vanilla `index.html`
**Confidence:** HIGH. Every number below was computed this session by running the real `#dice-math` and `#view-model` blocks from `index.html` in Node 24.15.0. Only one browser-support fact, the CSS alt-text syntax, comes from MDN compat data.

## Summary

Phase 3 adds the one non-deterministic feature on the page. The stack is settled: one `index.html`, classic inline scripts, no dependencies. The work is to add four small pieces without disturbing the Phase 1/2 pipeline:

1. `DiceMath.spread(p)`: exact variance from the same enumeration as `stats()`.
2. A new `<script id="dice-sim">` block: `mulberry32`, `rollDie`, `simulate`, `sameAttack`, `runMarks`.
3. `VM.simExact` plus the copy helpers.
4. An event-driven `#sim` section whose run lives *outside* `state` and is compared with the current attack on every render.

The exact math is simple and fully checked. Over the whole control domain (70,980 settings):

- The first moment of the one-round enumeration equals `stats().e20Num`.
- All integers stay under 6.4e11, far below 2^53.
- `Math.round(10 * sqrt(var20))` never lands within 1e-6 of a .05 tie, so plain `Math.round` gives the exact tenths.
- The SD never rounds to 0 (minimum 1.109).
- The defaults reproduce D-05: Var(one round) = **10.035**, SD(20) = **14.1669**, shown as `54.0 ± 14.2`.

The seeded PRNG (bryc's public-domain `mulberry32`) matches the canonical source over 6,000 outputs. Ten 20-round seeded runs take 0.15 ms, so the in-page checks cost almost nothing against the ~11 ms that remains of the 200 ms self-test budget (Node self-test now 188-189 ms).

The research also turned up one copy problem the UI-SPEC did not anticipate. **"About 2 runs in 3" is false for every "only a nat 20 hits" setting whose lower bound stays above 0** (9,520 settings, true probability 0.455). The reason is that 35.8% of runs total exactly 0, and those fall just below a lower bound of 0.1 to 0.6. There is a simple fix inside Claude's discretion: use the lopsided wording, lower bound 0.0, when `E − SD < 0` **or** only a nat 20 hits. Then the normal wording is always within 0.60 to 0.87 (p1 to p99: 0.645 to 0.740), and "Most runs" is always at least 0.814.

The other main risks are integration hazards, not math:

- The run's params must be a **copy** (`state` is mutated in place).
- `runUiSmoke` must clear the run before it returns, or the DOM dump will show 101 row headers instead of 80.
- `renderSim` must never replace the node that holds the button (focus loss).
- The WR-01 guard must wrap the first render, and the button is enabled only after it.

**Primary recommendation:** Build three sequential vertical slices, all editing `index.html`:

1. The roll button with realized vs exact ± SD, plus the engine and self-test.
2. The per-round log, staleness, and tally.
3. The marks on `#outcome` and phase verification.

Keep large-sample and full-domain checks in `tools/check-engine.mjs`. Keep only the exact seeded and stub-RNG assertions in the page.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Placement and first load**
- **D-01:** The simulation is its own section at the bottom of `<main>`, after the sweep chart section. Page order becomes: controls → stat cards → outcome table → Compare +N → sweep chart → **Roll 20 rounds**. Nothing above it moves (Phase 2 D-01 and D-02 stay intact).
- **D-02:** Before the first roll, the section shows "Expected (exact)" with its spread for the current settings, and the realized slot reads "Not rolled yet" with the "Roll 20 rounds" button. The log and tally are hidden until there is a run. Nothing rolls on page load (SIM-04).

**Realized vs expected display (SIM-02, SIM-05)**
- **D-03:** Two side-by-side figures, visually distinct: "Expected (exact)" and "This run (simulated)". The exact one is shown as `54.0 ± 14.2` (at the defaults). Exact and simulated numbers must never share styling, so they cannot blur together.
- **D-04:** Under them, a plain-language spread line: "About 2 runs in 3 land between 39.8 and 68.2." A second line places the run: "This run is 7.0 above expected (0.5 SD)." (or "below", or "exactly on").
- **D-05:** The standard deviation is exact, from the one-round damage distribution: SD(20 rounds) = sqrt(20 × Var(one round)), enumerated through `DiceMath` with a true 2dX crit. No Monte Carlo for any displayed exact figure. At the defaults (AC 15, d8, +5, +0) Var(one round) = 10.035, so SD(20) ≈ 14.17.

**Per-round log (SIM-03)**
- **D-06:** A compact 20-row table with the columns Round, d20, Result (miss / hit / crit, with nat 1 shown as a miss), Damage dice, and Damage. A crit shows both dice ("6 + 3"). A miss shows "—" for dice and 0 damage. A total row at the bottom equals the realized total exactly.
- **D-07:** The roll is instant. All 20 rounds and the total appear at once, with no reveal animation.

**Staleness (SIM-04)**
- **D-08:** When any control that changes the attack (AC, die, attack bonus, damage bonus) changes after a roll, the run dims. A note reads "Rolled at AC 15, d8, +5 to hit, +0 damage. Settings changed. Roll again to compare." The dimmed run keeps its **own** rolled-at expected ± SD beside it, so the pair always describes the same attack. A separate "Now:" line shows the expected ± SD at the current settings.
- **D-09:** Changing a control back to the rolled-at settings may un-stale the run, since staleness is a comparison of the rolled-at parameters with the current ones and not a one-way flag. The simulation never re-rolls on its own. Dragging a slider causes no flicker, because only the dim state and the "Now:" line update.

**Run tally**
- **D-10:** A small tally lists the last 5 run totals at the current settings, newest first, including the current run. Repeated clicks show luck moving around the expected value. The tally clears when the settings change (D-13).

**Marks on the big outcome table**
- **D-11:** A run marks its outcomes on the big Phase 1 `#outcome` table only (not the three compact tables). A normal hit marks its exact (d20, die face) cell with an ink outline, plus a small "×2" style count badge when the same cell was rolled more than once. The mark must read on every heat color and without color.
- **D-12:** A crit marks the **nat-20 row label** with a count (for example "crit ×1"), never a cell, because no single cell in the crit row (2 × face + D) equals a real two-dice crit like 6 + 3. The log carries the real dice.
- **D-13:** When a control changes, the table marks and the tally clear, because the table now shows different outcomes and old marks would point at the wrong cells. The dimmed run and its log stay in the section with the rolled-at note (D-08).

**Carried forward (locked earlier, not re-asked)**
- **D-14:** Dice use `1 + floor(rng() * sides)` (SIM-01), and every damage value goes through `DiceMath.damageFor` (RULES-05, Phase 1 D-15), so the simulator cannot drift from the table. Damage never goes below 0.
- **D-15:** The dice function takes an injectable random source (SIM-06). The page uses `Math.random`. The self-test passes a seeded PRNG (mulberry32 per research) and asserts exact, reproducible results on every load (success criterion 4).
- **D-16:** The tabletop theme, tabular numerals for every number, classic inline `<script>` blocks, real `<table>` markup, and light/dark tokens all carry over from Phase 1.

**Also locked:** `03-UI-SPEC.md` (status: approved) fixes layout, tokens, copy, the button contract, the log contract, the marks contract (ring + badge CSS, row-label counts for crits *and* misses/nat 1s, the always-present legend item), the interaction contract (the `run.id` render cache, the status region written only by the click handler), and the assumptions A1 to A8. The planner must follow the UI-SPEC verbatim except where this research flags a numeric honesty issue (see Open Question 1).

### Claude's Discretion
- Which controls count as "changing the attack". The compare "+N" slider does not change the attack being rolled, so moving it should **not** stale the run or clear the marks.
- How misses and nat 1s appear in the big-table marks. The recommended approach marks their d20 row label with a count, like crits, since no damage die was rolled.
- The exact wording of the rolled-at note, the "Now:" line, the spread line, and the "Not rolled yet" prompt.
- Visual treatment that keeps exact and simulated figures distinct, such as weight, a "simulated" tag, a dashed border, or an icon. It must not rely on color alone.
- The spread line when E − SD falls below 0. Clamp the lower bound to 0 and word the line accordingly. "About 2 runs in 3" is an approximation and may carry a light qualifier.
- Whether the tally shows totals only or totals with a small above/below marker.
- Where the seeded PRNG and `simulate()` live (research suggests a `<script id="dice-sim">` block between the engine and the self-test).
- How the section is laid out at phone width.

### Deferred Ideas (OUT OF SCOPE)
None. The discussion stayed within phase scope. Two options were offered and declined:
- A quick reveal animation (D-07 chose instant).
- A number-line strip for the spread (D-04 chose the text line).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SIM-01 | "Roll 20 rounds" rolls a real d20 and real damage dice per round (two on a crit) with `1 + floor(random * sides)` and shows the realized total | `Sim.rollDie` / `Sim.simulate` (Code Examples). Draw order is fixed as a contract. Stub-RNG checks prove the face range (rng 0 → face 1, rng 1−2^−53 → face 20). Seed 6 proves two real dice (crit 8 + 3 = 11, odd, so not 2 × face). |
| SIM-02 | Realized total next to, and visually distinct from, the exact total: "This run (simulated)" vs "Expected (exact)" | UI-SPEC result block. `VM.simExact(p).eText` reuses `VM.tenths` so it matches the "Expected over 20 rounds" card (STAT-02). The run is stored with a frozen params copy. |
| SIM-03 | Per-round log: d20, hit/miss/crit, damage dice, damage | `run.rounds[i] = {round, d20, kind, result, dice, damage}` is everything the log needs. Seeded check: Σ damage === total. The log is rebuilt only when `run.id` changes. |
| SIM-04 | Rolls only on click; any control change marks the result stale with the rolled-at params, never re-rolls | Staleness is `!Sim.sameAttack(run.params, currentParams)` over {ac, die, atk, dmg} only (not `n`), computed in `render()`. `Math.random` appears exactly once in the file, inside the click handler. |
| SIM-05 | Expected total shown with its exact SD from the one-round distribution | `DiceMath.spread(p)`: integer moments over den1 = 20·X², `var20 = (den1·s2 − s1²)/(20·X⁴)`. Reference table below. Full-domain safety facts verified. |
| SIM-06 | Dice function accepts an injectable random source; self-test runs it seeded | `simulate(p, rounds, rng)` with `rng` required (no default). `Sim.mulberry32` in the page. Pinned seeded totals: seed 1 → 47, seed 5 → 54, seed 6 → 71 at the defaults. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **One `index.html`, no build step, GitHub Pages static files only.** No new files ship. `tools/*.mjs` stay dev-only and optional.
- **Vanilla HTML/CSS/JS, no frameworks, no CDN libraries.** `mulberry32` is hand-written inline (about 8 lines). No npm packages.
- **Classic inline `<script>` blocks** (Phase 1 decision, which supersedes the CLAUDE.md "module" suggestion; DEPLOY-01 says "classic inline `<script>` blocks"). The new block is `<script id="dice-sim">` with no other attributes, because `tools/check-engine.mjs` extracts blocks with the exact string `<script id="${id}">`.
- **Readability:** the `#outcome` table must stay legible at d12. Marks must not shift layout (pseudo-elements only).
- **Exact math from the table, Monte Carlo only for the "roll 20 rounds" button.** The SD is exact (D-05). Sampling appears only in the dev check.
- **`innerHTML` only for static, fully numeric or fixed-literal output.** Log rows and marks attributes are integers and fixed words, so they are allowed. Everything else uses `textContent` / `createElement`.
- **`input` event, not `change`, for sliders.** This is unchanged. Staleness must follow the live `input` stream.
- **`addEventListener` only, no inline `on*` attributes** (CSP `script-src 'unsafe-inline'` is kept, but inline handlers are banned by convention).
- **GSD workflow:** edits go through `/gsd-execute-phase`.
- **User memory: GitHub deploy deferred.** Local git only. No push, `gh auth`, or Pages in this phase.
- **User memory: minimal interruptions.** Plans should use recommended defaults and avoid checkpoints unless necessary.

## Architectural Responsibility Map

The whole app is one static page, so every tier below is a script block inside the browser. The table maps each capability to the block that owns it.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Exact one-round moments and 20-round variance | Engine (`#dice-math`, `DiceMath.spread`) | — | It is rules math and must use `outcome`/`damageFor` (RULES-05). It is pure and runs in Node. |
| Dice rolling, seeded PRNG, run records, mark counts | Simulator (`#dice-sim`, `Sim`) | Engine (`damageFor`, `outcome`, `assertParams`) | The only code that consumes randomness. Pure given `rng`. Never calls `Math.random` itself. |
| Tenths rounding, SD text, spread/placement/status/settings copy | View-model (`#view-model`, `VM.simExact`, `VM.simPlacement`, `VM.settingsText`) | — | Formatting stays out of the engine (Pattern 3). Testable in Node. Shares `tenths`/`fixed`/`signed` with the stat cards. |
| Run storage, tally, staleness comparison, marks derivation per render | App (`#app`, a module-level `sim` object) | Sim (`sameAttack`, `runMarks`) | A run is an event, not state (Pattern 4). `render()` compares the run with the current state every frame. |
| Section DOM, log table, figure text, stale classes, table marks | App renderers (`renderSim`, `renderOutcomeTable` + `marks`) | CSS | Rendering only. No math, no state writes. |
| Seeded exact assertions (tiny) | Self-test (`#dice-selftest`, `section('sim', ...)`) | — | Runs on every load. Must stay within the budget. |
| Large-sample mean, face histogram, full-domain spread invariants, in-band probability | Dev check (`tools/check-engine.mjs`) | — | Too slow for the page (tens of ms to seconds). |
| DOM wiring of the roll, marks, staleness, reset | UI smoke (`runUiSmoke`, `?test` only) | `tools/check-page.mjs` | Needs a DOM. The DOM dump must end in the no-run state. |

## Standard Stack

### Core
No new libraries. Everything is inline in `index.html`, on top of existing code.

| Piece | Version | Purpose | Why Standard |
|-------|---------|---------|--------------|
| `mulberry32` (bryc, public domain) | canonical form, verified this session | Seeded 32-bit PRNG for the self-test and check-engine | About 8 lines, passes gjrand per the author, fast in JS. Verified to match bryc's source output-for-output over 6 seeds × 1000 draws. [CITED: github.com/bryc/code/blob/master/jshash/PRNGs.md] |
| `Math.random()` | built-in | The page's live dice | Non-crypto use. `1 + Math.floor(Math.random() * n)` is unbiased enough for n ≤ 20 (PITFALLS Pitfall 9). [CITED: MDN getRandomValues note, via CLAUDE.md sources] |
| Existing `DiceMath.outcome` / `damageFor` / `assertParams` / `stats` | in `index.html` | Rules and the exact E | RULES-05: the only rule implementation. [VERIFIED: index.html lines 588-648] |
| Existing `VM.tenths` / `fixed` / `signed` | in `index.html` | Display rounding shared with the stat cards | STAT-02 consistency. [VERIFIED: index.html lines 776-786] |

### Supporting
| Piece | Purpose | When to Use |
|-------|---------|-------------|
| `requestAnimationFrame` (existing `scheduleRender`) | Coalesced render after a click or a control change | Always. The click handler calls `scheduleRender()`, never `render()` directly (the UI smoke may call `render()` synchronously). |
| `role="status"` live region (`#sim-status.vh`) | Announces the roll once | Written only by the click handler. Clear it, then write in the next rAF. |
| CSS `content: "×" attr(data-n) / ""` | Badge text hidden from AT | Needs a fallback declaration before it (see Pitfall 7). Support: Chrome 77, Firefox 128, Safari 17.4. [VERIFIED: MDN browser-compat-data `css.properties.content.alt_text`] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `mulberry32` | `sfc32` / `SplitMix32` | bryc notes mulberry32 "skips about a third of 32-bit values". That is irrelevant for d20/dX checks with fixed expected totals. `SplitMix32` would change every pinned seed value. Keep mulberry32 (already named in D-15). |
| Exact SD by moments | Full 20-round distribution by convolution | Convolution gives percentiles and the true in-band probability, but costs ~0.3 ms per setting and was not requested. Use it only in check-engine (sampled) to guard the spread-line wording. |
| Separate `DiceMath.spread(p)` | Add `s2` accumulation inside `stats()` | `stats()` is called 42× per sweep and throughout the self-test grid, which is already at 188 ms. A separate function costs nothing unless called. |
| Run in a module-level `sim` object | Run inside `state` | `init()` and `runUiSmoke()` do `Object.assign(state, DEFAULT_STATE)`, which would not clear a run key. `renderControls` iterates `state` via `[data-key]`. Keep them separate. |

**Installation:** none. No packages. Nothing to `npm install`.

## Package Legitimacy Audit

This phase installs **no external packages**. No npm, PyPI, or CDN dependencies are added. `mulberry32` is copied inline from a public-domain source and checked against it. slopcheck was not needed.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| (none) | — | — | — | — | — | — |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
                         page load
                            |
                            v
  #dice-math --> #dice-sim --> #view-model --> #dice-selftest --> #app init()
  (spread)       (Sim)         (simExact)      section('sim')      |
                                                                   | engineLoaded() incl. typeof Sim
                                                                   v
                                          try { wire controls + roll button; render(); btn.disabled = false }
                                          catch -> engine-error banner, button stays disabled (WR-01)

 CONTROL CHANGE (input event)                          CLICK "Roll 20 rounds"
   onControl -> setState({key: v})                       onRoll()
        |                                                   | params = COPY {ac,die,atk,dmg} of state
        v                                                   | run = Sim.simulate(params, 20, Math.random)   <- only Math.random
   scheduleRender() (rAF, coalesced) <----------------------| exact = VM.simExact(params)
        |                                                   | tally: same attack ? [total, ...tally].slice(0,5) : [total]
        v                                                   | sim.run/exact/tally/id updated, scheduleRender()
   render():                                                | status '' -> next rAF -> status sentence
     view = VM.computeView(state)  (adds view.simExact for current params)
     simCtx = { run, exact(rolled-at), tally, stale = run && !sameAttack(run.params, view.params),
                marks = run && !stale ? Sim.runMarks(run) : null }
        |
        +--> renderTable(view, simCtx)   #outcome innerHTML with .roll / data-n only when marks != null
        +--> renderCompare(view)         compact tables: never marks
        +--> renderChart(view)
        +--> renderSim(view, simCtx):
               no run       -> exact = current, "Not rolled yet", spread(current), empty-state prompt
               run changed  -> rebuild figures + log tbody/tfoot (once per run.id)
               every frame  -> toggle #sim.is-stale, note stale sentence, Now line (current), tally hidden/shown,
                               log caption suffix; NEVER touch the button node
```

### Recommended Block Order (inside the one file)
```
<style> ... existing ... + #sim rules + .outcome .roll / .swatch.roll rules (after the chart rules)
<main> ... #chart ... <section id="sim" aria-labelledby="sim-h"> (after #chart, D-01)
<script id="dice-math">      + spread(p) exported
<script id="dice-sim">       NEW: const Sim = (() => { mulberry32, rollDie, simulate, sameAttack, runMarks })()
<script id="view-model">     + simExact(p), simPlacement(total, ex), settingsText(p), simStatus(run, ex); computeView adds simExact
<script id="dice-selftest">  + section('sim', ...) (tiny, exact)
<script id="app">            + sim object, onRoll, renderSim, marks passthrough, WR-01 guarded init, UI smoke block
```
Put `dice-sim` after `dice-math` (it needs `DiceMath`) and before `view-model`. The VM needs nothing from `Sim` because runs are plain data, and the self-test needs both. Update `tools/check-engine.mjs` to run `['dice-math', 'dice-sim', 'view-model', 'dice-selftest']` in that order and read `Sim` from the context.

### Pattern 1: Exact spread from integer moments
**What:** Enumerate one round with the same weights `stats()` uses: X per normal-hit cell (probability 1/(20X)), 1 per crit pair (probability 1/(20X²)), over `den1 = 20·X²`. Accumulate `s1 = Σ w·d` and `s2 = Σ w·d²`. Then `Var(20) = 20·Var(1) = (den1·s2 − s1²) / (20·X⁴)`, and `s1 === stats(p).e20Num` (verified for all 70,980 settings).
**When to use:** For the exact card, the `Now:` line, and the rolled-at figures stored with a run.
**Rounding:** `sdT = Math.round(10 * Math.sqrt(var20Num / var20Den))`. The full domain has 0 near-ties, and plain `Math.round` agrees with an exact integer rounding in every case. check-engine should keep asserting that (Code Examples).

### Pattern 2: The run is an event; staleness is a comparison (ARCHITECTURE Pattern 4)
**What:** Store `{ id, params (frozen copy), rounds, total }` plus the rolled-at `exact` in a module-level `sim` object. On every render, compute `stale = !Sim.sameAttack(sim.run.params, view.params)` over ac/die/atk/dmg only. Nothing is ever cleared by a control change. The marks and tally are *hidden* while stale and *derived* again when fresh (D-09, UI-SPEC A3).
**Why not a one-way flag:** D-09 says returning to the rolled-at settings un-stales the run. A comparison makes that free and removes a whole class of "forgot to reset the flag" bugs.

### Pattern 3: Rebuild on identity, toggle on every frame (no flicker, SC3)
**What:** `renderSim` keeps `shownRunId`. It rebuilds the figure value, placement, log `tbody`/`tfoot`, and caption base only when `sim.run.id !== shownRunId`. On every render it only toggles `#sim.classList` `is-stale`, the note's stale `<b>` (`hidden`), the `Now:` line text and `hidden`, and the tally's `hidden` and text. Before any run it updates the exact figure and spread line with `textContent`, the same way the stat cards do.
**Critical detail:** Never `replaceChildren` on `.fig-sim` or any ancestor of `#roll`. Update the value `<span>` only, or the button loses focus after every click (UI-SPEC: "Focus stays on the button").

### Pattern 4: Marks are an optional argument to the shared table renderer
**What:** `renderOutcomeTable(el, {..., marks})`, where `marks = { cells: Map<'r,k', n>, rows: Map<r, n> }` from `Sim.runMarks(run)`. Only `renderTable` (the `#outcome` call) passes it, and only when the run is fresh. Normal hits go to the cell (`class="h roll"`, `data-n` only when n ≥ 2). Crits, misses, and nat 1s go to the row header `th` (`class="roll" data-n="n"`, always). Keep `scope="row"` as the **first** attribute of the `th`, because `check-page.mjs` counts the literal substring `<th scope="row"`.
**Check-safe:** the compact-table smoke check "compact bodies carry only plain table classes" (allowed set without `roll`) still passes because compact calls never receive marks. The legend's new `.swatch.h.roll` sits outside `.ramp`, so the `rampText()` smoke selector `.ramp .swatch.h` is unaffected.

### Anti-Patterns to Avoid
- **`sim.run.params = state`** (a reference): `setState` mutates `state` in place, so the run would never look stale. Always copy `{ac, die, atk, dmg}` and freeze it.
- **Comparing `n`:** the compare slider must not stale the run (CONTEXT discretion, UI-SPEC). Compare four keys, not `JSON.stringify(state)`.
- **Re-rolling or re-deriving numbers from `Math.random` in `render()`:** `render()` must be pure over (state, sim). Grep gate: `Math.random` occurs exactly once in `index.html` (currently 0).
- **A default `rng = Math.random` in `simulate`:** it hides a missing injection and puts randomness in the pure block. Make `rng` required and throw a `TypeError` if it is not a function.
- **Rolling damage dice on a miss** "for the log": it changes the draw stream (and every pinned seed) and contradicts D-06 ("—" for dice). The draw order is part of the contract.
- **Marking a crit-row cell:** D-12 forbids it. No cell equals a real 2dX crit.
- **Using `opacity` for stale:** UI-SPEC A7. It drops contrast below 4.5:1.
- **Writing the status region from `render()`:** every slider tick would announce. Only the click handler writes it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hit/miss/crit decision in the simulator | A new `if (d20 === 20)...` chain | `DiceMath.outcome(d20, atk, ac)` | RULES-05. One rule implementation. The nat 1 at +20 and nat 20 at AC 30 edges are already proven. |
| Damage of a round (floor at 0, bonus once on a crit) | `dice.reduce(...) + dmg` | `DiceMath.damageFor(d20, dice, p)` | D-14. Seed 1 at AC 30/−5/d4/−5 rolls a crit 2 + 2 − 5 → 0. The floor must come from the engine. |
| Tenths rounding of E | `(e20).toFixed(1)` | `VM.tenths(e20Num, e20Den)` + `VM.fixed(t, 1)` | Float `toFixed` mis-rounds (PITFALLS: `(1.575).toFixed(2) === "1.57"`). It must match the stat card. |
| Signed numbers in the settings text | `'+' + atk` | `VM.signed(n)` | U+2212 minus convention (UI-SPEC Copywriting). |
| A seeded PRNG | An LCG or `Math.sin` hack | canonical `mulberry32` | Verified output. Well-known behavior. |
| Variance | Sample variance from a run | `DiceMath.spread` | D-05 forbids Monte Carlo for displayed exact figures. |
| Parser or clamping for anything new | — | Nothing new is parsed | The button takes no input. The existing `VM.parseControl` already guards every control. |

**Key insight:** The simulator's correctness is structural. If it calls `outcome` + `damageFor` with a fixed draw order, then any disagreement with the table is impossible by construction. Tests then only need to pin draw order and the face range.

## Reference Values (verified this session by running the page's own engine in Node)

### Exact spread (use in the self-test and check-engine)

| Settings (AC, atk, die, dmg) | e20Num / den | var20Num / var20Den | Var(1 round) | SD(20) | Display | Spread bounds | Wording (with recommended rule) |
|---|---|---|---|---|---|---|---|
| 15, +5, d8, +0 (default) | 3456 / 64 | 16441344 / 81920 | **10.035** | 14.1669 | `54.0 ± 14.2` | 39.8 to 68.2 | About 2 in 3 (true P 0.693) |
| 16, +5, d8, +0 | 3168 / 64 | 16260096 / 81920 | 9.924375 | 14.0886 | `49.5 ± 14.1` | 35.4 to 63.6 | About 2 in 3 (0.678) |
| 30, −5, d4, −5 | 10 / 16 | 6300 / 5120 | 0.061523 | 1.1093 | `0.6 ± 1.1` | 0.0 to 1.7 | lopsided (E−SD < 0), P 0.816 |
| 15, +5, d4, −5 | 10 / 16 | 6300 / 5120 | 0.061523 | 1.1093 | `0.6 ± 1.1` | 0.0 to 1.7 | lopsided (normal hits deal 0) |
| 15, +0, d8, +0 | 2016 / 64 | 13876224 / 81920 | 8.469375 | 13.0149 | `31.5 ± 13.0` | 18.5 to 44.5 | About 2 in 3 (0.681) |
| 15, +20, d8, +0 | 5760 / 64 | 11919360 / 81920 | 7.275 | 12.0623 | `90.0 ± 12.1` | 77.9 to 102.1 | About 2 in 3 |
| 15, +5, d8, +3 | 5568 / 64 | 32034816 / 81920 | 19.5525 | 19.7750 | `87.0 ± 19.8` | 67.2 to 106.8 | About 2 in 3 |
| 15, +5, d12, +0 | 11232 / 144 | 178454016 / 414720 | 21.515 | 20.7437 | `78.0 ± 20.7` | 57.3 to 98.7 | About 2 in 3 |
| 25, +0, d12, +0 | 1872 / 144 | 76467456 / 414720 | 9.219167 | 13.5788 | `13.0 ± 13.6` | 0.0 to 26.6 | lopsided (E−SD < 0), P 0.840 |
| 15, −5, d4, +4 (nat 20 only) | — | — | — | 8.9 (tenths) | `9.0 ± 8.9` | **0.0** to 17.9 | lopsided **by the nat-20-only rule** (the UI-SPEC rule would print 0.1 to 17.9 at P 0.455) |
| 30, −5, d12, +20 (nat 20 only) | 4752 / 144 | 438932736 / 414720 | 52.919167 | 32.5328 | `33.0 ± 32.5` | **0.0** to 65.5 | lopsided by the nat-20-only rule (UI-SPEC rule: 0.5 to 65.5 at P 0.466) |
| 10, +20, d12, +20 (max) | 73440 / 144 | 399306240 / 414720 | 48.141667 | 31.0296 | `510.0 ± 31.0` | 479.0 to 541.0 | About 2 in 3 (0.694) |

These match the PITFALLS.md SD column (14.17, 13.01, 12.06, 19.77, 19.30, 7.58, 20.74, 10.88, 16.00, 13.58, 6.12). A "doubled one die" simulator would give 14.53 at the defaults.

**Full-domain facts (70,980 settings, AC 10..30 × 5 dice × atk −5..20 × dmg −5..20):**
- `spread.s1 === stats.e20Num` everywhere.
- Largest intermediate integer: 639,451,929,600 (< 2^53 ≈ 9.0e15).
- Near-.05 ties of 10·SD: **0**. `Math.round` vs exact integer rounding mismatches: **0**.
- `sdT === 0`: **0** (minimum SD 1.1093 at AC 10/−5/d4/−5, which is AC-independent while the d4 −5 normal hits deal 0). Maximum SD 62.09.
- Spreads with `E − SD < 0` (UI-SPEC clamp): **7,745** settings. This is a normal state, not an edge case.
- With the lopsided rule `E − SD < 0 OR hitFaces === 1`: 18,625 lopsided settings (true P of [0, hi] is 0.814 to 0.881) and 52,355 normal settings (true P of [lo, hi] is 0.603 to 0.869; p1 0.645, median 0.683, p99 0.740).

### Seeded runs (mulberry32, draw order: d20, then 1 die on a hit / 2 on a crit / 0 on a miss)

| Case | Result | Use for |
|------|--------|---------|
| `mulberry32(1)()` first three outputs | 0.6270739405881613, 0.002735721180215478, 0.5274470399599522 | Guards a transcription typo in the PRNG |
| seed 1, defaults | total **47**. 2 crits (3+5, 4+4), 8 hits, 9 misses, 1 nat 1. 32 draws | `PASS sim: seed 1 at AC 15, d8, +5, +0 totals 47`. Placement `This run is 7.0 below expected (0.5 SD).` |
| seed 5, defaults | total **54** exactly | Placement `This run is exactly on expected.` |
| seed 6, defaults | total **71**. Crits 8+3=11, 6+8=14, 8+2=10 (odd 11 proves two dice). 2 nat 1s. Cell (11, 1) rolled twice | Marks: 8 distinct cells (9 hits), row marks {1:2, 2:1, 4:1, 5:2, 6:1, 9:1, 20:3} (11 rounds), so `#outcome .roll` = **15** and `[data-n]` = **8**. Placement `This run is 17.0 above expected (1.2 SD).` |
| seed 1, AC 30 / −5 / d4 / −5 | total **1**. Crits 4+2 → 1 and 2+2 → **0** (floor) | `damage never below 0 on a real crit` |
| seed 1, AC 15 / −5 / d4 / +4 | total 18 | optional nat-20-only case |
| seed 1, d12 defaults | total 68 | optional |
| rng `() => 0` | every d20 = 1 (nat 1), total **0** | face lower bound, fumble path |
| rng `() => 0.9999999` | every d20 = 20, dice [8, 8], total **320** | face upper bound, crit path |
| rng `() => 1 - 2**-53` | d20 = **20** (never 21) | `1 + floor(rng·n)` upper bound |

**Cost:** 10 seeded 20-round runs take 0.15 ms and 1,000 `Math.random` runs take 5.5 ms (Node), so the page section adds < 1 ms. The current Node self-test takes **188-189 ms / 198 checks** against the 200 ms budget, which leaves ~11 ms.

### Large-sample checks (belong in `tools/check-engine.mjs`, fixed seed 20260926, 100k rounds each, 13-32 ms each)

| Setting | Sample mean vs E per round | z | Sample var vs exact Var(1) |
|---|---|---|---|
| defaults | 2.7096 vs 2.7000 | 0.95 | 10.015 vs 10.035 |
| AC 25 / +0 / d12 / +0 | 0.6500 vs 0.6500 | 0.00 | 9.216 vs 9.219 |
| AC 15 / +5 / d4 / −3 | 0.2289 vs 0.2281 | 0.38 | 0.390 vs 0.395 |
| AC 10 / +20 / d12 / +20 | 25.5066 vs 25.5000 | 0.30 | 48.297 vs 48.142 |

Use a **z-score tolerance** (|mean − E| ≤ 4·sqrt(Var1/R)), not ARCHITECTURE's "within ~1%". Relative tolerance fails for low-E settings (at AC 30/−5/d4/−5, E = 0.03125/round and one SE is already 2.5% of E). Because the seed is fixed, the result is identical on every run. The d20 face histogram at 100k deviates up to 3.7% relative per face, so PITFALLS' "±1% per face" must mean **±1 percentage point** (or use 5·SE ≈ ±7% relative). Do not assert 1% relative.

## Common Pitfalls

### Pitfall 1: "About 2 runs in 3" is false at "only a nat 20 hits"
**What goes wrong:** With the UI-SPEC rule (lopsided only when E − SD < 0), 9,520 settings, all with `hitFaces === 1`, print a lower bound of 0.1 to 0.6. The 35.8% of runs that total exactly 0 (0.95^20) fall outside the band, so the true share inside is 0.455 while the page says "about 2 in 3".
**Why it happens:** The distribution has a huge atom at 0 and a long right tail. The mean ± SD band is not symmetric in probability.
**How to avoid:** `lopsided = eT − sdT < 0 || stats.hitFaces === 1`. When lopsided, show lower bound `0.0` with the existing lopsided copy. This stays within CONTEXT discretion ("clamp … and word the line accordingly"). See Open Question 1.
**Warning signs:** check-engine's sampled convolution check (Code Examples) fails on any nat-20-only setting.

### Pitfall 2: The run silently tracks the controls
**What goes wrong:** `sim.run.params = state` or `{...state}` (which includes `n`) makes staleness never fire, or fire on the N slider.
**How to avoid:** `Object.freeze({ ac: state.ac, die: state.die, atk: state.atk, dmg: state.dmg })`, and `Sim.sameAttack` compares exactly those four keys.
**Warning signs:** the UI smoke check "AC change stales the run" fails, or "N change keeps it fresh" fails.

### Pitfall 3: The DOM dump shows 101 row headers
**What goes wrong:** `check-page.mjs` asserts exactly 80 `<th scope="row"`. The log adds 21 (20 rounds + the Total row), and marks keep `scope="row"`. If the `?test` UI smoke rolls a seeded run and does not reset, the dump fails.
**How to avoid:** Put the sim smoke block **last**. At its end, set `sim.run = null`, `sim.exact = null`, `sim.tally = []`, reset `shownRunId`, restore `DEFAULT_STATE`, and `render()`. `renderSim` must empty `tbody`/`tfoot` and hide the log when `run === null` after a run was shown. Update the check-page header comment to "80 at load; the sim log adds 21 only after a roll" (UI-SPEC).
**Warning signs:** `DOM has 80 <th scope="row"> headers` fails with 101 only in test mode.

### Pitfall 4: Existing smoke checks break once a run is on screen
**What goes wrong:** `cmp ui: study table caption unchanged (D-01)` compares `tableEl.caption.textContent` exactly. The marks add a `.vh` caption suffix, so it breaks if a run is active. Class-whitelist checks would also see `roll`.
**How to avoid:** Run the sim smoke after every existing block, and reset (Pitfall 3). The existing blocks always run with `sim.run === null` at load.

### Pitfall 5: Losing focus or flickering on click and drag
**What goes wrong:** Rebuilding `.fig-sim` (which contains the button) with `replaceChildren`/`innerHTML` moves focus to `<body>`. Rebuilding the log `innerHTML` every frame during a drag burns work and can reset text selection.
**How to avoid:** Pattern 3 (rebuild on `run.id`, toggle otherwise). The button node is created once in markup and never replaced.

### Pitfall 6: WR-01 carried into the new section
**What goes wrong:** If a view-model function throws during the first `render()`, `init()` dies with no banner. A button left enabled would give a live control over a dead page.
**How to avoid:** Apply the 02-REVIEW WR-01 fix: wrap `chartInit()` → listeners → `render()` in `try/catch`, show the banner in `catch`, and set `rollBtn.disabled = false` **as the last statement inside the `try`**. Add `typeof Sim !== 'undefined'` to `engineLoaded()`. The click handler has its own `try/catch` (UI-SPEC "Roll throws"). Also add a check-page assertion that the banner stays hidden (`<div id="engine-error" role="alert" hidden`) and that `id="roll"` has no `disabled` attribute after load. A caught `console.error('render failed')` does **not** match check-page's current console regex (`Uncaught|SELFTEST FAIL|...`), so without these two checks a guarded crash would pass.

### Pitfall 7: The CSS badge disappears in older browsers
**What goes wrong:** `content: "×" attr(data-n) / "";` is invalid before Chrome 77 / Firefox 128 / Safari 17.4. An invalid declaration is dropped completely, so there is no badge at all. The Phase 1 `.note-th::after` narrow-tier label already has this exposure.
**How to avoid:** Declare the fallback first:
`content: "×" attr(data-n); content: "×" attr(data-n) / "";`
Older engines keep the first (visible badge, announced text). Newer engines use the second.

### Pitfall 8: The seeded-assertion values drift when the draw order changes
**What goes wrong:** Any refactor that rolls dice on a miss, rolls the second crit die before the first, or re-orders `outcome` breaks every pinned total. It could look like a flaky test, but it is really a contract change.
**How to avoid:** Document the draw order in a comment in `simulate`, and pin the three seeds plus the stub-RNG checks. If the order changes on purpose, recompute the totals with the probe script (Code Examples) in the same commit.

### Pitfall 9: The self-test budget
**What goes wrong:** Adding loops (grids, large samples, convolution) to the page self-test pushes Node past 200 ms (it is already at 188-189 ms).
**How to avoid:** The page gets only O(1) work: about 6 `simExact` calls, 4-6 seeded or stub runs, and string checks. Full-domain, large-sample, and convolution checks go in check-engine. Measure `SelfTest.ms` in Node after the RED and GREEN steps.

### Pitfall 10: Placement or spread numbers that do not add up by hand
**What goes wrong:** Bounds or the SD multiple computed from exact floats can differ by 0.1 from the printed `E ± SD`.
**How to avoid:** Use displayed tenths throughout (UI-SPEC A8): `lo = eT − sdT` (clamped 0), `hi = eT + sdT`, `diffT = 10·total − eT`, `sdMult = Math.round(10·|diffT| / sdT)` (half-up, exact in IEEE for integer operands), and `fixed(…, 1)`.

## Code Examples

All examples were written for this codebase and checked in Node against the real engine blocks (scratchpad probes). They are recommended shapes, and the planner may rename.

### DiceMath.spread (add to `#dice-math`, export it)
```javascript
// SIM-05, D-05: exact spread of the 20-round total. One-round moments over den1 = 20 * X^2
// (weight X per normal-hit cell, 1 per true 2dX crit pair), all through damageFor (RULES-05).
// Var(20 rounds) = 20 * Var(1) = (den1 * s2 - s1^2) / (20 * X^4). s1 === stats(p).e20Num.
function spread(p) {
  assertParams(p);
  const X = p.die;
  let s1 = 0, s2 = 0;
  for (let r = 2; r <= 20; r++) {                 // r = 1 always deals 0
    const kind = outcome(r, p.atk, p.ac);
    if (kind === 'hit') {
      for (let k = 1; k <= X; k++) { const d = damageFor(r, [k], p); s1 += X * d; s2 += X * d * d; }
    } else if (kind === 'crit') {
      for (let a = 1; a <= X; a++) for (let b = 1; b <= X; b++) {
        const d = damageFor(20, [a, b], p); s1 += d; s2 += d * d;
      }
    }
  }
  const den1 = 20 * X * X;
  return { s1, s2, den1, var20Num: den1 * s2 - s1 * s1, var20Den: 20 * X ** 4 };
}
// defaults: { s1: 3456, var20Num: 16441344, var20Den: 81920 } -> 200.7 = 20 x 10.035
```

### The `dice-sim` block (new, between `dice-math` and `view-model`)
```javascript
// The only code that rolls dice. Pure given rng: no DOM, and no Math.random (the app injects it).
const Sim = (() => {
  'use strict';
  // mulberry32 (bryc, public domain): seeded PRNG for the self-test and dev checks only.
  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rollDie = (sides, rng) => 1 + Math.floor(rng() * sides);          // SIM-01, D-14
  const RESULT = Object.freeze({ fumble: 'miss', miss: 'miss', hit: 'hit', crit: 'crit' });

  // Draw order is a contract (seeded totals depend on it): the d20 first, then one die on a
  // hit, two on a crit, none on a miss or nat 1.
  function simulate(p, rounds, rng) {
    DiceMath.assertParams(p);
    if (typeof rng !== 'function') throw new TypeError('Sim.simulate: rng must be a function');
    const params = Object.freeze({ ac: p.ac, die: p.die, atk: p.atk, dmg: p.dmg });
    const list = [];
    let total = 0;
    for (let i = 1; i <= rounds; i++) {
      const d20 = rollDie(20, rng);
      const kind = DiceMath.outcome(d20, p.atk, p.ac);
      const dice = kind === 'crit' ? [rollDie(p.die, rng), rollDie(p.die, rng)]
        : kind === 'hit' ? [rollDie(p.die, rng)] : [];
      const damage = DiceMath.damageFor(d20, dice, p);                   // RULES-05, floor at 0
      total += damage;
      list.push(Object.freeze({ round: i, d20, kind, result: RESULT[kind], dice: Object.freeze(dice), damage }));
    }
    return Object.freeze({ params, rounds: Object.freeze(list), total });
  }

  // SIM-04: "changing the attack" = ac, die, atk, dmg. Never n.
  const sameAttack = (a, b) => a.ac === b.ac && a.die === b.die && a.atk === b.atk && a.dmg === b.dmg;

  // D-11, D-12: normal hits count per (d20, face) cell; crits, misses and nat 1s count per d20 row.
  function runMarks(run) {
    const cells = new Map(), rows = new Map();
    for (const r of run.rounds) {
      if (r.kind === 'hit') { const k = r.d20 + ',' + r.dice[0]; cells.set(k, (cells.get(k) || 0) + 1); }
      else rows.set(r.d20, (rows.get(r.d20) || 0) + 1);
    }
    return { cells, rows };
  }

  return Object.freeze({ mulberry32, rollDie, simulate, sameAttack, runMarks });
})();
```

### VM additions (in `#view-model`)
```javascript
const settingsText = (p) => `AC ${p.ac}, d${p.die}, ${signed(p.atk)} to hit, ${signed(p.dmg)} damage`;

// SIM-02, SIM-05: the exact figure and its spread in displayed tenths (UI-SPEC A8).
// lopsided: E - SD < 0, or only a nat 20 hits (35.8% of runs total 0; RESEARCH Pitfall 1).
function simExact(p) {
  const s = DiceMath.stats(p), v = DiceMath.spread(p);
  const eT = tenths(s.e20Num, s.e20Den);
  const sdT = Math.round(10 * Math.sqrt(v.var20Num / v.var20Den));
  const lopsided = eT - sdT < 0 || s.hitFaces === 1;
  const loT = lopsided ? 0 : eT - sdT, hiT = eT + sdT;
  return {
    eT, sdT, lopsided,
    eText: fixed(eT, 1), sdText: fixed(sdT, 1), loText: fixed(loT, 1), hiText: fixed(hiT, 1),
    spreadText: lopsided
      ? `Most runs land between ${fixed(loT, 1)} and ${fixed(hiT, 1)} (damage cannot go below 0, so the spread is lopsided).`
      : `About 2 runs in 3 land between ${fixed(loT, 1)} and ${fixed(hiT, 1)}.`,
  };
}
function simPlacement(total, ex) {
  const diffT = 10 * total - ex.eT;
  if (diffT === 0) return 'This run is exactly on expected.';
  const sd = fixed(Math.round((10 * Math.abs(diffT)) / ex.sdT), 1);
  return `This run is ${fixed(Math.abs(diffT), 1)} ${diffT > 0 ? 'above' : 'below'} expected (${sd} SD).`;
}
// computeView: add `simExact: simExact(p)` (page view only; never statsView, RESEARCH Pitfall 4 of Phase 2)
```
The renderer needs `<b class="num">` around the numbers in prose lines (UI-SPEC Typography). Either return `parts` arrays alongside `*Text`, or have the renderer compose from `loText`/`hiText`/`eText`/`sdText` with fixed literals, as `renderCompare` does. Keep the full `*Text` strings so the self-test can assert whole sentences.

### App: rolling, the tally, the guarded init (in `#app`)
```javascript
const sim = { run: null, exact: null, tally: [], seq: 0 };   // not in state (Pitfall 2)
let shownRunId = 0;

function rollWith(rng) {                                    // shared by the click and the UI smoke
  const p = { ac: state.ac, die: state.die, atk: state.atk, dmg: state.dmg };
  const run = Sim.simulate(p, 20, rng);
  sim.tally = sim.run && Sim.sameAttack(sim.run.params, run.params)
    ? [run.total, ...sim.tally].slice(0, 5) : [run.total];   // D-10, UI-SPEC tally rule
  sim.run = Object.freeze({ ...run, id: ++sim.seq });
  sim.exact = VM.simExact(run.params);                      // rolled-at figures (D-08)
  return sim.run;
}
function onRoll() {
  let msg;
  try {
    const run = rollWith(Math.random);                      // the ONLY Math.random in the file
    msg = `Rolled 20 rounds: ${run.total} damage. Expected ${sim.exact.eText} ± ${sim.exact.sdText}. ` +
      VM.simPlacement(run.total, sim.exact);
  } catch (err) {
    console.error('roll failed:', err);
    msg = ROLL_ERROR_TEXT;                                  // UI-SPEC error copy; renderSim shows it too
  }
  scheduleRender();
  simStatusEl.textContent = '';
  requestAnimationFrame(() => { simStatusEl.textContent = msg; });
}
// render(): derive once per frame, pass to renderTable + renderSim
//   const stale = sim.run !== null && !Sim.sameAttack(sim.run.params, view.params);
//   const marks = sim.run && !stale ? Sim.runMarks(sim.run) : null;
// init(): try { ...existing...; rollBtn.addEventListener('click', onRoll); render(); rollBtn.disabled = false; }
//         catch (err) { console.error('render failed:', err); showEngineError(); ...; return; }
```

### Marks in `renderOutcomeTable` (template-string path, integers only)
```javascript
// cells: row.cells.map((d, i) => ...) so the face is i + 1
const n = marks ? (marks.cells.get(row.d20 + ',' + (i + 1)) | 0) : 0;
const mk = n ? ` roll"${n >= 2 ? ` data-n="${n}"` : ''}` : '"';
return `<td class="h${t >= 0.5 ? ' hi' : ''}${mk} style="--t:${t.toFixed(3)}">${d}</td>`;
// row header: keep scope="row" FIRST (check-page counts the literal '<th scope="row"')
const rn = marks ? (marks.rows.get(row.d20) | 0) : 0;
const th = rn ? `<th scope="row" class="roll" data-n="${rn}">` : '<th scope="row">';
```

### CSS with fallback (UI-SPEC values, plus Pitfall 7)
```css
.outcome .roll, .swatch.roll { position: relative; }
.outcome .roll::before, .swatch.roll::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  border: 2px solid var(--ink); box-shadow: inset 0 0 0 1px var(--paper);
}
.outcome .roll[data-n]::after, .swatch.roll[data-n]::after {
  content: "×" attr(data-n);            /* fallback: pre-alt-text engines keep this */
  content: "×" attr(data-n) / "";       /* Chrome 77+, Firefox 128+, Safari 17.4+ */
  /* ...UI-SPEC badge geometry... */
}
.outcome tbody tr:first-child .roll[data-n]::after { top: auto; bottom: -6px; }
```

### Self-test section (tiny, in `#dice-selftest`, after the Phase 2 sections)
```javascript
section('sim', () => {
  const DEF = { ac: 15, atk: 5, die: 8, dmg: 0 };
  const ex = VM.simExact(DEF), sp = DiceMath.spread(DEF);
  check('sim: defaults Var(one round) = 10.035', sp.var20Num / sp.var20Den / 20, 10.035);
  check('sim: defaults spread s1 = e20Num', sp.s1, DiceMath.stats(DEF).e20Num);
  check('sim: defaults 54.0 ± 14.2', ex.eText + ' ± ' + ex.sdText, '54.0 ± 14.2');
  check('sim: defaults spread line', ex.spreadText, 'About 2 runs in 3 land between 39.8 and 68.2.');
  check('sim: AC16 49.5 ± 14.1', ((e) => e.eText + ' ± ' + e.sdText)(VM.simExact({ ...DEF, ac: 16 })), '49.5 ± 14.1');
  check('sim: AC30 -5 d4 -5 lopsided line', VM.simExact({ ac: 30, atk: -5, die: 4, dmg: -5 }).spreadText,
    'Most runs land between 0.0 and 1.7 (damage cannot go below 0, so the spread is lopsided).');
  check('sim: mulberry32(1) first value', Sim.mulberry32(1)(), 0.6270739405881613);
  const r1 = Sim.simulate(DEF, 20, Sim.mulberry32(1));
  check('sim: seed 1 at AC 15, d8, +5, +0 totals 47', r1.total, 47);
  check('sim: same seed, same run', JSON.stringify(Sim.simulate(DEF, 20, Sim.mulberry32(1))), JSON.stringify(r1));
  const r6 = Sim.simulate(DEF, 20, Sim.mulberry32(6));
  check('sim: seed 6 totals 71', r6.total, 71);
  check('sim: log damage sums to the total', r6.rounds.reduce((s, r) => s + r.damage, 0), r6.total);
  check('sim: every crit rolls two dice', r6.rounds.every((r) => r.dice.length === (r.kind === 'crit' ? 2 : r.kind === 'hit' ? 1 : 0)), true);
  check('sim: seed 6 has an odd crit (two real dice)', r6.rounds.some((r) => r.kind === 'crit' && r.damage % 2 === 1), true);
  check('sim: seed 6 marks cover 20 rounds', ((m) => [...m.cells.values(), ...m.rows.values()].reduce((a, b) => a + b, 0))(Sim.runMarks(r6)), 20);
  check('sim: seed 1 placement', VM.simPlacement(r1.total, ex), 'This run is 7.0 below expected (0.5 SD).');
  check('sim: seed 5 exactly on', VM.simPlacement(Sim.simulate(DEF, 20, Sim.mulberry32(5)).total, ex), 'This run is exactly on expected.');
  check('sim: crit floor, seed 1 AC30 -5 d4 -5 totals 1', Sim.simulate({ ac: 30, atk: -5, die: 4, dmg: -5 }, 20, Sim.mulberry32(1)).total, 1);
  check('sim: rng 0 -> all nat 1, total 0', Sim.simulate(DEF, 20, () => 0).total, 0);
  check('sim: rng ~1 -> all nat 20 crits 8+8, total 320', Sim.simulate(DEF, 20, () => 0.9999999).total, 320);
  check('sim: rng 1-2^-53 -> d20 20', Sim.simulate(DEF, 1, () => 1 - 2 ** -53).rounds[0].d20, 20);
  check('sim: sameAttack ignores n', Sim.sameAttack({ ...DEF, n: 1 }, { ...DEF, n: 9 }), true);
  check('sim: missing rng throws TypeError', throwsType(() => Sim.simulate(DEF, 20)), true);
});
```
The UI-SPEC line pattern (`PASS  sim: seed {s} at AC 15, d8, +5, +0 totals {T}`) is satisfied. The seeds are fixed at **1 → 47**, **5 → 54**, **6 → 71**.

### check-engine additions (dev-only)
```javascript
// block list: ['dice-math', 'dice-sim', 'view-model', 'dice-selftest']; Sim = vm.runInContext('Sim', ctx)
// static gates: block('dice-sim') has no 'Math.random'; html has exactly 1 'Math.random'
// (o) every combo: sp = DiceMath.spread(p): sp.s1 === s.e20Num; sp.var20Num >= 0;
//     den1*s2 and 400*var20Num < Number.MAX_SAFE_INTEGER; sdT >= 1;
//     exact tenths: (2t-1)^2*den <= 400*num < (2t+1)^2*den with t = Math.round(10*sqrt(num/den))
//     VM.simExact(p).lopsided === (eT - sdT < 0 || s.hitFaces === 1)
// (p) sampled (stride 53, coprime to 21/5/26 per 02-REVIEW WR-03): exact 20-round distribution by
//     20-fold convolution of the one-round pmf; its variance equals var20 (tol 1e-9 relative);
//     P(lo <= T <= hi) in [0.60, 0.87] when not lopsided, P(T <= hi) >= 0.80 when lopsided
// (q) seeded large sample (seed 20260926, 100k rounds) at 5 settings incl. AC30 -5 d4 -5:
//     |mean - E| <= 4 * sqrt(Var1 / R); every d20 face count within 5 * sqrt(R * 0.05 * 0.95) of R/20;
//     every die face in 1..X; dice.length 2/1/0 by kind; damage === damageFor; total === sum
```
Cost estimate: (o) adds about 4 s to the ~22 s sweep (measured: the full-domain spread pass took 4.1 s). (p) at 1-in-53 costs about 0.5 s. (q) costs about 0.15 s.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Math.round(Math.random() * n)` dice | `1 + Math.floor(rng() * n)` | long-standing | Unbiased faces, no 0 (PITFALLS Pitfall 9) |
| Crit simulated as 2 × one die | Two independent dice through `damageFor(20, [a, b], p)` | Project decision (PROJECT.md) | SD 14.17, not 14.53. Odd crit totals appear. |
| `content: X / ""` alt text | Supported in all evergreen engines | Firefox 128 (2024-07), Safari 17.4 (2024-03) | Needs a fallback declaration for older engines |
| Mean ± SD "2/3" rule for any distribution | Applies only to roughly symmetric sums. Point masses at 0 break it. | — | Pitfall 1 rule |

**Deprecated/outdated:** ARCHITECTURE item 7's "sample mean within ~1%" tolerance should be replaced with a z-score bound. PITFALLS' "±1% per face" must be read as percentage points.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Extending the lopsided wording to `hitFaces === 1` falls within CONTEXT discretion ("the spread line when E − SD falls below 0 … may carry a light qualifier") and does not need a new user decision | Pitfall 1, Open Question 1 | If the user wants the UI-SPEC rule verbatim, 9,520 settings print "About 2 runs in 3" for a band that holds 45.5% of runs. Low effort to change either way. |
| A2 | `.sim-body` may carry `hidden` in the markup until init succeeds, so no-JS and crash states show only the heading and intro | Open Question 2 | The UI-SPEC wording differs slightly between its crash and no-JS rows. Either choice passes the checks. |
| A3 | A failed roll (defensive catch) keeps any previous run rather than clearing it | Code Examples (onRoll) | The UI-SPEC says "no run is stored" (ambiguous). It is unreachable in practice because `simulate` cannot throw on validated params. |
| A4 | The Node self-test time stays under 200 ms after adding ~23 O(1) checks (+ < 1 ms measured) | Pitfall 9 | If it crosses 200 ms on a cold run, thin the Phase 1 grid or move two checks into check-engine |

## Open Questions

1. **Lopsided trigger for "only a nat 20 hits" (recommend: adopt).**
   - What we know: UI-SPEC's rule (clamp only when E − SD < 0) gives 9,520 settings where "About 2 runs in 3" covers only 45.5% of runs. All of them have `hitFaces === 1`, with printed lower bounds of 0.1 to 0.6. The recommended rule gives honest wording everywhere (normal ≥ 0.603, "Most" ≥ 0.814).
   - What's unclear: whether the user wants the UI-SPEC rule exactly as written.
   - Recommendation: implement `lopsided = eT − sdT < 0 || hitFaces === 1` and note it in the plan as a discretion call. Add check-engine (p) so it cannot regress. The default page (AC 15 / d8 / +5) is unaffected.

2. **Section body visibility with no JS or a crashed engine.**
   - What we know: UI-SPEC "No JavaScript: the section shows only its heading and intro" and "Engine crash: `#sim` stays in the DOM with empty figures and lines. The button stays disabled."
   - Recommendation: put `hidden` on `.sim-body` in the markup and remove it in `init()` right after `render()` succeeds, next to `rollBtn.disabled = false`. This satisfies both rows (hidden is "in the DOM", and nothing is live). The labels can then be static markup.

3. **Merge plans 2 and 3?**
   - Granularity is `coarse`. Phase 2 used 3 plans. A 2-plan split (engine + roll slice, then log + staleness + tally + marks + verification) also works, but plan 2 would carry ~60% of the DOM work. Recommend 3.

## Suggested MVP Vertical Slices (every plan edits `index.html`, so all waves are sequential)

| Plan | Wave | Slice (user-visible after it) | Requirements | Contents |
|------|------|-------------------------------|--------------|----------|
| 03-01 | 1 | **Roll it and compare.** The button works and shows `This run (simulated) 61` beside `Expected (exact) 54.0 ± 14.2`, with the spread and placement lines and the status announcement. | SIM-01, SIM-02, SIM-05, SIM-06 | T1 RED: `section('sim')` (above), check-engine block list + (o)/(q) + static `Math.random` gates. T2 GREEN: `DiceMath.spread`, `#dice-sim`, `VM.simExact`/`simPlacement`/`settingsText`, `computeView.simExact`, `engineLoaded` + Sim. T3 DOM: `#sim` markup (all slots, button `disabled`, status region, hidden note/now/tally/log placeholders), CSS for section/pair/fig/button, `sim` object, `rollWith`/`onRoll`, `renderSim` (empty state, figures, spread, placement), WR-01 guarded init + enable-after-render, check-page (banner hidden, `#roll` enabled, `--expect` load strings), UI smoke (seeded roll → figure = total) **with reset**. |
| 03-02 | 2 | **See every round, and know when it's old.** 20-row log + Total, rolled-at note, stale dimming, `Now:` line, caption suffix, tally. | SIM-03, SIM-04 (+ D-06..D-10) | Log `tbody`/`tfoot` rebuilt on `run.id` only; `is-stale` toggles; `Now:` from `view.simExact`; tally rule; check-page comment "80 at load"; (p) sampled convolution in check-engine; UI smoke: log rows 20 + total = figure, AC change → stale, N change → fresh, back → fresh, roll while stale resets the tally, reset at end. |
| 03-03 | 3 | **See the run on the table.** Rings and badges on `#outcome`, row-label counts for crits/misses/nat 1s, a static legend item, caption `.vh` suffix, cleared while stale. Phase verification. | D-11..D-13 (SC1-SC4 sign-off) | `renderOutcomeTable` `marks` option (Pattern 4), CSS with alt-text fallback, legend item, UI smoke with seed 6 (`.roll` = 15, `[data-n]` = 8, cell (11,1) `data-n="2"`, row 20 `data-n="3"`, stale → 0, back → 15), screenshots at 1366/360 in light and dark, ROADMAP SC check, check-engine + check-page (1366, 390, plain) green. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `tools/check-engine.mjs`, probes | ✓ | 24.15.0 | — |
| Chrome (headless) | `tools/check-page.mjs` | ✓ | installed at `C:\Program Files\Google\Chrome\Application\chrome.exe` (check-page ran green this session) | Edge path in check-page |
| Python | local preview (`python -m http.server`) | ✓ | 3.14.4 (CLAUDE.md) | open `index.html` directly (classic scripts work on `file://`) |
| gh / network | not needed (deploy deferred per user memory) | — | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

Baseline this session: `node tools/check-engine.mjs` → `CHECK-ENGINE PASS: selftest 198/198, sweep 70980 combos` (~22 s sweep). `node tools/check-page.mjs` → `CHECK-PAGE PASS` (80 row headers, browser self-test 37.5 ms).

## Validation Architecture

Skipped: `workflow.nyquist_validation` is explicitly `false` in `.planning/config.json`. The project's own verification (in-page self-test, `?test` UI smoke, check-engine, check-page) is covered in the sections above.

## Security Domain

`security_enforcement` is absent from config, so it is treated as enabled. The attack surface is tiny: a static page, no network, and no user text.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes (no new inputs) | The button takes no input. Every param reaching `simulate` comes from `VM.parseControl` (clamped integers), and `assertParams` rejects non-integers. |
| V6 Cryptography | no | `Math.random` is appropriate for non-security dice (MDN). Do not "upgrade" to `crypto` with `%` (modulo bias). |
| V14 Config (CSP) | yes | The existing CSP `<meta>` is unchanged. No new sources. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| HTML injection through `innerHTML` log rows or marks attributes | Tampering | Only integers (`| 0` / `Number.isInteger`) and fixed literal words (`hit`/`miss`/`crit`, `—`, `+`) reach `innerHTML`. Captions, notes, lines, and status use `textContent`. Keep the grep gate of Phase 2 (non-comment `.innerHTML =` count) updated deliberately (it becomes 4: two table parts + log tbody + tfoot). |
| Inline event handlers | Tampering | `addEventListener('click', onRoll)` only. No `onclick=""` in markup. |
| Live region spam or AT confusion | (UX/a11y) | Status is written only by the click handler (UI-SPEC). |

## Sources

### Primary (HIGH confidence)
- `index.html` (this repo, commit b1c7070): engine lines 570-741, view-model 743-988, self-test 990-1456, app 1458-2451. Read directly and executed in Node.
- Local Node 24.15.0 probes (scratchpad `sim-probe*.mjs`, `sim-lib.mjs`): variance references, full-domain rounding/safety facts, seeded totals, stub-RNG bounds, large-sample means, and exact 20-round distributions by convolution.
- `tools/check-engine.mjs`, `tools/check-page.mjs`: run this session (both PASS). Extraction regex, the 80-row-header check, and the console regex were confirmed.
- https://github.com/bryc/code/blob/master/jshash/PRNGs.md: mulberry32 source, public-domain license, the "skips a third of 32-bit values" caveat.
- MDN browser-compat-data `css/properties/content.json` (`alt_text`: Chrome 77, Firefox 128, Safari 17.4), https://developer.mozilla.org/en-US/docs/Web/CSS/content

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` Pattern 4, simulation flow, self-test item 7 (tolerance corrected here)
- `.planning/research/PITFALLS.md` reference SD column (matches exactly), Pitfalls 9 and 10
- `.planning/phases/02-bonus-comparison/02-REVIEW.md` WR-01 (guard) and WR-03 (sampling stride)

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. No new dependencies. PRNG verified against its canonical source.
- Architecture: HIGH. Derived from the actual code paths (`render`, `runUiSmoke`, `init`, `renderOutcomeTable`) and the tools' exact checks.
- Math and reference values: HIGH. Computed by running the shipped engine and checked across the full domain.
- Pitfalls: HIGH for the integration hazards (traced in code). HIGH for Pitfall 1 (exact convolution over all 70,980 settings). MEDIUM for Pitfall 7 (compat data only, no old-browser test).

**Research date:** 2026-09-26
**Valid until:** 2026-10-26. The code-dependent facts hold until `index.html` changes: re-run the probes if the engine's `outcome`/`damageFor` or the draw order changes.
