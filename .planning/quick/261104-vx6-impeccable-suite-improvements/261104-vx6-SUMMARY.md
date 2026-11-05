---
phase: quick-261104-vx6
plan: 01
status: complete
subsystem: ui
tags: [sticky-bar, verdict, url-state, touch-targets, copy, a11y]
requires: []
provides:
  - "Sticky control bar with a generated verdict line, Reset and shareable URLs"
  - "Kill section below the chart; +1 flip note; roll counts in the note column"
  - "Oracles I1-I4 in check-engine and guards (3), (7), (11), (14), (16) in check-page"
affects: [DESIGN.md (written by a later step)]
tech-stack:
  added: []
  patterns:
    - "Verdict restates formulaView's win result and compares nothing itself"
    - "Clamp and Reset sentences: cleared, then written in the next frame behind a record guard"
    - "Scroll padding from measured sticky heights, dropped while focus is inside the sticky area"
key-files:
  created: []
  modified: [index.html, tools/check-engine.mjs, tools/check-page.mjs]
decisions:
  - "Sticky threshold X = 70rem page width (viewport 71.5rem = 1144px); measured one-row minimum 68.625rem"
  - "scroll-padding-top: 10rem (verdict) and 10.75rem (bar); coarse pointer 11.75rem and 11.5rem"
  - "No scroll padding while focus is in #controls or #verdict, via html:has()"
metrics:
  duration: "about 35 min"
  completed: 2026-11-04
  tasks: 3
  commits: 6
---

# Quick 261104-vx6: Impeccable suite improvements Summary

The answer now sits directly under one sticky control strip: a generated "+1 to damage wins here." line that restates the formula's win result at all 70,980 settings, with Reset, shareable URLs, clamp sentences, the kill section below the chart, roll counts that no longer cover d20 labels, and 44px touch targets. No math changed.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 RED | 024931f | test: add verdict, flip row, URL and clamp oracles |
| 1 GREEN | 6e20db2 | feat: add verdict, flip row, URL state and clamp notes to the view-model |
| 2 RED | 1ab6efd | test: expect the bar, kill section, reset and verdict in check-page |
| 2 GREEN | 4abf7e6 | feat: add the sticky bar, verdict, kill section, reset and shareable URLs |
| 3 RED | 58fd86a | test: expect roll counts in the note column and worded legend swatches |
| 3 GREEN | 746ae44 | feat: move roll counts to the note column, tighten copy, add touch targets and themed surfaces |

Each RED commit failed on its new checks only before the GREEN commit. Nothing was pushed.

## Sticky measurements

- **Threshold X = 70rem** page container, viewport 71.5rem = 1144px. Every `#controls` group and Reset share one row from a 68.625rem page (1098px; iframe 1122px). This is above the plan's estimate of about 67rem. I kept the 7rem slider basis and left 22px of margin for other platforms' font metrics.
- 1366 x 768: one row. The bar is 131px tall and pinned at top 0 at `#chart` and `#sim`.
- Scroll padding (worst case plus 8px):

| Mode | Worst sticky height | Padding |
|------|---------------------|---------|
| Verdict only, fine pointer | 152px at 320 wide (128px at 360) | 10rem = 160px |
| Bar, fine pointer | 162px (129-character verdict plus clamp sentence) | 10.75rem = 172px |
| Verdict only, coarse | 177px at 320 wide (153px at 360) | 11.75rem = 188px |
| Bar, coarse | 174px | 11.5rem = 184px |

## Geometry gates (light theme)

| Viewport | scrollWidth = clientWidth | Sticky | Controls |
|----------|---------------------------|--------|----------|
| 1366 x 768 | 1366 | bar, top 0 | one row |
| 1366 x 900 | 1366 | bar, top 0 | one row |
| 1920 x 1080 | 1920 | bar, top 0 | one row |
| 1144 x 768 | 1144 | bar, top 0 | one row |
| 1143 x 768 | 1143 | verdict 61px; strip scrolled away | Change shown |
| 480 x 800 | 480 | verdict 85px | folds closed |
| 360 x 800 | 360 | verdict 104px | folds closed |
| 1366 x 600 | 1366 | bar not sticky, verdict 61px with settings and Change | one row |

