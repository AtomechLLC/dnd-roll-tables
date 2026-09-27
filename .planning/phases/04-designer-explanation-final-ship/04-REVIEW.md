---
phase: 04-designer-explanation-final-ship
reviewed: 2026-09-27T18:25:19Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - index.html
  - tools/check-engine.mjs
  - tools/check-page.mjs
  - README.md
  - .github/workflows/static.yml
findings:
  critical: 1
  warning: 4
  info: 6
  total: 11
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-09-27T18:25:19Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

This review covers the Phase 4 range (`d30fd9f^..HEAD`): the generated designer copy (`twoRollsText`, `formulaView`, `explainChart`), the presets, the guarded init, the a11y guards (9) to (14), the fault mode, the README and the stock Pages workflow. It checks behavior against 04-CONTEXT.md and 04-UI-SPEC.md, including the recorded deviations. Every claim below was reproduced by running the page's own `#dice-math` / `#view-model` blocks in Node, or by running `tools/check-engine.mjs` (PASS, Node self-test 190.4 ms) and `tools/check-page.mjs` (PASS, Chrome self-test 63.2 ms; `--fault render` PASS).

The mechanics are sound:
- No new `innerHTML` sinks were added. `setSeg`, `renderFormulas` and `renderExplain` use text nodes only.
- The preset path runs through `parseControl` with a single `setState`.
- The init ordering matches WR-04: the first render is guarded, listeners are wired after it, and Roll and the presets are enabled last.
- The Chrome budget gate is not vacuous: headless virtual time does not freeze `performance.now()`, and Chrome measured 63 ms.

The main problems are in the generated copy. At reachable settings it states numbers or claims that disagree with the cards, the table footnote, or the chart:
- At 11,648 settings the solid-line text says +1 to hit is worth 4.5 while the card and formula beside it say 0.
- At 8,190 settings the formula note says "The table gives X", while the footnote says the table is off.
- At about a third of the no-crossing settings, the crossover text promises a lever that cannot work.

`check-engine` passes on all of these because its copy oracles re-type the same strings instead of checking the claims. One new smoke check cannot fail.

## Critical Issues

### CR-01: The solid-line text says +1 to hit is worth a full hit when the chart, card and formula all say it adds 0

