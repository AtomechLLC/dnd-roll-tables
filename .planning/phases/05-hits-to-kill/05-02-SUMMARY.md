---
phase: 05-hits-to-kill
plan: 02
subsystem: kill-math
tags: [kill-note, exhaustive-proof, check-engine, oracles]
requires:
  - VM.killViewFrom / killView, DiceMath.killTable / killHitsExact (05-01)
  - VM.statsView hitPct and exact numerators
provides:
  - "VM.killViewFrom(...).note: three sentences built only from the card strings"
  - "p#kill-note.explain.kill-note in #stats: full row below 64rem, beside the kill cards at >= 64rem"
  - "check-engine K1..K6: round-DP and BigInt oracles over 2,470 keys x HP 1..500, note claims at all 70,980 settings"
affects:
  - 05-03 (the hits line and step buttons can reuse kSimple-style integer checks and the K section's per-key oracle arrays)
  - 05-04 (the kill roll; check-engine runtime is now about 113 s)
tech-stack:
  added: []
  patterns: [copy built only from card strings, independent exact oracles in the dev check, count pins, mutation proof]
key-files:
  created: []
  modified: [index.html, tools/check-engine.mjs]
decisions:
  - "The note's numbers are the card strings themselves (ehText, simpleText, sv.hitPct, erText), so D-07 holds by construction; check-engine still proves them against its own oracles"
  - "The .kill-note base rule sits after .explain, not after #stats > .stats-h: at equal specificity .explain's bottom margin would otherwise win"
  - "Displayed E[H] can equal displayed simple division at the whole-number scale (6 pairs, all >= 1,000); K4 counts and pins them, and the note's tie branch covers them"
  - "The killTable timing uses the faster of 2 builds per key, in a pass before the BigInt oracles, so GC pauses do not pose as slowdowns"
metrics:
  duration: 23 min
  completed: 2026-09-28
  tasks: 3
  files: 2
---

# Phase 5 Plan 02: Kill note and exhaustive kill proofs Summary

A three-sentence note now sits beside the kill cards (under them on phones). It explains why simple division undersells the hit count: the last hit's damage past 0 is wasted. At the defaults it reads "Simple division (40 HP ÷ the average hit) says 8.1 hits, but the exact average is 8.7. ... the kill takes 15.8 rounds on average." Behind the note, check-engine checks every kill card number and every note number against its own oracles, which share no code with the page's thinning DP. It covers every attack key × HP 1..500 (1,235,000 pairs) and all 70,980 settings over an HP sample (1,403,825 note checks). Three deliberate mutations show that the checks catch errors.

## Pre-change references

- HEAD before any edit: `a766438` (05-01 docs). `origin/main` is `067d266` before and after; nothing was pushed.
- The scratchpad holds `pre-05-02.html`, a copy of index.html at a766438, used for the timing comparison. It is not in the repo.

## What was built

**Task 1: the kill note (KILL-04, D-07)**
- `killViewFrom` adds `note`, which is S1 + S2 + S3 joined with single spaces.
  - S1 chooses "but the exact average is" or "and the exact average rounds to the same" by string equality of `ehText` and `simpleText`.
  - S2 states the mechanism only ("whatever that last hit deals past 0 is wasted"). It makes no frequency claim, and "usually overshoots" appears 0 times.
  - S3 uses `sv.hitPct` and `erText`.
- Markup: `<p class="explain kill-note" id="kill-note">` comes after the third kill card and before the formulas card.
- CSS:
  - `.kill-note { grid-column: 1 / -1; margin: 0; }`
  - At `@container page (width >= 64rem)`: `.kill-note { grid-column: 4 / -1; grid-row: span 3; align-self: start; padding-top: var(--sp-3); }`
- `renderStats` writes the note through `setText(killNoteEl, k.note)` (textContent only, T-05-05).
- Self-test: one O(1) pin, `kill: default note`, a memo hit (258 checks now).
- UI smoke `kill note ui` has 25 checks:
  - the full default note, HP 1 sentence 1, AC 25 / d12 sentence 3, and the grouped `1,296` at AC 15 / d4 / −5
  - at five settings (defaults, HP 1, HP 500, AC 25 / d12, AC 15 / d4 / −5), the note's E[H], simple, percent and E[R] read back from the DOM equal `#stat-khits`, the simple number in `#stat-khits-sub`, `#stat-hit` and `#stat-krounds`
- Screenshots were inspected and then deleted:
  - 1366px light: the note sits in columns 4–6 beside the three cards, with its first line level with the card labels.
  - 360px dark: the note is a full row under the cards.

**Task 2: K1..K5 in tools/check-engine.mjs (KILL-03, D-05, D-06)**
- Keys:
  - One pass collects the 2,470 `(hitFaces, die, dmg)` keys and keeps the first p seen for each.
  - It builds its own `killTabs` Map and calls only the pure `VM.killViewFrom`. `VM.killView(` appears 0 times in the file.
- Own weights come from `DiceMath.outcome` / `damageFor`, as in dist20Of. hitPmf is never used. The hit-weight sum equals `hitFaces × X²`, and misses deal 0.
- Oracles:
  - A round-by-round float DP over cumulative damage 0..499 plus an absorbing ≥ 500 bucket. Suffix sums give P(dead by t) for every HP, and a forward pointer finds the medians with `>= 0.5 − 1e-9`, capped at 1,000.
  - An independent per-round E[R] recursion.
  - The BigInt `N_n` recurrence gives exact E[H] and E[R] tenths or whole values, formatted with a local formatter (`Intl.NumberFormat('en-US')` for commas).
- K3 recomputes each near-1/2 P with a BigInt round DP over `(20X²)^t`.
- K5 pins at AC 15 / d8 / +5 / +0, HP 40, all from the oracles:
  - average hit 4.909, simple 8.148, exact E[H] 8.700
  - median hits 9 (from a hit-count DP), minimum hits 3
  - per attack 2.70, simple rounds 14.81, exact E[R] 15.818
  - median round 15, minimum round 3
  - P20 0.8466, P10 0.1114
- The research counts are pinned as equality checks under their K key.
- A timing line `killTable worst … ms over 2470 keys` becomes a WARNING above 8 ms and never fails the run.

**Task 3: K6 and the mutation proof**
- Wald: `N_n × A > hp × cⁿ × den` in BigInt at all 1,235,000 pairs. This is sentence 2's claim, true everywhere.
- The note loop covers all 70,980 settings × the HP sample {1, 2, 3, 5, 40, 45, 100, 499, 500, 1..3 + D, 20 × (2X + D) and +1, m × step − 1..+1 for m = 1..3}, clamped and deduplicated: 1,403,825 checks.
- Each note must match a full-structure regex. Then:
  - both HP mentions equal hp
  - `says … hits` equals the integer simple division
  - the S1 branch follows the oracle strings
  - E[H] and E[R] equal the exact oracles
  - the percent equals hitFaces × 5
  - all four numbers also equal the cards
- Branch counts: "but" 1,403,825, tie branch 0.

## Self-test timing (Node, `st-ms.cjs`, three interleaved rounds, two sets)

| Round | pre-05-02.html | index.html (after Task 1) |
|---|---|---|
| 1 | 203.9 / 209.3 ms | 202.4 / 204.3 ms |
| 2 | 195.6 / 204.5 ms | 193.8 / 197.4 ms |
| 3 | 193.1 / 189.4 ms | 196.1 / 194.5 ms |

The medians are 196.1 and 197.4 ms after the change, against 195.6 and 204.5 ms before. The O(1) note pin adds no measurable cost, and the median is not above 200 ms, so no fallback was applied. Chrome's self-test ran in 44–72 ms of its 200 ms budget.

## Counts vs the research counts

| Count | Research | This run | Note |
|---|---|---|---|
| Past the median cap | 40,163 | 40,163 | match |
| Every hit kills | 22,055 | 22,055 | match |
| Simple under 0.1 | 539 | 539 | match |
| p20 truncated to 0 where a kill is possible | 190 | 190 | match |
| BigInt fallbacks | 1,523 | E[H] 1,523 + E[R] 4,897 (6,420 pairs, one call each) | The research's 1,523 counted E[H] only. |
| Float-only tenths mismatches | 590 / 1,259 | E[H] 559 / E[R] 1,195 (1,160 at the displayed scale) | These values sit at exact .x5 ties, so the float's side depends on operation order. The research's prototype float path differed slightly from the shipped `killTable` / `20 * eh / hf`. The shipped values are pinned. After the fallback, 0 values are displayed wrong (K2). |
| Near-ties (\|P − 1/2\| < 1e-9 at the median step) | 657, t ≤ 5 | 1,424, of which 878 land below 1/2 in the float; all exact; max t 5 | The research counted in the thinning float, and this check uses the round-DP float. Which exact 1/2 ties land a hair below or above 0.5 depends on summation order. Every one is an exact 1/2 in BigInt. |
| Smallest non-tie gap | ~1e-7 | 1.62e-8 | Still 16× above the 1e-9 epsilon, and K1 shows the page and oracle medians agree everywhere. |
| Whole-number display ties, E[H] = simple | (claimed 0) | 6 | See deviation 1. |
| 0% (fastest past round 20) | — | 229,900 | new pin |

K1's worst E[R] relative gap is 1.6e-14, against a tolerance of 1e-9. K1's p10 and p20 match within 1e-12.

## Runtime

- `node tools/check-engine.mjs`: about 113 s in total. The sweep takes about 44 s and the kill section 66 s, of which K6's 1.4M note checks are about 30 s. RESEARCH expected about 65 s. It is accepted under T-05-07 because the tool is dev-only.
- killTable worst time (faster of 2 builds per key):
  - in the suite: 7.4 ms on the final run and 8.6 ms on one run (WARNING, not a failure)
  - in isolation (a scratch script over all keys): 6.6–7.4 ms, under the 8 ms line
  - The in-suite overshoot comes from heap and machine load.

## Mutation proof (scratch copies in the session scratchpad, deleted afterwards)

| Mutation | Check that bites | Failures |
|---|---|---|
| 1. Note S3 prints `ehText` instead of `erText` | K6 | 1,393,178 (the in-page `kill: default note` pin also fails). The 10,647 sampled pairs that pass are at hitFaces 19, where E[R] = 20/19 × E[H] rounds to the same string. |
| 2. `killNumText` uses `Math.round(10 * x)` with no exact fallback | K2 | 1,719 (= 559 + 1,160 displayed-scale mismatches); K6 also shows 1,089 |
| 3. Median test `>= 0.5` without the epsilon | K1 | 830 (K4 also shows 830 through the median sub-line) |

`git status --porcelain` was empty after the cleanup.

## Verification

- `node tools/check-engine.mjs`: CHECK-ENGINE PASS. selftest 258/258, K1–K6 ok with 0 failures each, and the timing line was printed.
- `node tools/check-page.mjs` passed in all five modes: default, `--plain`, `--width 390`, `--fault render` and `--fault later`.
- `--plain` with the three default note `--expect` strings: PASS.
- Acceptance greps:
  - index.html: `id="kill-note"` 1, `usually overshoots` 0, and `grid-column: 4 / -1; grid-row: span 3;` at line 653 inside the 64rem block.
  - tools/check-engine.mjs: `VM.killView(` 0 and `killViewFrom(` 1.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Bug in the plan's claim] Displayed E[H] can equal displayed simple division**
- **Found during:** Task 2 (K4).
- **Issue:** The plan required "the displayed E[H] parses strictly greater than the displayed simple number (0 ties or reversals)". There are 6 ties, all at the whole-number scale, e.g. AC 10 / +7 / d4 / −3, HP 441, where both print `1,258`. Exact E[H] is always larger (Wald, proven in K6), and both strings are correctly rounded (K2 and the integer simple check pass). No number is wrong. The page's note already has the "rounds to the same" branch for this case.
- **Fix:** K4 lets E[H] equal simple only when both are whole-number displays (≥ 1,000), counts those ties and pins them at 6. Every other pair must be strictly greater. The K4 name now says "displayed E[H] > simple except pinned whole-number ties". index.html did not change.
- **Commit:** 803ce45

**2. [Rule 1 - CSS cascade] .kill-note base rule placement**
- **Found during:** Task 1.
- **Issue:** The plan put `.kill-note { … margin: 0 }` after `#stats > .stats-h` (line 170). `.explain` is defined later (line 554) with equal specificity, so its bottom margin would have won.
- **Fix:** The base rule now sits right after `.explain` / `.chart-explain .explain`. The 64rem rule stays inside the container block as planned.
- **Commit:** da765bf

### Executor notes

1. **K3 uses the round-DP oracle's float P.** The plan said "the page's float P", but `killTable` exposes no per-step P. K1 shows the page and the oracle pick the same median at every pair, so the proof covers the same decisions. Both the median step and the step before (P at round 1,000 for past-cap HP) are checked.
2. **killTable timing** comes from a separate pass before the oracles, and each key counts the faster of 2 builds. The in-suite heap otherwise produced 7.7, 17.1 and 12.6 ms on successive runs. The line still prints the worst key.
3. **Extra breakdown counters:** E[H] and E[R] fallbacks separately, displayed-scale mismatches, and near-ties below 1/2. I added them to explain the research counts, and they are pinned where stable.
4. **The K6 tie-branch count is reported, not pinned** (0 in the sample). The branch itself is checked at every sampled pair against the oracle strings, so the note stays correct if a future sample hits one of the 6 whole-number ties.
5. **Mutation copies** were written to `mut1`..`mut3` (one per mutation, run in parallel) instead of a single `mut/`, each with the same `../index.html` layout.

No Rule 4 decisions and no auth gates.

## Known Stubs

None. `#kill-note` is empty in the markup, like the cards, and the first guarded render fills it from `view.kill.note`.

## Threat Flags

None. The only new DOM write is textContent through setText (T-05-05). Mutation copies lived only in the scratchpad and are deleted (T-05-08).

## TDD Gate Compliance

Task 1 (`tdd="true"`): the RED commit `d8beb6c` (test) came first. The self-test pin and 3+ `kill note ui` checks failed at RED. The GREEN commit `da765bf` (feat) followed, and no refactor was needed.

## Commits

| Task | Commit | Message |
|---|---|---|
| 1 RED | d8beb6c | test(05-02): failing checks for the kill note |
| 1 GREEN | da765bf | feat(05-02): kill note tied to the card numbers |
| 2 | 803ce45 | test(05-02): exhaustive kill proofs K1-K5 against round-DP and BigInt oracles |
| 3 | efcd68e | test(05-02): kill note claims checked against the oracles (K6) |

## Self-Check: PASSED

- FOUND: index.html, tools/check-engine.mjs and .planning/phases/05-hits-to-kill/05-02-SUMMARY.md
- FOUND: commits d8beb6c, da765bf, 803ce45 and efcd68e
- No tracked files were deleted between a766438 and HEAD. origin/main is still 067d266.
