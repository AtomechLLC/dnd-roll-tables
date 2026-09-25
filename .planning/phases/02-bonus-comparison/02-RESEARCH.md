# Phase 2: Bonus Comparison - Research

**Researched:** 2026-09-25
**Domain:** Vanilla single-file interactive visualization: exact dice math series, hand-built inline SVG line chart, CSS grid + container-query table layout
**Confidence:** HIGH for the math and reference values (computed from the real `DiceMath` in `index.html` over the full control domain). HIGH for the layout arithmetic (measured in headless Chrome on this machine). MEDIUM for the SVG text-sizing and touch behaviour (official docs plus reasoning, not yet eyeballed in this page).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Page structure: the big table stays, comparison and chart go below it
- **D-01:** The Phase 1 full-size outcome table (40 px wide tier) stays exactly where and how it is. It remains the "study" view. Nothing in Phase 2 moves into the top control strip or the stat-card row.
- **D-02:** Page order top to bottom: controls strip → stat cards → outcome table → **Compare +N section** (N slider, then the three compact tables) → **Sweep chart section** (chart, readout line, caption). User chose "stats → tables → chart" and "keep the big table, add three compact ones below".
- **D-03:** The N slider lives at the head of the Compare section, not in the top strip. Label it "Compare at +N" with an inline `<output>` showing the signed value ("+5"). Range 0..20, step 1, updates on the `input` event, parsed through the same `CONTROL_SPEC` / `parseControl` path as every other control (new key `n`, so the domain lives in one place; see 01-REVIEW.md IN-04). Default N = +5 so the first load shows a visible shift.
- **D-04 (amended CMP-04, user decision):** The +N-to-hit and +N-to-damage tables show the **resulting damage totals in every cell with no special diff highlighting**. No outlined "new hit" rows, no "+N" badges in cells, no "new hit" / "+N" text in the note column, no delta toggle. The user was offered all of these and chose plain values. The shift is conveyed by four things that are already required: the values themselves, the single shared color scale across the three tables (CMP-02), each table's own "hits on N+" threshold rule which visibly moves down in the +hit table (CMP-03), and each table's caption carrying its 20-round total and its delta vs baseline ("+9.0 over 20 rounds").
- **D-05:** REQUIREMENTS.md CMP-04 has been rewritten to say exactly that. ROADMAP.md Phase 2 success criterion 1's clause "Rows that flipped from miss to hit are highlighted ... and the +N-to-damage table marks its uniform per-cell increase" is **superseded** by D-04; verification checks values, shared scale, threshold rule, and captions instead.

#### The three compact tables
- **D-06:** Fixed order and captions: "Baseline (+0)", "+N to hit", "+N to damage" (with N substituted, e.g. "+5 to hit"). Each caption also shows that table's hit rule ("hits on 5+"), its 20-round expected total, and for the two variants the delta vs baseline. All numbers come from `DiceMath.stats` with the adjusted parameters; totals use the same tenths rounding as the stat cards (STAT-02 consistency).
- **D-07:** The three tables reuse the existing table markup and the `#outcome` sizing tiers (retarget those rules to a shared class so four tables share one stylesheet). Each sits in its own `container-type: inline-size` wrapper inside a CSS grid that puts three across at about 1366 px (each track lands in the existing 24 px "mid" tier at d12, about 400 px per table) and stacks them full width on narrow screens. No horizontal page scroll at any width (CMP-05). Ascending d20 rows, note column kept (it is how the threshold rule shows at compact size).
- **D-08:** One shared heat domain across all three compact tables: `heatMax = max cell damage across the three` (in practice the +N-to-damage crit max, 2X + D + N), computed before rendering (CMP-02). The big Phase 1 table and the single legend use the same domain so the same number is the same color anywhere on the page (one rule, one legend). Miss cells keep the striped neutral style.

#### The sweep chart
- **D-09:** Inline SVG built with `document.createElementNS`, fixed `viewBox` (about 640 x 360), `width: 100%; height: auto`, `vector-effect="non-scaling-stroke"`, `role="img"` with `aria-labelledby` pointing at the caption. No chart library (PROJECT.md).
- **D-10:** Two series from `DiceMath.sweep` at the current AC / die / base attack / base damage, 21 points each, both starting at the same N = 0 point (CHART-02). Series are distinguishable by color **and** stroke pattern (solid vs dashed), with direct labels at the right end of each line plus a small legend. Colors are theme tokens that pass contrast on both parchment and candlelit backgrounds.
- **D-11:** Axes: x titled "Extra bonus +N" with ticks at every integer and labels every 5; y titled "Expected damage over 20 rounds", starting at 0 (never truncated), nice ticks in 1/2/5 steps with value-labeled gridlines. The y maximum auto-scales to the current curves (nice ceiling of the larger series) because a fixed per-die maximum squashes high-AC settings like AC 25 / d12 into the bottom tenth of the chart. The labeled gridlines make the rescale visible.
- **D-12:** A vertical marker at the current N follows the slider (CHART-05), with a dot on each curve at that N.
- **D-13 (user choice):** Hover readout only. Moving the pointer over the chart updates a text line under the chart with N, the two 20-round values, and their gap; when the pointer leaves, the readout returns to the slider's N. No click or drag on the chart to set N. Keyboard and touch users read the same line driven by the slider.
- **D-14:** Crossover markers (CHART-03) are computed from the two 21-point series, never assumed: a crossing is a sign change of (attack − damage) between consecutive integer N, or an exact tie at an integer N > 0. Mark each with a dot and a short label; the marker may sit at the interpolated fractional N, the caption reports the first integer N at which the order has flipped. Zero, one, and two crossings are all normal states with no false markers. The caption sentence is generated from the data: "Damage bonus leads at every N from +1 to +20", "+N to hit leads until +K, then the damage bonus pulls ahead", or the two-crossing form. Reference behaviour from PITFALLS.md: AC 15 / +0 / d8 → none; AC 25 / +0 / d8 → cumulative flip at N = 7; d12 / AC 15 / +0 → to-hit leads, damage catches up at +15; d12 / AC 25 / +0 → damage leads +1..+5, to-hit overtakes at +6.
- **D-15:** Flat stretches of the attack curve (CHART-04) are shaded bands with an in-band label: the "95% cap" band where A + N >= C − 2, and the "only a nat 20 hits" band where C − (A + N) >= 20. Bands render only where they fall inside 0..20.

#### Engine, view-model, and self-test
- **D-16:** New pure helpers in `DiceMath`: crossover detection over the two series, and the plateau / floor N boundaries. `VM.computeView` grows a compare block (three row sets, shared `heatMax`, per-table threshold / total / delta) and a chart block (series, crossings, bands, y ticks). Renderers stay DOM-only.
- **D-17:** `renderTable` is generalized to render into any given table element (the big table plus the three compact ones) rather than duplicated.
- **D-18:** The self-test gains assertions for: both series equal at N = 0; the four crossover reference cases above; plateau start and floor end N for AC 15 / +5 and AC 25 / +0; shared `heatMax` across the three tables; the +hit table's threshold equals `clamp(C − A − N, 2, 20)`; and `tools/check-engine.mjs` keeps passing in Node.

### Claude's Discretion
- Exact viewBox, margins, and SVG font sizes; chart height on phones.
- Series colors and dash pattern, as long as they pass contrast in both themes and are distinguishable without color.
- The three-up grid breakpoint and gap, tuned by testing d12 at about 1366 px.
- Caption wording and where the readout line and caption sit under the chart.
- How the hover is implemented (an overlay `<rect>` with `pointermove` is the expected route).
- Whether to fold in the 01-REVIEW.md WR-01 fix (per-round figure derived from the rounded 20-round total) while touching `computeView`.

### Deferred Ideas (OUT OF SCOPE)
- "Show delta" toggle that swaps the +N tables to per-cell differences vs baseline — offered, declined for now; possible later polish.
- Click or drag on the chart to set N (full linked views, FEATURES.md D6) — offered, declined; the slider is the only input.
- Outlined "new hit" rows, note-column "+N" marks, and in-cell "+N" badges — offered as CMP-04 styles, declined in favour of plain values.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CTRL-04 | Comparison bonus N (0..20) slider drives the side-by-side tables and chart marker | §Pattern 1 (second control root; `CONTROL_SPEC.n`); Pitfall 1 (the N slider sits outside `#controls`, so the existing listeners never see it) |
| CHART-01 | SVG line chart, x = N 0..20, y = expected 20-round damage, attack series vs damage series | §Reference Values (exact numerator series); §Pattern 4 (chart skeleton + update); §Code Examples (`svgEl`, `linearScale`, polyline points) |
| CHART-02 | Labeled axes, ticks, legend, both series meet at N = 0 | §Pattern 4 layout table; `niceTicks` verified over the whole y-range (20..890); N = 0 equality verified for all 70,980 settings |
| CHART-03 | Crossover markers; 0/1/2 crossings as normal states | §Pattern 3 (algorithm); **Finding: in N = 0..20 there are at most 1 crossing for every setting** (exhaustive); tie-crossing and end-tie cases enumerated; synthetic series for 2-crossing and touch tests |
| CHART-04 | Flat stretches of the attack curve shaded and labeled | §Pattern 3b bands; band formulas match the actual flat segments in all 70,980 settings (0 mismatches), plus one unbanded flat case (d4, D ≤ −4) |
| CHART-05 | Vertical marker at current N | §Pattern 4; smoke check on the marker x |
| CMP-01 | Three tables: baseline, +N hit, +N damage | §Pattern 2 (generalized `renderTable`, shared `.outcome` class) |
| CMP-02 | Shared color domain across the three | `heatMax = 2X + D + N` equals the true max cell in every setting (verified); Pitfall 6 (big table wash-out; legend labels change at defaults) |
| CMP-03 | Each table shows its own threshold rule and 20-round total under it | Default N = 5 reference captions; Open Question 1 (caption above vs stats line "under it") |
| CMP-04 (amended) | Plain resulting values, no diff highlighting; shift carried by values, shared scale, threshold, caption total + delta | Delta rounding rule (Pitfall 7: 8,287 cases where the two rounding orders differ by 0.1) |
| CMP-05 | Side by side at ~1366 px with d12, stacked on narrow screens, no horizontal page scroll | Measured: headless 1366 gives `clientWidth` 1329, so 3 tracks = 421.7 px each ≥ 400 px d12 table; §Pattern 5 CSS; 1280 px is too narrow for three at any gap |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

