---
phase: 05-hits-to-kill
plan: 03
subsystem: enemy-hp-control
tags: [enemy-hp, step-buttons, a11y, controls, check-engine]
requires:
  - VM.killViewFrom / killView, VM.CONTROL_SPEC.hp, statsView exact numerators and avgPerHitText (05-01)
  - check-engine K section, killWeightsOf, kSimple, the K6 setting loop and HP sample (05-02)
provides:
  - "VM.hpStep(sv, hp): round half up of the exact average hit, with applied changes clamped to 1..500"
  - "killViewFrom step fields: step, minusApplied, plusApplied, minusInert, plusInert, minusLabel, plusLabel, hitsLine"
  - "VM.hpStatus(sv, hp): the click-only announcement"
  - "#hp-minus / #hp-plus (.btn-step, data-step), #hp-hits, #hp-status; onStepClick, renderHp"
  - "check-engine K7; check-page guards (7), (11) and the fault modes cover the step buttons"
affects:
  - 05-04 (the kill roll: an HP edit from the step buttons re-scores a rolled run the same way typing does; RENDERERS now begins renderControls, renderHp)
tech-stack:
  added: []
  patterns: [step from state at click time, aria-disabled inert buttons, click-only live region, static-markup parity check]
key-files:
  created: []
  modified: [index.html, tools/check-engine.mjs, tools/check-page.mjs]
decisions:
  - "The simple-division string comes from a pure simpleHits(sv, hp) helper shared by killViewFrom and hpStatus, so the status needs no kill table and check-engine can call VM.hpStatus at all 1.4M sample pairs without building a table per setting"
  - "K7's markup parity uses VM.killViewFrom with check-engine's own defaults table (kKeys), not VM.killView, which keeps 05-02's rule that check-engine never goes through the page memo"
  - "K7 computes the exact step two ways: from the sv.exact (DiceMath.stats) rational in BigInt, and from check-engine's own enumerated weights. Both must equal the card-string step and VM.hpStep"
metrics:
  duration: 18 min
  completed: 2026-09-27
  tasks: 3
  files: 3
---

# Phase 5 Plan 03: Enemy HP hit step buttons Summary

Two buttons beside the Enemy HP box, "−1 hit (−5 HP)" and "+1 hit (+5 HP)" at the defaults, step HP by the attack's average damage on a hit (the 4.91 card, crits included), rounded half up to whole HP. A line under the box reads "≈ 8.1 average hits (1 hit ≈ 4.91 HP)". Each label shows the change its click will really make: "(−2 HP)" at HP 3, and "(0 HP)" at a bound or when the average hit rounds to 0. A button with a 0 change goes inert through aria-disabled, so it keeps focus and the tab order. Only an active click announces, through #hp-status. check-engine K7 proves the step equals the card's rounding at all 70,980 attack settings. It also checks every label, inert flag, hits line and status over 1,403,825 HP-sample pairs.

## Pre-change references

- HEAD before any edit: `16d6f65` (05-02 docs). `origin/main` is `067d266` before and after. Nothing was pushed, and no remote or gh command was used.
- The session scratchpad held `pre-05-03.html` (a copy of index.html at 16d6f65) for the timing comparison. It was deleted with the other scratch files.

## What was built

**Task 1: failing checks (RED, e012e91)**
- Self-test: one O(1) pin, `kill: default steps`, a memo hit on the existing default kill view. Expected `5|5|5|−1 hit (−5 HP)|+1 hit (+5 HP)|≈ 8.1 average hits (1 hit ≈ 4.91 HP)`. The self-test now has 259 checks.
- UI smoke `hp step ui` (33 named checks) with a held-rAF `click()` helper (the 'explore ui' pattern). It covers:
  - structure: data-step, type, no data-key, aria-describedby on the box and both buttons, and the role/class of #hp-status
  - the defaults
  - one plus click: HP 45, the status, the hits line, focus kept, and the cards 9.7 / 17.7
  - two minus clicks: HP 35
  - HP 3: the minus label clamps to −2, then HP 1 goes inert with the lowest-bound status, and an inert click keeps HP and focus
  - HP 499: two synchronous clicks give 500, then the plus button is inert with the highest-bound status
  - step 0 at d4 / −4: both buttons inert, the long hits line, and clicks change nothing and announce nothing
  - tiny at AC 10 / d12 / +20 / +20 / HP 1
  - the labels follow an attack change (±13 at AC 25 / d12)
  - typing never announces
  - UI-SPEC A3 strip alignment
