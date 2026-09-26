---
phase: 03-roll-20-rounds-simulation
plan: 02
subsystem: ui
tags: [simulation, per-round-log, staleness, tally, no-flicker, vanilla-js]

# Dependency graph
requires:
  - phase: 03-roll-20-rounds-simulation
    provides: "03-01 Sim { simulate, sameAttack, mulberry32 }, VM.settingsText / simExact, sim store (run, exact, tally), rollWith, resetSim, renderSim with the run-id cache, per-frame simCtx.stale, hidden #sim-note / #sim-now / #sim-tally / #sim-log slots"
provides:
  - "20-row per-round log (Round, d20, Result, Damage dice, Damage) with a Total row equal to the simulated figure"
  - "Rolled-at note (span.note-base + b.note-stale), stale dimming via #sim.is-stale, Now: line, stale caption suffix"
  - "Tally of the last 5 totals at the current settings (newest bold, expected appended)"
  - "'sim log ui' smoke block (59 checks) ending in a reset back to 80 row headers"
affects: [03-03 table marks and phase verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Rebuild on run id, toggle every frame: log rows, Total, figures and note base only when run.id changes; is-stale, hidden flags, Now:, tally and caption text per frame"
    - "setText / compare-before-replace so a frame that changes nothing touches no DOM"
    - "Log innerHTML carries only | 0 integers and words from a frozen lookup (LOG_RESULT_CELL)"
    - "Layout reservation (min-height) for text that appears on stale, so nothing jumps during a drag"

key-files:
  created:
    - .planning/phases/03-roll-20-rounds-simulation/03-02-SUMMARY.md
  modified:
    - index.html
    - tools/check-page.mjs

key-decisions:
  - "The rolled-at note reserves two lines wherever the result column is under 40rem, including the 32rem column beside the log, via @container sim (width < 40rem) or (width >= 54rem)"
  - "The log caption always reserves two lines, so stale never moves the log rows, and beside the result the log header lines up with the top of the figure pair"
  - "Stale dimming covers every log th/td (header, hit words, totals), while the caption keeps --ink because it carries the stale cue in words"
  - "Older tally totals are span.num at 400 weight (.sim-line span.num), so only the newest (b.num) is bold"

patterns-established:
  - "Stale state is pure CSS off one class toggle (#sim.is-stale); JS never restyles individual elements"
  - "UI smoke blocks that roll must end with resetSim() and a render so the DOM dump shows 80 row headers"

requirements-completed: [SIM-03, SIM-04]

# Metrics
duration: 9min
completed: 2026-09-26
---

# Phase 3 Plan 02: Per-Round Log and Staleness Summary

**A 20-row per-round log whose Total equals the simulated figure, plus a comparison-based stale state. When the attack changes, the run dims, names the settings it was rolled at, keeps its own `54.0 ± 14.2`, and shows a `Now: expected 49.5 ± 14.1 at AC 16, …` line. Nothing re-rolls or rebuilds during a drag. A 5-entry tally shows luck moving around the expected value.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-09-26T18:07:30Z
- **Completed:** 2026-09-26T18:16:40Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- After a roll, a real `<table>` log lists Round (`th scope="row"`), d20, Result, Dice, and Damage for all 20 rounds in one frame. A nat 1 reads `miss` with `—` and `0`. A crit shows both real dice (`8 + 3`, `6 + 8`, `8 + 2` for seed 6), and `Total 71` equals the figure.
- The run goes stale when the rolled-at attack differs from the current one, and the four keys are compared on every frame:
  - `#sim` gets `is-stale`, the note adds a bold "Settings changed. Roll again to compare.", and the log caption gets `(rolled at AC 15, d8, +5 to hit, +0 damage)`.
  - Figures, lines, and the log dim to `--ink-muted`, and card frames switch to `--line`. Opacity is never used.
  - A Now: line gives the current expected ± SD.
  - Returning to the rolled-at settings un-stales the run, and the N slider never stales it.
- No flicker: after the first frame of a run, later renders keep the same row nodes and the same button node, which the smoke checks by identity.
- The tally shows `Last 3 runs at these settings, newest first: 71 · 54 · 47 (expected 54.0)` with the newest total bold. It appears only with 2 or more fresh runs, hides while stale, and resets when you roll at different settings. It is capped at 5.
- The DOM still has exactly 80 row headers at load. The log adds 21 only after a roll, and the smoke resets back to 80.

## Task Commits

1. **Task 1: Failing smoke checks for the log, staleness, no-flicker, and the tally** - `ad8e23a` (test)
2. **Task 2: Per-round log, rolled-at note, stale dimming, Now: line, and tally** - `00b823f` (feat)

## Files Created/Modified
- `index.html`:
  - Markup: `#sim-note` now holds `span.note-base` and `b.note-stale[hidden]`.
  - CSS: `.sim-note`, `.sim-log`, and `#sim.is-stale` rules.
  - Script: `LOG_RESULT_CELL`, `logBodyHtml`, `setText`, and the extended `renderSim`. The element refs for the two note parts are added.
  - Smoke: the `sim log ui` block in `runUiSmoke`.
- `tools/check-page.mjs`: header item (3) now reads "80 row headers at load … the sim log adds 21 only after a roll". The check itself is unchanged (`=== 80`).

## Verification

- RED (Task 1): `check-page --width 1366` exited 1 with 34 failing checks, all named `sim log ui: …`. check-engine passed.
- GREEN (Task 2): `node tools/check-engine.mjs` gives `CHECK-ENGINE PASS: selftest 245/245`, and the Node self-test took 192.1 ms and then 186.3 ms. `check-page --width 1366`, `--width 390`, and `--plain` all give `CHECK-PAGE PASS`.
- Greps: the non-comment `.innerHTML =` count is 4, `classList.toggle('is-stale'` appears once, `colspan="4">Total` once, and `#sim.is-stale .fig-exact` once. `the sim log adds 21 only after a roll` appears once in check-page. Added `opacity` lines: 0. `Math.random`: 1. `'sim log ui: '` occurrences: 59.

## Screenshot Observations

The scratch copies of index.html in the session scratchpad call `rollWith(Sim.mulberry32(6)); render();` at the end of init's guarded try. The stale copy also calls `setState({ ac: 16 })`. Header and other sections are hidden. Shots were taken at 1366 and at 360 (iframe wrapper), in light and dark. All scratch files are deleted, and `git status` is clean.

| State | Observation | OK |
|-------|-------------|----|
| 1366 light, fresh (first shoot) | Note `Rolled at AC 15, d8, +5 to hit, +0 damage.` Log to the right with 20 rows. `crit` bold in accent brown, `miss` muted, `hit` in ink. `—` in the Dice column for misses. 2px ink rule above `Total 71`. | Yes |
| 1366 light, stale (first shoot) | Correct content, but the note wrapped to two lines in the 32rem column and the caption wrapped at 296px, so the pair and the log rows moved down about 20px on the first change. Fixed (Deviation 1). | Fixed |
| 1366 light, fresh and stale (re-shoot) | The pair (card tops) and the log header sit at the same y in both states, and the log header lines up with the pair. Stale: bold stale sentence, figures and log text muted but readable, exact top rule becomes the hairline, dashed sim frame lighter, `Now: expected 49.5 ± 14.1 at AC 16, d8, +5 to hit, +0 damage.` in ink with bold numbers, caption suffix wraps inside its reserved second line. | Yes |
| 1366 dark, fresh and stale | `crit` in gold accent, misses muted, the Total rule reads light on dark. Stale text is muted and readable. The Now: line and the note stay in ink. | Yes |
| 360 light and dark, fresh and stale | Stacked: note, exact card, sim card with button, lines, then the log (296px) below. No horizontal scroll. The note's two-line reservation keeps the cards at the same y in both states. The log sits lower when stale, because the Now: line appears above it in the stacked order, as the UI-SPEC specifies. | Yes |

## Decisions Made
- Two-line reservations for the note (narrow and side-by-side columns) and the log caption (always). See Deviation 1.
- Stale dimming extends to every log `th` / `td`. The plan's `#sim.is-stale .sim-log` alone would not reach the header cells and `hit` words, which set their own color. The caption stays in ink as a word cue, like the note and the Now: line.
- Older tally totals render at 400 (`.sim-line span.num`). The existing `.sim-line .num` rule would otherwise make them bold too, contradicting "newest bold".
- The Now: line and tally are rebuilt only when their text would change (compare-before-replace), and the caption uses `setText`. A drag frame at unchanged values touches no DOM.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The pair and the log jumped down when the run first went stale at laptop width**
- **Found during:** Task 2 (1366 screenshots)
- **Issue:** The UI-SPEC reserved two note lines only at `@container sim (width < 40rem)`. In the side-by-side layout the result column is 32rem, so the stale note also wraps there, and the reservation did not apply. The stale caption suffix always wraps at 296px, so the log rows also moved. Both violate the "no jump while dragging" intent of D-09 / SC3.
- **Fix:** `@container sim (width < 40rem) or (width >= 54rem) { .sim-note { min-height: calc(2 * 1.4em); } }` and `.sim-log caption { min-height: calc(2 * 1.4em + var(--sp-2)); }`. The re-shoot confirmed identical positions in both states. As a side effect, the log header now lines up with the top of the pair.
- **Files modified:** index.html
- **Commit:** 00b823f

**2. [Rule 3 - Blocking] check-page header anchor text**
- The existing header said `(<th scope="row")`, without the `>` the plan quoted. It was rewritten to the plan's wording, and the acceptance grep matches once.

### Minor
- Smoke check count is 59 (plan minimum 30). Every name starts with `sim log ui` and avoids displayed strings. Visible copy in expected values is split.
- The stale sentence lives in the `#sim-note` markup (`b.note-stale` is hidden until stale), which is one of the plan's allowed options ("created once in markup or on first use").

---

**Total deviations:** 1 auto-fixed bug, 1 blocking text anchor, 2 minor
**Impact on plan:** None on scope. Fix 1 was needed to meet the plan's no-jump intent at laptop width.

## Issues Encountered
- A Bash heredoc holding the large JS block tripped the shell parser. The edit scripts were written to the scratchpad with the Write tool and run with Python instead. No repo effect.

## Known Stubs
- `simCtx.marks` is derived in `render()` but still unused. Marks on the `#outcome` table and the legend item belong to plan 03-03, and this plan's goal does not need them.

## User Setup Required
None.

## Next Phase Readiness
- Plan 03-03 can pass `simCtx.marks` into the `#outcome` `renderOutcomeTable` call. The `sim log ui` block shows how to roll a seeded run and reset at the end so the dump stays at 80 row headers. Marks keep `scope="row"` first, so with a run on screen the count becomes 101 + 0 (marks add classes, not headers).
- The Node self-test runs at 186-192 ms of its 200 ms budget. This plan added nothing to it (all new checks are UI smoke), and 03-03 should do the same.

## Self-Check: PASSED
- FOUND: index.html, tools/check-page.mjs, .planning/phases/03-roll-20-rounds-simulation/03-02-SUMMARY.md
- FOUND commits: ad8e23a, 00b823f
