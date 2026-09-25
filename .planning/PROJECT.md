# D&D Combat Roll Simulator

## What This Is

A single-page, static GitHub Pages site that demonstrates how D&D 5e attack resolution works as a roll table: a d20 to-hit roll against Armor Class, followed by a dX damage roll. It renders the full 2D outcome table (miss = 0 damage), then shows how expected damage over 20 rounds shifts when a bonus of +1 through +20 is added to the attack roll versus the same bonus added to the damage roll. Built for game designers who want to understand the math, not just the result.

## Core Value

A designer can see, in one glance at a live table and a curve, why attack bonuses saturate (hit chance caps at 95%) while damage bonuses scale linearly, and why the crossover depends on AC and the damage die.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Live controls: target AC (slider/input, roughly 10 to 25), damage die (d4, d6, d8, d10, d12), attack bonus, damage bonus
- [ ] 2D outcome table: rows = d20 result (1 to 20), columns = dX result (1 to X); cell shows damage dealt, 0 on a miss
- [ ] Rules modeled: natural 20 always hits and doubles damage dice (bonus not doubled); natural 1 always misses; otherwise d20 + attack bonus >= AC hits
- [ ] Exact math: hit chance, average damage per round, expected damage over 20 rounds, derived from the table (not Monte Carlo)
- [ ] Simulation: a "roll 20 rounds" button that actually rolls the dice and shows the realized total alongside the expected value
- [ ] Line chart: x-axis bonus 0 to +20, two curves for expected 20-round damage when the bonus is on the attack roll vs on the damage roll, at the current AC and die
- [ ] Side-by-side 2D tables: baseline (+0), with +N to hit, with +N to damage, so the shift is visible cell by cell
- [ ] Explanatory text for game designers: formulas shown, why attack bonus plateaus, why damage bonus is linear, where the crossover sits
- [ ] Deployed to GitHub Pages: repo created, site pushed, Pages enabled, public URL works

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
| Single index.html, vanilla JS, no build | GitHub Pages serves it directly; nothing to install or maintain | — Pending |
| Inline SVG for the line chart, no chart library | User chose no CDN deps; 2 series x 21 points is trivial to draw by hand | — Pending |
| Model nat 20 crit (double dice) and nat 1 auto-miss | Matches 5e and produces the 5%–95% hit-chance clamp that makes the attack-bonus plateau visible | — Pending |
| Both exact expected values and a roll-it simulation | Exact math teaches the lesson; the simulation shows variance so designers do not over-trust averages | — Pending |
| AC as a live slider, die as selectable d4–d12 | The crossover point between hit bonus and damage bonus moves with both; users need to see it move | — Pending |
| Audience is game designers, formulas shown | Sets the tone: explain the why, not just the number | — Pending |
| Crit row in the table shows 2 × face + damage bonus with a footnote; the simulator rolls two real dice | Easiest to read in a one-column-per-face table and keeps table average = expected value; the footnote and simulator keep the real rule honest | — Pending |
| Classic inline `<script>` blocks, not ES modules | Blocks share globals for the self-test and the page works over file:// | — Pending |
| Deploy a minimal skeleton to Pages at the end of Phase 1 | Front-loads gh CLI install, branch rename, and Pages API friction while the code is small | — Pending |
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
*Last updated: 2026-09-24 after research and requirements*
