# D&D Combat Roll Simulator

## What This Is

A single-file, static web page that shows how one D&D 5e attack roll works, live at https://atomechllc.github.io/dnd-roll-tables/. A d20 to-hit roll against Armor Class is followed by a dX damage roll. The page:
- renders the full 2D outcome table (a miss deals 0 damage);
- compares +1 through +20 added to the attack roll against the same bonus added to the damage roll, in three side-by-side tables and an exact sweep chart;
- rolls a real 20-round fight next to the exact expected value and its spread;
- explains every number with live formulas;
- shows how many hits and rounds it takes to kill an enemy with editable hit points.

It is built for game designers who want to understand the math, not just the result.

## Core Value

A designer can see, in one glance at a live table and a curve, why attack bonuses saturate (hit chance caps at 95%) while damage bonuses scale linearly, and why the crossover depends on AC and the damage die. v1.0 confirmed this as the center of the page. Hits-to-kill extends it to "how long does the fight take" without replacing it.

## Current State

- **Shipped:** v1.0 MVP on 2026-09-28 (Phases 1-5, 20 plans). See `.planning/MILESTONES.md` and `.planning/milestones/v1.0-*.md`.
- **Hosting:** the public repo AtomechLLC/dnd-roll-tables. Every push to `main` deploys through a GitHub Actions Pages workflow. Pushes go over SSH, and gh is not signed in on this machine.
- **Codebase:** `index.html` is 5,413 lines, the whole deliverable. It uses classic inline scripts: `dice-math`, `dice-sim`, `view-model`, `dice-selftest`, `app`.
- **Dev-only checks:** `tools/check-engine.mjs` (1,944 lines) proves every copy claim and kill number against exact oracles over all 70,980 attack settings, and 1,235,000 attack × HP cases for kills. `tools/check-page.mjs` (544 lines) is a headless Chrome check with accessibility, page-order and fault-mode guards.
- **Self-test:** 261 checks, run on every load. It takes about 60 ms in Chrome, where the 200 ms budget is enforced, and runs close to 200 ms under Node.

## Next Milestone Goals

Not defined yet. Run `/gsd:new-milestone`. Candidates already on record:
- **Deferred from Phase 5:** kill speed in the compare tables; a rounds-to-kill mode for the sweep chart; a full rounds-to-kill distribution chart; "next enemy steps in" kill counting.
- **Deferred from Phase 2:** a per-cell delta toggle; click or drag on the chart to set N.
- **v2 requirements** (in `.planning/milestones/v1.0-REQUIREMENTS.md`): interactivity and rules extensions, such as advantage/disadvantage and multi-dice damage.
- **Tech debt:** the per-round figure's third decimal, listed under Context.

## Requirements

### Validated

