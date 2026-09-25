---
phase: 02-bonus-comparison
plan: 01
subsystem: compare-tables
tags: [compare-tables, n-slider, shared-heat-domain, container-queries]
requires:
  - "Phase 1 index.html: DiceMath.stats, VM.parseControl / fixed / tenths / signed, renderTable, runUiSmoke, tools/check-engine.mjs, tools/check-page.mjs"
provides:
  - "VM.CONTROL_SPEC.n (0..20) and DEFAULT_STATE.n = 5"
  - "VM.statsView (Phase 1 stats-only view), VM.compareView(p, n), VM.computeView (page view with shared heatMax + compare block)"
  - "renderOutcomeTable(el, { rows, die, threshold, heatMax, caption, captionHidden }) shared by all four tables"
  - "section#compare with form#compare-controls (second control root) and three compact tables #cmp-base / #cmp-hit / #cmp-dmg"
  - ".outcome class (retargeted from the old id selector), named compare container, .trio 1-or-3 grid"
affects:
  - "02-02 (sweep chart): appends chartView to computeView and renderChart to RENDERERS; reads CONTROL_SPEC.n.max"
tech-stack:
  added: []
  patterns:
    - "Two control roots, one key-generic handler; renderControls walks document-wide [data-key]"
    - "Split view: statsView for per-combo grids, composed computeView for the page"
    - "Self-test section(name, fn) wrapper so Phase 2 crashes never read as 'self-test crashed'"
key-files:
  created:
    - .planning/phases/02-bonus-comparison/02-01-SUMMARY.md
  modified:
    - index.html
    - tools/check-engine.mjs
    - tools/check-page.mjs
decisions:
  - "The shared heatMax (D-08) is computed as the true max cell across the three compact row sets; 2X + D + N is only the test oracle"
  - "Compact-table deltas are displayed variant tenths minus displayed baseline tenths (Pitfall 7)"
  - "check-page --expect now matches visible text only (self-test panel stripped, entities decoded; IN-06)"
  - "#n-out gets display: inline-block so its 48x40 box applies (an <output> is inline by default)"
metrics:
  duration: "~8 min wall clock for execution (context reading excluded)"
  completed: 2026-09-25
  tasks: 3
  files: 3
---

# Phase 2 Plan 01: Compare +N Tables Summary

A "Compare at +N" slider (0..20, default +5) now drives three compact outcome tables: Baseline (+0), +N to hit, and +N to damage. They share one heat domain with the study table and the legend (0 5 11 16 21 at the defaults). Each table has its own moving "hits on N+" rule and a stats line with a bold 20-round total and delta. The tables sit three across at 1366 px with a d12 and stack at the mid or narrow tier below a 77rem container.

## What was built

**Task 1 (RED), commit 2b65011**
- Self-test: six `section('cmp', ...)` blocks with 37 named checks plus three aggregated grid checks over 250 compareView calls. They cover the parser for n, the reference values at N = 0/5/20, the floor case, the page view vs the stats view, and the displayed-tenths delta rule.
- runUiSmoke: the legend expectation moves to `0,5,11,16,21`, with `0,4,8,12,16` pinned at n 0. A new `cmp ui:` block (25 names) covers the slider min/max from the spec, output and state wiring, three tables in order, stats lines equal to the view, threshold rows 10/5/10, the shared scale in the DOM (16 at t 0.762, 21 at t 1.000), no diff classes, the unchanged study caption, and the width-aware three-up vs stacked layout.
- check-page: expects 80 row headers, and `--expect` now matches visible text only.
- check-engine: a per-(ac, die) `statAt(atk, dmg)` cache, plus invariants (g) heat domain oracle, (h) +N-to-hit threshold, and (i) a 1-in-50 sampled compareView agreement.
- RED confirmed: (a)-(h) ok; only `cmp` self-test checks and (i) failed.

**Task 2 (GREEN), commit 8a17563**
- VM: `n` added to CONTROL_SPEC and DEFAULT_STATE. `statsView` is the old computeView body, unchanged. New `compareView(p, n)` and a composed `computeView`. The self-test grid, the V helper, and check-engine call `VM.statsView`.
- Markup: `class="outcome"` added to the study table. `section#compare` added with the intro, the N strip (`#n-range` has no min, max, or value attributes), and `.trio` holding three `.cmp` blocks.
- App: `renderOutcomeTable` is the only table renderer, and it still holds the only two `.innerHTML =` assignments. `renderTable` is a thin wrapper with a byte-identical caption. New `renderCompare`. Both forms get submit/input/change listeners through `onChange`. Slider min/max come from `VM.CONTROL_SPEC.n` in `init()`.
- CSS: all 21 `#outcome` selectors across 18 lines became `.outcome`. Named `compare` container, `.trio` switching between one and three columns at 77rem, and `.trio .table-wrap` capped below the wide tier.

