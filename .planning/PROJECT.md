# D&D Combat Roll Simulator

## What This Is

A single-page, static GitHub Pages site that demonstrates how D&D 5e attack resolution works as a roll table: a d20 to-hit roll against Armor Class, followed by a dX damage roll. It renders the full 2D outcome table (miss = 0 damage), then shows how expected damage over 20 rounds shifts when a bonus of +1 through +20 is added to the attack roll versus the same bonus added to the damage roll. Built for game designers who want to understand the math, not just the result.

## Core Value

A designer can see, in one glance at a live table and a curve, why attack bonuses saturate (hit chance caps at 95%) while damage bonuses scale linearly, and why the crossover depends on AC and the damage die.

## Requirements

### Validated

- [x] Live controls: target AC (slider + number, 10 to 30), damage die (d4 to d12 buttons), attack bonus, damage bonus (-5 to +20) — Validated in Phase 1: Live Roll Table, Deployed
- [x] 2D outcome table: rows = d20 result (1 to 20), columns = dX result (1 to X); cell shows damage dealt, 0 on a miss — Validated in Phase 1
- [x] Rules modeled: natural 20 always hits and doubles damage dice (bonus not doubled); natural 1 always misses; otherwise d20 + attack bonus >= AC hits; damage never below 0 — Validated in Phase 1 (65-check self-test, 70,980-combination sweep)
- [x] Exact math: hit chance, average damage per round, expected damage over 20 rounds, derived from the table (not Monte Carlo) — Validated in Phase 1 (code review WR-01: the displayed per-round figure is derived from the rounded 20-round total, so its third decimal can be off; fix pending)
- [x] Line chart: x-axis bonus 0 to +20, two curves for expected 20-round damage when the bonus is on the attack roll vs on the damage roll, at the current AC and die. Crossings are marked, and the flat 95%-cap and nat-20-only stretches are shaded and labeled. Validated in Phase 2: Bonus Comparison.
- [x] Side-by-side 2D tables: baseline (+0), with +N to hit, with +N to damage, on one shared color scale, driven by a "Compare at +N" slider. Validated in Phase 2 (code review 02-REVIEW.md: 3 warnings open, including a first-render crash path that bypasses the engine-error banner).
- [x] Simulation: a "roll 20 rounds" button that actually rolls the dice and shows the realized total alongside the exact expected value and its standard deviation, with a per-round log, stale marking, a tally of recent runs, and rolled cells marked on the outcome table. Validated in Phase 3: Roll-20-Rounds Simulation (code review 03-REVIEW.md: 4 warnings open).
- [x] Explanatory text for game designers: live formulas, the two-roll structure, why the attack bonus plateaus and the damage bonus is linear, where the crossover sits, and one-click "Try this" presets. Validated in Phase 4: Designer Explanation & Final Ship (code review 04-REVIEW.md: 1 blocker open. At the 95% cap the chart text still says +1 to hit is worth the full hit value, contradicting the card. Also 4 warnings).
- [x] Deployed to GitHub Pages: live at https://atomechllc.github.io/dnd-roll-tables/ (repo AtomechLLC/dnd-roll-tables, deployed by a GitHub Actions Pages workflow on push to main). Verified in Phase 4 on 2026-09-27: HTTP 200, served file identical to local, self-test 251/251, no console errors.

### Active

None. All v1 requirements are validated; the open review findings are listed in the phase REVIEW.md files.

### Out of Scope

- Multi-dice damage (2d6, 3d4) — bigger tables and convolution math; single die keeps the 2D table readable. Candidate for v2.
- Advantage / disadvantage — changes the d20 distribution; worth a follow-up but muddies the core lesson.
- Multiple attacks per round, class features, spells — this is about one attack roll's anatomy, not a full DPR calculator.
- Build tooling or frameworks (Vite, React, Svelte) — user chose a single index.html with vanilla JS so Pages serves it with no build step.
- Chart libraries via CDN — user chose plain vanilla JS; the line chart is drawn as inline SVG.
- Player build-optimization framing — audience is game designers learning the math, not players picking feats.

## Context

