---
phase: 03-roll-20-rounds-simulation
plan: 03
subsystem: ui
tags: [simulation, table-marks, legend, phase-verification, vanilla-js]

# Dependency graph
requires:
  - phase: 03-roll-20-rounds-simulation
    provides: "03-01 Sim.runMarks and the per-frame simCtx { stale, marks }; 03-02 log, staleness, tally, and the 'sim log ui' reset pattern"
provides:
  - "renderOutcomeTable marks option: ringed hit cells with x-N badges from 2 up, and counted d20 labels for crits, misses, and nat 1s, on #outcome only"
  - "renderTable passes simCtx.marks (fresh runs only) and a .vh caption suffix; the caption is byte-identical with no marks"
  - "Two-tone pseudo-element ring and badge CSS with the alt-text fallback; a data-down rule that keeps label badges apart"
  - "Static fifth legend item in #tables, drawn with the real .swatch.h.roll classes"
  - "'sim marks ui' smoke block (33 checks) ending in a reset to 80 row headers"
  - "Phase 3 verification: SC1-SC4, D-01..D-16, SIM-01..SIM-06 mapped to checks and screenshots"
affects: [04 designer explanation and final ship]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Run marks are derived per render from a fresh run and passed only to the #outcome renderer call; the compact tables never get them"
    - "Decorative pseudo-element marks (ring ::before, badge ::after with alt text \"\"), so the cell's own box-shadows and layout are untouched"

key-files:
  created:
    - .planning/phases/03-roll-20-rounds-simulation/03-03-SUMMARY.md
    - .planning/phases/03-roll-20-rounds-simulation/deferred-items.md
  modified:
    - index.html

key-decisions:
  - "Label badges in an unbroken marked run from row 1 drop to the bottom edge (data-down), because row 1's bottom badge would otherwise sit exactly on top of row 2's top badge. Row 20 always stays up."
  - "ROADMAP SC3 says any control stales a run. By CONTEXT discretion, only the attack controls (AC, die, attack bonus, damage bonus) stale it, so the compare +N slider keeps the run, its marks, and its tally."
  - "The spread line is lopsided when E - SD < 0 or when only a nat 20 hits (UI-SPEC rule extended in 03-01, guarded by check-engine (p))."
  - "A failed roll keeps no run (UI-SPEC: no run is stored)."

patterns-established:
  - "Screenshot-driven fixes: every UI-SPEC state is shot at 1366 and 360 (iframe wrapper, 2x) in both themes before a phase closes"

requirements-completed: [SIM-03, SIM-04]

# Metrics
duration: 14min
completed: 2026-09-26
---

# Phase 3 Plan 03: Table Marks and Phase Verification Summary

**A fresh run now shows on the big outcome table. Each rolled hit cell gets a two-tone ink/paper ring, with an `×N` badge when a cell was rolled more than once. Crit, miss, and nat 1 rows count on their d20 label, so row 20 reads `×3` after seed 6. The marks disappear when the attack changes, come back when it changes back, and survive the +N slider. A static legend item explains them. Phase 3 is verified against SC1-SC4 and D-01..D-16 with the full suite passing and 29 state screenshots.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-09-26T18:19:16Z
- **Completed:** 2026-09-26T18:33:00Z
- **Tasks:** 3
- **Files modified:** 2 (index.html, deferred-items.md)

## Accomplishments
- `renderOutcomeTable(el, { …, marks })` marks only the `#outcome` table:
  - A hit cell gets `class="h … roll"`, plus `data-n` once its count is 2 or more.
  - A crit, miss, or nat 1 row gets `<th scope="row" class="roll" data-n="k">` (always badged).
  - Crit-row cells are never marked (the renderer checks `row.kind === 'hit'`), and neither are miss cells (they return before any mark is added).
  - Every count is coerced with `| 0`.
