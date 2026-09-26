# Roadmap: D&D Combat Roll Simulator

## Overview

The project goes from an empty repo to a public GitHub Pages explorable explanation of one D&D 5e attack roll. Phase 1 builds the single rules engine. Everything else calls into it, and it is proven by an in-page self-test. On top of it sits a live, deployed page with the baseline 2D outcome table and headline stats. Shipping this skeleton to Pages first surfaces the gh CLI, branch-rename, and Pages API friction while the code is still small. Phase 2 adds the core lesson: the +N-to-hit vs +N-to-damage comparison, shown as three side-by-side tables and an SVG sweep chart with honest crossover and plateau marking. Phase 3 adds the "Roll 20 rounds" simulation so designers can see variance around the exact numbers. Phase 4 wraps it in live, generated designer-facing explanation, does an accessibility pass, and re-verifies the final public URL.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Live Roll Table, Deployed** - Self-tested 5e rules engine driving a live baseline outcome table and stat cards, published to a public GitHub Pages URL (completed 2026-09-25)
- [x] **Phase 2: Bonus Comparison** - N slider, three side-by-side tables (baseline / +N hit / +N damage), and the SVG sweep chart with crossover and plateau marking (completed 2026-09-25)
- [x] **Phase 3: Roll-20-Rounds Simulation** - Real dice rolls with a per-round log, realized vs expected (with standard deviation), and stale-result handling (completed 2026-09-26)
- [ ] **Phase 4: Designer Explanation & Final Ship** - Live-substituted formulas, generated crossover/plateau copy, suggested explorations, accessibility pass, final public deploy

## Phase Details

### Phase 1: Live Roll Table, Deployed

**Goal**: A designer can open a public URL, change AC, die, and bonuses, and see the full d20 x dX outcome table and exact headline stats update live. Every number comes from one self-tested rules engine.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: RULES-01, RULES-02, RULES-03, RULES-04, RULES-05, RULES-06, RULES-07, RULES-08, CTRL-01, CTRL-02, CTRL-03, CTRL-05, TABLE-01, TABLE-02, TABLE-03, TABLE-04, TABLE-05, TABLE-06, STAT-01, STAT-02, STAT-03, DEPLOY-01, DEPLOY-02, DEPLOY-03
**Success Criteria** (what must be TRUE):

  1. The page loads without console errors or outside network requests in two places: the public GitHub Pages URL (HTTP 200, public repo on `main` with `.nojekyll` and a README) and `index.html` opened straight from disk.
  2. Changing AC (slider or number box), the damage die (d4-d12 buttons), the attack bonus, or the damage bonus redraws the 20 x X table at once. Miss cells show 0 in a neutral style and hit cells use one color ramp. A labeled "hits on N+" rule is visible, the nat 1 row reads auto-miss, and the nat 20 row reads crit and shows 2 x face + damage bonus with its footnote. A legend explains all of this, and the d12 table stays legible on a laptop.
  3. The stat cards match the reference values: AC 15 / +5 shows 55% hit chance, AC 25 / +0 shows 5%, AC 15 / +0 / d8 shows 31.5 over 20 rounds, and AC 15 / +5 / d8 shows 54.0. The displayed per-round figure x 20 equals the displayed 20-round figure. The marginal readout shows what the next +1 to hit and the next +1 to damage are worth, with +1 to hit reading 0 when capped.
  4. Opening the page with `?test` shows a visible pass/fail panel with every reference assertion passing. A normal load logs the same results to the console.
  5. Typing a blank, non-numeric, or out-of-range value into any control clamps to a valid value. The table never breaks or compares numbers as strings.

