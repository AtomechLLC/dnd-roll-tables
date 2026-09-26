---
phase: 03-roll-20-rounds-simulation
reviewed: 2026-09-26T18:41:10Z
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

# Phase 3: Code Review Report

**Reviewed:** 2026-09-26T18:41:10Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

I reviewed the Phase 3 changes (d748f2e^..HEAD): the `#dice-sim` block, `DiceMath.spread`, `VM.simExact` / `simPlacement` / `simStatus`, the `#sim` section and `renderSim`, the marks in `renderOutcomeTable`, the WR-01 guarded `init()`, the seeded self-test and UI smoke sections, and the two dev tools. I read these against 03-CONTEXT.md and 03-UI-SPEC.md, so locked decisions (A3 tally/marks restore, the N slider never staling, the nat-20-only lopsided rule) are not reported.

**Verified correct:**
- **Variance math.** Weights are X per normal-hit cell and 1 per crit pair over `den1 = 20·X²`, and `Var20 = (den1·s2 − s1²)/(20·X⁴)`. This matches `20·Var(1)`. check-engine's convolution check and my own convolution over all 2,470 distinct one-round distributions agree.
- **Draw order.** The d20 is drawn first, then 0, 1 or 2 damage dice.
- **`Math.random`.** It appears once, at `onRoll` (index.html:2144).
- **`innerHTML` sinks.** Every one receives only `| 0` integers or fixed literals.
- **Staleness.** It is a pure comparison of the rolled-at and current `ac/die/atk/dmg`.
- **Roll button.** The node is never replaced.
- **Status announcements.** Clearing in the next frame after a click works.

I ran `node tools/check-engine.mjs` (PASS, self-test 245/245 in 188 ms under Node). I also ran `tools/check-page.mjs` in both modes with `--dump` to examine the final DOM.

The main defects:
1. The spread wording boundary uses `< 0` where it needs `<= 0`, so "About 2 runs in 3" is shown where 87% of runs land. The check-engine tolerance appears fitted to admit exactly this case.
2. After the `?test` smoke, the DOM is not back to its load state: hidden leftover run text stays in it.
3. `check-page --expect` matches hidden text, so it cannot catch problem 2 or similar regressions. I confirmed this by running it.
4. The WR-01 guard leaves listeners attached after a failed first render, so later renders run unguarded.

## Warnings

### WR-01: The "About 2 runs in 3" wording appears on a band that starts at the 0 floor and holds 87% of runs; the check tolerance is fitted to that value

**File:** `index.html:1252`, `tools/check-engine.mjs:240` (tolerance), `tools/check-engine.mjs:204` (sampling)
**Issue:** `lopsided = eT - sdT < 0 || s.hitFaces === 1`. When E − SD rounds to exactly 0.0, the non-lopsided sentence is used, but the band is clamped at the floor, exactly as in the lopsided case. Example: at AC 13, −5, d4, −3 the page says "About 2 runs in 3 land between 0.0 and 5.2." The exact 20-round distribution puts **86.9%** of runs in that band, and **25.7%** of runs total exactly 0.

Across all 2,470 distinct one-round distributions (they depend only on hitFaces, die, and dmg), the largest non-lopsided coverage is 0.8692. It comes from this `eT === sdT` boundary case. check-engine (p) accepts the "2 in 3" wording up to 0.87, a limit that sits 0.0008 above that value and appears fitted to it. The low end is also loose: at AC 14, −5, d6, −3, the band holds 60.3% and 23% of runs are 0. Because (p) samples only 1 combo in 53, a regression in these corner cases can pass the check.

**Fix:**
```js
// index.html simExact: the floor case gets the floor wording
const lopsided = eT - sdT <= 0 || s.hitFaces === 1;
```
Then tighten check-engine (p) to a band that honestly means "about 2 in 3" (for example 0.60..0.80). Make (p) exhaustive by memoizing the convolution per `${s.hitFaces},${die},${dmg}` key: 2,470 distributions instead of a 1-in-53 sample, at similar cost.

### WR-02: The `?test` UI smoke leaves hidden run text in the DOM (the load state is not restored)

**File:** `index.html:1907-1913` (`resetSim`), `index.html:2181-2205` (no-run branch of `renderSim`)
**Issue:** The no-run branch hides `#sim-note`, `#sim-now` and `#sim-tally` but never clears their content, and `resetSim()` does not reset `.note-base` or `.note-stale`. I confirmed this with `check-page --dump`. After the `?test` smoke, the final DOM contains:
- `<span class="note-base">Rolled at AC 15, d8, +5 to hit, +0 damage.</span>`
- `<p id="sim-now" hidden><b>Now:</b> expected 49.5 ± 14.1 at AC 16…`
- `<p id="sim-tally" hidden>Last 5 runs at these settings…`

The `--plain` dump has all three empty, so test-mode and plain-mode DOMs differ. That breaks the "smoke resets to the load state" contract in RESEARCH Pitfalls 3/4. `.note-stale`'s `hidden` flag also stays at whatever the last run left it, instead of the markup default.
**Fix:** Make the no-run branch restore the markup state:
```js
simNoteBaseEl.textContent = '';
simNoteStaleEl.hidden = true;
simNowEl.replaceChildren();
simTallyEl.replaceChildren();
```

### WR-03: `check-page --expect` matches hidden and screen-reader-only text, so it cannot prove anything is visible