- Seed 6 at the defaults draws 15 `.roll` elements and 8 `[data-n]` elements. Cell (11, 1) reads `×2`, row 20 reads `×3`, and row 1 reads `×2`. `#compare` has 0 marks.
- The caption gets its `.vh` suffix (`Outlined cells and d20 labels show your last roll of 20 rounds; …`) only while marks show. The first text node stays the Phase 2 sentence, and with no marks the caption goes back to plain `textContent`, so it is byte-identical.
- The CSS draws the ring as a 2px `--ink` border with a 1px `--paper` halo in a `::before`. The badge is an `::after` with `content: "×" attr(data-n) / ""`, preceded by the plain fallback declaration. It uses `translate` rather than `transform`, and nothing is set on the cell box itself.
- The fifth legend item, `Outlined: rolled in your last 20 rounds (×2 = rolled twice). Misses and crits are counted on the d20 label.`, is always present. Its swatch is `.swatch.h.roll` with `data-n="2"` at the t = 0.25 ramp value.

## Task Commits

1. **Task 1: Failing smoke checks for the table marks and the legend item** - `0c1fb8d` (test)
2. **Task 2: Rings, badges, row-label counts, caption suffix, and the legend item** - `dbc049b` (feat)
3. **Task 3: Phase verification. Screenshot fixes for badge collision and swatch shrink** - `39cf1e7` (fix)

## Files Created/Modified
- `index.html`:
  - Mark CSS after the threshold / crit rules.
  - `renderOutcomeTable` marks and `data-down`.
  - `renderTable(view, simCtx)`.
  - The fifth legend item in `renderLegend`.
  - The `sim marks ui` smoke block.
- `.planning/phases/03-roll-20-rounds-simulation/deferred-items.md`: the pre-existing crit swatch shrink at phone width.

## Verification

- RED (Task 1): `check-page --width 1366` exited 1 with 16 failing checks, all named `sim marks ui: …`. check-engine passed.
- GREEN (Task 2 and after the Task 3 fix):
  - `node tools/check-engine.mjs` passed three times: `CHECK-ENGINE PASS: selftest 245/245, sweep 70980 combos`. The Node self-test took **189.8, 186.8, and 196.4 ms** (median 189.8 ms, under the 200 ms budget). This plan added nothing to the page self-test.
  - `check-page --width 1366`, `--width 390`, and `--plain` passed, and so did the `--expect` run with all eight strings (`20 rounds, rolled for real`, `Expected (exact)`, `This run (simulated)`, `Not rolled yet`, `± 14.2`, `About 2 runs in 3 land between 39.8 and 68.2.`, `Roll 20 rounds`, `Outlined: rolled in your last 20 rounds`). Each run printed `CHECK-PAGE PASS` with 80 row headers at load.
- Greps:
  - `'sim marks ui: '` appears 33 times.
  - Each of the two `content:` lines appears once.
  - `marks: simCtx` appears once, and `renderCompare` contains no `marks`.
  - The legend copy appears once.
  - The non-comment `.innerHTML =` count is 4, and `Math.random` appears once.
  - The phase diff adds 0 `opacity` lines.

## Success Criteria Mapping (ROADMAP Phase 3)