CLAUDE.md is research-generated stack guidance. Where it conflicts with PROJECT.md, PROJECT.md wins (confirmed in 02-CONTEXT.md canonical refs).

- One `index.html`, inline `<style>` and inline scripts, no build step, no `package.json`, no bundler, no TypeScript.
- **Classic inline `<script>` blocks, not `type="module"`** (PROJECT.md Key Decisions overrides the CLAUDE.md module recommendation). Four blocks in order `dice-math` → `view-model` → `dice-selftest` → `app`.
- No frameworks, no CDN, no external requests (CSP `default-src 'none'` enforces this). Must work from `file://`.
- Inline SVG via `document.createElementNS`; no Chart.js/D3/Plotly. `viewBox` + `width:100%; height:auto` + `vector-effect: non-scaling-stroke`; never fixed pixel `width`/`height`.
- Exact enumeration for all displayed stats; no Monte Carlo in this phase.
- Semantic `<table>` with `<th scope>` for outcome tables; CSS Grid only for page layout.
- `input` event on sliders, not `change`.
- `addEventListener` only. No inline `on*=""` handlers, no `document.write`.
- `innerHTML` only for fully numeric output and fixed label strings; everything else is `createElement`/`createElementNS` + `textContent`.
- Theming uses `@media (prefers-color-scheme: dark)` token overrides. `light-dark()` only as an enhancement (not used today).
- Node is dev-only (`tools/*.mjs`) and must never become a build dependency.
- GSD workflow: edits go through `/gsd-execute-phase`. GitHub publish stays deferred (user memory: local git only, no gh auth/push/Pages until asked).

## Summary

Phase 2 adds two sections under the existing study table in `index.html`. The first is a "Compare +N" block: an N slider and three compact outcome tables that share one heat domain. The second is a hand-built SVG sweep chart with a current-N marker, crossover markers, shaded flat bands, a hover readout, and a generated caption. The engine already provides `DiceMath.sweep`, `stats`, and `threshold`, so the new math is small: a crossover detector over two integer series, a band helper, `niceTicks`, and caption/readout strings in `VM`. The work that needs care is integration. Four existing pieces break silently when Phase 2 lands, and the plan must change each one deliberately:

1. The N slider sits outside `<form id="controls">`, so the delegated listeners and `renderControls` never see it.
2. `check-page.mjs` asserts exactly 20 `<th scope="row">` headers. Four tables give 80.
3. The shared heat domain changes the default legend from `0,4,8,12,16` to `0,5,11,16,21`, which breaks an existing smoke check.
4. If the sweep goes into the `computeView` that the self-test grid (750 combos, run on every page load) and `check-engine` (70,980 combos) call, page load gets about 1.4 s slower and check-engine about 2 minutes slower.

The biggest research finding concerns crossings. Exhaustive enumeration of the real engine over the whole control domain (AC 10..30 × 5 dice × attack −5..20 × damage −5..20 = 70,980 settings) shows that **within N = 0..20 the two curves never cross more than once**. The split is: 30,111 settings where the damage bonus leads throughout, 14,677 where the hit bonus leads throughout, 11,830 where hit leads and then damage overtakes, and 14,362 where damage leads and then hit overtakes. The earliest second crossing anywhere is at N = 23 (AC 16 / −5 / d8 / −4). The two-crossing branch that PROJECT.md and ROADMAP SC3 call "normal" is therefore unreachable from the UI. It should still be implemented as a generic loop and tested with synthetic series. There are 874 settings where the crossing lands exactly on an integer tie, 16 where the curves end tied at N = 20, and none where they touch without crossing. All four PITFALLS/CONTEXT reference claims check out exactly (AC 25/+0/d8 flips at 7; d12/AC 15 at 15; d12/AC 25 at 6; AC 15/+0/d8 none).

**Primary recommendation:** Keep the math pure and exhaustively checkable. Add `DiceMath.crossings(a, d)` (sign changes over integer numerators with tie handling) and `DiceMath.attackBands(p, maxN)`. Add `VM.niceTicks`, `VM.compareView(p, n)`, and `VM.chartView(p, n)`. Compose these into the page view, but keep the per-combo grid checks on a stats-only view. Build the SVG skeleton once and update its attributes on each render. Make hover a separate lightweight readout path that never calls `render()`.

## Architectural Responsibility Map

All tiers are inside one static `index.html`. There is no server. "Tiers" here are the four script blocks and the CSS.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Series values, crossings, band boundaries | `dice-math` (pure engine) | — | Pure functions over params/integer arrays; Node-testable; RULES-05 single source |
| N parsing/clamping | `view-model` (`CONTROL_SPEC.n`, `parseControl`) | `app` (binding) | IN-04: one domain definition |
| Compare block (3 row sets, shared heatMax, captions, deltas) | `view-model` | — | Derive-once; formatting via `fixed`/`tenths`/`signed` |
| Chart block (y ticks, crossings, bands, caption sentence, 21 readout strings) | `view-model` | — | Strings chosen in the VM (ARCHITECTURE Pattern 6), testable in Node |
| Chart geometry (viewBox, margins, scales, SVG elements) | `app` (renderer) | CSS (font sizes per container tier) | Layout constants are presentation, not math |
| Hover → N mapping, readout text swap | `app` (event handler + rAF) | — | Must not touch `state` or trigger `render()` |
| Three-up / stacked layout, table tiers | CSS (grid + container queries) | — | No JS layout reads |
| Verification | `dice-selftest` + `runUiSmoke` + `tools/check-engine.mjs` + `tools/check-page.mjs` | — | Extend, do not fork |

## Standard Stack

No new libraries. Everything is platform features already in use in Phase 1.

### Core
| Feature | Status | Purpose | Why |
|---------|--------|---------|-----|
| Inline SVG (`createElementNS`) | Universal | Chart | D-09; CSP allows inline DOM |
| `vector-effect: non-scaling-stroke` | Baseline widely available since 2020-07 [CITED: developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/vector-effect] | Constant line weight when the SVG scales | Usable as a CSS property; CSS beats the attribute |
| `pointer-events` on SVG | Default `visiblePainted` [CITED: developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/pointer-events] | Hover hit area | A `fill="none"` rect is NOT hit-testable by default; needs `pointer-events: all` |
| `<output>` | Universal; implicit role `status` (live region); does not need a form [CITED: developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/output] | "+5" next to the N slider | D-03 |
| CSS container queries (size) | Baseline widely available 2025-08 (CLAUDE.md, web-features) | Table tiers (existing) + three-up switch + chart font tiers | Already the project's layout mechanism |
| `color-mix()` in oklch | Baseline widely available 2025-11 | Band fill | Already used for heat and line tokens |
| Pointer Events + `touch-action` | Universal [CITED: developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action] | Hover/touch scrubbing of the readout | `pointercancel` fires when the browser takes over a pan |

### Hand-written helpers (all inline, all pure except `svgEl`)
| Helper | Block | Lines | Purpose |
|--------|-------|-------|---------|
| `DiceMath.crossings(a, d)` | dice-math | ~25 | Crossing list, first leader, end tie |
| `DiceMath.attackBands(p, maxN)` | dice-math | ~8 | `{ floor: [0, fe] \| null, cap: [cs, maxN] \| null }` |
| `VM.niceTicks(max, target=5)` | view-model | ~10 | 1/2/5 × 10^k ticks from 0 |
| `VM.compareView(p, n)` | view-model | ~30 | Three tables + captions + shared `heatMax` |
| `VM.chartView(p, n)` | view-model | ~40 | Series (numerators + den), ticks, crossings, bands, caption, `readout[0..20]` |
| `linearScale(d0, d1, r0, r1)` with `.invert` | app (or VM) | ~5 | Data ↔ viewBox units |
| `svgEl(tag, attrs, text)` | app | ~6 | `createElementNS` wrapper |

**Installation:** none.

## Package Legitimacy Audit

