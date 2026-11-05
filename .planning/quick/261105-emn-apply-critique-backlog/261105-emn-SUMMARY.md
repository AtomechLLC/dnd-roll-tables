---
phase: quick-261105-emn
plan: 01
subsystem: page
tags: [critique, layout, verdict, compare, touch, a11y]
requires: []
provides:
  - "Lesson-first page order: bar, try row, tables with the cards beside the table, chart, compare, kill, sim, explore"
  - "Verdict why in 20-round numbers with the chart caption's crossing sentence"
  - "Two compare tables with a phone switch, phone steppers, collapsed log, Roll beside the table"
affects: [index.html, tools/check-engine.mjs, tools/check-page.mjs, DESIGN.md, .planning/PROJECT.md]
tech-stack:
  added: []
  patterns:
    - "verdictView(sv, fv, crossings): winner from formulaView, numbers from the card's strings, crossing from computeView's one chart"
    - "CSS-only one-at-a-time table with :has() inside @supports and a container query"
    - "--plot-w derives from --scroll-pad, so the chart fits after a jump"
key-files:
  created: []
  modified: [index.html, tools/check-engine.mjs, tools/check-page.mjs, DESIGN.md, .planning/PROJECT.md]
key-decisions:
  - "CLAUDE.md is not edited: the executor's constraint overrides the plan. Line 15 still says three tables."
  - "README.md is not edited: the CONTEXT's doc list leaves it out. Line 9 still says three tables."
  - "The compare switch's legend is visible (Show), because guard (10) requires a shown legend and guards are not loosened."
metrics:
  completed: 2026-11-05
  tasks: 3
  commits: 8
---

# Phase quick-261105-emn Plan 01: Apply the critique backlog Summary

The chart moves up from y 2255 to y 1164 at 1366 and from 4505 to 2974 at 360, the verdict now gives its reason in 20-round numbers and names the crossing at every setting, phones scroll less, and Roll sits beside the table it marks. No math changed.

## Commits

| Commit | Message |
|--------|---------|
| a67a928 | test: expect the verdict's reason, the crossing wording and the new copy |
| 2db344d | feat: give the verdict its reason and crossing in 20-round units, and fix preset and step copy |
| bdc9e91 | test: expect the new page order, try row, roll button, steppers and two compare tables |
| 8ee24e3 | feat: lead with the table and chart, drop the Baseline table, add the try row, roll button, steppers and compare switch |
| 91225a5 | test: expect heavier rings, row counts on hit rows and short phone notes |
| 4f0f7e5 | feat: mark repeat rolls with a heavier ring, count every rolled row, shorten phone notes and raise miss contrast |
| 445588f | docs: keep DESIGN and PROJECT true to the new page |
| c961753 | fix: fit the chart under the bar after a jump, and clear what the sweep found |

## Check output (final, on c961753)

| Command | Final line |
|---------|------------|
| `node tools/check-engine.mjs` | `CHECK-ENGINE PASS: selftest 261/261, sweep 70980 combos` |
| `node tools/check-page.mjs` | `CHECK-PAGE PASS` |
| `--plain` | `CHECK-PAGE PASS` |
| `--width 390` | `CHECK-PAGE PASS` |
| `--width 360` | `CHECK-PAGE PASS` |
| `--fault render` | `CHECK-PAGE PASS` |
| `--fault later` | `CHECK-PAGE PASS` |
| shared URL, `--plain --expect "Killing a 100 HP enemy" --expect "between +5 and +6"` | `CHECK-PAGE PASS` |

- I1: `zero-hit 28100, hit ahead 26473, damage ahead 16356, about even 51, tie 0; each expected hit 60740, floor 10240; crossing tails 26192, between 25318`, 0 failures. These match the planner's preflight.
- Self-test: 39 to 71 ms in Chrome across the runs above. In Node 197.8 ms on the final run (budget 200). The Node figure ranged 184 to 198 ms across this task and is load-sensitive. It is close to its budget, though Chrome is well under.
- CSP: `git diff c5fa1cc -- index.html | grep -c Content-Security-Policy` is 0.
- One `Math.random` in the file, in `onRoll`. Both Roll buttons use that handler.
- Detector: exactly 8, the documented set: 2 border-accent-on-rounded, 1 repeating-stripes-gradient, 2 design-system-color, 3 design-system-font-size. No new finding.

## Geometry (light theme, iframe harness)