| SC | Criterion | Proof |
|----|-----------|-------|
| SC1 | "Roll 20 rounds" shows a realized total labeled "This run (simulated)" next to a visually distinct "Expected (exact)" total with its SD | Self-test `sim: defaults expected and SD`, `sim: exact figure equals the 20-round stat card (STAT-02)`, `sim: AC 16 expected and SD`. Smoke `sim ui: exact figure at the defaults` / `exact SD at the defaults` / `seed 1 figure` / `clicked figure shows the total` / `button label`. check-engine (o) (spread exact on all 70,980 combos) and (p). check-page `--expect "Expected (exact)" "This run (simulated)" "± 14.2"` and (7) the button is enabled. Screenshots (a), (b), (f): solid card with an ink top rule vs a dashed card, `54.0 ± 14.2` vs a whole number. |
| SC2 | The per-round log lists d20, result, dice (two on a crit), and damage, and it sums to the total | Self-test `sim: log damage sums to the total`, `sim: every crit rolls two dice`, `sim: seed 6 has a crit with odd damage …`, `sim: every round damage comes from damageFor (RULES-05)`, `sim: a nat 1 maps to miss`. Smoke `sim log ui: damage cells sum to 71`, `foot total equals the simulated figure`, `crit rows show both real dice in order`, `every nat 1 row is a miss …`. Table marks tie the run to the table: `sim marks ui: seed 6 marked elements` (15), `unbadged marked cells were rolled once`. Screenshots (b), (c): `8 + 3`, `6 + 8`, `8 + 2` crits and `Total 71`, and the d12 run's rings match its log row by row. |
| SC3 | After a roll, changing a control marks the run stale and names its rolled-at parameters. Nothing re-rolls, and nothing flickers while dragging | Smoke `sim log ui: AC change stales the run`, `stale caption carries the rolled-at suffix`, `now line text`, `nothing re-rolls when stale`, `rows are not rebuilt by later renders`, `the button node survives later renders`, `returning to AC 15 un-stales`, `die/atk/dmg change stales the run`, `N slider keeps the run fresh`. Also `sim marks ui: stale run shows no marks`, `marks return at the rolled-at settings`, `N slider keeps the marks`. Screenshot (d): dimmed run, bold stale sentence, `Now:` line, no table marks. **Interpretation:** only the attack controls stale a run. The +N slider does not (see Deviations). |
| SC4 | `?test` includes seeded-RNG simulation checks that pass the same way on every load | Self-test `sim: mulberry32(1) output 1..3`, `sim: seed 1/5/6 at AC 15, d8, +5, +0 totals 47/54/71`, `sim: same seed, same run`, `sim: seed 6 cell (11, 1) rolled twice`, `sim: seed 6 three crits on row 20`, the stub-RNG bounds (`rng 0 …`, `rng near 1 …`, `rng 1 - 2^-53 …`), and `simulate without an rng throws TypeError`. check-engine (q) (seeded 100k-round samples, z ≤ 0.95). All 245/245 pass on every one of the three check-engine runs and every check-page load. |

## Decision Mapping (03-CONTEXT D-01..D-16)

