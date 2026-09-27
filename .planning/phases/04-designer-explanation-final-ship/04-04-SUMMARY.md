---
phase: 04-designer-explanation-final-ship
plan: 04
subsystem: dev-tools, ui, docs
tags: [accessibility, a11y-guards, keyboard, non-color-cues, pre-ship-gate, readme, deploy-04]

# Dependency graph
requires:
  - phase: 04-designer-explanation-final-ship
    provides: "04-01 parseTree / visibleText / walk / byId mini tree in check-page and --fault render; 04-02 formulas and #two-rolls; 04-03 chart explanations, Try this presets, jump links, check (7)"
provides:
  - "check-page a11y guards (9)-(13) on the mini tree (section#selftest removed), in ?test and --plain, skipped in --fault"
  - "check-page prints 'CHECK-PAGE FAIL: <name>' for every failed check"
  - "runUiSmoke 'a11y ui' block: 12 focus checks and 12 label-rendered checks in Tab order"
  - "README.md describing the finished page, URL still in its <owner> form"
affects: [04-05 publish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Structural a11y facts come from the dump (guards); focus and rendering come from the live DOM (smoke); each guard is proved on a deliberately broken scratch copy"
    - "CSS facts are read from the raw <style> text as innermost { } rules, so rules inside @media / @container are found too"

key-files:
  created:
    - .planning/phases/04-designer-explanation-final-ship/04-04-SUMMARY.md
  modified:
    - tools/check-page.mjs
    - index.html
    - README.md

key-decisions:
  - "Guard (9) uses the screen-reader name (.vh text counts, [hidden] and aria-hidden do not, ARIA precedence aria-labelledby > aria-label > label > button text); guard (10) then requires the shown text (no .vh) of that source to be non-empty, or an aria-label to contain the group's visible .group-label without its .hint"
  - "Guard (13) also fails if .series-hit becomes dashed, so the two lines stay different by more than color"
  - "Guard (12) is non-vacuous: it also requires 4 outcome tables, at least one td.m, and at least one auto-miss row per table"
  - "The runtime smoke focuses with preventScroll so the ?test page does not jump; the radio group's label for the smoke is its legend"
  - "No markup or CSS changed for accessibility: every guard passed on the existing page, as the UI-SPEC control audit predicted"

patterns-established:
  - "Every new guard gets a bite proof: a scratch copy with one breakage must exit 1 with that guard's line marked FAIL"

requirements-completed: [DEPLOY-04]

# Metrics
duration: 14min
completed: 2026-09-27
---

# Phase 4 Plan 04: Accessibility Guards and Pre-Ship Gate Summary

**check-page now fails the build if a control loses its label or visible label, if the Tab order drifts from ac-range … #controls, or if misses or the damage line lose their non-color cues. A `?test` smoke confirms in live Chrome that all 12 stops take focus and show a rendered label, and each of the five guards was shown to fail on a deliberately broken copy. The README now describes the finished page, the full suite passes over file:// and http://, and eight UI-SPEC states were checked in 37 screenshots at 1366 and 360 in both themes.**

## Performance

- **Duration:** about 14 min
- **Started:** 2026-09-27T07:03:40Z (after 04-03's final commit)
- **Completed:** 2026-09-27T07:17Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- DEPLOY-04 / D-09: every control (AC slider and box, the die radios, attack and damage boxes, N slider, Roll, three presets, two jump links) is native, labeled with visible text, and reachable by Tab in reading order. Misses are the text 0 plus the hatch, and the chart series are solid vs dashed.
- D-10: guards (9)-(13) run in check-page in both modes. Failure prints `FAIL a11y (n) …`, a detail line naming the offender, and `CHECK-PAGE FAIL: a11y (n) …`.
- Pre-ship gate: the README is final apart from the URL, every automated check is green, and every state is confirmed by screenshot. The page is ready for plan 04-05.

## Guard results on the page

| Guard | ?test (1366, 390) | --plain | Notes |
|-------|-------------------|---------|-------|
| a11y (9) every control has an accessible name | ok (14 controls) | ok | 14 = ac-range, ac-num, 5 radios, atk-num, dmg-num, n-range, roll, 3 presets |
| a11y (10) labels are visible | ok | ok | #ac-num aria-label "Target AC (exact value)" contains "Target AC" |
| a11y (11) tab order reaches every control | ok | ok | order equals `ac-range, ac-num, die, atk-num, dmg-num, n-range, roll, cross, dmg, cap, #chart, #controls` |
| a11y (12) miss is not color-only | ok (248 miss cells, 4 auto-miss rows) | ok | 72 + 72 + 32 + 72 td.m at the defaults |
| a11y (13) series are not color-only | ok | ok | `.series-dmg { … stroke-dasharray: 8 4; }` |

Runtime smoke (`?test`, Chrome): all 24 `a11y ui:` checks pass (`focus reaches <key>` and `label rendered for <key>` for all 12 keys). The self-test panel reads "Self-test passed".

## Guard bite proofs (scratch copies, deleted afterwards)

| Breakage | Exit | Failing lines |
|----------|------|---------------|
| `for="atk-num"` removed from its label | 1 | `FAIL a11y (9)` (`#atk-num (no name)`), `FAIL a11y (10)` (`#atk-num: no label`) |
| `aria-label="AC box"` on #ac-num | 1 | `FAIL a11y (10)` (`aria-label "AC box" lacks the visible label "Target AC"`) |
| `tabindex="2"` on #roll | 1 | `FAIL a11y (11)` (`#roll tabindex=2`) |
| `.m` hatch replaced by a flat background | 1 | `FAIL a11y (12)` (`the .m rule has no repeating-linear-gradient hatch`) |
| `stroke-dasharray` removed from `.series-dmg` | 1 | `FAIL a11y (13)` (`.series-dmg has no stroke-dasharray`) |
| Extra: `#roll { display: none; }` (runtime smoke only) | 1 | `SELFTEST FAIL: UI a11y ui: focus reaches roll` and `… label rendered for roll`, the panel shows FAILED |

Each run printed `CHECK-PAGE FAIL: a11y (n) …` for its guard.

## Full suite (Task 2)

| Command | Result |
|---------|--------|
| `node tools/check-engine.mjs` ×3 | `CHECK-ENGINE PASS: selftest 251/251, sweep 70980 combos` each; Node self-test **186.6, 187.9, 198.2 ms**, median **187.9 ms** (Pitfall 4 lever not used; nothing was added to the in-page self-test) |
| `node tools/check-page.mjs --width 1366` / `--width 390` / `--plain` / `--fault render` | `CHECK-PAGE PASS` each; Chrome self-test 36-45 ms |
| Phase 4 `--expect` list (13 strings: `How these numbers are worked out`, `11/20 = 55%`, `0.05 × 9.0 = 2.700`, `Here 4.5 < 20 × 0.55 = 11.0, so +1 to damage wins.`, `a 10 or higher hits`, `160 cells`, `every step adds the same 11.0`, `the band marked “95% cap”, from +8`, `the curves never cross, so there is no ring on the chart`, `Try AC 25 with a d12`, `Try AC 15 with a d8`, `Try AC 15 with a d12`, `Go to the chart`) | `CHECK-PAGE PASS` |
| Prior-phase regression list (28 strings from 04-01 plus `D&D 5e rules`; none hidden-only) | `CHECK-PAGE PASS` |
| Negative: `--expect "Now: expected"` | `CHECK-PAGE FAIL (1)` as intended |
| `python -m http.server 8000`, then `check-page "http://localhost:8000/index.html" --plain` and `"…/index.html?test"` | `CHECK-PAGE PASS` both, all five a11y guards ok; the server was stopped afterwards |
| README gates | `Phase 1 delivers` 0, `Try this` 1, `github.io/DnD-CombatRollSimulator` 1, `--fault render` 2, token pattern 0 matches |
| `git remote` | empty (nothing pushed, no gh used) |
| `grep -c 'tabindex="[1-9]' index.html` | 0 |

## Screenshot observations

Method: one scratch copy of index.html with an appended script. It read `?s=<state>&v=<view>` and set the state, either through `Object.assign(state, VM.DEFAULT_STATE, patch); renderControls(); render();` or, for the presets, a real click on the preset button. It then hid every section outside the view and printed a badge with the full-page `scrollWidth / clientWidth` measured before hiding. Shots used headless Chrome with `--blink-settings=preferredColorScheme=1` (light) / `0` (dark), and the 360 px shots used an iframe wrapper. That made 37 PNGs, all opened and checked, then deleted with the scratch copy.

**No horizontal scroll anywhere:** full-page sw = cw in all 37 (1329/1329 at 1366; 345/345 inside the 360 iframe, with the scrollbar taking the rest).

| State | Shots | Observed against the UI-SPEC States row |
|-------|-------|-------------------------------------------|
| (a) Defaults | top, tables, chart, explore at 1366 L+D; formulas, tables, chart, explore at 360 L+D | Every `=` starts at the same x in both formula cards (1366). `= (21 − (15 − 5)) / 20 = 11/20 = 55%`, `= 0.50 × 4.5 + 0.05 × 9.0 = 2.700`, `= (4.5 + 0) / 20 = 0.225`, `= 11/20 = 0.550`, `Here 4.5 < 20 × 0.55 = 11.0, so +1 to damage wins.` The two-roll paragraph reads `a 10 or higher hits … 160 cells`. The chart has no ring, and its text reads `every step adds the same 11.0`, `d8 + 0 = 4.5`, `the band marked “95% cap”, from +8`, `never cross, so there is no ring`. Presets enabled, status empty. At 360, `dt` sits above its lines, the rule lines wrap only between terms with a hanging indent, `d8 + 0 = 4.5` stays together, the preset cards stack to full width, and the legend swatches keep their 40 px box with only the text wrapping. The miss hatch and `0` are visible in both themes. |
| (b) Floor bites AC 15 / d8 / +5 / −3 | top 1366 L+D, chart 1366 L, formulas 360 L+D | Line 1 plus the `Not exact here: at a damage bonus of −3 … The table gives 1.240 per round…` note. `= 0.095, from the table …` / `= 0.425, from the table …` and `Here 0.425 > 0.095 per round, so +1 to damage wins.` Chart text: `From +2 on, every step adds the same 11.0` and `worth 1.88 on average here`. The 360 lines break between terms and the dark theme is legible. |
| (c) Cap AC 15 / d8 / +14 / +0 | top, chart 1366 L | `= (21 − (15 − 14)) / 20 → 20 faces, kept to 19 (a natural 1 always misses) = 19/20 = 95%` wraps once, at a word, with the indent. `= 0: you already hit on 2+ (the 95% cap)` and `Here +1 to hit adds nothing, so +1 to damage wins.` The band runs from +0 to +20 and the text says `It is flat across the whole chart`. (The two-roll cap sentence is not in these views; check-engine (z) checks it on every setting, and 04-02 screenshotted it.) |
| (d) No-damage d4 AC 15 / d4 / +5 / −4 | top, chart 1366 L | `= 0, from the table: at a damage bonus of −4, a normal d4 hit deals 0`. The solid-line text reads `stays flat even outside the shaded bands, and only crits deal damage here`, with no band sentence. The Phase 2 caption and band are unchanged. |
| (e) `applyPreset('cross')` (real click) | top, chart, explore 1366 L; chart, explore 1366 D, 360 L+D | Controls read 25 / d12 / 0 / 0, N +6. The "only a nat 20 hits" band covers +0 to +5, with one ring labeled `flips at +6` and the marker at +6. The readout says `to hit ahead by 0.5`. The text reads `the lead changes once, at +6: the ring on the chart`. The status line reads `Set to AC 25, d12, +0 to hit, +0 damage, compare at +6. Everything above has updated.` At 360 dark, the ring label clears the ring and `d12 + 0 = 6.5` stays together. |
| (f) `applyPreset('dmg')` | chart 1366 L | No ring, and the dashed line stays on top at every N. The cap band starts at +13. The readout says `to damage ahead by 7.5`. |
| (g) `applyPreset('cap')` | chart 1366 L | The cap band starts at +13, with one ring labeled `flips at +15` and the marker at +15. The readout says `to damage ahead by 5.5`, and the text says `the lead changes once, at +15`. |
| (h) Mixed AC 15 / d8 / −5 / −2 | top 1366 L | `(15 − (−5))` in parentheses, `= 1/20 = 5%`, `= 0.00 × 2.5 + 0.05 × 7.0 = 0.350`. `+1 to hit` is table branch (`0.130`), `+1 to damage` is `= 1/20 = 0.050`, and the verdict compares displayed values: `Here 0.130 > 0.050 per round, so +1 to hit wins.` |

No state failed its row, so index.html needed no fix from the screenshots.

## ROADMAP Phase 4 success criteria → proof

| SC | Proof |
|----|-------|
| 1 Two-roll structure, table as the joint outcome space | `#two-rolls` (04-02). check-engine (z): full-string equality on every setting, all thresholds 3..19, article rule. `--expect "a 10 or higher hits"`, `"160 cells"`. Screenshots (a) tables in both themes and at both widths. |
| 2 Live-substituted formulas | check-engine (r)(s)(t) over 70,980 settings, with branch counts pinned (rule 60,740 / table 10,240; 36,850 / 28,100 / 5,950 / 80). Self-test section `copy` (3 pins). Smoke `formula ui:` (mixed-case verdict, clamp shown, no horizontal scroll). `--expect "11/20 = 55%"`, `"0.05 × 9.0 = 2.700"`, `"Here 4.5 < 20 × 0.55 = 11.0, so +1 to damage wins."`, `"How these numbers are worked out"`. Screenshots (a) (b) (c) (d) (h). |
| 3 Crossover text matches the chart; plateau / linear point at the bands | check-engine (u)(v)(w) with state counts (w: none-damage 30,095, none-attack 14,677, one adjacent 25,318, across a tie 874, end tie 16) plus ring-N-in-text. Self-test `explain` (2 pins). Smoke `explore ui: crossover text equals the VM line`. `--expect "every step adds the same 11.0"`, `"the band marked “95% cap”, from +8"`, `"the curves never cross, so there is no ring on the chart"`. Screenshots (a) (c) (d) (e) (f) (g). |
| 4 Suggested explorations do what they say | check-engine (x): every claim re-derived at the preset settings, plus markup parity. Smoke `explore ui:` (real click sets `25 12 0 0 6`, one ring, `at +6`, stales a run, record cleared on change). check-page (7): presets enabled. `--expect "Try AC 25 with a d12"`, `"Try AC 15 with a d8"`, `"Try AC 15 with a d12"`, `"Go to the chart"`. Screenshots (e) (f) (g). |
| 5 (accessibility half) Keyboard reach, visible labels, miss vs hit without color | check-page guards a11y (9)-(13) in ?test, --plain and over http. Smoke `a11y ui:` 12 focus + 12 label checks. The six bite proofs above. Screenshots: hatch and `0` in both themes; dashed vs solid line in both themes. The live-URL half (HTTP 200, no console errors) is plan 04-05. |

## Decisions D-01..D-11 → where implemented and checked

| Decision | Implemented | Checked |
|----------|-------------|---------|
| D-01 copy woven next to what it explains | `#two-rolls` in #tables, `#formulas` + `.f-marg` in #stats, `.chart-explain` in #chart, `#explore` last (04-02, 04-03) | Smoke `explore ui: section is last in main…`, `sim ui: section sits between the chart and Try this`; screenshots |
| D-02 short designer voice | Copy in VM builders (`twoRollsText`, `formulaView`, `explainChart`, `PRESETS`) | UI-SPEC exact strings asserted by check-engine (x) and (u)(v)(w)(z) rebuilds |
| D-03 rule, substituted values, result | `formulaView` rule / live lines, clamp variants | check-engine (r)(s)(t); screenshots (a)(c)(h) |
| D-04 formula = card | Results are the card strings; exact integer branching | check-engine (s)(t) result equality, table-branch note; screenshots (b)(d) |
| D-05 crossover from `crossings` | `VM.explainChart` inside `chartBase` | check-engine (w) + ring N in text; smoke; screenshots (e)(g) |
| D-06 plateau / linear point at bands | `explainChart` band sentences only when a band is drawn | check-engine (u)(v); screenshots (a)(c)(d)(f) |
| D-07 one-click Try this presets | `section#explore`, `VM.PRESETS` (cross / dmg / cap) | check-engine (x); `--expect` preset buttons; screenshots |
| D-08 through `parseControl`, one setState, run goes stale | `applyPreset` | Smoke `explore ui:` (sets five controls, stale, record cleared) |
| D-09 DEPLOY-04 incl. presets and Roll | Native markup; presets enabled with Roll | Guards (9)-(11) cover roll and the presets; smoke `a11y ui:` |
| D-10 automated guards | tools/check-page.mjs (9)-(13) | Bite proofs (this plan) |
| D-11 review warnings fixed before public | 04-01 (02 WR-01..03, 03 WR-01..04, legend shrink) | 04-01 table: `--fault render`, check-engine (y)(p)(cover)(zero), negative `--expect` runs |

D-12..D-14 (publish, README URL, DEPLOY-02/03 re-verification) are plan 04-05.

## Requirements → proof

| Requirement | Proof |
|-------------|-------|
| COPY-01 | check-engine (z); `--expect "a 10 or higher hits"`, `"160 cells"`; screenshot (a) |
| COPY-02 | check-engine (r)(s)(t); self-test `copy`; smoke `formula ui`; screenshots (a)(b)(c)(d)(h) |
| COPY-03 | check-engine (w); smoke crossover equality; screenshots (a)(e)(f)(g) |
| COPY-04 | check-engine (u)(v); `--expect` band and straight-line strings; screenshots (a)(b)(c)(d) |
| COPY-05 | check-engine (x); smoke `explore ui`; check-page (7); screenshots (e)(f)(g) |
| DEPLOY-04 | Guards a11y (9)-(13) (both modes, file:// and http://); smoke `a11y ui` (24); six bite proofs; screenshots of the hatch and the dashed line in both themes. Marked complete by this plan. |

## Deviations collected from plans 04-01..04-03

- 04-01: the log clear is gated on content, not `shownRunId`; an empty `class=""` on `#sim` is removed; the smoke's synthetic pointer passes `isPrimary: true`, with a new non-primary check; the tokenizer skips doctype and pads more block tags; (cover) / (zero) are report keys; the requirements were not marked in 04-01.
- 04-02: Which wins uses displayed values in the 80 mixed settings (UI-SPEC deviation); `an 8 / an 11 / an 18`; NBSP is written as `String.fromCharCode(0xa0)` because the tooling mangled escapes; (r) wording for clamped lines; the smoke reset reuses the final reset.
- 04-03: the solid-line math group uses NBSP (found at 360 px); smoke selectors avoid the gated attribute literals; singular bent dashed-line sentence; stronger (u)(v)(w)(x); `setsText` derived in VM; check (7) on the mini tree.

## Deviations from Plan (this plan)

### Judgment calls (no bugs found; nothing in index.html markup or CSS needed fixing)

**1. Failure summary lines.** The UI-SPEC says each guard failure prints `CHECK-PAGE FAIL: a11y …`. check-page's line format was `FAIL <name>` plus `CHECK-PAGE FAIL (n)`, so it now also prints `CHECK-PAGE FAIL: <name>` for every failed check (not only a11y), just before the count line. Existing `CHECK-PAGE PASS` / `CHECK-PAGE FAIL (n)` lines are unchanged.

**2. Guard (9) vs (10) split.** (9) computes the name a screen reader gets: .vh text counts, [hidden] and aria-hidden do not, and ARIA precedence applies. (10) then requires the shown text of that same source. This keeps the two guards distinct: a label whose text is only `.vh` passes (9) and fails (10).

**3. Guards stricter than the minimum.** (12) also requires four outcome tables, at least one `td.m`, and at least one auto-miss row per table, so it cannot pass vacuously. (13) also fails if `.series-hit` gets a dasharray. (11) counts any `[tabindex >= 0]` element as focusable, so a stray focusable `div` would also show up as order drift.

**4. Smoke details.** `focus({ preventScroll: true })` keeps the `?test` page still. The radio group's label for the smoke is its legend (as planned). The finally block blurs the active element, and the existing final reset restores the defaults.

**5. Extra bite proof.** A sixth copy (`#roll { display: none; }`) shows that the runtime smoke catches what the dump cannot.

**6. Screenshot views.** Instead of full-page frames, each shot kept one view (top / formulas / tables / chart / explore), because full 360 px frames are unreadable after downscaling (04-02 experience). The horizontal-scroll badge was measured on the full page before hiding.

**7. Chrome 130+ scroller tab stop (Pitfall 7).** At 360 px the d8 outcome table fits its wrapper (see (a) tables 360), so there is no extra stop at the defaults. A d12 table or the sim log may overflow at phone width and become an extra Tab stop in a real browser. That is expected, and guard (11) compares controls only. Headless `--dump-dom` cannot tab, so this is left to the optional manual walk below.

## Optional manual check for the user

A real-keyboard walk in a desktop browser (about one minute):
1. Open `index.html` and press Tab repeatedly. Focus should visit: AC slider, AC box, die group (one stop), attack box, damage box, Compare +N slider, Roll 20 rounds, the three Try-this buttons, Go to the chart, Go to the controls.
2. Arrow keys move the sliders and change the die. Typing works in the number boxes. Space or Enter presses Roll and the preset buttons. Enter follows the jump links.
3. At phone width, an extra Tab stop on a table that scrolls sideways (for example with a d12) is expected browser behavior, not a bug.

## Task Commits

1. **Task 1: accessibility guards (9)-(13) and the runtime a11y smoke:** `9251e1f` (test)
2. **Task 2: README describes the finished page:** `724535e` (docs)

## Files Created/Modified

- `tools/check-page.mjs`: helpers (`ancestors`, `closest`, `textExcept`, `nameText`, `shownText`, `groupLabelText`, `inHiddenTree`, `nameSource`), `a11yGuards()` with (9)-(13), CSS rule reader (`cssRules`, `rulesFor`), the per-failure `CHECK-PAGE FAIL:` lines, and the header comment.
- `index.html`: `runUiSmoke` `a11y ui` block (after the explore block, before the final reset). No markup or CSS change.
- `README.md`: finished-page description, `<owner>` URL line, dev checks.

## Known Stubs

None. The README's `<owner>` URL placeholder is intentional (D-13); plan 04-05 replaces it after `gh api user`.

## Threat Flags

None. No new network, auth or file surface. README gates found no tokens, emails or personal paths (T-04-12). Scratch copies lived only in the session scratchpad and were deleted (T-04-14).

## TDD Gate Compliance

This task adds guards whose targets already existed, so the plan's RED step was the deliberate breakage on scratch copies (not committed): all five guards, plus the smoke, failed on their breakage before the guard commit. The committed gate is `test(04-04)` 9251e1f. No `feat` commit follows it, because no page behavior changed; the guards pass on the unchanged markup.

## Next Phase Readiness

- Plan 04-05 can publish: every check is green, `git remote` is empty, and the README carries `https://<owner>.github.io/DnD-CombatRollSimulator/` for the URL swap.
- The live checks for 04-05 can reuse `--expect "11/20 = 55%" --expect "Try AC 25 with a d12"`. The a11y guards run automatically on any URL, including the live one.

## Self-Check: PASSED

- Files: tools/check-page.mjs, index.html, README.md, 04-04-SUMMARY.md present.
- Commits: 9251e1f, 724535e, 72c5009 in the log.
