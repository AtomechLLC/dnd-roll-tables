# Milestones

## v1.0 MVP (Shipped: 2026-09-28)

**Delivered:** a public, single-file explorable explanation of one D&D 5e attack roll, live at https://atomechllc.github.io/dnd-roll-tables/. It shows the full d20 × damage-die outcome table, the +N to hit versus +N to damage comparison with an exact sweep chart, a real 20-round simulation, live designer-facing explanations, and hits-to-kill against an enemy with editable HP.

**Phases completed:** 5 phases, 20 plans, 23 tasks (plus 2 quick tasks)
**Timeline:** 2026-09-24 → 2026-09-28 (4 days, 174 commits, c79f6c1 → a945a23)
**Size:** index.html is 5,413 lines. The dev-only checks are tools/check-engine.mjs (1,944 lines) and tools/check-page.mjs (544 lines). There is no build step and no dependencies.
**Requirements:** 53 of 53 v1 requirements complete: 47 original plus KILL-01..06 added for Phase 5.

**Key accomplishments:**

- **Phase 1, exact engine:** an exact, self-tested 5e attack engine drives a live 20 × X outcome table and stat cards. The engine uses one damage rule, a natural 1 always misses, a natural 20 is a true 2dX crit, and damage floors at 0. Every number is checked across all 70,980 control settings.
- **Phase 2, the core lesson:** a "Compare at +N" slider drives three shared-scale compact tables and an exact SVG sweep chart. The chart marks crossings honestly and shades the 95% cap and nat-20-only bands.
- **Phase 3, the simulation:** a seeded, injectable-RNG "Roll 20 rounds" simulation sits next to the exact expected value ± SD. It has a per-round log, comparison-based staleness, a tally, and rolled-cell marks on the outcome table.
- **Phase 4, explanations and publishing:** live designer-facing explanations include rule-then-numbers formulas, chart text built from the same crossings and bands, and "Try this" presets. A follow-up review fix verified every claim against the engine at every setting. Accessibility guards in check-page complete the phase, and the page was published to GitHub Pages.
- **Phase 5, hits-to-kill:** an Enemy HP control (default 40) takes an exact amount or ±1 average hit. Exact hits-to-kill, rounds-to-kill with a median, and the chance of a kill within 20 rounds are all proven over 1,235,000 attack × HP cases. The 20-round roll tracks HP and the kill, and re-scores live when HP changes.
- **User-requested layout pass (quick tasks 260927-17o and 260927-1ty):** the settings and outcome table moved to the top, and a space-density pass made the page 27.6% shorter at 1366 px.

**Known deferred items at close:** 0. The open-artifact audit is clear when run through the bundled gsd-tools audit. The `gsd-sdk` audit-open misreports the two quick tasks, because it only recognizes a bare `SUMMARY.md` file name.
**Audit:** no `/gsd:audit-milestone` was run before closing; the phase verifier was disabled in config. Every phase closed with a code review, and every warning from those reviews was fixed.
**Known tech debt:** Phase 1 review WR-01 is still open. The per-round value is derived from the rounded 20-round total, so its third decimal is false precision. Details are under Context in PROJECT.md.

---
