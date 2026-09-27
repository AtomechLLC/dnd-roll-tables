---
phase: 04-designer-explanation-final-ship
plan: 03
subsystem: ui, view-model, dev-tools
tags: [chart-explanation, crossover-copy, plateau-copy, presets, try-this, view-model, copy-03, copy-04, copy-05]

# Dependency graph
requires:
  - phase: 04-designer-explanation-final-ship
    provides: "04-01 PAINTED_SECTIONS, --fault render (already checks explore and .btn-preset), visible-text --expect; 04-02 statsView.exact (normalNum / normalDen), .explain class, the String.fromCharCode(0xa0) NBSP convention"
provides:
  - "VM.explainChart(p, series, hits) -> { dmgLine, hitLine, crossLine }, called inside chartBase (explain in the chartMemo entry)"
  - "VM.PRESETS (frozen: key, title, button, desc, setsText, sets { ac, die, atk, dmg, n }) and VM.presetStatus(sets)"
  - "Markup: div.chart-explain with #explain-dmg / #explain-hit / #explain-cross; section#explore (last in main) with three .btn-preset[data-preset], #ex-{key}-d / #ex-{key}-s, #explore-status (role=status, visible), jump links a[href=#chart] / a[href=#controls]"
  - "App: renderExplain, lastPreset event record, PRESET_KEYS, applyPreset, onPresetClick, presets enabled with Roll, 'explore' in PAINTED_SECTIONS"
  - "check-engine (u)(v)(w) exhaustive with pinned state counts, (x) preset claims + markup parity; self-test section 'explain' (2 pins); runUiSmoke 'explore ui' block; check-page (7) covers the presets"
