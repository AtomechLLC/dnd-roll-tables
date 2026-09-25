---
phase: 01-live-roll-table-deployed
reviewed: 2026-09-25T05:46:05Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - index.html
  - tools/check-engine.mjs
  - tools/check-page.mjs
findings:
  critical: 0
  warning: 5
  info: 7
  total: 12
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-09-25T05:46:05Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

I reviewed the single-file page (engine, view-model, self-test, DOM layer, CSS) and the two dev-only check tools.

The rules engine is correct. I traced nat-1 and nat-20 handling, the threshold clamp, the hit/crit face counting, the true 2dX crit enumeration, the 0-damage floor, the marginal `reason` classification (cap, floor, nodmg), and the `critFloorDiffers` condition by hand. `node tools/check-engine.mjs` passes (65/65, 70980 combos). XSS exposure is nil: only parsed integers and fixed strings reach the two `innerHTML` sinks, and nothing from `location` is reflected. I also computed heat-ramp contrast at the tier breakpoints for both themes, and every case is at least 4.5:1 (worst 4.59, dark hi tier).

No blockers. The main problems:

1. The displayed per-round figures are wrong at the third decimal for 7353 of 70980 control combinations. The footer says "Every number is exact."
2. The STAT-02 check that should have caught this is tautological.
3. `check-page.mjs` decides test mode differently from the page itself.
4. The narrow-tier threshold label depends on a CSS syntax that has no fallback.
5. `check-page.mjs` quietly accepts a malformed `--expect`.

## Warnings

### WR-01: Per-round and marginal per-round values show false precision, and the footer claims exactness

**File:** `index.html:585`, `index.html:592-593`, `index.html:396`
**Issue:** `perRoundText = fixed(e20T * 5, 3)` builds the per-round value from the 20-round figure after it has been rounded to tenths. It is then printed with three decimals, which look exact. They are not. A full-domain probe found 7353 combos (all with a negative damage bonus) where the displayed per-round value is off by more than 0.0005. Examples:
- AC15 +5 d6 D-2 shows `1.085`. The exact value is `1.0833…`.
- The "+1 to hit" marginal is worse: AC10 -5 d4 D-3 shows `+0.015 per round`. The exact value is `0.0125`, 20% off. There are 3685 such marginal combos.

Meanwhile the footer (line 396) says "Every number is exact and computed in your browser." For a teaching tool whose core value is exact math, a wrong third digit presented as exact is a correctness defect. STAT-02 only requires consistency, not these digits.
**Fix:** Keep STAT-02 consistency, but stop claiming precision the value does not have. Either:
```js
// VM.computeView: mark rounded per-round figures
const exactPR = s.e20Num * 10 % s.e20Den === 0;          // 20-round tenths are exact
perRoundText: fixed(e20T * 5, 3),
perRoundApprox: !exactPR,
// renderStats: prefix '≈' when view.perRoundApprox; same for marg.*Round
```
or show the 20-round figure and marginals at 2 decimals and the per-round figure at 4 decimals (`fixed(e20H * 5, 4)`). Also soften the footer to "Every number is computed exactly; displayed values are rounded."

### WR-02: The STAT-02 invariant is tautological in both the self-test and check-engine

**File:** `index.html:746`, `tools/check-engine.mjs:60`, `tools/check-engine.mjs:109-111`
**Issue:** `perRoundText` is defined as `fixed(e20T * 5, 3)`, so `fixed(round(Number(perRoundText) * 200), 1)` recovers `e20T` by construction. Checks (f) and "grid: per round x 20 = 20-round figure" can only fail if `fixed()` is broken. They report 750 and 70980 passing combos and never compare the displayed per-round value with the exact `s.perRound`. That false assurance is why WR-01 went unnoticed.
**Fix:** Add a check against the exact value, with a tolerance that matches the display promise:
```js
if (Math.abs(Number(view.perRoundText) - s.perRound) > 0.0005 + 1e-12 && !view.perRoundApprox) record('g', p, ...);
```
Or at least assert `Math.abs(Number(view.e20Text) - s.e20) <= 0.05` so the round-trip is anchored to the engine.

### WR-03: check-page decides test mode differently from the page

**File:** `tools/check-page.mjs:46`, `tools/check-page.mjs:48`
**Issue:** The page enables test mode with `new URLSearchParams(location.search).has('test')` (index.html:1223). The tool uses `url.includes('?test')`. Verified with Node:
- `…/index.html?a=1&test`: tool says plain, page says test. The "panel stays hidden" check fails on a correct page.
- `…/index.html?testing=1`: tool says test, page says plain. "Self-test passed" is never rendered, which is another false failure.

`--plain` also strips `test` only when it is the first parameter, so `?a=1&test` passes through unchanged. When the tool and the page disagree about the mode, the check reports failures on a correct page.
**Fix:**
```js
const u = new URL(url);
if (plain) { u.searchParams.delete('test'); url = u.href; }
const testMode = new URL(url).searchParams.has('test');
```

### WR-04: The narrow-tier threshold label has no fallback for `content: … / ""` alt-text syntax

