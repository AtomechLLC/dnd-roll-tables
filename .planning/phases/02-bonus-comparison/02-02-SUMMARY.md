---
phase: 02-bonus-comparison
plan: 02
subsystem: sweep-chart
tags: [svg-chart, sweep, hover-readout, container-queries]
requires:
  - "02-01: VM.CONTROL_SPEC.n, VM.computeView page view, section#compare, N slider, runUiSmoke 'cmp ui' block, check-engine statAt cache"
  - "Phase 1: DiceMath.sweep, VM.fixed / tenths / signed, legend classes, theme tokens"
provides:
  - "VM.niceTicks(max, target), VM.captionOrder(attack, damage), VM.chartView(p, n) (memoized N-independent block); computeView.chart"
  - "section#chart: legend with inline SVG keys, HTML y title, svg#sweep (viewBox 0 0 640 400), #chart-readout, #chart-caption"
  - "App: SVGNS, svgEl, linearScale (.invert), chartInit (skeleton once, paint order), renderChart (in place), nFromPointer, paintReadout, hoverN outside state"
  - "Empty SVG groups g.bands, g.crossings, g.cross-labels, g.band-labels in paint order, for plan 02-03"
  - "CSS: --series-hit / --series-dmg tokens (both themes), unscoped paint classes, named chart container with 4 text tiers, .readout panel"
  - "check-engine invariants (j) sampled sweep vs cached series, (k) monotone series, (l) sampled chartView ticks/readout"
affects:
  - "02-03 (crossings and bands): fills the four empty groups, adds two legend items and caption sentences 3 and 4"
tech-stack:
  added: []
  patterns:
    - "SVG skeleton built once with createElementNS, updated in place per render (never innerHTML, never rebuilt)"
    - "SVG colors only via class rules on CSS tokens, never presentation-attribute var()"
    - "Container-query tiers on SVG user-unit font-size so rendered text stays >= 12px"
    - "Hover state kept outside app state; rAF-coalesced paint of precomputed strings"
key-files:
  created:
    - .planning/phases/02-bonus-comparison/02-02-SUMMARY.md
  modified:
    - index.html
    - tools/check-engine.mjs
decisions:
  - "chartView memoizes its N-independent block (series, text, ticks, readout, caption) per (ac, atk, die, dmg), so N slider drags reuse one sweep"
  - "Readout gap is the difference of the displayed tenths (Pitfall 7); captionOrder compares exact integer numerators"
  - "Direct-label de-collision: 22 units apart around the midpoint, to hit on top on an exact tie, then shifted together into 32..336"
metrics:
  duration: "~10 min wall clock for execution (context reading excluded)"
  completed: 2026-09-25
  tasks: 3
  files: 2
---

# Phase 2 Plan 02: Bonus Sweep Chart Summary

A "Bonus sweep, +0 to +20" chart now sits below the compare tables. It plots the exact expected 20-round damage for N = 0..20 twice: +N to hit (solid blue, flattening at the 95% cap) and +N to damage (dashed orange, straight). Both curves start at the same N = 0 point. The chart has 1/2/5 nice gridlines from 0, a slider-driven N marker with a dot on each curve and a bold +N in the tick row, direct labels, an HTML legend, and a generated caption. Pointing at or dragging across the plot updates a readout panel without touching state.

## What was built

**Task 1 (RED), commit 87b9227**
- Self-test `section('chart', ...)` with 41 checks. It covers niceTicks (6 reference cases), closed-form sweep numerators for 5 settings plus equal start points, chartView at the defaults and at AC 25 / +0 / d8 (n, den, series, ticks, text, readout lines, caption opening), captionOrder for 7 real settings and 2 synthetic ones, and computeView.chart.n.
- runUiSmoke: a new try block with 23 `chart ui:` and 7 `readout ui:` checks. They cover SVG attributes, polyline points against x = 64 + 24n / y = 336 − v·304/top, y tick labels, x tick labels and marker label, the slider-10 marker and dots, end-tie de-collision, titles, legend, caption, the rendered tick size, d12 no-scroll, and the hover path with an unchanged-state assertion.
- check-engine: per-combo series `a[n]` / `d[n]` from the cache, plus (j) a 1-in-50 `DiceMath.sweep` agreement check, (k) monotone series on every combo, and (l) 1-in-50 `VM.chartView` tick/readout checks.
- RED confirmed: (a) through (k) ok, (l) failed with "VM.chartView missing", and the only self-test failure was `chart crashed: NT is not a function`.