- ✓ Live controls: target AC (slider + number, 10 to 30), damage die (d4 to d12), attack bonus and damage bonus (−5 to +20). The outcome table and settings sit at the top of the page. — v1.0 (Phase 1; moved to the top by quick task 260927-17o)
- ✓ 2D outcome table: rows are the d20 result (1 to 20), columns are the dX result (1 to X), and each cell shows damage dealt, 0 on a miss. — v1.0 (Phase 1)
- ✓ Rules modeled: a natural 20 always hits and doubles the damage dice (the bonus is not doubled); a natural 1 always misses; otherwise d20 + attack bonus ≥ AC hits; damage never goes below 0. — v1.0 (Phase 1; one damage rule, checked over 70,980 settings)
- ✓ Exact math: hit chance, average damage per round, and expected damage over 20 rounds, derived from the table, not Monte Carlo. — v1.0 (Phase 1; see the tech-debt note on the per-round third decimal)
- ✓ Line chart: the x-axis is bonus 0 to +20, with two exact curves for expected 20-round damage, one with the bonus on the attack and one with it on damage. Crossings are marked; the 95%-cap and nat-20-only bands are shaded and labeled. — v1.0 (Phase 2)
- ✓ Side-by-side tables: baseline, +N to hit and +N to damage, on one shared color scale, driven by a "Compare at +N" slider. — v1.0 (Phase 2; review warnings fixed in Phase 4 plan 04-01)
- ✓ Simulation: "Roll 20 rounds" rolls real dice next to the exact expected value ± SD. It has a per-round log, stale marking, a tally, and rolled cells marked on the outcome table. — v1.0 (Phase 3; review warnings fixed in Phase 4 plan 04-01)
- ✓ Designer explanations: live rule-then-numbers formulas, the two-roll structure, why the attack bonus plateaus and the damage bonus is linear, where the crossover sits, and "Try this" presets. Every claim is checked against the engine at every setting. — v1.0 (Phase 4; the review blocker and warnings were fixed in 04-REVIEW-FIX.md)
- ✓ Deployed to GitHub Pages at https://atomechllc.github.io/dnd-roll-tables/. The served file is identical to the committed one, the live self-test passes, and there are no console errors. — v1.0 (Phase 4; last redeployed 2026-09-28 with Phase 5)
- ✓ Accessibility: every control is keyboard operable and labeled, with an exact tab order, and misses and chart series are not color-only. check-page guards all of this. — v1.0 (Phase 4, extended in Phase 5)
- ✓ Hits-to-kill: an Enemy HP control (1 to 500, default 40) editable by amount or by ±1 average hit; exact hits-to-kill, rounds-to-kill with its median, and the chance of a kill within 20 rounds. The 20-round roll tracks HP, the kill round and each tally run's outcome, re-scored live when HP changes. — v1.0 (Phase 5; review warnings fixed in 05-REVIEW-FIX.md)

### Active

None. Next-milestone requirements are defined by `/gsd:new-milestone`.

### Out of Scope

- **Multi-dice damage (2d6, 3d4):** bigger tables and convolution math; a single die keeps the 2D table readable. Still a v2 candidate. The Phase 5 kill engine already handles per-hit distributions, which lowers the cost.
- **Advantage / disadvantage:** changes the d20 distribution. Still a sensible follow-up; it would touch every exact oracle.
- **Multiple attacks per round, class features, spells:** the page is about one attack roll's anatomy, not a full DPR calculator.
- **Build tooling or frameworks (Vite, React, Svelte):** the single `index.html` with vanilla JS deploys with no build step. This proved right through five phases.
- **Chart libraries via CDN:** the chart is inline SVG, and the CSP blocks all outside requests.
- **Player build-optimization framing:** the audience is game designers learning the math, not players picking feats.

## Context

- The project is part of a wider game-design skills collection at `C:\Projects\GameDesignSkills\DnD-CombatRollSimulator`.
- **The core insight the page teaches:** with a d20, each +1 to hit adds a flat 5% hit chance (while unclamped) times (average die + damage bonus). Each +1 to damage adds P(any hit) times 1. So +1 to hit wins only while (avg + D) > 20 × P(hit). At common settings (AC 15, d8) that is never true, and the damage bonus leads at every N. Across all 70,980 real settings there is at most one crossing.
- **Expected damage per round** (single die of size X, attack bonus A, damage bonus D, AC C): E = P(normal hit) × (avg(dX) + D) + P(crit) × (2 × avg(dX) + D), where avg(dX) = (X + 1) / 2 and P(crit) = 1/20. This is exact only while D ≥ −1; below that the 0-damage floor bites, and the page switches to the exact table value.
- **Kill math:** exact over remaining HP. The per-hit distribution is conditional on hitting, with a true 2dX crit. Rounds use binomial "damaging hits" thinning, and tenths rounding uses a BigInt tie-break. Simple division (HP ÷ average hit) always understates the hits needed, because damage past 0 is wasted.
- **Lesson from Phase 4:** copy checks must test claims against the engine, not rebuild the page's own strings. A review found live text contradicting the cards at about 11,600 settings, and the checks had passed it.
- **Known tech debt:**
  - Phase 1 review WR-01: the displayed per-round value is derived from the rounded 20-round total (tenths × 5), so its third decimal is false precision. The cards and formulas agree with each other by design.
  - The Node self-test runs close to its 200 ms budget; the budget is enforced in Chrome, where it runs in about 60 ms.
  - Whole-page redraw is about 12.5 ms median and 22–25 ms p95 in headless Chrome, mostly layout, and predates Phase 5.
  - `gsd-sdk query audit-open` misreports quick tasks whose summaries are named `{id}-SUMMARY.md`; the bundled gsd-tools audit is correct.