**Task 3 (finish), commit e6acd31**
- `.section-intro`, `.n-strip`, `#n-out`, `.trio caption` (ink 700), `.cmp-stats` and `.cmp-stats .num`. No motion rules.

## Verification

| Check | Result |
|-------|--------|
| `node tools/check-engine.mjs` | CHECK-ENGINE PASS, selftest 105/105 (Node 172-180 ms, under the 200 ms gate), (a)-(i) all 0 failures, 70980 combos |
| `check-page --width 1366 --expect "Compare at +N" --expect "Baseline (+0)" --expect "+5 to hit" --expect "+5 to damage"` | PASS: 80 row headers, panel 183/183, three-up branch at a 1297 px compare container |
| `check-page --width 390` | PASS: stacked branch (headless floors at about 497 px, compare container 465 px), panel 182/182 |
| `check-page --plain --expect "Compare +N to hit vs +N to damage"` | PASS |
| Static gates | `#outcome` 0; `class="outcome"` 4; non-comment `.innerHTML =` 2; n spec 1; `n-range` attrs 0; `compare-controls` 2; `function onChange` 1; CSP line 1; transition/animation 0 |

## Visual check (scratch copy with DEFAULT_STATE die 12; headless Chrome, `--blink-settings=preferredColorScheme=1/0`)

- **1366 light:** The three d12 tables sit in one row, titled "Baseline (+0)", "+5 to hit", "+5 to damage" in bold ink. The +5 to hit rule sits on row 5 and the other two sit on row 10. The +5 to damage crit row (up to 29) holds the darkest cells on the page. Stats lines read 78.0 / 110.5 (+32.5) / 133.0 (+55.0) with bold numbers. The study table above keeps the wide tier and its muted caption. The legend reads 0 7 15 22 29 with the new "(one scale for every table on the page)" text.
- **1366 dark:** Same layout. The candlelit ramp is legible, the crit rows of the +5 to damage table are brightest, the slider uses the amber accent, and the stats lines are readable ink.
- **360 light (iframe):** Tables stack one per row at the narrow tier with the short "10+ / 5+" rule labels. Nothing spills past 360 px, so there is no horizontal scroll. The N strip wraps inside its box.
- **360 dark (iframe):** Same as the light shot, legible.
- Scratch files (d12 copy, 360 iframe wrapper, four PNGs, DOM dumps) were deleted from the session scratchpad. `git status --porcelain` shows no untracked files in the repo.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `<output>` needs `display: inline-block` for its box size**
- **Found during:** Task 3
- **Issue:** An `<output>` is inline, so the specified min-width, height, and line-height would not apply.
- **Fix:** Added `display: inline-block` to `#n-out`.
- **Files modified:** index.html
- **Commit:** e6acd31

**2. [Rule 3 - Blocking] Grep-gate collisions in comments**
- **Found during:** Tasks 1 and 3
- **Issue:** The check-engine header comment matched `(g) CMP-02` / `(h) CMP-03`, where the gates require exactly 1. A CSS comment used the word "transitions", where the gate requires 0.
- **Fix:** Reworded both comments. No behavior change.
- **Commits:** 2b65011, e6acd31

**3. Judgment call: grid axes hoisted**
- The Phase 1 `ACS / ATKS / DMGS` constants moved from inside the self-test `try` to the IIFE scope, so the new compare grid reuses "the existing ACS / ATKS" as the plan says. Values are unchanged.

**4. Judgment call: `renderOutcomeTable` coerces `die` with `Number(die) | 0`**
- The die value now reaches innerHTML through a generic function, so it gets the same integer coercion `noteFor` uses (T-02-01 hardening).

**5. Commit attribution**
- Commits end with the harness-provided `Co-Authored-By: Claude Opus 5.5 (1M context)` line, not the orchestrator's note, because the system attribution instruction takes precedence over an agent message.

## Notes for later plans

- The Node self-test now runs at 172-180 ms against the 200 ms gate (browser: 32-51 ms). Plan 02-02's chart assertions should stay cheap (synthetic arrays, a few sweeps). Alternatively, move the compare grid's oracle stats out of the loop.
- Working-tree line endings: my sed/python edits left index.html and check-engine.mjs with LF in the working tree. Git normalizes to LF in the index (autocrlf=true), so commits are clean. Git warns that it will convert back to CRLF on the next checkout.

## Known Stubs

None. The compact tables' empty `<caption>`, `<thead>`, and `<tbody>` in the markup are filled on every render, the same pattern as the Phase 1 table.

## Threat Flags

None. No new network surface, external resources, or inline handlers. The CSP meta is unchanged, and the N slider value flows only through `VM.parseControl`.

## Self-Check: PASSED

- FOUND: index.html, tools/check-engine.mjs, tools/check-page.mjs, .planning/phases/02-bonus-comparison/02-01-SUMMARY.md
- FOUND commits: 2b65011, 8a17563, e6acd31