| Decision | Implemented | Checked |
|----------|-------------|---------|
| D-01 own section last in `<main>` | `#sim` after `#chart` (03-01) | `sim ui: section is last in main, right after the chart`. Screenshots show nothing above moves. |
| D-02 pre-roll state, nothing rolls on load | Markup ships `Not rolled yet` and hidden log / tally | `sim ui: simulated slot before the first roll`, check-page (8) body shown, 80 row headers at load. Screenshot (a). |
| D-03 two distinct figures | `.fig-exact` solid card vs `.fig-sim` dashed card, `54.0 ± 14.2` vs an integer | `sim ui: exact figure / SD at the defaults`. Screenshots (a), (b) in both themes. |
| D-04 spread and placement lines | `VM.simExact` / `VM.simPlacement` | `sim: defaults spread sentence`, `sim ui: seed 1 placement`, `sim: seed 5 placement (exactly on)`. Screenshots (b), (e), (f). |
| D-05 exact SD from the one-round distribution | `DiceMath.spread` (integer moments, true 2dX crit) | `sim: defaults Var(one round) is 10.035`, check-engine (o), (p) |
| D-06 20-row log with a Total row | `logBodyHtml`, `tfoot` Total (03-02) | `sim log ui: 20 body rows`, `seed 6 foot total`, `crit rows show both real dice in order`. Screenshots (b), (c). |
| D-07 instant roll | No animation. Figures and log appear in one frame | `sim ui: a click rolls exactly once`, `clicked figure shows the total` |
| D-08 stale dims, keeps rolled-at expected ± SD, `Now:` line | `#sim.is-stale`, `note-stale`, `#sim-now` (03-02) | `sim log ui: stale exact figure stays rolled-at`, `now line text`. Screenshot (d) at 1366 and 360 in both themes. |
| D-09 staleness is a comparison. Back un-stales, and nothing flickers | `Sim.sameAttack` per frame, run-id cache | `sim log ui: returning to AC 15 un-stales`, `rows are not rebuilt …`. `sim marks ui: marks return at the rolled-at settings`. |
| D-10 tally of the last 5 at these settings | `sim.tally`, `#sim-tally` | `sim log ui: tally text`, `tally capped at five`, `tally hidden when stale`. Screenshot (g). |
| D-11 marks on `#outcome` only, ink outline and `×2` badge, readable without color | This plan: `renderOutcomeTable` marks, `.outcome .roll` ring and badge | `sim marks ui: seed 6 marked elements`, `cell 11,1 count`, `compact tables carry no marks`, `cmp ui: compact bodies carry only plain table classes`. Screenshots (b), (c) at both tiers in both themes. |
| D-12 crits count on the nat-20 label, never a cell | Row-header marks. Crit-row cells are skipped by `row.kind === 'hit'` | `sim marks ui: row 20 label count` (`3`), `no crit-row cell is marked`, `no miss cell is marked`. Screenshot (b): `20` with `×3` above it and `crit*` in the note. |
| D-13 marks and tally clear on change; the dimmed run and log stay | `marks` is null while stale, so the next render draws a clean table | `sim marks ui: stale run shows no marks`, `stale run keeps the section dimmed`, `stale run keeps its log rows`. Screenshot (d): no marks. |
| D-14 `1 + floor(rng() * sides)`, damage via `damageFor`, never below 0 | `Sim.rollDie`, `Sim.simulate` (03-01) | `sim: rollDie(20, rng 0) is 1`, `sim: rng 1 - 2^-53 gives d20 20, never 21`, `sim: every round damage comes from damageFor`, `sim: damage never below 0 on a real crit …` |
| D-15 injectable rng, seeded self-test | `simulate(params, n, rng)` requires `rng`. `Math.random` appears once | `sim: simulate without an rng throws TypeError`, seeded pins, check-engine Math.random static gates |
| D-16 theme, tabular numerals, classic inline scripts, real `<table>`, light/dark tokens | Mark CSS uses only `--ink` / `--paper` / `--font-num`. The log and outcome tables are real tables | Screenshots in both themes. `grep` gates: innerHTML 4, no opacity, no new script tags. |

## Requirements (SIM-01..SIM-06)

- **SIM-01** (real dice, total shown): `sim: seed 1/5/6 … totals 47/54/71`, `sim ui: clicked total is a whole number in 0..320`, check-engine (q).
- **SIM-02** (distinct labeled figures): `sim ui: exact figure at the defaults`, `--expect "Expected (exact)" "This run (simulated)"`, screenshots (a) and (b).
- **SIM-03** (per-round log): `sim log ui:` log checks (20 rows, dice, results, Total 71). This plan adds the table marks, which map the log back onto the table (`sim marks ui:` block).
- **SIM-04** (rolls only on click; stale, not re-rolled): check-page 80 row headers at load and `Not rolled yet`, `sim log ui: nothing re-rolls when stale`, and `sim marks ui: stale run shows no marks` / `marks return at the rolled-at settings`.
- **SIM-05** (exact SD): `sim: defaults Var(one round) is 10.035`, check-engine (o) on all combos, and (p).
- **SIM-06** (injectable rng): `sim: simulate without an rng throws TypeError`, the seeded pins, and the Math.random static gate (exactly 1).

## Screenshot Observations

Method: scratch copies of `index.html` in the session scratchpad. Each copy runs the listed calls right after `rollBtn.disabled = false;` in `init()`'s guarded try. Each state was shot twice, once with only `#tables` shown (the controls form stays) and once with only `#sim` shown. Headless Chrome, `--blink-settings=preferredColorScheme=1` for light and `=0` for dark. 360 px was shot through an iframe wrapper at `--force-device-scale-factor=2`. All scratch files were deleted, and `git status` is clean.