- **Focus:** `#hp-num`, `#roll`, a Try this button, `#chart-data-summary`, `#fold-marginal` and `#hp-plus`, each focused from the top, middle and end of the page: 18/18 clear of the sticky area including the 4px ring at each of 1366x768, 360x800 and 1366x600. Coarse copy: 5/5 at 1366 and at 360.
- **Jumps:** `#chart` lands at 172px under a 131px bar (1366) and at 160px under a 104px verdict (360). `#controls` is visible in both modes.
- **Real keys in the stuck bar at y 2083:** Tab through ac-range, ac-num, die, atk-num, dmg-num, n-range and reset holds y 2083. Tabbing out to `fold-formulas` then scrolls to it. Typing `12` in the attack box and clicking the AC box both hold y.
- **360, d12:** table 336px in a 336px wrapper with no inner scroll. `auto-miss ×2`, `hits at +1 ×2`, `×2` and `crit* ×3` all fit (scrollWidth equals clientWidth, 71). Table height is 489.19px before and after marks.
- **A real roll** leaves the table height unchanged at 1366, 700 and 360.
- **Folds:** closed at 480 and 360, open at 1366 and 1143; chart data closed everywhere.
- **Coarse:** in a scratch copy with `(pointer: coarse)` replaced by `all`, every D14 control measures at least 44px at 1366, 1144, 800, 480, 360 and 320 (Change hidden at the sticky widths, 44px otherwise). The controls stay one row at 1366 and 1144.
- **URL write:** moving AC gives `?ac=22`, moving back gives empty, `n` gives `?n=9`, Reset gives empty and announces once with aria-disabled true. `?ac=25&die=12` opens at those settings. `?ac=abc&die=7&atk=999&hp=-3&foo=1#chart` normalizes to `?foo=1&atk=20&hp=1#chart`. `?test&ac=25` ignores `ac` and keeps its query after a slider move.
- **Real typing:** `40` in the AC box, then Tab: box 30, AC 30, the sentence shows, URL `?ac=30`.
- **Self-test panel:** pass at true 360 (776/776) and at 1366 (775/775; the Change checks are skipped where it is hidden).
- **Contrast:** crit swatch 9.23:1 light and 6.75:1 dark; hits swatch 13.54:1 and 13.83:1; flip note 6.69:1 and 8.44:1; selection 5.95:1 and 9.63:1.

## Check output

```
node tools/check-engine.mjs                     CHECK-ENGINE PASS: selftest 261/261, sweep 70980 combos
  (I1) 0 failures (zero-hit 28100, hit ahead 26473, damage ahead 16356, about even 51, tie 0)
  (I2) 0 failures   (I3) 0 failures, 2599 round trips   (I4) 0 failures   (i) 0 failures
  selftest time 190.3 ms (budget 200)
node tools/check-page.mjs                       CHECK-PAGE PASS  (Chrome self-test 34.0 ms)
node tools/check-page.mjs --plain               CHECK-PAGE PASS  (58.6 ms)
node tools/check-page.mjs --width 390           CHECK-PAGE PASS  (39.9 ms)
node tools/check-page.mjs --width 360           CHECK-PAGE PASS  (56.3 ms)
node tools/check-page.mjs --fault render        CHECK-PAGE PASS  (74.6 ms)
node tools/check-page.mjs --fault later         CHECK-PAGE PASS  (58.7 ms)
URL command (?ac=25&die=12&atk=0&dmg=0&n=6&hp=100, with --expect)   CHECK-PAGE PASS
--plain --expect "Every bonus from +0 to +20" --expect "Killing a 40 HP enemy"   CHECK-PAGE PASS
CSP lines changed since 0649444: 0
grep -c data-down: 0     grep -c "compare-controls|n-strip": 0
```

No check fails. The Node self-test runs at 190 ms against its 200 ms budget (183 ms at baseline), so it has little room left. I added nothing to the `dice-selftest` block.

Detector: **3 findings**, the known three (2x border-accent-on-rounded, 1x repeating-stripes-gradient). A fourth, cramped-padding on `#verdict`, appeared and was fixed by using the `padding` shorthand instead of `padding-block`.

## Screenshots inspected

- 1366 light, top: one strip with the verdict under it; "hits at +1" on row 9; worded swatches.
- 1366 dark, top: same layout; every surface reads on the candlelit tokens.
- 1366 light, scrolled to `#chart`: bar pinned, opaque, nothing bleeds through; the compare stats pass cleanly under the rule.
- 1366 dark, scrolled to `#chart`: same, including the band and series colors.
- 1366 light, table after a roll: counts in the note column, labels uncovered, the `×2` badge only on cell 11,1.
- 1366 light, clamp sentence stuck with chart data open: the sentence takes its own row; the table is readable.
- 1366 dark, `#kill` after a roll: HP strip, three cards with the note beside them, sim below.
- 1366 x 600: verdict only, with settings and Change.
- 360 light, top: strip stacked, verdict under it, Change on its own line.
- 360 dark, top: same.
- 360 light and dark, table after a roll: verdict pinned; counts in the note column; no label covered.
- 360 light, d12 with the worst notes: all on one line.
- 360 dark, 129-character verdict at 360x640: five lines, about 128px, 20% of the screen.
- 360 light, fold opened: the formula stacks correctly inside the fold.
- Legend close-up, light and dark: `crit` and `hits` readable.
- Coarse copy, 1366 and 360: 44px controls, the strip still one row at 1366.

