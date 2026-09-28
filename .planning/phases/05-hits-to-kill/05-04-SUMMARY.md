---
phase: 05-hits-to-kill
plan: 04
subsystem: sim-kill-tracking
tags: [simulation, kill-tracking, tally, phase-verification]
requires:
  - Sim.simulate / mulberry32 / sameAttack (Phase 3, unchanged)
  - VM.CONTROL_SPEC.hp and DEFAULT_STATE.hp (05-01); renderHp and the step buttons (05-03)
provides:
  - "VM.killTrack(rounds, hp), VM.killLine(track), VM.tallyEntry(run, hp)"
  - "6-column per-round log: Enemy HP cell, tr.kill ('0 ← killed', 700, 2px ink rule), tr.down ('enemy down', muted), tfoot HP left"
  - "#sim-kill kill line; Roll status + kill sentence; sim.tally holds frozen runs; tally 'total · outcome' joined by '; '"
  - "renderSim in-place re-score keyed by killShown = { runId, hp }: no row rebuild, no stale on HP"
  - "check-engine K8; self-test pins 'kill: hand-made track' and 'kill: line and tally entry'; UI smoke 'sim kill ui' (49 checks)"
affects:
  - Phase 5 verification (this plan closes KILL-05, KILL-06 and the phase)
tech-stack:
  added: []
  patterns: [pure re-scoring of frozen event records, (id, input) render cache with in-place cell updates, layout-stability checks in the smoke]
key-files:
  created: [.planning/phases/05-hits-to-kill/05-04-SUMMARY.md]
  modified: [index.html, tools/check-engine.mjs]
decisions:
  - "Kill tracking lives in VM (killTrack / killLine / tallyEntry), not Sim: #dice-sim and the draw order are byte-identical, and seeds 1 / 5 / 6 still total 47 / 54 / 71"
  - "simStatus keeps its 2-argument form; handleRoll appends ' ' + killLine(killTrack(run.rounds, state.hp))"
  - "The log's Result-column rules are scoped to thead / tbody, because in the tfoot the third cell is HP left ('Total' spans 4)"
  - ".hp-down / .hp-kill use line-height 1, so kill and down rows keep the row pitch and an HP edit never moves the foot"
metrics:
  duration: 21 min
  completed: 2026-09-28
  tasks: 3
  files: 2
---

# Phase 5 Plan 04: The 20-round roll fights the enemy, and Phase 5 verification Summary

The 20-round roll now fights a real enemy. After a roll, a sixth "Enemy HP" column shows the HP left after each round. The kill round is bold with an ink rule and reads "0 ← killed". Later rounds are muted and read "enemy down". The tfoot shows the HP left after round 20, a kill line under the placement line says "Killed in round 15 (9 hits)." (or "Survived with 1 HP left."), and the Roll announcement adds the same sentence. Editing Enemy HP (typed or with the step buttons) re-scores the same dice in place: same run id, same row nodes, never stale. The tally lists each stored run as "71 · killed R15; 54 · killed R11; 47 · killed R16". check-engine K8 proves the re-scoring against an independent walk over 13,725 seeded (run, HP) pairs. Phase 5 is verified below against SC1–SC4, D-01..D-12 and KILL-01..06.

## Pre-change references

- HEAD before any edit: `e64be84` (05-03 docs). `origin/main` is `067d266` before and after (the same hash 05-01 recorded). Nothing was pushed, and no remote or gh command was run.
- Scratchpad copies used for timing: `pre-05-04.html` (index.html at e64be84) and `pre-05-01.html` (`git show db78df3:index.html`, the Phase 5 base). Both were deleted at the end with every other scratch file this plan created.

## What was built

**Task 1: failing checks (RED, 67dbb3b)**
- Self-test section `kill`, two O(1) pins on a frozen 3-round run (hit 5, miss, crit 9):
  - `kill: hand-made track` expects `5,5,0|3|2|0 ; 15,15,6|null|null|6 ; 0,-,-|1|1|0`
  - `kill: line and tally entry` expects `Killed in round 3 (2 hits).|Survived with 6 HP left.|Killed in round 1 (1 hit).|14 · killed R3|14 · 6 HP left`
