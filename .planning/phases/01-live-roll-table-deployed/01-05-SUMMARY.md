---
phase: 01-live-roll-table-deployed
plan: 05
subsystem: controls, stat-cards, marginal-readout
tags: [controls, stat-cards, marginal-value]
requires:
  - "01-01: DiceMath (damageFor, stats, marginals, threshold), VM (parseControl, fixed, tenths, computeView), onControl delegated input + change listener, renderControls, runUiSmoke, check tools"
  - "01-04: theme tokens (--surface, --ink-muted, --line, --accent), .strip / .group / .card styles, RENDERERS list"
provides:
  - "index.html: Damage die fieldset (five clipped radios name=die data-key=die, 48x40 joined segments), #atk-num and #dmg-num steppers (-5 to +20)"
  - "index.html #dice-math: DiceMath.hitAverages(p) -> {normalNum, normalDen, critNum, critDen}"
  - "index.html #view-model: VM.signed(n); computeView adds normalAvgText, critAvgText, hitState ('normal' | 'cap' | 'floor')"
  - "index.html: six stat cards #stat-threshold / #stat-hit / #stat-crit / #stat-avg / #stat-round / #stat-e20, each with an id-sub sub-line; #marginal card with #marg-hit / #marg-dmg"
  - "index.html #app: renderStats(view) writes every card and marginal line with textContent; MARG_HIT_ZERO copy table"
affects: [Phase 2 (N slider joins the control strip; the stats grid and focal 20-round card are the comparison anchor), Phase 4 accessibility pass]
tech-stack:
  added: []
  patterns:
    - "Every control, radio or number box, feeds one delegated listener -> VM.parseControl; change normalizes number boxes; the focused box is never rewritten"
    - "Stat cards on a CSS subgrid (grid-row: span 3; grid-template-rows: subgrid) so label, value and sub-line rows align across the row"
    - "Stats track minimum max(10rem, (100% - 5 gaps) / 6) caps the grid at six tracks, so a full-row card (grid-column: 1 / -1) leaves no empty seventh track"
    - "UI smoke check names split or avoid the displayed strings, so check-page --expect matches only the real DOM"
key-files:
  created:
    - .planning/phases/01-live-roll-table-deployed/01-05-SUMMARY.md
  modified:
    - index.html
decisions:
  - "Marginal +1-to-hit zero states render '+0' in the num/700 span and the explanation in a separate prose span, so words are prose and numbers are num family (UI-SPEC typography)"
  - "App-level signed() now delegates to VM.signed lazily, so a broken VM block still cannot crash the app block before the engine-error banner"
  - "Smoke selectors use input[data-key=\"die\"] so grep -c 'name=\"die\"' counts only the five real radios"
  - "Task 3 (push and live-URL verification) deferred by user decision: git stays local, no GitHub remote or Pages site"
metrics:
  duration: "~8 min"
  completed: 2026-09-24
  tasks: 2
  files: 1
---

# Phase 1 Plan 05: Controls, Stat Cards, Marginal Readout Summary

Every input can now be changed from the top strip: AC slider and box, d4-d12 segmented radios, and the attack and damage bonus steppers. Six exact stat cards (10+ / 55% / 5% / 4.91 / 2.700 / 54.0 at the defaults) and a "Value of the next +1" readout (+0.225 vs +0.550 per round) update live, with cap and floor copy. Deployment (Task 3) is deferred by user decision; the project stays local git only.

## What Was Built

**Task 1: die group and bonus steppers (commit 7bc2ebf)**
- `fieldset.dice` with legend "Damage die" and five `<label><input type="radio" name="die" value="N" data-key="die" class="vh"><span>dN</span></label>` segments. The radios are clipped with `.vh`, not `display:none`, so the group is one tab stop and arrow keys move the selection.
- Segments are 48x40 and joined, with shared 1px `--ink-muted` borders and 4px outer corners. The checked segment has an `--accent` background, `--paper` text, and weight 700. An unchecked segment shows the `color-mix` background on hover. The focus ring is drawn on the span through `input:focus-visible + span`.
- `Attack bonus` and `Damage bonus` groups (hint `−5 to +20`), each with `<input type="number" min="-5" max="20" step="1">`. The markup has no `value` or `checked` attributes; `init()` writes state into the controls (D-04).
- No handler changes were needed. The existing delegated `input` + `change` listener already covered the new controls. The radio path goes through the `parseControl` allow-list, and the change path normalizes both new number boxes.
- UI smoke additions:
  - Attack box: `''` keeps 5; `'abc'` (via a text proxy, because number boxes sanitize it) keeps 5; `'99'` gives 20 and change normalizes the box to `'20'`; `'-99'` gives -5; `'2.6'` gives 3; `'12'` gives numeric 12.
  - Damage box: `''` keeps 0; `'99'` gives 20; `'-99'` gives -5.
  - Die: clicking d12 gives 12 cells per row and a corner cell naming d12, and d12 becomes the checked radio. Clicking d4 gives 4.