No external packages are installed in this phase. The project forbids them (no npm, no CDN). slopcheck was not needed.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| (none) | — | — | — | — | — | — |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Reference Values (computed from the real engine)

Produced by loading the `dice-math` and `view-model` blocks from the current `index.html` into a Node 24 `vm` context, the same way `tools/check-engine.mjs` does. `sweep()` returns 20-round numerators over `den = die²`. [VERIFIED: local enumeration, 2026-09-25]

### Sweep series, N = 0..20 (20-round expected damage)

**AC 15 / +5 / d8 / +0 (page default), den 64**
```
N    :   0     1     2     3     4     5     6     7     8     9    10    11    12    13    14    15    16    17    18    19    20
atk  : 54.0  58.5  63.0  67.5  72.0  76.5  81.0  85.5  90.0  90.0  90.0  90.0  90.0  90.0  90.0  90.0  90.0  90.0  90.0  90.0  90.0
dmg  : 54.0  65.0  76.0  87.0  98.0 109.0 120.0 131.0 142.0 153.0 164.0 175.0 186.0 197.0 208.0 219.0 230.0 241.0 252.0 263.0 274.0
atkNum: 3456 + 288·min(N, 8)          dmgNum: 3456 + 704·N
```
Crossings: none (damage leads from +1). Cap band [8, 20]. No floor band.

**AC 15 / +0 / d8 / +0, den 64**
```
atk  : 31.5  36.0  40.5  45.0  49.5  54.0  58.5  63.0  67.5  72.0  76.5  81.0  85.5  90.0  90.0 ... 90.0
dmg  : 31.5  37.5  43.5  49.5  55.5  61.5  67.5  73.5  79.5  85.5  91.5  97.5 103.5 109.5 115.5 121.5 127.5 133.5 139.5 145.5 151.5
atkNum: 2016 + 288·min(N, 13)         dmgNum: 2016 + 384·N
```
Crossings: none (damage leads from +1). Cap band [13, 20]. No floor band.

**AC 25 / +0 / d8 / +0, den 64**
```
atk  :  9.0   9.0   9.0   9.0   9.0   9.0  13.5  18.0  22.5  27.0  31.5  36.0  40.5  45.0  49.5  54.0  58.5  63.0  67.5  72.0  76.5
dmg  :  9.0  10.0  11.0  12.0  13.0  14.0  15.0  16.0  17.0  18.0  19.0  20.0  21.0  22.0  23.0  24.0  25.0  26.0  27.0  28.0  29.0
atkNum: 576 + 288·max(0, N − 5)       dmgNum: 576 + 64·N
```
Crossings: 1. Damage leads +1..+6; attack leads from **+7** (diff −1.5 at 6, +2.0 at 7). Marker at x = 45/7 ≈ 6.4286, y = 108/7 ≈ 15.4286. Floor band [0, 5]. No cap band (cap would start at 23).

**AC 15 / +0 / d12 / +0, den 144**
```
atk  : 45.5  52.0  58.5  65.0  71.5  78.0  84.5  91.0  97.5 104.0 110.5 117.0 123.5 130.0 130.0 ... 130.0
dmg  : 45.5  51.5  57.5  63.5  69.5  75.5  81.5  87.5  93.5  99.5 105.5 111.5 117.5 123.5 129.5 135.5 141.5 147.5 153.5 159.5 165.5
atkNum: 6552 + 936·min(N, 13)         dmgNum: 6552 + 864·N
```
Crossings: 1. Attack leads +1..+14 (diff +0.5 at 14); damage leads from **+15** (−5.5). Marker at x = 169/12 ≈ 14.0833, y = 130.0 exactly. Cap band [13, 20].

**AC 25 / +0 / d12 / +0, den 144**
```
atk  : 13.0  13.0  13.0  13.0  13.0  13.0  19.5  26.0  32.5  39.0  45.5  52.0  58.5  65.0  71.5  78.0  84.5  91.0  97.5 104.0 110.5
dmg  : 13.0  14.0  15.0  16.0  17.0  18.0  19.0  20.0  21.0  22.0  23.0  24.0  25.0  26.0  27.0  28.0  29.0  30.0  31.0  32.0  33.0
atkNum: 1872 + 936·max(0, N − 5)      dmgNum: 1872 + 144·N
```
Crossings: 1. Damage leads +1..+5; attack leads from **+6** (diff −5.0 at 5, +0.5 at 6). Marker at x = 65/11 ≈ 5.9091, y = 208/11 ≈ 18.9091. Floor band [0, 5].

**Extra edge cases for tests**
| Setting | What it exercises | Result |
|---------|-------------------|--------|
| AC 16 / −5 / d4 / +0 | Both bands at once plus a crossing | Floor [0, 1], cap [19, 20]. Damage leads at +1, attack from +2 (x = 5/3, y = 20/3). N = 20: 50.0 vs 25.0 |
| AC 10 / +0 / d4 / +14 | Crossing exactly on an integer tie | Attack leads to +11; tie at +12 (both 316.0); damage leads from +13. Marker at x = 12 |
| AC 27 / −5 / d4 / +0 | Curves end tied at N = 20 (no flip in range) | Damage leads +1..+19; both 25.0 at +20 |
| AC 23 / −5 / d6 / −2 | End tie, fractional-slope damage | Same shape; both 25.0 at +20 |
| AC 20 / +5 / d12 / +3 | Attack leads everywhere (FEATURES.md claim) | No crossing; N = 20: 187.0 vs 183.5 (verified) |
| AC 10 / +0 / d12 / +0 | Early cap | Cap [8, 20]; 130.0 vs 298.0; no crossing |
| AC 30 / −5 / d12 / +0 | Long floor, late crossing | Floor [0, 15]; damage leads to +17, attack from +18 |
| d4 with dmg −4 or −5 (any AC/atk) | Attack curve flat everywhere, but NOT a cap/floor band (normal hits deal 0) | 1,092 settings; draw no band (see Pitfall 8) |

### Verification of the PITFALLS.md / CONTEXT.md claims
| Claim | Result |
|-------|--------|
| AC 25 / +0 / d8 flips at N = 7 (13.5 vs 15.0, then 18.0 vs 16.0) | **Confirmed exactly** |
| d12 / AC 15 / +0: to-hit leads, damage catches up at +15 | **Confirmed** (flip N 15; last hit-lead N 14) |
| d12 / AC 25 / +0: damage leads +1..+5, to-hit overtakes at +6 | **Confirmed** |
| AC 15 / +0 / d8: no crossover | **Confirmed** (and none at the +5 default either) |
| "zero, one, or two crossings are normal states" (PROJECT.md, ROADMAP SC3) | **Discrepancy:** in N = 0..20, two crossings **never** occur (0 of 70,980). Earliest second crossing: N = 23. Keep the generic code path; test it with synthetic series only. |
| Plateau "A + N ≥ C − 2", dead zone ends "A + N ≥ C − 19" | **Confirmed**: band formulas match actual flat steps in every setting (0 mismatches), with the extra d4 D ≤ −4 flat case |
| Damage curve always rises | **Confirmed**: strictly increasing in every setting (crit cells always gain +1) |
| Attack curve never decreases | Confirmed (so the y-max is always at N = 20: `max(atk[20], dmg[20])`) |
| y-range across the domain | Max of the larger series at N = 20 ranges 20.0 (AC 15 / −5 / d4 / −5) to 890.0 (AC 10 / +8 / d12 / +20) |

### D-18 band assertions
| Setting | capStart = C − A − 2 | floorEnd = C − A − 20 | Bands drawn |
|---------|----------------------|-----------------------|-------------|
| AC 15 / +5 | 8 | −10 | cap [8, 20] only |
| AC 25 / +0 | 23 | 5 | floor [0, 5] only |
| AC 15 / +0 | 13 | −5 | cap [13, 20] |
| AC 16 / −5 | 19 | 1 | floor [0, 1] and cap [19, 20] |
| AC 10 / +8 or more | ≤ 0 | — | cap [0, 20] (whole chart) |

### Compare tables at the default (AC 15 / +5 / d8 / +0, N = +5)
| Table | Threshold | 20-round total | Delta |
|-------|-----------|----------------|-------|
| Baseline (+0) | hits on 10+ | 54.0 | — |
| +5 to hit | hits on 5+ | 76.5 | +22.5 |
| +5 to damage | hits on 10+ | 109.0 | +55.0 |

Shared `heatMax` = 21 (= 2·8 + 0 + 5). The legend ramp labels become **`0,5,11,16,21`** (were `0,4,8,12,16`). Other cases: N = 0 gives 16 with three identical tables and deltas +0.0. N = 20 gives 36 with thresholds 10 / 2 / 10 and totals 54.0 / 90.0 / 274.0. At AC 25 / +0 / d12, N = 5 gives thresholds 20 / 20 / 20 and totals 13.0 / 13.0 / 18.0 (the +5 to hit table is identical to baseline, which is the floor lesson).

## Architecture Patterns

### System Architecture Diagram

