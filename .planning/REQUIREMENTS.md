# Requirements: D&D Combat Roll Simulator

**Defined:** 2026-09-24
**Core Value:** A designer can see, in one glance at a live table and a curve, why attack bonuses saturate (hit chance caps at 95%) while damage bonuses scale linearly, and why the crossover depends on AC and the damage die.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Rules Engine

- [x] **RULES-01**: An attack hits when d20 + attack bonus >= AC, evaluated numerically (never string comparison)
- [x] **RULES-02**: A natural 1 always misses regardless of bonus; a natural 20 always hits regardless of AC
- [x] **RULES-03**: A natural 20 is a critical hit: damage dice are rolled twice, the damage bonus is added once
- [x] **RULES-04**: A miss deals 0 damage
- [x] **RULES-05**: A single pure function resolves damage for (d20 result, die roll(s), AC, attack bonus, damage bonus), and the table, exact stats, chart, and simulator all call it
- [x] **RULES-06**: Exact hit chance is computed by counting d20 faces (loop 1..20), so it is clamped between 5% and 95% by construction
- [x] **RULES-07**: Expected damage per round and over 20 rounds is derived from the outcome table and cross-checked against the closed form (P(normal hit) x (avg + D) + P(crit) x (2 x avg + D))
- [x] **RULES-08**: An in-page self-test runs on load, asserts known reference values (AC 15 / +5 gives 55% hit; AC 15 / +0 / d8 gives 31.5 over 20 rounds; AC 15 / +5 / d8 gives 54.0; AC 25 / +0 gives 5%; both sweep curves equal at N = 0; E(D+1) - E(D) = P(any hit)), logs to console, and shows a visible pass/fail panel when the URL contains `?test`

### Controls

- [x] **CTRL-01**: User can set target AC with a range slider paired with a number input (range 10 to 30), and the page updates live on the `input` event
- [x] **CTRL-02**: User can pick the damage die from d4, d6, d8, d10, d12 via a segmented button group
- [x] **CTRL-03**: User can set a base attack bonus and a base damage bonus with number steppers (range -5 to +20)
- [x] **CTRL-04**: User can set the comparison bonus N (0 to 20) with a slider; N drives the side-by-side tables and the chart marker
- [x] **CTRL-05**: Every control value passes through one numeric parser with clamping and fallback into a single state object; renders are coalesced with requestAnimationFrame

### Outcome Table

- [x] **TABLE-01**: A 2D outcome table renders with rows = d20 result 1..20 (ascending) and columns = damage die face 1..X, each cell showing damage dealt (0 on a miss)
- [x] **TABLE-02**: Miss cells use a distinct neutral style (not the low end of the damage color ramp); hit cells use one sequential color scale
- [x] **TABLE-03**: The hit threshold is marked with a visible rule and a label such as "hits on 14+"; the nat 1 row is labeled auto-miss and the nat 20 row is labeled crit
- [x] **TABLE-04**: The nat 20 row shows 2 x face + damage bonus, with a footnote stating that a real crit rolls a second die and that the table's average equals the true expected value
- [x] **TABLE-05**: A legend explains the color scale, the miss style, and the crit row
- [x] **TABLE-06**: The table is real `<table>` markup with row and column headers (`<th scope>`), and stays legible at d12 width

### Headline Stats

- [x] **STAT-01**: Stat cards show hit threshold ("needs N+"), hit chance including crit, crit chance, average damage on a hit, expected damage per round, and expected damage over 20 rounds
- [x] **STAT-02**: Displayed numbers are rounded consistently so per-round x 20 matches the 20-round figure shown
- [x] **STAT-03**: A marginal-value readout states what the next +1 to hit is worth (5% x (avg die + D) per round while unclamped, 0 when capped or in the nat-20-only floor) and what the next +1 to damage is worth (P(any hit) per round)

### Comparison Chart

