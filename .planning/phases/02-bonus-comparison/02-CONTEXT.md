# Phase 2: Bonus Comparison - Context

**Gathered:** 2026-09-25
**Status:** Ready for planning

<domain>
## Phase Boundary

A comparison bonus N (0 to 20, slider) that drives two new sections added to the existing `index.html` below the Phase 1 outcome table:

1. **Compare +N**: three compact outcome tables side by side (Baseline +0 | +N to hit | +N to damage), one shared color scale, each with its own hit-threshold rule and its own 20-round expected total (with delta vs baseline).
2. **Sweep chart**: a hand-drawn inline SVG line chart of expected 20-round damage for N = 0..20, two series (N on the attack roll, N on the damage roll) at the current AC, die, and base bonuses, with labeled axes and ticks, a legend, a vertical marker at the current N, crossover markers that handle zero, one, or two crossings, shaded and labeled flat stretches of the attack curve, a hover readout, and a generated caption sentence.

Requirements covered: CTRL-04, CHART-01..05, CMP-01..05 (CMP-04 amended, see D-04/D-05).

Not in this phase: the roll-20-rounds simulation (Phase 3), live-substituted formula prose and the designer explanation copy, suggested explorations, the accessibility pass, and any GitHub publish (Phase 4, and publish remains deferred by the user). No new dice mechanics (multi-dice, advantage, -5/+10 trade mode).

</domain>

<decisions>
## Implementation Decisions

### Page structure: the big table stays, comparison and chart go below it
- **D-01:** The Phase 1 full-size outcome table (40 px wide tier) stays exactly where and how it is. It remains the "study" view. Nothing in Phase 2 moves into the top control strip or the stat-card row.
- **D-02:** Page order top to bottom: controls strip → stat cards → outcome table → **Compare +N section** (N slider, then the three compact tables) → **Sweep chart section** (chart, readout line, caption). User chose "stats → tables → chart" and "keep the big table, add three compact ones below".
- **D-03:** The N slider lives at the head of the Compare section, not in the top strip. Label it "Compare at +N" with an inline `<output>` showing the signed value ("+5"). Range 0..20, step 1, updates on the `input` event, parsed through the same `CONTROL_SPEC` / `parseControl` path as every other control (new key `n`, so the domain lives in one place; see 01-REVIEW.md IN-04). Default N = +5 so the first load shows a visible shift.
- **D-04 (amended CMP-04, user decision):** The +N-to-hit and +N-to-damage tables show the **resulting damage totals in every cell with no special diff highlighting**. No outlined "new hit" rows, no "+N" badges in cells, no "new hit" / "+N" text in the note column, no delta toggle. The user was offered all of these and chose plain values. The shift is conveyed by four things that are already required: the values themselves, the single shared color scale across the three tables (CMP-02), each table's own "hits on N+" threshold rule which visibly moves down in the +hit table (CMP-03), and each table's caption carrying its 20-round total and its delta vs baseline ("+9.0 over 20 rounds").
- **D-05:** REQUIREMENTS.md CMP-04 has been rewritten to say exactly that. ROADMAP.md Phase 2 success criterion 1's clause "Rows that flipped from miss to hit are highlighted ... and the +N-to-damage table marks its uniform per-cell increase" is **superseded** by D-04; verification checks values, shared scale, threshold rule, and captions instead.

### The three compact tables
- **D-06:** Fixed order and captions: "Baseline (+0)", "+N to hit", "+N to damage" (with N substituted, e.g. "+5 to hit"). Each caption also shows that table's hit rule ("hits on 5+"), its 20-round expected total, and for the two variants the delta vs baseline. All numbers come from `DiceMath.stats` with the adjusted parameters; totals use the same tenths rounding as the stat cards (STAT-02 consistency).
- **D-07:** The three tables reuse the existing table markup and the `#outcome` sizing tiers (retarget those rules to a shared class so four tables share one stylesheet). Each sits in its own `container-type: inline-size` wrapper inside a CSS grid that puts three across at about 1366 px (each track lands in the existing 24 px "mid" tier at d12, about 400 px per table) and stacks them full width on narrow screens. No horizontal page scroll at any width (CMP-05). Ascending d20 rows, note column kept (it is how the threshold rule shows at compact size).
- **D-08:** One shared heat domain across all three compact tables: `heatMax = max cell damage across the three` (in practice the +N-to-damage crit max, 2X + D + N), computed before rendering (CMP-02). The big Phase 1 table and the single legend use the same domain so the same number is the same color anywhere on the page (one rule, one legend). Miss cells keep the striped neutral style.