```
 user input                                   pointer over chart
 ─────────────                                ──────────────────
 #controls form ──┐                           svg pointermove / pointerleave
 #compare-controls┤ (input/change)                     │
                  ▼                                    ▼
          onControl(e) ── VM.parseControl(key)    hoverN = mapX(clientX) → 0..20
                  │                                    │ (unchanged? stop)
                  ▼                                    ▼
          setState(patch) → scheduleRender (rAF)   rAF → paintReadout(lastView, hoverN ?? state.n)
                  │                                     (textContent + hover guide only;
                  ▼                                      never touches state or render())
               render()
                  │
                  ▼
        view = VM.pageView(state)
          ├─ statsView(p)        ← DiceMath.stats / marginals / hitAverages   (Phase 1, unchanged)
          ├─ compareView(p, n)   ← DiceMath.stats ×3 (base, atk+n, dmg+n) → shared heatMax
          └─ chartView(p, n)     ← DiceMath.sweep(p, CONTROL_SPEC.n.max)
                                    → DiceMath.crossings(attack, damage)
                                    → DiceMath.attackBands(p, 20)
                                    → VM.niceTicks(max(atk[20], dmg[20]) / den)
                                    → caption sentence, readout[0..20]
                  │
                  ▼  (renderers, DOM only, in RENDERERS order)
   renderControls │ renderStats │ renderTable(big, heatMax shared) │ renderLegend(heatMax shared)
   renderFootnote │ renderCompare (3 × renderTable into .trio tables + stats lines)
   renderChart (update polylines, y grid, bands, crossing markers, N marker, caption)
   paintReadout(view, hoverN ?? state.n)
```

### Recommended file layout (inside `index.html`)
```
<style>        + .outcome (retargeted from #outcome), #compare / .trio grid, .chart*, series tokens
<main>
  ... Phase 1 sections unchanged ...
  <section id="compare" aria-labelledby="compare-h">      <!-- container: compare / inline-size -->
    <h2 id="compare-h">Compare +N</h2>
    <form id="compare-controls" class="n-control" novalidate> label + range[data-key=n] + <output> </form>
    <div class="trio"> 3 × (div.table-wrap > table.outcome#cmp-{base,hit,dmg}) + p.cmp-stats </div>
  </section>
  <section id="chart" aria-labelledby="chart-h">
    <h2 id="chart-h">…</h2>
    <div class="chart-legend"> (HTML legend: solid/dashed swatches + band swatch) </div>
    <div class="chart-wrap"> <svg id="sweep" viewBox="0 0 640 360" role="img" aria-labelledby="chart-caption"> </div>
    <p id="chart-readout"></p>
    <p id="chart-caption"></p>
  </section>
<script id="dice-math">   + crossings, attackBands
<script id="view-model">  + CONTROL_SPEC.n, DEFAULT_STATE.n = 5, niceTicks, compareView, chartView, pageView
<script id="dice-selftest"> + Phase 2 assertions (see Validation Architecture)
<script id="app">         + generalized renderTable, renderCompare, chartInit/renderChart, hover, smoke additions
```

### Pattern 1: A second control root for the N slider (CTRL-04)
**What:** Today `onControl` is attached with `form.addEventListener('input', …)` on `#controls` only, and `renderControls` walks `form.querySelectorAll('[data-key]')`. D-03 places the N slider in the Compare section, outside that form. Events bubble through DOM ancestors, not through the `form=""` owner, so the slider would be dead.
**Do:**
```js
// view-model
const CONTROL_SPEC = Object.freeze({ ...,
  n: Object.freeze({ min: 0, max: 20 }) });
const DEFAULT_STATE = Object.freeze({ ac: 15, die: 8, atk: 5, dmg: 0, n: 5 });

// app
const CONTROL_ROOTS = [document.getElementById('controls'), document.getElementById('compare-controls')];
for (const root of CONTROL_ROOTS) {
  root.addEventListener('submit', (e) => e.preventDefault());
  root.addEventListener('input', onControl);
  root.addEventListener('change', onChange);          // existing normalize-number-box logic
}
function renderControls() {
  for (const el of document.querySelectorAll('[data-key]')) { /* existing body */ }
  nOutEl.textContent = VM.signed(state.n);            // "+5"
}
```
Set the slider's `min`/`max` from `CONTROL_SPEC.n` in `init()`, or assert in the smoke test that the markup matches the spec, so IN-04 does not gain a fifth copy of the domain. `sweep(p, CONTROL_SPEC.n.max)` keeps the chart domain on the same source.

### Pattern 2: One table renderer, four tables (CMP-01, D-17)
**What:** `renderTable(view)` writes into the global `tableEl`. Generalize it to `renderOutcomeTable(el, { rows, params, threshold, heatMax, caption })` and call it four times: the big table plus `#cmp-base`, `#cmp-hit`, `#cmp-dmg`. Baseline stats are computed once and reused for the big table and `#cmp-base`.
**CSS retarget:** add `class="outcome"` to the existing `<table id="outcome">` and replace every `#outcome` selector with `.outcome`. Specificity checked: every retargeted rule drops from (1,x,y) to (0,x+1,y), and no competing rule (`.h`, `.m`, `tr.threshold > *`, `.note-*`) sets the same properties on the same elements. The container-query overrides are still later in the source with equal specificity, so they still win. The Phase 1 table renders identically.
**Keep the compact tables in the mid tier when stacked:** stacked full-width wrappers wider than 42rem would switch to the 40 px wide tier and become three more copies of the study table (652 px wide at d12). Use `.trio .table-wrap { max-width: calc(42rem - 1px); }`. The container then can never reach 42rem, so the existing tier rules pick mid (or narrow below 25rem) with no new tier CSS and no specificity games. (Discretion; it still "reuses the #outcome tiers" as D-07 asks.)

### Pattern 3: Crossover detection (CHART-03, D-14)
**Rule:** work on the exact integer numerators (`attack[n] − damage[n]`, same `den`), never floats. Track the last index with a non-zero difference.
- A **crossing** is recorded when the sign of the next non-zero difference differs from the last non-zero sign.
  - Adjacent (no tie between them): the marker is at `x = n0 + d0 / (d0 − d1)`, the exact intersection of the two drawn line segments (the polylines are straight between integers, so the dot lands exactly on both lines). `y = (a0 + (a1 − a0)·(x − n0)) / den`.
  - Separated by zero(s): the crossing is **at the tie**. The marker is at the first tied N (in-domain, tie runs are at most 1 long).
  - The caption uses `lastLeadN` (last N where the old leader strictly led) and `flipN` (first N where the new leader strictly leads), plus `tieN` if any.
- A **touch** (zero run with the same sign on both sides) is **not** a crossing and gets no marker. This never happens in-domain (verified 0 cases). The literal D-14 wording ("an exact tie at an integer N > 0") would count it, but D-14's "no false markers" requirement wins. Test it synthetically.
- An **end tie** (zero run that reaches N = 20): the curves meet at the right edge, but no flip is observable in range. It happens in 16 settings. Recommend a tie marker at (20, y) labeled "tie at +20" and a caption form "…leads from +1 to +19; the two are tied at +20". That is consistent with D-14's "exact tie at an integer N > 0 is a crossing", and honest.
- **First leader** = sign of the first non-zero difference for N ≥ 1 (always N = 1 in-domain; 0 leading ties found). If every difference is 0, report "the same at every N" (unreachable, but define it).

```js
// dice-math. a, d: equal-length integer arrays (same den), a[0] === d[0].
function crossings(a, d) {
  const list = [];
  let lastN = 0, lastS = 0, first = 0;
  for (let n = 1; n < a.length; n++) {
    const diff = a[n] - d[n];
    const s = Math.sign(diff);
    if (s === 0) continue;
    if (first === 0) first = s;
    if (lastS !== 0 && s !== lastS) {
      const adjacent = n - lastN === 1;
      const d0 = a[lastN] - d[lastN];
      const x = adjacent ? lastN + d0 / (d0 - diff) : lastN + 1;           // tie: at the tied N
      const yNum = adjacent ? a[lastN] + (a[n] - a[lastN]) * (x - lastN) : a[lastN + 1];
      list.push({ x, yNum, lastLeadN: lastN, flipN: n, tieN: adjacent ? null : lastN + 1,
                  to: s > 0 ? 'attack' : 'damage' });
    }
    lastN = n; lastS = s;
  }
  const endTieN = lastS !== 0 && lastN < a.length - 1 ? lastN + 1 : null;   // curves tied from here to the end
  const lead = (s) => (s > 0 ? 'attack' : s < 0 ? 'damage' : 'none');
  return { first: lead(first), list, endTieN };
}
```

**Caption forms** (generated in `VM.chartView`; exact wording is discretion. SC3 requires the default-like case to say the damage bonus leads at every N):
| State | Sentence |
|-------|----------|
| 0 crossings, damage first | "The damage bonus leads at every N from +1 to +20." |
| 0 crossings, attack first | "+N to hit leads at every N from +1 to +20." |
| 1 crossing, attack → damage | "+N to hit leads until +{lastLeadN}, then the damage bonus pulls ahead from +{flipN}." |
| 1 crossing, damage → attack | "The damage bonus leads until +{lastLeadN}, then +N to hit pulls ahead from +{flipN}." |
| tie crossing | "… leads until +{lastLeadN}, they tie at +{tieN}, then … leads from +{flipN}." |
| end tie | "The damage bonus leads from +1 to +19; the two are tied at +20." |
| 2 crossings (synthetic only) | "… leads until +K1, … leads from +F1 to +K2, then … leads again from +F2." (build from the list in a loop) |