- [x] **CHART-01**: An inline SVG line chart plots bonus N = 0..20 on the x-axis and expected 20-round damage on the y-axis, with two series: N added to the attack bonus, and N added to the damage bonus, at the current AC, die, and base bonuses
- [x] **CHART-02**: The chart has labeled axes, tick marks, a legend, and both series start from the same point at N = 0
- [x] **CHART-03**: Crossover points where the two series meet are marked; the chart and its caption handle zero, one, or two crossings as normal states
- [x] **CHART-04**: The regions where the attack curve is flat (95% cap reached, or only a nat 20 hits) are shaded and labeled
- [x] **CHART-05**: A vertical marker on the chart shows the current comparison bonus N from CTRL-04

### Side-by-Side Tables

- [x] **CMP-01**: Three outcome tables render side by side: baseline, baseline with +N to hit, baseline with +N to damage
- [x] **CMP-02**: All three tables share one color-scale domain (max computed across all three before rendering) so a cell shift is visible as a color shift
- [x] **CMP-03**: Each comparison table shows its own hit threshold rule and its own expected 20-round total under it
- [x] **CMP-04**: The +N-to-hit and +N-to-damage tables show the resulting damage in every cell with no diff highlighting (amended 2026-09-25 in the Phase 2 discussion); the shift is conveyed by the values, the shared color scale (CMP-02), each table's own threshold rule (CMP-03), and each caption's 20-round total with its delta vs baseline
- [x] **CMP-05**: The three tables sit side by side on a laptop-width viewport (about 1366 px) at d12 and stack vertically on narrow screens without horizontal page scroll

### Simulation

- [x] **SIM-01**: A "Roll 20 rounds" button rolls a real d20 and real damage dice for each of 20 rounds (two damage dice on a crit) using `1 + floor(random * sides)` and shows the realized total
- [x] **SIM-02**: The realized total is displayed next to, and visually distinct from, the exact expected total, labeled "This run (simulated)" vs "Expected (exact)"
- [x] **SIM-03**: A per-round log shows the d20 result, hit/miss/crit, the damage dice, and the damage dealt for each round
- [x] **SIM-04**: The simulation rolls only on click; when any control changes, the previous result is marked stale with the parameters it was rolled at, not silently re-rolled
- [x] **SIM-05**: The expected total is shown with its standard deviation (exact, from the one-round distribution) so the gap between realized and expected has context
- [x] **SIM-06**: The dice function accepts an injectable random source so the self-test can run it with a seeded generator

### Explanation

- [ ] **COPY-01**: The page explains the two-roll structure (d20 to hit, dX for damage) and how the 2D table is the joint outcome space, in language for game designers
- [ ] **COPY-02**: Formulas for hit chance, expected damage per round, and the value of +1 to hit vs +1 to damage are displayed with the current control values substituted live
- [ ] **COPY-03**: The crossover explanation is generated from the computed crossing list, with distinct text for no crossing, one crossing, and two crossings, and never asserts a crossover that does not exist at the current settings
- [ ] **COPY-04**: The page explains why the attack curve plateaus (5% to 95% clamp) and why the damage curve is linear, tied to the shaded chart regions
- [ ] **COPY-05**: A short suggested-exploration section points at settings that show a crossover (for example AC 25 with a d12) and settings where damage bonus always wins (AC 15 with a d8)

### Deployment

- [x] **DEPLOY-01**: The whole site is one `index.html` with inline CSS and classic inline `<script>` blocks, no build step, no external requests; it also works when opened directly from disk
- [x] **DEPLOY-02**: The repository is on GitHub as a public repo with the default branch renamed to `main`, with a `.nojekyll` file and a README describing the page
- [x] **DEPLOY-03**: GitHub Pages is enabled from the `main` branch root via the REST API (gh CLI installed and authenticated as a prerequisite), and the public URL returns HTTP 200 with the page rendering and no console errors
- [ ] **DEPLOY-04**: Controls are keyboard operable, every control has a label, and miss vs hit is not encoded by color alone

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Interactivity

- **INT-01**: Clicking a point on the chart sets N and updates the side-by-side tables
- **INT-02**: Cells rolled during a simulation are highlighted in the baseline table
- **INT-03**: Hovering a cell shows a tooltip with the roll pair, hit/miss reason, and cell probability
- **INT-04**: Control state is encoded in the URL hash so a configuration can be shared
- **INT-05**: A distribution strip shows the one-round damage histogram and 20-round percentile band

