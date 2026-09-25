---
phase: 01-live-roll-table-deployed
plan: 04
subsystem: theme, outcome-table, legend
tags: [outcome-table, theme, legend, container-queries, dark-mode]
requires:
  - "01-01: VM.computeView (rows, threshold, heatMax, critFloorDiffers), RENDERERS, renderTable, runUiSmoke, check tools"
  - "01-03: branch main (serialization only, no code dependency)"
provides:
  - "index.html: full light (parchment) + dark (candlelit) token set, one prefers-color-scheme block"
  - "index.html: --surface, --ink-muted, --line, --pass, --fail tokens for later phases"
  - "index.html #app: renderLegend(view), renderFootnote(view), swatch(), legendItem(); RENDERERS = [renderControls, renderStats, renderTable, renderLegend, renderFootnote]"
  - "index.html: .table-wrap container with wide/mid/narrow @container tiers (40/24/20px cells)"
  - "index.html: note labels .note-miss / .note-th[data-short] / .note-crit; corner cell span.cd"
affects: [01-05 controls and stat cards, Phase 2 three-up tables (mid tier, shared legend), Phase 4 accessibility pass]
tech-stack:
  added: []
  patterns:
    - "Theme = custom properties on :root, overridden once in @media (prefers-color-scheme: dark); no light-dark()"
    - "Legend swatches reuse the table's .h / .h.hi / .m / crit / threshold classes, so they cannot drift"
    - "Container-query tiers placed after the base table rules so equal-specificity overrides win"
    - "Narrow-tier label shortening via ::after content: attr(data-short) / '' (full phrase stays in the DOM and in the accessible text)"
key-files:
  created:
    - .planning/phases/01-live-roll-table-deployed/01-04-SUMMARY.md
  modified:
    - index.html
decisions:
  - "Threshold note markup is <span class=note-th data-short=N+>hits on N+</span>. The narrow tier shows N+ through ::after, not a hidden span.lg, so the table text itself matches check-page --expect 'hits on 10+' and screen readers get the full phrase at every width"
  - "Wide-tier corner cell stacks 'd20' over '\\ dX' at 12px, because 'd20 \\ d12' does not fit the UI-SPEC 44px row-header column on one line; mid/narrow hide .cd and show 'd20'"
  - "Legend crit swatch is an .h.hi cell at t = 1 with the crit rule and no number; the threshold swatch is a --paper box with the 3px rule"
  - "UI smoke check names avoid the exact label strings, so check-page --expect can only match the real table, legend and footnote, not the self-test panel"
  - "Header carries the 24px top space; when the ?test panel or the engine banner shows above it, that element takes the space instead"
metrics:
  duration: "~12 min"
  completed: 2026-09-24
  tasks: 2
  files: 1
---

# Phase 1 Plan 04: Readable, Themed Outcome Table Summary

The outcome table now explains itself. It has parchment-and-ink and candlelit themes, one blood-red heat ramp with hatched grey misses, a moving 3px "hits on N+" rule, the auto-miss and crit* labels, a legend built from the table's own cell classes, and a live crit footnote. Container-query size tiers keep a d12 table fully legible at 1366px and at 360px.

## What Was Built

**Task 1: Theme, frame, panel (commit d306c85)**
- Light tokens added: `--surface`, `--ink-muted`, `--line`, `--pass`, `--fail`. One `@media (prefers-color-scheme: dark)` block redefines every color token with the UI-SPEC candlelit values, including `--ramp-a: 0.56` and `--ramp-b: 0.72` (D-06).
- Page frame: `main` and `footer` are capped at 90rem, `main` is a single-column grid with a 32px gap, and `header` gets a 24px top padding (D-01, D-02).
- Typography uses 4 sizes and 2 weights. The control strip and stat cards get a `--surface` background and `--line` borders. Labels, hints, and the footer use `--ink-muted`.
- The self-test panel gets a `pass` or `fail` class from `showSelfTestPanel`, which draws a 4px `--pass` or `--fail` left border. The summary line and FAIL lines use the same status tokens. `#engine-error` has a `--surface` background with a 4px `--fail` border.

**Task 2: Table anatomy, legend, footnote, tiers (commit 25c2876)**
- `.table-wrap { container-type: inline-size; overflow-x: auto }`. Default wide tier is 40/28/44/128px at 14px. The mid tier `@container (width < 42rem)` is 24/24/32/80px at 12px. The narrow tier `@container (width < 25rem)` is 20/20/24/64px at 12px.
- Caption is muted 14px. Row and column headers use `--surface` at weight 700. Grid lines are 1px `--line`. The note column is italic serif on `--paper`. Fumble row headers are muted.
- `noteFor` emits `auto-miss` (muted, 400), `hits on N+` (ink, 700), or `crit*` (accent, 700). Row 20 shows `crit*` even when the threshold is 20; that row then carries both shadows.
- `renderLegend` has five ramp swatches (0 4 8 12 16 at the defaults), a miss swatch, a crit swatch, and a threshold swatch. It uses only createElement, textContent, and style.setProperty.
- `renderFootnote` is live for the current die, and appends the floor sentence when `view.critFloorDiffers` is true.
- `.innerHTML =` assignments are still exactly 2.
- 15 new UI smoke checks (all pass):
  - legend ramp values
  - `2d8` and `2d12` in the footnote
  - threshold on row 10 with note text, and on row 2 at atk +13
  - row 20 is both crit and threshold at AC 30 / atk -5
  - d12 has 12 cells per row, no horizontal page scroll, and the table fits its wrapper
  - d4 D-5: row 10 face 1 is a `td.h` showing 0
  - the footnote adds the floor sentence