**Plans:** 5/5 plans complete

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Walking-skeleton page: DiceMath engine + VM + self-test + AC control driving a live table, plus dev check tools (Wave 1)
- [x] 01-02-PLAN.md — Install gh via winget; single human checkpoint for `gh auth login` (Wave 1, parallel)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-03-PLAN.md — Publish the skeleton: branch main, .nojekyll, README, public repo, Pages from main /, live verification (Wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-04-PLAN.md — Themed, readable table: parchment/candlelit tokens, heat ramp, labels, legend, crit footnote, d12 size tiers (Wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-05-PLAN.md — Die buttons, bonus steppers, six stat cards, next-+1 readout; re-ship and verify the live URL (Wave 4)

**UI hint**: yes

### Phase 2: Bonus Comparison

**Goal**: A designer can pick a bonus N and see, cell by cell and as a curve, how +N on the attack roll compares with +N on the damage roll. The page is honest about where the attack curve plateaus and whether the curves cross at all.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: CTRL-04, CHART-01, CHART-02, CHART-03, CHART-04, CHART-05, CMP-01, CMP-02, CMP-03, CMP-04, CMP-05
**Success Criteria** (what must be TRUE):

  1. Moving the N slider updates three tables: baseline, +N to hit, and +N to damage. They share one color scale, so the damage increase shows up as a color shift. Each table shows its own hit-threshold rule and 20-round expected total. The +N tables show the plain resulting damage in every cell with no diff highlighting (CMP-04 as amended 2026-09-25); the shift shows through the values, the shared color scale, each table's own threshold rule, and each table's 20-round total with its delta vs baseline.
  2. The SVG chart plots expected 20-round damage for N = 0..20 with two curves (bonus on attack, bonus on damage). The curves start at the same point at N = 0, and the chart has labeled axes, ticks, a legend, and a vertical marker that follows the current N.
  3. At AC 15 / d8 / +0 / +0 the chart shows no crossover marker, and its caption says the damage bonus leads at every N. At AC 25 / d12 the crossing is marked. Within N = 0..20 every setting has zero or one crossing (checked over all 70,980 settings), and both render without errors or false markers; the two-crossing code path stays generic and is tested with synthetic series.
  4. The flat stretches of the attack curve (95% cap reached, or only a nat 20 hits) are shaded and labeled on the chart.
  5. At about 1366 px wide with a d12, the three tables sit side by side. On a narrow screen they stack with no horizontal page scroll.

**Plans:** 3/3 plans complete

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Compare +N slice: N slider (CONTROL_SPEC.n), three plain-valued compact tables on one shared heat scale with threshold rules and stats lines, three-up / stacked layout (Wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — Sweep chart slice: inline SVG with both exact series, nice-tick axes, slider-driven N marker, direct labels, legend, caption, hover readout (Wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-03-PLAN.md — Crossing markers, shaded cap/floor bands, full generated caption, phase verification, ROADMAP SC1/SC3 wording (Wave 3)
**UI hint**: yes

### Phase 3: Roll-20-Rounds Simulation

**Goal**: A designer can roll 20 real rounds and compare the realized total with the exact expectation and its spread. They learn not to over-trust averages, and the exact and simulated numbers never blur together.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: SIM-01, SIM-02, SIM-03, SIM-04, SIM-05, SIM-06
**Success Criteria** (what must be TRUE):

  1. Clicking "Roll 20 rounds" shows a realized total labeled "This run (simulated)". It sits next to a visually distinct "Expected (exact)" total that includes its standard deviation.
  2. A per-round log lists each round's d20 result, hit/miss/crit, the damage dice rolled (two real dice on a crit), and the damage dealt. The log's damage sums to the realized total.
  3. Changing any control after a roll marks the previous result as stale and shows the parameters it was rolled at. The simulation never re-rolls on its own, and dragging a slider causes no flicker.
  4. The `?test` panel includes seeded-RNG simulation checks, and they pass the same way on every load.

**Plans:** 3/3 plans complete

Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Roll it and compare: exact spread (DiceMath.spread), seeded dice-sim block, "Expected (exact) ± SD" vs "This run (simulated)" with spread and placement lines, WR-01 guarded init, seeded self-test and check-engine (o)/(p)/(q) (Wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — Per-round log with Total, rolled-at note, stale dimming, Now: line, tally, no-flicker rebuild on run id (Wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-03-PLAN.md — Rings, badges, and row-label counts on the #outcome table, legend item, phase verification with state screenshots (Wave 3)
**UI hint**: yes

### Phase 4: Designer Explanation & Final Ship

**Goal**: A game designer who has never seen the page can read it top to bottom and understand the lesson. Attack bonuses saturate at the 5%-95% clamp, damage bonuses scale linearly, and the crossover, when it exists, depends on AC and the die. The explanatory text always matches the live numbers, and the finished page is accessible and live at the public URL.
**Mode:** mvp
**Depends on**: Phase 2, Phase 3
**Requirements**: COPY-01, COPY-02, COPY-03, COPY-04, COPY-05, DEPLOY-04
**Success Criteria** (what must be TRUE):

  1. The page explains the two-roll structure (d20 to hit, dX for damage) and presents the 2D table as the joint outcome space, written for game designers.
  2. The formulas for hit chance, expected damage per round, and the value of +1 to hit vs +1 to damage show the current control values. Changing AC or the die updates the substituted numbers live.
  3. The crossover paragraph always matches the chart: it has distinct text for no crossing, one, and two, and never claims a crossover that does not exist. The plateau and linear explanations point at the shaded chart regions.
  4. A suggested-exploration section points to settings that produce a crossover (for example AC 25 with a d12) and settings where the damage bonus always wins (AC 15 with a d8). Trying them shows exactly what the text describes.
  5. Every control can be reached and operated by keyboard and has a visible label. Miss vs hit can be told apart without color. The final version is live at the public GitHub Pages URL with HTTP 200 and no console errors.

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4. Phase 3 depends only on Phase 1, but it runs after Phase 2 because every phase edits the same `index.html`.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Live Roll Table, Deployed | 5/5 | Complete    | 2026-09-25 |
| 2. Bonus Comparison | 3/3 | Complete   | 2026-09-25 |
| 3. Roll-20-Rounds Simulation | 3/3 | Complete   | 2026-09-26 |
| 4. Designer Explanation & Final Ship | 0/TBD | Not started | - |
