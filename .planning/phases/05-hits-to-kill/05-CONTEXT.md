# Phase 5: Hits-to-Kill - Context

**Gathered:** 2026-09-27
**Status:** Ready for planning

<domain>
## Phase Boundary

The page gets an enemy. A designer sets its hit points, either as an exact amount or a whole average hit at a time, starting from 40 HP. The page then shows three exact numbers: how many hits it takes to kill, how many rounds, and the chance of a kill within 20 rounds. The 20-round roll shows the enemy's HP going down and the round it dies. The compare tables and the sweep chart stay about damage; they are not extended to kill speed in this phase. Covers requirements KILL-01..KILL-06, defined from these decisions.

User requests (2026-09-27): "Add support for hits-to-kill and the ability to kill an enemy, set a 40 hp enemy as the starting point", and "the ability to modify enemy health (both by individual amount and by adding a 'hit' based on likely average damage for the current attack roll)".

</domain>

<decisions>
## Implementation Decisions

### Enemy health control
- **D-01:** New control: "Enemy HP", an integer number box from 1 to 500, default 40. It goes through the same `VM.CONTROL_SPEC` / `VM.parseControl` path as every other control (new key, e.g. `hp`), so blank, non-numeric, and out-of-range input clamps like the others (CTRL-05). It sits in the controls strip at the top with the other settings.
- **D-02:** Next to the box are "−1 hit" and "+1 hit" buttons. One hit is the **average damage when the attack hits**, crits included. This is the same quantity as the existing "Average damage on a hit" stat card (`DiceMath.hitAverages`), 4.91 at the defaults (AC 15, d8, +5 to hit, +0 damage). It is not the per-attack average, which includes misses (2.70).
- **D-03:** The buttons change HP by that average rounded to the **nearest whole HP**, and never below 1 or above 500. Each button's label shows the exact step it will apply, for example "+1 hit (+5 HP)". A short line under the control shows the current HP in average hits, for example "≈ 8.1 average hits (1 hit ≈ 4.91 HP)". When the attack can't damage at all, the step is 0: the buttons must not loop, lie, or divide by zero, and the line says so.

### Kill numbers (exact math)
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

### The 20-round roll (Phase 3 simulation)
- **D-08:** All 20 rounds are still rolled and logged, so the damage total stays comparable with the exact 20-round expected value. The log gains an "Enemy HP" column showing remaining HP after each round. The round where HP reaches 0 is highlighted, and later rounds are dimmed and labeled "enemy down". The result line reports "Killed in round 12 (9 hits)", or "Survived with 2 HP left" when it lives.
- **D-09:** Changing HP after a roll does **not** stale the run. HP changes no die, so the same rolls are re-scored live: the HP column, the kill round, and the result line update as HP is edited. AC, die, and the two bonuses still stale the run exactly as in Phase 3 D-08. The compare +N slider still does not.
- **D-10:** The tally of the last 5 runs shows each run's total and outcome, for example "61 · killed R12" or "38 · 2 HP left". Tally outcomes re-score live with HP too (D-09), so each tally entry keeps its per-round damage. The tally still clears when AC, die, or a bonus changes (Phase 3 D-13).
- **D-11:** The outcome-table marks from Phase 3 (rings, ×N badges, row-label counts) are unchanged.

### Scope boundary
- **D-12:** The compare tables and the sweep chart are **not** extended with kill numbers in this phase. The user picked only the 20-round roll from those options.

### Claude's Discretion
- Exact wording of labels, button text, the hits line, the kill cards, and the note, within the Phase 4 voice rules.
- Where the kill cards sit in the stat-card area, and the phone layout. Keep the space-dense layout from quick task 260927-1ty: 32 px controls and the 4/8/12/16/20/24 spacing scale.
- The DP cutoff or tail method for extreme settings, and how "never" or "under 0.1%" chances are worded.
- Whether "Try this" presets touch HP. The recommendation is that they don't, so presets keep changing only the attack.
- Whether the formulas card gets a hits-to-kill line.
- The accessible names for the new controls. The a11y guards (9)–(13) and the exact tab-order list in `tools/check-page.mjs` must be updated to include them.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirements
- `.planning/ROADMAP.md` §"Phase 5: Hits-to-Kill" — goal (both user requests quoted), success criteria, Mode: mvp
- `.planning/REQUIREMENTS.md` — KILL-01..KILL-06 (added with this discussion); CTRL-05 (one parse path); RULES-05 (one damage rule); STAT-02 (rounding consistency); SIM-01..SIM-06 (the simulation being extended)
- `.planning/PROJECT.md` — the exact-math principle and the expected-damage formula

