# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-09-28
**Phases:** 5 | **Plans:** 20 (plus 2 quick tasks) | **Sessions:** several (not counted exactly)

### What Was Built
- An exact, self-tested 5e attack engine behind a live d20 × damage-die outcome table and stat cards, all in one static `index.html`.
- The core lesson: +N to hit vs +N to damage in three shared-scale tables and an exact SVG sweep chart with honest crossings and plateau bands.
- A seeded 20-round simulation next to the exact expected value ± SD, with a log, staleness, a tally and table marks.
- Live designer-facing explanations, "Try this" presets, accessibility guards, and a public GitHub Pages deploy.
- Hits-to-kill: enemy HP by amount or ±1 average hit, exact kill numbers, and kill tracking in the roll, re-scored live on HP edits.

### What Worked
- **Exhaustive oracles over the full control domain.** check-engine sweeps all 70,980 attack settings, and 1,235,000 attack × HP cases for kills. This caught real bugs that examples miss: float ties at x.x5, a median of exactly 1/2, and zero-step ±1 hit buttons.
- **Failing checks before each build.** Every plan's first commit was a failing check, so every feature arrived with a guard.
- **Deliberately broken copies.** Every new guard was shown to fail on a broken page before it counted.
- **Review then fix at each phase close.** The code review found issues after every phase, and the fix runs closed all of them.
- **Research that computed real numbers before planning.** Reference values in the plans came from running the page's own engine blocks, not hand math.
- **Minimal-interruption batching.** Two batched question rounds per discussion kept the user's time low without losing decisions.

### What Was Inefficient
- **Copy checks that rebuilt the page's own strings.** They passed text that contradicted the cards at about 11,600 settings (Phase 4 blocker CR-01). Claims had to be re-verified against the engine afterwards.
- **The in-page self-test ran at its 200 ms Node budget for most of the milestone.** Every plan had to measure timings and justify additions.
- **Publishing was deferred in Phase 1 and resumed in Phase 4 on a different path.** The planned gh + branch publishing gave way to SSH plus an Actions workflow, and the remote gained a commit between the emptiness check and the push. Checking remote state right before pushing avoided a force-push.
- **UI-SPEC wording sometimes had to be corrected during research.** Examples: "the last hit usually overshoots" is false at about 3% of settings, and "About 2 runs in 3" is false for nat-20-only settings. Probing claims against the engine before the spec is approved would save a revision.
- **check-engine grew to about 2 minutes.** That's fine for a dev-only check, but slow for tight loops.

### Patterns Established
- Every displayed number and claim is computed in the view-model and verified in `tools/check-engine.mjs` against an independent oracle, never by rebuilding the display string.
- Exact math everywhere a number is shown: integer numerators over die², BigInt tie-breaks near rounding boundaries, no Monte Carlo for displayed values.
- One control path (`CONTROL_SPEC` → `parseControl` → `setState`). Preset and step buttons never carry `data-key`.
- Guarded renders with `failPage()`, plus `check-page --fault render/later` modes.
- A11y guards (labels, visible labels, exact tab order, non-color cues) live in check-page and are updated with every new control.
- Commit locally and push only when publishing is intended, because every push to `main` redeploys the public site.

### Key Lessons
1. When a check compares text with text, make sure one side comes from an independent source, such as the engine or an oracle. Otherwise the check only proves the code agrees with itself.
2. Probe every sentence that states a frequency or a universal ("usually", "always", "about 2 in 3") across the whole domain before it goes into a spec.
3. Keep the in-page self-test to constant-time pins, and put exhaustive work in the dev tool from the start. That avoids budget pressure later.
4. Re-check the remote immediately before a first push. It can change between planning and pushing.
5. Headless Chrome won't render below about 497 px. Phone-width bugs only show up in iframe-harness screenshots, so take and inspect them in every UI plan.

### Cost Observations
- **Model mix:** planners, researchers, executors, pattern mappers and code reviewers ran on Opus-class models. UI and plan checkers ran on Sonnet. The orchestrator ran on Fable 5.1 early and on Opus 5.5 later. No Haiku.
- **Sessions:** several. Exact token and cost figures were not tracked in the planning files.
- **Notable:** each execute wave cost roughly 150k–300k subagent tokens. Research and review agents with exhaustive checks were among the most expensive, and also found the most real issues.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | several | 5 | Copy verified against the engine, not rebuilt strings; exhaustive domain oracles; review then fix at each phase close |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 261 in-page self-test checks; check-engine checks a..z plus K1–K9 over 70,980 settings (1,235,000 attack × HP cases); check-page guards (1)–(14) plus fault modes | full control domain for engine and copy claims | all of it: no dependencies, no build step |

### Top Lessons (Verified Across Milestones)

1. Verify claims against an independent oracle, not against the code that produced them. (v1.0; re-check in v1.1)
2. Exhaustive checks over the small, finite control domain beat examples. (v1.0; re-check in v1.1)