**File:** `tools/check-page.mjs:113-116`, `tools/check-page.mjs:143-145`
**Issue:** The header says `--expect` checks "the visible page text", but `visibleMarkup` only removes the self-test panel. Text inside `hidden` elements, `.vh` spans, and `aria-hidden` spans all still match. I confirmed this: `node tools/check-page.mjs --expect "Now: expected" --expect "Last 5 runs"` prints CHECK-PAGE PASS in test mode, even though both paragraphs are `hidden` (see WR-02). The static `<b class="note-stale" hidden> Settings changed. Roll again to compare.</b>` matches on every load.

The tag-stripped fallback also joins adjacent elements with no separator. For example, `<span aria-hidden>Rnd</span><span class="vh">Round</span>` becomes `RndRound`, so it can produce false matches across element boundaries. The Phase 3 plans rely on `--expect` for SC1 and SIM-02 evidence.
**Fix:** Before matching, drop subtrees whose opening tag carries `hidden`, `aria-hidden="true"` or `class="vh"`. For the flat leaf elements used here, `/<(\w+)\b[^>]*\s(hidden|aria-hidden="true")[^>]*>[\s\S]*?<\/\1>/g` works well enough. Alternatively, run `--expect` only in `--plain` mode and document the limitation. Replace block-level closing tags with a space before stripping inline tags.

### WR-04: After a failed first render, listeners stay wired and later renders run unguarded under the error banner

**File:** `index.html:3390-3396`, `index.html:3399-3404`
**Issue:** Inside the WR-01 `try`, the `input`, `change` and `click` listeners are attached **before** `render()`. If `render()` throws, the catch shows the banner ("…the table and numbers are not shown") and returns, but the listeners stay live. The next slider or number input calls `setState`, then `scheduleRender`, then `render()` inside a rAF with no guard. It either throws an uncaught error on every frame or partially repaints the stats and tables under a banner that says they are not shown. Renderers that ran before the throw have also already painted `#stats` and `#outcome`, and those stay visible. The Roll button correctly stays disabled, but the rest of the page does not match the banner.
**Fix:** Wire the listeners only after the first render succeeds, or latch a failure flag:
```js
let broken = false;
function scheduleRender() { if (pending || broken) return; /* ... */ }
// in init()'s catch:
broken = true;
```
In the catch, also hide the sections that may have been partly painted (or reuse the Phase 1 engine-error layout) so the banner is accurate.

## Info

### IN-01: The self-test 200 ms budget is not enforced anywhere

**File:** `index.html:1847`, `tools/check-engine.mjs:404-417`
**Issue:** The self-test logs its own duration, but no check fails when the duration goes over budget. Under Node it measures 182–190 ms, 91–95% of the budget, over five runs (Chrome: 37.6 ms). Future sections could push it over without anyone noticing.
**Fix:** In check-page, parse `SELFTEST PASSED: n/n (X ms)` from the console and fail above 200 ms. Or have check-engine fail above a Node-calibrated limit.

### IN-02: The `Math.random` static gate is a substring count that does not check where the call is

**File:** `tools/check-engine.mjs:65-73`
**Issue:** "At most one occurrence in the file" passes even when the only occurrence sits somewhere other than the click handler. Aliasing (`const { random } = Math`) or `crypto.getRandomValues` bypasses the gate entirely.
**Fix:** Require exactly one occurrence, and require that it matches `/const onRoll = \(\) => handleRoll\(Math\.random\);/` inside the `app` block. Optionally also reject `getRandomValues` and `{ random }` destructuring in every block.

### IN-03: `Sim.simulate` trusts the injected rng range and `rounds`

**File:** `index.html:959`, `index.html:965-981`
**Issue:** An rng that returns 1 produces d20 = 21. That roll is classified as `'hit'`, not a crit, and gets a damage face of X+1. An rng that returns NaN yields `NaN`, which silently becomes a miss. `rounds` is also never validated (`'20'` is coerced, and negative values give an empty run). The two current callers (`Math.random` and `mulberry32`) are safe, but SIM-06 makes the rng injectable by design.
**Fix:** In `rollDie`, `if (!(face >= 1 && face <= sides)) throw new RangeError(...)`. In `simulate`, `if (!Number.isInteger(rounds) || rounds < 0) throw new TypeError(...)`. The click handler already turns throws into the roll-error copy.

### IN-04: The computeView comment is orphaned

**File:** `index.html:1236-1238`
**Issue:** The "page view (D-08, D-16)" comment that documents `computeView` now sits above the new "Roll-20-rounds copy" section. The function it describes is 40 lines further down, at line 1277.
**Fix:** Move lines 1236-1238 to just above `function computeView` (line 1277).

### IN-05: The no-run branch rebuilds nodes on every frame, against the "touch nothing" pattern

**File:** `index.html:2192-2196`
**Issue:** Before a roll, every frame calls `simSpreadEl.replaceChildren(...numberedParts(...))` and empties the log `tbody` and `tfoot`, even when nothing changed. The run path goes out of its way to avoid this (`setText`, `shownRunId`, text comparison for `Now:` and the tally). It is harmless today, but it is inconsistent and creates needless DOM mutations for assistive tech while a slider is dragged.
**Fix:** Compare before writing: `if (simSpreadEl.textContent !== ex.spreadText) simSpreadEl.replaceChildren(...)`. Clear the log only when `shownRunId !== 0`.

---

_Reviewed: 2026-09-26T18:41:10Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
