# Project Research Summary

**Project:** D&D Combat Roll Simulator
**Domain:** Single-file, zero-build, static GitHub Pages visualization of D&D 5e attack-roll probability, for game designers
**Researched:** 2026-09-24
**Confidence:** HIGH

## Executive Summary

This is a small "explorable explanation": one static `index.html` that renders a live 20xX roll table (d20 to-hit vs a single damage die), derives exact probability/EV math from that table, sweeps a +0..+20 bonus on attack vs on damage into a two-line SVG chart, and backs it with a "roll 20 rounds" simulation for variance. All four research tracks converge on the same shape: one pure math core (`outcome()`/`damageFor()`) that the table, the exact stats, the chart sweep, and the simulator all call into, with a single state object driving a single `computeView()` that dumb renderers turn into DOM. No frameworks, no bundlers, no CDN dependencies -- plain HTML5, CSS Grid/Container Queries, inline SVG, and vanilla ES on top of native form controls. This is not a novel engineering problem; it is a well-documented pattern (Bret Victor-style reactive documents) applied to a small, exactly-enumerable rules system (max 240 cells per table, 21-point sweeps).

The research is unusually convergent and cross-validated: Features, Architecture, and Pitfalls each independently derived (and numerically verified in Node) the same critical fact -- **at common settings (e.g., AC 15, d8, no modifiers) the attack-bonus and damage-bonus curves never cross; damage bonus leads at every N from 1 to 20.** A crossover only appears at high AC / low base attack bonus / large damage die (e.g., AC 25, d12). This means the crossover-marker feature must handle zero, one, or two crossings as first-class states, not assume exactly one. The other major open decision flagged across two research tracks is how to render the crit row in a table that only has one damage-die column: Architecture leans toward `2 x face + D` (simpler, same mean, wrong distribution shape), Features leans toward `face + avg(die) + D` (also mean-preserving, less commonly recognized). Both keep "table average = EV" intact; this is a requirements-level decision, not an architecture one.

The main project risk is not the math (it is exactly enumerable and cheap: under 1ms per full render) -- it is (a) correctness bugs in the rules engine that quietly disagree between the table, the formula, and the simulator (nat-1/nat-20 clamp, crit-doubling-the-bonus, off-by-one on `>=`), and (b) the explanatory copy asserting a crossover or a plateau shape that does not match the actual numbers for the current control settings. Both are mitigated the same way: one `outcome()`/`damageFor()` function that everything calls, an in-page self-test that runs known reference values on load, and copy that is generated from live computed values (via `data-bind` slots) rather than hard-coded prose. Deployment is well-understood but has real local-environment friction: `gh` CLI is not installed on this machine, the local default branch is `master` (Pages needs it to match whichever branch is pushed), and Pages must be enabled via `gh api` since no `gh pages` command exists.

## Key Findings

### Recommended Stack

One `index.html` -- inline `<style>`, inline classic `<script>` blocks (not `type="module"`, so blocks can share top-level `const` bindings and the whole thing still works over `file://`). Real `<table>` markup for the roll tables (not CSS grid), CSS Grid + Container Queries for page layout so three tables sit side-by-side on a laptop and stack on mobile with no media queries, and `color-mix()`/`oklch()` custom properties for the damage heatmap. The chart is hand-built inline SVG (`createElementNS`, fixed `viewBox`, `vector-effect="non-scaling-stroke"`) -- never a chart library, which is explicitly out of scope. Native `<input type="range">` + `<output>` for AC, a radio-button segmented group for the die selector, `<input type="number">` steppers for bonuses. `Math.random()` behind an injectable `rollDie(sides, rng)` seam for the simulation, so a seeded `mulberry32` can drive deterministic self-tests.