| State | Observation | OK |
|-------|-------------|----|
| (a) first load, 1366 light | No `.roll` anywhere in the table. The fifth legend item (swatch `5` with its `×2` badge) sits on the legend's second line next to the threshold item. The sim section is in its pre-roll state (`54.0 ± 14.2`, `Not rolled yet`, spread line, prompt). | Yes |
| (b) seed 6, 1366 light (first shoot) | Rings read clearly on pale (`1`, `2`) and mid-heat (`7`, `8`) cells. **Bug:** row 1's bottom-edge badge (`×2`) and row 2's top-edge badge (`×1`) landed on the same line, so row 2's badge covered row 1's. Fixed (Deviation 1). | Fixed |
| (b) seed 6, 1366 light and dark (re-shoot) | Row 1 `×2` and row 2 `×1` sit on consecutive edges. Rows 4, 5, 6, 9 carry badges on their top edge. Row 20 reads `20` with `×3` on its top edge and `crit*` in the note. Cell (11, 1) is ringed with `×2`. No crit-row or miss cell is ringed. Dark: light ring with a dark halo and light badges with dark text. Both read on the crimson cells. Log beside the result, `Total 71`. | Yes |
| (b), (c) 360 light and dark | Narrow tier (20px rows). Rings stay inside their cells and damage digits stay readable. Label badges are crowded at this size: a badge edge touches the top or bottom of the neighboring digit, but every label stays readable at 2x. `20` sits under `×3` / `×2`. The log stacks below the result. No horizontal scroll (the d12 table is 328px). **First shoot:** the legend's roll swatch shrank to about 20px beside the wrapped text. Fixed with `flex-shrink: 0` (Deviation 2). | Yes, after fix |
| (c) d12 seed 1, 1366 light and dark | Eight ringed hit cells match the log (10/1, 11/12, 12/10, 13/1, 14/7, 15/6, 16/3, 16/4) at the mid tier across the full ramp, including the darkest `12` column. Row labels 1, 3, 4, 5, 6, 8, 9 and 20 (`×2`) are counted. Row 2 was not rolled, so the drop run stops after row 1. | Yes |
| (d) stale (AC 16), 1366 and 360, light and dark | No `.roll` anywhere in the table (now `hits on 11+`). The note carries the bold stale sentence, and the `Now: expected 49.5 ± 14.1 at AC 16, d8, +5 to hit, +0 damage.` line is shown. The log caption has the rolled-at suffix, and the figures and log are muted. | Yes |
| (e) clamped (AC 30, −5, d4, −5), 1366 light | `0.6 ± 1.1`, `Most runs land between 0.0 and 1.7 (damage cannot go below 0, so the spread is lopsided).` `This run is 0.4 above expected (0.4 SD).` Crit `2 + 2` deals 0. | Yes |
| (f) seed 5, 1366 light | `54` and `This run is exactly on expected.` | Yes |
| (g) seeds 1, 5, 6, 1366 light | `Last 3 runs at these settings, newest first: 71 · 54 · 47 (expected 54.0)` with `71` bold. | Yes |