### Rules Extensions

- **RX-01**: Advantage and disadvantage on the d20
- **RX-02**: Multi-dice damage such as 2d6 or 3d4
- **RX-03**: Expanded crit range (19-20)
- **RX-04**: A -5 / +10 trade-off preset (Great Weapon Master / Sharpshooter style)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Frameworks, bundlers, build steps | User chose single index.html with vanilla JS; Pages serves it directly |
| CDN chart or dice libraries | User chose no external dependencies; inline SVG suffices for 2 x 21 points |
| Multiple attacks, class features, spells, feats | This teaches one attack roll's anatomy, not a full DPR calculator |
| Per-table auto-scaled color ramps | Would hide the damage shift between the side-by-side tables |
| Monte Carlo as the source of expected values | Exact enumeration is cheap and is the point; simulation exists only to show variance |
| 3D dice animations, dice expression language | Not related to the lesson; adds weight and dependencies |
| Player build-optimization framing | Audience is game designers learning the math |
| House-rule crit variants (max dice, triple dice) | Muddies the core 5e lesson; RX-03 covers the one common variant for v2 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| RULES-01 | Phase 1 | Complete |
| RULES-02 | Phase 1 | Complete |
| RULES-03 | Phase 1 | Complete |
| RULES-04 | Phase 1 | Complete |
| RULES-05 | Phase 1 | Complete |
| RULES-06 | Phase 1 | Complete |
| RULES-07 | Phase 1 | Complete |
| RULES-08 | Phase 1 | Complete |
| CTRL-01 | Phase 1 | Complete |
| CTRL-02 | Phase 1 | Complete |
| CTRL-03 | Phase 1 | Complete |
| CTRL-04 | Phase 2 | Complete |
| CTRL-05 | Phase 1 | Complete |
| TABLE-01 | Phase 1 | Complete |
| TABLE-02 | Phase 1 | Complete |
| TABLE-03 | Phase 1 | Complete |
| TABLE-04 | Phase 1 | Complete |
| TABLE-05 | Phase 1 | Complete |
| TABLE-06 | Phase 1 | Complete |
| STAT-01 | Phase 1 | Complete |
| STAT-02 | Phase 1 | Complete |
| STAT-03 | Phase 1 | Complete |
| CHART-01 | Phase 2 | Complete |
| CHART-02 | Phase 2 | Complete |
| CHART-03 | Phase 2 | Complete |
| CHART-04 | Phase 2 | Complete |
| CHART-05 | Phase 2 | Complete |
| CMP-01 | Phase 2 | Complete |
| CMP-02 | Phase 2 | Complete |
| CMP-03 | Phase 2 | Complete |
| CMP-04 | Phase 2 | Complete |
| CMP-05 | Phase 2 | Complete |
| SIM-01 | Phase 3 | Complete |
| SIM-02 | Phase 3 | Complete |
| SIM-03 | Phase 3 | Complete |
| SIM-04 | Phase 3 | Complete |
| SIM-05 | Phase 3 | Complete |
| SIM-06 | Phase 3 | Complete |
| COPY-01 | Phase 4 | Pending |
| COPY-02 | Phase 4 | Pending |
| COPY-03 | Phase 4 | Pending |
| COPY-04 | Phase 4 | Pending |
| COPY-05 | Phase 4 | Pending |
| DEPLOY-01 | Phase 1 | Complete |
| DEPLOY-02 | Phase 1 | Partial (main branch, .nojekyll, README done locally; public repo deferred 2026-09-25, user chose local git) |
| DEPLOY-03 | Phase 1 | Deferred (user chose local git only on 2026-09-25; gh installed, not authenticated) |
| DEPLOY-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 47 total (the initial count of 45 was a miscount; 8 RULES + 5 CTRL + 6 TABLE + 3 STAT + 5 CHART + 5 CMP + 6 SIM + 5 COPY + 4 DEPLOY = 47)
- Mapped to phases: 47
- Unmapped: 0

---
*Requirements defined: 2026-09-24*
*Last updated: 2026-09-24 after roadmap creation (traceability filled, 4 phases)*
