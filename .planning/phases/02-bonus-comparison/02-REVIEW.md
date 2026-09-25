---
phase: 02-bonus-comparison
reviewed: 2026-09-25T13:35:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - index.html
  - tools/check-engine.mjs
  - tools/check-page.mjs
findings:
  critical: 0
  warning: 3
  info: 6
  total: 9
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-09-25T13:35:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed the whole of `index.html` (engine, view-model, self-test, DOM layer, CSS) with the Phase 2 diff (`2b65011^..HEAD`) as the focus, plus both dev-only Node tools. Both tools were run on this machine and pass (engine sweep 70980 combos, headless Chrome at 1366px, self-test 198/198), so the findings below come from tracing paths the checks do not assert, and from a brute-force probe over the full control domain (AC 10..30 x 5 dice x atk -5..20 x dmg -5..20) written to the scratchpad.

No security issues: the only `innerHTML` sinks receive integers and fixed literal strings, the CSP is unchanged, no user string reaches markup, and the tools take only local paths and a URL that is validated against `--` options before being passed to Chrome.

Three warnings. (1) The engine-error banner is bypassed for Phase 2 view-model crashes: `section()` in the self-test swallows a `compareView`/`chartView` throw, `engineLoaded()` then returns true, and `render()` throws out of `init()` with no banner and no panel. This was reproduced in headless Chrome on a scratch copy. (2) The chart's caption and crossing markers are computed on exact numerators, while the hover readout and the compare-table deltas are computed on tenths; across the domain there are 434 (setting, N) pairs where the caption says one curve leads and the readout says "even", 75 of them at the very N a ring labels "flips at +N". (3) The engine check's 1-in-50 sampling stride (50) shares a factor with the 26-wide `dmg` loop, so checks (i), (j), (l) and the marker half of (m) never sample an odd `dmg` value.

The unreachable edge branches in `DiceMath.crossings` / `VM.captionCross` (leading tie, touch, consecutive ties, multi-tie gap, all-equal) were confirmed unreachable for real inputs by the probe: they are exercised only by synthetic arrays and are harmless.

## Warnings

### WR-01: A Phase 2 view-model crash leaves the page blank with no engine-error banner

**File:** `index.html:1146-1150`, `index.html:2408-2416`, `index.html:2438-2447`
**Issue:** `engineLoaded()` treats the engine as healthy unless a self-test result name starts with `self-test crashed`. The Phase 2 self-test sections run inside `section(name, fn)`, which catches any throw and records it as `<name> crashed: ...` (comment at 1143-1145 says this is so "the page keeps rendering while one of these checks is red"). That is only true when the crash is in the check itself. If `VM.compareView`, `VM.chartView`, `DiceMath.crossings`, `DiceMath.attackBands` or `DiceMath.sweep` throws, the throw is swallowed by `section()`, `engineLoaded()` returns true, `init()` skips the banner, and then `render()` at line 2446 calls `VM.computeView` -> `compareView`, which throws uncaught out of `init()`. Nothing after that line runs, including `showSelfTestPanel` in `?test` mode.

Reproduced on a scratch copy with `compareView` made to throw, loaded in headless Chrome via `tools/check-page.mjs`: the DOM dump has `<div id="engine-error" role="alert" hidden="">`, zero rendered `<th scope="row">` headers (all four tables empty), an empty stats grid, and no self-test panel, while the console shows only `SELFTEST FAIL: cmp crashed: ...`. A visitor sees the controls and empty sections with no explanation.
**Fix:** Either treat any `crashed` result as fatal in `engineLoaded()`, or (better, since it also covers DOM-layer throws) guard the first render:
```js
function showEngineError() {
  const banner = document.getElementById('engine-error');
  banner.textContent = 'The dice math failed ' + 'to load, so the table and numbers are not shown. ' +
    'Reload the page. If it keeps happening, add ?test to the address to see which check failed.';
  banner.hidden = false;
}
function init() {
  const testMode = new URLSearchParams(location.search).has('test');
  const st = selfTestIfLoaded();
  if (!engineLoaded()) { showEngineError(); if (testMode && st) showSelfTestPanel(st); return; }
  try {
    nRangeEl.min = String(VM.CONTROL_SPEC.n.min);
    nRangeEl.max = String(VM.CONTROL_SPEC.n.max);
    chartInit();
    Object.assign(state, VM.DEFAULT_STATE);
    renderControls();
    for (const root of [form, compareForm]) { /* listeners as today */ }
    render();
  } catch (err) {
    console.error('render failed:', err);
    showEngineError();
    if (testMode && st) showSelfTestPanel(st);
    return;
  }
  if (testMode) showSelfTestPanel(SelfTest, runUiSmoke());
}
```
Also add a self-test line asserting no result name contains ` crashed: ` so `check-engine.mjs` goes red on any section crash (today it does, via `SelfTest.failed`, but the page does not).