Two of these were not re-read on the final build. The 1366 light `#kill` shot I inspected came from the Task 2 build, and the final `#kill` look was in dark. The 360 dark rolled table I inspected predates the 1px note inset fix; the light one was re-read after it. Neither area changed in any other way.

## Copy search

Searched the markup and VM strings for `below`, `above`, `at the top`, `top of the page`, `slider`, `further down`.

- **Fixed:** the caption suffix (`in the 20 rounds section further down`). The sim intro's "top of the page" clause went with the D13 rewrite.
- **Still true, left:** `as set above` and `legend above` (compare intro); `the settings above` (chart intro); `the last roll below` (kill intro, sim follows it); `The numbers above` (sim intro); `controls at the top of the page` and `the links below` (Try this); `Everything above has updated` (preset status); `Current +N from the slider` (chart legend); `The stat cards below` (crit floor sentence).

## Deviations from Plan

### Auto-fixed Issues

Found by the sweep before the Task 3 commit, so they are inside 4abf7e6 or 746ae44 rather than separate `fix` commits.

**1. [Rule 1 - Bug] Focus inside the stuck bar scrolled the page away**
- **Issue:** the plan's scroll padding made anything in the bar count as hidden. Focusing a stuck control moved the page 409px, and Tab or typing in a number box did the same through caret reveal, which ignores scroll-margin.
- **Fix:** `html:has(#controls :focus, #verdict :focus) { scroll-padding-top: 0 }`. Nothing can cover the strip below the sticky widths either, because the verdict's natural place is under it.
- **Files modified:** index.html

**2. [Rule 1 - Bug] "Go to the controls" at sticky widths moved the page up by 164px for no reason**
- **Fix:** a negative `scroll-margin-top` on `#controls` in the sticky block. The link now leaves the page where it is, with the controls already on screen. It therefore shows no motion at laptop widths; you may want to look at that.

**3. [Rule 1 - Bug] D5's 336px sum missed the collapsed outer border**
- **Issue:** d12 at 360 measured 337px, and `auto-miss ×2` clipped.
- **Fix:** narrow tier `--rowhead` 24 to 23px; note cell inset and count margin 1px. That spacing is tight (`auto-miss×2`) but legible, in the narrow tier only.

**4. [Rule 1 - Bug] A count made a row 1px taller on a roll**
- **Fix:** `line-height: 1` on `.note-count`, like the existing `.hp-kill` rule.

**5. [Rule 1 - Bug] A two-digit count could clip to a false number on a phone**
- **Fix:** at N of 10 or more the count leads the cell, so only the word clips. This departs from D5's "after any note text" in that case only, about one run in five million.

**6. [Rule 1 - Bug] The coarse rule for Change would have overridden the sticky `display: none`**
- **Fix:** two-id selector on the hide rule.

**7. [Rule 3 - Blocking] Detector finding** on `padding-block`; fixed with the shorthand.

### Other changes from the plan text

- **Summaries on a coarse pointer** use `min-height: 44px` with padding, not inline-flex centering, because inline-flex removes the disclosure marker.
- **Sweep harness:** I replaced the iframe harness with a scratch Chrome DevTools driver, because `requestAnimationFrame` did not fire in the iframe under the virtual-time flag. It gives a true 360px viewport and real key and mouse events. The driver and all scratch files are deleted.
- **Added:** class `group-slider` on the AC and +N groups; more pins in I3 and I4 than listed; a zero-hit count pin in I1.

**Total deviations:** 7 auto-fixed. All were needed for correctness or a plan gate. No math, CSP or scope changes.

## Not verified

- Chrome only. Firefox and Safari were not run. Without `:has()` a stuck-bar focus would scroll the page as in item 1.
- No real touch device; the coarse results come from the scratch copy.
- No screen reader; live regions were checked by their DOM writes only.
- `replaceState` was exercised on `file://` only, since nothing was pushed to the Pages URL.
- Not touched, per the plan and the brief: ROADMAP.md, DESIGN.md, STATE.md. This SUMMARY is left uncommitted in the quick directory, as the plan's cleanup step expects.

## Self-Check: PASSED

All six commits exist in `git log`; the three modified files and this SUMMARY exist; scratch files are deleted; `git status` shows only `.impeccable/` and the quick directory untracked; nothing pushed.

## Follow-up after the re-score (orchestrator)

An independent re-critique scored the page 28/40 (26/40 before) and found a pre-existing truth defect. Fixed in 6cd8eb7 (failing checks) and 0c6ec0d:

- The crit footnote said "exactly" and then "slightly off" at the 0-damage floor. "Exactly" now appears only while it is true.
- The chart readout moved above the plot, and the plot is sized to fit under the sticky bar (`--plot-w`).
- Verdict digits use the number face.
- Failure and self-test panels dropped the 4px colored left border; the kill row no longer computes to weight 900.

DESIGN.md and `.impeccable/design.json` were written from the shipped page. Open items are in `.impeccable/critique/2026-11-05T08-08-26Z__index-html.md`.
