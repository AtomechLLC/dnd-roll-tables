# Phase 1: Live Roll Table, Deployed - Context

**Gathered:** 2026-09-24
**Status:** Ready for planning

<domain>
## Phase Boundary

One self-tested 5e rules engine (a single `damageFor`-style pure function plus exact table-derived stats) driving a live baseline 20 x dX outcome table and headline stat cards, in a single `index.html`, published to a public GitHub Pages URL. Controls: AC (slider + number), die (d4-d12 segmented buttons), base attack bonus, base damage bonus. Also the `?test` self-test panel, `.nojekyll`, README, repo creation, branch rename to `main`, and Pages enablement.

Not in this phase: the N slider, side-by-side tables, SVG sweep chart (Phase 2), the roll-20-rounds simulation (Phase 3), designer copy, formulas with live substitution, and the accessibility pass (Phase 4). Phase 1 should leave room for those (full-width layout, `render()` structured so more renderers can be added) but not build them.

Requirements covered: RULES-01..08, CTRL-01, CTRL-02, CTRL-03, CTRL-05, TABLE-01..06, STAT-01..03, DEPLOY-01..03.

</domain>

<decisions>
## Implementation Decisions

### Page layout
- **D-01:** Controls live in a horizontal strip across the top of the page. Stat cards sit in a row directly beneath the controls. The outcome table takes the full width below that. Not sticky.
- **D-02:** The full viewport width stays available for content below the controls. Phase 2 will place three d12 tables side by side at ~1366 px, so nothing in Phase 1 may reserve a permanent side column.

### Default state on first load
- **D-03:** Initial state is AC 15, d8, attack bonus +5, damage bonus +0. This matches the headline reference values (55% hit chance, 54.0 expected over 20 rounds), so the self-test numbers are visible on load.
- **D-04:** `init()` writes the default state into the controls (not the other way round), so markup defaults can never disagree with state.

### Visual style: tabletop-flavored
- **D-05:** Parchment-and-ink theme. Light base is a warm parchment tone with dark ink text and rules; headings and copy in a system serif stack (Georgia / Palatino / "Book Antiqua" / serif). No external fonts (DEPLOY-01 forbids outside requests), so system stacks only.
- **D-06:** A "candlelit" dark variant follows `prefers-color-scheme: dark`: dark wood / slate base with pale ink text. Implement as CSS custom-property tokens on `:root`, redefined inside the dark media query. The heat ramp is re-tuned for the dark base (not just inverted).
- **D-07:** Every number in the table, stat cards, and control outputs uses a tabular-figure sans or monospace stack (`font-variant-numeric: tabular-nums`) so 20 x 12 cells align. Serif is for prose and headings only.
- **D-08:** Damage heatmap is a blood-red sequential ramp: pale parchment at the lowest hit damage to deep crimson at the maximum. Use `color-mix()` in `oklch` from a per-cell `--t` (0 to 1) so the ramp is perceptually even. Cell text color flips (dark on light, light on dark) for contrast.
- **D-09:** Miss cells show `0` (TABLE-01) in a flat, muted grey-parchment style that is outside the red ramp, so they differ in kind from low-damage hits, not just in shade. Miss vs hit must also be distinguishable without color (the `0` text plus a muted style satisfies this for now; Phase 4 does the full accessibility pass).
- **D-10:** The nat 1 row is labeled "auto-miss" and the nat 20 row is labeled "crit" with the 2 x face + D convention and its footnote, as already fixed in PROJECT.md. Theming may style these rows (e.g. an ink rule or accent) but the labels are those words.

### Repository and deployment
- **D-11:** Public GitHub repo named `DnD-CombatRollSimulator` (matches the local folder). Default branch `main` (rename from `master` before first push). `.nojekyll` at root. README describes the page and links the Pages URL.
- **D-12:** Pages publishes from `main` at `/` via the REST API (`gh api`). Root publishing means `.planning/` is served publicly; this is accepted (nothing sensitive is in it).
- **D-13:** `gh` CLI is not installed. The plan installs it with `winget install --id GitHub.cli --source winget`, then **stops at a human checkpoint** for the user to run `gh auth login` in a new terminal (browser auth is the user's action, never the executor's). Only after auth does the plan create the repo, push, and enable Pages. Derive the GitHub username from `gh api user` after auth; do not guess it.

### Carried forward (already locked in PROJECT.md / REQUIREMENTS.md)
- **D-14:** Classic inline `<script>` blocks, **not** `<script type="module">`. PROJECT.md Key Decisions and DEPLOY-01 settle this (blocks share globals for the self-test and the page works over `file://`). CLAUDE.md's stack table recommends a module script; that recommendation is superseded. Planner and executor follow PROJECT.md.
- **D-15:** One pure function resolves damage for (d20 result, die face, AC, attack bonus, damage bonus). The table, stats, and (later) chart and simulator all call it (RULES-05). Exact stats are derived by enumerating the table and cross-checked against the closed form (RULES-07).
- **D-16:** Controls per CTRL-01..03: AC range slider paired with a number input (10 to 30), die as a segmented button group (d4/d6/d8/d10/d12), attack and damage bonus as number steppers (-5 to +20). All updates on the `input` event. One numeric parser with clamp and fallback feeds a single state object; renders coalesce with `requestAnimationFrame` (CTRL-05).
- **D-17:** Self-test runs on every load and logs to the console; a visible pass/fail panel appears when the URL contains `?test` (RULES-08). Reference assertions are listed in REQUIREMENTS.md RULES-08 and PITFALLS.md "Reference Values".
- **D-18:** Real `<table>` markup with `<th scope="row">` / `<th scope="col">`, `table-layout: fixed`, compact cells (about 22-28 px wide, 11-12 px tabular numerals) so d12 stays legible.

