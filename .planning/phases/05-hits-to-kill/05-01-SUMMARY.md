---
phase: 05-hits-to-kill
plan: 01
subsystem: kill-math
tags: [kill-math, enemy-hp, stat-cards, exact-dp, bigint, lru]
requires:
  - DiceMath.damageFor (RULES-05), DiceMath.threshold
  - VM.CONTROL_SPEC / parseControl (CTRL-05), VM.statsView exact numerators
provides:
  - DiceMath.hitPmf / killTable / killHitsExact and KILL_HP_MAX / KILL_MEDIAN_CAP / KILL_TIE_EPS / KILL_TINY
  - VM CONTROL_SPEC.hp, DEFAULT_STATE.hp, killTableFor (LRU 8), killViewFrom (pure), killView (memo), roundKill, group3, killNumText, pctText, computeView.kill
  - "#hp-num group, h2#kill-h, three .card.kill (stat-khits / stat-krounds / stat-k20)"
affects:
  - 05-02 (kill note, check-engine K-series proofs: can call VM.killViewFrom with its own tables)
  - 05-03 (±1 hit buttons, #hp-hits; the tab order grows again after hp-num)
  - 05-04 (20-round roll re-scoring against state.hp)
tech-stack:
  added: [BigInt (display tie-break only), Float64Array / Int32Array DP vectors]
  patterns: [pure builder + memo wrapper, per-key LRU Map, exact integer copy-branch tests, float with an exact fallback inside a 1e-6 window]
key-files:
  created: []
  modified: [index.html, tools/check-page.mjs]
decisions:
  - Thinning DP for the median, P10 and P20 (RESEARCH), not the UI-SPEC's round-by-round DP; the round DP becomes the check-engine oracle in 05-02
  - Float plus an exact BigInt tie-break within 1e-6 of a .5 rounding boundary (ROUND_WINDOW)
  - Median tie rule P >= 0.5 - 1e-9 (KILL_TIE_EPS) for exact 1/2 ties
  - One kill table per (hitFaces, die, dmg) covering HP 1..500, in an LRU of 8, instead of a memo per (ac, die, atk, dmg, hp)
  - Keep the approved UI-SPEC percent rule ('0%' only when the fastest kill is past round 20, never '100%')
metrics:
  duration: 8 min
  completed: 2026-09-28
  tasks: 3
  files: 2
---

# Phase 5 Plan 01: Enemy HP box and exact kill cards Summary

The page now has an enemy. An "Enemy HP" box (1 to 500, default 40, through the one parse path) drives a live "Killing a 40 HP enemy" heading and three exact cards: 8.7 hits (simple division says 8.1), 15.8 rounds with half of fights done by round 15, and an 85% chance of a kill within 20 rounds. The numbers come from a thinning DP over remaining HP, and a BigInt tie-break makes sure no card prints a wrong last digit.

## Pre-change references

- `git rev-parse HEAD` before any edit: `db78df34ec46bbc9092d8260721b667deb0d7696`
- `git rev-parse origin/main` before any edit: `067d26635bfab0fef724aad6ed9c326c67cc88a1` (unchanged at the end, because nothing was pushed. 05-04 compares against it.)
- The scratchpad holds `pre-05-01.html` (a copy of index.html at db78df3) and `st-ms.cjs`. Neither file is in the repo.

## What was built

**Engine (`#dice-math`)**
- `hitPmf(p)`: per-hit damage weights over `den = hitFaces * X^2`. Each normal face gets `(hitFaces - 1) * X` and each true 2dX crit pair gets 1, all through `damageFor`.
- `killTable(p)`: covers every HP from 1 to 500 at once.
  - `eHits` comes from the exact recursion over remaining HP, with no cutoff.
  - `p10`, `p20` and `medianRound` come from binomial thinning of damaging hits. The median search stops at `KILL_MEDIAN_CAP = 1000` rounds, and `medianRound` = 0 means past the cap.
  - Binomial tails under `KILL_TINY` are dropped. `KILL_TIE_EPS` handles exact 1/2 ties.
  - It is copied verbatim from RESEARCH, with a D-06 header comment.
- `killHitsExact(t, hp)`: the BigInt `N_n` recurrence, used only for the display tie-break.

**View-model**
- `CONTROL_SPEC.hp = { min: 1, max: 500 }` and `DEFAULT_STATE.hp = 40`. `parseControl` did not change.
- `killTableFor(sv)`: an LRU of 8, keyed `hitFaces,die,dmg`.
- `killViewFrom(T, sv, hp)`: pure. It builds the heading, the three cards and the raw texts.
- `killView(sv, hp)`: a single-entry memo keyed `hf,die,dmg,hp`.
- `roundKill`, `group3`, `killNumText` and `pctText` are the rounding and format helpers.
- `computeView` adds `kill: killView(sv, state.hp)`. `statsView` stays kill-free.
- Every copy branch uses an exact integer test:
  - every hit kills: `2 + D >= hp && (hf < 2 || 1 + D >= hp)`
  - simple division under 0.1: `20 * hp * e20Den * hf < e20Num`
  - past the median cap: `medianRound === 0`
  - `0%`: `fastest > 20`

**Page**
- Markup: `div.group.hp` is the last group in `form#controls`. `h2#kill-h.stats-h` and three `.card.kill` sit after the focal card.
- CSS: `.hp-row` and `#stats > .stats-h`.
- `renderStats` writes the heading through `setText(killHeadEl, …)` and the cards through `setCard` from `view.kill`. The renderer builds no copy.

**Tests**
- Self-test section `kill`: the D-05 raw values (E[H] 8.69985, E[R] 15.8179, P20 0.84658, P10 0.11142, tol 5e-6; median 15) and the default card string. This section warms the memo for the first render.
- UI smoke `hp ui` has 21 checks:
  - the parse path: 0 → 1, 9999 → 500, '' and '12abc' keep the value
  - the HP 45 cards and the default cards
  - D-12: #compare and #chart carry no HP or kill text
  - moving N leaves the cards alone
  - eight edge rows
- Guard (11) in check-page and the in-page `a11y ui` order now include `hp-num` after `dmg-num`.

## Reference values reproduced (page engine)

| Setting | Hits | Rounds | Kill within 20 |
|---|---|---|---|
| Defaults, HP 40 | 8.7 (simple 8.1) | 15.8, by round 15 | 85%, round 3 |
| HP 45 | 9.7 (9.2) | 17.7, by round 17 | 74%, round 3 |
| HP 1 | 1.0, every hit kills (0.2) | 1.8, by round 1 | >99.9%, round 1 |
| HP 100 | 20.9 (20.4) | 38.0, by round 38 | 0.2%, round 7 |
| HP 500 | 102.4 (101.9) | 186.2, by round 186 | 0%, round 32 |
| AC 25 / d12 / +0 / +0, HP 40 | 3.6 (3.1) | 72.2, by round 65 | 5%, round 2 |
| AC 15 / d4 / +5 / −4, HP 40 | 358.6 (352.0) | 652.0, by round 640 | <0.1%, round 10 |
| AC 15 / d4 / +5 / −5, HP 40 | 712.8 (704.0) | 1,296, half of fights last over 1,000 rounds | <0.1%, round 14 |
| AC 25 / d4 / +0 / +0, HP 114 | 23.2 (the float is exactly 232.5 tenths, so the BigInt fallback decides) | 465.0, by round 458 | <0.1% |
| AC 16 / d8 / +5 / +0, HP 1 | 1.0 | 2.0, by round 1 (exact 1/2 tie) | >99.9% |
| AC 20 / d4 / +20 / −5, HP 500 | 15,215 (15,200) | 16,016, over 1,000 | 0%, round 167 |

Worst `killView` cold build in the Node probe: 8.9 ms (the first table, JIT warm-up included). Later attack keys took 0.6–6.6 ms, and HP lookups on a cached key took about 0.2 ms.

## Self-test timing (Node, three interleaved runs, `st-ms.cjs`)

| Round | pre-05-01.html | index.html (after Task 3) |
|---|---|---|
| 1 | 214.7 ms | 200.1 ms |
| 2 | 184.8 ms | 193.8 ms |
| 3 | 185.0 ms | 187.1 ms |

- The new page's median is 193.8 ms, which is not above 200 ms, so the self-test keeps the two Task 1 kill checks. The HP 45 and edge pins live only in the Chrome UI smoke.
- The cost is about +3 to +9 ms, from building the default kill table once.
- The final check-engine run reported 195.1 ms (one earlier run gave a 200.7 ms warning, which is load noise). Chrome's self-test reported 46–71 ms of its 200 ms budget.

## Verification

- `node tools/check-engine.mjs`: CHECK-ENGINE PASS (selftest 257/257, 70,980 combos).
- `node tools/check-page.mjs` passed in all five modes: default `?test`, `--plain`, `--width 390`, `--fault render` and `--fault later`.
- The `--plain` run with the seven `--expect` strings (Enemy HP, Killing a 40 HP enemy, Hits to kill, the two sub-lines, Kill within 20 rounds, fastest possible: round 3) passed.
- Acceptance greps:
  - `function killTable(p)` 1, `KILL_MEDIAN_CAP = 1000` 1, `kill: killView(sv, state.hp)` 1, `function killHitsExact(t, hp)` 1, `const ROUND_WINDOW = 1e-6;` 1
  - `toLocaleString` 0
  - `PRESET_KEYS` unchanged
  - no `Math.random` added
  - `'100%'` appears only in a comment, never as a return value
- A screenshot at 1366px in light mode was inspected: the HP box closes the strip, and the heading and three cards form their own row under the six attack cards. The screenshot was deleted afterwards.

## Deviations from Plan

### Research-adopted deviations from 05-UI-SPEC (recorded as the plan requires)

1. **Thinning DP instead of the round-by-round DP** for the median, P10 and P20. It keeps cap 1,000 inside the frame budget, and the round DP stays in check-engine as the oracle (05-02). This falls under the CONTEXT discretion "DP cutoff or tail method".
2. **Float plus an exact BigInt tie-break** within `ROUND_WINDOW = 1e-6` display units of a .5 boundary (`roundKill`). The AC 25 / d4 HP 114 case prints 23.2, not 23.3.
3. **Median tie rule `>= 0.5 − 1e-9`** (`KILL_TIE_EPS`), so AC 16 / +5 at HP 1 reads "by round 1".
4. **Memo per (hitFaces, die, dmg) covering HP 1..500** (an LRU of 8 tables) instead of per (ac, die, atk, dmg, hp). An HP edit or an N drag is a lookup.
5. **The approved percent rule is kept** as written. For example, p in [0.0095, 0.01) prints `1.0%` (RESEARCH A5).

### Executor notes

1. **[TDD RED] 3 of the 8 edge rows already passed at RED:** 500 HP, nat-20 only, and the exact 1/2 median tie. Task 2 had copied `killTable` verbatim, tie epsilon included, and Task 2's interim whole-percent format happens to print `0%` / `5%` there. The other five rows failed for the expected reasons: every-hit-kills wording, the percent rule, past-cap wording and grouping, and the tie-break. All eight pass at GREEN.
2. **Self-test pin names:** the plan's single check name 'kill: raw engine values at the defaults' became five checks with suffixes (hits, rounds, p20, p10, median), so a failure names the value.
3. **LRU eviction order:** the oldest entry is evicted before inserting when the size is already 8. The map never holds more than 8, which is the same bound as "evict when size exceeds 8".
4. **Comment wording:** the `group3` comment says "a locale-aware format" instead of naming `toLocaleString`, so the acceptance grep (`toLocaleString` count 0) holds.

No Rule 1–4 fixes were needed, and there were no auth gates.

## Known Stubs

None. `h2#kill-h` and the card spans are empty in the markup, the same as every other stat card. The first guarded render fills them from `view.kill`.

## TDD Gate Compliance

Task 3 (`tdd="true"`): RED commit `f1f7704` (test), then GREEN commit `0e342a0` (feat). No refactor was needed.

## Commits

| Task | Commit | Message |
|---|---|---|
| 1 | a542c98 | test(05-01): failing checks for the Enemy HP box and kill cards |
| 2 | 6c7b85e | feat(05-01): Enemy HP box and exact kill cards |
| 3 RED | f1f7704 | test(05-01): failing edge checks for kill card wording and rounding |
| 3 GREEN | 0e342a0 | feat(05-01): exact tie-safe kill rounding and edge wordings |

## Self-Check: PASSED

- FOUND: index.html, tools/check-page.mjs, and .planning/phases/05-hits-to-kill/05-01-SUMMARY.md
- FOUND: commits a542c98, 6c7b85e, f1f7704 and 0e342a0
- No tracked files were deleted between db78df3 and HEAD. origin/main is still 067d266.
