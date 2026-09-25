# Feature Research

**Domain:** Single-page educational visualizer for D&D 5e attack resolution (d20 to-hit vs AC, then a single dX damage die), aimed at game designers
**Researched:** 2026-09-24
**Confidence:** MEDIUM overall. The UX conventions (NN/g slider guidance) and the 5e rules are HIGH. The competitor feature surveys are MEDIUM: some tools render client-side and could only be read from their docs or landing pages. The feature math was checked with a local script.

---

## Context: What Exists Today

The existing tools fall into three groups. None of them teaches the lesson this page is built around.

| Tool family | Examples | What they do well | What they do not do |
|---|---|---|---|
| **General dice-probability engines** | AnyDice | Arbitrary dice language. Outputs as a table plus bar graph, a line graph, or export. "Normal / At Least / At Most / Transposed" views. Mean and SD per output. Several outputs stacked for comparison. Shareable URLs that encode the view (`/at_least/graph`). | Knows nothing about AC, hit thresholds, or crits. The designer has to encode the rules as a program, and the lesson disappears behind the syntax. |
| **5e DPR calculators** | RPGBOT DPR Calculator, TabletopCalc 5e DPR, oefi/dnd5e-dpr-calc, Fern Flower Press, DnD Metrics, EveryCalculators | Inputs: attack bonus, AC, damage dice + modifier, number of attacks, adv/disadv, crit range. Outputs: DPR, hit %, crit %, min/max, per-attack breakdown. TabletopCalc adds a formula reference box and a worked example. oefi adds "live formula breakdowns" and a cumulative multi-round Chart.js chart. | They answer "what is my DPR?", not "why?". None shows the 2D outcome space. None shows the marginal value of +1 to hit vs +1 damage. None plots a bonus sweep with the 95% plateau visible. They are framed for player optimization, which PROJECT.md puts out of scope. |
| **Power-attack breakpoint tools** | GWM/Sharpshooter calculators (e.g., the CodePen "Great Weapon Master / Sharpshooter calculator"), RPGBOT GWM article | They answer a trade-off question: at what AC does -5/+10 stop paying off. This is the closest existing tool to "hit vs damage crossover". | They cover one fixed trade-off (-5/+10), not a sweep. They give a number or threshold with no visual explanation of why. |
| **Generic probability teaching pages** | Pearson Dice Roller & Probability Simulator, Omni dice calculator, GetZenQuery | Exact distributions shown next to simulation (histogram, mean/median/SD, configurable trial count). "Show step-by-step" explanations. | No game-design framing. No threshold or clamp concept. |

**Gap this project fills:** you can see the outcome space as a roll table, see how each bonus changes that table cell by cell, and see the resulting saturation vs linear-growth curves, all driven by the same live controls. That combination is the differentiator. Every individual number on the page (hit %, DPR) is already a commodity.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Game designers who have used AnyDice or any DPR calculator will expect these. If any are missing, the page reads as a toy or as untrustworthy.