### Claude's Discretion
- Exact color token values for parchment, ink, candlelit dark, and the red ramp endpoints, as long as contrast passes for cell text at both ends of the ramp in both themes.
- Whether the heat ramp domain is [1, max] or [0, max] (misses are styled separately either way).
- Stat card order and exact wording, provided STAT-01..03 content is all present and STAT-02 rounding consistency holds.
- How the "hits on N+" threshold rule is drawn (thick row border vs a labeled gutter marker), as long as it moves without layout shift.
- README length and structure.
- Whether to use a `<template>` or an `el()` helper for repeated markup.
- Cell dimensions and the stacking breakpoint, tuned by testing d12 at ~1366 px.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and rules
- `.planning/PROJECT.md` — Core value, constraints, Key Decisions table (crit-row convention, classic scripts, skeleton deploy in Phase 1), and the expected-damage formula in "Context".
- `.planning/REQUIREMENTS.md` — RULES-01..08, CTRL-01..03, CTRL-05, TABLE-01..06, STAT-01..03, DEPLOY-01..03 are this phase's contract, including the RULES-08 reference assertion list.
- `.planning/ROADMAP.md` §"Phase 1: Live Roll Table, Deployed" — Goal and the five success criteria.

### Research (implementation guidance)
- `.planning/research/ARCHITECTURE.md` — Patterns 1-3 (single `damageFor` function, single state + rAF-coalesced render, derive-once `computeView`), "Recommended Project Structure", "Data Flow", "Verifying the Math Core", Anti-Patterns 1-2 and 8.
- `.planning/research/PITFALLS.md` — Pitfalls 1-6 (>= vs >, nat-20/nat-1 clamp, crit bonus not doubled, crit row convention, string inputs, floating-point display), "Integration Gotchas (GitHub Pages / git / gh)", "UX Pitfalls" (cell sizing budget), and "Reference Values (self-check assertions)".
- `.planning/research/FEATURES.md` §"UX Conventions" → "2D outcome table" and "Live controls" — threshold rule, legend, miss styling, sequential ramp guidance.
- `.planning/research/STACK.md` — Environment facts (gh not installed, branch is `master`, winget available), Pages REST API commands, CSS features (container queries, `color-mix()` in oklch, `<output>`).

### Repo instructions
- `CLAUDE.md` — Same stack content as STACK.md plus the GSD workflow rule. Note D-14: its "inline `<script type="module">`" recommendation is overridden by PROJECT.md / DEPLOY-01 (classic scripts).

</canonical_refs>

<code_context>
## Existing Code Insights

Greenfield: the repo contains only `CLAUDE.md` and `.planning/`. No source files exist yet.

### Reusable Assets
- None in code. The reference values and closed-form formula in PITFALLS.md and PROJECT.md are ready to paste into the self-test.

### Established Patterns
- None yet. This phase establishes them: single `index.html`, inline `<style>` with `:root` tokens and a dark media query, classic inline `<script>` blocks in the order rules engine → self-test → renderers → controls binder → `init()`.
- Every later phase edits the same `index.html`, so keep the script blocks clearly sectioned with comments and give `render()` one call per renderer so Phase 2/3/4 can add theirs.

### Integration Points
- Git: local repo on `master` with no remote; 5 planning commits. Rename to `main` and add `origin` via `gh repo create --source=. --push`.
- GitHub Pages: enable with `gh api -X POST repos/{owner}/{repo}/pages -f "source[branch]=main" -f "source[path]=/"` (PUT if 409). Verify with `gh api repos/{owner}/{repo}/pages` and an HTTP 200 on the public URL (allow up to 10 minutes).
- Human checkpoint: `gh auth login` must be run by the user in a new terminal after the winget install (D-13).

</code_context>

<specifics>
## Specific Ideas

- "Tabletop-flavored": parchment and ink in light mode, a "candlelit" dark variant, blood-red heat ramp, serif headings. The theme must never compromise heatmap legibility or the neutral miss style.
- First impression on load should be a real-feeling character (AC 15, d8, +5) with a mostly-filled table, not a wall of zeros.
- Top-strip controls so the page reads top to bottom: set the situation, read the headline numbers, study the table.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (A "show me a crossover" preset from research is already covered by COPY-05 in Phase 4.)

</deferred>

---

*Phase: 01-live-roll-table-deployed*
*Context gathered: 2026-09-24*