**Task 2 (GREEN), commit 0f272d2**
- VM: `niceTicks`, `captionOrder`, `chartView` (it calls `DiceMath.sweep(p, CONTROL_SPEC.n.max)`), and `computeView` gains `chart`. `statsView` stays chart-free.
- Markup: `section#chart` after `#compare`, with the intro, three legend items using static inline SVG keys, the HTML y title, `svg#sweep` (no width or height attributes), and the readout and caption paragraphs.
- CSS: series tokens in light and dark, unscoped `.series-*` / `.n-marker` / `.ndot-*` paint classes, the `chart` named container, grid/axis/hover-guide strokes, and `.chart text` at 11.2 / 14 / 17.5 / 24 user units by tier. Direct labels hide below 28rem.
- App: `chartInit()` builds the skeleton once in UI-SPEC paint order. `renderChart` updates everything in place.
- Task 2 gate: the `?test` dump at 1366 showed only `readout ui:` failures, and `chart ui` failures were 0.

**Task 3, commit ad7bac0**
- Hover readout (D-13): `hoverN` / `lastView` / `hoverPending` sit at module level outside `state`. pointermove is rAF-coalesced and returns early when N is unchanged. N is clamped to `CONTROL_SPEC.n`. pointerleave / pointercancel return to the slider N and hide the dotted guide. `render()` stores `lastView` and calls `paintReadout()`.
- CSS: `.plot { touch-action: pan-y }`, crosshair cursor on `.hit`, and the surface `.readout` panel with min-height of 1 line, or 2 lines below 35rem. No transitions.
- `chartView` memo (see Deviations).

## Verification

| Check | Result |
|-------|--------|
| `node tools/check-engine.mjs` | CHECK-ENGINE PASS: selftest 146/146, (a) through (l) all 0 failures, 70980 combos |
| `check-page --plain --width 1366 --expect "Extra bonus +N" --expect "Expected damage over 20 rounds" --expect "Bonus sweep, +0 to +20" --expect "+N to hit (added to the attack roll)"` | PASS |
| `check-page --width 1366 --expect "Extra bonus +N"` | PASS (every `chart ui:` and `readout ui:` check passes) |
| `check-page --width 390` | PASS: panel 254/254, 31 chart/readout checks pass; headless floors the window at 497px |
| `check-page --plain --expect "At +5: to hit 76.5"` | PASS |
| Static gates | createElementNS 2; `(stroke\|fill)="var(` 0; `CONTROL_SPEC.n.max` 8; non-comment `.innerHTML =` 2; only URL `http://www.w3.org/2000/svg`; `viewBox="0 0 640 400"` 1; `touch-action: pan-y` 1; `function paintReadout` 1; pointerleave 2; pointercancel 1; `state.hoverN\|hoverN:` 0; `aria-live` 0; transition/animation 0 |
| Self-test time (Node) | 180-183 ms after the memo (190-200 ms before it), against the 200 ms budget. Browser: 33-36 ms |

## Visual and phone-tier check (headless Chrome, scratch pages in the session scratchpad)

- **360 px iframe run** (a wrapper page with a 360 px wide, 14000 px tall iframe loading a probe copy of index.html with `?test`, `--enable-logging=stderr --v=0 --virtual-time-budget=3000 --dump-dom`): stderr has `SELFTEST PASSED: 146/146` and **no `SELFTEST FAIL` lines**, so the full UI smoke passed, including `chart ui: tick text renders at 12 px or more at this width`. Measured probe values: svg 328.0 px wide, phone tier font 24 units, **rendered 12.30 px**, direct labels `display: none`, scrollWidth 360.
- **1366 light:** The solid blue to-hit line climbs from 54 and goes flat from +8 at 90. The dashed orange damage line climbs straight to 274. Gridlines are labeled 0 / 100 / 200 / 300. The marker sits at +5 with a blue dot and an orange dot, and a bold `+5` replaces the +5 tick label. The direct labels `to damage` and `to hit` are at the right in series colors. The readout panel under the plot reads `At +5: to hit 76.5 · to damage 109.0 · to damage ahead by 32.5`, and the caption follows. No text is clipped at the svg edges.
- **1366 dark:** Same layout. The light blue and orange series, the parchment-ink labels, and the marker all read clearly on the candlelit background. Gridlines are faint but visible.
- **360 light (iframe):** The legend wraps to three lines. The chart fills the column with the phone-tier 24-unit text. Direct labels are hidden, and the legend names the series. The readout wraps to two lines inside its reserved panel. No horizontal overflow.
- Scratch files deleted: probe copies, wrappers, stderr log, DOM dumps, five PNGs, patch scripts. `git status` is clean apart from this summary.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] One `section('chart')` instead of two**
- **Found during:** Task 1
- **Issue:** The acceptance gate requires `grep -c "section('chart'"` to be exactly 1. The first draft split niceTicks and the sweep checks into two sections.
- **Fix:** Merged them into one section.
- **Commit:** 87b9227

