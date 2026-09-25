---
phase: 01-live-roll-table-deployed
plan: 01
subsystem: rules-engine, page-skeleton, dev-checks
tags: [walking-skeleton, rules-engine, self-test, vanilla-js]
requires: []
provides:
  - "index.html: DiceMath (damageFor, stats, marginals, sweep, closedFormPerRound, outcomeTable, threshold)"
  - "index.html: VM (CONTROL_SPEC, DEFAULT_STATE, parseControl, fixed, tenths, computeView)"
  - "index.html: SelfTest {results, passed, failed, ms}"
  - "index.html #app: state, RENDERERS, setState, scheduleRender, render, renderControls, renderStats, renderTable, showSelfTestPanel, runUiSmoke, init"
  - "tools/check-engine.mjs: Node vm SelfTest + 70,980-combo invariant sweep"
  - "tools/check-page.mjs: headless Chrome/Edge DOM + console check (file:// or live URL)"
affects: [01-03 publish, 01-04 theming/legend/controls, 01-05 stats cards, Phases 2-4 renderers]
tech-stack:
  added: []
  patterns:
    - "Four classic inline script blocks sharing top-level const (D-14)"
    - "Integer-numerator stats (e20Num / die^2) with exact fixed-point formatting"
    - "Delegated input/change listener -> parseControl -> setState -> rAF render registry"
    - "Numbers-only innerHTML for thead/tbody; textContent elsewhere"
key-files:
  created:
    - index.html
    - tools/check-engine.mjs
    - tools/check-page.mjs
  modified: []
decisions:
  - "Stats enumerate the crit row as a true 2dX roll (Open Question 1); display row 2 x face + D equals it for D >= -2"
  - "marginals reason: null | 'cap' (atk >= AC-2) | 'floor' (AC-(atk+1) >= 20) | 'nodmg' (extra hits deal 0), fixing the prototype"
  - "Heat domain [0, max(1, 2X + D)]; avgPerHitText is E / P(any hit)"
  - "check-page.mjs judges rendered markup only (script/style bodies stripped) so source strings cannot fake a match"
  - "UI smoke feeds 'abc' through a temporary text input with data-key=ac, because a number box cannot hold non-numeric text and Chrome logs a warning when you try"
  - "Coarse-grid STAT-02 check calls VM.computeView on all 750 combos (about 23 ms in headless Chrome, under the 30 ms target)"
metrics:
  duration: "~25 min"
  completed: 2026-09-24
  tasks: 3
  files: 3
---

# Phase 1 Plan 01: Walking-Skeleton Page and Self-Tested Engine Summary

One `index.html` (four classic inline scripts, strict CSP) where the Target AC slider and number box drive a live 20 x 8 outcome table plus hit chance and 20-round expectation. Every number comes from `DiceMath.damageFor`, and a 59-check in-page self-test verifies them. Two dev-only Node checks (a vm sweep over 70,980 combos and headless Chrome) also pass.

## What was built

- **index.html**
  - Head: CSP meta `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:`, a `data:` favicon, and the light parchment tokens.
  - Heat and miss CSS uses class-only selectors (`.h`, `.h.hi`, `.m`). Threshold and crit rules are inset box-shadows.
  - The table uses container-query size tiers with an explicit `table-layout: fixed` width.
  - Body order follows the Layout Contract: `#selftest[hidden]`, `#engine-error[hidden]`, header, noscript, AC control strip, two stat cards, outcome table, footer.
  - `#dice-math`: the pure engine (Pattern 1). It applies a 0-damage floor, integer numerators, a true 2dX crit in stats, and the corrected marginals reason.
  - `#view-model`: the parser (blank or NaN keeps the previous value, `Number` not `parseInt`, round, allow-list the die, clamp), `fixed` and `tenths`, and `computeView` with every field listed in the interfaces block.
  - `#dice-selftest`: DOM-free, 59 checks (details under Verification). Logs `SELFTEST PASSED: 59/59 (~12-23 ms)`.
  - `#app`
    - One delegated listener for `input` and `change`, with `submit` prevented. Renders are rAF-coalesced.
    - `renderControls` never rewrites a focused number box. `renderTable` uses numbers-only `innerHTML` for thead and tbody (exactly two assignments) and sets the caption via textContent.
    - Note labels are `auto-miss`, `hits on N+`, and `crit*`.
    - On `?test` the page shows the self-test panel, with the UI smoke results listed under "UI checks".
    - If the engine fails to load, a crash banner replaces the table.
- **tools/check-engine.mjs**: extracts the three pure blocks, runs them in one `vm` context, checks invariants (a) to (f) across the full domain, and prints `CHECK-ENGINE PASS: selftest 59/59, sweep 70980 combos`. The run takes about 10 s.
- **tools/check-page.mjs**: runs headless Chrome (falling back to Edge) with a throwaway profile, `--virtual-time-budget=3000 --dump-dom`, and console capture through stderr (log-file retry). It runs five checks, plus `--plain`, `--expect`, `--width`, and `--dump`.

## Verification

