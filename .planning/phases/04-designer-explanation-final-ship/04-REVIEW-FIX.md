---
phase: 04-designer-explanation-final-ship
fixed_at: 2026-09-27T19:03:06Z
review_path: .planning/phases/04-designer-explanation-final-ship/04-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 4: Code Review Fix Report

**Fixed at:** 2026-09-27T19:03:06Z
**Source review:** .planning/phases/04-designer-explanation-final-ship/04-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (CR-01, WR-01..WR-04; IN-01..IN-06 out of scope)
- Fixed: 5
- Skipped: 0

Final state, `main` at 3cfa6b1, not pushed:
- `node tools/check-engine.mjs`: PASS. Self-test 251/251, 70,980 combos, self-test time 193.9 ms against a 200 ms budget.
- `node tools/check-page.mjs`: PASS in all five modes: default `?test`, `--plain`, `--fault render`, `--fault later` (new) and `--width 390`.

The in-page self-test gained no checks. The one self-test edit is WR-02's expected default string, which now passes the defaults' lever result as a literal. Interleaved Node timing runs (7 each) show no measurable change against the previous HEAD, because the new lever probe runs only when `chart.explain` is read.

Every new check-engine claim check was mutation-tested. The old copy was run against the new checks with the string-rebuild comparisons disabled:
- CR-01: 27,008 failures (11,648 capped + 15,360 floor-first).
- WR-01: 8,190 (s) failures plus 8,190 (t) failures.
- WR-02: 39,866 failures.
- WR-03: the unguarded page fails 12 `--fault later` checks.
- WR-04: removing the clear in `render()`, or breaking the rAF write guard, fails the `?test` smoke.

## Fixed Issues

### CR-01: The solid-line text says +1 to hit is worth a full hit when the chart, card and formula all say it adds 0

**Files modified:** `index.html`, `tools/check-engine.mjs`
**Commit:** 0e4fe87
**Applied fix:** In `VM.explainChart`, the step sentence now appears only where the line actually steps:
- **Capped across the whole chart** (11,648 settings): no step sentence. The text reads `It is flat across the whole chart, in the band marked “95% cap”: you already hit on 2+, and a natural 1 always misses, so +1 to hit has no face left to turn into a hit.`
- **No-damage d4 settings that are also capped** (182 settings): the old sentence was "Each +1 to hit turns one more d20 face into a hit … stays flat even outside the shaded bands". It is replaced by a whole-chart cap sentence.
- **Floor band from +0** (15,360 settings; the card says `+0` there too): the band sentence comes first, then the step, scoped `From +{e + 1}, each +1 to hit turns one more d20 face …`.

check-engine (v) now reads every priced step back from the text ("worth V", from +0 or "From +k,") and checks it against the engine:
- the d20 must gain a face at that N;
- the attack series step there must be greater than 0 and equal V at the printed precision;
- where `a[1] === a[0]`, no unscoped "Each +1 to hit … worth" sentence may appear.

New counts are pinned.

**Deviation from 04-UI-SPEC:** "Sentence 1 always explains the step" no longer holds. In the capped-from-+0 case the step sentence is dropped. In the floor-band case the floor sentence comes first and the step is scoped "From +k". The whole-chart cap wording also changes from "so more to-hit buys nothing" to "so +1 to hit has no face left to turn into a hit". D-04 and D-06 take precedence.

### WR-01: The table-branch formula note says "The table gives X per round" when the table's average is a different number

**Files modified:** `index.html`, `tools/check-engine.mjs`
**Commit:** bf254d0
**Applied fix:**
- **Formula note:** at the 8,190 `critFloorDiffers` settings, `formulaView` now says `Counting every roll exactly, with a real two-dice crit, gives X per round, the same as the Expected per round card.` It keeps `The table gives X` only where the table's own average is exact.
- **+1-to-damage line:** it had the same false "from the table" claim at the same 8,190 settings, and now says "counted exactly" there. The +1-to-hit "from the table" lines are always exact, because both settings share the crit row, so they are unchanged.

New claim checks:
- check-engine (s): the note may name the table only if `tableSum × die === e20Num`, and the printed number must then be the table's own average.
- check-engine (t): a +1 line that says "from the table" must print the table's own difference exactly, `(tableSum after − tableSum now) × die === exact numerator`.