| # | Feature | Why Expected | Complexity | Notes |
|---|---------|--------------|------------|-------|
| T1 | **Correct 5e resolution rules**: hit iff d20 + A >= AC; nat 20 always hits and is a crit; nat 1 always misses; on a crit the damage dice are rolled twice and the modifier is added once | Every DPR calculator (TabletopCalc explicitly) enforces the 5%-95% clamp and dice-doubled crits. Designers will check this first. The 2014 and 2024 PHB rules are identical here. | LOW | Mean damage on a crit is 2*avg(dX) + D. The simulation must roll a second die. It must not double the first die's face (same mean, wrong variance, wrong by RAW). |
| T2 | **Live controls**: AC, die (d4-d12), base attack bonus, base damage bonus | Every DPR tool has these four inputs. Recompute on `input`, not `change`, so the page reacts while the user drags. | LOW | See the UX conventions below for which control type to use for each. |
| T3 | **Headline stats**: "Hits on a d20 roll of T+", hit %, crit %, normal-hit %, average damage per hit, expected damage per round, expected 20-round total | TabletopCalc shows DPR, hit %, crit %, and min/max as its baseline. A designer's first question is "what do I need to roll?" | LOW | Also show min/max damage for a hit and for a crit. Display the effective clamped hit %, and note when the clamp is active. |
| T4 | **2D outcome table** (rows d20 1-20, columns dX 1-X, cell = damage dealt, 0 on a miss) | This is the core artifact in PROJECT.md. It plays the role of AnyDice's "table view". | MEDIUM | Needs a crit-row decision (see UX conventions). At d12 it is 240 cells, and three of them side by side is 720. The table needs a tight layout. |
| T5 | **Colour scale for damage + distinct miss styling + legend** | Heatmap tables are only readable when colour carries magnitude. A legend is required so the colour can be decoded. | LOW-MEDIUM | Miss cells must look different in kind from low damage, not just be the lightest shade. See UX conventions. |
| T6 | **Visible hit-threshold boundary in the table** | This is the "roll table" concept itself. The user must be able to see where misses end. | LOW | Use a thick rule plus a row label ("hit on 14+"), not only a colour change. |
| T7 | **Exact math derived from the table** (not Monte Carlo) | AnyDice and every DPR calculator are exact. A tool that shows a noisy "expected value" loses credibility with designers. | LOW | The sum of cells / (20*X) must equal the closed-form E. Use that as a built-in self-check or unit assertion. |
| T8 | **Formula display** | TabletopCalc has a Formula Reference and a worked example. oefi has live formula breakdowns. A page for designers that hides its formulas fails its purpose. | LOW | Show the symbolic form plus the version with the current numbers substituted (see D2). |
| T9 | **"Roll 20 rounds" simulation showing realized vs expected** | Pearson and similar teaching tools put simulation next to the exact values. PROJECT.md commits to this so that designers "do not over-trust averages". | LOW-MEDIUM | Must label clearly which number is simulated and which is exact. See the presentation conventions below. |
| T10 | **Bonus-sweep line chart** (x = +0..+20, two series: bonus on attack vs bonus on damage) | This is the second core artifact. Without it the plateau lesson needs arithmetic in the reader's head. | MEDIUM | Hand-drawn inline SVG (no chart lib per PROJECT.md). Two series of 21 points. Axes, ticks, gridlines, and direct line labels all have to be done by hand. |
| T11 | **Side-by-side tables**: baseline, +N to hit, +N to damage | This is the "cell-by-cell shift" requirement. Comparison across mechanics is standard (AnyDice stacks outputs). | MEDIUM | Needs a shared colour domain across all three tables, otherwise the comparison is misleading. See UX conventions. |
| T12 | **Responsive layout**: three tables fit on a laptop, stack on mobile | PROJECT.md readability constraint. | MEDIUM | 720 cells need a compact cell size (about 22-26 px, 11-12 px tabular-nums font). |
| T13 | **Basic accessibility**: numbers printed in cells (never colour-only), real `<table>` semantics with `<th scope>`, labelled inputs, keyboard-operable controls | A public GitHub Pages site. Colour-only encoding fails colour-blind designers. | LOW | Native `<input type=range>` and `<button>`s give keyboard support for free. |

### Differentiators (Competitive Advantage)

These tie directly to the Core Value ("see in one glance why attack bonuses saturate while damage bonuses scale linearly, and why the crossover moves"). No surveyed tool does D1-D5.