affects: [04-04 accessibility guards and pre-ship gate, 04-05 publish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Chart copy is built from the exact objects that draw the chart (series, crossings, bands) inside the memoized chartBase, so text and rings can never disagree and an N drag recomputes nothing"
    - "Preset data lives once in VM; the static markup is checked against it character for character by check-engine (x)"
    - "An event record outside state (lastPreset) plus render-only-clears keeps a status line honest by comparison"

key-files:
  created:
    - .planning/phases/04-designer-explanation-final-ship/04-03-SUMMARY.md
  modified:
    - index.html
    - tools/check-engine.mjs
    - tools/check-page.mjs

key-decisions:
  - "Three presets (cross / dmg / cap), each also setting N (6 / 5 / 15), so the marker and the compare tables sit exactly where the description points (UI-SPEC A6, A7)"
  - "A preset click neither scrolls nor moves focus; static 'Go to the chart' / 'Go to the controls' links instead (UI-SPEC A8)"
  - "The chart explanation is three bold-lead-in paragraphs (dashed / solid / crossover) after the unchanged Phase 2 caption (UI-SPEC A9, A10)"
  - "Bent dashed-line sentence with exactly 1 expected hit reads ': one for the 1 hit you expect in 20 rounds.' (UI-SPEC gives only the plural)"
  - "The solid-line math group 'd8 + 0 = 4.5' uses U+00A0 like the formula cards, so it never wraps mid-expression (found in the 360 px screenshot)"

patterns-established:
  - "Grep gates count markup only: smoke selectors avoid the literal attribute forms (data-key=, data-preset=) that the gates count"

requirements-completed: [COPY-03, COPY-04, COPY-05]

# Metrics
duration: 13min
completed: 2026-09-27
---

# Phase 4 Plan 03: Chart Explanations and Try This Summary

**The chart now explains itself. Under the sweep chart, three bold-lead-in paragraphs say why the dashed line is straight, where the solid line flattens (named after the on-chart bands), and what moves the crossover. All three are built from the same crossings and bands that draw the rings. A new "Try this" section at the end of the page has three one-click presets that go through `VM.parseControl` and a single `setState`, and every claim in their descriptions is re-derived from the engine by check-engine (x).**

## Performance

- **Duration:** about 13 min
- **Started:** 2026-09-27T06:48:56Z
- **Completed:** 2026-09-27T07:02Z
- **Tasks:** 3 (RED, slice A, slice B)
- **Files modified:** 3

## Accomplishments

- COPY-03 / D-05: `#explain-cross` has distinct wording for no crossing (separate damage-first and attack-first versions), one adjacent crossing (`the lead changes once, at +6: the ring on the chart`), one crossing across a tie, an end tie only, a touch, two crossings, k >= 3, and identical curves. The printed N always equals the ring label's N.
- COPY-04 / D-06: `#explain-dmg` explains the straight line, or says from which +N it becomes straight when damage stops at 0. `#explain-hit` explains the step (rule average, the floored normal average, or 0 for nodmg), then adds a sentence for each drawn band, floor first, using the on-chart names “only a nat 20 hits” and “95% cap”.
- COPY-05 / D-07 / D-08: `Try AC 25 with a d12`, `Try AC 15 with a d8` and `Try AC 15 with a d12` each set all five controls in one frame. A rolled run turns stale. `#explore-status` announces `Set to AC 25, d12, +0 to hit, +0 damage, compare at +6. Everything above has updated.` and is cleared silently once any control moves.
- D-09 groundwork: the presets ship disabled and are enabled together with Roll as the last step of the guarded first render. `--fault render` shows them disabled (3) and `#explore` hidden.

## State counts (check-engine, all 70,980 settings, equal to RESEARCH)

| Check | Counts |
|-------|--------|
| (u) dashed line, straightFrom k | k = 0: 60,740 · k = 1: 2,730 · k = 2: 2,730 · k = 3: 2,730 · k = 4: 2,050 · above 4: 0 |
| (v) solid-line step variant | nodmg 1,092 · rule 60,060 · floor bites 9,828 |
| (w) crossover variant | none-damage 30,095 · none-attack 14,677 · one adjacent 25,318 · one across a tie 874 · end tie only 16 · touch 0 · two+ 0 · identical 0 |

(u)(v)(w) compare the full generated string against an independent rebuild from p, the loop's series, crossings and bands, after NBSP normalization. (v) also checks that every attack step outside the bands equals normalNum × die. (w) also checks that each sampled drawn ring's N appears as `at {N}` in the text.

## (x) Preset facts as asserted

| Preset | Claims checked against the engine at the exact settings |
|--------|----------------------------------------------------------|
| `cross` 25 / d12 / +0 / +0, N 6 (9 claims) | hitFaces 1; bands `{floor:[0,5], cap:null}`; attack steps 0.0 below +5, then 6.5; damage steps 1.0; one crossing, flipN 6, to attack; ring label `flips at +6`; caption contains `+N to damage leads from +1 to +5, then +N to hit leads from +6 to +20. The curves cross once.`; readout[6] = `At +6: to hit 19.5 · to damage 19.0 · to hit ahead by 0.5`; crossover text contains `the lead changes once, at +6` |
| `dmg` 15 / d8 / +0 / +0, N 5 (8 claims) | hitFaces 6; damage steps 6.0; attack steps 4.5 below +13, then 0.0; bands `{floor:null, cap:[13,20]}`; no crossing, no tie, no end tie, damage first; no ring; caption contains `+N to damage leads at every N from +1 to +20. The curves never cross.`; readout[5] ends `to damage ahead by 7.5` |
| `cap` 15 / d12 / +0 / +0, N 15 (8 claims) | hitFaces 6; attack steps 6.5 below +13, then 0.0; damage steps 6.0; bands `{floor:null, cap:[13,20]}`; one crossing, flipN 15, to damage; ring label `flips at +15`; caption contains `+N to hit leads from +1 to +14, then +N to damage leads from +15 to +20. The curves cross once.`; readout[15] ends `to damage ahead by 5.5` |

Also checked for every preset: title, button, desc and setsText equal the UI-SPEC strings exactly. `VM.parseControl(k, sets[k], DEFAULT_STATE[k]) === sets[k]` for all five keys. PRESETS and every entry and `sets` are frozen. The markup's `h3.explore-title`, `#ex-{key}-d`, `#ex-{key}-s` and button text equal VM.PRESETS. Each button has `aria-describedby="ex-{key}-d ex-{key}-s"`, ships `disabled`, and has no `data-key` or `onclick`. `VM.presetStatus(cross.sets)` equals the UI-SPEC status sentence.

## Self-test budget

- Node self-test through check-engine (three runs after slice B): **200.6 ms, 190.0 ms, 191.7 ms**, median **191.7 ms**, under 200. One more run after the final NBSP tweak: 187.8 ms. The run that went over only printed the existing warning, which is not a failure.
- Standalone Node runs after slice A: 190.2 to 197.5 ms.
- Chrome: 36.8 to 67.8 ms across all check-page runs.
- The Pitfall 4 lever (thinning the Phase 1 coarse grid) was **not** used. Only two O(1) pins were added (251 checks, up from 249).

## Verification

- `node tools/check-engine.mjs`: `CHECK-ENGINE PASS: selftest 251/251, sweep 70980 combos`, with (u), (v), (w) and (x) ok.
- `node tools/check-page.mjs --width 1366`, `--width 390`, `--plain`, `--fault render`: all `CHECK-PAGE PASS`. The fault run reports `every .btn-preset disabled (3)` and `section#explore hidden`.
- `--expect` run (`Try AC 25 with a d12`, `Try AC 15 with a d8`, `Try AC 15 with a d12`, `Sets: AC 25, d12, +0 to hit, +0 damage, compare at +6`, `Go to the chart`, `Go to the controls`, `every step adds the same 11.0`, `the band marked “95% cap”, from +8`, `the curves never cross, so there is no ring on the chart`, `11/20 = 55%`, `d8 + 0 = 4.5`): `CHECK-PAGE PASS`.
- Negative run: `--expect "Set to AC 25"` exits 1. The smoke's preset status does not leak into the DOM dump (RESEARCH Pitfall 5).
- Grep gates: `function explainChart` 1, `class="chart-explain"` 1, `data-preset=` 3, `data-key=` 14 (unchanged), `VM.parseControl(k, pr.sets[k], state[k])` 1, `role="status"` 2 (up from 1), `onclick=` 0, non-comment `.innerHTML` 5, `section('explain'` 1, `(x) COPY-05` 1 in check-engine.
- Smoke (`explore ui`, all pass in Chrome): three enabled presets; `#explore` is last and follows `#sim`; `#explain-cross` equals the VM line; a real click sets `25 12 0 0 6`, draws exactly one ring, puts `at +6` in the crossover text, stales a rolled run and keeps `lastPreset.n === 6`; `send(acRange, '24')` clears `lastPreset` and `#explore-status`. The page-order check is now `sim ui: section sits between the chart and Try this` (`chart < sim < explore`).

## Screenshot observations

Method: a scratch copy of index.html with an appended script. The script clicks the preset through the real button, hides every other section, and prints a `scrollWidth / clientWidth` + status badge. 360 px shots went through an iframe wrapper. Themes were set with headless Chrome `--blink-settings=preferredColorScheme` (1 light, 0 dark). All scratch files were deleted afterwards, and `git status` lists no PNG or scratch file.

| State | Width / theme | Observed |
|-------|---------------|----------|
| Defaults, `#explore` | 360 light | The three cards stack at 328 px. Each button label fits on one line. The empty status line keeps its height above the jump links. sw 360 = cw 360. |
| Defaults, `#chart` | 360 light | The three paragraphs sit under the caption with bold lead-ins. Before the NBSP fix, `d8 + 0 =` / `4.5` wrapped mid-expression; that was fixed and re-checked. No horizontal scroll. |
| `cross` clicked, `#chart` | 1366 light, 360 dark | The "only a nat 20 hits" band covers +0 to +5. One ring, `flips at +6`, with the marker at +6. The readout says `to hit ahead by 0.5`. The text reads `You expect 1 hit in 20 rounds … 1.0`, `d12 + 0 = 6.5`, `up to +5 … until +6` and `the lead changes once, at +6`. The status line is present. At 360 dark, sw = cw, and `d12 + 0 = 6.5` stays together. |
| `dmg` clicked, `#chart` | 1366 light | No ring, and the dashed line stays on top. The cap band starts at +13. The readout says `to damage ahead by 7.5`. The text reads `6 hits … 6.0`, `d8 + 0 = 4.5` and `from +13`. |
| `cap` clicked, `#chart` | 1366 light, 360 dark | The cap band starts at +13. One ring, `flips at +15`, with the marker at +15. The readout says `to damage ahead by 5.5`. The text reads `6.5` vs `6.0` and `the lead changes once, at +15`. At 360 dark, sw = cw. |
| `cap` clicked, `#explore` | 1366 dark | Three cards across. The subgrid lines up titles, descriptions, `Sets:` lines and buttons. The buttons use the paper fill with an ink-muted outline (not the accent). The status line reads `Set to AC 15, d12, +0 to hit, +0 damage, compare at +15. Everything above has updated.` The links are underlined in ink. |

The full two-theme screenshot matrix is plan 04-04's gate.

## Task Commits

1. **Task 1: failing checks (RED):** `da153fd` (test)
2. **Task 2: slice A, chart explanations:** `ba3c698` (feat)
3. **Task 3: slice B, Try this presets:** `d59497f` (feat)

## Files Created/Modified

- `index.html`: `VM.explainChart` (after captionBands), `explain` in chartBase's return, `VM.PRESETS` / `VM.presetStatus` and exports. Markup: `.chart-explain` and `section#explore`. CSS: `.chart-explain`, `.explore-*`, `.btn-preset` states, `.explore-status`, `.explore-jump`, links. Element cache, `renderExplain`, `lastPreset` / `PRESET_KEYS`, the render() clear, `applyPreset` / `onPresetClick`, init wiring and enable, `PAINTED_SECTIONS`. Self-test section `explain`; smoke block `explore ui`; the renamed page-order check.
- `tools/check-engine.mjs`: `checkExplain` with (u)(v)(w) and state-count tallies, (x) preset claims and markup parity, report lines, header comment.
- `tools/check-page.mjs`: check (7) is now `Roll and preset buttons enabled after init` on the mini tree.

## Decisions Made

See key-decisions in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The solid-line math group wrapped mid-expression at 360 px**
- **Found during:** Task 3, the 360 px `.chart-explain` screenshot
- **Issue:** `worth an average d8 + 0 =` / `4.5` broke across lines. The formula cards already avoid this with U+00A0 (04-02).
- **Fix:** `d{X}{NB}{±}{NB}{|D|}{NB}={NB}{avg}` using the existing `NB` constant. Every check normalizes U+00A0, so no expectation changed, and `--expect "d8 + 0 = 4.5"` passes.
- **Files modified:** index.html
- **Commit:** d59497f

**2. [Rule 3 - Blocking] The smoke's own selectors broke the markup grep gates**
- **Found during:** Task 3, acceptance greps
- **Issue:** The plan's smoke line `document.querySelector('button[data-preset="cross"]')` made `data-preset=` count 4 (the gate expects 3). The die check's `input[data-key="die"]:checked` made `data-key=` count 15 (the gate expects 14, unchanged).
- **Fix:** The smoke clicks `btns.find((b) => b.dataset.preset === 'cross')`, which is still the real button and the real delegated handler, and reads `#controls input[name="die"]:checked`. The gates now count markup only.
- **Files modified:** index.html
- **Commit:** d59497f

### Judgment calls

**3. Singular bent dashed-line sentence.** With 1 expected hit and straightFrom > 0, the sentence ends `: one for the 1 hit you expect in 20 rounds.` (the plan's gap fill; the UI-SPEC has only the plural).

**4. Stronger engine checks than the plan's minimum.** (u)(v)(w) assert full-string equality against an independent rebuild, not only the listed booleans (those are asserted too). (w) also compares each sampled drawn ring's N with the text. (x) also checks deep freezing, `aria-describedby`, `disabled` in the markup, and the absence of `data-key` / `onclick` on the buttons.

**5. `setsText` is derived in VM** from `settingsText(sets)` + `compare at {signed n}`, not typed by hand. check-engine (x) compares it with the literal UI-SPEC strings, so drift still fails.

**6. Smoke `finally` looks up `#explore-status` by id with a null guard**, rather than using `exploreStatusEl`. The behavior is the same. It kept the RED run free of a ReferenceError in the rAF (no `Uncaught` noise), and it is still registered after the click (Pitfall 5).

**7. check-page (7) uses the mini tree** (`byId`, `walk`, `classes`) instead of the old regex, matching the 04-01 guard style.

**8. The `(x) COPY-05` comment in check-engine was reworded** so the acceptance grep counts only the report key (1).

## Known Stubs

None. The `<span></span>` slots in `.chart-explain` and the empty `#explore-status` are filled by the renderers / the click handler by design.

## Threat Flags

None. The page's first links are in-page fragments (`#chart`, `#controls`), which need no CSP source. Preset data enters state only through `VM.parseControl` (T-04-08). All new text is written with textContent (T-04-09).

## Issues Encountered

- The Node self-test is still at the edge: one of three runs reached 200.6 ms (warning only), and the median is 191.7 ms. Plan 04-04 adds guards mostly in check-page and the smoke (browser-only). If it adds Node pins and the median crosses 200 ms, the Pitfall 4 lever is still available.

## User Setup Required

None. No push, gh or Pages work (publishing is plan 04-05).

## Next Phase Readiness

- 04-04's guard (11) expected order can now use the real controls: `ac-range, ac-num, die, atk-num, dmg-num, n-range, roll, cross, dmg, cap, #chart, #controls`. `#explore-status` is the new live region. The jump links are the page's only `<a>` elements.
- 04-04's manual gate: take the full two-theme matrix after clicking each preset (this plan took 1366 light and 360 dark per preset, plus 1366 dark and 360 light of `#explore`).

## TDD Gate Compliance

- RED: `test(04-03)` da153fd. check-engine failed only on (u)(v)(w)(x) and the two `explain:` pins. check-page failed only on the `explain:` / `explore ui:` / renamed page-order self-test checks and `Roll and preset buttons enabled after init`, plus the derived console / panel / budget-line failures.
- GREEN: `feat(04-03)` ba3c698 (only (x) and the preset check still failing, as planned), then `feat(04-03)` d59497f (everything passes).

## Self-Check: PASSED

- Files: index.html, tools/check-engine.mjs, tools/check-page.mjs, 04-03-SUMMARY.md all present.
- Commits: da153fd, ba3c698, d59497f, 9f2bcdc all in the log.
