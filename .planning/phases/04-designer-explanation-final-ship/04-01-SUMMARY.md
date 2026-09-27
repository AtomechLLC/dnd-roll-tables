---
phase: 04-designer-explanation-final-ship
plan: 01
subsystem: ui, dev-tools
tags: [review-fixes, honest-tools, visible-text, guarded-init, wr-01, wr-02, wr-03, wr-04, vanilla-js]

# Dependency graph
requires:
  - phase: 02-bonus-comparison
    provides: "chartBase readout, DiceMath.crossings, 02-REVIEW WR-01..03 and IN-02..05"
  - phase: 03-roll-20-rounds-simulation
    provides: "simExact spread wording, renderSim, guarded init, 03-REVIEW WR-01..04 and IN-01..05, the deferred legend item"
provides:
  - "check-page: parseTree mini element tree, visibleText, norm, byId / walk helpers; --expect matches visible text only"
  - "check-page: URL-param test mode (searchParams), Chrome self-test budget gate (<= 200 ms), --fault render mode"
  - "check-engine: domain from VM.CONTROL_SPEC, SAMPLE = 53 with 21/5/26/26 coverage asserts, exhaustive (p), (y) readout invariant, zero-count asserts, exactly one Math.random in onRoll, Node budget warning"
  - "VM.readoutLines(attack, damage, den): exact-sign leader, 'less than 0.1' when displayed tenths tie"
  - "App: let broken latch, listeners wired after the guarded first render, PAINTED_SECTIONS hidden on failure"
