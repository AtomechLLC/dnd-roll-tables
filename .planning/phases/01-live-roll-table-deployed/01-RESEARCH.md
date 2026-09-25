# Phase 1: Live Roll Table, Deployed - Research

**Researched:** 2026-09-24
**Domain:** Single-file vanilla HTML/CSS/JS (classic inline scripts), exact 5e probability engine, heat-mapped `<table>`, GitHub Pages deployment via `gh` on Windows
**Confidence:** HIGH. The engine math, CSS behavior, headless-browser checks and environment facts were all run on this machine. Two items are MEDIUM: the 5e zero-damage floor rule and the post-install `gh` path and UAC behavior.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Page layout
- **D-01:** Controls live in a horizontal strip across the top of the page. Stat cards sit in a row directly beneath the controls. The outcome table takes the full width below that. Not sticky.
- **D-02:** The full viewport width stays available for content below the controls. Phase 2 will place three d12 tables side by side at ~1366 px, so nothing in Phase 1 may reserve a permanent side column.

#### Default state on first load
- **D-03:** Initial state is AC 15, d8, attack bonus +5, damage bonus +0. This matches the headline reference values (55% hit chance, 54.0 expected over 20 rounds), so the self-test numbers are visible on load.
- **D-04:** `init()` writes the default state into the controls (not the other way round), so markup defaults can never disagree with state.

#### Visual style: tabletop-flavored
- **D-05:** Parchment-and-ink theme. Light base is a warm parchment tone with dark ink text and rules; headings and copy in a system serif stack (Georgia / Palatino / "Book Antiqua" / serif). No external fonts (DEPLOY-01 forbids outside requests), so system stacks only.
- **D-06:** A "candlelit" dark variant follows `prefers-color-scheme: dark`: dark wood / slate base with pale ink text. Implement as CSS custom-property tokens on `:root`, redefined inside the dark media query. The heat ramp is re-tuned for the dark base (not just inverted).
- **D-07:** Every number in the table, stat cards, and control outputs uses a tabular-figure sans or monospace stack (`font-variant-numeric: tabular-nums`) so 20 x 12 cells align. Serif is for prose and headings only.
- **D-08:** Damage heatmap is a blood-red sequential ramp: pale parchment at the lowest hit damage to deep crimson at the maximum. Use `color-mix()` in `oklch` from a per-cell `--t` (0 to 1) so the ramp is perceptually even. Cell text color flips (dark on light, light on dark) for contrast.
- **D-09:** Miss cells show `0` (TABLE-01) in a flat, muted grey-parchment style that is outside the red ramp, so they differ in kind from low-damage hits, not just in shade. Miss vs hit must also be distinguishable without color (the `0` text plus a muted style satisfies this for now; Phase 4 does the full accessibility pass).
- **D-10:** The nat 1 row is labeled "auto-miss" and the nat 20 row is labeled "crit" with the 2 x face + D convention and its footnote, as already fixed in PROJECT.md. Theming may style these rows (e.g. an ink rule or accent) but the labels are those words.

#### Repository and deployment
- **D-11:** Public GitHub repo named `DnD-CombatRollSimulator` (matches the local folder). Default branch `main` (rename from `master` before first push). `.nojekyll` at root. README describes the page and links the Pages URL.
- **D-12:** Pages publishes from `main` at `/` via the REST API (`gh api`). Root publishing means `.planning/` is served publicly; this is accepted (nothing sensitive is in it).
- **D-13:** `gh` CLI is not installed. The plan installs it with `winget install --id GitHub.cli --source winget`, then **stops at a human checkpoint** for the user to run `gh auth login` in a new terminal (browser auth is the user's action, never the executor's). Only after auth does the plan create the repo, push, and enable Pages. Derive the GitHub username from `gh api user` after auth; do not guess it.

#### Carried forward (already locked in PROJECT.md / REQUIREMENTS.md)
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. (A "show me a crossover" preset from research is already covered by COPY-05 in Phase 4.)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RULES-01 | Hit when d20 + atk >= AC, numerically | `outcome()` rule order plus an engine `assertParams` guard that throws on non-integers (Pattern 1). The self-test asserts that passing `'15'` throws. |
| RULES-02 | Nat 1 always misses, nat 20 always hits | `outcome()` checks `d20 === 1` first, then `=== 20`. Asserts at AC 10/+20 (row 1 all 0) and AC 30/-5 (row 20 non-zero). |
| RULES-03 | Crit: dice twice, bonus once | `damageFor(20, [k1,k2], p)` adds `p.dmg` once. Assert: crit cell at k=5, d8, D+3 is 13, not 16. |
| RULES-04 | Miss deals 0 | `damageFor` returns 0 when `!isHit`. See also the new zero-floor finding (Pitfall 1). |
| RULES-05 | One pure function; table, stats, chart, and sim all call it | `DiceMath.damageFor`. `outcomeTable` and `stats` (including the X² crit enumeration) call only it. |
| RULES-06 | Hit chance by counting faces (clamped by construction) | `stats().hitFaces` counts rows whose `outcome` is hit or crit. `pHit = hitFaces/20`. |
| RULES-07 | E derived from table, cross-checked vs closed form | `stats()` holds an integer numerator `e20Num / die²`. The closed form is valid only for D >= -1 (verified; see Pitfall 1). |
| RULES-08 | Self-test on load, console always, panel on `?test` | Four-block script layout. `SelfTest` is DOM-free and Node-runnable. The assertion list is in "Self-Test Assertion Set". |
| CTRL-01 | AC slider + number (10-30), live on `input` | Paired-control sync pattern (Pattern 4). The number box is never rewritten while focused, and it normalizes on `change`. |
| CTRL-02 | Die segmented group d4-d12 | Radio inputs styled as buttons. Listen to both `input` and `change` (MDN: radio `input` support was historically inconsistent). |
| CTRL-03 | Atk/dmg number steppers (-5..+20) | `<input type="number" min max step=1>`. Browsers do not clamp typed values (verified), so the parser clamps. |
| CTRL-05 | One parser with clamp + fallback → single state; rAF-coalesced | `parseControl(key, raw, prev)`. `Number('') === 0` is a trap (Pitfall 2). rAF runs before `--dump-dom` (verified). |
| TABLE-01 | 20 x X, ascending rows, damage per cell (0 on miss) | `outcomeTable`, rendered with one `innerHTML` per table section (numbers and fixed labels only). |
| TABLE-02 | Miss neutral style, hits one sequential scale | `.m` class (grey plus hatch plus muted `0`). `.h` uses `color-mix(in oklch)` driven by `--t`. Tokens verified for contrast. |
| TABLE-03 | Threshold rule + "hits on N+", auto-miss / crit labels | `threshold = clamp(ac - atk, 2, 20)`. An inset `box-shadow` rule means no layout shift. A fixed-width note column holds the labels. |
| TABLE-04 | Crit row 2 x face + D with footnote | Display convention in `outcomeTable`. Footnote text is given below. Open Question 1 covers the D <= -3 case. |
| TABLE-05 | Legend: ramp, miss, crit | The legend reuses the real cell classes at t = 0, .25, .5, .75, 1, so it cannot drift from the cells. |
| TABLE-06 | Real `<table>` with `<th scope>`, legible at d12 | Cell-size budget and container-query tiers (see "Table Legibility Budget"). |
| STAT-01 | Threshold, hit %, crit %, avg dmg on hit, E/round, E/20 | `computeView` fields (Pattern 2). |
| STAT-02 | per-round x 20 == displayed 20-round | Round E20 to tenths as an integer, then derive per-round as tenths x 5 thousandths. Exact by construction (verified). |
| STAT-03 | Marginal +1 hit / +1 dmg, 0 when capped or floored | Exact differencing of integer numerators, plus a `reason: 'cap' / 'floor' / null` field. |
| DEPLOY-01 | One index.html, inline CSS + classic scripts, no external requests, works from disk | Verified: classic blocks share `const` across blocks on `file://`. A CSP `<meta>` blocks and logs any outside request (verified). |
| DEPLOY-02 | Public repo, `main`, `.nojekyll`, README | Deployment Runbook steps 0-4. |
| DEPLOY-03 | Pages from `main` root via REST, HTTP 200, no console errors | Runbook steps 5-6: POST, then PUT on 409, a poll loop, and a headless Chrome check of the live URL. |
</phase_requirements>

## Summary

Phase 1 needs no libraries. The work is getting a small number of exact details right: one rules engine, one parser, one formatter, a theming token set, and a scripted deploy. Earlier project research (`.planning/research/*.md`) already covers the architecture, the reference values, and the Pages commands. This phase research re-checked all of it on this machine and found several details that change the plan.

**Finding 1: the zero-damage floor.** CTRL-03 allows a damage bonus as low as -5, so a hit can "deal" negative damage (d4 face 1 - 5 = -4). 5e says damage is never below 0, so `damageFor` must return `Math.max(0, dice + D)`. That breaks two invariants that prior research and RULES-07/08 rely on. (a) The closed form `P(normal)(avg+D) + P(crit)(2avg+D)` only equals the table for **D >= -1**. (b) `E(D+1) - E(D) = P(any hit)` also holds only for D >= -1. A third result also changes: (c) the "2 x face + D" crit display equals a true 2dX crit average only for **D >= -2**. Exhaustive enumeration over all 70,980 control combinations: 0 failures inside those domains, and 8,190 combos (D in {-5,-4,-3}) where the displayed table average differs from true 5e by up to 0.39 over 20 rounds. The self-test must scope those assertions to their valid domains. The planner must also pick the crit convention for stats (Open Question 1; recommendation: true 2dX in stats).