| Measure | Result |
|---------|--------|
| `#chart` y at 1366x768 | 1163.7 (critique: 2255) |
| `#chart` y at 360 | 2973.5 (critique: 4505) |
| `#bar` height, 1366x768, defaults | 131.6px |
| `#bar` height, 178-character sentence plus a clamp note | 163.2 at 1366, 188.2 at 1144; coarse 175.2 and 200.2 |
| Sticky height at 320 | 81.2 (was 152 worst); coarse 105.6 (was 177 worst). The harness measured the same 81.2 and 105.6 for the defaults and the longest settings line |
| `scrollWidth == clientWidth` | Holds at 1920, 1366, 1144, 1143, 1100, 1048, 1047, 800, 480, 360, 320, and on the coarse copy at 320, 360, 800 |
| Card tracks | 3 at 1366, 2 at 1100, 2 at 1048 |
| Empty height at 1366 | 0 under the left column: the cards end at 1143.7, the table column at 1068.3, so the 75px of spare height sits under the table column |
| Chart after Go to the chart, 1366x768 | svg top 375.3, bottom 759.3 of 768, width 614 |
| Sticky after scrolling | 1366: bar top 0 at #chart and #sim. 360: #verdict top 0 and #verdict-why scrolled away |
| Focus | #hp-num, #roll, #roll-table, .btn-try, explore preset, #fold-formulas, #chart-data-summary: uncovered with the ring at 1366 and 360, in fine and coarse, from the page top, the page end and from just under the sticky area (.btn-try only from the top and end) |
| Fault via harness | #verdict-why and #verdict compute `display: none` at 1366 and 360 |
| 360, d12 | Table 336 wide; forced `miss ×2` and `at +1 ×2` fit one line (scrollWidth 71 of 71); row height 21, unchanged |
| Self-test via `?test` | Pass at true 1366 and true 360 |
| Folds | Formulas and marginal closed at both widths; log open at 1366 and closed at 360 after a roll |
| Coarse (scratch copy with the media query forced) | Steppers 44x44, Attack and Damage on one row at 320, 360, 800; box 27px wide at 320; spinners hidden; hidden at 1366; no other visible control under 44px |
| Switch at 360 | Each radio shows the right table, no URL change, #cmp-summary visible in both states |
| Contrast | Rendered color pair oklch(0.40 0.01 80) on the 0.78 stripe: 4.60:1 (0.45 was 3.72). Calculated from the computed colors, not read from pixels |
| URL | A try button and a stepper write the query; the switch and the roll write nothing |

## `--scroll-pad` values