**Core technologies:**
- HTML5 single file -- GitHub Pages serves `index.html` at the root with zero build step or asset-path risk
- Inline classic `<script>` blocks (not ES modules) -- lets math/sim/selftest/app share globals and still run via double-click `file://`
- CSS Grid + Container Queries -- responsive 3-table layout without JS or media queries
- Inline SVG (hand-rolled `linearScale`/`niceTicks`) -- 2 series x 21 points is trivial; a chart library is explicitly excluded by PROJECT.md
- `Math.random()` + injectable RNG seam -- simple, unbiased at this scale, and testable with a seeded PRNG

### Expected Features

The competitive landscape (AnyDice, 5e DPR calculators, GWM/SS breakpoint tools, generic probability teaching pages) covers exact math, DPR headline stats, and formula references, but **no surveyed tool shows the full 2D outcome table, sweeps both bonus types 0..+20 with marked crossover/clamp regions, or shows the marginal "+1 is worth X" readout.** That combination is this project's differentiator.

**Must have (table stakes):**
- Correct 5e rules (nat 1 auto-miss, nat 20 auto-hit + crit with dice doubled but bonus added once)
- Live AC/die/attack-bonus/damage-bonus/N controls, recomputing on `input` not `change`
- Headline stats: hit threshold, hit%, crit%, avg damage, EV/round, EV/20 rounds
- 2D outcome table with sequential color scale, distinct (non-ramp) miss styling, crit-row accent, visible hit-threshold rule, legend
- Exact EV derived from the table itself (not Monte Carlo), self-checked against the closed form
- Formula display, including live-substituted numbers
- "Roll 20 rounds" simulation shown clearly separated from (not blended with) the exact EV
- SVG bonus-sweep chart with crossover marker (handling 0/1/2 crossings) and clamp-region shading
- Side-by-side baseline / +N-to-hit / +N-to-damage tables sharing one color domain

**Should have (competitive differentiators):**
- Marginal-value readout ("the next +1 to hit is worth...") -- cheap, and the single highest-leverage teaching feature
- Diff highlighting between the three side-by-side tables (which rows flipped miss->hit, "+N" badges)
- Linked chart<->table N marker, rolled-cell highlighting during simulation, shareable URL hash state

**Defer (v2+):**
- Advantage/disadvantage, multi-dice damage (2d6 etc.), extra attacks/feats/class features, expanded crit range, a -5/+10 trade mode -- all explicitly out of scope per PROJECT.md, and each would break the clean 2D-table/linear-math model this project relies on

### Architecture Approach

A single pure math core (`DiceMath`, frozen namespace, no DOM access) is the one place 5e rules live; a `Simulator` rolls real dice through the same `damageFor()` call so it can never disagree with the table; a `computeView(state)` pure function derives everything the page shows (three tables, stats, two 21-point curves, crossing list, shared color-scale max) in one pass; dumb renderers format and place that view into the DOM with no math of their own. State changes flow one way -- controls -> `setState` -> rAF-coalesced single `render()` -- and the simulation is deliberately the one non-deterministic, event-driven (not recomputed-on-every-input) piece of state, marked stale rather than silently re-rolled when controls change.

**Major components:**
1. **DiceMath** -- every 5e rule (`isHit`, `damageFor`, `outcomeTable`, `tableStats`, `expectedPerRound`, `sweep`, `crossovers`); pure, no DOM, no randomness
2. **Simulator** -- rolls dice for "20 rounds" via an injectable `rng`, calling `DiceMath.damageFor` so it cannot drift from the table
3. **computeView / State** -- single state object + one pure function turning it into everything the page displays, including one shared color-scale max across the three side-by-side tables
4. **Renderers** -- `renderTables`, `renderChart`, `renderStats`, `renderCopy`, `renderSim`; DOM-only, no math
5. **SelfTest** -- runs known reference values against DiceMath/Simulator on every load (console always; visible panel on `?test`), plus an optional Node-side `tools/verify-math.mjs` that regexes the same script blocks out of `index.html`

### Critical Pitfalls

