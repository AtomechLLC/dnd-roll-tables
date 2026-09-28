---
phase: quick-260927-1ty
plan: 01
status: complete
subsystem: page layout (index.html <style>, #chart markup)
tags: [density, layout, container-queries, css]
requires: []
provides:
  - "Spacing tokens 4/8/12/16/20/24 and 32px controls"
  - "main as named `page` container with >= 64rem / >= 72rem side-column layouts"
  - "div.chart-body wrapping the chart legend, .chart-wrap, caption and explanations"
affects: [index.html, README.md]
tech-stack:
  added: []
  patterns: ["named @container page queries for page-level side columns; unnamed queries stay reserved for the outcome-table tiers"]
key-files:
  created: []
  modified: [index.html, README.md]
decisions:
  - "Density pass overrides earlier UI-SPEC spacing, control height, wide-tier row height, stat-card minimum, formula threshold and the single-column page rule, at the user's request (list below)"
  - "Page-level side columns use only the named `page` container, so the outcome-table tiers still resolve against .table-wrap"
metrics:
  duration: "~35 min"
  completed: 2026-09-27
  tasks: 3
  files: 2
---

# Quick 260927-1ty: Make the page more space-dense Summary

Tighter spacing scale (4/8/12/16/20/24), 32px controls and 24px wide-tier rows. On pages at least 64rem / 72rem wide, side columns put the two-roll text and legend beside the outcome table, the formulas and marginal cards side by side, the compare intro beside the N strip, and the chart notes beside the chart. The page is **27.6% shorter at 1366px** (5060 to 3663px).

## Results

| Measure (light, default settings, no roll) | Before (HEAD 40f234a) | After Task 1 | Final | Change |
|---|---|---|---|---|
| scrollHeight at 1366 | 5060 | 4646 | **3663** | **-27.6%** (target <= 3795) |
| scrollHeight at 360 | 8773 | 7827 | **7823** | **-10.8%** |
| Smallest control (minCtl) | 16px (#ac-range) | 32px | **32px** (#ac-range) | |
| sw == cw at 1366 / 360 | yes / yes | yes / yes | yes / yes (also with d12) | |

- d12 at 1366: the outcome table is 653px including its border (the 652px wide tier), sw == cw, H = 3643. The #crit-note top (852) is below the #outcome bottom (840), with the same left x (666).
- d12 at 360: table 329px, sw == cw = 360.
- No fallback-ladder step was needed.

## Overridden UI-SPEC values (at the user's request; historical phase docs not rewritten)

1. **Spacing scale** (01-UI-SPEC Spacing Scale; 02/03 extend it): --sp-3 16 to 12px, --sp-4 24 to 16px, --sp-5 32 to 20px, --sp-6 48 to 24px (--sp-1 4 and --sp-2 8 unchanged). Effects: page inline padding 16 to 12, section gap 32 to 20, footer top margin 48 to 24, header padding-top 24 to 16, card, strip and figure padding 16 to 12, strip padding-inline 24 to 16, h2 bottom margin 16 to 12, three-up column gap 16 to 12, sim-body gaps 24/32 to 16/20. The .n-strip bottom margin also went from --sp-4 to --sp-3 (16 to 12 after the new scale).
2. **Control height 40 to 32px**: number inputs, die segments (48 x 32), #n-out, Roll button min-height, preset button min-height (padding 4px 12px). Range sliders get an explicit 32px height (new; they rendered 16px tall). The label-to-control gap in `.group` went from 8 to 4px.
3. **Wide outcome-table tier row height 28 to 24px.** Cell 40, row header 44 and note 128 are unchanged, so d12 is still 652px. The legend swatch went from 40x28 to 40x24 (line-height 26 to 22).
4. **Stat card track minimum 10rem to 9rem** (two cards per row at 360).
5. **Formula card two-column threshold** changed from `@container formula (width >= 40rem)` to `36rem`.
6. **Wide-screen side columns.** These partly reverse 01-UI-SPEC "Single column ... No side column at any width", the Legend "single wrapping row between the h2 and the table", the "full grid row" rule for the marginal and formulas cards, and the 02/04 chart layout with the caption and explanations under the chart.
   - At page >= 64rem, #tables puts the text (two-roll paragraph, legend) on the left and the 43rem table column with the footnote directly under it on the right. The formulas card spans columns 1-3 and the marginal card 4-6. The compare intro and N strip share one row.
   - At page >= 72rem, the chart legend, caption and three explanations sit in a column beside the 50rem chart.
   - Narrower pages keep the stacked order.

## Tasks

| Task | Commit | Files |
|---|---|---|
| 1. Baseline; tighter spacing scale, 32px controls, 24px wide-tier rows | 709a486 | index.html |
| 2. Wide-screen side columns and chart-body markup; README wording | 8886582 | index.html, README.md |
| 3. Full check sweep, true-360 self-test, screenshot inspection | (no changes needed) | none |

## Checks

- `check-engine`: CHECK-ENGINE PASS, 251/251, 70,980 combos. The first run printed WARNING 205.4 ms (budget 200). I then ran it four times back to back, alternating a scratch copy of the pre-change page (HEAD 40f234a) with the new page. All four passed with no warning, so the 205 ms was machine load. No script changed.
- `check-page` (?test): PASS. The Chrome self-test took 63.7 ms and was "within 200 ms". Guards (9)-(13) ok, and "page order: header, controls, tables, stats, compare, chart, sim, explore" ok.
- `check-page --plain`, `--width 1366`, `--width 390`, `--fault render`: all CHECK-PAGE PASS.
- `check-page --plain` with the six `--expect` strings: CHECK-PAGE PASS.
- The in-page ?test smoke in the iframe harness gave selftest=pass at a true 360px width (H 7972) and at 1366 (H 3775).
- `grep -c "container: page / inline-size"` = 1; `grep -c 'class="chart-body"'` = 1.

## Screenshot observations

- (a) 1366 light, full page: the two-roll paragraph and legend are left of the table and the footnote is under it. The formulas and marginal cards sit side by side, with the dt column intact in both. The compare intro and "Compare at +N" strip share a row, and the three compact tables are side by side. The chart legend, caption and three explanations sit in a column right of the chart. The Try-this buttons are compact (32px).
- (b) 1366 dark, full page: the surfaces, hatch, heat ramp, crit accent, threshold rule and chart series all render correctly in the candlelit palette. The layout is identical to light.
- (c) 360 light (full page, plus close-ups at top=0 with d12 and at top=1500): the controls stack cleanly. The d12 compact table fits. The stat cards sit two per row with no value overflowing ("2.700", "54.0", "4.91"). The formulas card is single-column. Nothing overlaps.
- (d) 360 dark (full page, plus a close-up at top=700): the legend items wrap cleanly, and the hatch, the 0 in miss cells, the threshold rule and the crit swatch are correct.
- (e) 1366 light, d12, top: the wide-tier table is 652px with 24px rows. The miss hatch with 0s, the "hits on 10+" rule, the crit row and "auto-miss" are all legible. The corner cell's "d20 \ d12" fits its two 12px lines. The text and legend are on the left, and the footnote starts under the table.
- (f) 1366 light, d12, compare: three d12 compact tables sit side by side with their stats lines, and the intro shares a row with the N strip. The chart legend begins beside the chart.
- (g) 1366 light, focus on #atk-num: the 2px accent focus ring is fully visible around the 32px box.

## Deviations from Plan

- **Harness adjustment (not a code change):** Under `--virtual-time-budget`, headless Chrome ran no animation frames inside the iframe. The die click's rAF render therefore never ran, and the d12 runs measured the d8 table. Adding `--run-all-compositor-stages-before-draw` fixed it. I re-measured the baselines with the flag and they were unchanged (5060 / 8773). I also added the die value, header count, note position and compare y to the harness output.
- Otherwise the plan was executed as written.

## Known Stubs

None.

## Self-Check: PASSED

- index.html, README.md modified; commits 709a486 and 8886582 present in `git log`.
- `git remote` empty; no push, no gh.