- The a11y ui order, check-page guard (11) `want` and its header now include `hp-minus, hp-plus` after `hp-num`.
- Guard (7) is renamed "Roll, preset and step buttons enabled after init" and requires 2 enabled .btn-step.
- New fault check: `fault: every .btn-step disabled (N)`.
- RED run: exit 1. Failing lines: `kill: default steps`, `UI hp step ui: …`, guard (7), guard (11), and the derived "SELFTEST PASSED" / timing / panel lines.

**Task 2: implementation (GREEN, 78cb61a)**
- View-model:
  - `hpStep(sv, hp)`: `step = floor((2·e20Num + den) / (2·den))` with `den = e20Den·hitFaces`, then `minus = min(step, hp − 1)` and `plus = min(step, 500 − hp)`.
  - `killViewFrom` adds step, minusApplied, plusApplied, minusInert, plusInert, minusLabel, plusLabel and hitsLine. The branches use the integer tests `tiny` and `step === 0`.
  - `hpStatus(sv, hp)` adds the bound sentence by `hp === CONTROL_SPEC.hp.min / max`.
  - Both are exported.
- Markup: the UI-SPEC block. The box and both buttons have `aria-describedby="hp-hits"`, and the buttons ship `disabled` with the default labels for the no-JS state.
- CSS:
  - `#controls { align-items: flex-start; }`, scoped so #compare-controls keeps flex-end
  - the die legend margin goes from `--sp-2` to `--sp-1`
  - `.hp-steps`, `.hp-hits`
  - `.btn-step` base, hover and active with `:not([aria-disabled="true"]):not(:disabled)`, and one inert selector list
  - no transitions and no new tokens
- App:
  - refs under `// Enemy HP step buttons (Phase 5)`
  - `onStepClick` computes the step from state at click time, returns early on a 0 change, then runs `parseControl('hp', state.hp + applied, state.hp)` and one setState. It clears the status and writes it in the next rAF behind a `state.hp === hp` guard.
  - `renderHp` sits in RENDERERS right after renderControls. It writes labels and the hits line through setText and writes aria-disabled only on change. It never writes #hp-status.
  - init adds `form.addEventListener('click', onStepClick)` and enables the step buttons last, with Roll and the presets. failPage disables them.

**Task 3: K7 (cc5e400)**
- Setting level (all 70,980 settings): the exact step (sv.exact rational, BigInt `rhuB`), the own-weights step (`o.A / o.den`), the card step (avgPerHitText parsed as integer cents, `floor((c + 50) / 100)`, so an exact `.50` goes up) and `VM.hpStep(sv, 40).step` must all be equal.
- HP sample (the K6 set, 1,403,825 pairs):
  - applied changes, inert flags and both labels against the clamped exact step
  - the hits line parsed by regex: the 'under 0.1' branch iff the oracle simple string is 'under 0.1'; otherwise the number equals the oracle `kSimple` string and the card sub's simple number; the average hit equals avgPerHitText; the step-0 clause iff step 0
  - `VM.hpStatus` parsed by regex: the HP, the simple string or 'under 0.1', and the bound sentence iff HP 1 / 500
- Markup parity: the raw #hp-minus, #hp-plus and #hp-hits text, decoded with the hoisted `decHtml` (formerly the (x) `dec`), equals the VM strings at the defaults.
- Counts pinned: step 0 **1,412** and exact .5 ties **99**, both equal to RESEARCH.

