# Phase 3: Roll-20-Rounds Simulation - Context

**Gathered:** 2026-09-25
**Status:** Ready for planning

<domain>
## Phase Boundary

A "Roll 20 rounds" button actually rolls a d20 and real damage dice for 20 rounds at the current settings (two dice on a crit). It shows the realized total next to the exact 20-round expectation and its standard deviation, lists every round in a log, and marks the rolled outcomes on the big Phase 1 outcome table. The run is an event, not a derivation. It rolls only on click, and any later control change marks it stale instead of re-rolling. Covers SIM-01..SIM-06. Designer-facing explanation copy (COPY-*) is Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Placement and first load
- **D-01:** The simulation is its own section at the bottom of `<main>`, after the sweep chart section. Page order becomes: controls → stat cards → outcome table → Compare +N → sweep chart → **Roll 20 rounds**. Nothing above it moves (Phase 2 D-01 and D-02 stay intact).
- **D-02:** Before the first roll, the section shows "Expected (exact)" with its spread for the current settings, and the realized slot reads "Not rolled yet" with the "Roll 20 rounds" button. The log and tally are hidden until there is a run. Nothing rolls on page load (SIM-04).

### Realized vs expected display (SIM-02, SIM-05)
- **D-03:** Two side-by-side figures, visually distinct: "Expected (exact)" and "This run (simulated)". The exact one is shown as `54.0 ± 14.2` (at the defaults). Exact and simulated numbers must never share styling, so they cannot blur together.
- **D-04:** Under them, a plain-language spread line: "About 2 runs in 3 land between 39.8 and 68.2." A second line places the run: "This run is 7.0 above expected (0.5 SD)." (or "below", or "exactly on").
- **D-05:** The standard deviation is exact, from the one-round damage distribution: SD(20 rounds) = sqrt(20 × Var(one round)), enumerated through `DiceMath` with a true 2dX crit. No Monte Carlo for any displayed exact figure. At the defaults (AC 15, d8, +5, +0) Var(one round) = 10.035, so SD(20) ≈ 14.17.

### Per-round log (SIM-03)
- **D-06:** A compact 20-row table with the columns Round, d20, Result (miss / hit / crit, with nat 1 shown as a miss), Damage dice, and Damage. A crit shows both dice ("6 + 3"). A miss shows "—" for dice and 0 damage. A total row at the bottom equals the realized total exactly.
- **D-07:** The roll is instant. All 20 rounds and the total appear at once, with no reveal animation.

### Staleness (SIM-04)
- **D-08:** When any control that changes the attack (AC, die, attack bonus, damage bonus) changes after a roll, the run dims. A note reads "Rolled at AC 15, d8, +5 to hit, +0 damage. Settings changed. Roll again to compare." The dimmed run keeps its **own** rolled-at expected ± SD beside it, so the pair always describes the same attack. A separate "Now:" line shows the expected ± SD at the current settings.
- **D-09:** Changing a control back to the rolled-at settings may un-stale the run, since staleness is a comparison of the rolled-at parameters with the current ones and not a one-way flag. The simulation never re-rolls on its own. Dragging a slider causes no flicker, because only the dim state and the "Now:" line update.

### Run tally
- **D-10:** A small tally lists the last 5 run totals at the current settings, newest first, including the current run. Repeated clicks show luck moving around the expected value. The tally clears when the settings change (D-13).

### Marks on the big outcome table
- **D-11:** A run marks its outcomes on the big Phase 1 `#outcome` table only (not the three compact tables). A normal hit marks its exact (d20, die face) cell with an ink outline, plus a small "×2" style count badge when the same cell was rolled more than once. The mark must read on every heat color and without color.
- **D-12:** A crit marks the **nat-20 row label** with a count (for example "crit ×1"), never a cell, because no single cell in the crit row (2 × face + D) equals a real two-dice crit like 6 + 3. The log carries the real dice.
- **D-13:** When a control changes, the table marks and the tally clear, because the table now shows different outcomes and old marks would point at the wrong cells. The dimmed run and its log stay in the section with the rolled-at note (D-08).

### Carried forward (locked earlier, not re-asked)
- **D-14:** Dice use `1 + floor(rng() * sides)` (SIM-01), and every damage value goes through `DiceMath.damageFor` (RULES-05, Phase 1 D-15), so the simulator cannot drift from the table. Damage never goes below 0.
- **D-15:** The dice function takes an injectable random source (SIM-06). The page uses `Math.random`. The self-test passes a seeded PRNG (mulberry32 per research) and asserts exact, reproducible results on every load (success criterion 4).
- **D-16:** The tabletop theme, tabular numerals for every number, classic inline `<script>` blocks, real `<table>` markup, and light/dark tokens all carry over from Phase 1.

### Claude's Discretion
- Which controls count as "changing the attack". The compare "+N" slider does not change the attack being rolled, so moving it should **not** stale the run or clear the marks.
- How misses and nat 1s appear in the big-table marks. The recommended approach marks their d20 row label with a count, like crits, since no damage die was rolled.
- The exact wording of the rolled-at note, the "Now:" line, the spread line, and the "Not rolled yet" prompt.
- Visual treatment that keeps exact and simulated figures distinct, such as weight, a "simulated" tag, a dashed border, or an icon. It must not rely on color alone.
- The spread line when E − SD falls below 0. Clamp the lower bound to 0 and word the line accordingly. "About 2 runs in 3" is an approximation and may carry a light qualifier.
- Whether the tally shows totals only or totals with a small above/below marker.
- Where the seeded PRNG and `simulate()` live (research suggests a `<script id="dice-sim">` block between the engine and the self-test).
- How the section is laid out at phone width.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirements
- `.planning/ROADMAP.md` §"Phase 3: Roll-20-Rounds Simulation" — goal, the 4 success criteria, Mode: mvp
- `.planning/REQUIREMENTS.md` — SIM-01..SIM-06 (lines ~62–67); RULES-05 (one damage rule); STAT-02 (tenths rounding consistency)
- `.planning/PROJECT.md` — the expected-damage formula, the crit convention (table shows 2 × face + D, the simulator rolls two real dice), Key Decisions (both exact values and a roll-it simulation)