### The sweep chart
- **D-09:** Inline SVG built with `document.createElementNS`, fixed `viewBox` (about 640 x 360), `width: 100%; height: auto`, `vector-effect="non-scaling-stroke"`, `role="img"` with `aria-labelledby` pointing at the caption. No chart library (PROJECT.md).
- **D-10:** Two series from `DiceMath.sweep` at the current AC / die / base attack / base damage, 21 points each, both starting at the same N = 0 point (CHART-02). Series are distinguishable by color **and** stroke pattern (solid vs dashed), with direct labels at the right end of each line plus a small legend. Colors are theme tokens that pass contrast on both parchment and candlelit backgrounds.
- **D-11:** Axes: x titled "Extra bonus +N" with ticks at every integer and labels every 5; y titled "Expected damage over 20 rounds", starting at 0 (never truncated), nice ticks in 1/2/5 steps with value-labeled gridlines. The y maximum auto-scales to the current curves (nice ceiling of the larger series) because a fixed per-die maximum squashes high-AC settings like AC 25 / d12 into the bottom tenth of the chart. The labeled gridlines make the rescale visible.
- **D-12:** A vertical marker at the current N follows the slider (CHART-05), with a dot on each curve at that N.
- **D-13 (user choice):** Hover readout only. Moving the pointer over the chart updates a text line under the chart with N, the two 20-round values, and their gap; when the pointer leaves, the readout returns to the slider's N. No click or drag on the chart to set N. Keyboard and touch users read the same line driven by the slider.
- **D-14:** Crossover markers (CHART-03) are computed from the two 21-point series, never assumed: a crossing is a sign change of (attack − damage) between consecutive integer N, or an exact tie at an integer N > 0. Mark each with a dot and a short label; the marker may sit at the interpolated fractional N, the caption reports the first integer N at which the order has flipped. Zero, one, and two crossings are all normal states with no false markers. The caption sentence is generated from the data: "Damage bonus leads at every N from +1 to +20", "+N to hit leads until +K, then the damage bonus pulls ahead", or the two-crossing form. Reference behaviour from PITFALLS.md: AC 15 / +0 / d8 → none; AC 25 / +0 / d8 → cumulative flip at N = 7; d12 / AC 15 / +0 → to-hit leads, damage catches up at +15; d12 / AC 25 / +0 → damage leads +1..+5, to-hit overtakes at +6.
- **D-15:** Flat stretches of the attack curve (CHART-04) are shaded bands with an in-band label: the "95% cap" band where A + N >= C − 2, and the "only a nat 20 hits" band where C − (A + N) >= 20. Bands render only where they fall inside 0..20.

### Engine, view-model, and self-test
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and rules
- `.planning/PROJECT.md` — "Context" (expected-damage formula, the marginal rule, the zero/one/two-crossing fact), "Key Decisions" (crit-row convention, classic inline scripts, inline SVG, crossover copy handles 0/1/2 crossings), "Out of Scope".
- `.planning/REQUIREMENTS.md` — CTRL-04, CHART-01..05, CMP-01..05. CMP-04 was amended on 2026-09-25 per D-04.
- `.planning/ROADMAP.md` §"Phase 2: Bonus Comparison" — Goal and five success criteria. Criterion 1's highlight clause is superseded by D-04/D-05.

### Research (implementation guidance)
- `.planning/research/FEATURES.md` — T10 (sweep chart), T11 (side-by-side, shared domain), T12 (responsive three-up), D3 (crossover annotation, verified examples), D4 (clamp shading), D6 (linked N; only the slider → marker direction is in scope), §"UX Conventions" → "Side-by-side table comparison" and "Line chart", the anti-feature "Per-table auto-scaled colour ramps".
- `.planning/research/PITFALLS.md` — Facts 3 and 4 (floor dead zone, most settings have no crossover), Pitfall 7 (crossover story, marginal vs cumulative), the sweep-baseline pitfall ("both curves must meet at N = 0; name the N in the UI"), "UX Pitfalls" table rows on axes, y from 0, markers, and SVG sizing, and the "Reference Values" checklist (chart and crossover rows).
- `.planning/research/ARCHITECTURE.md` — single state + rAF-coalesced `render()`, derive-once `computeView`, parameterized `stats` so the sweep is `EV(A+n, D)` / `EV(A, D+n)`.
- `.planning/research/STACK.md` — inline SVG recipe (viewBox, polyline, non-scaling-stroke, `<title>` tooltips), `linearScale` / `niceTicks` helpers, container queries, `color-mix()` in oklch.