| Case | Was | Now | Source |
|------|-----|-----|--------|
| Base (sticky #verdict alone) | 10rem | 5.75rem | 81.2 + 8 |
| Sticky bar | 10.75rem | 12.5rem | 188.2 + 8 |
| Coarse base | 11.75rem | 7.25rem | 105.6 + 8 |
| Coarse sticky bar | 11.5rem | 13.25rem | 200.2 + 8 |

## Screenshots inspected

- 1366 light, top: lead and why on one line, Try row, table column and three card tracks on the first screen. Read at the Task 2 state; the later Task 3 legend was read in its own close-up below.
- 1366 dark, top: same layout, tokens hold, the heavier legend ring reads.
- 1366 light, #chart after the jump: readout, plot and x-axis title all fit in 768.
- 1366 light, #compare: two tables side by side. The stats lines sit below that shot, so the wording was read at 360 and pinned by the smoke.
- 1100 light, #tables: two card tracks left of the table; footnote directly under it.
- 360 light and dark, top: lead sticks with settings, why follows as its own paragraph, Try row wraps to two lines.
- 360 with a roll, d12: `miss ×1`, `at +1`, `×5` on hit rows, heavier rings; note and link read correctly.
- 360 #compare with To damage chosen: one table, `miss` and `10+` short notes, stats line reads vs the main table.
- 320 coarse copy: steppers on one row, hints on their own line.
- Legend and table with a roll, light and dark: no badge, no number covered, counts on every rolled row.
- 1366 #sim with a roll: fold summary with one visible Round by round.

## Copy search results

| Phrase | Where | Verdict |
|--------|-------|---------|
| `the settings above` | Chart intro | True: the bar precedes it |
| `Baseline` | No visible copy. Internal `Baseline (+0)` title and its self-test pin stay, because compareView keeps `tables.base`; one smoke check name mentions it | Fine |
| `three` | No visible copy about tables. The self-test name about the max of three tables is still true of the three row sets | Fine |
| `the table above` | Not on the page | - |
| `the main table above` | New compare intro | True |
| `The numbers above are exact averages` | Sim intro | True: tables, cards, chart, compare and kill all precede it |
| `below` | Kill intro `last roll below`: true. Footer `below 0`, kill note and spread line: about values, not position. Crit footnote `cards below`: changed. `the links below`: changed | See deviations |
| `above` | Run place line: about values, not position | True |
| `at the top` | Try this `controls at the top of the page`; chart intro's new `line at the top` | True |
| `further down` | Table's hidden caption suffix about the log | True |
| `the note under the table` | #two-rolls | True, and now guaranteed by .table-col |

Docs search: PRODUCT.md has nothing this task makes untrue. README.md line 9 still says `Three tables side by side`, and is not edited (see Not verified or left open). `.planning/PROJECT.md` line 43 is the v1.0 shipped-requirements record and stays.

## Deviations from Plan

### Executor constraint

**CLAUDE.md not edited.** The plan and CONTEXT name CLAUDE.md line 15. The spawn constraint overrides that because the user did not ask for that file to change. `.planning/PROJECT.md` is updated instead (lines 7 and 81). **CLAUDE.md line 15 still says three tables.** The docs commit message says DESIGN and PROJECT only.

### Corrections the planner supplied (applied as written)

- Four row tracks in `#tables`, `auto auto auto 1fr`, so spare height lands below #stats (C1 listed three).
- `presetStatus` says `Everything on the page has updated.`
- Crit footnote says `The stat cards use the real two-dice rule.`

### Auto-fixed issues

**1. [Rule 1 - Copy false in the new order] `the links below`**
- Found during: Task 3 copy search. The plan expected it to stay true.
- Issue: at the sticky widths Go to the controls is hidden, so one link shows and "the links" is false.
- Fix: the Try this intro now ends `Read what to look for, then go and see it.`
- Commit: c961753

**2. [Rule 1 - Bug] Chart no longer fit under the bar after a jump**
- Found during: Task 3 sweep. svg bottom 807 of 768 at 1366x768, because `--scroll-pad` rose and the intro gained a sentence.
- Fix: `--plot-w` is now `calc((100svh - var(--scroll-pad) - 11.5rem) * 1.6)` in place of the fixed 21rem, so coarse fits too.
- Commit: c961753

**3. [Rule 1 - Bug] Round by round printed twice**
- Found during: Task 3 screenshots. The new fold summary sat above the table's own caption.
- Fix: while the run is fresh the caption is transparent, stays for assistive tech and holds its two lines so rows do not move when the stale suffix arrives. Stale runs still show it in full. Summary margin is 0 on this fold.
- Commit: c961753

**4. [Rule 1 - Layout] Stat tracks at the narrow end of the wide tier**
- Found during: Task 2. C1's plain `minmax(11rem, 1fr)` gives one track at 1048, six cards in a column.
- Fix: `minmax(min(11rem, (100% - gap) / 2), 1fr)`. Still 3 at 1366 and 2 at 1100 as C1 states; 2 at 1048.
- Commit: 8ee24e3, 4f0f7e5

**5. [Rule 1 - Guard vs plan] Switch legend is visible**
- The plan asks for a visually hidden legend. Guard (10) requires a radio group's legend to be shown, and guards are not loosened.
- Fix: a visible `Show` legend, styled like the other group labels.
- Commit: 8ee24e3

**6. [Rule 1 - Layout] `.btn-preset.btn-try`**
- `.btn-try` alone lost to the later `.btn-preset` and rendered 34px. Now 32px per C6.
- Commit: 8ee24e3

**7. [Rule 1 - Layout] Bonus hints**
- At 320 the hint split across lines beside the steppers. `.group-bonus .hint` keeps it on one line in the stepper block.
- Commit: c961753

### Sentence accuracy noted, no change

`1 more on each hit that deals damage` (C3) is true when read after the +1: every hit that deals damage with the +1 has exactly 1 more than before, including a hit going from 0 to 1. A hit still at 0 is not one that deals damage. I1 proves the wording choice, not this reading.

Task 1's feat commit was amended once, unpushed, to fix smoke literals that I had committed before running the default check-page mode. Task 2's test commit was amended once, unpushed, to fix a bug in the new guard's child-name helper.

## Left as they are, with reasons

- Chart Y scale rescaling: a fixed scale would flatten d4 at low bonuses to fit d12 +20.
- Typing "25" passing through AC 10: changing it reverses the live-update rule on number boxes.
- Skip link: guard 15 and the user's request make the community link the first tab stop.
- `td.m` reading only "0": the row's note and caption carry it; adding text to 240 cells costs self-test time.
- AC by die grid: a critique question, a new feature rather than a fix.
- Detector's 8 items: documented deliberate choices and false positives in DESIGN.md.
- Bar growing when a clamp note appears: rare and temporary.

## Threat Flags

None. The steppers are the one new write path and are in the plan's threat model.

## Known Stubs

None.

## Not verified or left open

- **No real touch device.** Steppers were tested in a scratch copy with `(pointer: coarse)` forced on, under a fine pointer in headless Chrome.
- **Browsers:** Chrome only. Firefox and Safari, including the `:has()` fallback, were not run. The fallback is reasoned from the CSS, not observed.
- **Chart fit at 1144 to about 1200:** below a 72rem page the chart's legend sits above the plot, so the plot does not fit under the bar after a jump (svg bottom 919 of 768 measured before the --plot-w fix, about 871 by calculation after it). The legend-above layout is not new to this task.
- **Before numbers** 2255, 4505, 152 and 177 come from the critique and the old CSS comments; I did not re-measure them.
- **README.md line 9** still says `Three tables side by side`. **CLAUDE.md line 15** still says three tables. Both are out of date and need the user's decision.
- **Node self-test time** sits at 184 to 198 ms against 200, with one more margin-eating change likely to warn.

## Self-Check: PASSED

Verified all eight commits exist in `git log`; index.html, both tools, DESIGN.md and .planning/PROJECT.md hold the changes; nothing pushed.