1. **Rules duplicated across table/stats/simulator** -- nat-1/nat-20 clamp or crit-bonus-doubling gets fixed in one place and not another. Avoid by routing everything through one `outcome()`/`damageFor()` function; assert `E(D+1) - E(D) === P(any hit)` exactly.
2. **Off-by-one on hit resolution** (`>` instead of `>=`, or a mis-derived closed form) -- every hit chance comes out 5 points low. Avoid by counting faces (loop r=1..20) as the primary implementation and using the closed form only as a cross-check assertion (AC 15/+5 must give exactly 0.55).
3. **Crossover assumed to always exist** -- most common settings (AC 15, d8, +0/+0) have *no* crossover; damage bonus leads at every N. Copy/chart code must treat "no crossover in range" as a normal first-class state and return a list (0, 1, or 2 entries) from `crossovers()`, never a single value.
4. **String-typed form inputs** -- `"9" >= "15"` is `true` (lexicographic), and unparsed `input.value` silently breaks specific AC/roll combinations. Avoid by parsing every control through one numeric parser (`valueAsNumber`, clamp, fallback) into a single numeric state object.
5. **Simulation re-rolling on every slider tick, or being blended visually with the exact EV** -- flickers randomly during drags and undermines trust in the "exact vs. simulated" distinction that is core to the pedagogy. Roll only on click; mark prior results stale (with a caption showing what params they were rolled at) rather than silently re-rolling or hiding the mismatch.

## Implications for Roadmap

Architecture research already proposes a natural three-phase split aligned with its "Suggested Build Order," and Features/Pitfalls findings map cleanly onto the same three phases. Recommend adopting this as the roadmap's phase backbone (config granularity is coarse, so 3 phases is an appropriate size).

### Phase 1: Math core + live skeleton, deployed
**Rationale:** Everything else consumes `DiceMath`, so it must be correct and self-tested before anything is built on top of it. Architecture explicitly recommends deploying a minimal working skeleton to GitHub Pages at the end of this phase to de-risk the deployment requirement early, separately from feature completeness.
**Delivers:** `DiceMath` (isHit, damageFor, outcomeTable, tableStats, expectedPerRound), `Simulator` + injectable RNG, in-page `SelfTest` with the reference-value table from PITFALLS.md, one baseline table render, headline stat cards, live AC/die/attack/damage controls, and a working public GitHub Pages URL.
**Addresses:** T1 (rules engine), T2 (live controls), T3 (headline stats), T7 (exact EV from table), the GitHub Pages deployment requirement.
**Avoids:** Pitfalls 1, 2, 3, 5, 6 (off-by-one, clamp, crit-doubling, string inputs, float display) -- all are math-core issues best caught by self-test assertions before any UI is layered on. Also front-loads the deployment gotchas (gh not installed, branch name mismatch, repo must be public, `.nojekyll`) rather than discovering them at the end.

### Phase 2: Comparison tables, chart, simulation
**Rationale:** These are the differentiating, harder-to-render features (T4-T6, T10-T11) that depend entirely on Phase 1's `computeView`/`sweep`/`crossovers` being correct. Architecture groups these together because the chart and the side-by-side tables both read the same `computeView(state)` output and share the N-linked comparison bonus.
**Delivers:** N control; three side-by-side tables (baseline / +N-to-hit / +N-to-damage) with a shared color-scale domain and hit-threshold rule; SVG bonus-sweep chart with crossover marker (handling 0/1/2 crossings) and clamp-region shading; "Roll 20 rounds" simulation panel with per-round log, realized-vs-expected display, and staleness handling on control change.
**Addresses:** T4-T6 (2D table + color + threshold), T9 (simulation), T10 (chart), T11 (side-by-side tables), D1/D3/D4 (marginal-value readout, crossover marker, clamp shading) -- the highest-value differentiators, all LOW-MEDIUM cost per Features' prioritization matrix.
**Avoids:** Pitfall 4 (crit row must be labeled/footnoted, simulator must roll two real dice, never double one die), Pitfall 7 (crossover story wrong/oversold -- text must be generated from the actual computed crossing list, not assumed), Pitfall 8 (ambiguous sweep baseline -- both curves must be asserted equal at N=0), Pitfall 9 (simulator dice bias), Pitfall 10 (sample vs. expectation shown without variance context).