### Research
- `.planning/research/ARCHITECTURE.md` — Simulator component `simulate(p, rounds, rng)`, Pattern 4 "the simulation is an event, not a derivation", simulation flow, Anti-Patterns 1 and 4, self-test item 7 (seeded total and sample-mean check)
- `.planning/research/FEATURES.md` — T9 (realized vs expected), D7 (mark rolled cells on the 2D table), D8 (where the run sits in the distribution). The "Seeded RNG / reproducible rolls" row applies to user-facing features only. The self-test still uses a seed (SIM-06).
- `.planning/research/PITFALLS.md` — reference values and rules pitfalls (nat 1 at high bonus, bonus doubled on crits)

### Prior phase decisions and open issues
- `.planning/phases/01-live-roll-table-deployed/01-CONTEXT.md` — theme, table markup, self-test and `?test` panel, controls pipeline
- `.planning/phases/02-bonus-comparison/02-CONTEXT.md` — page order and the compare `n` control (it must not stale the run)
- `.planning/phases/02-bonus-comparison/02-REVIEW.md` — open warnings. WR-01: a view-model throw during the first render bypasses the engine-error banner. The new simulation render must not add another path like that.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DiceMath.damageFor(d20, dieRolls, p)` in `<script id="dice-math">` (`index.html` ~line 600) takes `[k]` for a hit and `[k1, k2]` for a crit, and floors damage at 0. The simulator must call it for every round.
- `DiceMath.outcome(d20, atk, ac)` returns 'fumble' | 'crit' | 'hit' | 'miss', which maps directly to the log's Result column.
- `DiceMath.stats(p)` returns exact `e20Num / e20Den` and `rows`. The variance for D-05 is a sibling enumeration in the same style, with integer numerators over a `die^2` denominator where possible.
- `VM.CONTROL_SPEC`, `VM.parseControl`, `VM.tenths`, and `VM.fixed` cover formatting and rounding. The simulation figures must use the same tenths rounding as the stat cards so "Expected (exact)" matches the "Expected over 20 rounds" card.
- `renderOutcomeTable(el, {...})` (~line 1592) builds rows with `<th scope="row">` via template strings and is shared by the big table and the three compact tables. The marks (D-11, D-12) need a per-call option that only the `#outcome` call passes.

### Established Patterns
- Script order in `index.html` is `dice-math` (~line 570) → `view-model` (~743) → `dice-selftest` (~990) → `app` (~1458), all classic blocks that share globals. `tools/check-engine.mjs` extracts blocks by id and runs them in a Node vm, so a new `dice-sim` block has to be added to that list.
- Renders coalesce through `requestAnimationFrame`, and `render()` repaints everything from state on every input. Run results and marks must therefore live in state and be re-applied by the renderer, or the next render wipes them.
- The self-test has a **200 ms budget** and is already at about 178–197 ms under Node. Seeded simulation checks must be tiny, for example a few fixed-seed runs with exact expected totals. Any large-sample mean check belongs in `tools/check-engine.mjs`, not the page.
- `tools/check-page.mjs` asserts exactly **80** `<th scope="row">` headers (4 tables × 20). A 20-row log table using `<th scope="row">` changes that count, so the check or the log's header markup must be adjusted deliberately.
- The CSP blocks outside requests, and `innerHTML` is used only for numeric or fixed-literal output. Log content is all numbers and fixed words, so it stays safe.

### Integration Points
- New section markup after `section#chart` in `<main>`.
- The button's click handler in `<script id="app">` is the only place `Math.random` is passed in.
- The state gains the last run (rounds, total, rolled-at params, tally). `render()` compares the rolled-at params with the current ones to set the stale state (D-08, D-09) and to decide whether to apply table marks (D-13).
- `init()` wires the button. It must stay inside the guarded first-render path (see 02-REVIEW.md WR-01).

</code_context>

<specifics>
## Specific Ideas

- Target look for the result block, as the user approved it in preview:
  ```
  Expected (exact)        This run (simulated)
  54.0 ± 14.2             61
  About 2 runs in 3 land between 39.8 and 68.2.
  This run is 7.0 above expected (0.5 SD).
  ```
- Log look, as approved:
  ```
  Rnd  d20  Result  Dice    Dmg
    1   14  hit     5         5
    2    1  miss    —         0
    3   20  crit    6 + 3     9
   ...
        Total                61
  ```
- Stale look, as approved: a rolled-at note, the dimmed run with its own expected, and a "Now:" line with the current expected ± SD.

</specifics>

<deferred>
## Deferred Ideas

None. The discussion stayed within phase scope. Two options were offered and declined:
- A quick reveal animation (D-07 chose instant).
- A number-line strip for the spread (D-04 chose the text line).

</deferred>

---

*Phase: 03-roll-20-rounds-simulation*
*Context gathered: 2026-09-25*