**Synthetic series for tests** (short arrays are fine; the function is length-agnostic):
| a | d | Expect |
|---|---|--------|
| `[0,1,4,7,8,9]` | `[0,2,3,4,9,10]` | 2 crossings: x = 1.5 (flip 2, to attack), x = 3.75 (flip 4, to damage) |
| `[0,1,3,3]` | `[0,2,3,4]` | touch at 2, **0 crossings**, first = damage |
| `[0,2,3,3]` | `[0,1,3,5]` | 1 tie crossing at x = 2, flipN 3, tieN 2 |
| `[0,1,3]` | `[0,2,3]` | 0 crossings, endTieN = 2 |
| `[0,1,3]` | `[0,1,2]` | leading tie at 1; first = attack; 0 crossings |
| `[0,1,2]` | `[0,1,2]` | first = none; 0 crossings |

### Pattern 3b: Flat bands (CHART-04, D-15)
```js
// dice-math. Flat stretches of the attack curve over N in [0, maxN].
// floor: only a nat 20 hits while C − (A + N) ≥ 20  → flat on [0, C − A − 20]
// cap:   hits on 2+ once A + N ≥ C − 2               → flat on [C − A − 2, maxN]
function attackBands(p, maxN = 20) {
  const fe = p.ac - p.atk - 20, cs = Math.max(0, p.ac - p.atk - 2);
  return {
    floor: fe >= 1 ? [0, Math.min(maxN, fe)] : null,       // a stretch needs 2 points
    cap: cs <= maxN - 1 ? [cs, maxN] : null,
  };
}
```
Verified against the actual flat steps of `sweep()` in all 70,980 settings, with one exception: d4 with dmg ≤ −4, where every normal hit deals 0, so the attack curve is flat everywhere. Draw no band there (it is neither cap nor floor). `marginals().reason === 'nodmg'` already names this state if the caption wants it later (Phase 4 copy).

### Pattern 4: SVG chart, skeleton once, update per render (CHART-01/02/05)
**Layout (discretion; recommended starting values in viewBox units):**
| Item | Value |
|------|-------|
| viewBox | `0 0 640 360`; CSS `display:block; width:100%; height:auto; max-width:50rem; overflow:visible` |
| Plot area | left 64, right 540 (x step = 476/20 = 23.8), top 28, bottom 300 |
| Margins | left 64 (y ticks up to "1000" + rotated y title), right 100 (direct labels), top 28 (band labels strip), bottom 60 (x tick labels + x title) |
| Fonts (CSS `font-size` on SVG text is in user units) | tick labels 11.2, axis titles and direct labels 11.2, band/crossing labels 9.6. At `max-width: 50rem` (scale 1.25) these render at 14 px and 12 px, matching the UI-SPEC 12/14 sizes |
| Strokes (screen px via non-scaling-stroke) | series 2.5; damage series `stroke-dasharray: 6 4`; gridlines 1; N marker 1.5 |

**Build once in `chartInit()`** (after the engine check, in `init()`): background hit rect, `<g class="bands">`, `<g class="grid-y">`, x-axis ticks (fixed 0..20, labels at 0/5/10/15/20), two `<polyline>`s, `<g class="crossings">`, N-marker `<g>` (line + 2 dots + label), direct labels, axis titles, and the pointer listeners.
**Update in `renderChart(view)`**: `points` on both polylines, `replaceChildren` of the bands/grid-y/crossings groups, the N-marker `transform`/`cx`/`cy`, direct-label `y` (with de-collision, Pitfall 9), and the caption `textContent`. The fixed viewBox means no layout reads during render (ARCHITECTURE Pattern 5).

**Theme colors:** use CSS rules on classes (`.series-hit { stroke: var(--series-hit) }`), never `stroke="var(--x)"` presentation attributes. SVG2 parses presentation attributes with the attribute grammar, and `var()` there is inconsistent across engines (Chromium does not substitute it for some attributes) [CITED: w3.org/2025/11/20-svg-minutes.html; developer.mozilla.org fill]. Class rules also re-theme automatically on `prefers-color-scheme` changes.