**File:** `index.html:220-228`
**Issue:** In the `< 25rem` tier, `.note-th` is collapsed to `font-size: 0` and the visible label comes only from `content: attr(data-short) / "";`. The `/ alt` form of `content` is Baseline *newly* available (Firefox 128 was the last engine, in 2024), not widely available. A browser that does not parse it drops the whole declaration. The "N+" label then disappears, and the text it replaced is already at size 0, so the threshold row loses its label entirely. The project convention (CLAUDE.md "What NOT to Use") rejects newly-available features like `light-dark()` as the sole mechanism.
**Fix:** Declare a fallback first:
```css
#outcome .note-th::after {
  content: attr(data-short);        /* fallback */
  content: attr(data-short) / "";   /* hides the duplicate from AT where supported */
  …
}
```

### WR-05: check-page `--expect` or `--dump` with a missing value passes silently

**File:** `tools/check-page.mjs:32`, `tools/check-page.mjs:34`, `tools/check-page.mjs:121`
**Issue:** `--expect` as the last argument pushes `''`. `rendered.includes('')` is always true, so the check reports `ok DOM contains ""`, a guaranteed false pass. If a script passes a variable that is unset (`--expect "$X"`), the gate silently tests nothing. `--dump` without a value sets `dump = undefined`, and the DOM dump is skipped with no error.
**Fix:**
```js
else if (a === '--expect') {
  const v = args[++i];
  if (!v) { console.log('CHECK-PAGE FAIL: --expect needs non-empty TEXT'); process.exit(1); }
  expects.push(v);
}
else if (a === '--dump') { dump = args[++i]; if (!dump) { console.log('CHECK-PAGE FAIL: --dump needs FILE'); process.exit(1); } }
```

## Info

### IN-01: A failing (non-crash) self-test is invisible on normal loads

**File:** `index.html:1208-1216`, `index.html:1224`
**Issue:** `engineLoaded()` blocks rendering only when the self-test *crashed*. If assertions fail (for example after a future engine edit), the page renders the possibly wrong numbers, and the only signal is the console. The "numbers on this page may be wrong" copy exists only under `?test`. This matches the UI-SPEC decision, but it is worth a deliberate second look.
**Fix:** Consider a small non-blocking notice when `SelfTest.failed > 0` on plain loads.

### IN-02: Legend ramp labels repeat for small heat domains

**File:** `index.html:916-918`
**Issue:** `Math.round(t * heatMax)` with `heatMax = 3` (d4, D-5) gives labels `0, 1, 2, 2, 3`, so two adjacent swatches read "2".
**Fix:** De-duplicate the labels, or use fewer stops when `heatMax < 4`.

### IN-03: Dead branch in `avgPerHitText`

**File:** `index.html:586-587`
**Issue:** `s.hitFaces` is always at least 1 because a nat 20 always hits, so the `'0.00'` branch is unreachable.
**Fix:** Remove the ternary, or add a comment explaining why it is kept.

### IN-04: The control domain is duplicated in four places

**File:** `tools/check-engine.mjs:16`, `tools/check-engine.mjs:72-81`, `index.html:404`, `index.html:531-536`, `index.html:330-334`
**Issue:** The die set lives in `DiceMath.DICE`, `CONTROL_SPEC.die.set`, and the radio markup. The AC, atk, and dmg ranges live in `CONTROL_SPEC`, the HTML `min`/`max`, and hard-coded loops plus `TOTAL_COMBOS = 70980` in check-engine. Widening a range in `CONTROL_SPEC` would leave the full-domain sweep silently covering the old domain.
**Fix:** In check-engine, derive the loops and `TOTAL_COMBOS` from `VM.CONTROL_SPEC`, and add a self-test assertion that `CONTROL_SPEC.die.set` equals `DiceMath.DICE`.

### IN-05: `parseControl` rounds negative halves asymmetrically

**File:** `index.html:551`
**Issue:** `Math.round` rounds half toward +infinity, so `"2.5"` becomes 3 but `"-2.5"` becomes -2. A number box with step 1 still accepts typed `-2.5`.
**Fix:** `const i = Math.sign(n) * Math.round(Math.abs(n));` if symmetric rounding is intended. Otherwise document the behavior.

### IN-06: check-page `--expect` substring matching is fragile

**File:** `tools/check-page.mjs:98-121`, `index.html:1119-1128`
**Issue:** `--expect` matches against HTML-serialized markup:
- Text containing `&`, `<`, or `>` never matches, because it is serialized as `&amp;` and so on.
- In test mode, the self-test panel prints every check name into the DOM, so an expected string can be satisfied by panel text instead of the real UI. The page works around this by splitting literals in check names (`'+0.2' + '25 per round'`). That is brittle: any new check name that contains a UI string silently weakens the gate.

**Fix:** Strip `#selftest` from `rendered` before `--expect` matching, and compare against decoded text (for example, entity-decode `&amp;`, `&lt;`, `&gt;`, and `&quot;`).

### IN-07: check-page cleanup and browser discovery are brittle

**File:** `tools/check-page.mjs:51-55`, `tools/check-page.mjs:86`
**Issue:**
- The `rmSync` in the error path (line 86) is not wrapped in try/catch, unlike line 90. After a spawn timeout, lingering Chrome children can hold the profile, and the tool then dies with an uncaught EBUSY stack instead of the `CHECK-PAGE FAIL` line.
- Browser discovery only checks the machine-wide Chrome and the x86 Edge paths. It misses per-user Chrome (`%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe`) and 64-bit Edge (`C:\Program Files\Microsoft\Edge\…`).

**Fix:** Wrap the line-86 `rmSync` like line 90, and add the extra candidate paths.

---

_Reviewed: 2026-09-25T05:46:05Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