## Constraints

- **Hosting:** GitHub Pages static files only — no server, no build step, one index.html.
- **Tech stack:** vanilla HTML/CSS/JS, no frameworks, no CDN libraries — the user's preference; it keeps the page portable and zero-maintenance.
- **Deployment:** the public repo AtomechLLC/dnd-roll-tables. Every push to `main` redeploys the public site, so push only when publishing is intended.
- **Readability:** the 2D table stays legible at d12 and with three tables side by side on a laptop; mobile stacks. A dense layout (4/8/12/16/20/24 spacing, 32 px controls) is the current baseline.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Single index.html, vanilla JS, no build | GitHub Pages serves it directly; nothing to install or maintain | ✓ Good (v1.0: 5,400 lines, still one file, CSP blocks outside requests, works from disk) |
| Inline SVG for the line chart, no chart library | User chose no CDN deps; 2 series x 21 points is trivial to draw by hand | ✓ Good (Phase 2: exact series, crossings, bands, hover readout) |
| Model nat 20 crit (double dice) and nat 1 auto-miss | Matches 5e and produces the 5%–95% hit-chance clamp that makes the attack-bonus plateau visible | ✓ Good (true 2dX crit in stats, simulator and kill math) |
| Both exact expected values and a roll-it simulation | Exact math teaches the lesson; the simulation shows variance so designers do not over-trust averages | ✓ Good (Phase 3: exact ± SD next to a seeded, injectable-RNG roll) |
| AC as a live slider, die as selectable d4–d12 | The crossover point between hit bonus and damage bonus moves with both; users need to see it move | ✓ Good (Phase 1) |
| Audience is game designers, formulas shown | Sets the tone: explain the why, not just the number | ✓ Good (Phase 4: rule-then-numbers formulas, short designer voice) |
| Crit row in the table shows 2 × face + damage bonus with a footnote; the simulator rolls two real dice | Easiest to read in a one-column-per-face table and keeps table average = expected value; the footnote and simulator keep the real rule honest | ✓ Good (the footnote and exact counting handle D ≤ −3) |
| Classic inline `<script>` blocks, not ES modules | Blocks share globals for the self-test and the page works over file:// | ✓ Good (five blocks; check-engine runs the pure ones in a Node vm) |
| Deploy a minimal skeleton to Pages at the end of Phase 1 | Front-loads gh CLI install, branch rename, and Pages API friction while the code is small | ⚠ Revised (publishing was deferred in Phase 1, then shipped in Phase 4 over SSH through an Actions Pages workflow instead of gh + branch publishing) |
| Local git only; GitHub publish deferred (2026-09-25) | User declined the `gh auth login` step mid-Phase 1 | ✓ Resolved (2026-09-27: the user supplied git@github.com:AtomechLLC/dnd-roll-tables.git) |
| Tabletop theme: parchment/ink light, candlelit dark, blood-red heat ramp, serif prose, tabular numerals | Chosen in Phase 1 discussion; contrast kept at 4.5:1+ via a mid-ramp text flip | ✓ Good |
| Crossover marker and copy handle 0, 1, or 2 crossings | Research showed the most common settings have no crossover; asserting one would be wrong | ✓ Good (at most one real crossing; two-crossing wording exercised by synthetic tests) |
| Copy claims are verified against the engine, not by rebuilding strings | A Phase 4 review found live text contradicting cards at about 11,600 settings that the string checks had passed | ✓ Good (adopted for Phases 4-5; the K-series proofs) |
| Settings and outcome table at the top; dense layout | The user asked for both after previewing (quick tasks 260927-17o and 260927-1ty) | ✓ Good (27.6% shorter at 1366 px; overrides the earlier UI-SPEC spacing) |
| Hits-to-kill: exact kill math, HP by amount or ±1 average hit, the roll re-scores live on HP edits | User request after v1 went live; exact math keeps the project's principle | ✓ Good (Phase 5: 1,235,000 cases proven; HP changes never re-roll) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-28 after the v1.0 milestone*