**Finding 2: the heat ramp has a contrast dead band.** Any continuous light-to-dark ramp passes through a mid-luminance band where neither tinted ink nor off-white text reaches 4.5:1. A tested fix: flip the text at t = 0.5, and have CSS remap `--t` so it skips the dead band. The remap is two per-theme numbers, `--ramp-a` and `--ramp-b`. With the tokens given below, every cell in both themes reaches at least 4.6:1.

**Finding 3: environment facts.** `gh` is still not installed. winget 1.29.380 offers GitHub.cli 2.101.0 as a WiX MSI. After it installs, the executor's shell will **not** have `gh` on PATH, so it must call `"/c/Program Files/GitHub CLI/gh.exe"` by absolute path. Chrome 153 and Edge 153 are installed. Headless Chrome (`--dump-dom`, `--enable-logging=stderr`) can check `file://…/index.html?test` and the live Pages URL for self-test results and console errors, with no npm and no human.

**Primary recommendation:** Build `index.html` as four classic script blocks: `#dice-math` (pure engine, integer-numerator stats) → `#view-model` (pure parse, clamp, format, computeView) → `#dice-selftest` (DOM-free, Node-runnable) → `#app` (DOM, state, rAF render, controls, `?test` panel). Add a strict CSP meta. Verify with headless Chrome plus a Node `vm` check. Run the gh install and auth checkpoint early, in parallel with engine work, so the only human interruption happens once and the final publish runs unattended.

## Project Constraints (from CLAUDE.md)

| Directive | Source | Status for Phase 1 |
|-----------|--------|--------------------|
| GitHub Pages static files only, no server, no build step, one `index.html` | CLAUDE.md Constraints | Binding |
| Vanilla HTML/CSS/JS, no frameworks, no CDN libraries | CLAUDE.md Constraints | Binding |
| Repo creation and Pages enablement are in scope (a working public URL is the goal) | CLAUDE.md Constraints | Binding |
| d12 table legible; three tables side by side on a laptop (Phase 2); mobile can stack | CLAUDE.md Constraints | Binding (Phase 1 must leave room) |
| Inline `<script type="module">` | CLAUDE.md Stack table | **Superseded by D-14.** Use classic inline `<script>` blocks. |
| Semantic `<table>`, `th scope`, `table-layout: fixed`, `tabular-nums`; no div-grid tables | CLAUDE.md | Binding |
| CSS Grid for page layout; container queries for per-table sizing; `color-mix()` in oklch | CLAUDE.md | Binding (recommended) |
| No `npm`/`package.json`/bundlers/TypeScript; Node only for optional dev checks, never a build dependency | CLAUDE.md "What NOT to Use" | Binding |
| No external `.js`/`.css`, no `import` | CLAUDE.md | Binding |
| No Monte Carlo for displayed stats (exact enumeration) | CLAUDE.md | Binding |
| No `innerHTML` for interactive parts; OK only for static, fully numeric output | CLAUDE.md | Table body built with `innerHTML` (numbers and fixed labels only). Controls are never inside re-rendered containers. |
| `input` event on sliders, not `change` only | CLAUDE.md | Binding |
| `light-dark()` only as an enhancement; theme with `@media (prefers-color-scheme: dark)` overriding custom properties | CLAUDE.md | Binding |
| No `document.write`, no inline `onclick=""`, no jQuery; use `addEventListener` | CLAUDE.md | Binding (also required by the CSP below) |
| Commit an empty `.nojekyll`; public repo | CLAUDE.md | Binding |
| Relative paths only (never root-absolute `/x`) | CLAUDE.md | Binding (single file makes this nearly moot) |
| GSD workflow: file edits only through GSD commands | CLAUDE.md | Executor runs under `/gsd-execute-phase` |
| User memory: prefers minimal interruptions; batch questions | MEMORY.md | Only one human checkpoint (gh install UAC + `gh auth login`, batched) |

## Architectural Responsibility Map

There is no server tier. Everything runs in the browser from one static file. Tiers are mapped to the layers inside the page.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 5e rules, exact stats, marginals | Browser: pure model (`#dice-math`) | — | Must be DOM-free so the self-test and Node can run it |
| Parsing, clamping, formatting, view derivation | Browser: pure view-model (`#view-model`) | — | Shared by the self-test (STAT-02, CTRL-05 checks) and the app |
| Self-test | Browser: pure (`#dice-selftest`) | Node `vm` (dev only) | Same code runs in page and Node |
| State, event binding, rAF scheduling, rendering | Browser: DOM layer (`#app`) | — | Only this layer touches the DOM |
| Theming, heat ramp, layout, legibility | Browser: CSS (`<style>`) | JS sets `--t` and the `.hi` class only | Colors stay in CSS tokens, JS emits numbers |
| Hosting | CDN/Static: GitHub Pages (`main` at `/`) | — | Branch publishing, no workflow file |
| Repo and Pages provisioning | Local machine: `gh` CLI + REST API | Human (UAC + browser auth) | Auth is the user's action (D-13) |

## Standard Stack

### Core (platform features, zero dependencies)

| Technology | Version / Baseline | Purpose | Why Standard |
|------------|-------------------|---------|--------------|
| Classic inline `<script>` blocks at the end of `<body>` | Universal | Engine, view-model, self-test, app | Top-level `const` is shared across blocks but is **not** placed on `window` (verified in Chrome 153: `'DiceMath' in window === false`). Works on `file://` (verified). [VERIFIED: local headless Chrome] |
| `color-mix(in oklch, …)` with nested `calc(var(--x) * 100%)` | Baseline widely available 2025-11 [CITED: CLAUDE.md / web-features] | Heat ramp | Computed styles resolved correctly in Chrome 153, e.g. `oklch(0.5715 0.124 36.1)` at s = 0.70. [VERIFIED: local headless Chrome] |
| CSS container queries (`container-type: inline-size`) | Baseline widely available 2025-08 [CITED: CLAUDE.md] | Cell-size tiers per table wrapper | Phase 2 tables live in grid tracks, so size must follow the track, not the viewport |
| CSS Grid `repeat(auto-fit, minmax(min(100%, 26rem), 1fr))` | Baseline | Stats row and table area | Stacks without media queries |
| `@media (prefers-color-scheme: dark)` + `color-scheme: light dark` | Universal | Candlelit theme | `color-scheme` makes native number/range controls render dark too |
| `<meta http-equiv="Content-Security-Policy">` | Universal | Enforces "no outside requests" | With `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:`, inline scripts, inline `style="--t:…"` and color-mix all still work. An external `<img>` was blocked and logged. [VERIFIED: local headless Chrome] |
| `<input type="range">` + `<input type="number">` + radio `<fieldset>` | Universal | Controls | Range inputs self-clamp on assignment (`'99'` → `'30'`). Number inputs do **not** clamp. [VERIFIED: local headless Chrome] |
| `requestAnimationFrame` | Universal | Render coalescing | rAF callbacks run before headless `--dump-dom` captures the DOM. [VERIFIED: local] |

### Supporting (hand-written, inline)

| Piece | Size | Purpose |
|-------|------|---------|
| `DiceMath` (IIFE, frozen) | ~70 lines | `outcome`, `isHit`, `damageFor`, `outcomeTable`, `stats`, `closedFormPerRound`, `marginals`, `sweep`, `threshold`, `assertParams` |
| `VM` (view-model namespace) | ~70 lines | `CONTROL_SPEC`, `DEFAULT_STATE`, `parseControl`, `fixed(intScaled, decimals)`, `computeView(state)` |
| `SelfTest` | ~90 lines | `check()` table, coarse invariant grid, summary. Exposes `{results, passed, failed, ms}` |
| `el()` helper (optional) | ~10 lines | Static chrome only (stat cards, legend, panel). The table body uses a joined string. |

### Development Tools (no installs needed except gh)