## Decisions Made
- The label-badge drop run (`data-down`), recorded as Deviation 1.
- The `.vh` caption suffix is passed only when marks are non-null. With no marks, `captionHidden` stays `undefined`, so the caption keeps using `textContent` (`cmp ui: study table caption unchanged (D-01)` still passes).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Row 1 and row 2 label badges collided**
- **Found during:** Task 3 (1366 screenshot of state (b))
- **Issue:** The UI-SPEC drops the first-row badge to the bottom edge (clear of the header), but every other badge straddles its top edge. When rows 1 and 2 are both marked, both badges land on the same line, and row 2's hides row 1's. At the defaults this happens in most runs, because row 2 is a miss row.
- **Fix:** A label badge drops to its bottom edge (`th.roll[data-down]`) while the marked labels run unbroken from row 1. The first unmarked label ends the run, so no two label badges ever share an edge. Row 20 always stays up. The chain would need all of rows 1..19 rolled in 20 rounds to reach it, which has negligible odds. Hit cells never need this, because row 1 never has hit cells. A new smoke check pins the drops for seed 6 (`true true false false false` for rows 1, 2, 4, 5, 20). `scope="row"` stays first, and `data-down` comes after `data-n`, so the literal `<th scope="row" class="roll"` count is still 7.
- **Files modified:** index.html
- **Commit:** 39cf1e7

**2. [Rule 1 - Bug] Legend mark swatch shrank at phone width**
- **Found during:** Task 3 (360 screenshot)
- **Issue:** The long fifth legend text made its flex swatch shrink to about 20px, which cramped the `×2` badge.
- **Fix:** `.swatch.roll { flex-shrink: 0; }`. The same pre-existing shrink on the Phase 1 crit swatch is out of scope and is logged in `deferred-items.md`.
- **Files modified:** index.html
- **Commit:** 39cf1e7

### Recorded interpretations (for the verifier)
- **SC3 "any control" vs the +N slider:** ROADMAP SC3 and SIM-04 say "any control". The UI-SPEC Interaction Contract, following the CONTEXT discretion, counts only the attack controls (AC, die, attack bonus, damage bonus) as "changing the attack". The compare +N slider does not change the attack, so it never stales a run, and the run's marks and tally stay (`sim log ui: N slider keeps the run fresh`, `sim marks ui: N slider keeps the marks`). The ROADMAP and REQUIREMENTS wording is unchanged.
- **Lopsided spread wording when only a nat 20 hits:** The UI-SPEC rule (E − SD < 0) was extended to `E − SD < 0 || hitFaces === 1`, so the page never claims "about 2 runs in 3" for a band that holds 45.5% of runs. Guarded by check-engine (p) and the self-test `sim: nat-20-only AC 15 -5 d4 +4 is lopsided` (03-01 Deviation 3).
- **Failed roll:** When a roll throws, no run is stored (UI-SPEC "no run is stored"). The placement slot and status show the error copy (`sim ui: error leaves the simulated slot empty`).

### Minor
- The fifth legend item check reads the label span (`lastElementChild`), because the item's full `textContent` starts with the swatch number `5`.
- The plan asked for at least 20 `sim marks ui` checks. There are 33, including the drop-run check.

---

**Total deviations:** 2 auto-fixed bugs, 3 recorded interpretations, 2 minor
**Impact on plan:** None on scope. Both fixes came from the plan's own screenshot gate.

## Issues Encountered
- A Bash heredoc turned `'\\'` into `'\'` in the Python screenshot script. The line was rewritten to use `pathlib.Path.as_uri()`. Scratch only, no repo effect.
- At the narrow tier (20px rows), a 12px badge cannot fully clear the neighboring 12px digit in a 20px row. This geometry limit is inherent in the UI-SPEC badge size. Labels stay readable, and the log remains the complete record.

## Known Stubs
None. `simCtx.marks`, the last unused Phase 3 field, now drives the table marks.

## Threat Flags
None. The only new innerHTML inputs are the fixed class `roll`, the bare attribute `data-down`, and `| 0` integers (T-03-11). The innerHTML count is still 4.

## User Setup Required
None.

## Next Phase Readiness
- Phase 3 is complete: SC1-SC4, D-01..D-16, and SIM-01..SIM-06 are all backed by passing checks or recorded screenshots.
- The Node self-test runs at 187-196 ms of its 200 ms budget. Phase 4 should add page checks as UI smoke or check-engine work, not self-test loops.
- The deferred crit swatch shrink (`deferred-items.md`) fits the Phase 4 accessibility and polish pass.
