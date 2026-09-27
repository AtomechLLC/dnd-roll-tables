---
phase: 04-designer-explanation-final-ship
plan: 02
subsystem: ui, view-model, dev-tools
tags: [explanation-copy, live-formulas, two-roll, view-model, exact-branching, copy-01, copy-02]

# Dependency graph
requires:
  - phase: 04-designer-explanation-final-ship
    provides: "04-01 visible-text --expect with NBSP normalization, --fault render, PAINTED_SECTIONS, SAMPLE / (cover) in check-engine"
provides:
  - "VM.statsView(...).exact = { e20Num, e20Den, hitNum, dmgNum, den, normalNum, normalDen } (frozen, no new engine calls)"
  - "VM.twoRollsText(sv) and VM.formulaView(sv) -> { hit, roundKey, round: { l1, l2, note }, plusHit, plusDmg, win, branch }"
  - "computeView carries formulas and twoRolls from its one statsView result"
  - "Markup: extended lede, div.card.formulas#formulas, dl.formulas.f-marg in #marginal, p.explain#two-rolls"
  - "App: setSeg, renderFormulas (after renderStats), renderTwoRolls (after renderTable)"
  - "check-engine (r)(s)(t)(z) exhaustive with pinned branch counts; self-test section 'copy' (3 pins); runUiSmoke 'formula ui' block"