| Tool | Status | Use |
|------|--------|-----|
| Chrome 153 headless (`C:\Program Files\Google\Chrome\Application\chrome.exe`) | ✓ installed | Load `file://…/index.html?test` and the live URL. Capture the DOM and console. |
| Edge 153 (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`) | ✓ installed | Fallback for the same flags |
| Node 24.15.0 | ✓ | Optional `vm` check of blocks 1-3, full-domain invariant sweep (~1.7 s) |
| Python 3.14.4 | ✓ | `python -m http.server 8000` for an http:// preview |
| curl 8.7.1 | ✓ | HTTP 200 check on the Pages URL |
| gh CLI | ✗ (winget has 2.101.0) | Repo create, Pages API |

**Installation:** none for the site. Only `winget install --id GitHub.cli --source winget --exact` (see the Deployment Runbook).

## Package Legitimacy Audit

This phase installs **no npm, PyPI, or crates packages**, so slopcheck does not apply. The only external software is the GitHub CLI:

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| GitHub.cli 2.101.0 | winget (official `winget` source), publisher "GitHub, Inc.", WiX MSI from `github.com/cli/cli/releases/download/v2.101.0/gh_2.101.0_windows_amd64.msi`, SHA256 `9ba92256…faef83` | Project since 2019 | n/a | github.com/cli/cli | n/a (not an npm/PyPI package) | Approved. Official install method per cli/cli `install_windows.md` [CITED: CLAUDE.md sources]. Verified via `winget show` on this machine. |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
 user edits a control (drag slider / type / click die)
        │ 'input' (and 'change') events bubble to <form id="controls">
        ▼
 ┌──────────────────────── #app ────────────────────────┐
 │ onControl(e) ─► VM.parseControl(key, raw, prev)      │  blank/NaN → prev value
 │                 round + clamp → number               │  out of range → clamp
 │        ▼                                             │
 │ state = {ac, die, atk, dmg}  (the only mutable data) │
 │        ▼                                             │
 │ scheduleRender() ── pending? ─yes─► drop (coalesced) │
 │        │ no                                          │
 │        ▼ requestAnimationFrame                       │
 │ render(): view = VM.computeView(state) ──────────────┼──► #view-model (pure)
 │   for r of RENDERERS: r(view)                        │        │ calls
 │     renderControls(view) (skips focused number box)  │        ▼
 │     renderStats(view)                                │     #dice-math (pure)
 │     renderTable(view)  ← Phase 2 adds more renderers │     damageFor ◄── the one rule
 │     renderLegend(view)                               │     outcomeTable / stats /
 └──────────────────────────────────────────────────────┘     marginals / sweep
        ▼
 DOM: stat cards, <table>, legend, footnote

 page load order: #dice-math → #view-model → #dice-selftest (runs checks, console summary)
                  → #app: init() writes defaults into controls → binds listeners → render()
                  → if URLSearchParams has 'test': show SelfTest panel (+ optional UI smoke)
```

### Recommended Project Structure

```
DnD-CombatRollSimulator/
├── index.html          # the whole site
│   ├── <head>: charset, viewport, color-scheme, CSP meta, data: favicon, <style>
│   ├── <body>: header, form#controls (strip), section#stats, section#tables, legend, footnote, section#selftest[hidden]
│   ├── <script id="dice-math">     DiceMath  (pure rules + exact stats)
│   ├── <script id="view-model">    VM        (pure parse/clamp/format/computeView)
│   ├── <script id="dice-selftest"> SelfTest  (pure; console summary)
│   └── <script id="app">           DOM: state, render registry, controls, init, ?test panel
├── .nojekyll           # empty
├── README.md           # description + Pages URL + ?test + local use
└── tools/check-engine.mjs  # OPTIONAL dev-only Node vm runner (never required to deploy)
```

**Why a separate `#view-model` block?** CONTEXT's `code_context` describes the order as "rules engine → self-test → renderers → controls binder → init()". That is a suggested pattern, not a locked decision. The self-test must also cover the parser (CTRL-05) and the rounding rule (STAT-02). If those lived in `#app` they would run *after* the self-test and would touch the DOM. A pure block between the engine and the self-test keeps both testable in page and in Node.

### Pattern 1: Engine with integer numerators (RULES-01..07)

**What:** `damageFor` is the only rule. `stats()` accumulates the 20-round total as an integer numerator over `die²`, so every displayed number can be rounded exactly.
**Example** (prototype verified: 70,980 combos, 0 invariant failures in their valid domains):

```javascript
// <script id="dice-math">  -- pure: no DOM, no Math.random, no formatting
const DiceMath = (() => {
  'use strict';
  const DICE = Object.freeze([4, 6, 8, 10, 12]);
  const avg = (x) => (x + 1) / 2;
  function assertParams(p) {                       // RULES-01: never compare strings
    for (const k of ['ac', 'atk', 'die', 'dmg'])
      if (!Number.isInteger(p[k])) throw new TypeError(`DiceMath: ${k} must be an integer, got ${JSON.stringify(p[k])}`);
  }
  // 'fumble' | 'miss' | 'hit' | 'crit'. Order matters (nat 1, then nat 20, then >=).
  function outcome(d20, atk, ac) {
    if (d20 === 1) return 'fumble';
    if (d20 === 20) return 'crit';
    return d20 + atk >= ac ? 'hit' : 'miss';
  }
  const isHit = (d20, atk, ac) => { const o = outcome(d20, atk, ac); return o === 'hit' || o === 'crit'; };
  // THE rule (RULES-05). dieRolls: [k] normal, [k1, k2] crit. Bonus added once. 5e: never below 0.
  function damageFor(d20, dieRolls, p) {
    if (!isHit(d20, p.atk, p.ac)) return 0;
    let s = p.dmg; for (const k of dieRolls) s += k;
    return Math.max(0, s);
  }
  const threshold = (p) => Math.min(20, Math.max(2, p.ac - p.atk));   // "hits on N+"
  function outcomeTable(p) {
    assertParams(p);
    const rows = [];
    for (let r = 1; r <= 20; r++) {
      const kind = outcome(r, p.atk, p.ac), cells = [];
      for (let k = 1; k <= p.die; k++) cells.push(damageFor(r, r === 20 ? [k, k] : [k], p)); // display: 2k + D
      rows.push({ d20: r, kind, cells });
    }
    return rows;
  }
  // Exact stats. E20 = e20Num / e20Den with e20Den = die^2 (integers -> exact display rounding).
  function stats(p) {
    const X = p.die, rows = outcomeTable(p);
    let hitFaces = 0, num = 0, tableSum = 0;
    for (const row of rows) {
      let rowSum = 0; for (const c of row.cells) rowSum += c;
      tableSum += rowSum;
      if (row.kind === 'hit') { hitFaces++; num += X * rowSum; }
      else if (row.kind === 'crit') {
        hitFaces++;
        // Open Question 1, recommended: true 2dX crit (equals X * rowSum whenever dmg >= -2)
        for (let a = 1; a <= X; a++) for (let b = 1; b <= X; b++) num += damageFor(20, [a, b], p);
      }
    }
    return { rows, hitFaces, pHit: hitFaces / 20, pCrit: 1 / 20, e20Num: num, e20Den: X * X,
             e20: num / (X * X), perRound: num / (X * X) / 20, tableSum, threshold: threshold(p) };
  }
  function closedFormPerRound(p) {                  // PROJECT.md formula. Valid only for dmg >= -1.
    let normal = 0; for (let r = 2; r <= 19; r++) if (r + p.atk >= p.ac) normal++;
    return (normal / 20) * (avg(p.die) + p.dmg) + (1 / 20) * (2 * avg(p.die) + p.dmg);
  }
  function marginals(p) {                           // STAT-03: exact differencing (integer numerators)
    const base = stats(p).e20Num;
    const hitNum = stats({ ...p, atk: p.atk + 1 }).e20Num - base;
    const dmgNum = stats({ ...p, dmg: p.dmg + 1 }).e20Num - base;
    const reason = hitNum !== 0 ? null : (p.atk >= p.ac - 2 ? 'cap' : 'floor');
    return { hitNum, dmgNum, den: p.die * p.die, reason };
  }
  function sweep(p, maxN = 20) {                    // used by RULES-08 now, by the chart in Phase 2
    const attack = [], damage = [];
    for (let n = 0; n <= maxN; n++) {
      attack.push(stats({ ...p, atk: p.atk + n }).e20Num);
      damage.push(stats({ ...p, dmg: p.dmg + n }).e20Num);
    }
    return { attack, damage, den: p.die * p.die };
  }
  return Object.freeze({ DICE, avg, assertParams, outcome, isHit, damageFor, threshold,
                         outcomeTable, stats, closedFormPerRound, marginals, sweep });
})();
```

Measured cost: `stats + marginals` at d12 averages **0.175 ms** per render in Node. [VERIFIED: local]

The engine accepts any integers. `marginals` at atk = +20 evaluates atk = +21, which is outside the control range but valid math. Only the parser enforces control ranges.

### Pattern 2: One parser, one spec, one formatter (CTRL-05, STAT-01..03)

```javascript
// <script id="view-model">
const VM = (() => {
  'use strict';
  const CONTROL_SPEC = Object.freeze({
    ac:  { min: 10, max: 30 },
    die: { set: [4, 6, 8, 10, 12] },
    atk: { min: -5, max: 20 },
    dmg: { min: -5, max: 20 },
  });
  const DEFAULT_STATE = Object.freeze({ ac: 15, die: 8, atk: 5, dmg: 0 });   // D-03
  // raw: string from el.value (or a number). Blank / non-numeric -> prev (last valid). Never Number('') === 0.
  function parseControl(key, raw, prev) {
    const spec = CONTROL_SPEC[key];
    let n;
    if (typeof raw === 'number') n = raw;
    else {
      const s = String(raw ?? '').trim();
      if (s === '') return prev;
      n = Number(s);                                   // not parseInt: '12abc' must fail
    }
    if (!Number.isFinite(n)) return prev;
    const i = Math.round(n);
    if (spec.set) return spec.set.includes(i) ? i : prev;
    return Math.min(spec.max, Math.max(spec.min, i));
  }
  // Exact fixed-point formatting from a scaled integer: fixed(1575, 3) -> "1.575"
  function fixed(intScaled, decimals) {
    const neg = intScaled < 0, a = Math.abs(intScaled), p = 10 ** decimals;
    const whole = Math.trunc(a / p), frac = String(a % p).padStart(decimals, '0');
    return (neg ? '-' : '') + whole + (decimals ? '.' + frac : '');
  }
  const tenths = (num, den) => Math.round((10 * num) / den);   // a 20-round value in tenths (integer)
  function computeView(state) {
    const p = { ac: state.ac, die: state.die, atk: state.atk, dmg: state.dmg };
    const s = DiceMath.stats(p), m = DiceMath.marginals(p);
    const e20T = tenths(s.e20Num, s.e20Den);                    // STAT-02: round the 20-round figure once...
    const mHitT = tenths(m.hitNum, m.den), mDmgT = tenths(m.dmgNum, m.den);
    const X = p.die, heatMax = Math.max(1, 2 * X + p.dmg);     // Open Question 3: domain [0, crit max]
    return {
      params: p, rows: s.rows, threshold: s.threshold, hitFaces: s.hitFaces,
      hitPct: s.hitFaces * 5,                                   // exact integer percent; crit is always 1/20 = 5%
      e20Text: fixed(e20T, 1), perRoundText: fixed(e20T * 5, 3),// ...then per-round = tenths*5 thousandths
      avgPerHitText: s.hitFaces ? fixed(Math.round((100 * s.e20Num) / (s.e20Den * s.hitFaces)), 2) : '0.00',
      marg: { hit20: fixed(mHitT, 1), hitRound: fixed(mHitT * 5, 3),
              dmg20: fixed(mDmgT, 1), dmgRound: fixed(mDmgT * 5, 3), reason: m.reason },
      heatMax,
      critFloorDiffers: s.tableSum * X !== s.e20Num,             // true only when dmg <= -3 (footnote variant)
    };
  }
  return Object.freeze({ CONTROL_SPEC, DEFAULT_STATE, parseControl, fixed, tenths, computeView });
})();
```

Verified display values: defaults give `54.0` / `2.700`, AC 15 +0 d8 gives `31.5` / `1.575`, and AC 15 +5 d6 D-2 gives `21.7` / `1.085`. Per-round x 20 equals the 20-round figure by construction. By contrast, `(1.575).toFixed(2) === "1.57"` and `(4.35).toFixed(1) === "4.3"` in Chrome 153. [VERIFIED: local]

Marginal readout (STAT-03) at defaults: "+1 to hit: +0.225/round (+4.5 over 20)" and "+1 to damage: +0.550/round (+11.0 over 20)". When `reason === 'cap'`, show "+0: already hits on 2+ (95% cap)". When `reason === 'floor'`, show "+0: still only a nat 20 hits".

### Pattern 3: State + rAF render registry (Phase 2-4 extension point)

```javascript
// <script id="app">
const state = { ...VM.DEFAULT_STATE };
const RENDERERS = [renderControls, renderStats, renderTable, renderLegend];   // Phase 2 pushes more
let pending = false;
function setState(patch) { Object.assign(state, patch); scheduleRender(); }
function scheduleRender() {
  if (pending) return; pending = true;
  requestAnimationFrame(() => { pending = false; render(); });
}
function render() { const view = VM.computeView(state); for (const r of RENDERERS) r(view); }
```

### Pattern 4: Paired AC controls without feedback loops or "can't type 25"

The trap: AC min is 10. If the `input` handler writes the clamped value back into the number box, typing "2" on the way to "25" snaps to 10 immediately, so the user can never type "25".

```javascript
const form = document.getElementById('controls');
form.addEventListener('submit', (e) => e.preventDefault());      // Enter must never reload the page
function onControl(e) {
  const key = e.target.dataset.key; if (!key) return;
  const v = VM.parseControl(key, e.target.value, state[key]);
  if (v !== state[key]) setState({ [key]: v }); else scheduleRender();
}
form.addEventListener('input', onControl);
form.addEventListener('change', (e) => {                         // commit: normalize the edited box itself
  onControl(e);
  if (e.target.type === 'number') e.target.value = String(state[e.target.dataset.key]);
});
function renderControls(view) {
  for (const el of form.querySelectorAll('[data-key]')) {
    const v = String(state[el.dataset.key]);
    if (el.type === 'radio') { el.checked = el.value === v; continue; }
    if (el === document.activeElement && el.type === 'number') continue;   // don't fight the typist
    if (el.value !== v) el.value = v;       // programmatic writes do NOT fire 'input' (MDN) -> no loop
  }
}
```

- Both AC inputs carry `data-key="ac"`. The slider writes to state, and render writes to the number box (and the reverse).
- Radio: listen to `change` as well, because MDN notes that `input` on radio and checkbox "historically has not always" fired. Double handling is harmless because `setState` is idempotent. [CITED: MDN input event]
- Never write a non-numeric string into `type=number`. Chrome logs `The specified value "abc" cannot be parsed` to the console, which pollutes the "no console errors" check. [VERIFIED: local]
- `init()` = `renderControls` + bind + `render()` synchronously once (D-04). Writing state into controls is the same code path as every render.
- An `<output>` for the AC slider is optional here. The paired number box already shows the exact value.

### Pattern 5: Table renderer (numbers-only `innerHTML`)

```javascript
function renderTable(view) {
  const { rows, params: p, threshold, heatMax } = view;
  const head = `<tr><th scope="col" class="corner">d20 \\ d${p.die}</th>` +
    Array.from({ length: p.die }, (_, i) => `<th scope="col">${i + 1}</th>`).join('') +
    `<th scope="col" class="note"><span class="vh">Notes</span></th></tr>`;
  const body = rows.map((row) => {
    const cls = [row.kind, row.d20 === threshold ? 'threshold' : ''].join(' ').trim();
    const cells = row.cells.map((d) => {
      if (row.kind === 'miss' || row.kind === 'fumble') return `<td class="m">0</td>`;
      const t = Math.min(1, d / heatMax);
      return `<td class="h${t >= 0.5 ? ' hi' : ''}" style="--t:${t.toFixed(3)}">${d}</td>`;
    }).join('');
    return `<tr class="${cls}"><th scope="row">${row.d20}</th>${cells}<td class="note">${noteFor(row, threshold)}</td></tr>`;
  }).join('');
  tableEl.style.setProperty('--cols', p.die);
  tableEl.tHead.innerHTML = head;
  tableEl.tBodies[0].innerHTML = body;
}
// noteFor: row 1 -> "auto-miss"; threshold row -> "hits on N+" (N = 2 -> "hits on 2+ · 95% cap");
// row 20 -> "crit*" (and when threshold === 20 -> "crit* · only a nat 20 hits").
```

Row styling comes from `row.kind`, which comes from `outcome()`, never from `damage === 0`. With a damage penalty, a *hit* can deal 0 and must still look like a hit (pale ramp end), not a miss.

### Pattern 6: Theme tokens and heat ramp (TABLE-02, D-05..D-09)

All pairs below were computed with an OKLCH → sRGB → WCAG 2 contrast script that mirrors `color-mix(in oklch)` interpolation (linear L and C, shorter-arc hue). Every endpoint is in the sRGB gamut. [VERIFIED: local computation; ramp values cross-checked against Chrome's computed style]

```css
:root {
  color-scheme: light dark;
  --font-prose: Georgia, "Palatino Linotype", Palatino, "Book Antiqua", serif;
  --font-num: system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; /* + tabular-nums */
  /* LIGHT: parchment & ink */
  --paper:      oklch(0.96 0.022 85);   /* #f9f1e2 */
  --surface:    oklch(0.935 0.03 82);   /* #f4e8d4  cards, control strip */
  --ink:        oklch(0.27 0.035 45);   /* #352118  13.5:1 on paper */
  --ink-muted:  oklch(0.45 0.03 55);    /* #635146  6.2:1 on surface */
  --rule:       oklch(0.30 0.04 40);    /* threshold rule, 12.3:1 */
  --accent:     oklch(0.48 0.10 70);    /* crit accent / focus, 5.95:1 on paper */
  --miss-bg:    oklch(0.87 0.006 80);   /* #d6d4d0 neutral grey-parchment */
  --miss-ink:   oklch(0.45 0.01 80);    /* 5.0:1 on miss-bg */
  --heat-lo:    oklch(0.925 0.04 62);   /* pale parchment-rose */
  --heat-hi:    oklch(0.42 0.16 25);    /* #90101a deep crimson */
  --cell-ink-lo: oklch(0.20 0.03 40);   /* text for t < 0.5 */
  --cell-ink-hi: oklch(1 0 0);          /* text for t >= 0.5 */
  --ramp-a: 0.62;  --ramp-b: 0.70;      /* skip the contrast dead band */
}
@media (prefers-color-scheme: dark) {
  :root { /* CANDLELIT: dark wood, pale ink, ember -> blood-red ramp (brightness = intensity) */
    --paper:      oklch(0.20 0.018 55);  /* #1d140e */
    --surface:    oklch(0.245 0.022 55); /* #291e16 */
    --ink:        oklch(0.91 0.03 85);   /* 13.9:1 */
    --ink-muted:  oklch(0.76 0.03 75);   /* 7.6:1 on surface */
    --rule:       oklch(0.85 0.05 80);   /* 11.5:1 */
    --accent:     oklch(0.80 0.11 80);   /* candle gold, 9.6:1 */
    --miss-bg:    oklch(0.29 0.006 70);
    --miss-ink:   oklch(0.72 0.01 70);   /* 5.7:1 */
    --heat-lo:    oklch(0.34 0.075 32);  /* #58271e dim maroon */
    --heat-hi:    oklch(0.70 0.17 27);   /* #f66d62 bright blood-red */
    --cell-ink-lo: oklch(0.95 0.02 85);  /* pale text on dark low end */
    --cell-ink-hi: oklch(0.16 0.02 40);  /* dark text on bright high end */
    --ramp-a: 0.56;  --ramp-b: 0.72;
  }
}
/* JS sets --t in [0,1] and adds .hi when t >= 0.5. CSS remaps t -> s, skipping (ramp-a, ramp-b). */
td.h     { --s: calc(var(--t) * 2 * var(--ramp-a));
           background: color-mix(in oklch, var(--heat-hi) calc(var(--s) * 100%), var(--heat-lo));
           color: var(--cell-ink-lo); }
td.h.hi  { --s: calc(var(--ramp-b) + (var(--t) - 0.5) * 2 * (1 - var(--ramp-b))); color: var(--cell-ink-hi); }
td.m     { background: repeating-linear-gradient(135deg, var(--miss-bg) 0 4px,
             color-mix(in oklch, var(--miss-bg) 85%, var(--ink)) 4px 5px);
           color: var(--miss-ink); }                           /* differs in kind: grey + hatch + muted 0 */
tr.threshold > * { box-shadow: inset 0 3px 0 0 var(--rule); }   /* no layout shift */
tr.crit > th, tr.crit > td { box-shadow: inset 0 -2px 0 0 var(--accent); }
[hidden] { display: none !important; }
```

Measured worst-case text contrast with this remap: light theme at least **4.60:1** (at t = 0.5), 14.7:1 at t = 0 and 9.2:1 at t = 1. Dark theme at least **4.60:1**, 10.5:1 at t = 0 and 6.8:1 at t = 1. Without the remap, a plain continuous ramp drops to about 2.9:1 near t = 0.5 in light mode and about 3.0:1 in dark mode. The remap causes a visible step at t = 0.5 (half of max damage). That step coincides with the text flip and reads as a band boundary. If the planner prefers a perfectly continuous ramp, set `--ramp-a` and `--ramp-b` to 0.5. That still passes at both ends (the letter of the discretion clause) but fails mid-ramp.

Miss vs lowest hit: `--miss-bg` against `--heat-lo` is only about 1.2:1 in luminance. They are told apart by hue (neutral grey vs rose), the hatch, and muted `0` text, which is what D-09 asks for. Phase 4 finishes the non-color encoding.

Legend (TABLE-05): render five sample cells using the same `td.h` / `td.h.hi` classes at t = 0, .25, .5, .75, 1 (labelled with the damage values those t map to), one `td.m` swatch labelled "miss (0)", and a crit-row swatch. It uses the real classes, so it can never drift from the table.

### Pattern 7: Self-test block and `?test` panel (RULES-08)

```javascript
// <script id="dice-selftest">  -- DOM-free: runs identically in Node vm
const SelfTest = (() => {
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const t0 = now(), results = [];
  const check = (name, actual, expected, tol = 1e-9) => {
    const ok = typeof expected === 'number' && typeof actual === 'number'
      ? Math.abs(actual - expected) <= tol : Object.is(actual, expected);
    results.push({ name, ok, actual, expected });
  };
  try {
    const S = (ac, atk, die, dmg) => DiceMath.stats({ ac, atk, die, dmg });
    check('AC15 +5 hit chance = 55%', S(15, 5, 8, 0).pHit, 0.55);
    // ... full list in "Self-Test Assertion Set" ...
  } catch (err) {
    results.push({ name: 'self-test crashed: ' + (err && err.message), ok: false });
  }
  const failed = results.filter((r) => !r.ok);
  for (const f of failed) console.error('SELFTEST FAIL:', f.name, '| got', f.actual, '| expected', f.expected);
  const ms = (now() - t0).toFixed(1);
  console.info(`SELFTEST ${failed.length ? 'FAILED' : 'PASSED'}: ${results.length - failed.length}/${results.length} (${ms} ms)`);
  return Object.freeze({ results, passed: results.length - failed.length, failed: failed.length, ms });
})();
```

- `#app` shows the panel: `if (new URLSearchParams(location.search).has('test')) showSelfTestPanel(SelfTest)`. This was verified on `file:///…/index.html?test`, where `location.search === '?test'`. [VERIFIED: local headless Chrome]
- The panel is a `<section id="selftest" hidden>` at the top of `<main>`. It shows a summary line ("Self-test: 38/38 passed") with a pass or fail class, and all checks inside a `<details>`. Fill it with `textContent` only.
- Keep the self-test **DOM-free** and without `location`, so Node can run it unchanged.
- If `#dice-math` throws at parse time, later blocks still run (verified), but `DiceMath` is then undefined. The `try/catch` turns that into a visible failure instead of a silent blank. `#app` should also guard against `typeof SelfTest === 'undefined'`.
- **Optional UI smoke (recommended, `?test` only):** after init, `#app` drives the real handler by setting `el.value` and dispatching `new Event('input', {bubbles: true})`. It feeds `''`, `'abc'`, `'99'`, and `'-99'` into the AC and bonus boxes, and clicks the d12 radio. It then asserts that `state` is clamped and that the table has 20 body rows x 12 data cells, restores the defaults, and appends the results to the panel. Synthetic bubbling `input` events do reach a delegated form listener, and rAF output appears in `--dump-dom` (both verified). Use direct `render()` calls, not rAF waits, inside the smoke so it stays synchronous. Keep this out of the plain (non-`?test`) load.

### Anti-Patterns to Avoid

- **Styling cells by `damage === 0`:** use `row.kind`. With D < 0, hits can deal 0.
- **Asserting the closed form or `E(D+1) - E(D) = P(hit)` over the whole control range:** both fail for D <= -2 (verified). Scope them to D >= -1.
- **Writing clamped values back into the focused number box on `input`:** makes two-digit ACs impossible to type.
- **`window.DiceMath`:** classic-script `const` is not a window property (verified). Use the bare identifier. In Node, use a shared `vm` context (see Code Examples).
- **Page `max-width` below ~1320 px:** Phase 2 needs about 1280 px for three d12 tables (D-02).
- **`container-type: inline-size` on a shrink-to-fit element** (inline-block, or an auto-width grid item with `justify-items: start`): it collapses to 0 width. Put it on a block wrapper whose width comes from the layout. [ASSUMED: CSS containment behavior]
- **`table-layout: fixed` with `width: auto`:** browsers fall back to auto layout. Give the table an explicit width, e.g. `calc(var(--rowhead) + var(--cols) * var(--cell) + var(--note))`. [ASSUMED: CSS 2.1 §17.5.2 behavior]
- **Controls inside a container that `innerHTML` rebuilds:** loses focus mid-typing. Only the `<thead>` and `<tbody>` of the table are rebuilt.

## Table Legibility Budget (TABLE-06, D-18, feeds CMP-05)

Maximum cell value is 2 x 12 + 20 = 44, so values are always at most 2 digits.

| Container width (table wrapper) | `--cell` (width) | Row height | Cell font | Row header | Note column | d12 table width |
|---|---|---|---|---|---|---|
| ≥ 40rem (Phase 1 single table on a laptop) | 2.5rem (40px) | 1.75rem (28px) | 0.875rem (14px) | 2.75rem | 8rem | 12x40 + 44 + 128 ≈ **652px** |
| 24-40rem (**Phase 2 three-up at 1366px**) | 1.625rem (26px) | 1.375rem (22px) | 0.75rem (12px) | 2rem | 4.5rem | 12x26 + 32 + 72 ≈ **416px** |
| < 24rem (phones) | 1.375rem (22px) | 1.25rem (20px) | 0.6875rem (11px) | 1.75rem | 3rem (short labels) | 12x22 + 28 + 48 ≈ **340px** |

- Phase 2 budget at 1366px: viewport 1366, minus about 17px of scrollbar, minus 2 x 16px of padding, gives about 1317px of content. Three tracks at `minmax(min(100%, 26rem), 1fr)` with 1rem gaps take 3 x 416 + 32 = 1280px, which fits. Page padding must stay at most about 1.25rem per side, and there must be no max-width cap below that.
- Use **container queries** (on `.table-wrap { container-type: inline-size }`) for the tiers, not media queries. In Phase 2 the table's width depends on its grid track. Use media queries only for `prefers-color-scheme`.
- Wrap each table in `overflow-x: auto` as a last resort, so the page itself never scrolls horizontally (CMP-05).
- The corner cell reads `d20 \ d8`. Column headers show 1..X. Row headers show 1..20 ascending (TABLE-01). Height for 20 rows x 28px plus the header is about 600px, so the table scrolls below the fold on a 768px-tall laptop. That is expected, since the layout is not sticky (D-01).
- These sizes are [ASSUMED] comfortable. The executor should eyeball d12 at 1366px (DevTools responsive mode) once, in both color schemes.

## Self-Test Assertion Set

All expected values below were produced by the prototype engine in this session (Node 24.15.0). Values marked † are listed in RULES-08 or ROADMAP success criterion 3.

| # | Group | Check | Expected |
|---|-------|-------|----------|
| 1 | Hit | AC 15, +5: `pHit` † | 0.55 (11 faces) |
| 2 | Hit | AC 25, +0: `pHit` † | 0.05 |
| 3 | Hit | AC 10, +20: `pHit` (nat 1 still misses) | 0.95 |
| 4 | Hit | AC 15, +12 / +13: `hitFaces` | 18 / 19 (cap at atk = AC - 2) |
| 5 | Hit | AC 25, +5 / +6: `hitFaces` | 1 / 2 (floor ends at atk = AC - 19) |
| 6 | Hit | AC 30, -5 / AC 10, -5: `pHit` | 0.05 / 0.30 |
| 7 | Hit | `threshold`: AC15+5 / AC10+20 / AC25+0 | 10 / 2 / 20 |
| 8 | Numeric | `DiceMath.stats({ac:'15',atk:5,die:8,dmg:0})` throws TypeError | true |
| 9 | Table | AC10 +20 d8: row 1 kind `fumble`, all cells 0 | true |
| 10 | Table | AC25 +0 d8: row 20 cells = [2,4,…,16]; rows 2-19 all 0 | true |
| 11 | Crit | AC15 +5 d8 D+3: row 20, face 5 | 13 (not 16) |
| 12 | Table | Every die: 20 rows x `die` cells | true |
| 13 | Floor | AC15 +5 d4 D-5: min cell >= 0; row 10 face 1 is 0 with kind `hit` | true |
| 14 | E | AC15 +0 d8 D0: `e20` † | 31.5 |
| 15 | E | AC15 +5 d8 D0: `e20` † | 54.0 |
| 16 | E | AC15+5 d8 D3 / AC25+0 d12 / AC18+3 d6 D2 / AC10+20 d12 D5 / AC25+0 d4 | 87 / 13 / 36.5 / 225 / 5 |
| 17 | E (floor) | AC15 +5 d6 D-2 → `e20` (closed form would say 20, which is wrong) | 21.6667 (65/3) |
| 18 | E (floor, true 2dX crit) | AC15 +5 d4 D-5 / D-3 → `e20` | 0.625 / 4.5625 |
| 19 | Cross-check | Coarse grid, D >= -1: `abs(perRound - closedFormPerRound) < 1e-9` | all pass |
| 20 | Cross-check | Coarse grid, D >= -2: `tableSum * die === e20Num` (display equals truth) | all pass |
| 21 | Marginal † | Coarse grid, D >= -1: `stats(D+1).perRound - stats(D).perRound === pHit` (tol 1e-9) | all pass |
| 22 | Sweep † | `sweep(p).attack[0] === sweep(p).damage[0]` for sample p | true |
| 23 | Clamp | Coarse grid: `0.05 <= pHit <= 0.95` | all pass |
| 24 | Marginal | AC15 +5 d8 D0: `hitNum/den` and `dmgNum/den` (20-round deltas) | 4.5 and 11 |
| 25 | Marginal | AC15 +13: hit 0, reason `cap`. AC25 +4: hit 0, reason `floor`. AC25 +5: hit 4.5 | as stated |
| 26 | Format | `computeView` defaults: `e20Text` "54.0", `perRoundText` "2.700", `hitPct` 55 | exact strings |
| 27 | Format | AC15+0 d8: "31.5" / "1.575". AC15+5 d6 D-2: "21.7" / "1.085" | exact strings |
| 28 | Format (STAT-02) | Coarse grid: `VM.fixed(Math.round(Number(perRoundText) * 200), 1) === e20Text` | all pass |
| 29 | Parse | `parseControl('ac','',15)` → 15; `'abc'` → 15; `'99'` → 30; `'2.6'` (atk) → 3; `'1e1'` (atk) → 10; `' 12 '` (atk) → 12; `'-99'` (atk) → -5 | as stated |
| 30 | Parse | die `'7'` → prev; die `'12'` → 12; result `typeof` is `'number'` | as stated |

**Coarse grid for the in-page run:** AC {10, 15, 20, 25, 30} x all 5 dice x atk {-5, 0, 5, 13, 20} x dmg {-5, -3, -2, -1, 0, 3, 20} is 875 combos. That took about 94 ms in cold Node including marginals and table builds, which is too slow for every load. Trim it (e.g. dmg {-5, -2, -1, 0, 3, 20}, marginal checks only on a D >= -1 subset) and log the elapsed ms. Target under 30 ms. The **full** domain (70,980 combos, about 1.7 s for `stats` alone) belongs in the optional Node check only.

## Deployment Runbook (DEPLOY-02, DEPLOY-03)

All commands are for the executor's **Git Bash** tool. Each Bash call starts in a fresh cwd, so every command `cd`s explicitly and uses explicit `repos/$OWNER/$REPO` paths, not the `{owner}/{repo}` placeholders, which need cwd inside the repo. Shell variables do not persist between calls, so re-derive `GH`, `OWNER`, and `REPO` in each call.

```bash
# --- Step 0 (executor, anytime): local prep ---
cd /c/Projects/GameDesignSkills/DnD-CombatRollSimulator
git branch -m master main                         # local is on 'master' (system init.defaultBranch=master)
: > .nojekyll                                     # empty file
# README.md written after OWNER is known (step 3) so the URL is real

# --- Step 1 (executor): install gh. MSI may raise a UAC prompt on the user's desktop ---
winget install --id GitHub.cli --source winget --exact --silent --accept-package-agreements --accept-source-agreements
GH="/c/Program Files/GitHub CLI/gh.exe"; "$GH" --version   # absolute path: this shell's PATH predates the install

# --- Step 2 (HUMAN CHECKPOINT, the only one): in a NEW terminal window ---
#   gh auth login --hostname github.com --git-protocol https --web
#   (answer Yes to "Authenticate Git with your GitHub credentials?")
# Resume signal: "authed"

# --- Step 3 (executor): confirm auth, wire git, learn owner ---
GH="/c/Program Files/GitHub CLI/gh.exe"
"$GH" auth status && "$GH" auth setup-git
OWNER=$("$GH" api user -q .login); REPO=DnD-CombatRollSimulator; echo "$OWNER"
URL_GUESS="https://$(echo "$OWNER" | tr 'A-Z' 'a-z').github.io/$REPO/"    # write into README, commit

# --- Step 4 (executor): create public repo (idempotent), push main explicitly ---
cd /c/Projects/GameDesignSkills/DnD-CombatRollSimulator
GH="/c/Program Files/GitHub CLI/gh.exe"; OWNER=$("$GH" api user -q .login); REPO=DnD-CombatRollSimulator
if "$GH" repo view "$OWNER/$REPO" >/dev/null 2>&1; then echo "REPO EXISTS - stop and check"; else
  "$GH" repo create "$REPO" --public --source=. --remote=origin \
     --description "D&D 5e attack roll anatomy: d20 vs AC x damage die, +hit vs +damage"; fi
git push -u origin main                        # explicit: gh docs don't say which branch --push sends
"$GH" repo view "$OWNER/$REPO" --json defaultBranchRef,visibility -q '.defaultBranchRef.name + " " + .visibility'   # expect: main PUBLIC

# --- Step 5 (executor): enable Pages (POST; on 409 already-exists, PUT) ---
"$GH" api -X POST "repos/$OWNER/$REPO/pages" -f build_type=legacy -f "source[branch]=main" -f "source[path]=/" \
 || "$GH" api -X PUT "repos/$OWNER/$REPO/pages" -f build_type=legacy -f "source[branch]=main" -f "source[path]=/"
URL=$("$GH" api "repos/$OWNER/$REPO/pages" -q .html_url); echo "$URL"   # trust this over URL_GUESS
"$GH" repo edit "$OWNER/$REPO" --homepage "$URL"

# --- Step 6 (executor): poll up to 10 min (run in background or in <=5-min chunks; tool timeout is 10 min) ---
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$URL")
  b=$("$GH" api "repos/$OWNER/$REPO/pages/builds/latest" -q .status 2>/dev/null)
  echo "try $i http=$code build=${b:-none}"; [ "$code" = 200 ] && break; sleep 15
done
curl -s "$URL" | grep -c 'id="dice-math"'    # expect 1: the served file is ours
```

Facts behind the runbook:
- `POST /repos/{owner}/{repo}/pages` takes `build_type` (`legacy` or `workflow`) and `source.branch`/`source.path` (`/` or `/docs`). It returns 201 on success, 409 on conflict, and 422 on validation errors. PUT returns 204. `GET …/pages` `status` is one of `built`, `building`, `errored`, or null. [CITED: docs.github.com/en/rest/pages/pages]
- **Git Bash path conversion:** `"source[path]=/"` passes through unchanged, but a bare `"/"` argument becomes `C:/Program Files/Git/`. If an argument ever starts with `/`, prefix the command with `MSYS_NO_PATHCONV=1`. [VERIFIED: local test with node argv]
- `gh auth login` stores the token "securely in the system credential store" (Windows Credential Manager), falling back to a plain-text file. So a login done in the user's terminal should be visible to the executor's process. [CITED: cli.github.com/manual/gh_auth_login; cross-process visibility ASSUMED]
- `gh repo create --push` docs do not state which branch is pushed [CITED: cli.github.com/manual/gh_repo_create]. Hence the explicit `git push -u origin main`.
- If the README URL guess differs from `html_url`, fix the README and push again. The Pages rebuild picks it up.
- `core.autocrlf=true` on this machine. HTML is committed with LF, which is harmless.
- `.planning/config.json` has an uncommitted modification. Commit or leave it before the first push, but don't let it block the push.

### Headless verification (local file and live URL)

```bash
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
PROF="$(cygpath -w "$SCRATCH/chrome-prof")"          # always a throwaway profile (avoids the user's running Chrome)
TARGET="file:///C:/Projects/GameDesignSkills/DnD-CombatRollSimulator/index.html?test"   # or "$URL?test"
"$CH" --headless=new --disable-gpu --no-first-run --user-data-dir="$PROF" \
      --enable-logging=stderr --v=0 --virtual-time-budget=3000 --dump-dom "$TARGET" > dom.html 2> console.txt
grep -q 'SELFTEST PASSED' console.txt && echo "selftest ok"
grep -E 'Uncaught|SELFTEST FAIL|Content Security Policy|cannot be parsed' console.txt && echo "CONSOLE PROBLEMS" || echo "console clean"
grep -o '<th scope="row">' dom.html | wc -l          # expect 20
```

Every console level (error, warn, info, uncaught) shows up in stderr as `INFO:CONSOLE:<line>] "<message>"`, so grep by message text, not by level. [VERIFIED: local] Run the same command without `?test` to confirm the panel stays hidden while the console still shows `SELFTEST PASSED`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Decimal formatting | `toFixed` on floats | Integer-scaled `VM.fixed(n, d)` | `(1.575).toFixed(2) === "1.57"` (verified) would break STAT-02 |
| Hit probability | Closed-form `(21 + A - C)/20` in the UI | Count faces through `outcome()` | Off-by-one and clamp bugs (PITFALLS 1-2). The closed form is only a test oracle. |
| Test runner / E2E framework | npm, Jest, Puppeteer | In-page `SelfTest` + headless Chrome `--dump-dom` + Node `vm` | Zero installs. All three verified working here. |
| Color math in JS | JS color interpolation, a color library | `color-mix(in oklch)` + CSS remap | Theme-aware for free, and JS only emits `--t` |
| "No external requests" auditing | Manual review only | CSP `<meta>` | The browser blocks and logs violations (verified) |
| Enabling Pages | Clicking in the web UI | `gh api` POST/PUT | Scriptable and verifiable (D-12) |
| Clamping range inputs | Custom slider | Native range | It self-clamps (verified). Only number inputs need the parser. |

**Key insight:** in this domain every "custom" piece is at most about 70 lines. The risk is in exactness at the edges (floor, cap, rounding, string inputs), not in size. Put effort into assertions, not abstractions.

## Common Pitfalls

### Pitfall 1: Zero-damage floor breaks the "textbook" invariants (NEW, verified)
**What goes wrong:** With `dmg` in -5..-1 (allowed by CTRL-03), `dice + D` can go negative. If it isn't clamped, the table shows negative damage and E can go negative (the closed form gives -25 over 20 rounds for AC15 +5 d4 D-5). If it is clamped, three assertions from prior research fail for part of the domain.
**Why it happens:** 5e damage can't go below 0 [CITED: Roll20 / dnd-wiki 5e24 search results, MEDIUM], and `max(0, ·)` is non-linear.
**How to avoid:** `Math.max(0, …)` inside `damageFor` only. Scope assertions: closed form and marginal-dmg for D >= -1, display-equals-true-crit for D >= -2. Show the D <= -3 footnote variant (Open Question 1).
**Warning signs:** a self-test failing only at negative D, a negative cell, or a stat-card E below 0.

### Pitfall 2: `Number('') === 0`
**What goes wrong:** Clearing the attack box silently sets +0 instead of keeping the last value. `parseInt('12abc') === 12` accepts garbage.
**How to avoid:** Check for an empty or whitespace string before `Number()`. Never use `parseInt`. Fall back to `prev` on NaN.

### Pitfall 3: Clamp-on-keystroke makes AC 25 untypeable
**How to avoid:** Pattern 4. Never rewrite the focused number box on `input`, and normalize it on `change` (blur or Enter).

### Pitfall 4: Enter in a number box submits the form and reloads the page
**How to avoid:** `form.addEventListener('submit', e => e.preventDefault())`. Implicit submission is blocked anyway when there is no submit button and more than one field [ASSUMED: HTML spec], but don't rely on it.

### Pitfall 5: `gh` "not found" right after a successful install
**Why it happens:** Claude Code's shells inherit the PATH from when the session started. The MSI adds `C:\Program Files\GitHub CLI` to the machine PATH only for new processes.
**How to avoid:** Call `"/c/Program Files/GitHub CLI/gh.exe"` by absolute path. If it isn't there, search `"/c/Program Files"` and `"$LOCALAPPDATA/Programs"` for `gh.exe`. [ASSUMED: MSI default install dir]

### Pitfall 6: `{owner}/{repo}` placeholders fail from the wrong cwd
**Why it happens:** They resolve from the git remote of the current directory, and the executor's Bash cwd resets between calls.
**How to avoid:** Use explicit `repos/$OWNER/$REPO/...`.

### Pitfall 7: Declaring a deploy failure too early
**Why it happens:** Publishing can take up to 10 minutes [CITED: GitHub Docs, via STACK.md]. Also, `pages/builds/latest` can 404 before the first build exists.
**How to avoid:** Poll for up to 40 x 15 s, treat 404 or none as "not yet", and only fail after the window. The tool timeout is 600 s, so run the poll with `run_in_background` or split it into chunks.

### Pitfall 8: Console noise counted as errors
**Sources:** A favicon 404 on Pages (prevent with `<link rel="icon" href="data:,">`). Writing a non-numeric string into a number input (Chrome logs a warning). CSP violations.
**How to avoid:** Grep the headless console for those strings (see "Headless verification").

### Pitfall 9: `hidden` overridden by a component `display` rule
**How to avoid:** `[hidden] { display: none !important; }` so the `?test` panel stays hidden on normal loads.

### Pitfall 10: Heat domain surprises
**What goes wrong:** With domain [0, 2X + D], normal-hit cells occupy only t ≤ about 0.5, and only the crit row reaches deep crimson. That is honest, but it may look "pale" at defaults (d8: normal 1..8 on a 0..16 scale).
**How to avoid:** Accept this as the recommended default, since it keeps Phase 2's shared scale meaningful. The alternative (max = X + D, crit row saturates at t = 1) is discussed in Open Question 3.

## Code Examples

### Minimal page skeleton (head essentials)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:">
  <link rel="icon" href="data:,">
  <title>D&amp;D Combat Roll Simulator</title>
  <style>/* tokens (Pattern 6), layout, table tiers */</style>
</head>
<body>
  <main>
    <section id="selftest" hidden aria-label="Self-test results"></section>
    <form id="controls" class="strip" novalidate>
      <label>Target AC <input type="range" id="ac-range" data-key="ac" min="10" max="30" step="1"></label>
      <input type="number" id="ac-num" data-key="ac" min="10" max="30" step="1" aria-label="Target AC (exact)">
      <fieldset class="dice"><legend>Damage die</legend>
        <label><input type="radio" name="die" value="4" data-key="die"><span>d4</span></label> <!-- ... d12 -->
      </fieldset>
      <label>Attack bonus <input type="number" data-key="atk" min="-5" max="20" step="1"></label>
      <label>Damage bonus <input type="number" data-key="dmg" min="-5" max="20" step="1"></label>
    </form>
    <section id="stats" class="cards"><!-- 6 cards + marginal readout --></section>
    <section id="tables"><div class="table-wrap"><table id="outcome"><caption></caption><thead></thead><tbody></tbody></table></div></section>
    <aside id="legend"></aside>
    <p id="crit-note" class="footnote"></p>
  </main>
  <script id="dice-math">/* Pattern 1 */</script>
  <script id="view-model">/* Pattern 2 */</script>
  <script id="dice-selftest">/* Pattern 7 */</script>
  <script id="app">/* Patterns 3-5, init(), ?test panel */</script>
</body>
</html>
```

No `value`/`checked` attributes are needed in the markup, because `init()` writes state into the controls (D-04).

### Crit footnote text (TABLE-04)

> \* On a natural 20 you roll the damage die twice and add the bonus once (for a d8: 2d8 + D). Each column here is one die face, so the crit row shows 2 x face + D. Averaged across the row that equals the average of a real 2d8 + D crit, so this table's average is exactly the expected damage.

When `view.critFloorDiffers` is true (D <= -3), append: *"With a damage penalty this large, the 0-damage floor makes the doubled-face shortcut slightly off. The stats above use the real two-dice rule."*

### Optional Node check (`tools/check-engine.mjs`, dev-only)

```javascript
// node tools/check-engine.mjs  -> exit 1 on any failure. Never required for deploy.
import fs from 'node:fs'; import vm from 'node:vm';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const block = (id) => html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)</script>`))[1];
const ctx = vm.createContext({ console, performance });
for (const id of ['dice-math', 'view-model', 'dice-selftest']) vm.runInContext(block(id), ctx, { filename: id });
const st = vm.runInContext('SelfTest', ctx);          // top-level const is shared across runInContext calls (verified)
// optional: full-domain sweep here (70,980 combos, ~1.7 s) using vm.runInContext('DiceMath', ctx)
process.exit(st.failed ? 1 : 0);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Heatmaps via precomputed hex buckets (`.h0`..`.h9`) | `color-mix(in oklch)` driven by a custom property | Baseline widely available 2025-11 | Themes re-tune the ramp with two tokens, and JS emits only `--t` |
| Viewport media queries for component density | Container queries | Baseline widely available 2025-08 | The same table CSS works full-width now and in a third-width track in Phase 2 |
| Puppeteer/Playwright for smoke tests | Chrome `--headless=new` `--dump-dom` + `--enable-logging` | New headless is the default headless mode | Zero-install DOM and console checks (verified on Chrome 153) |
| Pages via web UI | `gh api` REST POST/PUT | Current REST docs | Scriptable and idempotent |

**Deprecated/outdated for this project:** `type="module"` inline script (superseded by D-14). The prior research's control ranges (AC 10-25, bonuses 0..20) are superseded by REQUIREMENTS (AC 10-30, bonuses -5..+20). The negative range is what introduces Pitfall 1.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 5e damage from an attack is floored at 0 (a penalty can't make it negative) | Pattern 1, Pitfall 1 | If the user wants "minimum 1" (3.5e-style) or raw negatives, `damageFor` and the floor-scoped assertions change. Low risk: 0 is the common 5e reading. |
| A2 | winget's GitHub CLI MSI installs to `C:\Program Files\GitHub CLI\gh.exe` and may show a UAC prompt | Runbook step 1, Pitfall 5 | Executor can't find gh (search fallback given), or the install blocks until the user approves UAC. Batch this into the one human checkpoint. |
| A3 | A token stored by `gh auth login` in the user's terminal is visible to the executor's process (same Windows user, Credential Manager) | Runbook step 3 | If not, the executor must ask the user to run the remaining `gh` steps. Low risk. |
| A4 | The executor harness blocks long foreground `sleep` and caps a tool call at 600 s | Runbook step 6, Pitfall 7 | The polling loop may need `run_in_background` or chunking |
| A5 | Real user `input` and `change` events bubble to the form (HTML spec) | Pattern 4 | Delegated listener misses events. Verified for dispatched bubbling events only. |
| A6 | `container-type: inline-size` on a shrink-to-fit element collapses it; `table-layout: fixed` needs a non-auto width | Anti-Patterns | Layout bugs caught by eyeballing at 1366px |
| A7 | The cell-size tiers (40/26/22 px) are comfortable to read | Legibility budget | Tune by eye (explicitly Claude's discretion) |
| A8 | Implicit form submission is blocked with more than one field and no submit button | Pitfall 4 | Mitigated anyway by `preventDefault` on submit |

## Open Questions

1. **Crit convention for the *stats* when the damage penalty is -3 or worse**
   - What we know: for D >= -2, the displayed "2 x face + D" row average equals the true 2dX crit average exactly (verified across all combos). For D in {-5,-4,-3}, the 0-floor makes them differ by up to 0.39 over 20 rounds (d6, D-5: table 5.667 vs true 5.278).
   - What's unclear: RULES-07 says stats are "derived from the outcome table", and TABLE-04's footnote claims "table average = true expected value". Both can't hold for D <= -3.
   - **Recommendation:** stats enumerate the crit row as true 2dX through `damageFor(20, [a, b])`, which is still the outcome space and still the one rule. The self-test asserts display equals truth for D >= -2, and the footnote gets the conditional sentence for D <= -3. The alternative is stats from the displayed table only, which is slightly non-RAW at D <= -3. Either is defensible. Pick one and assert it.

2. **"Average damage on a hit" (STAT-01) definition**
   - Recommendation: the conditional mean E / P(any hit) (4.91 at the defaults), with a sub-line "normal 4.5 · crit 9.0". It's derived from the same integers, and the sub-line ties back to the formula.

3. **Heat ramp domain** (Claude's discretion)
   - Recommendation: [0, 2X + D] (`heatMax` from `computeView`), so Phase 2 can pass one shared max for three tables (CMP-02). Consequence: normal rows are on the light half. Alternative: [0, X + D] with the crit row clamped at t = 1, which gives richer normal rows but a saturated crit row.

4. **Commit `tools/check-engine.mjs`?**
   - Recommendation: yes. It's small, reused by Phases 2-4, harmless if publicly served, and never part of deploy. If the planner wants the repo to contain only site files, run the same code as a one-off `node -e` instead.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| gh CLI | DEPLOY-02/03 | ✗ (not in PATH, not in Program Files) | winget offers 2.101.0 (2026-09-15, WiX MSI) | Install via winget (step 1). The web UI plus `git remote add` is a last resort. |
| winget | gh install | ✓ | v1.29.380 | — |
| git | DEPLOY-02 | ✓ | 2.45.1.windows.1, `credential.helper=manager`, branch `master`, no remote | — |
| Chrome (headless) | Verification | ✓ | 153.0.8010.48 | Edge 153.0.4234.48 (same flags) |
| Node | Optional dev check | ✓ | v24.15.0 | Skip, since the in-page self-test is authoritative |
| Python | Local http preview | ✓ | 3.14.4 | Open the file directly (verified working over `file://`) |
| curl | HTTP 200 check | ✓ | 8.7.1 | `gh api` status plus headless Chrome |
| GitHub account auth | DEPLOY-02/03 | ✗ until the human checkpoint | — | None. The user must run `gh auth login`. |

**Missing dependencies with no fallback:** GitHub authentication (human step, D-13).
**Missing dependencies with fallback:** gh CLI (winget install).

**Planning suggestion (parallelism):** the gh install and auth checkpoint touch no repo files, so they can run as a Wave 1 plan alongside the engine plan. The user then gets the single interruption early, and the final publish plan runs unattended.

## Validation Architecture

`workflow.nyquist_validation` is `false` in `.planning/config.json`, so this is not the Nyquist sampling contract. The orchestrator asked for it, so here is a lightweight map of how the executor verifies each requirement without a test runner.

### Verification tools
| Tool | Command | Runtime |
|------|---------|---------|
| In-page self-test (authoritative) | load `index.html?test` | < 50 ms |
| Headless Chrome check | see "Headless verification" (file:// and live URL) | ~2-4 s |
| Node engine check (optional) | `node tools/check-engine.mjs` | < 2 s |
| Static grep | `grep -nE '(src|href)="https?:|@import|url\(https?:|type="module"' index.html` (expect no matches) | instant |
| Human eyeball (once) | DevTools responsive 1366px, d12, light and dark | 2 min |

### Requirement → verification map
| Req | Check | Type |
|-----|-------|------|
| RULES-01..07 | Self-test rows 1-25 | automated (page + Node) |
| RULES-08 | `SELFTEST PASSED` in headless console; panel text present in `dom.html` for `?test`; panel still `hidden` without `?test` | automated (headless) |
| CTRL-01..03, CTRL-05 | Self-test rows 29-30 + `?test` UI smoke (synthetic input events, clamped state, 20 x 12 cells after d12) | automated (headless) |
| TABLE-01, TABLE-06 | `dom.html`: 20 `<th scope="row">`, X+1 `<th scope="col">` (+ note col), `<caption>` | automated |
| TABLE-02..05 | `dom.html` classes: row 1 `fumble`, the `threshold` row matches `view.threshold`, legend swatches present, footnote text present; color and contrast by eye | automated + manual |
| STAT-01..03 | Self-test rows 24-28; `dom.html` shows "55%", "54.0", "2.700" at defaults | automated |
| DEPLOY-01 | CSP meta present; headless console has no CSP/Uncaught lines on `file://`; static grep shows no external URLs | automated |
| DEPLOY-02 | `gh repo view … -q '.defaultBranchRef.name + " " + .visibility'` = `main PUBLIC`; `git ls-files .nojekyll README.md` lists both | automated |
| DEPLOY-03 | `curl` 200 on `$URL`; body contains `id="dice-math"`; headless run on `$URL?test` passes the same greps | automated |

### Sampling
- **Per engine edit:** reload `?test` headless, or run `node tools/check-engine.mjs`.
- **Per plan:** full headless check on `file://`.
- **Phase gate:** headless check on the live Pages URL with `?test` plus the one-time 1366px eyeball.

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (static page). The deploy uses `gh` browser auth by the user. | Token in the OS credential store. Never echo tokens. |
| V3 Session Management | no | — |
| V4 Access Control | no | Public repo by design (D-11/D-12). `.planning/` is public by accepted decision. |
| V5 Input Validation | yes | `VM.parseControl` (numeric parse, clamp, allow-list for the die). The engine throws on non-integers. |
| V6 Cryptography | no | `Math.random` isn't used in Phase 1 |
| V14 Configuration | yes | CSP `<meta>` (`default-src 'none'`), no third-party origins, `.nojekyll` |

| Threat Pattern | STRIDE | Mitigation |
|----------------|--------|------------|
| DOM XSS via control values into `innerHTML` | Tampering | Only numbers from `state` (already parsed) and fixed label strings reach `innerHTML`. The self-test panel uses `textContent`. |
| Future URL-state injection (INT-04, v2) | Tampering | Out of scope now. If added, parse through `parseControl`, never inject strings. |
| Supply chain (CDN compromise) | Tampering | No external resources, enforced by CSP |
| Leaking credentials in commits or logs | Information disclosure | Never run `gh auth token` or print env. Nothing secret lives in the repo. |

## Sources

### Primary (HIGH confidence)
- Local verification on this machine (2026-09-24): prototype engine run in Node 24.15.0 (70,980-combo sweep, reference values, timing); OKLCH contrast computation; headless Chrome 153 tests of color-mix/calc, classic-script scope, `file://?test`, input sanitization, console capture, CSP blocking, rAF and dump-dom timing; MSYS argv conversion; `winget show GitHub.cli`; git config and branch; Node `vm` shared lexical scope.
- https://docs.github.com/en/rest/pages/pages — POST/PUT/GET Pages parameters and status codes
- https://cli.github.com/manual/gh_auth_login — token storage in the system credential store, `--git-protocol`, `--web`
- https://cli.github.com/manual/gh_repo_create — `--source`, `--remote`, `--push`, `--public`, `--description` (branch pushed not specified)
- https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event — radio/checkbox `input` caveat; programmatic value changes don't fire `input`
- Project research: `.planning/research/ARCHITECTURE.md`, `PITFALLS.md` (reference values), `STACK.md` (deploy commands, Baseline dates), `FEATURES.md` (table UX conventions)

### Secondary (MEDIUM confidence)
- 5e 2024 damage floor at 0: WebSearch results pointing to https://roll20.net/compendium/dnd5e/Rules:Damage%20and%20Healing and https://dnd-wiki.org/wiki/Damage_(5e24). The page bodies could not be fetched (403 / nav-only), so this is the search summary only.

### Tertiary (LOW confidence)
- None relied upon.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. No packages. Every platform feature was exercised in Chrome 153 on this machine.
- Architecture: HIGH. Prior research patterns plus a working prototype engine and view-model math.
- Pitfalls: HIGH for the math, input handling, and console behavior (all reproduced). MEDIUM for gh post-install path and auth-sharing (assumed, with fallbacks).
- Color tokens: HIGH for the computed contrast ratios. Aesthetic fit still needs one look in the browser.

**Research date:** 2026-09-24
**Valid until:** 2026-10-24 (stable platform). Re-check the gh version and Pages API only if the deploy fails.
