---
phase: 05-hits-to-kill
reviewed: 2026-09-28T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - index.html
  - tools/check-engine.mjs
  - tools/check-page.mjs
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-09-28
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

I reviewed the Phase 5 diff (`a542c98^..HEAD`) in `index.html`, `tools/check-engine.mjs` and `tools/check-page.mjs`, using 05-CONTEXT, 05-UI-SPEC and the 05-0x SUMMARY deviations as the intended behavior. I also ran both suites and wrote four scratch scripts:

- `node tools/check-engine.mjs`: PASS. K1–K8 have 0 failures. It prints `WARNING: killTable worst 8.6 ms` and the self-test takes 195.4 ms of its 200 ms budget.
- `node tools/check-page.mjs`: PASS.
- A scan of all 2,470 keys × HP 1..500 for how close `p20` gets to each percent rounding boundary and threshold.
- A timing of `computeView` while AC and damage are dragged.
- A timing of the BigInt tie-break fallback in the render path.
- A search for the note's tie-branch pairs.

The exact kill math holds up:

- The `killTable` thinning DP, the `eHits` recursion, the BigInt tie-break in `roundKill` and the median tie rule are all proven exhaustively against independent oracles (K1–K3). I found no card, sub-line, step label or hits-line string that disagrees with the exact value.
- `p20` never comes closer than 9.1e-7 to a displayed percent rounding boundary, and never closer than 2.5e-8 to a format threshold. Both gaps are far larger than the float error.
- innerHTML sinks carry only `| 0` integers and fixed literals.
- The re-score path does not re-roll, keeps the `Sim` draw order unchanged, and never stales on HP.

The defects are elsewhere:

- Two live regions go on stating HP claims after HP changes, which breaks the D-09 "re-score everything" contract for screen-reader users.
- One reachable copy branch of the note is never exercised by any check.
- The phase's own performance gates are over budget but only warn.
- Some smaller check and code-quality gaps.

## Warnings

### WR-01: The Roll status keeps a kill sentence that goes false after an HP edit

**File:** `index.html:3337` (written), `index.html:3449-3483` (the re-score pass skips it)
**Issue:** `handleRoll` appends `VM.killLine(VM.killTrack(run.rounds, state.hp))` to `#sim-status`, for example "… Killed in round 15 (9 hits)." D-09 says an HP edit re-scores the same rolls live, and the re-score block rewrites the HP cells, the `kill` / `down` classes, the foot cell, `#sim-kill` and the tally. It never touches `#sim-status`, and nothing ever clears it. Before Phase 5 this region only described the roll, which cannot become false. Now it holds an HP-dependent claim.

Example: roll seed 6 at HP 40, then set HP to 72. The log and `#sim-kill` say "Survived with 1 HP left." The `role="status"` region, which a screen reader reaches in browse mode, still says "Killed in round 15 (9 hits)." Phase 4 fixed the same class of bug for `#explore-status` (render() clears it once the settings no longer match, `index.html:3028`).
**Fix:** Tie the kill part of the status to the HP it was rolled against, and drop it when HP moves on. For example, keep `sim.statusHp = state.hp` in `handleRoll` and add this to `renderSim`:
```js
if (sim.statusHp !== undefined && sim.statusHp !== state.hp && simStatusEl.textContent !== '') {
  simStatusEl.textContent = '';   // the kill sentence no longer matches the re-scored run
  sim.statusHp = undefined;
}
```
You could also keep the kill sentence out of the status altogether, since `#sim-kill` carries it. Add a smoke check: roll, change HP, then assert `#sim-status` does not contain a stale "Killed in round".

### WR-02: `#hp-status` outlives the HP and attack it announced