affects: [04-03 chart copy and explorations, 04-04 accessibility guards, 04-05 publish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Copy builders are pure functions of a statsView result; the check-engine loop reuses its existing view, so exhaustive copy checks cost no engine calls"
    - "Branches are chosen by exact integer equality with the engine numerators, never a damage threshold"
    - "A live line is a { pre, result, post } segment; the result is always the card's own string"
    - "U+00A0 comes from String.fromCharCode(0xa0), never a backslash escape (the tooling drops backslashes)"

key-files:
  created:
    - .planning/phases/04-designer-explanation-final-ship/04-02-SUMMARY.md
  modified:
    - index.html
    - tools/check-engine.mjs

key-decisions:
  - "Which wins uses the inequality form only when both +1 lines are rule branch; the 80 mixed settings (nat-20 only, D = -2) compare the displayed values (UI-SPEC deviation, RESEARCH Pitfall 1)"
  - "The two-roll sentence uses 'an' before 8, 11 and 18 (UI-SPEC deviation, RESEARCH Pitfall 3)"
  - "NBSP is written as String.fromCharCode(0xa0): the Edit tool turned \\u00a0 escapes into raw NBSP bytes and Git Bash sed dropped the backslash"
  - "Prose parentheticals in the clamp text ('(a natural 1 always misses)') keep ordinary spaces so they can wrap; NBSP is used only inside math groups, around × and around /"
  - "The Which-wins verdict is prose bold (.f-live b:not(.num) uses --font-prose); the rest of the live line stays in the number face"

patterns-established:
  - "Branch counts are part of the check: a rule change that moves any setting between branches fails check-engine"

requirements-completed: [COPY-01, COPY-02]

# Metrics
duration: 14min
completed: 2026-09-27
---

# Phase 4 Plan 02: Live Formulas and the Two-Roll Paragraph Summary

**The page now explains its own numbers. A two-roll paragraph sits above the outcome table, and a "How these numbers are worked out" card under the stat cards shows each rule with today's values. The +1 to hit / +1 to damage / Which wins derivations sit inside the marginal card. Every result is the card's own string, and every branch is chosen by exact integer comparison, checked on all 70,980 settings.**

## Performance

- **Duration:** about 14 min
- **Started:** 2026-09-27T06:31:50Z (after 04-01's final commit)
- **Completed:** 2026-09-27T06:45Z
- **Tasks:** 3 (RED, slice A, slice B)
- **Files modified:** 2

## Accomplishments

- COPY-01: `#two-rolls` explains in four sentences that the d20 comes first, damage rolls only on a hit, and the 20 × X cells are equally likely (d20, die) pairs, so the average cell is the expected damage. It has cap, floor and `critFloorDiffers` variants.
- COPY-02: hit chance shows the clamp when it applies (`→ 20 faces, kept to 19 …`, `→ −4 faces, raised to 1 …`). Expected per round shows the rule, then values, then the card's `perRoundText`. Where the closed form is not exact, it shows the "Not exact here … the same as the Expected per round card." note instead of line 2.
- D-04 holds by construction and by check: every printed result is `hitPct`, `perRoundText`, `marg.hitRound` or `marg.dmgRound`.

## Branch counts (check-engine, all 70,980 settings, equal to RESEARCH)

| Check | Counts |
|-------|--------|
| (s) per round | rule 60,740 · table 10,240 |
| (t) +1 lines | rule/rule 36,850 · reason (cap/floor/nodmg) 28,100 · table/table 5,950 · mixed (hit table, dmg rule) 80 · other 0 |
| (z) two-roll | normal thresholds 3..19 all seen (17 values); 'an' exactly for 8, 11, 18 |
| (r) hit chance | 0 failures; clamp wording iff raw faces leave 1..19 |

Pins: AC 15 / d8 / +5 / −3 gives `Here 0.425 > 0.095 per round, so +1 to damage wins.`, and AC 15 / d8 / −5 / −2 gives `Here 0.130 > 0.050 per round, so +1 to hit wins.`

## UI-SPEC deviations (both verified on the full domain)

1. **Which wins, mixed case.** The inequality form is used only when both +1 lines are rule branch. At the 80 nat-20-only settings with D = −2 (for example AC 15 / d8 / −5 / −2), `+1 to hit` is table branch (0.130, exact 2.625 / 20) while `+1 to damage` is rule branch (1/20 = 0.050). The UI-SPEC's inequality would print `2.5`, which is not the real value. The page compares the displayed values instead. Evidence: check-engine (t) mixed count 80, pin above, smoke `formula ui: mixed case verdict`, and the mixed screenshot.
2. **Article rule.** Thresholds 8, 11 and 18 read `an 8 / an 11 / an 18 or higher`. The UI-SPEC shows only `a 10`. Evidence: check-engine (z) full-string equality over every setting, with every normal threshold 3..19 seen.

## Self-test budget

- Node self-test (three check-engine runs): **198.3 ms, 189.4 ms, 190.1 ms**, median 190.1 ms, under the 200 ms budget. RED run: 201.2 ms (warning only). The Pitfall 4 lever (thinning the Phase 1 coarse grid) was **not** used.
- Chrome: within 200 ms on every check-page run (35 to 64 ms observed).

## Verification

- `node tools/check-engine.mjs`: `CHECK-ENGINE PASS: selftest 249/249, sweep 70980 combos`.
- `node tools/check-page.mjs --width 1366`, `--width 390`, `--plain`, `--fault render`: all `CHECK-PAGE PASS`.
- `--expect` run (`11/20 = 55%`, `0.05 × 9.0 = 2.700`, `= (4.5 + 0) / 20 = 0.225`, `Here 4.5 < 20 × 0.55 = 11.0, so +1 to damage wins.`, `a 10 or higher hits`, `160 cells`, `How these numbers are worked out`): `CHECK-PAGE PASS`. The slice-A `--plain` run also matched the lede sentence.
- Grep gates: `function formulaView` 1, `function twoRollsText` 1, `:not(.marginal):not(.formulas)` 1, `container: formula / inline-size` 2, `id="two-rolls"` 1, `id="f-round-note"` 1, `id="f-plus-win-live"` 1, `class="formulas f-marg"` 1, non-comment `.innerHTML` 5.

## Screenshot observations

Method: scratch copies of index.html that set state after `#app` and hide header, controls, #compare, #chart, #sim and the footer, plus a 360 px iframe wrapper. Headless Chrome with `preferredColorScheme` 1 (light) / 0 (dark). A fixed badge printed `scrollWidth / clientWidth`. All scratch files were deleted.

| State | Width / theme | Observed |
|-------|---------------|----------|
| Defaults | 1366 light, dark | Every `=` in the formulas card starts at the same x (the 12rem name column), and the same holds in the marginal card. The six stat cards keep their subgrid rows. Live lines match the UI-SPEC strings. The two-roll paragraph sits between the heading and the legend. sw = cw. |
| Defaults | 360 light | Each name sits above its lines. Rule lines wrap only between terms, with the hanging indent (`= (21 − (AC − attack bonus)) / 20, kept` / `between 1 and 19 faces`). `= 0.50 × (4.5 + 0) + 0.05 × (2 × 4.5 + 0)` fits on one line. sw 360 = cw 360. |
| Floor bites (AC 15 / d8 / +5 / −3) | 1366 dark, 360 dark | Line 2 is replaced by the note `Not exact here: at a damage bonus of −3 … The table gives 1.240 per round, …`. The +1 lines are table branch (`= 0.095, from the table …`, `= 0.425, from the table …`), and the verdict is `Here 0.425 > 0.095 per round, so +1 to damage wins.` The two-roll paragraph uses the "close to" sentence. Legible in dark. No horizontal scroll. |
| Cap (AC 15 / d8 / +14 / +0) | 1366 light | `= (21 − (15 − 14)) / 20 → 20 faces, kept to 19 (a natural 1 always misses) = 19/20 = 95%`, wrapped once at a word boundary with the indent. `= 0: you already hit on 2+ (the 95% cap)`. `Here +1 to hit adds nothing, so +1 to damage wins.` The two-roll sentence uses the cap wording. |
| Mixed (AC 15 / d8 / −5 / −2) | 1366 light | `(15 − (−5))` is parenthesized, and the raw faces are 1, so no clamp is shown. The per-round rule branch gives `= 0.00 × 2.5 + 0.05 × 7.0 = 0.350`. +1 to hit is table (`0.130`), +1 to damage is rule (`= 1/20 = 0.050`), and the verdict is `Here 0.130 > 0.050 per round, so +1 to hit wins.` |

Full-height 360 px frames (3800 px) were too downscaled to read, so the 360 checks used 1500 px top crops that cover the stat cards and both formula cards.

## Task Commits

1. **Task 1: failing checks (RED):** `3324f2f` (test)
2. **Task 2: slice A, two-roll paragraph plus hit and per-round formulas:** `eb8a1b7` (feat)
3. **Task 3: slice B, +1 lines and Which wins:** `521d286` (feat)

## Files Created/Modified

- `index.html`: `statsView.exact`, `NB` / `TIMES` / `seg` / `PLUS_HIT_ZERO` helpers, `twoRollsText`, `formulaView`, computeView `formulas` / `twoRolls`, exports; lede sentence, `#formulas` card, `.f-marg` list, `#two-rolls`; formula CSS (named `formula` container, hanging indents, `.nw`, `.f-marg`); `setSeg`, `renderFormulas`, `renderTwoRolls` and the element cache; self-test section `copy`; smoke block `formula ui`.
- `tools/check-engine.mjs`: `checkCopy` with (r)(s)(t)(z), branch-count and threshold asserts, two Which-wins pins, counts on the report lines, header comment.

## Decisions Made

See key-decisions in the frontmatter. The two UI-SPEC deviations are above.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ` ` escapes did not survive the tooling**
- **Found during:** Task 2
- **Issue:** The Edit tool wrote `' '` as a raw NBSP byte (invisible in regexes and constants). A Git Bash `sed` fix then dropped the backslash, leaving `'00a0'`.
- **Fix:** Every NBSP is now `String.fromCharCode(0xa0)`, and the normalizers use `replaceAll`. `git diff` confirmed that only the five intended lines changed. No raw NBSP bytes remain in either file.
- **Files modified:** index.html, tools/check-engine.mjs
- **Commit:** eb8a1b7

**2. [Judgment] (r) wording check for clamped lines**
- The plan's `(r)` says the hit pre contains `/ 20 = ${hitFaces}/20 = `. In the clamped variants the UI-SPEC puts the clamp text between `/ 20` and `= 19/20 =`. So (r) asserts: pre starts with `= (21 − (AC − atk)) / 20`, pre ends with `= ${hitFaces}/20 = `, the unclamped pre equals exactly `… / 20 = F/20 = `, and clamped pres carry `→ {F} faces`.

**3. [Judgment] Smoke reset and scroll check**
- The `formula ui` block ends with `show({})`, and the existing final `Object.assign(state, VM.DEFAULT_STATE); renderControls(); render();` directly follows it, so no duplicate reset was added. The no-scroll check runs at whatever width check-page uses (both 1366 and 390 pass).

**4. [Judgment] Prose bold verdict and NBSP scope**
- `.f-live b:not(.num)` sets the verdict in the prose face (UI-SPEC "prose bold"). Clamp parentheticals keep ordinary spaces (see key-decisions).

## Known Stubs

None. Task 2's empty +1 segments were replaced in Task 3.

## Issues Encountered

- The Node self-test sits at about 190 ms of 200. Plans 04-03 and 04-04 still add pins. The Pitfall 4 lever remains available and unused.

## User Setup Required

None. No push, gh or Pages work (publishing is plan 04-05).

## Next Phase Readiness

- 04-03 can reuse the `.explain` class for the chart paragraphs, and `PAINTED_SECTIONS` / `--fault render` as in 04-01.
- 04-04's accessibility guards can check the new `dl` / `dt` / `dd` structure. The formulas are not live regions (UI-SPEC).

## Self-Check: PASSED

- Files: index.html, tools/check-engine.mjs, 04-02-SUMMARY.md present.
- Commits: 3324f2f, eb8a1b7, 521d286 in the log.
- TDD gates: `test(04-02)` 3324f2f (RED: check-engine failed only on (r)(s)(t)(z) and the three `copy:` pins; check-page failed only on `copy:` / `formula ui:`), then `feat(04-02)` eb8a1b7 (only (t) and the +1 pin/smoke still failing, as planned), then `feat(04-02)` 521d286 (everything passes).