**Task 2: stat cards and marginal readout (commit 8c4290a)**
- `DiceMath.hitAverages(p)` sums `damageFor(20, [k], p)` for the normal-hit average and `damageFor(20, [a, b], p)` for the true 2dX crit average, so both go through the one rule (RULES-05).
- `VM.signed`, plus three new `computeView` fields: `normalAvgText`, `critAvgText`, and `hitState`.
- Six cards in UI-SPEC order and copy. The focal "Expected over 20 rounds" card is the only one with the 3px `--ink` top border. The marginal card spans the full row.
- Self-test (65 checks, up from 59):
  - hitAverages at the defaults is 36/8 and 576/64.
  - Normal / crit / per-hit averages at the defaults are 4.50 / 9.00 / 4.91.
  - AC15 +5 d6 D-2 gives a normal average of 1.67.
  - hitState reads normal / cap / floor.
  - `signed(-2)` returns `−2` with U+2212; `signed(0)` and `signed(5)` return `+0` and `+5`.
- UI smoke:
  - The six card values and both marginal lines are correct at the defaults.
  - STAT-02 holds on the displayed text: per round × 20 equals the 20-round figure.
  - Cap through the real attack box (13): the threshold card reads 2+ and the marginal shows the 95% cap copy.
  - Floor through the AC box (30) and attack box (-5): the threshold card reads 20, its sub-line shows the 5% floor copy, and the marginal says "still only a natural 20 hits".

**Task 3: ship and verify live**: deferred by user decision (local git only). Nothing was pushed and no `gh` or github.io calls were made.

## Verification

| Command | Result |
|---------|--------|
| `node tools/check-engine.mjs` | CHECK-ENGINE PASS: selftest 65/65, sweep 70980 combos |
| `node tools/check-page.mjs --expect "Damage die" --expect "Attack bonus" --expect "Damage bonus"` | CHECK-PAGE PASS |
| `node tools/check-page.mjs --expect "10+" --expect "55%" --expect "4.91" --expect "normal 4.50" --expect "2.700" --expect "54.0" --expect "Value of the next +1" --expect "+0.225 per round" --expect "+4.5 over 20 rounds" --expect "+0.550 per round" --expect "+11.0 over 20 rounds"` | CHECK-PAGE PASS |
| `node tools/check-page.mjs --plain --expect "54.0"` (also run with every Task 2 expect plus `d20 + 5 ≥ AC 15` and `= 2.700 × 20`; there is no self-test panel in plain mode, so these match only the real cards) | CHECK-PAGE PASS |
| `node tools/check-page.mjs --width 360` | CHECK-PAGE PASS |
| `grep -c 'name="die"' index.html` | 5 |
| `grep -cE '<input[^>]*checked' index.html`; number/range inputs with `value=` | 0; 0 |
| `grep -v '^\s*//' index.html \| grep -cE '\.innerHTML\s*='` | 2 (unchanged) |

Visual check with headless screenshots at 1366px (light and dark) and 600px (light):
- At 1366px the strip is one row: AC, die segments, attack, damage.
- The six cards fill one row, and the marginal card spans the full width below them.
- At 600px the cards wrap three per row, and the subgrid keeps the values aligned even where a label wraps to two lines.

DEPLOY-01 (works from disk, no outside requests) is satisfied by the local `file://` check-page runs. DEPLOY-03 (live on the public URL) is **not completed**: it was deferred by user decision.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Smoke-test selectors inflated the `name="die"` count**
- **Found during:** Task 1
- **Issue:** Using `input[name="die"]` selectors in runUiSmoke made `grep -c 'name="die"'` print 8, which failed the acceptance check of exactly 5.
- **Fix:** The smoke checks now select `input[data-key="die"]`.
- **Commit:** 7bc2ebf

**2. [Rule 1 - Bug] Full-row marginal card left an empty seventh column at 1366px**
- **Found during:** Task 2 (screenshot)
- **Issue:** With `repeat(auto-fit, minmax(10rem, 1fr))`, `grid-column: 1 / -1` spans every explicit track. That keeps a seventh, otherwise empty, track from collapsing, so the six cards stopped short of the right edge.
- **Fix:** The track minimum is now `max(10rem, (100% - 5 * var(--sp-3)) / 6)`, so there are never more than six tracks. The 10rem minimum and the wrapping on narrow screens are unchanged.
- **Commit:** 8c4290a

**3. [Rule 1 - Bug] Values misaligned when a card label wrapped**
- **Found during:** Task 2 (screenshot)
- **Issue:** "Average damage on a hit" and "Expected over 20 rounds" wrap to two lines on narrower cards, which pushed their values below the other cards' values.
- **Fix:** Each stat card spans three rows of a subgrid (`grid-template-rows: subgrid`), so the label, value, and sub-line rows line up across the row.
- **Commit:** 8c4290a

### Scope change

- Task 3 was skipped entirely at the user's direction: git stays local, with no remote, no Pages site, and no `gh` auth. DEPLOY-03 remains open.

## Known Stubs

None. Every card and marginal line is computed from `VM.computeView` on every render.

## Threat Flags

None. The new controls feed only `VM.parseControl` (T-01-14, T-01-15 mitigated and smoke-tested), all new output uses `textContent`, and nothing was pushed (T-01-16 not applicable).

## Self-Check: PASSED

- FOUND: index.html (die group, steppers, six cards, marginal card)
- FOUND: .planning/phases/01-live-roll-table-deployed/01-05-SUMMARY.md
- FOUND: commit 7bc2ebf
- FOUND: commit 8c4290a