## Verification

- `node tools/check-engine.mjs`: CHECK-ENGINE PASS. selftest 259/259, and K1 through K7 have 0 failures each. The K7 suffix reads `70980 settings: step 0 1412, exact .5 ties 99; 1403825 HP-sample pairs; markup 3 strings`. Runtime is 113.6 s (the kill section is 66 s; K7 adds about 3 s).
- `node tools/check-page.mjs` passes in all five modes (default ?test, `--plain`, `--width 390`, `--fault render`, `--fault later`). The Chrome self-test ran in 42–75 ms of its 200 ms budget, and the panel reads "Self-test passed: 643 of 643 checks".
- `--width 1366 --expect "Enemy HP" --expect "−1 hit (−5 HP)" --expect "+1 hit (+5 HP)" --expect "≈ 8.1 average hits (1 hit ≈ 4.91 HP)" --expect "Killing a 40 HP enemy"`: PASS. `--plain --width 390`: PASS.
- Acceptance greps:
  - `'hp step ui: ` 33
  - `'hp-num', 'hp-minus', 'hp-plus'` in both files
  - `btn-step` 6 in check-page
  - `data-key="hp"` 1
  - two `class="btn-step"` buttons without data-key
  - `aria-disabled` 10
  - `const RENDERERS = [renderControls, renderHp,` matches

## Self-test timing (Node, `st-ms.cjs`, three interleaved rounds, two sets)

| Round | pre-05-03.html | index.html (after Task 2) |
|---|---|---|
| 1 | 195.8 / 195.0 ms | 202.0 / 191.4 ms |
| 2 | 190.5 / 203.1 ms | 190.9 / 191.4 ms |
| 3 | 187.1 / 187.5 ms | 188.7 / 198.4 ms |

- Per-set medians: 190.5 → 190.9 ms (+0.4, noise) and 195.0 → 191.4 ms. Pooled over all six rounds: 192.8 ms before, 191.4 ms after.
- The median did not rise, so the Phase 4 Pitfall 4 fallback (thinning the Phase 1 coarse grid) was not applied.
- check-engine's Node self-test line printed its usual 201.9–203.0 ms WARNING, as it did before this plan.

## Strip alignment and screenshots (headless Chrome, scratch copies, all deleted)

A probe copy measured the strip at 1366 px:
- all five groups start at top 162.6 and every control top is at 186.2 (0.0 px apart)
- `scrollWidth === clientWidth`
- both alignment mutations make `hp step ui: controls on the first row share a top edge` fail with `d4 4.0`: legend margin back to 8px, or #controls without flex-start

| Shot | Observation |
|---|---|
| 1366 light, defaults | One strip row: AC, die, attack, damage and Enemy HP. The box, `−1 hit (−5 HP)` and `+1 hit (+5 HP)` sit on the controls' shared top line. The hits line is one line under them, and the labels fit the 120px buttons. |
| 1366 light, HP 1, focus on #hp-minus | `−1 hit (0 HP)` is inert (surface fill, muted text, hairline border) and keeps the accent focus ring. The plus button is active. The hits line reads ≈ 0.2. |
| 1366 dark, HP 1, focus on #hp-minus | Same layout. The ring and the inert and active states are legible. |
| 1366 light, step 0 (d4 / −4) | Both buttons read `(0 HP)` and are inert. The hits line wraps to two lines inside the HP group, and the other controls keep their top alignment. |
| 360 iframe light, defaults | The box is on line 1, both buttons together on line 2 (.hp-steps does not split), and the hits line is under them. The strip ends inside the 360px frame, so there is no horizontal scroll. |
| 360 iframe light, step 0 | Same stacking. Both buttons are inert, and the hits line wraps to two lines. |

## K7 mutation proof (scratch `mut/index.html` + `mut/tools/check-engine.mjs`, deleted)