| Check | Result |
|-------|--------|
| `node tools/check-engine.mjs` | PASS: selftest 59/59, 70,980 combos, all six invariants 0 failures |
| `node tools/check-page.mjs --expect "55%" --expect "54.0" --expect "hits on 10+" --expect "auto-miss" --expect "crit*"` | PASS |
| `node tools/check-page.mjs --expect "UI checks" --expect "55%"` | PASS (panel: `Self-test passed: 70 of 70 checks`) |
| `node tools/check-page.mjs --plain --dump plain.html` | PASS; `grep -c "UI checks"` = 0 |
| `node tools/check-page.mjs --width 390` | PASS |
| Crash drill (`throw new Error('drill')` at the start of the dice-math block in a scratch copy) | exit 1; `grep -c "The dice math failed to load"` = 1; `?test` panel shows `FAIL  self-test crashed: DiceMath is not defined`; repo `index.html` has no `drill`; scratch copy deleted |
| Static gates | 4 script ids x 1; `type="module"` 0; CSP 1; `.innerHTML =` 2; `function damageFor(` 1; value attrs on inputs 0; external URLs 0; DEFAULT_STATE literal present |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] check-page.mjs matched strings inside script source**
- **Found during:** Task 2
- **Issue:** `--dump-dom` output includes inline script text. That text contains `<th scope="row"` (21 matches instead of 20), `Self-test FAILED` (false panel failure), `crit*`, and `auto-miss`. So `--expect` checks could pass without the page rendering anything.
- **Fix:** DOM checks run against the dump with `<script>` and `<style>` bodies stripped. `--dump` still writes the raw DOM.
- **Files modified:** tools/check-page.mjs
- **Commit:** 784c648

**2. [Rule 1 - Bug] Crash-drill and plain-dump greps matched source literals**
- **Found during:** Task 3
- **Issue:** The acceptance greps run on the raw dump. The banner sentence and the `UI checks` label, as literals in `#app`, would each count once even when never shown.
- **Fix:** Both literals are split (`'The dice math failed ' + 'to load, ...'`, `'UI ' + 'checks'`), with a comment explaining why. The text shown to users is unchanged.
- **Files modified:** index.html
- **Commit:** f61bd3d

**3. [Rule 1 - Bug] The UI smoke cannot write 'abc' into a number input**
- **Found during:** Task 3 (known from RESEARCH Pattern 4)
- **Issue:** Assigning `'abc'` to `type=number` empties the box and makes Chrome log `cannot be parsed`, which fails the console check.
- **Fix:** The `'abc'` case sends the same bubbling `input` event through a temporary `type=text` input with `data-key="ac"`, appended to and then removed from the form. It exercises the real delegated handler and parser.
- **Files modified:** index.html
- **Commit:** f61bd3d

**4. [Rule 2 - Correctness] Engine guard survives a permanently uninitialized binding, and state init is deferred**
- **Found during:** Task 3
- **Issue:** A plain `typeof DiceMath` guard can itself throw if a block leaves a const in the temporal dead zone. Also, `const state = { ...VM.DEFAULT_STATE }` at the top of `#app` would crash before the banner could show.
- **Fix:** `engineLoaded()` and `selfTestIfLoaded()` wrap their checks in try/catch. `state` starts as `{}` and `init()` fills it from `VM.DEFAULT_STATE` after the guard passes.
- **Files modified:** index.html
- **Commit:** f61bd3d

### Additions beyond the plan's list

- The UI smoke also asserts that the focused AC box keeps `"2"` while typing toward 25. This demonstrates the Pitfall 3 fix directly.
- `tr.threshold.crit` combines both inset shadows (UI-SPEC: "combined with the threshold shadow when threshold = 20").

## Notes for Later Plans

- Only the light tokens the plan lists are defined. Borders use `color-mix(in oklch, var(--ink) 20%, var(--paper))` as a stand-in for `--line`. Plan 01-04 adds `--surface`, `--ink-muted`, `--line`, `--pass`, `--fail`, and the dark block. With `color-scheme: light dark` set, native controls may render dark on an OS in dark mode until then.
- The note column holds plain `hits on N+` (no `span.lg`), so the `--expect "hits on 10+"` check matches. Plan 01-04 can wrap it for the narrow tier.
- `showSelfTestPanel(st, ui)` takes an optional `{results, ms}` for extra check groups.

## Known Stubs

None. The two stat cards and the table are fully wired. The remaining cards, die, and bonus controls are scheduled for plans 01-04 and 01-05 by design.

## Threat Flags

None. No surface beyond the plan's threat model. T-01-01 (two numbers-only innerHTML assignments), T-01-02 (assertParams + parseControl), and T-01-03 (CSP, no external URLs) are all in place and gated.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 3ca0a88 | test(01-01): add failing end-to-end checks for engine and page |
| 2 | 784c648 | feat(01-01): thinnest live slice from AC control to outcome table |
| 3 | f61bd3d | feat(01-01): full reference self-test, ?test UI smoke, engine-crash banner |

## TDD Gate Compliance

RED `test(01-01)` 3ca0a88 (both tools fail with `index.html not found`), followed by GREEN `feat(01-01)` 784c648. No refactor commit was needed.

## Self-Check: PASSED

- FOUND: index.html, tools/check-engine.mjs, tools/check-page.mjs
- FOUND commits: 3ca0a88, 784c648, f61bd3d