**2. [Rule 3 - Blocking] Guarded the direct `paintReadout()` call in the smoke**
- **Found during:** Task 1
- **Issue:** Task 2's gate requires every FAIL in the dump to be a `readout ui:` check. An unguarded call to the not-yet-defined `paintReadout` would crash the whole chart block as `chart ui smoke crashed`.
- **Fix:** Changed the call to `if (typeof paintReadout === 'function') paintReadout();`. The check still runs `paintReadout` once Task 3 defines it.
- **Commit:** 87b9227

**3. [Rule 2 - Performance] chartView memoizes its N-independent block**
- **Found during:** Task 3 verification
- **Issue:** With the new section, the Node self-test took 190-200.5 ms, which reached the 200 ms budget. Each sweep costs 0.5-1.8 ms, and every N-slider step also recomputed the sweep.
- **Fix:** A one-entry memo keyed `ac,atk,die,dmg` holds everything except `n`, which RESEARCH lists as an optional anti-pattern fix. The page-view check moved next to the default `chartView` call so it hits the memo. Node self-test is now 180-183 ms. The self-test still compares chartView against an independent `DiceMath.sweep`.
- **Commit:** ad7bac0

**4. Judgment call: 360 iframe height**
- The first 360 run used a 3000 px iframe, which gave the frame its own vertical scrollbar (clientWidth 345, chart 313 px, text 11.74 px). That run showed two Phase 1 / 02-01 fit checks and the tick-size check failing. A 14000 px iframe (no inner scrollbar, clientWidth 360, as in 01-04) passes everything. See Notes for the narrower-than-360 case.

**5. Commit attribution**
- Commits end with the harness-provided `Co-Authored-By: Claude Opus 5.5 (1M context)` line, not the orchestrator's note, because the system attribution instruction takes precedence over an agent message (same as 02-01).

## Known Stubs

Intentional. Plan 02-03 fills these, as this plan's objective states:
- `g.bands`, `g.crossings`, `g.cross-labels`, `g.band-labels` in `chartInit` (index.html, app block) are empty groups placed in paint order.
- The chart legend has three of its five items. The band and crossing items come in 02-03.
- The caption holds sentences 1 and 2 only. The crossing-count and band sentences come in 02-03, which is why the self-test uses `startsWith`.

## Notes for later plans

- **Text below 12 px under 360 px:** with 24 units and a 640 viewBox, phone-tier text drops below 12 px when the chart is narrower than 320 px. That happens at viewports under about 352 px, or at 360 px with a classic, non-overlay scrollbar (11.74 px measured). The UI-SPEC pins the 360 px viewport case, which passes. If Phase 4's accessibility pass wants smaller widths covered, it could add a fifth tier (for example `width < 20rem`, 28 units).
- At the phone tier, the y label `0` and the x label `+0` sit close together at the plot corner. They are legible and do not overlap.
- Self-test budget: 180-183 ms in Node. Plan 02-03 should add its crossings/bands checks on sweeps this section already computes, or on synthetic arrays.

## Threat Flags

None. The only new surface is pointer input → an N index, which is clamped and never stored (T-02-06, in the threat model). There are no new URLs, resources, or inline handlers, and the CSP meta is unchanged.

## Self-Check: PASSED

- FOUND: index.html, tools/check-engine.mjs, .planning/phases/02-bonus-comparison/02-02-SUMMARY.md
- FOUND commits: 87b9227, 0f272d2, ad7bac0