**File:** `index.html:3082-3093`
**Issue:** An active step click writes "Enemy HP 45: about 9.2 average hits." into `#hp-status`. Nothing clears it afterwards: typing a new HP, a later attack change, or a preset all leave it alone. `.vh` text is still read in screen-reader browse mode, and it sits right after the hits line. So after typing HP 100, or after switching to d12, the region states an HP and an average-hits figure that disagree with the box, the hits line and the Hits card. That breaks the Phase 4 D-04 "a number never disagrees with a card" rule. `#explore-status` has exactly this guard (`lastPreset` comparison in `render()`, `index.html:3028`), but `#hp-status` was given none.
**Fix:** Record what was announced and clear it once it stops matching:
```js
// module scope
let lastHpStatus = null;          // { hp, key } of the announced state
// onStepClick, after setState:
lastHpStatus = { hp, key: `${state.ac},${state.die},${state.atk},${state.dmg}` };
// render(), next to the preset check:
if (lastHpStatus && (state.hp !== lastHpStatus.hp ||
    `${state.ac},${state.die},${state.atk},${state.dmg}` !== lastHpStatus.key)) {
  lastHpStatus = null;
  setText(hpStatusEl, '');
}
```
Add a smoke check: click +1 hit, type another HP, then assert that `#hp-status` is empty.

### WR-03: The note's "rounds to the same" branch is reachable but never checked

**File:** `index.html:2089-2091`, `tools/check-engine.mjs:1563` (K6 HP sample), `tools/check-engine.mjs:1604`
**Issue:** K4 counts and pins 6 whole-number display ties where E[H] and the simple division print the same number. One is AC 10 / +7 / d4 / −3 at HP 441, where the page renders "…says 1,258 hits, and the exact average rounds to the same 1,258." K6 is the only check that verifies the note's claims against the oracle, but its HP sample never reaches any of those 6 pairs. It reports `tie branch 0`, and 05-02 deviation 4 chose to report that count rather than pin it. No in-page smoke reaches the branch either. So a shipped, reachable copy branch is verified only by construction (`ehText === simpleText`). Nothing checks that its wording and numbers match the oracle, which goes against the 04-REVIEW-FIX rule that claims are checked against the engine.
**Fix:** In K4, record the tie pairs (`{ p, hp }`). After the K6 loop, run the K6 note assertions on exactly those pairs and pin `kc.noteSame === 6`. Or add `hp` values from the tie list to `hps` for the matching settings. Also add one `hp ui` smoke row, `show({ ac: 10, atk: 7, die: 4, dmg: -3, hp: 441 })`, that asserts sentence 1 of the note.

### WR-04: The performance gates are over budget and only warn

**File:** `tools/check-engine.mjs:1849`, `tools/check-engine.mjs:1853`, `index.html:1986`
**Issue:**
- In this review's run, check-engine printed `WARNING: killTable worst 8.6 ms … (budget 8 ms in Node)` on key `11,10,-5` and still exited PASS. The summaries record 10.9 ms on another run, and a 200.4 ms / 200.7 ms Node self-test against its 200 ms budget. Every one of these was written off as "load noise".
- UI-SPEC's Performance row says to lower `KILL_MEDIAN_CAP` (1000 → 500 → 200) when the table build blows the frame budget. The phase set its own proxy for that at 8 ms in Node, crossed it, and applied no fallback.
- In the page, any attack change builds a new 2,470-key-class table. My timing: `computeView` peaks at 8.6 ms while damage is dragged on a d12, before any DOM work. The table LRU holds 8 keys, but an AC drag walks up to 19 `hitFaces` values, so dragging back and forth rebuilds tables on every frame.
- The self-test now sits at 195 ms of 200, so it has no headroom left for any future pin.

A gate that fails on most runs and only prints a warning has stopped doing its job.
**Fix:** Do one of these, and record the choice:
- Make the gate real: fail check-engine when the best-of-N `killTable` time is above a budget chosen with measured headroom, for example 12 ms best-of-3.
- Apply the UI-SPEC fallback, or cut the median loop's work. For example, stop the `open` scan at the current HP's median, and compute the other HPs' medians lazily on the first HP edit.

For the self-test, move the `killTableFor` build out of the timed section, or reuse the table that the first render warms, so the 200 ms budget measures the checks and not a 5–8 ms DP.

## Info

### IN-01: The Kill-within-20 percent has no exact rounding proof; K4 compares two floats through a copied formatter