### Phase 3: Designer-facing copy, polish, final deploy
**Rationale:** Explanatory text and formula display depend on every derived number being final, so this comes last. This is also where responsiveness/legibility at the hardest layout case (3 x d12 tables on a laptop) gets solved, and where the deployment gets finalized/verified end-to-end.
**Delivers:** Live-substituted formula text (`data-bind` slots, not hard-coded prose), the three crossover-text variants (none / one crossing / two crossings) plus plateau/dead-zone callouts, diff highlighting between side-by-side tables (D5), responsive/legibility polish for d12 x 3 tables, accessibility pass (labelled controls, `<th scope>`, keyboard operability, non-color-only miss encoding), README, final Pages verification (`curl -I` returns 200, no console 404s).
**Delivers (stretch, if time permits):** D6 (linked chart<->table N marker), D7 (rolled-cell highlighting), D8 (distribution/percentile strip), D9 (cell tooltips), D10 (URL hash state) -- all P2/P3 per Features' prioritization matrix and explicitly listed as "add after validation."

### Phase Ordering Rationale

- Strict dependency order: math core has zero dependencies and everything else calls into it; the chart/comparison-table phase depends only on the math core's `sweep`/`crossovers`/`outcomeTable`; the copy/polish phase depends on every other derived number being final so prose can be generated rather than guessed.
- Deploying a minimal skeleton at the end of Phase 1 (rather than only at the very end of the project) de-risks the GitHub Pages/`gh` CLI friction identified in Stack and Pitfalls research while the codebase is still simple to debug.
- Grouping the chart and side-by-side tables together (Phase 2) matches how Architecture's `computeView` already unifies them -- they are rendered from the same pure function and share the N-linked state, so building them separately would mean synchronizing two half-finished features instead of one.

### Research Flags

Needs research during planning (`--research-phase`):
- None of the three phases involve unfamiliar APIs or sparse documentation -- all four research tracks rate their core findings HIGH or MEDIUM-HIGH confidence with official sources (MDN, GitHub Docs/REST API, web-features Baseline data) or local verification in Node.
- The one area worth a light double-check during Phase 2 planning is the exact crit-row display convention (`2 x face + D` vs `face + avg(die) + D`) -- Architecture and Features lean different directions; resolve it as an explicit requirements decision before implementing D5 (diff highlighting), since the diff logic depends on which convention the crit row uses.