## Verification

| Check | Result |
|-------|--------|
| `node tools/check-engine.mjs` | CHECK-ENGINE PASS (selftest 59/59, 70,980-combo sweep) |
| `node tools/check-page.mjs --expect "hits on 10+" --expect "auto-miss" --expect "crit*" --expect "Hit damage, low to high" --expect "Miss: always 0" --expect "2d8 + damage bonus" --expect "Rule: first d20 roll that hits"` | CHECK-PAGE PASS |
| `node tools/check-page.mjs --width 360` | CHECK-PAGE PASS |
| `node tools/check-page.mjs --plain` | CHECK-PAGE PASS |
| Grep gates: one dark media block, all tokens, no transition/animation, no light-dark(), 2 innerHTML assignments, container-type, both @container rules, renderLegend, renderFootnote, #legend, #crit-note | all pass |
| Full UI smoke run inside a real 360px iframe (scratch wrapper) | SELFTEST PASSED, no `SELFTEST FAIL` lines; the d12 no-scroll check ran at clientWidth 360 |

## Visual Check (d12, headless Chrome, scratch copies, since deleted)

The OS on this machine is in dark mode, so `--force-dark-mode` alone rendered both "light" and "dark" shots dark. The final shots forced each scheme with `--blink-settings=preferredColorScheme=1` (light) and `=0` (dark). The 360px shots render the page inside a 360px iframe, because headless Chrome floors the window at about 497px.

- **1366 light:** The d12 table (652px) sits left-aligned with no horizontal scrollbar, and all numbers are crisp. Rows 1-9 are hatched warm-grey with muted 0s. Hits run from pale peach (1) to terracotta (12) and reach deep crimson with white text only on the crit row (up to 24). The 3px dark rule sits above row 10, which reads **hits on 10+**. The accent bottom rule sits under row 20, which reads **crit\***. The legend is a single row. The footnote names 2d12.
- **1366 dark:** The same layout on the candlelit brown background. Misses are dark hatched grey. Hits run from dim maroon to bright coral-red, with dark text on the high half. The rule is a light parchment line, and crit\* is in gold.
- **360 light:** Groups and cards stack. The legend wraps into four lines. The narrow-tier table (328px) fits with all 12 columns and no page scroll. The corner reads `d20`, the threshold note reads `10+`, and auto-miss and crit\* fit the 64px note column. The numbers are small (12px) but readable.
- **360 dark:** The same as 360 light, in the candlelit palette. The ramp, hatch, and rules are all distinct.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Threshold note markup could not satisfy the plan's own `--expect "hits on 10+"`**
- **Found during:** Task 2
- **Issue:** The plan's markup `<span class="lg">hits on </span>N+` splits the phrase across a tag. check-page's `--expect "hits on 10+"` matches serialized DOM text, so the table alone could never match; it would only pass by accident through a self-test check name.
- **Fix:** The markup is now `<span class="note-th" data-short="N+">hits on N+</span>`. In the narrow tier the phrase is hidden visually (`font-size: 0`) and `::after { content: attr(data-short) / "" }` shows `N+`. The empty alt text keeps the generated `N+` out of the accessibility tree, so screen readers hear "hits on 10+" at every width, where the plan's markup would have given "10+" at the narrow tier. Both the span and `::after` are pinned to the row-high line box. A geometry probe at 360px confirmed the label box is exactly the 20px row.
- **Files modified:** index.html
- **Commit:** 25c2876

**2. [Rule 1 - Bug] Corner cell clipped `d20 \ d12` at the wide tier**
- **Found during:** Task 2 visual check (1366px screenshot)
- **Issue:** On one line, `d20 \ d12` is about 55px wide at 14px bold, but the UI-SPEC row-header column is 44px, so the label was cut to `d20 \ c`.
- **Fix:** The wide tier stacks `d20` over a right-aligned `\ d12` at 12px with a 12px line-height, which fits the 44x28 cell. The mid and narrow tiers restore a centered single line and hide `.cd` (the plan's intent). The container-query blocks moved after the base table rules so their equal-specificity overrides win.
- **Files modified:** index.html
- **Commit:** 25c2876

### Scope Change (orchestrator)

Git stays local (no remote, no Pages, no `gh`). This plan had no push step. Verification used only the local file:// checks.

### Notes

- `check-page.mjs --width 360` passes, but it actually renders at about 497px, because headless Chrome enforces a minimum window width. That exercises the mid tier, not the narrow one. The narrow tier was verified separately: the full smoke suite ran in a 360px iframe, and the 360px screenshots were checked. A future tweak to check-page could use an iframe wrapper for widths under 500px. It is logged here, not changed, because tools/ is outside this plan's files.
- The commit trailers use the harness attribution line (`Claude Opus 5.5 (1M context)`), not the `Claude Fable 5.1` line in the orchestrator's project notes. The two conflicted, and the harness line matches the model that did the work.

## Known Stubs

None. The legend's crit and threshold swatches are intentionally textless (the adjacent legend text explains them).

## Self-Check: PASSED

- FOUND: index.html (modified), .planning/phases/01-live-roll-table-deployed/01-04-SUMMARY.md
- FOUND: commit d306c85 (Task 1), commit 25c2876 (Task 2)
- STATE.md and ROADMAP.md not modified
