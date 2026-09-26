---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: ready_to_plan
stopped_at: Phase 03 complete (3/3) — ready to discuss Phase 4
last_updated: 2026-09-26T18:42:08.235Z
last_activity: 2026-09-26
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 11
  completed_plans: 11
  percent: 75
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-24)

**Core value:** A designer can see, in one glance at a live table and a curve, why attack bonuses saturate (hit chance caps at 95%) while damage bonuses scale linearly, and why the crossover depends on AC and the damage die.
**Current focus:** Phase 4 — designer explanation & final ship

## Current Position

Phase: 4
Plan: Not started
Status: Ready to plan
Last activity: 2026-09-26

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 11
- Average duration: -
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 5 | - | - |
| 02 | 3 | - | - |
| 03 | 3 | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 02 P01 | 8 min | 3 tasks | 3 files |
| Phase 02 P02 | 10 min | 3 tasks | 2 files |
| Phase 02 P03 | 39 min | 3 tasks | 3 files |
| Phase 03 P01 | 13min | 3 tasks | 3 files |
| Phase 03 P02 | 9min | 2 tasks | 2 files |
| Phase 03 P03 | 14min | 3 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 4 coarse phases. Research's Phase 2 (tables + chart + simulation, 17 requirements) was split into Bonus Comparison (Phase 2) and Simulation (Phase 3) so each is a separately verifiable vertical slice.
- [Roadmap]: A minimal skeleton deploys to GitHub Pages in Phase 1 (DEPLOY-01..03). Phase 4 re-verifies the final URL.
- [Roadmap]: CMP-04 (diff highlighting) sits with the other side-by-side table work in Phase 2, not in the copy/polish phase. The crit-row convention (2 x face + D) is already settled in PROJECT.md, so nothing blocks it.
- [Roadmap]: STAT-03 (marginal +1 readout) is in Phase 1 with the other stat cards because it only needs the Phase 1 math core.
- [Phase 02]: 02-01: shared heatMax is the true max cell across the three compact tables; 2X+D+N is only the oracle
- [Phase 02]: 02-01: compact-table deltas are displayed variant tenths minus displayed baseline tenths
- [Phase 02]: 02-01: page computeView = statsView + compareView; grids and check-engine call VM.statsView
- [Phase 02]: 02-01: check-page --expect matches visible text only (self-test panel stripped, entities decoded)
- [Phase 02]: chartView memoizes its N-independent block per (ac, atk, die, dmg) so N slider drags reuse one sweep
- [Phase 02]: Chart readout gap is the difference of displayed tenths; caption order compares exact integer numerators
- [Phase 02]: Direct labels de-collide to 22 units apart (to hit on top on a tie) and shift together into the plot
- [Phase 02]: 02-03: Crossing labels carry a below/above class; each chart tier nudges them by the growth in text size and ring radius, so phone-tier labels never overlap their ring (UI-SPEC attributes unchanged)
- [Phase 02]: 02-03: Self-test shares one IIFE-level sweep memo across the chart and cross sections; Node self-test 178-197 ms against the 200 ms budget
- [Phase 02]: 02-03: ROADMAP Phase 2 SC1/SC3 reworded to amended CMP-04 (plain values) and zero-or-one crossing in N = 0..20 (70,980 settings checked)
- [Phase 03]: Spread line is lopsided when E - SD < 0 OR only a nat 20 hits (honest band wording; guarded by check-engine (p))
- [Phase 03]: Randomness is injected: Sim.simulate requires rng; Math.random appears once, in the Roll click handler
- [Phase 03]: WR-01 closed: first render guarded; Roll button ships disabled and is enabled as the last step of a successful render
- [Phase 03]: Rolled-at note and log caption reserve two lines (note also in the 32rem side-by-side column) so stale never moves the pair or the log rows
- [Phase 03]: Stale is pure CSS off one #sim.is-stale toggle; dimming covers every log th/td, caption/note/Now: stay ink as word cues
- [Phase 03]: 03-03: Label badges in an unbroken marked run from row 1 drop to the bottom edge (data-down) so row 1 and row 2 badges never share an edge — UI-SPEC first-row exception collided with row 2's top badge in most default runs
- [Phase 03]: 03-03: Only the attack controls (AC, die, attack bonus, damage bonus) stale a run; the compare +N slider keeps the run, marks, and tally (ROADMAP SC3 'any control' interpreted per CONTEXT discretion) — +N does not change the attack, so marks still point at the right cells

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 1 deploy prerequisite: gh CLI is not installed on this machine. It must be installed and authenticated before DEPLOY-02/03.
- The local git repo exists on branch `master` with no remote. Rename it to `main` before the first push, and the GitHub repo must be public.
- REQUIREMENTS.md header said 45 v1 requirements, but 47 are listed (RULES 8, CTRL 5, TABLE 6, STAT 3, CHART 5, CMP 5, SIM 6, COPY 5, DEPLOY 4). The coverage count is corrected to 47.

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-09-26T18:32:07.274Z
Stopped at: Completed 03-03-PLAN.md
Resume file: None