**File:** `index.html:2022-2029`, `tools/check-engine.mjs:1221-1227`, `tools/check-engine.mjs:1456`
**Issue:** The Hits and Rounds card values get a BigInt tie-break (`roundKill`), and K2 proves them exactly. The percent card rounds a float with `Math.round`. K4 then checks it with `kPct`, a line-for-line copy of `pctText`, applied to the round-DP float. That proves P20 agrees across two float methods. It does not prove the displayed rounding is right at a `.5` boundary. There is no wrong output today: my scan found the closest `p20` to a whole-percent `.5` boundary is 9.1e-7 away (key `19,6,5`, HP 154), and the closest to a format threshold is 2.5e-8 (0.001, key `5,8,7`, HP 149). But nothing pins those gaps, so a future engine change could land on a boundary without any check noticing.
**Fix:** In K4, track the smallest distance from `100·p` / `1000·p` to a `.5` boundary and from `p` to 0.001 / 0.01 / 0.99 / 0.999. Assert that it stays above 1e-9, the same way K3 handles the median ties. Past that line, add a BigInt check.

### IN-02: The percent format flips between "1.0%" and "1%", and between "99%" and "99.0%"

**File:** `index.html:2025-2028`
**Issue:** For p in [0.0095, 0.01), the p < 0.01 branch prints "1.0%", but p = 0.01 prints "1%". For p in [0.985, 0.99) the card prints "99%", but p = 0.99 prints "99.0%". My scan counted 2,063 setting × HP pairs that render "1.0%" or "99.0%". Every string is correctly rounded, but a designer stepping HP sees 1% → 1.0% → 0.9%, which looks like a jitter in precision.
**Fix:** Pick the branch from the rounded value, for example `const t = Math.round(p * 1000); if (t < 10) …` and `if (t >= 990) …`, the same way `killNumText` picks its format from the rounded tenths.

### IN-03: Dead exports, and check-engine hard-codes the engine's constants

**File:** `index.html:1319`, `index.html:2217`, `tools/check-engine.mjs:1200-1202`
**Issue:** Nothing outside their own block uses `VM.roundKill`, `VM.group3`, `VM.killNumText`, `VM.pctText`, `DiceMath.KILL_TINY` or `DiceMath.KILL_TIE_EPS`, and check-engine only names `DiceMath.hitPmf` in a comment. At the same time, check-engine re-declares `K_CAP = 1000`, `K_EPS = 1e-9` and the past-cap sentence as literals instead of reading `DiceMath.KILL_MEDIAN_CAP` / `KILL_TIE_EPS`. If you apply UI-SPEC's cap fallback, three check-engine edits must happen in lockstep, and a missed one shows up as thousands of K1 median mismatches rather than one clear message.
**Fix:** Drop the unused exports, or test `pctText` / `killNumText` directly. In check-engine, derive `K_CAP` and `K_EPS` from `DiceMath`, and build `K_PAST_CAP` from `K_CAP`. Keep one separate assertion that pins the cap at its UI-SPEC value.

### IN-04: The BigInt tie-break runs up to four times per view

**File:** `index.html:2015-2018`, `index.html:2065-2066`
**Issue:** `exR` calls `exH()` again, and `killNumText` can call `exact()` a second time at the whole-number scale. So one `killViewFrom` can run `killHitsExact` (O(hp · K) on ~5,700-bit integers) up to four times. My worst measured `killViewFrom` with the fallback was 4.4 ms (key `3,12,13`, HP 482). That is inside the frame, but it is avoidable.
**Fix:** `let ex; const exH = () => (ex ??= DiceMath.killHitsExact(T, hp));`

### IN-05: K8 rebuilds the page's templates and mirrors `killTrack`

**File:** `tools/check-engine.mjs:1753-1769`
**Issue:** `k8Line` and `k8Entry` are verbatim copies of `VM.killLine` / `VM.tallyEntry`, and `k8Oracle` is the same loop as `killTrack` with the comparison inverted. So K8 checks that two copies of the same code agree. It does not check the claims from a different angle. The seeded pins are the only independent evidence.
**Fix:** Also assert invariants that do not reuse the algorithm:
- `cum(K − 1) < hp <= cum(K)`
- `hits` equals the count of `result !== 'miss'` in rounds 1..K
- `left === max(0, hp − run.total)`
- Every non-null `hpAfter[i]` equals `max(0, hp − cum(i + 1))`

Parse the numbers back out of the line with a regex rather than rebuilding the whole string.

---

_Reviewed: 2026-09-28_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