Standard patterns (skip research-phase):
- **Phase 1:** Rules engine, exact math, and self-test patterns are fully specified with verified reference values in PITFALLS.md and ARCHITECTURE.md (working code samples included). GitHub Pages deployment steps are fully scripted in STACK.md with exact `gh` commands.
- **Phase 3:** Responsive CSS (Grid + Container Queries), accessibility basics, and `data-bind` copy patterns are standard, Baseline-supported techniques with no open questions.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Deployment mechanics and platform APIs checked against current GitHub docs, gh CLI manual, MDN, and web-features Baseline data; two items (file:// inline-module behavior, GitHub Actions cross-version compatibility) explicitly flagged MEDIUM inline, but neither affects the recommended path (branch publishing, no modules with imports) |
| Features | MEDIUM | UX conventions (NN/g) and 5e rules are HIGH; competitor feature surveys are MEDIUM because some tools render client-side and could only be read from docs/landing pages rather than live-inspected; the feature math itself was checked with a local script |
| Architecture | HIGH for structure/data flow (standard pattern, numbers checked by running the math in Node); MEDIUM for performance estimates (worked out on paper/operation counts, not yet browser-timed -- though the estimated margins are large enough that this is low-risk) |
| Pitfalls | HIGH for math/reference values (brute-force enumeration in Node, cross-checked against SRD rules text) and GitHub Pages behavior (official docs); MEDIUM for UX/visualization guidance (established practice, not yet project-tested) |

**Overall confidence:** HIGH

### Gaps to Address

- **Crit-row display convention** (`2 x face + D` vs `face + avg(die) + D`): both are mean-preserving and defensible; Architecture and Features research lean different directions. Resolve explicitly in requirements before Phase 2, since it affects the diff-highlighting logic (D5) and the explanatory footnote text.
- **PROJECT.md's Context prose slightly under-specifies the marginal-value formula**: it says "+1 to hit adds 5% x average damage," omitting the damage bonus D. The correct formula (confirmed independently by Features, Architecture, and Pitfalls research) is 5% x (avg(dX) + D). The formula given in PROJECT.md's Requirements section itself is correct; only the prose explanation needs a small fix when copied into the page. Flag for the requirements/roadmap author to correct when authoring D1/D2 copy.
- **Browser performance timings** for the table/DOM render step are estimated from operation counts (MEDIUM confidence), not yet measured with `performance.now()` in a real browser. Low risk given the estimated margins (low single-digit ms against a 16ms frame budget) but worth a quick sanity check early in Phase 2.
- **Local environment friction** (gh CLI not installed, default branch is `master` not `main`, no git remote yet) is fully diagnosed with exact remediation commands in STACK.md/PITFALLS.md -- treat as a known checklist for Phase 1's deployment step rather than an open gap.

## Sources

### Primary (HIGH confidence)
- https://docs.github.com/en/pages/getting-started-with-github-pages/ (creating a site, configuring a publishing source, limits, what-is-github-pages) -- entry file rules, public-repo requirement, `.nojekyll`, publish latency
- https://docs.github.com/en/rest/pages/pages -- Pages REST API (`source.branch`, `source.path`, build status)
- https://cli.github.com/manual/ (gh_repo_create, gh_api, command index) -- exact repo-creation and Pages-enablement commands; confirmed no native `gh pages` command
- MDN: `input` event, `<input type="range">`, `requestAnimationFrame`, `console.assert`, `crypto.getRandomValues` -- event model, RNG guidance
- web-features dataset (web-platform-dx/web-features) -- Baseline dates for container queries, color-mix, oklch, :has, light-dark
- Node.js `node:vm` docs, verified locally on Node 24.15.0 -- script-extraction/testability approach
- SRD 5.2 / 2024 rules text on critical hits and hit resolution ("equals or exceeds", roll damage dice twice)
- Local math verification: brute-force enumeration in Node 24 of every (d20, damage-die) outcome for all reference values, SDs, and crossover cases; local environment inspection (git config, PATH, winget, python, node) on 2026-09-24

### Secondary (MEDIUM confidence)
- AnyDice docs, TabletopCalc DPR calculator, oefi/dnd5e-dpr-calc README -- competitor feature surveys, partly read from docs/landing pages rather than live-inspected tools
- NN/g "Slider Design: Rules of Thumb" and "Sliders, Knobs, and Matrices" -- UX convention guidance for range vs. number inputs
- Classic-script global scope sharing vs. inline-module isolation -- HTML/ECMAScript semantics from training knowledge, consistent with local vm check

### Tertiary (LOW confidence)
- RPGBOT DPR calculator UI, DnD Metrics, Fern Flower Press, GWM/SS CodePen calculator -- landing-page or search-snippet only, not live-inspected; used only for feature-landscape context, not for any load-bearing decision
- Bret Victor "Explorable Explanations" -- cited from training knowledge as the pattern precedent for live-substituted formulas (D2), not re-fetched

---
*Research completed: 2026-09-24*
*Ready for roadmap: yes*
