# Walking Skeleton — D&D Combat Roll Simulator

**Phase:** 1
**Generated:** 2026-09-24

## Capability Proven End-to-End

A game designer opens the public GitHub Pages URL, drags the Target AC slider, and the d20 x d8 outcome table and headline numbers (55% hit chance, 54.0 expected over 20 rounds at the AC 15 / +5 / d8 default) redraw live, every number computed by the one self-tested `DiceMath.damageFor` rule; adding `?test` to the same URL shows the self-test passing.

The skeleton is plans 01-01 (page), 01-02 (gh install + auth), and 01-03 (publish). Plans 01-04 and 01-05 are the next vertical slices inside Phase 1, built on this skeleton without changing any decision below.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | None. One `index.html` with inline `<style>` and four **classic** inline `<script>` blocks (no `type="module"`, no imports) | DEPLOY-01 and D-14: no build step, works over `file://`, blocks share top-level `const` bindings so the self-test sees the engine |
| Script block order (contract) | `#dice-math` (DiceMath, pure rules + exact stats) -> `#view-model` (VM: parse, clamp, format, `computeView`) -> `#dice-selftest` (SelfTest, DOM-free) -> `#app` (DOM, state, render registry, `init()`) | Pure layers run in the page and in Node `vm` unchanged; only `#app` touches the DOM |
| Data layer ("DB" equivalent) | No database. The single source of truth is the pure `DiceMath` engine: `damageFor(d20, dieRolls, p)` is the only damage rule (D-15, RULES-05); `stats()` holds the 20-round total as an integer numerator over die^2 so display rounding is exact (STAT-02). Crit stats enumerate a true 2dX | Exact enumeration, never Monte Carlo, for displayed numbers |
| Data "write" equivalent | One mutable `state = {ac, die, atk, dmg}` object. Every control value passes through `VM.parseControl(key, raw, prev)` (blank/NaN -> previous, clamp, integer, die allow-list) before `setState` (CTRL-05, D-16) | Strings never reach the engine; the engine throws `TypeError` on non-integers (RULES-01) |
| API equivalent | `VM.computeView(state)` returns one plain view object; renderers in the `RENDERERS` array each take `view` and write DOM. Renders are coalesced with `requestAnimationFrame` | Later phases add renderers (tables x3, chart, simulation log) by pushing to `RENDERERS`; they do not add listeners per renderer |
| Auth | None for the site (static, public). Deploy auth is the user's own `gh auth login` browser flow; the executor never sees a token (D-13) | Human-only step, one checkpoint |
| Deployment target | GitHub Pages, branch publishing from `main` at `/`, `build_type=legacy`, public repo `DnD-CombatRollSimulator`, `.nojekyll` at root (D-11, D-12). URL comes from `gh api repos/$OWNER/$REPO/pages -q .html_url` | No Actions workflow, no build; `.planning/` is publicly served by accepted decision D-12 |
| Security baseline | `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:">`, `data:` favicon, no external URLs, `innerHTML` only for the table `<thead>`/`<tbody>` (numbers and fixed labels) | Enforces "no outside requests" and keeps control values out of HTML parsing |
| Styling | CSS custom-property tokens on `:root`, overridden in one `@media (prefers-color-scheme: dark)` block (parchment/ink light, candlelit dark, D-05/D-06). Heat ramp via `color-mix(in oklch)` from a per-cell `--t` with the `--ramp-a`/`--ramp-b` contrast remap. Class-only selectors `.h`, `.h.hi`, `.m` so legend swatches reuse them | JS emits numbers only; colors live in CSS |
| Layout | Single column, `max-width: 90rem`, 16px inline padding, no side column (D-01, D-02). Table sizing through container queries on `.table-wrap` (wide / mid / narrow tiers from UI-SPEC) | Phase 2 places three d12 tables side by side at ~1366px using the mid tier |
| Directory layout | `index.html` (the site), `.nojekyll`, `README.md`, `tools/check-engine.mjs` and `tools/check-page.mjs` (dev-only Node checks, never required to deploy), `.planning/` | Nothing else is served or built |
| Verification | In-page `SelfTest` (console on every load, visible panel on `?test`, UI smoke on `?test`), `node tools/check-engine.mjs` (Node `vm` + 70,980-combo invariant sweep), `node tools/check-page.mjs [url]` (headless Chrome 153: console clean, `SELFTEST PASSED`, 20 row headers, expected strings) | Zero installs; same checks run against `file://` and the live URL |

## Stack Touched in Phase 1

- [ ] Project scaffold: `index.html` with CSP head, four classic script blocks, `tools/check-engine.mjs`, `tools/check-page.mjs` (plan 01-01)
- [ ] Routing: one URL; the `?test` query parameter switches on the visible self-test panel and UI smoke (plan 01-01)
- [ ] Data "read": `VM.computeView(state)` -> `DiceMath.stats` / `outcomeTable` / `marginals`, all through `damageFor` (plan 01-01)
- [ ] Data "write": control `input`/`change` -> `VM.parseControl` -> `setState` -> rAF `render()` (plan 01-01, AC slider + number box)
- [ ] UI: the AC slider and number box redraw the 20 x 8 table and headline stats live (plan 01-01)
- [ ] Deployment: public repo on `main`, Pages from `main` `/`, public URL returns HTTP 200 and passes `tools/check-page.mjs` with `?test` (plans 01-02, 01-03)

## Out of Scope (Deferred to Later Slices)

- Inside Phase 1 but after the skeleton: full theme and candlelit dark mode, legend, crit footnote, container-query tiers (plan 01-04); die buttons, attack/damage bonus steppers, six stat cards, marginal +1 readout, re-ship (plan 01-05)
- Comparison bonus N slider, three side-by-side tables, SVG sweep chart, crossover and plateau marking (Phase 2)
- "Roll 20 rounds" simulation, per-round log, standard deviation, injectable RNG (Phase 3)
- Designer explanation copy, live-substituted formulas, suggested explorations, full accessibility pass (Phase 4)
- v2 only: URL-hash state, cell tooltips, advantage/disadvantage, multi-dice damage, expanded crit range

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: a designer picks bonus N and compares baseline / +N hit / +N damage tables (shared heat domain via `heatMax`) and the SVG sweep chart built from `DiceMath.sweep`
- Phase 3: a designer rolls 20 real rounds and compares the realized total to the exact expectation and its spread; the dice function takes an injectable RNG checked by `SelfTest`
- Phase 4: a designer reads live explanation text and formulas that always match the numbers; accessibility pass; final re-verification of the public URL