affects: [04-02 formulas, 04-03 chart copy and explorations, 04-04 accessibility guards, 04-05 publish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dev-tool visible text comes from a mini element tree over the --dump-dom output, never from regex-over-markup"
    - "Fault injection into a temp copy of index.html proves failure paths end to end in headless Chrome"
    - "Readout leader words come from exact integer numerators; displayed tenths only size the gap"

key-files:
  created:
    - .planning/phases/04-designer-explanation-final-ship/04-01-SUMMARY.md
  modified:
    - tools/check-page.mjs
    - tools/check-engine.mjs
    - index.html
    - .planning/STATE.md

key-decisions:
  - "Compare-table deltas are unchanged (RESEARCH Open Question 2): they name no leader, so equal rounded totals are true; only the chart readout names a leader, and only it is fixed"
  - "check-page keeps aria-hidden='true' text in the visible text: it is shown on screen (the log's 'Rnd'); the 03-REVIEW WR-03 suggestion to drop it would contradict 'visible'"
  - "check-engine (p) bounds come from the page's own wording: 'About 2 runs in 3' in [0.60, 0.80), 'Most runs' >= 0.80"
  - "Skipped info items: 02 IN-01 (N-domain copy duplication) and 02 IN-06 (band label past the plot edge near +19, cosmetic)"

patterns-established:
  - "Every new failure path gets a --fault style end-to-end proof, not only a unit pin"
  - "Negative --expect runs (hidden-only strings must fail) guard the extractor against regressions"

requirements-completed: []

# Metrics
duration: 10min
completed: 2026-09-27
---

# Phase 4 Plan 01: Review Fixes and Honest Tools Summary

**Exact-sign chart readout, E - SD <= 0 floor wording, a `broken`-latched guarded init proved by `check-page --fault render`, visible-text-only `--expect` via a mini element tree, and an exhaustive (p) plus stride-53 check-engine.**

## Performance

- **Duration:** about 10 min
- **Started:** 2026-09-27T06:22:03Z
- **Completed:** 2026-09-27T06:32Z
- **Tasks:** 2 (TDD: RED commit, then GREEN commit)
- **Files modified:** 4

## Accomplishments

- The page no longer contradicts itself: at AC 17 / d12 / −5 / −4 the readout at +3 says `to hit ahead by less than 0.1`, where the ring says `flips at +3`, and AC 13 / d4 / −5 / −3 now uses the honest floor sentence.
- A failed first render leaves inert, bannered controls: no listeners, Roll disabled, the five painted sections hidden, no `Uncaught` after a synthetic input.
- The tools stop lying: `--expect` sees only visible text, and check-engine's sampled checks now reach every damage bonus.

## Review items closed

| Item | Fix | Proving check |
|------|-----|---------------|
| 02 WR-01 (view-model throw bypasses banner) | Closed with 03 WR-04: guarded init also hides `PAINTED_SECTIONS` under the banner | `check-page --fault render`: banner shown, #roll disabled, 5 sections hidden, `render failed` logged, no `Uncaught` |
| 02 WR-02 (readout "even" vs exact lead) | `VM.readoutLines`: leader from `Math.sign(attack[k] - damage[k])`, gap from displayed tenths, `less than 0.1` when they tie | check-engine (y) over all 70,980 settings × 21 N, plus the AC 17 d12 −5 −4 pin |
| 02 WR-03 (1-in-50 stride misses odd dmg) | `SAMPLE = 53` at every sampled site | check-engine `(cover)`: 21 AC, 5 dice, 26 atk, 26 dmg |
| 03 WR-01 (spread wording at E − SD = 0) | `lopsided = eT - sdT <= 0 \|\| hitFaces === 1` | check-engine (o) at `<= 0`, exhaustive (p) at [0.60, 0.80) / >= 0.80, self-test pin `sim: AC 13 −5 d4 −3 uses the floor wording` |
| 03 WR-02 (`?test` leaves hidden run text) | No-run branch clears note base, stale note, Now:, tally, log body/foot; drops the empty `class` attribute | `?test` and `--plain` dumps: `section#sim` byte-identical (2,584 chars each); `--expect "Now: expected"` fails |
| 03 WR-03 (`--expect` matches hidden text) | `parseTree` + `visibleText` + `norm` in check-page | `--expect "Now: expected"`, `"Settings changed. Roll again"`, `"RndRound"` all exit 1 |
| 03 WR-04 (listeners before guarded render) | `render()` first, then listeners and Roll click; `broken` latch in `scheduleRender` | `check-page --fault render` (failed before the fix with `Uncaught Error: injected render fault` and 5 visible sections) |
| Deferred legend crit-swatch shrink | `.legend-item > .swatch, .legend-item > .ramp { flex-shrink: 0; }` replaces `.swatch.roll { flex-shrink: 0; }` | 360px screenshots, light and dark: all 9 legend swatches measured 40.0px, visually confirmed |
| 02 IN-02 (URL test detection) | `new URL(url).searchParams` has / delete | Default, `--plain` and fault runs report the right mode |
| 02 IN-03 (hard-coded domain) | Loops, `MAXN`, `TOTAL_COMBOS` from `VM.CONTROL_SPEC`; `fail()` if a field is missing | `grep "\|\| 20"` = 0; sweep still 70,980 combos |
| 02 IN-04 (unreachable branches) | Zero-count asserts: touches, leading ties, 2+ crossings | check-engine `(zero)`: 0 / 0 / 0 |
| 02 IN-05 (secondary pointers) | `if (!e.isPrimary) return;` in `pointermove` | New smoke check `readout ui: a secondary pointer does not scrub` |
| 03 IN-01 (budget unenforced) | Chrome gate in check-page (fail > 200 ms); Node warning in check-engine | `self-test within 200 ms (Chrome)` ok at 37–89 ms |
| 03 IN-02 (at most one Math.random) | Exactly one, and it must sit in `const onRoll = () => handleRoll(Math.random);` | check-engine static gate |
| 03 IN-03 (rollDie / rounds guards) | `RangeError` for faces outside 1..sides; `TypeError` for non-integer or negative rounds | Existing stub-rng pins (0, 0.9999999, 1 − 2^−53) still pass |
| 03 IN-04 (orphaned comment) | "page view (D-08, D-16)" comment moved above `computeView` | Code read |
| 03 IN-05 (compare before writing) | Spread and place lines, log body/foot, Now:, tally written only when they differ | `#sim` dump identity |

**Skipped (recorded):** 02 IN-01 (N-domain copy duplicated in static labels) and 02 IN-06 (band label can pass the plot edge near +19; cosmetic).

## Evidence

- **(p) coverage (all 2,470 distributions, 70,980 settings):** "About 2 runs in 3" min **0.6034**, max **0.7882** (bounds [0.60, 0.80)); "Most runs" min **0.8140** (bound >= 0.80). Before the fix the max was 0.8692. The low-end margin is thin (0.0034 above 0.60). That is a real property of a ±1 SD band on a 0-floored integer lattice, not a fitted tolerance.
- **Node self-test timings (three check-engine runs):** 190.3 ms, 190.9 ms, **200.8 ms** (the last printed the new `WARNING`, not a failure). The RED run before any page change measured 198.3 ms, so the Node figure was already at the edge. Chrome: 37–89 ms across all check-page runs.
- **check-page:** `--width 1366`, `--width 390`, `--plain`, `--fault render` all `CHECK-PAGE PASS`.
- **Prior-phase regression list (RESEARCH Pitfall 9):** all 28 strings still match as visible text (plus `D&D 5e rules` for entity decoding). None was hidden-only, so nothing is dropped from future expect lists.
- **Negative runs:** `--expect "Now: expected"`, `"Settings changed. Roll again"`, `"RndRound"` each exit 1.
- **Counts:** non-comment `.innerHTML` stays 5; `Math.random` is 1; crossing distribution unchanged (damage-all 30,111, hit-all 14,677, hit-then-damage 11,830, damage-then-hit 14,362, tie crossings 874, end ties 16).

## Task Commits

1. **Task 1: failing checks (RED)**: `d30fd9f` (test)
2. **Task 2: page fixes (GREEN)**: `e8c01e5` (fix)

## Files Created/Modified

- `tools/check-page.mjs`: mini element tree, visible text, URL params, Chrome budget gate, `--fault render`.
- `tools/check-engine.mjs`: spec-driven domain, stride 53 with coverage asserts, exhaustive memoized (p), (y), zero counts, exact-one Math.random gate, Node budget warning.
- `index.html`: `VM.readoutLines`, `<= 0` spread rule, `broken` latch and init order, no-run reset, `isPrimary`, rollDie / simulate guards, legend flex-shrink, one self-test pin, one smoke check.
- `.planning/STATE.md`: Phase 03 spread decision text now says `E - SD <= 0`.

## Decisions Made

- Compare-table deltas stay as they are. They name no leader, so two equal rounded totals are a true statement. Only the readout names a leader, so only the readout changed.
- aria-hidden text is kept in check-page's visible text (see key-decisions).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The log clear cannot be gated on `shownRunId !== 0`**
- **Found during:** Task 2, step 6
- **Issue:** `resetSim()` sets `shownRunId = 0` before the next frame, so the plan's "clear the log body and foot only when `shownRunId !== 0`" would leave a stale 20-row log (and 101 row headers) after every reset.
- **Fix:** Compare by content instead: clear `tBodies[0]` / `tFoot` (and Now:, tally) only when they have children. That still meets 03 IN-05 (no needless writes).
- **Files modified:** index.html
- **Commit:** e8c01e5

**2. [Rule 1 - Bug] `classList.remove('is-stale')` left `class=""` on `section#sim`**
- **Found during:** Task 2, the WR-02 dump comparison
- **Issue:** After the `?test` smoke, `#sim` differed from the plain load only by an empty `class` attribute, so the subtrees were not byte-identical.
- **Fix:** In the no-run branch, remove the `class` attribute when the class list is empty.
- **Files modified:** index.html
- **Commit:** e8c01e5

**3. [Rule 1 - Bug] The UI smoke's synthetic pointer is not primary**
- **Found during:** Task 2, first check-page run after the `isPrimary` guard
- **Issue:** `new PointerEvent(...)` defaults `isPrimary` to false, so two existing readout smoke checks failed once the guard was added.
- **Fix:** The smoke now passes `isPrimary: true` for the scrub, and a new check sends a non-primary pointer and asserts that the readout does not move (positive proof for 02 IN-05).
- **Files modified:** index.html
- **Commit:** e8c01e5

**4. [Judgment] check-page tokenizer also skips `<!DOCTYPE ...>`, handles self-closing tags, and pads more block tags**
- The RESEARCH tokenizer would have read `<!DOCTYPE html>` as the text `!DOCTYPE html>`. The block set also includes thead, tbody, tfoot, figure, figcaption, nav, article and aside.

**5. [Judgment] (cover) and (zero) are report keys**
- Coverage and zero-count failures are reported as `(cover)` and `(zero)` lines, so the letters (r)-(x) stay free for plans 04-02..04-04. Touches are detected as "same leader on both sides of the tie" (02-REVIEW IN-04's definition), not only as ties that aren't crossing or end ties.

**6. [Judgment] Requirements not marked complete**
- The plan lists COPY-03 and DEPLOY-04, but it only supports them (honest readout, inert controls on failure). The crossover copy (04-03) and the accessibility guards (04-04) complete them, so `requirements.mark-complete` was not run.

## Issues Encountered

- **Node self-test budget at the edge:** one of three runs hit 200.8 ms (the warning is informational). Plans 04-02..04-04 add page pins. If the median crosses 200 ms, use RESEARCH Pitfall 4's lever: thin the Phase 1 coarse grid, which check-engine (a)-(f) already cover exhaustively. The Chrome gate (the enforced one) runs at 37–89 ms.

## Known Stubs

None.

## User Setup Required

None. No push, gh or Pages work (publishing is plan 04-05).

## Next Phase Readiness

- Plans 04-02..04-04 can prove copy with `--expect` (visible text only) and build guards (9)-(13) on `parseTree` / `walk` / `byId`.
- Plan 04-03 appends `'explore'` to `PAINTED_SECTIONS`, wires the preset click after `render()`, and enables `.btn-preset` next to `rollBtn.disabled = false`. `--fault render` already checks `explore` and `.btn-preset` when they exist.

## Self-Check: PASSED

- Files: tools/check-page.mjs, tools/check-engine.mjs, index.html, 04-01-SUMMARY.md all present.
- Commits: d30fd9f, e8c01e5, a5f85b7 all in the log.
- TDD gates: `test(04-01)` d30fd9f (RED: check-engine failed only on (o), (p), (y); `--fault render` failed), then `fix(04-01)` e8c01e5 (GREEN: everything passes).