| # | Feature | Value Proposition | Complexity | Notes |
|---|---------|-------------------|------------|-------|
| D1 | **Marginal-value readout: "the next +1 is worth..."** Show `+1 to hit adds 0.05 x (avg + D)` next to `+1 damage adds P(hit)`, with a verdict line | This is the whole lesson reduced to two numbers. It gives a compact rule: **+1 to hit beats +1 damage exactly when average non-crit damage (avg(dX)+D) exceeds the number of d20 faces that hit.** No DPR calculator surfaces this. | LOW | Holds while unclamped. Once the threshold is at 2 (95% cap), +1 to hit is worth 0. When the threshold is above 20 (only a nat 20 hits), +1 to hit is also worth 0 until a 19 can hit. The readout must say so explicitly in both clamp regions. |
| D2 | **Live-substituted formulas** (reactive-document style, after Bret Victor's "Explorable Explanations") | The formula text updates with the controls, e.g. "E = 0.25 x (4.5 + 0) + 0.05 x (9 + 0) = 1.575". The formula and the table can't drift apart, and the reader connects symbols to numbers. | LOW-MEDIUM | Generate the explanation paragraphs from the same model as the numbers. Do not hard-code prose claims such as "attack bonus wins at high AC", because they are false for many settings (see the crossover facts below). |
| D3 | **Crossover annotation on the chart**, computed and not assumed | The crossover is the most interesting thing on the page, and existing tools make the user find it. Mark it with a vertical rule and a label ("damage bonus pulls ahead at +15"). | MEDIUM | Must handle **0, 1, or occasionally 2 sign changes**, plus ties. Verified examples (A=0, D=0 unless noted): d8/AC15 has no crossover (damage leads the whole way). d12/AC15 crosses at +15 (to-hit leads, plateaus at +13, damage catches up). d12/AC25 has damage leading +1..+5 (to-hit dead zone) and to-hit overtaking at +6. d12/A5/D3/AC20 has to-hit leading all the way to +20 with no crossover. If there is no crossover, the label has to say which curve dominates. |
| D4 | **Shaded clamp regions on the chart**: the "95% cap reached" plateau and the "only nat 20 hits" floor dead zone | This makes saturation visible as a shape and not just a number. The floor dead zone (AC - A > 20) is a second, rarely explained saturation that the AC 10-25 range will hit. | LOW-MEDIUM | Compute the N where the threshold reaches 2 and the N where it first drops to <= 19. |
| D5 | **Diff highlighting in the side-by-side tables** | Makes the mechanical difference obvious: **+N to hit converts whole rows from 0 to damage, while +N to damage raises every existing hit cell by N.** Outline the newly converted rows in the +hit table. Annotate "+N" on the hit cells of the +damage table, or offer a "delta vs baseline" toggle. | MEDIUM | Needs baseline and variant tables built from the same model so they can be diffed cell by cell. |
| D6 | **Linked views**: one "N" control drives the side-by-side tables and a marker on the chart. Clicking or hovering a chart x-position sets N. | Brushing between chart and tables is what makes it "one glance". The user sees the point on the curve and the tables that produce it. | MEDIUM | A single state object with a single `render()` avoids the sync bugs. |
| D7 | **Simulation marks the rolled cells** on the 2D table (a dot, count badge, or brief flash on each of the 20 rolled (d20, dX) cells) | Links the random outcome to the roll table. The designer sees why a run came in under expectation, for example five rows landed in the miss band. | LOW-MEDIUM | For crits the cell is (20, first die). Show the second die in the per-round log. |
| D8 | **Where the realized total sits in the exact distribution** (e.g. "you rolled 38. Expected 31.5. 80% of 20-round fights land between X and Y. This run is at the 78th percentile") | This is how you teach variance honestly. It shows that a 20-round total has a wide spread, so one lucky run does not "disprove" the math. | MEDIUM | Exact, not Monte Carlo. One round has a small discrete damage distribution (at most about 2X + D + 1 support values). Convolving it 20 times is trivial in JS. As a cheaper fallback, show +/-1 SD using Var(20 rounds) = 20 * Var(one round). |
| D9 | **Hover/focus crosshair on the table** with a tooltip showing "d20 = 14, d8 = 5 -> 5 + D = 5 dmg. Probability 1/160 (0.625%)" | Every cell becomes a small lesson. Shows that each cell has probability 1/(20*X), which is the whole reason "table average = EV". | LOW | Tooltips must also work on focus for keyboard users. Otherwise rely on row/column header highlighting. |
| D10 | **Shareable URL state** (`#ac=15&die=8&a=0&d=0&n=5`) | AnyDice-style shareable links. Designers paste a specific scenario into a design doc or Discord. Costs almost nothing on a static page. | LOW | Read the hash on load and write it with `history.replaceState` on change. Do not use `pushState` per slider tick, because it floods the back button. |
| D11 | **Row and column marginals** (per-row expected damage, a per-column footer, a P(hit) column) | Shows that EV is the table's average. Makes the "rows that hit" count visible. | LOW | Optional. It adds width at d12, so consider it only on the single main table and not the side-by-side ones. |

### Anti-Features (Commonly Requested, Often Problematic)

Most of these are "a DPR calculator would have it". Each adds complexity or dilutes the lesson. Several are already listed as Out of Scope in PROJECT.md and are repeated here with the reasoning, so requirements do not bring them back.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Advantage / disadvantage toggle | Every DPR calculator has it | Changes the d20 distribution, so the "each +1 = 5%" linearity no longer holds and the clamp lesson gets muddied. **Out of scope per PROJECT.md.** | v2 candidate. Mention it in the explanation text as "what changes with advantage". |
| Multi-dice damage (2d6, 3d4, "1d8+1d6") | Real weapons and spells use it | Breaks the 2D table: 2d6 needs a third axis or a convolved column axis. **Out of scope per PROJECT.md.** | v2. The avg(dX) term in D1/D2 already generalizes in the prose. |
| Multiple attacks, class features, feats (GWM/SS, Bless, Champion 19-20 crit, Sneak Attack, Weapon Mastery Graze) | Full DPR calculators (oefi, TabletopCalc) have them | This turns an anatomy lesson into a build optimizer. **Out of scope. Player-optimization framing explicitly excluded.** | At most, one sentence in the text noting that expanded crit ranges and -5/+10 are applications of the same math. |
| Monte Carlo "expected value" (simulate 10,000 rounds to estimate EV) | Easy to code. Feels "empirical". | Noisy numbers that jitter on every input change undermine trust. The exact answer is cheap. | Exact EV everywhere (T7). Simulation is used only to show variance (T9/D8). |
| Per-table auto-scaled colour ramps | The default behaviour of naive heatmap code | The +damage table would look the same colour as the baseline, which hides the very shift it exists to show. | One shared colour domain across all three tables: [0, max damage across all shown tables]. |
| Animated 3D dice / physics dice rolling | Looks fun, and dice-roller sites do it | Heavy (needs a library, which the no-CDN rule forbids). Slow for 20 rolls. Pulls attention from the table. | A short CSS highlight on the rolled cells (D7) and a compact per-round log. |
| AnyDice-style dice expression language / free-text input | Power users like flexibility | Parsing, error states, and validation for a page whose value is its constrained model. | Constrained controls (die buttons, numeric bonuses). |
| Dual-bonus sweep (2D surface / heatmap of attack bonus x damage bonus) | "Show everything at once" | Surface plots are hard to read and hard to hand-draw in SVG. The two-line chart already carries the lesson. | Two lines plus the N-linked tables (D6). |
| Per-slider-tick history entries, localStorage persistence, accounts | "Remember my settings" | State clutter for a single-scenario demo. | URL hash only (D10). |
| CSV/image export | AnyDice has export | Low value for a teaching page. The table is small enough to screenshot. | A shareable URL (D10). |
| House-rule crit variants (max + roll, double total, double including modifier) | Many tables use them | Multiplies the explanation branches. Doubling the total would even break "bonus not doubled", which is part of the lesson. | State the RAW rule once. Optionally footnote that "double the rolled die" has the same mean but a different spread. |
| Seeded RNG / reproducible rolls | Testing convenience | Not user-facing value. | `Math.random` is fine for users. Tests should target the exact-math functions, not the sim. |

---

## UX Conventions (for requirements)

### 2D outcome table

- **Orientation:** rows d20 = 1..20, columns dX = 1..X, as PROJECT.md specifies. Two orders are both defensible: **ascending top-to-bottom** (reads like a roll table, threshold line moves down as AC rises) and descending (hits on top, like a "roll high" chart). Pick ascending for consistency with AnyDice and roll-table convention, and keep it in all three tables.
- **Colour scale:** a single-hue or perceptually uniform **sequential** ramp (viridis-like or a light-to-dark single hue) for damage > 0. Avoid rainbow ramps, which are not perceptually ordered and not colour-blind safe. Switch text colour per cell (dark text on light cells, light on dark) for contrast.
- **Miss cells** (damage 0): not the bottom of the ramp. Use a neutral grey or hatched background with a muted "0" or "-", so "miss" reads as a different category from "low damage". The legend shows the ramp plus a separate "miss" swatch.
- **Crit row (d20 = 20):** give it a distinct border or accent (e.g. gold outline, "CRIT" row label), and extend the colour domain to cover crit values. **Cell content decision needed:** one row can't show a two-die crit exactly. Options, in order of recommendation:
  1. The cell shows **expected crit damage given this first die**: `k + avg(dX) + D` (e.g. "9.5" for k = 5 on a d8). The tooltip gives the range "6-13". This keeps the table's average exactly equal to EV (T7). **Recommended.**
  2. The cell shows the range `(k+1+D)-(k+X+D)`. Honest, but ranges clutter at d12 and can't be averaged.
  3. The cell shows `2k + D` ("double the rolled die"). Same mean, and the table stays integer, but it teaches a non-RAW rule. **Avoid**, or label it loudly.
- **Nat 1 row:** styled as "auto-miss" (row label "1 (auto-miss)"), even when 1 + A >= AC. This is where the 5% floor becomes visible.
- **Hit threshold:** a **thick horizontal rule** above the first hitting row, plus a label in the row header gutter ("hits on 14+ -> 35%"). When clamped, change the label to "only nat 1 misses (95% cap)" or "only nat 20 hits (5% floor)". The rule must move smoothly (no layout shift) as AC changes. Use a fixed row height and toggle a CSS class.
- **Legibility at d12 x 3 tables:** `font-variant-numeric: tabular-nums`, compact cells, a sticky row-header column when horizontal scroll is unavoidable on narrow screens, and stacking below about 900 px.

### Live controls

- **AC:** **slider paired with a number input**, kept in sync. NN/g: use a slider when the approximate range matters and exploration is the goal, and add an editable numeric field when exact values matter. AC is both: people sweep it to watch the crossover, and they want exactly "AC 16". Range 10-25, step 1. The label and current value go above or beside the slider, never below (NN/g), so the thumb doesn't hide them.
- **Die:** **segmented button group** (d4 d6 d8 d10 d12), not a `<select>`. Five mutually exclusive, always-visible options switch in one click. Implement as radio inputs styled as buttons for free keyboard and a11y support.
- **Base attack and damage bonus:** **number inputs with -/+ steppers** (or `<input type=number>`). Precise small integers that rarely get swept. Clamp to sane ranges (e.g. -5..+15) and decide whether negative values are allowed (useful for a -5/+10 style illustration).
- **N (comparison bonus, 0-20):** **slider**, because this one *is* swept. It is linked to the chart marker (D6). Show the value inline ("+5").
- Update everything on the `input` event. The whole model is at most 20 x 12 x 3 cells plus 42 chart points, so a full re-render per tick is fine. No debouncing needed.

### Side-by-side table comparison

- Three tables in a fixed order: **Baseline (+0) | +N to hit | +N to damage**. Each gets a caption with its EV/round, its 20-round EV, and its **delta vs baseline** ("+9.0 over 20 rounds").
- One **shared colour domain and one legend** for all three.
- Diff cues (D5): outline the rows that flipped miss->hit in the +hit table. In the +damage table, note that "every hit cell +N". Optionally offer a "show delta" toggle that renders differences instead of absolute values.
- Put a one-line takeaway under the trio, generated from the numbers ("At AC 15 with a d8, +5 to damage beats +5 to hit by 12.0 over 20 rounds").

### Exact EV vs simulated 20-round total

- **Exact is primary, simulated is secondary.** EV is shown large and labelled "Expected (exact)", with 1-2 decimals and no integer rounding. The sim result is labelled "This run (simulated)" and shown as an integer, because a real total is always an integer.
- Show them **together in one row**: `This run: 38 | Expected: 31.5 | Difference: +6.5`. Also compare hits: `hits 9/20 (expected 6.0)`, `crits 2 (expected 1.0)`.
- Give **variance context** so the gap doesn't mislead: a small horizontal strip showing the exact 20-round distribution (or +/-1 SD band) with the expected-value tick and the realized-value marker (D8).
- A per-round log (20 compact chips: "r14 d5 -> 5", "NAT 20: 6+3 -> 9", "miss") that ties to D7's cell highlighting.
- **Do not re-roll on input changes.** A stale sim result next to a new EV is confusing. Either clear the sim ("settings changed, roll again") or keep it with an explicit "rolled at AC 15, d8" caption. Clearing is simpler and more honest.
- Optional: keep the last 5-10 run totals as dots on the strip, so repeated clicks show the spread building up. This is a cheap, strong variance lesson.

### Line chart

- y-axis starts at 0. x ticks at every 5 plus the current N marker. The y-axis is "expected damage over 20 rounds". The per-round value can go in the hover readout.
- **Label the lines directly** at their right ends ("bonus to hit", "bonus to damage") and don't rely on a legend alone. Use two hues that are colour-blind distinguishable and different from the table's damage ramp, and also vary line style (solid/dashed).
- Shade the clamp regions (D4). Mark the crossover (D3). A hover or focus readout shows both values and their difference at the given x.

---

## Feature Dependencies

```
[T1 Rules engine: resolve(d20, dX, A, D, AC) -> {hit, crit, damage}]
    |--required by--> [T4 Outcome table model (20 x X cells)]
    |                     |--required by--> [T7 Exact EV = mean of cells]
    |                     |                     |--required by--> [T3 Headline stats]
    |                     |                     |--required by--> [T10 Chart series (EV at A+n / D+n, n=0..20)]
    |                     |                     |                     |--required by--> [D3 Crossover detection]
    |                     |                     |                     `--required by--> [D4 Clamp-region shading]
    |                     |                     |--required by--> [D1 Marginal-value readout]
    |                     |                     `--required by--> [T8/D2 Live formulas & generated prose]
    |                     |--required by--> [T4 Table render] --> [T5 Colour scale] --> [T6 Threshold rule]
    |                     |                                            `--required by--> [T11 Side-by-side (shared domain)]
    |                     |                                                                  `--enhanced by--> [D5 Diff highlighting]
    |                     `--required by--> [D8 Exact 20-round distribution (convolution)]
    `--required by--> [T9 Simulation (same resolve(), second die on crit)]
                          |--enhanced by--> [D7 Rolled-cell highlighting]  (requires T4 render)
                          `--enhanced by--> [D8 Percentile / distribution strip]

[T2 Controls + single state object] --drives--> everything above
    |--enhanced by--> [D6 Linked N between chart and tables]  (requires T10 + T11)
    `--enhanced by--> [D10 URL hash state]

[T9 Simulation result] --conflicts with--> [live re-render on input]  => clear or caption sim on any change
[Per-table colour autoscale] --conflicts with--> [T11 Side-by-side comparison]
```

### Dependency Notes

- **Everything requires T1 as a single pure function.** The table, EV, chart, and simulation must all call the same `resolve()`/`cellDamage()` logic. If the sim and the table each implement their own crit rule, they will disagree, and the page loses the one thing it must have (trust).
- **T7 requires T4 and the crit-cell decision:** "EV derived from the table" only holds if crit-row cells hold the conditional mean `k + avg + D` (option 1 above). With option 3 the mean still matches. With option 2 (ranges) the table can't be averaged directly.
- **T10 requires T7 parameterized:** the chart is just `EV(A+n, D)` and `EV(A, D+n)` for n = 0..20, so build EV as a function of explicit parameters, not of global state.
- **D3/D4 require T10's series** plus the threshold function from T1. The clamp points are analytic: the cap is reached when AC - (A+n) <= 2, and the floor is exited when AC - (A+n) <= 19.
- **T11 requires T5 with a shared domain.** Build the colour scale as a function of (value, domainMax), and compute domainMax across all visible tables before rendering any of them.
- **D6 requires T10 and T11** both to exist and to read N from shared state.
- **D7 requires the T4 render and T9.** The sim must return the rolled (d20, dX1, dX2) tuples, not just a total.
- **D8 requires the T4 model** (the one-round damage distribution is the table's value histogram, each cell 1/(20X), with crit cells expanded over the second die).

---

## MVP Definition

### Launch With (v1)

All Active requirements in PROJECT.md, plus the cheapest differentiators that deliver the Core Value directly.

- [ ] T1 Correct rules engine (nat 1/nat 20, dice-doubled crit, modifier once) — everything depends on it
- [ ] T2 Controls: AC slider + number, die segmented buttons, base A/D steppers, N slider
- [ ] T3 Headline stats including "hits on T+" and clamp status
- [ ] T4/T5/T6 2D table with shared sequential colour scale, distinct miss styling, crit row accent, threshold rule, legend
- [ ] T7 Exact EV from the table (with an internal self-check against the closed form)
- [ ] T8 + **D2** Formulas with live-substituted numbers (cheap, and they are the teaching layer)
- [ ] T9 Roll-20-rounds sim, realized vs expected, per-round log, cleared on input change
- [ ] T10 SVG line chart + **D3** crossover marker (handles 0/1/2 crossings) + **D4** clamp shading
- [ ] T11 Side-by-side tables with shared domain + delta vs baseline captions
- [ ] **D1** Marginal "+1 is worth..." readout with the faces-that-hit rule. This is the single highest-leverage teaching feature and is LOW cost.
- [ ] T12/T13 Responsive stacking, numbers in cells, keyboard-operable controls
- [ ] GitHub Pages deployment (PROJECT.md scope)

### Add After Validation (v1.x)

- [ ] D5 Diff highlighting (outlined converted rows / "+N" badges / delta toggle). Add if feedback says the side-by-side shift is not obvious.
- [ ] D6 Chart <-> tables linking (click chart to set N). Add once both views are stable.
- [ ] D7 Rolled-cell highlighting. Add if the sim feels disconnected from the table.
- [ ] D8 Exact 20-round distribution strip + percentile (start with a +/-1 SD band if time is short)
- [ ] D9 Cell tooltips with per-cell probability
- [ ] D10 URL hash state. Add as soon as anyone wants to share a scenario (it is very cheap).
- [ ] Run history dots on the distribution strip

### Future Consideration (v2+)

- [ ] Advantage/disadvantage. Its own lesson: it shifts the linear 5%-per-step d20 into a curve. Deferred per PROJECT.md.
- [ ] Multi-dice damage (2d6 etc.). Needs a convolved column axis. Deferred per PROJECT.md.
- [ ] Expanded crit range (19-20). A small rules change, but it shifts the "bonus not doubled" framing. Only if the audience asks.
- [ ] A -5/+10 "trade" mode (bonus on one side, penalty on the other). A natural extension of the crossover lesson, but it is a new mode.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| T1 Rules engine | HIGH | LOW | P1 |
| T2 Live controls | HIGH | LOW | P1 |
| T3 Headline stats | HIGH | LOW | P1 |
| T4-T6 2D table + colour + threshold | HIGH | MEDIUM | P1 |
| T7 Exact EV from table | HIGH | LOW | P1 |
| T8 + D2 Live formulas | HIGH | LOW | P1 |
| T9 20-round simulation | HIGH | LOW | P1 |
| T10 SVG line chart | HIGH | MEDIUM | P1 |
| D3 Crossover marker | HIGH | MEDIUM | P1 |
| D4 Clamp shading | HIGH | LOW | P1 |
| T11 Side-by-side tables | HIGH | MEDIUM | P1 |
| D1 Marginal-value readout | HIGH | LOW | P1 |
| T12/T13 Responsive + a11y basics | MEDIUM | MEDIUM | P1 |
| D5 Diff highlighting | HIGH | MEDIUM | P2 |
| D6 Linked N chart <-> tables | MEDIUM | MEDIUM | P2 |
| D8 Distribution strip / percentile | MEDIUM | MEDIUM | P2 |
| D7 Rolled-cell highlighting | MEDIUM | LOW | P2 |
| D10 URL hash state | MEDIUM | LOW | P2 |
| D9 Cell tooltips | LOW | LOW | P3 |
| D11 Row/column marginals | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | AnyDice | TabletopCalc 5e DPR | oefi dnd5e-dpr-calc | GWM/SS breakpoint calcs | Our Approach |
|---------|---------|---------------------|---------------------|-------------------------|--------------|
| Hit/crit rules | User must program them | Nat 1/20 clamp, dice-doubled crit, crit range | 2024 rules, crit range, adv/super-adv | Built in | RAW 5e, nat 20 only, no crit range (T1) |
| Outcome-space view | Value/probability table + bar graph (1D) | Per-attack breakdown table | None | None | **Full 2D d20 x dX roll table** (T4) |
| Exact vs simulated | Exact only | Exact only | Expected values + multi-round totals | Exact | Exact primary, sim for variance (T7, T9, D8) |
| Formula display | N/A (the program is the formula) | Static formula reference + worked example | Live formula breakdowns + tooltips | Minimal | **Live-substituted formulas + generated prose** (D2) |
| Hit vs damage comparison | Manual, stacked outputs | Manual (change inputs, compare) | Manual | Single fixed -5/+10 trade | **Sweep 0..+20 both ways, crossover + clamps marked** (T10, D3, D4) |
| Marginal value of +1 | No | No | No | Implicit | **Explicit readout + rule of thumb** (D1) |
| Cell-by-cell change view | No | No | No | No | **Side-by-side + diff** (T11, D5) |
| Sharing | URL encodes program + view | Not observed | Not documented | CodePen link | URL hash state (D10) |
| Stats | Mean, SD per output | DPR, hit %, crit %, min/max | DPR, cumulative chart | Breakpoint AC | EV, hit/crit %, min/max, 20-round spread |

---

## Verified Math Facts Useful for Requirements and Tests

Computed with a local script from the PROJECT.md formula. Values are 20-round expected totals, for bonus N = 0 -> 20.

| Scenario | Bonus on attack (20-round EV) | Bonus on damage (20-round EV) | Crossover |
|---|---|---|---|
| d8, A0, D0, AC15 | 31.5 -> plateaus at 90.0 from +13 | 31.5 -> 151.5 (linear, +6.0/step) | **None**, damage leads throughout (4.5 < 6 faces that hit) |
| d12, A0, D0, AC15 | 45.5 -> plateaus at 130.0 from +13 | 45.5 -> 165.5 (+6.0/step) | **+15** (to-hit leads early, plateau lets damage pass) |
| d12, A0, D0, AC25 | flat 13.0 for +0..+5 (floor dead zone), then +6.5/step | 13.0 -> 33.0 (+1.0/step) | **+6** (damage leads +1..+5, then to-hit overtakes) |
| d12, A5, D3, AC20 | 63.5 -> plateaus at 187.0 from +13 | 63.5 -> 183.5 | **None in range**, to-hit leads through +20 |
| d4, A0, D0, AC10 | 30.0 -> plateaus at 50.0 from +8 | 30.0 -> 250.0 | None, damage dominates |

Key analytic rule (holds while the hit chance is unclamped): **delta per +1 to hit = 0.05 * (avg(dX)+D). Delta per +1 damage = P(hit incl. crit).** So +1 to hit is better iff avg(dX) + D > (number of d20 faces that hit). A common default (d8, no modifier, mid AC) comes out "damage always wins". The explanatory text must be generated from the numbers, not written around an assumed conclusion.

---

## Sources

- AnyDice documentation, output views (table/graph/export; normal/at least/at most/transposed; mean and SD; shareable view URLs) — https://anydice.com/docs/introduction/ (HIGH, official docs)
- TabletopCalc D&D 5e DPR Calculator (inputs, nat 1/20 clamp, dice-doubled crit, formula reference, worked example) — https://tabletopcalc.com/dnd5e-dpr-calculator.html (MEDIUM, page content read)
- oefi/dnd5e-dpr-calc (live formula breakdowns, cumulative Chart.js chart, 2024 rules, tooltips) — https://github.com/oefi/DND-5E-Damage-Per-Round-Calculator (MEDIUM, README)
- RPGBOT DPR Calculator and DPR article (hit formula H = 1 - (M - A)/20, crit handling, no DPR-vs-AC visuals) — https://rpgbot.net/dnd5/tools/dpr-calculator/ , https://rpgbot.net/dnd5/characters/damage-per-round/ (MEDIUM, calculator UI loads client-side and could not be inspected)
- DnD Metrics DPR — https://dndmetrics.com/dpr (LOW, landing page only)
- Fern Flower Press DPR Calculator 2024 — https://fernflowerpress.com/pages/dpr-calculator (LOW, search snippet only)
- GWM/Sharpshooter breakpoint calculator (CodePen) — https://codepen.io/ludviglindblom/pen/ExEQLYx (LOW, 403 on fetch, described from search snippet)
- RPGBOT GWM/SS feat guide — https://rpgbot.net/dnd5/characters/feats/great-weapon-master-sharpshooter/ (LOW, snippet)
- Pearson Dice Roller & Probability Simulator (exact table + simulation histogram + step-by-step) — https://www.pearson.com/channels/calculators/dice-roller-probability-simulator (MEDIUM)
- NN/g, "Slider Design: Rules of Thumb" (slider for approximate values; pair with editable numeric input for precision; labels above/beside) — https://www.nngroup.com/articles/gui-slider-controls/ (HIGH)
- NN/g, "Sliders, Knobs, and Matrices: Balancing Exploration and Precision" — https://www.nngroup.com/articles/sliders-knobs/ (HIGH)
- 2024 PHB critical hit rule (roll damage dice twice, add modifiers as normal; nat 20 hits regardless) — https://roll20.net/compendium/dnd5e/Rules:Damage%20and%20Healing (MEDIUM, consistent with 2014 PHB)
- D&D Beyond forum discussion on ASI accuracy value vs AC — https://www.dndbeyond.com/forums/d-d-beyond-general/general-discussion/116714-do-we-tend-to-over-estimate-the-benefit-of-asis-on (LOW, community)
- Bret Victor, "Explorable Explanations" (reactive-document pattern behind D2) — http://worrydream.com/ExplorableExplanations/ (training knowledge, not re-fetched: LOW-MEDIUM)

---
*Feature research for: D&D 5e attack-roll probability / roll-table visualizer for game designers*
*Researched: 2026-09-24*
