---
phase: 05-hits-to-kill
fixed_at: 2026-09-28T14:12:48Z
review_path: .planning/phases/05-hits-to-kill/05-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 5: Code Review Fix Report

**Fixed at:** 2026-09-28T14:12:48Z
**Source review:** .planning/phases/05-hits-to-kill/05-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (WR-01..WR-04; IN-01..IN-05 out of scope)
- Fixed: 4
- Skipped: 0

Final state, all passing: `node tools/check-engine.mjs` (selftest 261/261, K1-K9 0 failures, 2 min 8 s) and `node tools/check-page.mjs` in default, `--plain`, `--fault render`, `--fault later` and `--width 390` modes. Nothing was pushed.

## Fixed Issues

### WR-01: The Roll status keeps a kill sentence that goes false after an HP edit

**Files modified:** `index.html`
**Commit:** 54f47a0
**Status:** fixed: requires human verification (live-region behavior; confirm with a screen reader)
**Applied fix:** `handleRoll` now records the HP the kill sentence was scored at in a module-level `rollStatusHp`. The error sentence makes no HP claim, so it records `null`. `render()` clears `#sim-status` silently once `state.hp` differs, next to the `lastPreset` guard. It uses `setText(..., '')`, so nothing is announced, which keeps the UI-SPEC rule that HP re-scoring stays silent. Going back to the rolled-at HP by hand does not bring the sentence back. The queued status write is dropped if an HP edit lands in the same frame. This is the same guard `applyPreset` uses. `resetSim` also resets the record. New `sim kill ui` smoke checks roll seed 6 at HP 40 and then:
- move HP to 72: the status is empty and the record is null
- return to HP 40: the status stays clear
- change HP in the roll's own frame: the kill sentence is dropped and the log still re-scores

On a scratch copy without the guards, 4 of these checks failed. With only the write guard removed, the same-frame check failed.

### WR-02: `#hp-status` outlives the HP and attack it announced

**Files modified:** `index.html`
**Commit:** 128d8ba
**Status:** fixed: requires human verification (live-region behavior; confirm with a screen reader)
**Applied fix:** `onStepClick` records a frozen `{ac, die, atk, dmg, hp}` in `lastHpStatus`. `render()` clears `#hp-status` silently once any of those keys stops matching. That covers a typed HP, an attack change and a preset. This is the `lastPreset` / `#explore-status` pattern. The queued write is now guarded by `lastHpStatus === announced` instead of `state.hp === hp`, so an attack change in the click's frame also drops the write. The smoke's `finally` resets the record. New `hp step ui` checks:
- a typed HP clears the status and the record
- an attack change clears the status
- going back to the announced values by hand leaves it clear
- an attack change in the click frame drops the write

On a scratch copy with the old guard and no render check, 5 of these failed. Typing and slider drags still never announce.

### WR-03: The note's "rounds to the same" branch is reachable but never checked

**Files modified:** `tools/check-engine.mjs`, `index.html`
**Commit:** 46bd9b7
**Applied fix:**
- K4 now records its 6 whole-number display ties, as `key|hp` pairs and as HPs per key.
- K6 adds those HPs to the HP sample of every setting with the same key. The existing note assertions, checked against the oracle and the cards, now run there, and so does K7.
- K6 requires that the set of pairs taking the "rounds to the same" branch equals the K4 tie set exactly. Result: 469 same-branch notes at the 6 ties over 2 keys. Before this fix the count was 0.
- A pin at AC 10 / +7 / d4 / -3, HP 441 checks the claim against the exact BigInt rationals from `exactOracle`, not a rebuilt string. The note must parse to the same branch. Simple division `hp*den/A` and exact E[H] `N/c^n` must both round half up to the printed 1,258. Exact E[H] must still be strictly above simple division.
- The `kill note ui` smoke asserts sentence 1 at that setting and that it agrees with the cards.

In a mutation test, the tie-branch number was corrupted. The new checks produced 470 K6 failures. The old sample would have passed that mutation. Nothing was added to the in-page self-test.

### WR-04: The performance gates are over budget and only warn

**Files modified:** `tools/check-engine.mjs`, `index.html`
**Commit:** e480a2c
**Applied fix:** I measured first, then made the gate a real check. The measurement did not justify the cap fallback.

Measurements on 2026-09-28, this machine. Chrome runs headless with `--disable-gpu` at 1366 px, via a scratch probe appended to a copy of the page. It uses plain mode, direct `render()` calls, and forced layout via `offsetHeight`.

| What | Chrome | Node |
|------|--------|------|
| `killTable` per key, all 2,470 keys | p50 1.0, p99 4.5, max 10.1 ms (best of 2; 1 key over 8 ms) | best of 3: p50 1.5, p99 4.4-5.4, worst 6.4-8.0 ms (3 runs) |
| Slowest `killViewFrom` over key x HP (BigInt fallback) | 2.8-3.5 ms (3,12,13 HP 495; 3,12,3 HP 490) | 3.3-4.0 ms |
| Kill view = table + slowest view, worst key | 4.8-6.7 ms | 6.4-8.6 ms; K9 in-suite 8.5 ms (16,6,-4) |
| `computeView` during AC / damage drags at HP 500 (LRU misses) | p50 1.2-1.4, p95 3.6-4.1, max 11.6-11.9 ms | - |
| Self-test | 85.4 -> 74.6 ms | 195.3 -> 189.5 ms |

- **Cap:** the UI-SPEC rule says to lower `KILL_MEDIAN_CAP` if the whole kill view takes more than 16 ms. In Chrome its worst case is about 5-7 ms, so the cap stays at 1,000 and no copy or K-series changes were needed. I also skipped IN-04's BigInt cache: the worst view is 3-4 ms, so the measurement does not call for it.
- **Node vs Chrome:** they agree within noise. The old "8 ms in Node is about 16 ms in Chrome" proxy (RESEARCH Pitfall 3) is not supported. That is why the 8 ms warning fired on most runs without any real frame overrun.
- **The new gate, K9 (fails check-engine):** for every attack key, the best of 3 `killTable` builds plus the slowest `killViewFrom` must fit the UI-SPEC's 16 ms frame. The slowest view is found by timing every HP once and re-timing the 3 slowest HPs, best of 3. The worst measured is 8.5 ms, so the gate has about 1.9x headroom. In a mutation test, a 20 ms busy loop in `killTable` for d12 / +13 produced 19 K9 failures. The warning-only 8 ms line is gone; check-engine now prints the section time with the K9 worst. The gate adds about 25-30 s to check-engine (now about 2 min 8 s).
- **Self-test:** the defaults' kill table is warmed into the page memo before `t0`, inside a try/catch. A throw is reported by the `kill` section, which calls `killTableFor` again inside its guard. The 200 ms budget now times the checks, not a cold 5-9 ms DP. The first render reuses the warmed table as before. No self-test checks were added.

**Observation for the developer (outside WR-04's kill-view scope):** in headless Chrome, a full control-change frame is over 16 ms at p95. That is render plus forced layout: 12.5-12.8 ms p50, 22-25 ms p95, 36-60 ms max over 2,040 drag frames. Style and layout dominate it: 7-8 ms p50, 15-17 ms p95. The kill math is not the cause. The pre-Phase-5 page (db78df3), measured the same way, was already at 8.8 ms p50, 21.1 ms p95 and 61.5 ms max, with layout at 6.3 / 15.9 ms. Phase 5 adds about 1 ms p50 and 3 ms p95 through `computeView`. Headless software rendering may overstate layout, so check it once in a real browser's Performance panel if it matters.

---

_Fixed: 2026-09-28T14:12:48Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