- Phase 3 `sim log ui` updated in place: the foot total reads `footCells[1]` (with a comment), and `tallyWant` carries the outcomes and the `; ` separator.
- New UI smoke block `sim kill ui` between `sim log ui` and `sim marks ui`:
  - structure: the header, 6 cells per row, the kill cell's `i` and aria-hidden arrow, the down cells, the rows before the kill, the running HP, the tfoot, and #sim-kill with 2 b.num
  - the seed 6 HP 72 / 71 re-score (same id, same row0, not stale)
  - seed 1 at HP 40 / 47 / 48
  - a stale re-score at AC 16
  - the HP 72 tally
  - D-11 marks (15 at HP 40 and at HP 72)
  - the Roll status through held rAF
  - the reset (hidden, empty, 80 row headers)
- check-engine K8: seeds 1..300 at 4 settings × the HP sample, compared with an own `k8Oracle` and own copy templates, plus the 15-cell seeded table as exact kill lines. The suffix is set as `extra.K8` after the block, because `extra` is built before the (q) section.
- RED result:
  - check-page exit 1. The panel showed 33 failures: 2 `kill:`, 2 `sim log ui` (tally text / tally text restored) and 29 `sim kill ui`. The other 17 `sim kill ui` checks were vacuously true with no kill tracking.
  - check-engine failed only on K8 and the two pins.

**Task 2: implementation (GREEN, 362e3c5)**
- VM (after simStatus): `killTrack` verbatim from RESEARCH, `killLine`, `tallyEntry`, all exported. simStatus is unchanged.
- Markup: the intro sentence, `<p id="sim-kill" class="sim-line" hidden>` after #sim-place, and the 6th header `Enemy HP` / `.vh` `Enemy HP left`.
- CSS:
  - `.sim-log` is now 316px, and the 296px comments are updated
  - cell padding is `var(--sp-1)`, and the columns are 36 / 36 / 52 / 60 / 44 / 88
  - new rules: `tr.kill > *` (700 plus an inset 2px ink rule), `tr.down > *` and `tr.down .res-crit` (--ink-muted), `.hp-down` (12px prose italic, nowrap), `.hp-kill i`
  - `#sim.is-stale #sim-kill` is added to the muted list
  - no transitions, no opacity, no new tokens