### Pattern 5: Three-up layout (CMP-05)
```css
#compare { container: compare / inline-size; }
.trio { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--sp-4) var(--sp-3); }
@container compare (width >= 77rem) {                 /* 3 × 400px + 2 × 16px = 1232px */
  .trio { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
.trio .table-wrap { max-width: calc(42rem - 1px); }   /* compact tables stay mid/narrow tier */
```
**Measured widths** [VERIFIED: `node tools/check-page.mjs --width N --dump`, reading the smoke check's `clientWidth`]:
| Window | `clientWidth` | Content (−32 px padding) | Three tracks at 16 px gap | d12 table (32 + 12×24 + 80) | Fits? |
|--------|---------------|--------------------------|---------------------------|------------------------------|-------|
| 1366 (headless) | 1329 | 1297 | 421.7 px each (mid tier: 400 ≤ w < 672) | 400 | Yes, 21 px spare |
| 1280 (headless) | 1243 | 1211 | — (< 1232, stacks) | 400 | No three-up; stacks cleanly |
| 1280 real browser, 17 px scrollbar | ~1263 | ~1231 | needs 1232 | 400 | Misses by ~1 px; stacks |

Three d12 tables cannot fit at a 1280 px headless window at any gap (1211 < 1200 + 2g needs g ≤ 5). The ROADMAP target is ~1366, so 16 px gap and a 77rem breakpoint are correct. The 1-or-3 switch avoids the 2 + 1 orphan layout that `repeat(auto-fit, minmax(25rem, 1fr))` would produce between about 850 and 1230 px. For d4..d10 the tables are narrower (d8: 304 px), so three-up at 1366 has more room.

### Pattern 6: Hover readout off the critical path (D-13)
```js
let lastView = null, hoverN = null, hoverPending = false;
// in render(): lastView = view; paintReadout();
function nFromPointer(e) {
  const r = svg.getBoundingClientRect();                 // aspect preserved (height:auto), no letterboxing
  const ux = (e.clientX - r.left) * (VB_W / r.width);
  return Math.min(20, Math.max(0, Math.round(xScale.invert(ux))));
}
svg.addEventListener('pointermove', (e) => {
  const n = nFromPointer(e);
  if (n === hoverN) return;
  hoverN = n;
  if (!hoverPending) { hoverPending = true; requestAnimationFrame(() => { hoverPending = false; paintReadout(); }); }
});
svg.addEventListener('pointerleave', () => { hoverN = null; paintReadout(); });
svg.addEventListener('pointercancel', () => { hoverN = null; paintReadout(); });
function paintReadout() {
  if (!lastView) return;
  const n = hoverN ?? state.n;
  readoutEl.textContent = lastView.chart.readout[n];     // precomputed strings, no math here
  hoverGuide.toggleAttribute('hidden', hoverN === null);  // optional faint guide line
  if (hoverN !== null) hoverGuide.setAttribute('transform', `translate(${xScale(n)},0)`);
}
```
- Put a transparent background `<rect class="hit" pointer-events="all">` over the plot area **behind** the series and markers, and listen on the `<svg>`. A top overlay would swallow hover on the markers and kill their `<title>` tooltips.
- `hoverN` is not part of `state`. Phase 3's stale-simulation check compares control params, and hover must never trigger `render()` or the table rebuilds.
- Touch: pointer events fire during a drag. Put `touch-action: pan-y` on the HTML `.chart-wrap` (the browser intersects `touch-action` of the touched element and its ancestors), so vertical page scroll still works and a horizontal drag scrubs the readout. When the finger lifts, `pointerleave` fires and the readout returns to the slider N, as D-13 says.
- The readout `<p>` should not be a live region (hover would chatter). The N `<output>` already is one (implicit `role=status`).
- Precompute `readout[0..20]` in `VM.chartView`. Example: "At +7: to hit 18.0 · to damage 16.0 · to hit ahead by 2.0 (over 20 rounds)". Compute the gap as `tenths(a) − tenths(d)` so the three displayed numbers subtract correctly (Pitfall 7).

### Anti-Patterns to Avoid
- **Putting the sweep inside the `computeView` that the grids call.** The self-test grid calls `VM.computeView(p)` 750 times on every page load, and check-engine calls it 70,980 times. A sweep costs about 1.3–2.0 ms (measured), so that adds about 1.4 s per page load and about 2 minutes to check-engine. Split the view: keep Phase 1's body as `VM.statsView(p)`, have the grids call it, and compose `pageView(state) = { ...statsView(p), compare: compareView(p, n), chart: chartView(p, n) }`. This still satisfies D-16 ("computeView grows a compare block and a chart block"). If the planner prefers to keep the name `computeView` for the composed view, rename the grid call sites to `statsView`.
- **Recomputing the sweep while only N moves.** The sweep does not depend on N. A one-entry memo keyed `ac,atk,die,dmg` in `chartView` is optional; measured cost says it is not needed.
- **Rebuilding the whole `<svg>` on every render.** It drops listeners, hover state, and `<title>` tooltips. Update in place.
- **`innerHTML` for SVG.** Use `createElementNS` (D-09; also the XSS rule).
- **Float-based crossing detection.** `(a − d)/den` in floats can misclassify exact ties. Use the integer numerators.
- **Hard-coding `20` for the N range in several places.** Read `VM.CONTROL_SPEC.n.max`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Series values | A new EV formula for the chart | `DiceMath.sweep` (already via `stats` → `damageFor`) | RULES-05: one rule; the floor at D < −1 breaks the closed form |
| Hit rule per compact table | `ac − atk − n` arithmetic in the renderer | `DiceMath.threshold({ ...p, atk: p.atk + n })` / `stats().threshold` | Clamp to 2..20 already correct |
| Cap/floor detection for copy | Re-deriving reasons | `attackBands` for geometry; existing `marginals().reason` for the `nodmg` wording | One definition each |
| Number formatting | `toFixed` | `VM.fixed`, `VM.tenths`, `VM.signed` | `(1.575).toFixed(2) === "1.57"` (PITFALLS 6) |
| Theme colors in SVG | Reading computed styles in JS | CSS class rules with `var(--token)` | Automatic re-theme; no JS |
| Layout switching | JS width checks / ResizeObserver | Container queries | Project convention; no layout reads |

**Key insight:** every number the chart or the captions show must come from the same integer numerators the stat cards use, formatted by the same `fixed/tenths`. The page's credibility rests on the caption, readout, stat cards, and table captions agreeing to the tenth.

## Common Pitfalls

### Pitfall 1: The N slider is outside the listened-to form
**What goes wrong:** Dragging "Compare at +N" does nothing, and `renderControls` never writes the slider or the `<output>`.
**Why:** `form.addEventListener('input', onControl)` and `form.querySelectorAll('[data-key]')` only cover `#controls`.
**Avoid:** Pattern 1 (a second control root plus a document-wide `[data-key]` walk).
**Warning sign:** The smoke check "N slider 12 gives n 12" fails, or the `<output>` still says "+5".

### Pitfall 2: `check-page.mjs` row-header count
**What goes wrong:** `(3) DOM has 20 <th scope="row"> headers` fails with 80.
**Avoid:** Change the check to 80 (4 tables × 20), or count per table id. Update the tool's header comment.

### Pitfall 3: Existing smoke checks tied to the old default heat domain
**What goes wrong:** `'defaults: legend ramp swatches read 0,4,8,12,16'` fails, because the default is now N = 5 and the shared `heatMax` is 21.
**Avoid:** Update the expectation to `0,5,11,16,21`, or run that check with `n: 0` (which gives `heatMax` 16) and add a new N = 5 check. Grep `runUiSmoke` for every `VM.DEFAULT_STATE` use: `Object.assign(state, VM.DEFAULT_STATE)` now also sets `n: 5`.

### Pitfall 4: Sweep cost in the grid loops
See Anti-Patterns. Measured: `sweep` d12 ≈ 2.06 ms, d8 ≈ 1.34 ms, the Phase 1 `computeView` d12 ≈ 0.28 ms, and 750 sweeps ≈ 1.42 s. Current check-engine: 13.8 s for 70,980 combos.

### Pitfall 5: SVG text becomes illegible on phones
**What goes wrong:** With a fixed 640-wide viewBox, 11.2-unit text renders at about 5.7 px in a 328 px phone column.
**Why:** CSS `font-size` on SVG text is in user units and scales with the viewBox [ASSUMED: standard SVG behaviour, not measured in this page].
**Avoid:** Make `.chart-wrap` a named container and step the SVG font sizes by container width. Put names and long text in HTML (legend, readout, caption), not in SVG:
```css
.chart-wrap { container: chart / inline-size; touch-action: pan-y; }
.chart text { font-family: var(--font-num); font-variant-numeric: tabular-nums; fill: var(--ink); }
.chart .tick, .chart .axis-title, .chart .direct { font-size: 11.2px; }     /* 14px at 800px wide */
.chart .band-label, .chart .cross-label { font-size: 9.6px; }               /* 12px at 800px wide */
@container chart (width < 36rem) { .chart .tick, .chart .axis-title { font-size: 19px; } .chart .band-label, .chart .cross-label { font-size: 17px; } }
@container chart (width < 25rem) { .chart .tick, .chart .axis-title { font-size: 23px; } .chart .direct { display: none; } }
```
(Values target about 12 px or more rendered at the low end of each tier. At < 25rem the direct labels hide and the HTML legend carries the series names.) Check once at 360 px in an iframe, because headless Chrome floors the window at about 497 px (01-04-SUMMARY).

### Pitfall 6: The shared heat domain washes out the study table
**What goes wrong:** At large N the big Phase 1 table uses only the pale part of the ramp. Example: d4, D 0, N 20 gives `heatMax` 28, so the study table's crit max of 8 sits at t = 0.29, and normal hits at t ≤ 0.14.
**Why:** This is the intended consequence of D-08 (one rule, one legend), not a bug.
**Avoid:** Nothing to fix in code. The `.hi` text flip at t ≥ 0.5 keeps contrast correct everywhere. Optionally note in the legend text that the scale is shared with the +N tables (copy decision). `heatMax = max(1, 2X + D + N)` equals the true max cell in every setting (verified with N ∈ {0, 5, 10, 15, 20} over the full domain). Compute it as the real max over the three row sets and keep the formula as a test oracle.

### Pitfall 7: Delta and gap rounding
**What goes wrong:** "+22.5" shown as a delta may not equal (displayed variant − displayed baseline) if the exact difference is rounded instead.
**Evidence:** `tenths(v) − tenths(b)` differs from `tenths(v − b)` in 8,287 of the (70,980 settings × N ∈ {0, 5, 10, 15, 20} × 2 variants) cases, always by 0.1, all involving non-terminating values (for example AC 10 / −5 / d4 / −4, N = 5: 22.2 vs 22.3).
**Avoid:** Use the difference of the displayed tenths (the same philosophy as STAT-02: shown numbers must add up). Assert it in the self-test grid.

### Pitfall 8: Flat attack curve with no band
d4 with D ≤ −4 gives a completely flat attack line because normal hits deal 0. D-15 defines only cap and floor bands, so draw no band. Do not mislabel it as "95% cap". The flatness will look odd, but the caption/readout numbers stay honest. Phase 4 copy can explain it using `marginals().reason === 'nodmg'`.

### Pitfall 9: Direct labels collide at the right edge
The two curves can end at the same or nearly the same y. End ties give an exact collision (16 settings). AC 20 / +5 / d12 / +3 ends at 187.0 vs 183.5, which is about 5 units apart on a 272-unit plot. When `|y1 − y2| < fontSize + 2`, push the upper label up and the lower label down by half the deficit each, clamped inside the plot.

### Pitfall 10: SVG hit-testing and `<title>`
A `fill="none"` rect gets no pointer events under the default `visiblePainted`. Use `pointer-events="all"` (or CSS `pointer-events: all`). Keep the hit rect behind the markers so their `<title>` tooltips still work. `role="img"` on the `<svg>` hides the children from AT, which is fine because the caption is the accessible name.

### Pitfall 11: `<svg>` edge clipping
Inline `<svg>` clips to its viewport by default. Labels at the extreme right/left get cut. Keep them inside the margins, or set `overflow: visible` on the svg.

### Pitfall 12: Container queries target the nearest container
The existing unnamed `@container (width < 42rem)` rules resolve against the nearest size container. For the compact tables that is still `.table-wrap` (correct). Name the new containers (`compare`, `chart`) and write their queries with the name, so a future wrapper cannot silently capture them. A container cannot style itself: the `.trio` grid must be a descendant of `#compare`, not the container itself. `.table-wrap` keeps `overflow-x: auto` as a last resort. Its inline-size containment also zeroes its min-content contribution, so grid tracks cannot be blown out (use `minmax(0, 1fr)` anyway).

## Code Examples

### niceTicks (verified over y-max 20..890: 4–6 ticks including 0, worst headroom 1.5× at 100.1 → 150)
```js
// view-model. Ticks from 0 to a nice ceiling >= max, step in {1,2,5} x 10^k (D-11).
function niceTicks(max, target = 5) {
  if (!(max > 0)) return { step: 1, top: 1, ticks: [0, 1] };
  const raw = max / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const r = raw / mag;
  const step = (r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10) * mag;
  const count = Math.ceil(max / step - 1e-9);
  return { step, top: count * step, ticks: Array.from({ length: count + 1 }, (_, i) => i * step) };
}
// niceTicks(274)  → step 100, top 300, [0,100,200,300]  (page default: max(90, 274))
// niceTicks(33)   → step 10, top 40, [0,10,20,30,40]     (AC 25 / d12)
// niceTicks(165.5)→ step 50, top 200                      (AC 15 / d12)
// niceTicks(20)   → step 5,  top 20                       (domain minimum)
// niceTicks(890)  → step 200, top 1000                    (domain maximum)
```
Across the whole domain the step is always ≥ 5, so tick labels are integers with no float formatting issues.

### linearScale and svgEl
```js
const SVGNS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs = {}, text) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (text !== undefined) e.textContent = text;
  return e;
}
function linearScale(d0, d1, r0, r1) {
  const k = (r1 - r0) / (d1 - d0);
  const f = (v) => r0 + (v - d0) * k;
  f.invert = (u) => d0 + (u - r0) / k;
  return f;
}
// x = linearScale(0, 20, 64, 540); y = linearScale(0, ticks.top, 300, 28)
const pts = (nums, den) => nums.map((v, n) => `${x(n).toFixed(2)},${y(v / den).toFixed(2)}`).join(' ');
hitLine.setAttribute('points', pts(chart.attack, chart.den));
```

### Series tokens (contrast computed with the OKLab → sRGB matrices; WCAG ratio)
```css
:root {
  --series-hit: oklch(0.45 0.13 255);   /* blue.   6.68:1 on --paper, 6.20:1 on --surface */
  --series-dmg: oklch(0.47 0.12 50);    /* burnt orange. 6.37:1 on --paper, 5.90:1 on --surface */
  --band:       color-mix(in oklch, var(--ink) 8%, var(--paper));   /* 1.18:1 vs paper; --ink-muted on it 5.65:1 */
}
@media (prefers-color-scheme: dark) { :root {
  --series-hit: oklch(0.78 0.10 245);   /* 9.16:1 on --paper, 8.22:1 on --surface */
  --series-dmg: oklch(0.78 0.13 55);    /* 8.76:1 on --paper, 7.86:1 on --surface */
  /* --band recomputes from the dark --ink/--paper: 1.15:1 vs paper; --ink-muted on it 7.31:1 */
} }
.series-hit { stroke: var(--series-hit); fill: none; stroke-width: 2.5; vector-effect: non-scaling-stroke; }
.series-dmg { stroke: var(--series-dmg); fill: none; stroke-width: 2.5; stroke-dasharray: 6 4; vector-effect: non-scaling-stroke; }
.band { fill: var(--band); }
.grid-y line { stroke: var(--line); vector-effect: non-scaling-stroke; }
```
All four series values are in the sRGB gamut, so no clipping. Blue vs orange is the conventional color-blind-safe pair. Both have similar lightness (1.20:1 against each other in light, 1.04:1 in dark), so **solid vs dashed is the required non-color cue** (D-10), along with the direct labels. The hues stay clear of the heat ramp (hue 25–32) and the amber `--accent` (70–80). Recommended mapping: attack = solid blue (the curve with the plateau shape), damage = dashed orange. [VERIFIED: local computation; the token values are proposals for the UI-SPEC]

### Band and crossing markup (inside `renderChart`)
```js
bandsG.replaceChildren(...['floor', 'cap'].flatMap((k) => {
  const b = chart.bands[k]; if (!b) return [];
  const x0 = x(b[0]), x1 = x(b[1]);
  return [svgEl('rect', { class: 'band', x: x0, y: 28, width: x1 - x0, height: 272 }),
          svgEl('text', { class: 'band-label', x: x0 + 4, y: 22 }, k === 'cap' ? '95% cap' : 'only a nat 20 hits')];
}));
crossG.replaceChildren(...chart.crossings.list.map((c) => {
  const g = svgEl('g', { class: 'cross' });
  const dot = svgEl('circle', { cx: x(c.x), cy: y(c.yNum / chart.den), r: 5 });
  dot.append(svgEl('title', {}, c.tieN !== null ? `tie at +${c.tieN}` : `order flips at +${c.flipN}`));
  g.append(dot, svgEl('text', { class: 'cross-label', x: x(c.x) + 7, y: y(c.yNum / chart.den) - 7 },
    c.tieN !== null ? `tie +${c.tieN}` : `flip +${c.flipN}`));
  return g;
}));
```
Band labels sit in the top-margin strip anchored at the band start, so a 1-step band (AC 16 / −5) still gets a readable label. Show the integer `flipN`, never the fractional x (N is an integer bonus).

## State of the Art

| Old approach (earlier research docs) | Current approach for this phase | Why |
|--------------------------------------|---------------------------------|-----|
| "Outline newly-hit rows, +N badges" (FEATURES D5, PITFALLS UX table, ROADMAP SC1) | Plain values; shift shown by shared scale + threshold rule + caption delta | CMP-04 amended, D-04/D-05 |
| "Fixed y max per die" (PITFALLS debt table) | Auto nice ceiling with value-labeled gridlines | D-11 |
| "0, 1, or occasionally 2 crossings" (FEATURES D3, PROJECT.md) | At most 1 in 0..20 (exhaustive); 2-crossing path kept generic and tested synthetically | This research |
| `<script type="module">` (CLAUDE.md) | Classic inline blocks | PROJECT.md Key Decisions |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | CSS `font-size` on SVG `<text>` is in user units and scales with the viewBox; container-query overrides apply to SVG text inside an HTML container | Pitfall 5 | Phone chart text too small or too big; fix by retuning the numbers |
| A2 | `font-variant-numeric: tabular-nums` and `font-family` via CSS apply to SVG `<text>` in Chrome/Firefox/Safari | Pitfall 5 CSS | Tick labels use proportional figures; cosmetic only |
| A3 | Inline `<svg viewBox>` with CSS `width:100%; height:auto` and no width/height attributes sizes by aspect ratio in evergreen browsers | Pattern 4 | Chart collapses to 150 px height; add `width="640" height="360"` attributes as a fallback |
| A4 | `touch-action: pan-y` on the HTML `.chart-wrap` governs touches on the SVG inside it (ancestor intersection) | Pattern 6 | Horizontal scrub on touch pans instead; readout still follows the slider, so it degrades gracefully |
| A5 | A real 1280 px browser window with a classic ~17 px scrollbar leaves about 1231 px of content (so three-up misses by ~1 px) | Pattern 5 | Only affects whether 1280 is three-up; the 1366 target is measured |
| A6 | Proposed series colors are acceptable to the user's taste (contrast is computed, taste is not) | Code Examples | UI-SPEC may change the hue; keep ≥ 4.5:1 |

## Open Questions

1. **Where the per-table threshold + total line sits (CMP-03 "under it" vs D-06 "caption").**
   - What we know: CMP-03 says "shows its own hit threshold rule and its own expected 20-round total **under it**". D-06 says the caption shows the table name, hit rule, total, and delta. The existing `.outcome caption` is `caption-side: top`.
   - Recommendation: put the short title in `<caption>` ("+5 to hit", the accessible name), and put a generated stats line directly **under** each table (`<p class="cmp-stats">hits on 5+ · 76.5 over 20 rounds · +22.5 vs baseline</p>`). That satisfies both texts. The alternative is `caption-side: bottom` for the compact tables only.
2. **End-tie caption wording** (16 settings, e.g. AC 27 / −5 / d4 / +0). Recommendation: treat it as a tie marker plus the sentence "…leads from +1 to +19; the two are tied at +20." (discretion: caption wording).
3. **ROADMAP SC1 and SC3 text.** SC1 still carries the superseded highlight clause (D-05 says superseded). SC3 says "zero, one, or two crossings", but two is unreachable in 0..20. Recommendation: the planner adds a doc touch-up task (ROADMAP note) or records it in the phase verification notes so the verifier does not hunt for a two-crossing setting.
4. **WR-01 fold-in (discretion).** Phase 2 adds only 20-round tenths values (captions, readout), not new per-round values, so it does not make WR-01 worse. Recommendation: leave it out of Phase 2 unless the planner has a spare task. If folded in, use the "≈" prefix variant from 01-REVIEW so the existing `'21.7 / 1.085'` expectations change deliberately.
5. **A `nodmg` note on the chart** (d4, D ≤ −4). Out of D-15's two band types. Recommendation: no band now; Phase 4 copy can mention it.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `tools/check-engine.mjs` (dev only) | ✓ | 24.15.0 | — |
| Chrome or Edge (headless) | `tools/check-page.mjs` | ✓ (check-page ran at 1366 and 1280 today) | — | Set `CHROME` env |
| Python | optional local server | ✓ | 3.14.4 | open `index.html` from disk |
| gh CLI / network | not needed (publish deferred by user) | — | — | — |

Headless Chrome floors the window at about 497 px. A true 360 px check needs the iframe wrapper used in Phase 1 (01-04-SUMMARY). This machine's OS is in dark mode, so force a scheme with `--blink-settings=preferredColorScheme=1` (light) or `=0` (dark) for screenshots.

**Missing dependencies with no fallback:** none.

## Validation Architecture

(`workflow.nyquist_validation` is `false` in config.json. This section is included because the orchestrator asked for a per-requirement check list.)

### Test Framework
| Property | Value |
|----------|-------|
| Framework | In-page `SelfTest` (`<script id="dice-selftest">`, DOM-free, also run by Node) + `runUiSmoke()` under `?test` + `tools/check-engine.mjs` + `tools/check-page.mjs` |
| Config file | none |
| Quick run command | `node tools/check-engine.mjs` (currently ~14 s) |
| Full suite command | `node tools/check-engine.mjs && node tools/check-page.mjs --width 1366 && node tools/check-page.mjs --width 390 && node tools/check-page.mjs --plain` |

### Phase Requirements → Test Map
| Req ID | Behavior | Where | Check |
|--------|----------|-------|-------|
| CTRL-04 | N parses and clamps; slider drives state | SelfTest | `parseControl('n','21',5)===20`, `('n','-1',5)===0`, `('n','',5)===5`, `('n','7.4',5)===7`; `DEFAULT_STATE.n===5` |
| CTRL-04 | Slider wired through the real handler | runUiSmoke | `send(nRange,'12')` → `state.n===12`; `<output>` text `'+12'`; slider `min/max` equal `CONTROL_SPEC.n` |
| CHART-01 | Series exact | SelfTest | `sweep(15,+5,d8,0)` attack/damage numerators equal the reference strings; same for AC 25/+0/d8 and AC 25/+0/d12 |
| CHART-01 | Chart drawn | runUiSmoke | two polylines, 21 points each |
| CHART-02 | Meet at N = 0; ticks | SelfTest + check-engine | `attack[0]===damage[0]` (all 70,980 in check-engine); `niceTicks(274).ticks.join()==='0,100,200,300'`, `niceTicks(33).top===40`, `niceTicks(20).top===20`, `niceTicks(890).top===1000` |
| CHART-02 | Axis titles, legend present | check-page | `--expect "Extra bonus +N" --expect "Expected damage over 20 rounds"` (split literals in smoke names per IN-06) |
| CHART-03 | Reference crossings | SelfTest | AC15/+0/d8 → 0; AC15/+5/d8 → 0; AC25/+0/d8 → 1, flipN 7, x = 45/7; AC15/+0/d12 → 1, flipN 15, lastLeadN 14; AC25/+0/d12 → 1, flipN 6, x = 65/11; AC10/+0/d4/+14 → tieN 12, flipN 13; AC27/−5/d4/0 → 0 crossings, endTieN 20 |
| CHART-03 | Generic branches | SelfTest | the six synthetic cases in Pattern 3 (2 crossings, touch, tie, end tie, leading tie, all equal) |
| CHART-03 | Whole-domain invariants | check-engine | for all 70,980: `crossings().list.length ≤ 1`, equals an independent brute-force sign-change count in the tool, every marker `x ∈ [lastLeadN, flipN]` |
| CHART-03 | Markers and caption in the page | runUiSmoke | defaults: 0 `.cross` markers and the caption says damage leads at every N; `show({ac:25,atk:0,die:12})`: 1 marker; `show({ac:15,atk:0})`: 0 markers |
| CHART-04 | Bands | SelfTest | `attackBands(15,+5)` → cap [8,20], floor null; `attackBands(25,0)` → floor [0,5], cap null; `attackBands(16,−5)` → both; `attackBands(10,+8)` → cap [0,20] |
| CHART-04 | Band = actual flat steps | check-engine | for all 70,980: `attack[n+1]===attack[n]` ⇔ n+1 ≤ floorEnd ∨ n ≥ capStart ∨ nodmg |
| CHART-04 | Shaded + labeled in DOM | runUiSmoke | defaults: 1 `rect.band` + label; AC 25/+0: floor band; AC 16/−5/d4: 2 bands |
| CHART-05 | N marker follows the slider | runUiSmoke | after `send(nRange,'10')`, the marker x equals `xScale(10)`; dots at `attack[10]`, `damage[10]` |
| D-13 | Hover readout | runUiSmoke | dispatch `new PointerEvent('pointermove',{clientX})` at N = 15 → readout contains "+15"; `pointerleave` → readout back to the slider N; `state` unchanged |
| CMP-01 | Three tables | runUiSmoke + check-page | `.trio table.outcome` count 3; each has 20 body rows and `die` cells; check-page row headers = 80 |
| CMP-02 | Shared domain | SelfTest + check-engine | `compareView(defaults,5).heatMax===21`; equals the max cell over the three row sets; equals `2X+D+N` across the domain (sampled N) |
| CMP-03 | Threshold + total per table | SelfTest | +hit threshold `=== clamp(C−A−N,2,20)` (grid); default captions "hits on 10+ / 5+ / 10+", totals 54.0 / 76.5 / 109.0 |
| CMP-04 | Plain values; delta | SelfTest | `+hit` rows equal `outcomeTable({...p, atk: atk+n})` cells; deltas "+22.5" / "+55.0"; grid: displayed delta = displayed variant − displayed base |
| CMP-04 | No diff markup | runUiSmoke | compact tables contain no `.new-hit`/badge classes (only `.h/.m`, `threshold`, `crit`) |
| CMP-05 | Three-up at 1366, stacked narrow, no page scroll | runUiSmoke (width-aware) + check-page | with `die:12`: if `#compare` width ≥ 77rem, the three wrappers share one `top` and each table width ≤ its wrapper; else the tops strictly increase; always `scrollWidth ≤ clientWidth`. Run check-page at 1366 and 390, plus the 360 iframe once |
| RULES-05 / regression | Phase 1 intact | all | existing 65 self-test checks + existing smoke checks (with the legend expectation updated to `0,5,11,16,21` or pinned to n: 0) |

### check-engine additions (performance-safe)
Do not call `DiceMath.sweep` per combo (about 2 minutes). Build the series from a `Map` cache of `DiceMath.stats(...).e20Num` keyed `ac,atk,die,dmg`. Measured: the full domain with N up to 45 took 12.7 s with 316k cache entries; N ≤ 20 is less. Cross-check `DiceMath.sweep` equality on about a 1-in-50 sample. Add invariants: (g) N = 0 equality, (h) crossing count ≤ 1 and equal to the independent count, (i) band ⇔ flat, (j) damage strictly increasing, (k) `heatMax` oracle at N ∈ {0, 20}. Keep the grid view calls on `statsView` so check (f) stays at its current cost.

### Sampling Rate
- **Per task commit:** `node tools/check-engine.mjs`
- **Per wave merge:** full suite above
- **Phase gate:** full suite green plus one manual look at d12 in both themes at 1366 and at 360 (iframe), per UI-SPEC practice.

### Wave 0 Gaps
- [ ] `tools/check-page.mjs`: row-header expectation 20 → 80 (blocking; the first Phase 2 table render fails it)
- [ ] `runUiSmoke`: default-legend expectation update (blocking once the shared `heatMax` lands)
- [ ] `tools/check-engine.mjs`: stats cache + new invariants (g)–(k)
- [ ] Optional: IN-06 hardening (strip `#selftest` before `--expect`), because Phase 2 adds many caption strings that smoke check names could accidentally satisfy

## Security Domain

`security_enforcement` is absent from config (treated as enabled). The attack surface is unchanged: no input leaves the page, and nothing from `location` except the `test` flag is read.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | `VM.parseControl` with `CONTROL_SPEC.n` (clamp + fallback); integers only reach DOM sinks |
| V6 Cryptography | no | — |
| V14 Configuration | yes | Existing CSP `default-src 'none'`; no new sources needed (inline SVG, no images/fonts) |

### Known Threat Patterns
| Pattern | STRIDE | Mitigation |
|---------|--------|------------|
| DOM XSS through `innerHTML` table cells/captions | Tampering | Keep the rule: only parsed integers and fixed strings in `innerHTML`; captions, readout, SVG text via `textContent`/`createElementNS` |
| CSP regression (e.g. adding an external font/icon for the chart) | Tampering | CSP already blocks it; check-page fails on "Content Security Policy" console lines |

## Sources

### Primary (HIGH confidence)
- `index.html` (current, 1,252 lines): `DiceMath.sweep/stats/threshold/marginals`, `VM.*`, `SelfTest`, `runUiSmoke`, CSS tiers. Read in full.
- Local enumeration scripts (Node 24.15, engine blocks loaded via `vm` from `index.html`): series, crossings over all 70,980 settings, band/flat equivalence, heatMax oracle, delta rounding, niceTicks coverage, OKLCH contrast, timing. 2026-09-25.
- `tools/check-page.mjs --width 1366/1280 --dump`: measured `clientWidth` 1329 / 1243.
- https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/pointer-events — default `visiblePainted`; `fill="none"` not hit-testable; `all`.
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/output — no form needed; implicit `status` role / live region; `for` is informational.
- https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/vector-effect — `non-scaling-stroke`, CSS property, Baseline 2020-07.
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action — `pan-y`, `pointercancel` when the browser takes the gesture.

### Secondary (MEDIUM confidence)
- https://www.w3.org/2025/11/20-svg-minutes.html and https://lists.w3.org/Archives/Public/public-svg-issues/2025Nov/0024.html — SVG WG discussion: `var()` in presentation attributes is inconsistent across engines; use CSS/style.
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/fill — `fill` as a CSS property.
- Project research: `.planning/research/PITFALLS.md`, `FEATURES.md`, `ARCHITECTURE.md`, `STACK.md`; Phase 1 `01-UI-SPEC.md`, `01-REVIEW.md`, `01-04-SUMMARY.md`.

### Tertiary (LOW confidence)
- None relied on.

## Metadata

**Confidence breakdown:**
- Reference values / crossings / bands: HIGH. Exhaustive over the real engine.
- Layout arithmetic at 1366: HIGH (measured). 1280 real-browser behaviour: MEDIUM (A5).
- SVG text scaling and touch: MEDIUM (A1–A4). One manual check at 360 px closes it.
- Colors: HIGH for contrast math; taste is open to UI-SPEC.

**Research date:** 2026-09-25
**Valid until:** 2026-10-25 (stable platform features; engine values are valid until `DiceMath` changes)