### Prior phase artifacts
- `.planning/phases/01-live-roll-table-deployed/01-CONTEXT.md` — D-01..D-18 carried forward (layout, theme tokens, heat ramp, miss style, ascending rows, classic scripts, single parser, self-test on load, `?test` panel).
- `.planning/phases/01-live-roll-table-deployed/01-UI-SPEC.md` — table sizing tiers (wide 40 px / mid 24 px / narrow 20 px) and the three-up budget at 1366 px.
- `.planning/phases/01-live-roll-table-deployed/01-REVIEW.md` — WR-01 (per-round false precision, fix pending), IN-04 (control domain duplicated in four places; N must not add a fifth).

### Repo instructions
- `CLAUDE.md` — stack notes for inline SVG, `niceTicks`, `linearScale`, container queries. Its "inline `<script type="module">`" recommendation remains overridden by PROJECT.md (classic scripts).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DiceMath.sweep(p, maxN)` (index.html ~line 511) already returns `{ attack[], damage[], den }` as exact scaled integers for N = 0..20. The chart and crossover detection consume it directly.
- `DiceMath.stats(p)` returns `rows`, `threshold`, `hitFaces`, `e20Num/e20Den`, `tableSum` per parameter set; calling it with `atk + N` and `dmg + N` yields the two variant tables and their totals.
- `DiceMath.threshold(p)` = `clamp(ac − atk, 2, 20)` gives each table's hit rule; `marginals().reason` already encodes `cap` / `floor` states reusable for the plateau bands.
- `VM.parseControl`, `CONTROL_SPEC`, `DEFAULT_STATE`, `fixed`, `tenths`, `signed` — the single parser and exact fixed-point formatting the N slider and all captions must use.
- `renderTable(view)` (~line 872) builds thead/tbody strings from `rows`, `threshold`, `heatMax`; it targets the global `tableEl` and needs to take the target element as a parameter.
- `renderLegend`, `swatch`, `legendItem` — the legend reuses `.h` / `.h.hi` / `.m` classes; a shared heat domain means the one legend stays correct.
- `SelfTest` block plus `runUiSmoke()` and `tools/check-engine.mjs` — extend, do not fork.

### Established Patterns
- Four classic inline `<script>` blocks in order: `dice-math` → `view-model` → `dice-selftest` → app. New helpers go into the existing blocks; renderers are added as extra calls inside `render()`.
- One `state` object, `setState(patch)` → `scheduleRender()` (rAF-coalesced) → `render()`; controls bind by `data-key` through `onControl`. Adding `n` to `CONTROL_SPEC` and `DEFAULT_STATE` plugs the slider in with no new plumbing.
- Theme tokens on `:root` with a `prefers-color-scheme: dark` override; heat ramp via per-cell `--t` and `color-mix()` in oklch; `.h`, `.h.hi`, `.m` are class-only selectors so they work in any table.
- Table sizing uses container queries on `.table-wrap` (`container-type: inline-size`) with tiers at 42rem and 25rem; the mid tier was explicitly reserved for "Phase 2 three-up at 1366 px".
- `innerHTML` is used only for fully numeric table cells; everything else is built with `createElement` / `textContent` / `style.setProperty`. The SVG must follow the `createElementNS` route.
- CSP forbids outside requests; the page must keep working from `file://`.

### Integration Points
- Markup: `<section id="tables">` ends at the crit footnote; the Compare section and Chart section are inserted after it, before `</main>`.
- Controls: the N slider is inside the Compare section but still uses `data-key="n"` so `onControl` handles it; `renderControls` writes the state back into it and its `<output>`.
- `render()` gains `renderCompare(view)` and `renderChart(view)` calls after the existing table renderers.
- Self-test: add cases to the `dice-selftest` block and expectations to `runUiSmoke` (three tables present, captions and totals, marker position) and `tools/check-engine.mjs`.

</code_context>

<specifics>
## Specific Ideas

- The user wants the compact +N tables to be plain: real totals in every cell, no highlighting layer on top. Let the numbers, the shared color scale, the moving threshold rule, and the captions carry the comparison.
- Keep the Phase 1 study table untouched above the comparison; the compare row and the chart are additions below it, in that order.
- Chart interaction stays light: a hover readout, no chart-driven control of N.

</specifics>

<deferred>
## Deferred Ideas

- "Show delta" toggle that swaps the +N tables to per-cell differences vs baseline — offered, declined for now; possible later polish.
- Click or drag on the chart to set N (full linked views, FEATURES.md D6) — offered, declined; the slider is the only input.
- Outlined "new hit" rows, note-column "+N" marks, and in-cell "+N" badges — offered as CMP-04 styles, declined in favour of plain values.

</deferred>

---

*Phase: 02-bonus-comparison*
*Context gathered: 2026-09-25*