- App:
  - new `simKillEl` and `killShown` (reset in resetSim and in the no-run branch, which also empties and hides #sim-kill)
  - rollWith pushes the same `fresh` frozen run into `sim.tally` and `sim.run`
  - handleRoll appends the kill sentence
  - logBodyHtml and the tfoot gain a literal `<td></td>`
  - renderSim's per-(run id, HP) pass updates cell 5, the kill / down classes, the foot HP cell and #sim-kill with createElement / replaceChildren. The tally is built from `VM.tallyEntry`.
- `#dice-sim` is byte-identical to e64be84 (checked by extracting the block from both).

**Task 3: verification, and two layout fixes found in the screenshots (c59bb12)**
- See "Deviations" 2 and 3. Both fixes got smoke checks, and a scratch mutation proved each check fails on the old CSS.

## Verification (final state, c59bb12)

| Command | Result |
|---|---|
| `node tools/check-engine.mjs` × 3 (after Task 2) | PASS ×3: 114 s / 112 s / 130 s; Node self-test 200.4 / 197.1 / 198.0 ms (median 198.0); killTable worst 7.4 / 7.4 / 10.9 ms (the last is the usual load WARNING) |
| `node tools/check-engine.mjs` (after the Task 3 fix) | PASS, 125 s, self-test 198.9 ms, selftest 261/261, K1–K8 0 failures, killTable worst 7.6 ms |
| K8 line | `1200 seeded runs x HP sample = 13725 pairs checked: killed 7039, survived 6686, killed in round 20 720; 15 seeded pins` |
| `node tools/check-page.mjs --width 1366` / `--width 390` / `--plain` / `--fault render` / `--fault later` | CHECK-PAGE PASS in all five. The Chrome self-test took 48–78 ms of its 200 ms budget. The panel reads "Self-test passed: 694 of 694 checks". |
| `--width 1366` with the 11 `--expect` strings (Enemy HP, both step labels, the hits line, Killing a 40 HP enemy, both card sub-lines, fastest possible: round 3, the exact average is 8.7, the kill takes 15.8 rounds on average, rounds after a kill still roll) | CHECK-PAGE PASS |
| Acceptance greps | `'sim kill ui: ` lines 49 (≥ 25); `footCells[1]` 1; `sim.tally.join(' · ')` 0; `sim.tally[0] \| 0` 0; `function killTrack(rounds, hp)` 1; `id="sim-kill"` 1 match; `Enemy HP left` 1 |
| `git status --porcelain` | empty (no scratch, mutation or PNG files in the repo) |
| `git rev-parse origin/main` | `067d26635bfab0fef724aad6ed9c326c67cc88a1` (unchanged) |

## Self-test timing (Node, `st-ms.cjs`, interleaved)

| Plan | Before | After | Note |
|---|---|---|---|
| 05-01 | 214.7 / 184.8 / 185.0 ms | 200.1 / 193.8 / 187.1 ms | median 193.8 after |
| 05-02 | 203.9, 209.3 / 195.6, 204.5 / 193.1, 189.4 ms | 202.4, 204.3 / 193.8, 197.4 / 196.1, 194.5 ms | medians 196.1 / 197.4 after |
| 05-03 | 195.8, 195.0 / 190.5, 203.1 / 187.1, 187.5 ms | 202.0, 191.4 / 190.9, 191.4 / 188.7, 198.4 ms | pooled 192.8 → 191.4 |
| 05-04 vs pre-05-04 (two sets) | 197.0, 194.5 / 188.6, 189.0 / 187.3, 187.7 ms | 193.3, 197.1 / 189.0, 191.3 / 187.4, 188.2 ms | set medians 188.6 → 189.0 and 189.0 → 191.3 |
| Phase 5 whole, pre-05-01 vs final (four sets, 12 runs each) | 179.5 … 216.8, median 189.5 ms | 186.3 … 204.9, median 195.8 ms | about +6 ms for the whole phase (the default kill table build) |

The 05-04 pins add no measurable cost. The median is not above 200 ms (Node pooled 195.8, check-engine 198.0 over three runs), so no fallback was needed. The `kill` section holds only O(1) pins, so there were no non-pin kill checks to move out anyway.

## Screenshots (headless Chrome, scratch copies whose init() ends with the listed calls; unrelated sections hidden; a yellow probe line measures overflow, log width, cut headers, row heights and the HP content width; all deleted)

| State | Shots | Observation |
|---|---|---|
| (a) first load | 1366 L/D, 360 L/D | At 1366, one strip row. The control tops are 186 / 185 (range vs box rounding), and the HP box and both step buttons are on the shared line. The kill heading and three cards have the note beside them (probe: `note beside`). At 360, the box is on one line, the two buttons wrap together under it, and the note is under the cards (`note under`). There is no overflow in any shot. |
| (b) HP 1 | 1366 L | `−1 hit (0 HP)` is inert, and the hits line reads ≈ 0.2. The cards read 1.0 "every hit kills (simple division says 0.2)", 1.8 by round 1, and >99.9% round 1. The note is beside the cards. |
| (c) HP 500 | 1366 L | `+1 hit (0 HP)` is inert. The cards read 102.4 (101.9), 186.2 by round 186, and 0% "fastest possible: round 32". |
| (d) step 0, d4 / −4 | 1366 L/D, 360 L/D | Both buttons read `(0 HP)` and are inert. The long hits line wraps to two lines inside the HP group at 1366 and at 360, and the other control tops stay aligned. |
| (e) past the cap, d4 / −5 | 1366 L | `1,296` and "on average; half of fights last over 1,000 rounds" fit the card, as do 712.8 (704.0) and <0.1% round 14. |
| (f) seed 6 killed | 1366 L/D, 360 L/D | The log is 316.0px with 0 cut headers, and "Enemy HP" is right-aligned. Round 15 is bold with the ink rule and reads `0 ← killed`, and rounds 16–20 are muted with "enemy down" (content max 69.3px in the 88px column; the crit words are muted but still bold). The foot reads 71 / 0. "Killed in round 15 (9 hits)." sits under the placement line, and in the 360 stack it comes before the log. There is no overflow at 360. |
| (g) seed 6 at HP 72 | 1366 L/D, 360 L/D | Every row is numeric (71 … 1), with no kill or down rows. The foot reads 71 / 1, and the line reads "Survived with 1 HP left.". The foot sits at the same y as in (f). |
| (h) stale, AC 16 and HP 71 | 1366 L | The whole log and the kill line are muted. Round 18 is bold with its rule, and rounds 19–20 read "enemy down". The caption suffix "(rolled at AC 15, …)", the bold "Settings changed. Roll again to compare." and "Now: expected 49.5 ± 14.1" carry the stale cue in words, so the stale log stays distinct from the down rows. The tally is hidden. |
| (i) tally, seeds 1, 5, 6 | 1366 L | "Last 3 runs at these settings, newest first: **71** · killed R15; 54 · killed R11; 47 · killed R16 (expected 54.0)". The newest total is bold. |

The first shots of (f) showed two faults, both fixed in c59bb12 and then re-shot (see Deviations 2 and 3).

## Phase 5 success criteria (ROADMAP SC1–SC4)

| SC | Proof |
|---|---|
| **SC1** Enemy HP box 40, 1..500; ±1 hit buttons step by the rounded average hit and show the step | Self-test `kill: default steps`. UI smoke `hp ui` (the parse path: 0 → 1, 9999 → 500, '' and '12abc' keep the value) and `hp step ui` (33 checks: clicks, clamps at 3 / 499, inert at the bounds and at step 0, focus kept, labels follow the attack). check-engine K7 (step = the exact rounding = the card rounding at all 70,980 settings; labels, inert flags, hits line and status over 1,403,825 pairs; markup parity). check-page guard (7) (2 enabled .btn-step after init), guard (11) (tab order hp-num, hp-minus, hp-plus), and `--fault render` / `--fault later` (step buttons disabled). Screenshots (a), (b), (c), (d). |
| **SC2** exact cards 8.7 (8.1) / 15.8 by round 15 / 85%, live, no hang or wrong number | Self-test `kill: raw engine values …` (5 pins) and `kill: default cards`. `hp ui` (the HP 45 cards, eight edge rows, moving N leaves the cards alone). check-engine K1 (median / P10 / P20 against a round DP over 2,470 keys × HP 1..500), K2 (card values = exact BigInt rounding), K3 (1/2 ties), K4 (sub-line wording, 0% iff fastest > 20, never 100%) and K5 (the D-05 values). killTable worst 7.4–10.9 ms in Node, warning only. `--expect` card strings. Screenshots (a)–(e). |
| **SC3** the log shows HP per round, the kill round, the kill line; HP edits re-score without staling; the attack still stales | Self-test `kill: hand-made track` and `kill: line and tally entry`. `sim kill ui` (49 checks: column, kill and down rows, tfoot, kill line; HP 72 / 71 keeps the id and row0 and is not stale; the foot does not move; row heights are equal; the attack stales and a stale run still re-scores; the Roll status sentence; the reset). Phase 3 `sim log ui` (stale rules unchanged, foot total at cell 1). check-engine K8 (13,725 pairs plus 15 pins). Screenshots (f), (g), (h). |
| **SC4** tally outcomes; note numbers equal the cards; dev checks and a11y pass with the new controls | `sim log ui` tally text / restored (`71 · killed R15; …`) and `sim kill ui` tally at HP 72 (`71 · 1 HP left; 54 · 18 HP left; 47 · 25 HP left`). K8 tallyEntry at every pair. `kill note ui` (25 checks: the note's numbers read from the DOM equal the cards at 5 settings). check-engine K6 (the note equals the oracles and the cards at 1,403,825 pairs; Wald everywhere). Self-test `kill: default note`. check-page guards (9)–(13) in both modes and the `a11y ui` order. All five check-page modes pass. Screenshot (i). |

## Decisions D-01..D-12

| Decision | Implemented | Checked |
|---|---|---|
| D-01 Enemy HP box 1..500, default 40, same parse path, in the strip | `CONTROL_SPEC.hp`, `DEFAULT_STATE.hp`, `div.group.hp` in `form#controls` (05-01) | `hp ui` parse checks; guard (11); screenshot (a) |
| D-02 one hit = average damage on a hit, crits included (4.91) | `hpStep` from the sv.exact rational (05-03) | K7 (exact = own weights = card = VM); `kill: default steps` |
| D-03 nearest whole HP, clamped, label shows the step, hits line, step 0 honest | `killViewFrom` step fields, `renderHp`, aria-disabled inert (05-03) | `hp step ui`; K7 labels and inert flags; screenshots (b), (c), (d) |
| D-04 three exact cards | `h2#kill-h`, three `.card.kill` (05-01) | `kill: default cards`; `hp ui`; K1, K2, K4 |
| D-05 reference values at 40 HP | `DiceMath.killTable` | the five `kill: raw engine values` pins; K5 |
| D-06 exact DP through the one damage rule, never hang, never wrong | thinning DP plus the exact eHits recursion, cap 1,000, BigInt tie-break (05-01) | K1–K4 against independent oracles; the killTable timing line |
| D-07 designer note, every number equals its card | `killViewFrom(...).note`, `#kill-note` (05-02) | `kill: default note`; `kill note ui`; K6 |
| D-08 all 20 rounds rolled; HP column, kill row, enemy down, result line | `killTrack`, the log column, `tr.kill` / `tr.down`, `#sim-kill` (05-04) | `sim kill ui`; K8; the damage total is unchanged (`sim log ui` foot and damage sum = 71); screenshots (f), (g) |
| D-09 HP never stales; AC / die / bonuses still do; N does not | the `killShown` pass in both states; `Sim.sameAttack` unchanged | `sim kill ui` (same id, same row0, not stale; the foot does not move; AC 16 stales and still re-scores); `sim log ui` (per-key stale, N stays fresh); screenshot (h) |
| D-10 tally with outcomes, re-scored with HP, cleared on an attack change | `sim.tally` holds frozen runs; `tallyEntry`; renderSim tally | `sim log ui` tally checks (hidden on an attack change, reset on a roll at new settings, capped at 5); `sim kill ui` tally at HP 72; K8; screenshot (i) |
| D-11 outcome-table marks unchanged | `Sim.runMarks` untouched | `sim marks ui` (unchanged, 15 marks); `sim kill ui` 15 marks at HP 40 and HP 72 |
| D-12 no kill numbers in the compare tables or chart | nothing added there | `hp ui`: #compare and #chart carry no HP or kill text |

**Claude's Discretion choices recorded:** the presets do not touch HP (`PRESET_KEYS` unchanged); no hits-to-kill line on the formulas card; the kill cards follow the six attack cards under a live heading, with the note beside them at ≥ 64rem; card 3's sub-line is "fastest possible: round N"; "enemy down" is at 12px in an 88px column; the tally separator is `; `; the kill line sits after the placement line (UI-SPEC A6).

## Requirements

- **KILL-01** Enemy HP control. Proven by `hp ui` parse checks, guard (11) and the a11y ui order (05-01).
- **KILL-02** ±1 hit buttons, step shown, hits line, zero-damage safe. Proven by `hp step ui` (33 checks), K7 and guard (7) with the fault modes (05-03).
- **KILL-03** exact cards, no Monte Carlo, no hang or wrong number. Proven by the `kill:` raw pins and `kill: default cards`, `hp ui`, K1–K5 and the killTable timing (05-01, 05-02).
- **KILL-04** designer note, true everywhere, numbers equal the cards. Proven by `kill: default note`, `kill note ui` and K6 (Wald plus note-vs-oracle-vs-card) (05-02).
- **KILL-05** log HP column, kill row, enemy down, kill line, live HP re-score without stale. Proven by `kill: hand-made track`, `kill: line and tally entry`, `sim kill ui`, the updated `sim log ui`, K8 and screenshots (f)–(h) (this plan).
- **KILL-06** tally shows each run's total and outcome, re-scored with HP, cleared on an attack change. Proven by `sim log ui` tally checks, `sim kill ui` tally at HP 72, K8 tallyEntry and screenshot (i) (this plan).

## Deviations adopted from RESEARCH over the UI-SPEC implementation notes (phase level)

1. **Thinning DP instead of the round-by-round DP** for the median, P10 and P20. The round DP is kept as the check-engine oracle (K1).
2. **Float plus an exact BigInt tie-break** within `ROUND_WINDOW = 1e-6` of a .5 display boundary (`roundKill`).
3. **Median tie rule `>= 0.5 − 1e-9`** (`KILL_TIE_EPS`). K3 proves every use is an exact 1/2 tie.
4. **Memoization per (hitFaces, die, dmg)** covering HP 1..500 (an LRU of 8 tables), instead of per (ac, die, atk, dmg, hp).
5. **The approved UI-SPEC percent rule is kept** as written ('0%' only when the fastest kill is past round 20, never '100%').
6. **check-engine runtime grew**, accepted as a dev-only tool (T-05-07). RESEARCH expected about 65 s. The kill section alone is 65–81 s, and full runs take 112–130 s.

## Deviations from Plan (this plan)

### Auto-fixed issues

**1. [Rule 1 - Bug in the planned test] `fmt` stringifies each field**
- **Found during:** Task 1.
- **Issue:** The plan's `fmt(t) = [...].join('|')` turns a `null` killRound or hits into `''` (Array join), so it could never produce the expected `15,15,6|null|null|6`.
- **Fix:** `.map(String).join('|')`, with a comment. The expected string is unchanged.
- **Commit:** 67dbb3b

**2. [Rule 1 - Bug] Foot HP cell took the Result column's rules**
- **Found during:** Task 3, screenshot (f).
- **Issue:** In the tfoot, `Total` spans 4 columns, so the HP-left cell is `td:nth-child(3)` and picked up `.sim-log td:nth-child(3)`: it was left-aligned and in the prose face (it read "71 o").
- **Fix:** Scoped the rules to `.sim-log thead th:nth-child(3), .sim-log tbody td:nth-child(3)`. Added the smoke check `sim kill ui: foot HP cell right-aligned in the number face`. On a scratch copy with the old CSS it failed with `left|false`.
- **Commit:** c59bb12

**3. [Rule 1 - Bug] Kill and down rows were taller than the others**
- **Found during:** Task 3, comparing (f) and (g).
- **Issue:** The mixed-face inline spans (12px prose italic, and prose italic 700) grew the 24px line box, so rows measured 25.0 / 26.0 / 26.5 px. The table grew about 5px when an HP edit created down rows, which moved the foot. That breaks the SC3 "no flicker" intent, even though no rows were rebuilt.
- **Fix:** `.hp-down, .hp-kill { line-height: 1; }`. Added two smoke checks: rows 1–19 have one height (row 20 is excluded because its collapsed bottom border is the tfoot's 2px rule, which was already true before this plan), and the tfoot top is unchanged from HP 40 to HP 72. Without the rule, both fail (`25.0,26.0` and a 5px move).
- **Commit:** c59bb12

**4. [Rule 3 - Blocking] `extra.K8` is set after the K8 block**
- **Found during:** Task 1.
- **Issue:** `extra` is built before the (q) section, and the plan puts K8 after (q). Referencing `k8` inside the object literal would throw a TDZ ReferenceError.
- **Fix:** Assign `extra.K8 = …` right after the K8 block.
- **Commit:** 67dbb3b

### Executor notes

1. **RED check count:** 29 of 46 `sim kill ui` checks failed at RED. The other 17 were true without kill tracking: the same id, row0, not stale, 0 kill or down rows, the D-11 marks, the 80 row headers and the foot total at cell 1.
2. **Chrome console capture** printed only the first few `SELFTEST FAIL` lines. I read the full RED list from the `--dump` panel, which is how I confirmed the failures were only the expected names.
3. **Timing:** one check-engine run printed 200.4 ms (load noise, as in 05-01..05-03). The three-run median of 198.0 ms and the 12-run pooled 195.8 ms are both within budget.
4. **Screenshot method:** scratch copies hid the sections unrelated to the state (the page is a one-column grid, so this does not change the shown sections' layout). The 360 px shots used an iframe in a 420px window. The probe line was scratch-only.
5. **The `sim kill ui` block has 49 checks**, more than the plan's list: the three layout checks from deviations 2 and 3, and split checks so that each failure names one value.

No Rule 4 decisions, no auth gates, and no package installs.

## Known Stubs

None. `#sim-kill` is empty and hidden in the markup, like the other run lines, and renderSim fills it once a run exists. The log's HP `<td></td>` literals are filled by the same frame's re-score pass.

## Threat Flags

None. The only new innerHTML content is a fixed `<td></td>` literal (T-05-14). The HP cells, kill cell, #sim-kill and tally use createElement / textContent / replaceChildren. state.hp is already clamped by parseControl (T-05-15). `#dice-sim` is untouched, and check-engine gate 0 still passes with one Math.random (T-05-16). Nothing was pushed (T-05-18).

## Commits

| Task | Commit | Message |
|---|---|---|
| 1 | 67dbb3b | test(05-04): failing checks for kill tracking in the 20-round roll |
| 2 | 362e3c5 | feat(05-04): the 20-round roll tracks the enemy's HP and re-scores live |
| 3 | c59bb12 | fix(05-04): log foot HP cell alignment and steady row height |

## Self-Check: PASSED

- FOUND: index.html, tools/check-engine.mjs and .planning/phases/05-hits-to-kill/05-04-SUMMARY.md
- FOUND: commits 67dbb3b, 362e3c5 and c59bb12
- `'sim kill ui: '` lines 49, `footCells[1]` 1
- No tracked files were deleted between e64be84 and HEAD. origin/main is still 067d266.