- Greenfield project in `C:\Projects\GameDesignSkills\DnD-CombatRollSimulator`, part of a wider game-design skills collection.
- GitHub Pages hosting drives the constraint of static files only. A single `index.html` with inline CSS and JS is the whole deliverable, so no package.json, no bundler.
- The line chart is hand-drawn SVG since no chart library is used. Two series, 21 points each, is small enough for this.
- D&D 5e rules of note: attack hits if d20 + bonus >= AC; natural 20 auto-hits and is a critical hit (roll damage dice twice, add modifiers once); natural 1 auto-misses. Hit chance is therefore clamped between 5% and 95% regardless of bonus.
- The core insight the page should deliver: with a d20, each +1 to hit adds a flat 5% hit chance (while unclamped) times (average die + damage bonus), whereas each +1 to damage adds P(any hit) times 1. So +1 to hit wins only while (avg + D) > 20 × P(hit), which at common settings (AC 15, d8) is never true: damage bonus leads at every N. A crossover appears only at high AC or with a big die (e.g. AC 25, d12). The page must treat zero, one, or two crossings as normal states.
- Research (2026-09-24) lives in `.planning/research/`. Environment notes from it: gh CLI is not installed on this machine, the repo branch is `master` and must be renamed to `main`, GitHub Pages has no gh subcommand and is enabled via the REST API, and the repo must be public.
- Expected damage per round formula (single die of size X, attack bonus A, damage bonus D, AC C):
  - P(crit) = 1/20
  - P(normal hit) = (count of d20 values r in 2..19 with r + A >= C) / 20
  - E = P(normal hit) * (avg(dX) + D) + P(crit) * (2 * avg(dX) + D), where avg(dX) = (X + 1) / 2
  - 20-round expected total = 20 * E

## Constraints

- **Hosting**: GitHub Pages static files only — no server, no build step, one index.html.
- **Tech stack**: Vanilla HTML/CSS/JS, no frameworks, no CDN libraries — user preference; keeps the page portable and zero-maintenance.
- **Deployment**: Repo creation and Pages enablement are part of scope — user wants a working public URL at the end, not just files.
- **Readability**: The 2D table must stay legible at d12 (20 x 12 cells) and side-by-side (three tables) on a laptop screen; mobile can stack.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Single index.html, vanilla JS, no build | GitHub Pages serves it directly; nothing to install or maintain | ✓ Good (Phase 1: one file, CSP blocks outside requests, works from disk) |
| Inline SVG for the line chart, no chart library | User chose no CDN deps; 2 series x 21 points is trivial to draw by hand | — Pending |
| Model nat 20 crit (double dice) and nat 1 auto-miss | Matches 5e and produces the 5%–95% hit-chance clamp that makes the attack-bonus plateau visible | ✓ Good (Phase 1: stats use a true 2dX crit; table crit row shows 2 × face + D) |
| Both exact expected values and a roll-it simulation | Exact math teaches the lesson; the simulation shows variance so designers do not over-trust averages | — Pending |
| AC as a live slider, die as selectable d4–d12 | The crossover point between hit bonus and damage bonus moves with both; users need to see it move | ✓ Good (Phase 1) |
| Audience is game designers, formulas shown | Sets the tone: explain the why, not just the number | — Pending |
| Crit row in the table shows 2 × face + damage bonus with a footnote; the simulator rolls two real dice | Easiest to read in a one-column-per-face table and keeps table average = expected value; the footnote and simulator keep the real rule honest | — Pending |
| Classic inline `<script>` blocks, not ES modules | Blocks share globals for the self-test and the page works over file:// | ✓ Good (Phase 1: four blocks, engine → self-test → view-model → app) |
| Deploy a minimal skeleton to Pages at the end of Phase 1 | Front-loads gh CLI install, branch rename, and Pages API friction while the code is small | ⚠ Revised (publish deferred in Phase 1; shipped in Phase 4 to AtomechLLC/dnd-roll-tables over SSH, deployed by an Actions Pages workflow instead of gh + branch publishing) |
| Local git only for now; GitHub publish deferred (2026-09-25) | User declined the `gh auth login` step mid-Phase 1; nothing about the page depends on being published | — Pending (re-run plan 01-03 task 2 when ready to deploy) |
| Tabletop theme: parchment/ink light, candlelit dark, blood-red heat ramp, serif prose, tabular numerals | Chosen in Phase 1 discussion; contrast kept at 4.5:1+ via a mid-ramp text flip | ✓ Good (Phase 1) |
| Crossover marker and copy handle 0, 1, or 2 crossings | Research showed the most common settings have no crossover; asserting one would be wrong | — Pending |

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
*Last updated: 2026-09-27 after Phase 4 completion (live at https://atomechllc.github.io/dnd-roll-tables/)*