| Mutation | Result |
|---|---|
| `hpStep` uses `Math.floor(e20Num / den)` (no half-up term) | K7 **739,976 failures**. The first is AC10 / −5 / d4 / −3: exact step 1, card 0.55 → 1, VM 0. Markup parity also fails (static 5 vs VM 4). The in-page pin `kill: default steps` fails (got `4|4|4|−1 hit (−4 HP)…`). CHECK-ENGINE FAIL, exit 1. |

`git status --porcelain` was empty after the cleanup.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Blocking] hpStatus reads the simple string without the kill memo**
- **Found during:** Task 3 design, before writing K7.
- **Issue:** The plan had `hpStatus` use `killView(sv, hp).simpleText`. `killView` goes through the page's 8-entry table LRU. The K6 loop changes attack key almost every setting, so K7 calling `VM.hpStatus` there would build a kill table (5–8 ms) at nearly each of the 70,980 settings, adding minutes to check-engine.
- **Fix:** Extracted a pure `simpleHits(sv, hp)` → `{ tiny, text }` (the same integer code that was inline in killViewFrom). killViewFrom and hpStatus both use it, so the status string is identical by construction and needs no table. The click handler also no longer touches the memo.
- **Files modified:** index.html
- **Commit:** 78cb61a

**2. [Rule 2 - Test independence] Markup parity through killViewFrom, not VM.killView**
- **Found during:** Task 3.
- **Issue:** The plan named `VM.killView(VM.statsView(VM.DEFAULT_STATE), 40)`. 05-02 set the rule that check-engine never calls `VM.killView(` (0 occurrences), so the proofs never pass through the page memo.
- **Fix:** Parity uses `VM.killViewFrom(kKeys.get(defaultKey).tab, dsv, 40)`, which returns the same strings from check-engine's own table.
- **Commit:** cc5e400

### Executor notes

1. **K7 has two exact references.** The plan asked for the step from the DiceMath.stats integers in BigInt. K7 does that through sv.exact. It also requires equality with the K6 own-weights step (`o.A / o.den`), which is independent of DiceMath.stats.
2. **decHtml hoisted.** The (x) block's `dec` moved to module scope as `decHtml`, so (x) and K7 share one decoder. (x) still passes.
3. **`hp step ui` renders with renderControls.** Its `show()` calls renderControls before render, as 'formula ui' does, so the typed-box check starts from the rendered value.
4. **The smoke's finally blurs a focused step button** besides clearing #hp-status in a registered rAF, so the a11y block starts from a known focus.
5. **The alignment check was proven non-vacuous** with two scratch mutations (see Strip alignment above).

No Rule 4 decisions and no auth gates.

## Known Stubs

None. The static button labels and hits line are the no-JS state. K7 proves they equal the live defaults, and renderHp replaces them on the first render.

## Threat Flags

None. The new DOM writes are textContent through setText and setAttribute / removeAttribute for aria-disabled (T-05-11). The only new listener is added with addEventListener (T-05-13). The buttons carry data-step and never data-key, which the smoke asserts (T-05-12). The step comes from state at click time and goes through parseControl, and the double click at 499 is covered (T-05-09). The step is never a divisor, and inert buttons return before setState (T-05-10).

## Commits

| Task | Commit | Message |
|---|---|---|
| 1 | e012e91 | test(05-03): failing checks for the hit step buttons and a11y guards |
| 2 | 78cb61a | feat(05-03): ±1 average-hit buttons, hits line and status for Enemy HP |
| 3 | cc5e400 | test(05-03): K7 step and label proofs with markup parity |

## Self-Check: PASSED

- FOUND: index.html, tools/check-engine.mjs, tools/check-page.mjs and .planning/phases/05-hits-to-kill/05-03-SUMMARY.md
- FOUND: commits e012e91, 78cb61a and cc5e400
- No tracked files were deleted between 16d6f65 and HEAD. origin/main is still 067d266.