### WR-02: Caption and crossing markers use exact numerators; the readout and compare deltas use tenths, and they contradict each other

**File:** `index.html:875-893` (captionOrder), `index.html:943-948` (readout), `index.html:952-957` (marker labels), `index.html:840-845` (compare deltas)
**Issue:** `captionOrder` and `DiceMath.crossings` compare `a[n] - d[n]` on exact integer numerators. `readout[n]` decides "even" vs "ahead by" on `tenths(a) - tenths(d)`, and `compareView` prints totals and deltas in tenths. When the exact gap is under 0.05 over 20 rounds the page disagrees with itself. Probe over the full domain: 434 (setting, N) pairs where the caption names a leader and the readout at that N says "even"; 75 of those are exactly a crossing's `flipN`, so the ring label and the readout contradict; 49 compare views (N in {1, 5, 20}) print identical totals and identical deltas for the two variants while the exact values differ.

Concrete case, AC 17, d12, attack -5, damage -4, slider at +3 (all displayed strings are produced by the current code):
- caption: `... +N to damage leads from +1 to +2, then +N to hit leads from +3 to +20. The curves cross once.`
- ring label: `flips at +3`, title `The curves cross between +2 and +3.`
- readout at +3: `At +3: to hit 12.0 · to damage 12.0 · even`
- compare tables at +3: `hits on 19+ · 12.0 over 20 rounds · +3.0 vs baseline` and `only a nat 20 hits · 12.0 over 20 rounds · +3.0 vs baseline`

The exact gap at +3 is 4/144 = 0.028. A designer reading "flips at +3" and then hovering +3 sees "even" and two identical compare tables. Every case is in the damage-penalty region (dmg <= -3, where the 0 floor makes the two series nearly parallel), so the defaults never show it, but the settings are reachable from the controls. RESEARCH Pitfall 7 chose displayed tenths for the deltas; the caption and markers were added later on a different basis without reconciling the two.
**Fix:** Decide the tie/lead words on one basis everywhere. The least invasive change is to keep the exact ordering (it is what the markers need) and stop the readout from printing "even" when the exact values differ:
```js
const readout = aT.map((ta, k) => {
  const td = dT[k], exact = Math.sign(attack[k] - damage[k]);
  const gapT = Math.abs(ta - td);
  const gap = exact === 0 ? 'even'
    : `${exact > 0 ? 'to hit' : 'to damage'} ahead by ${gapT ? fixed(gapT, 1) : 'less than 0.1'}`;
  return `At ${signed(k)}: to hit ${attackText[k]} · to damage ${damageText[k]} · ${gap}`;
});
```
and, in `compareView`, when `tenths` tie but `e20Num/e20Den` differ, append `(under 0.1 apart)` or show hundredths for the delta. Add a check-engine invariant: for every combo and N, `Math.sign(exact)` must agree with the readout word (`'even'` only when the exact gap is 0).

### WR-03: check-engine's 1-in-50 sample never reaches odd `dmg` values

**File:** `tools/check-engine.mjs:172`, `tools/check-engine.mjs:202`, `tools/check-engine.mjs:237`
**Issue:** The sampled invariants (i), (j), (l) and the marker half of (m) fire on `combos % 50 === 0`. `combos` is incremented in the innermost loop, which has 26 `dmg` values (-5..20). Since 26 and 50 share the factor 2, the sampled combos always land on the same parity of `dmg`. Verified by counting: the sample hits `dmg` in {-4, -2, 0, 2, ..., 20} 109-110 times each and `dmg` in {-5, -3, -1, 1, 3, ..., 19} zero times. The header comment (lines 14, 17, 20, 25) advertises "a 1-in-50 sample" of the domain; half the damage bonuses, including the entire `dmg = -5 / -3 / -1` floor region where WR-02 lives, are never covered by the sampled checks. (The unsampled checks (a)..(h), (k), the count half of (m), and (n) are unaffected.)
**Fix:** Use a stride coprime to every loop length (21, 5, 26, 26), or sample on a hash of the params:
```js
const SAMPLE = 53;   // prime; coprime to 21, 5 and 26, so the sample cycles through every dmg
...
if (combos % SAMPLE === 0) { ... }
```
and assert coverage once at the end (`sampledDmg.size === 26`) so a future loop change cannot silently reintroduce the gap.