**Deviation from 04-UI-SPEC:**
- The table-branch row (AC 15 / d8 / +5 / −3) now reads "Counting every roll exactly, with a real two-dice crit, gives 1.240 …" instead of "The table gives 1.240 …".
- The +1-to-damage table line says "counted exactly" instead of "from the table" wherever D ≤ −3.
- This extends the review's fix to the +1-to-damage line, which made the same false claim. The review did not flag it. The project notes asked that every "the table gives X" claim be true.

### WR-02: "What moves the crossover" promises a lever that cannot produce a crossover at many settings

**Files modified:** `index.html`, `tools/check-engine.mjs`
**Commit:** f688948
**Applied fix:** New `VM.crossLevers(p, first, maxN)`, exported. For the plain no-crossing case it tries every other slider AC and every other die, one change at a time:
- when damage leads: a higher AC or a bigger die, to see if +N to hit can lead;
- when hit leads: a lower AC or a smaller die, to see if +N to damage can lead.

It prices sweeps through `DiceMath.damageFor`, using `e20Num = (hitFaces − 1) × die × normalNum + critNum` with a memo per (die, dmg). `explainChart` then names only the confirmed levers:
- both levers: the old two-sentence text;
- AC only: "…, and that can let +N to hit pull ahead.";
- die only: "A bigger die makes each extra hit worth more, and that can …";
- neither: "Here neither a higher AC nor a bigger die, on its own, lets +N to hit pull ahead." (the attack-first case uses the mirror wording).

Without a probe (synthetic series), no lever is named. The old text was true at only 4,907 of 44,772 no-crossing settings, and false at the defaults, where a bigger die alone never lets +N to hit lead.

To keep the self-test budget, `chartView` now builds `explain` on first read through an enumerable getter, memoized per settings key. The page reads it every render, but the self-test's chart checks never do.

check-engine (w) checks the lever claims against the full domain:
- A one-byte lead table records whether each setting's hit or damage bonus leads at some N.
- After the loop, it checks that each no-crossing text names a lever if and only if the sweeps confirm it, and says "neither" if and only if none works.
- Lever counts are pinned (damage-first both / ac / die / none = 2,946 / 16,687 / 1,744 / 8,718; attack-first = 1,961 / 10,916 / 56 / 1,744).
- Sampled `chartView` lines must equal the checked line.
- The defaults' line is pinned against the page's own `chartView`.

**Deviation from 04-UI-SPEC:**
- The two no-crossing rows now have four variants each.
- The default body is now "At these settings the curves never cross, so there is no ring on the chart. A higher AC leaves fewer hits for +1 damage to add to, and that can let +N to hit pull ahead." The in-page self-test string was updated to match.
- At the slider edges (AC 30 or d12, AC 10 or d4), the "neither" sentence is true but vacuous, because no higher or lower value exists.

### WR-03: Only the first render is guarded; a throw in any later render leaves a half-painted page with no banner

**Files modified:** `index.html`, `tools/check-page.mjs`
**Commit:** 41b2337
**Applied fix:**
- `scheduleRender` wraps `render()` in try/catch and re-checks `broken` inside the rAF.
- A new shared `failPage(err)` is used by both the scheduled path and init's first-render catch. It latches `broken`, logs `render failed`, hides `PAINTED_SECTIONS`, disables Roll and the presets (a later failure finds them enabled), and shows the banner.
- check-page gains `--fault later`. `render()` throws only from its second call on. After init, the appended script sets `#ac-range` to 20 and dispatches `input`. The mode also checks that the first render painted 80 row headers, then applies the same failure checks as `--fault render`.

### WR-04: The new preset smoke check "a control change clears the status" cannot fail

**Files modified:** `index.html`
**Commit:** 3cfa6b1
**Applied fix:**
- `runUiSmoke` now temporarily captures the rAF callbacks the preset click queues (the render, then the guarded status write), restores `requestAnimationFrame`, and runs them in order. This exercises the real write path, including the `lastPreset === applied` guard.
- New check `explore ui: the click writes the status in its frame` asserts the status is non-empty and equals `VM.presetStatus(lastPreset)`. Only after that does the control change have to clear it.
- The `finally` rAF still clears the status, so the DOM dump never carries it.

---

_Fixed: 2026-09-27T19:03:06Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