**File:** `index.html:1548-1561` (`VM.explainChart`, solid-line branch)
**Issue:** When the attack is already at the 95% cap (`bands.cap[0] === 0`, 11,648 of 70,980 settings with `die + dmg > 0`), `hitLine` still opens with the step sentence and then contradicts it. At AC 15 / d8 / +14 / +0 (the formula smoke's own "cap clamp" case) the page shows:

> The solid line (+N to hit). Each +1 to hit turns one more d20 face into a hit: one more hit in 20 rounds, worth an average d8 + 0 = 4.5. It is flat across the whole chart, in the band marked "95% cap" …

Directly above it, the "Value of the next +1" card reads `+0 (already hits on 2+, the 95% cap)` and the `+1 to hit` formula reads `= 0: you already hit on 2+`. At AC 10 / d4 / +8 / −3 it says the next hit is "worth 0.25 on average here" while the card says `+0`. At this setting no +1 to hit ever turns a face into a hit, so the sentence states a false number exactly where the page's core lesson (to-hit saturates) should be clearest. The UI-SPEC wording "Sentence 1 always explains the step" causes this. D-04 and D-06 (no number or band claim that disagrees with what is displayed) take precedence. `check-engine (v)` rebuilds the same string, so it passes.
**Fix:** Drop or condition the step sentence when the whole chart is capped, and pin the new wording in check-engine (v):
```js
const capAll = bands.cap && bands.cap[0] === 0;
if (X + D <= 0) { /* nodmg, unchanged */ }
else if (capAll) {
  hitParts.push('It is flat across the whole chart, in the band marked “95% cap”: you already hit on 2+, ' +
    'and a natural 1 always misses, so +1 to hit has no face left to turn into a hit.');
} else {
  hitParts.push(/* step sentence as now */);
  // floor / cap band sentences as now
}
```
Also add an engine-side assertion: when `marginals(p).hitNum === 0` and `bands.cap[0] === 0`, `hitLine` must not contain `worth`.

## Warnings

### WR-01: The table-branch formula note says "The table gives X per round" when the table's average is a different number, as the footnote next to it says

**File:** `index.html:1369-1370` (`formulaView`, table branch note); `tools/check-engine.mjs:333-338`
**Issue:** The note reads `… The table gives 1.240 per round, the same as the Expected per round card.` The figure comes from `perRoundText` (the true 2dX enumeration), not from the table. When `critFloorDiffers` (D ≤ −3), the outcome table's doubled-face crit row averages to something else. At AC 15 / d8 / +5 / −3 the table's cell average is 1.24375 per attack (it would display 1.244), not 1.240. The crit footnote on the same page adds "the doubled-face shortcut [is] slightly off. The stat cards below use the real two-dice rule", and `#two-rolls` says the average cell is only "close to" the expected damage. Both formula branches (table, with `critFloorDiffers`) are active at 8,190 settings. The page then makes two contradictory claims about the table, which D-04 forbids. check-engine (s) only compares the note to the same literal string.
**Fix:** Name the source that actually produced the number, for example:
```js
note: seg(`Not exact here: at a damage bonus of ${signed(D)}, some rolls would deal less than 0, ` +
  'but damage stops at 0. Counting every roll exactly gives ', sv.perRoundText,
  ' per round, the same as the Expected per round card.'),
```
In check-engine (s), assert that the word "table" is used only where `tableSum * die === e20Num`.

### WR-02: "What moves the crossover" promises a lever that cannot produce a crossover at many settings

**File:** `index.html:1582-1587` (`explainChart`, `k === 0` branches)
**Issue:** At every no-crossing setting where damage leads (30,095 settings), the text says: "A higher AC leaves fewer hits … and a bigger die makes each extra hit worth more. Either can let +N to hit pull ahead." A probe tried every higher AC up to 30 and every bigger die, one lever at a time. At 2,455 of 6,745 sampled settings (dmg in {−5, 0, 5, 10, 20}) neither lever ever gives +N to hit the lead. With dmg in {0, 2, 5} alone that is 1,410 settings. Examples: AC 10 / +12 / d4 / +0, and AC 10 / +13 / d6 / +0. At these settings the attack is already capped, so a bigger die adds nothing, and AC tops out at 30. The mirror sentence for the "+N to hit leads" case (`Either can hand the lead to +N to damage`) is false at 294 of 2,496 sampled settings, for example AC 10 / −5 / d4 / +10. A designer who follows the advice sees no change. check-engine (w) only checks the variant and the string, never the claim.
**Fix:** Derive the lever from the engine, as the presets are. For example, precompute in `chartBase` whether `ac + 1..30` or a larger die yields a lead change, name only the levers that do, and fall back to a true sentence when none does:
```js
// when capped from +0: 'You already hit on 2+, so nothing here lets +N to hit catch up; only a lower attack bonus or a higher AC would.'
```
At minimum, reword to "At some other settings, …", and add a check-engine (w) assertion that samples the lever claim.

### WR-03: Only the first render is guarded; a throw in any later render leaves a half-painted page with no banner

**File:** `index.html:2468-2472` (`scheduleRender`), `index.html:4173-4203` (`init`)
**Issue:** WR-01 and WR-04 are fixed for the first frame only. Every later render runs as `requestAnimationFrame(() => { pending = false; render(); })` with no try/catch. If a renderer or view-model function throws at one particular setting, `render()` stops partway through `RENDERERS`: the stats show the new setting while the tables or chart still show the old one. `lastView` is not updated, `broken` is not latched, the banner stays hidden, and the throw repeats on every input. check-engine exercises the pure VM exhaustively, but not the DOM renderers (`renderOutcomeTable`, `renderChart`, `renderSim`, `renderFormulas`) at every setting. `--fault render` only injects a throw into the first render.
**Fix:** Guard the scheduled render with the same failure path as init:
```js
function scheduleRender() {
  if (pending || broken) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    try { render(); } catch (err) { failPage(err); }   // failPage: broken = true, hide PAINTED_SECTIONS,
  });                                                  // showEngineError(), disable Roll and presets
}
```
Then extend `--fault` with a mode that throws on the second render only, for example `render` after a counter reaches 2.

### WR-04: The new preset smoke check "a control change clears the status" cannot fail

**File:** `index.html:4050-4065` (`runUiSmoke`, explore block)
**Issue:** `applyPreset` clears `#explore-status` and writes the message in a later rAF. `runUiSmoke` is synchronous, so that rAF has not run when `send(acRange, '24')` and `render()` execute. The status is already `''` before the clearing code runs, so `check('explore ui: a control change clears the status', …, '')` passes even if `render()` never clears it. The positive path, that the status is actually written after a click, is not asserted anywhere. A broken guard, such as `lastPreset` being reassigned before the rAF, would silently suppress every preset announcement. This is the D-08 honesty contract, and the only check covering it is vacuous.
**Fix:** Put the message in place synchronously before testing that it clears, and assert the write path separately:
```js
btns.find((b) => b.dataset.preset === 'cross').click();
render();
exploreStatusEl.textContent = VM.presetStatus(lastPreset);   // what the rAF would write
check('explore ui: status names the preset', exploreStatusEl.textContent.startsWith('Set to AC 25'), true);
send(acRange, '24');
render();
check('explore ui: a control change clears the status', exploreStatusEl.textContent, '');
```

## Info

### IN-01: The solid-line step shows a different rounding of the same quantity than the card above it

**File:** `index.html:1552-1553`
**Issue:** In the floor-bites branch (9,828 settings), the chart text says one more hit is "worth 1.88 on average here". That is `normalAvgText`, 2 decimals, over 20 rounds. The "Value of the next +1" card shows the same quantity as `+1.9 over 20 rounds` (tenths), and the formula shows `0.095`. It is the same number at different precision, but a designer comparing the two sees 1.88 and 1.9.
**Fix:** Print the step with the card's own string, `marg.hit20`, where the step equals `hitNum / den`, or add "(1.9 rounded, as on the card)".

### IN-02: The check-engine copy oracles re-implement the copy instead of checking its claims

**File:** `tools/check-engine.mjs:320-338`, `tools/check-engine.mjs:497-519`, `tools/check-engine.mjs:414-448`
**Issue:** (s), (u), (v) and (w) rebuild each sentence with the same branch logic and compare strings. That catches drift between two copies of the code, but not false statements. CR-01, WR-01 and WR-02 all pass because the oracle mirrors the bug. The header comment "computed independently from p" overstates what the checks do.
**Fix:** For each sentence, add at least one claim-level assertion computed from the engine:
- CR-01: a "worth X" number must equal `hitNum / den` whenever it is shown.
- WR-01: "the table" wording is allowed only when `tableSum * X === e20Num`.
- WR-02: a named lever must actually produce a lead change.

### IN-03: The `--fault render` checks can pass without proving the controls are inert, and skip missing sections silently

**File:** `tools/check-page.mjs:108-110`, `tools/check-page.mjs:454-458`
**Issue:** The poke dispatches `input` on `#ac-range` without changing its value. It therefore only proves that no render was scheduled, which the `broken` latch alone guarantees. It cannot tell whether listeners were wired before the first render, which was the exact WR-04 defect. Separately, `if (sec === null || sec.tag !== 'section') continue;` turns a renamed or removed section into a silent pass.
**Fix:**
- Poke with a changed value (`el.value = '20'` before dispatching), and add a check that the injected page never ran `onControl`. For example, have the fault copy wrap `onControl` to set `window.__wired = true`, then assert on a marker the page writes into the DOM.
- Make a missing section a failure: `check(\`fault: section#${id} hidden\`, sec !== null && sec.tag === 'section' && 'hidden' in sec.attrs)`.

### IN-04: The engine-load failure path and the render failure path leave the page in different states

**File:** `index.html:4160-4165` vs `index.html:4191-4202`
**Issue:**
- When `engineLoaded()` is false, the banner is shown but `PAINTED_SECTIONS` are not hidden. The static formula rules, the chart legend and the "Try this" cards with disabled buttons stay visible under a banner that says the numbers are not shown.
- On both paths the `#controls` inputs stay enabled and focusable but do nothing. A keyboard or screen-reader user gets no signal that they are inert.
- `--fault` covers only the render path.

**Fix:** Share one `failPage()` routine (see WR-03) that hides the sections and sets `disabled` (or `inert` on `#controls`) on both paths, and add a `--fault engine` mode.

### IN-05: The README describes the Pages setup and the layout inaccurately

**File:** `README.md:20`, `README.md:10`
**Issue:**
- Line 20 says the site is "published from the `main` branch root with GitHub Pages". Per 04-05-SUMMARY, the Pages source is the GitHub Actions workflow (`static.yml`), not legacy branch publishing.
- Line 10 says the three explanations sit "under the chart". Since 260927-1ty, at page widths of 72rem and above they sit beside it.

**Fix:** Change line 20 to "deployed from `main` by the GitHub Actions workflow in `.github/workflows/static.yml`", and change line 10 to "under or beside the chart".

### IN-06: The Pages workflow can be hardened

**File:** `.github/workflows/static.yml:33-43`
**Issue:** The stock workflow is acceptable for a public static site. It has no `pull_request` trigger, least-privilege `contents: read`, and `pages`/`id-token` for one job. Some hardening is still possible:
- The actions are pinned to mutable major tags (`@v4`, `@v5`, `@v3`), not commit SHAs.
- `checkout` persists the token in `.git/config`. It is harmless here because `upload-pages-artifact` excludes `.git`, but it is unnecessary.
- Every push to `main` deploys without running `tools/check-engine.mjs`, so a commit that breaks the page goes live.
- `path: '.'` publishes `CLAUDE.md`, `.planning/` and `tools/`. This was accepted under Phase 1 D-12; no secrets were found in tracked files.

**Fix:** Pin each action to a full SHA with a version comment, and add `with: { persist-credentials: false }` to checkout. Optionally add a `node tools/check-engine.mjs` step before the upload. Node is on `ubuntu-latest`, and this would be a gate, not a build step.

---

_Reviewed: 2026-09-27T18:25:19Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