## Info

### IN-01: The N domain "0 to 20" is copied into three pieces of page copy

**File:** `index.html:524`, `index.html:548`, `index.html:549`
**Issue:** `init()` sets the slider's `min`/`max` from `VM.CONTROL_SPEC.n` (2435-2437, "IN-04: no second copy in the markup"), but the label hint `0 to 20`, the h2 `Bonus sweep, +0 to +20` and the intro `from +0 to +20` are static literals. Changing `CONTROL_SPEC.n.max` would leave the copy wrong. Phase 1 has the same pattern for AC/atk/dmg hints (446, 463, 467).
**Fix:** Fill these three spans from `CONTROL_SPEC.n` in `init()` (`textContent`), or accept the duplication and drop the IN-04 claim from the comment at 2435.

### IN-02: check-page's `?test` detection does not match the page's

**File:** `tools/check-page.mjs:48`, `tools/check-page.mjs:50`
**Issue:** The page uses `new URLSearchParams(location.search).has('test')` (index.html:2423). The tool uses `url.includes('?test')` and strips `?test\b&?` for `--plain`. For an explicit URL such as `...?foo=1&test` the page is in test mode but the tool judges plain mode and the "self-test panel stays hidden" check fails; for `...?testing=1` the reverse. Only matters for the explicit-URL path.
**Fix:** Parse with `new URL(url).searchParams.has('test')`, and for `--plain` delete the param via `searchParams.delete('test')` and re-serialize.

### IN-03: check-engine hard-codes the control domain instead of reading `VM.CONTROL_SPEC`

**File:** `tools/check-engine.mjs:36`, `tools/check-engine.mjs:105`, `tools/check-engine.mjs:127-128`, `tools/check-engine.mjs:91`
**Issue:** `TOTAL_COMBOS = 70980`, `ac = 10..30`, `atk/dmg = -5..20` duplicate `CONTROL_SPEC`; `MAXN` reads the spec but falls back to `|| 20`, which would hide a missing or renamed `n` spec rather than fail. If the spec changes, the sweep silently covers the wrong domain while still printing PASS.
**Fix:** Derive the loop bounds and `TOTAL_COMBOS` from `VM.CONTROL_SPEC` and drop the `|| 20` fallback (call `fail()` if `CONTROL_SPEC.n` is absent).

### IN-04: Several crossing/caption branches are unreachable for real inputs

**File:** `index.html:703-704`, `index.html:711` (non-adjacent branch), `index.html:899-900`, `index.html:952-953`
**Issue:** The probe over all 70980 combos found zero leading ties (tie at +1), zero touches (tie with the same leader on both sides), zero consecutive ties, zero crossings spanning more than one tie, and zero all-equal series. So `first === 'none'`, the `k === 0 && ties.length > 0` "meet at" sentence (except for the 16 end-tie cases), and the non-adjacent `tieN = lastN + 1` assumption of a single tie are exercised only by the synthetic self-test arrays. Not a defect; worth knowing that the "touches get none" marker rule and the "meet at" copy have no real-input coverage, and that a future rule change (for example a different floor) could make them live without any real-input test.
**Fix:** Either leave as-is with a comment stating these are defensive branches, or add the probe's "no leading tie / no touch / no consecutive ties" facts as check-engine invariants so a rule change that makes them reachable is noticed.

### IN-05: Chart scrubbing does not filter secondary pointers

**File:** `index.html:1744-1751`
**Issue:** The `pointermove` handler uses every pointer. With two fingers on the chart the readout flickers between the two positions; `pointerleave` from either finger clears the hover.
**Fix:** `if (!e.isPrimary) return;` at the top of the handler (and in `clearHover` guards).

### IN-06: Band labels can extend past the plot's right edge

**File:** `index.html:1812-1814`
**Issue:** Band labels are anchored `start` at `xScale(b0) + 4` regardless of band width. When the cap band starts at +19 (AC - atk = 21, e.g. AC 16 / atk -5, a self-test case) the `95% cap` label starts at x 524 and runs past `PLOT_R` (544) into the direct-label margin; at the 17.5px and 24px text tiers it reaches roughly x 590-615. `only a nat 20 hits` is always ~95 units wide even when the floor band is one step (24 units). The band label y (24) does not collide with the direct labels (y >= 32), so this is cosmetic.
**Fix:** Anchor `end` at `xScale(b1) - 4` when `b0 >= maxN - 2`, or clamp the label x so `x + estimatedWidth <= PLOT_R`.

---

_Reviewed: 2026-09-25T13:35:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