### Prior decisions this phase builds on
- `.planning/phases/03-roll-20-rounds-simulation/03-CONTEXT.md` — D-08..D-13 (staleness, tally, table marks)
- `.planning/phases/03-roll-20-rounds-simulation/03-UI-SPEC.md` — log table, figure pair, tally styling
- `.planning/phases/04-designer-explanation-final-ship/04-CONTEXT.md` — D-02 voice, D-04 "a formula never disagrees with a card", D-08 presets through `parseControl`, D-10 a11y guards
- `.planning/phases/04-designer-explanation-final-ship/04-UI-SPEC.md` — current design contract
- `.planning/phases/04-designer-explanation-final-ship/04-REVIEW-FIX.md` — the latest copy and guard fixes (claims must be checked against the engine, not rebuilt strings)
- `.planning/quick/260927-17o-move-settings-and-outcome-table-to-the-t/260927-17o-SUMMARY.md` and `.planning/quick/260927-1ty-make-the-page-more-space-dense/260927-1ty-SUMMARY.md` — the current page order and dense layout

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DiceMath.hitAverages(p)` (index.html ~line 1047) returns exact numerators for the average normal hit and the average crit. It is the source for the ±1 hit step (D-02), and the "Average damage on a hit" card already shows its combined value.
- `DiceMath.damageFor(d20, dieRolls, p)` is the one damage rule that the kill DP and the simulator's HP column must use.
- `DiceMath.outcomeTable(p)` / `stats(p)` enumerate the per-attack outcome space. The per-attack damage distribution for the DP comes from the same enumeration, with a true 2dX crit.
- `VM.CONTROL_SPEC` / `VM.parseControl` / `renderControls` / `onControl` are the single control path. Preset buttons must not carry `data-key` (Phase 4 trap); the HP box should.
- `Sim.simulate(p, rounds, rng)` returns the per-round records. Re-scoring against HP (D-09) is a pure function of those records plus HP, so no re-roll is needed.
- The `renderSim` log and tally renderers (Phase 3) and `simCtx` / `sameAttack` staleness live in `<script id="app">`. `sameAttack` compares only AC, die, attack, and damage, so HP is naturally excluded.

### Established Patterns
- All copy and numbers are computed in the view-model and rendered with `textContent`. `innerHTML` is used only for integers and fixed literals.
- Exhaustive checks go in `tools/check-engine.mjs` over all 70,980 attack settings. HP adds a new dimension, so sample HP values sensibly, for example 1, 40, 500, and values near multiples of the average hit. The in-page self-test is at its 200 ms budget under Node, so add only O(1) pins there.
- New copy claims must be checked against the engine, not against a rebuilt string (Phase 4 review IN-02).
- The page is live at https://atomechllc.github.io/dnd-roll-tables/, and every push to `main` redeploys it. Commit locally and push only when the user asks.

### Integration Points
- The HP box and hit buttons go in `form#controls`. The kill cards go in `section#stats`. The HP column, kill marking, and result line go in `section#sim`.
- `tools/check-page.mjs` has the exact tab-order list (guard 11) and the page-order check (14). The new controls change guard 11.

</code_context>

<specifics>
## Specific Ideas

- Control look, as approved:
  ```
  Enemy HP  [ 40 ]   [− 1 hit]  [+ 1 hit]
            ≈ 8.1 average hits  (1 hit ≈ 4.91 HP)
  ```
- Kill cards, as approved:
  ```
  Hits to kill        8.7 on average (simple division says 8.1)
  Rounds to kill      15.8 on average, half of fights by round 15
  Kill within 20      85%
  ```
- Log look, as approved:
  ```
  Rnd  d20  Result  Dice    Dmg  Enemy HP
   11   17  hit     6        6      3
   12   20  crit    5 + 4    9      0  ← killed in round 12
   13   14  hit     2        2      —  enemy down
  ...
  Killed in round 12 (9 hits).  Damage over 20 rounds: 61
  ```

</specifics>

<deferred>
## Deferred Ideas

- **Kill speed in the compare tables:** rounds-to-kill in each of the three tables' stats lines, so +N to hit vs +N to damage is compared by kill speed. Offered, not chosen.
- **A rounds-to-kill mode for the sweep chart:** a switch to plot rounds-to-kill for +0 to +20. Offered, not chosen; the chart's crossover and band text is written for damage.
- **A full rounds-to-kill distribution chart:** offered as a headline option, not chosen.
- **"Next enemy steps in":** counting kills per 20 rounds. Offered, not chosen.

</deferred>

---

*Phase: 05-hits-to-kill*
*Context gathered: 2026-09-27*
