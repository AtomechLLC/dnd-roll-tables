# Phase 3: Roll-20-Rounds Simulation - Pattern Map

**Mapped:** 2026-09-26
**Files analyzed:** 11 logical units (9 regions inside `index.html` + 2 dev tools). No new files ship.
**Analogs found:** 10 / 11. The only unit with no in-repo analog is the Roll `<button>`, the page's first button. The mulberry32 PRNG has no analog either, but it is copied verbatim from RESEARCH.

The whole app is one file, `index.html` (2,453 lines at mapping time, commit e68273a). Each inline block or CSS/markup region counts as a "file" here. Every line number below is for the current `index.html` / `tools/*.mjs` and **will shift** as earlier plan edits land, so executors should find each spot by the quoted anchor text, not by the number.

Current block map:

| Block | Lines | Anchor |
|---|---|---|
| `<style>` | 10-430 | `:root {` … `footer p { … }` |
| `<main>` markup | 433-564 | `<section id="chart" …>` ends at 563, `</main>` at 564 |
| `<script id="dice-math">` | 570-741 | `const DiceMath = (() => {` |
| `<script id="view-model">` | 743-988 | `const VM = (() => {` |
| `<script id="dice-selftest">` | 990-1456 | `const SelfTest = (() => {` |
| `<script id="app">` | 1458-2451 | `// DOM layer: state, render registry, controls, init, ?test panel.` |

## File Classification

| New/Modified unit | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `<style>`: `#sim` container, `.sim-body`, `.sim-pair`, `.fig*`, `.sim-line`, `.sim-note`, `.btn-roll`, `.sim-log`, `#sim.is-stale …`, `.outcome .roll` / `.swatch.roll` ring + badge | config (stylesheet) | transform (tokens → paint) | `#compare` named container (285-291), `.card` / `.card.focal` / `#stats` subgrid (144-156), `.outcome` table rules (177-194), `.note-th::after` alt-text content (229-233), `.segs input:checked` accent fill (127-128) | exact (button fill is role-match) |
| Markup: `<section id="sim" aria-labelledby="sim-h">` after `#chart` | component (static markup) | request-response (click → run) | `#compare` / `#chart` section heads (519-521, 547-549), `#stats .card` label/value/sub (473-477), `#outcome` empty table skeleton (514) | exact (except `<button>`) |
| `#dice-math`: `DiceMath.spread(p)` + export | utility (pure engine) | transform | `stats(p)` (624-647), export list (736-739) | exact |
| NEW `<script id="dice-sim">`: `Sim = { mulberry32, rollDie, simulate, sameAttack, runMarks }` | utility (pure simulator) | batch (seeded rolls → frozen run record) | `DiceMath` IIFE shell (570-575, 736-741), `outcomeTable` loop (612-622) | role-match (no RNG code exists) |
| `#view-model`: `settingsText`, `simExact`, `simPlacement`, `computeView.simExact`, exports | service (view-model) | transform | `statsView` (788-821), `ruleText` (824), `computeView` (974-981), `chartView` memo (929-934) | exact |
| `#dice-selftest`: `section('sim', …)` | test | batch | `section` helper (1143-1150), `section('cmp', …)` (1155-1166), end block (1450-1454) | exact |
| `#app` renderers: `renderSim`, `renderOutcomeTable` `marks` option, `renderTable` passthrough + caption `.vh` suffix, legend item | component (renderer) | transform (view + sim → DOM) | `renderOutcomeTable` (1589-1617, already has `captionHidden`), `renderCompare` `num()` builder (1631-1649), `setCard` (1536-1539), `renderLegend` / `swatch` / `legendItem` (1837-1868) | exact |
| `#app` wiring: `sim` object, `rollWith`, `onRoll`, `render()` stale/marks derivation, `engineLoaded` + `Sim`, WR-01 guarded `init()` | controller | event-driven | `state` / `setState` / `scheduleRender` / `render` (1483-1504), outside-state `lastView` / `hoverN` (1659-1661), hover rAF coalescing (1742-1751), `engineLoaded` / `init` (2405-2448) | exact |
| `#app` `runUiSmoke()` sim block (last) + reset | test | event-driven (synthetic) | Phase 2 smoke blocks (2141-2158, 2324-2393), final reset (2395-2397), layout checks (2122-2130) | exact |
| `tools/check-engine.mjs`: block list + `Sim` global, static `Math.random` gates, invariants (o)/(p)/(q) | test (dev tool) | batch | its own `block()` / ctx loop (47-70), `names` / `record` (72-102), per-combo loop (104-160), report (271-289) | exact |
| `tools/check-page.mjs`: comment "80 at load", banner-hidden and `#roll`-enabled checks | test (dev tool) | batch | its own row-head check (118-119), selftest-hidden regex (124-126) | exact |

---

## Pattern Assignments

### 1. `<style>` additions (config)

**Insertion point:** after the chart rules, before the self-test panel rules. Anchor: the comment `/* Self-test panel and engine-error banner (UI-SPEC Self-test Panel, States) */` (line 402). Put the `.outcome .roll` rules **after** the `.h` / `.h.hi` / `.m` heat rules (235-249) and the threshold/crit box-shadows (250-254) so source order never lets them lose.

**Analog A: a named section container** (lines 282-291). `#sim` copies this shape: a comment header, a named container, a one-column grid that widens at a container query:
```css
    /* Compare section (D-02, D-07, CMP-05). A named container, so the unnamed table-tier
       queries above keep resolving to each .table-wrap (RESEARCH Pitfall 12). One column,
       or three at >= 77rem (3 x 400px d12 tables + 2 x 16px); never a 2 + 1 layout. */
    #compare { container: compare / inline-size; }
    .trio { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--sp-4) var(--sp-3); }
    @container compare (width >= 77rem) {
      .trio { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
```
New: `#sim { container: sim / inline-size; }`, `.sim-body { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--sp-4); }`, `@container sim (width >= 54rem) { .sim-body { grid-template-columns: minmax(0, 32rem) auto; column-gap: var(--sp-5); align-items: start; } }`, and `@container sim (width < 40rem) { .sim-note { min-height: calc(2 * 1.4em); } }`. The container **must be named** (`sim`), or the unnamed `@container (width < 42rem)` table tiers at 215/220 could resolve against it.

**Analog B: stat cards, the figure pair** (lines 142-156):
```css
    #stats > .card:not(.marginal) { grid-row: span 3; grid-template-rows: subgrid; }
    .card {
      display: grid; gap: var(--sp-2); padding: var(--sp-3); align-content: start;
      background: var(--surface);
      border: 1px solid var(--line); border-radius: 8px;
    }
    .card .label { font-size: 0.875rem; line-height: 1.4; color: var(--ink-muted); }
    .card .value {
      font-family: var(--font-num); font-variant-numeric: tabular-nums;
      font-size: 1.75rem; font-weight: 700; line-height: 1.2; white-space: nowrap;
    }
    .card .sub { font-size: 0.75rem; line-height: 1.4; color: var(--ink-muted); font-variant-numeric: tabular-nums; }
    .card.focal { border-top: 3px solid var(--ink); }
```
Copy these values into `.fig` / `.fig .label` / `.fig .value` / `.fig .foot`. `.fig-exact` = the `.card` + `.card.focal` look (surface fill, 3px ink top rule). `.fig-sim` = `background: var(--paper); border: 1px dashed var(--ink-muted);`. `.sim-pair` = `display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: var(--sp-3); max-width: 32rem;`, with `.fig { grid-row: span 3; grid-template-rows: subgrid; }`, the same technique as line 144. The `.value` span needs `white-space: nowrap` **per part** (`.num`, `.sd`), not on the whole value, so `± 14.2` can wrap on phones (UI-SPEC).

**Analog C: prose lines with bold numbers** (lines 295-298, 308-309):
```css
    .section-intro {
      margin: 0 0 var(--sp-3); max-width: 72ch;
      font-size: 0.875rem; line-height: 1.4; color: var(--ink-muted);
    }
    .cmp-stats { margin: var(--sp-2) 0 0; font-size: 0.875rem; line-height: 1.4; color: var(--ink); }
    .cmp-stats .num { font-family: var(--font-num); font-variant-numeric: tabular-nums; font-weight: 700; }
```
`.sim-line` is Body 16 (`font-size: 1rem; line-height: 1.5; margin: 0; max-width: 72ch;`), and `.sim-line .num` copies `.cmp-stats .num`. The section intro reuses `.section-intro` unchanged.

**Analog D: button fill = checked die segment** (lines 127-128). This is the only accent-filled control, and the button reuses the same token pair and hover mix:
```css
    .segs input:not(:checked) + span:hover { background: color-mix(in oklch, var(--surface) 85%, var(--ink)); }
    .segs input:checked + span { background: var(--accent); color: var(--paper); font-weight: 700; }
```
`.btn-roll`: `background: var(--accent); color: var(--paper); border: 1px solid var(--accent); border-radius: 4px; font: 700 1rem/1.5 var(--font-prose); min-height: 40px; padding: 0 var(--sp-4); width: fit-content; justify-self: start; cursor: pointer; touch-action: manipulation;`. Hover `:hover:not(:disabled)` uses `color-mix(in oklch, var(--accent) 85%, var(--ink))`, and `:active:not(:disabled)` uses 70%. `:disabled` uses `background: var(--surface); color: var(--ink-muted); border-color: var(--line); cursor: not-allowed;`. Focus comes from the global rule at line 109 (`:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`), so add no new focus rule. The 40px height matches `input[type="number"]` (103-108).

**Analog E: `.outcome` table rules, the log table** (lines 177-194):
```css
    .outcome caption {
      caption-side: top; text-align: left;
      font-size: 0.875rem; font-weight: 400; line-height: 1.4; color: var(--ink-muted);
      padding-bottom: var(--sp-2);
    }
    .outcome th, .outcome td {
      font-family: var(--font-num);
      font-variant-numeric: tabular-nums;
      font-weight: 400;
      text-align: center;
      padding: 0;
      height: var(--row);
      line-height: var(--row);
      border: 1px solid var(--line);
    }
    .outcome thead th, .outcome tbody th { background: var(--surface); font-weight: 700; }
```
`.sim-log` copies the structure with its own values: `border-collapse: collapse; table-layout: fixed; width: 296px; background: var(--paper);`, `th, td { height: 24px; line-height: 24px; padding: 0 var(--sp-2); border-bottom: 1px solid var(--line); font-size: 0.875rem; font-family: var(--font-num); font-variant-numeric: tabular-nums; }`, caption 14/700/ink, `thead th` surface fill 700, `tbody th[scope="row"]` 400 with no fill (it differs from `.outcome tbody th` on purpose), `tfoot tr { border-top: 2px solid var(--ink); }`. Column widths are 48/48/64/80/56 via `<col>` or `th:nth-child`. Result-word classes follow `.note-miss` / `.note-crit` (210-212): `miss` → `--ink-muted`, `crit` → `--accent` 700. **Do not** give the log the `outcome` class, or the `.outcome` tier variables and container rules would apply.

**Analog F: pseudo-element with CSS alt text, the mark badge** (lines 225-233):
```css
      .outcome .note-th::after {
        content: attr(data-short) / "";
        display: inline-block; vertical-align: top;
        font-size: 0.75rem; line-height: var(--row);
      }
```
The badge copies this `attr(...) / ""` form but **declares a fallback first** (RESEARCH Pitfall 7):
```css
    .outcome .roll, .swatch.roll { position: relative; }
    .outcome .roll::before, .swatch.roll::before {
      content: ""; position: absolute; inset: 0; pointer-events: none;
      border: 2px solid var(--ink); box-shadow: inset 0 0 0 1px var(--paper);
    }
    .outcome .roll[data-n]::after, .swatch.roll[data-n]::after {
      content: "×" attr(data-n);
      content: "×" attr(data-n) / "";
      position: absolute; top: -6px; left: 50%; translate: -50% 0; z-index: 1;
      height: 12px; min-width: 16px; padding: 0 4px; border-radius: 4px;
      background: var(--ink); color: var(--paper);
      font: 700 12px/12px var(--font-num); font-variant-numeric: tabular-nums;
      text-align: center; white-space: nowrap;
    }
    .outcome tbody tr:first-child .roll[data-n]::after { top: auto; bottom: -6px; }
```
The no-layout-shift discipline comes from lines 250-254 (`tr.threshold > *, .swatch.threshold { box-shadow: … }`, "box-shadows only, so they move by class toggle with no layout shift"). The ring is a `::before` on purpose, so it never overrides those cell `box-shadow`s. The badge uses `translate`, not `transform`, to stay clear of any transform rule. Note the `.swatch.threshold`-style pairing, which lets the legend swatch share the exact table rule.

**Analog G: reserved height, no jump** (lines 371-377, `.readout { … min-height: calc(1.5em + 18px); }`). This is the precedent for `.sim-note`'s `min-height` at narrow widths.

**Stale state:** `#sim.is-stale .fig .value, #sim.is-stale .sim-line, #sim.is-stale .sim-log { color: var(--ink-muted); }`, `#sim.is-stale .fig { border-color: var(--line); }`, `#sim.is-stale .fig-exact { border-top-color: var(--line); }`. **Never use `opacity`** (UI-SPEC A7). No new color tokens. Both themes work through the existing `:root` / dark block (11-60).

---

### 2. Markup: `<section id="sim">` (component, static)

**Insertion point:** between `</section>` of `#chart` (line 563) and `</main>` (line 564).

**Analog: section head** (lines 547-549):
```html
    <section id="chart" aria-labelledby="chart-h">
      <h2 id="chart-h">Bonus sweep, +0 to +20</h2>
      <p class="section-intro">Expected damage over 20 rounds for every extra bonus from +0 to +20, at the settings above. …</p>
```
→ `<section id="sim" aria-labelledby="sim-h">`, `<h2 id="sim-h">20 rounds, rolled for real</h2>`, `<p class="section-intro">…UI-SPEC intro…</p>`.

**Analog: stat card slots** (lines 473-477). The label is static and the value and sub are empty, filled by `textContent`:
```html
      <div class="card">
        <span class="label">Hits on</span>
        <span class="value" id="stat-threshold"></span>
        <span class="sub" id="stat-threshold-sub"></span>
      </div>
```
→ `.fig.fig-exact`: `<span class="label">Expected (exact)</span>`, `<span class="value"><span class="num" id="sim-e"></span> <span class="sd" id="sim-sd"></span></span>`, `<p class="foot">± is one standard deviation, …</p>`. `.fig.fig-sim`: `<span class="label">This run (simulated)</span>`, `<span class="value" id="sim-total"></span>`, `<button type="button" id="roll" class="btn-roll" disabled>Roll 20 rounds</button>`. Static labels are allowed (RESEARCH Open Question 2: `.sim-body` carries `hidden` until init succeeds).

**Analog: empty table skeleton** (line 514):
```html
        <table id="outcome" class="outcome"><caption></caption><thead></thead><tbody></tbody></table>
```
→ `<div class="sim-log-wrap" hidden><table id="sim-log" class="sim-log" aria-describedby="sim-note"><caption></caption><thead>…static header row…</thead><tbody></tbody><tfoot></tfoot></table></div>`. The static `thead` uses `<th scope="col">` only (the abbreviations are `<span aria-hidden="true">Rnd</span><span class="vh">Round</span>`, with `.vh` at 85-88). **`tbody` / `tfoot` stay empty in markup.** No `scope="row"` may appear in the static HTML, or check-page's 80 count breaks.

**Analog: hidden-until-needed slots and the alert region** (lines 434-435): `<section id="selftest" hidden …>` and `<div id="engine-error" role="alert" hidden>`. Copy the `hidden` attribute usage for `#sim-note`, `#sim-now`, `#sim-tally`, and `.sim-log-wrap`. The status region is `<p id="sim-status" class="vh" role="status"></p>`.

**No analog: `<button>`**. It is the page's first button. Use `type="button"` (it must not submit anything) and `disabled` in the markup. No `onclick` attribute: the handler is attached in `init()`.

---

### 3. `#dice-math`: `DiceMath.spread(p)` (utility, transform)

**Analog: `stats(p)`** (lines 624-647). Copy its enumeration: the same loop over rows, the same crit double loop through `damageFor(20, [a, b], p)`, integer numerators, a plain-object return:
```js
  // Exact stats. The 20-round expectation is e20Num / e20Den with e20Den = die^2 (integers).
  // The crit row is enumerated as a true 2dX roll (equals the displayed row whenever dmg >= -2).
  function stats(p) {
    const X = p.die;
    const rows = outcomeTable(p);
    let hitFaces = 0, num = 0, tableSum = 0;
    for (const row of rows) {
      ...
      if (row.kind === 'hit') {
        hitFaces++;
        num += X * rowSum;
      } else if (row.kind === 'crit') {
        hitFaces++;
        for (let a = 1; a <= X; a++) for (let b = 1; b <= X; b++) num += damageFor(20, [a, b], p);
      }
    }
```
`spread(p)` (body in RESEARCH §Code Examples "DiceMath.spread"): it calls `assertParams(p)` (579-585) first, like `outcomeTable` (613), and accumulates `s1 += X*d; s2 += X*d*d` for hit faces and `s1 += d; s2 += d*d` per crit pair. It returns `{ s1, s2, den1, var20Num, var20Den }`. Keep it a **separate** function: do not add `s2` to `stats()`, which the self-test grid and sweep call thousands of times (RESEARCH Alternatives).

**Insert** after `attackBands` (ends at line 734), with a one-line contract comment in the same style as lines 656 / 681 (`// SIM-05, D-05: …`).

**Export list** (lines 736-739), currently:
```js
  return Object.freeze({
    DICE, avg, assertParams, outcome, isHit, damageFor, threshold,
    outcomeTable, stats, closedFormPerRound, marginals, hitAverages, sweep, crossings, attackBands,
  });
```
Append `spread`.

---

### 4. NEW `<script id="dice-sim">` (utility, batch)

**Insertion point:** between `</script>` of `dice-math` (line 741) and `<script id="view-model">` (line 743). The opening tag must be exactly `<script id="dice-sim">` with no other attributes, because check-engine's extractor matches the literal `<script id="${id}">` (check-engine line 48).

**Analog: the `DiceMath` IIFE shell** (lines 570-575 and 736-741):
```js
  <script id="dice-math">
// Pure 5e attack-resolution engine: no DOM, no randomness, no formatting.
// damageFor() is THE rule (RULES-05). Tables, stats, marginals and sweeps all call it.
const DiceMath = (() => {
  'use strict';
  const DICE = Object.freeze([4, 6, 8, 10, 12]);
  ...
  return Object.freeze({ ... });
})();
  </script>
```
Copy it as `const Sim = (() => { 'use strict'; … return Object.freeze({ mulberry32, rollDie, simulate, sameAttack, runMarks }); })();`, with a two-line header comment in the same voice: "The only code that rolls dice. Pure given rng: no DOM, and no Math.random (the app injects it)."

**Analog: the per-round loop that calls the rule functions** (`outcomeTable`, 612-622):
```js
  function outcomeTable(p) {
    assertParams(p);
    const rows = [];
    for (let r = 1; r <= 20; r++) {
      const kind = outcome(r, p.atk, p.ac);
      const cells = [];
      for (let k = 1; k <= p.die; k++) cells.push(damageFor(r, r === 20 ? [k, k] : [k], p));
      rows.push({ d20: r, kind, cells });
    }
    return rows;
  }
```
`simulate(p, rounds, rng)` has the same shape: `DiceMath.assertParams(p)`, a `TypeError` guard on `rng` (same message style as line 582, `` `Sim.simulate: rng must be a function` ``), then per round `DiceMath.outcome` → dice by kind (fixed draw order: d20, then 1 die on hit / 2 on crit / 0 on miss or fumble) → `DiceMath.damageFor(d20, dice, p)`. The full body, `RESULT` map, `sameAttack`, and `runMarks` are in RESEARCH §Code Examples "The `dice-sim` block". `mulberry32` is copied verbatim from there (verified against bryc's source).

**Hard rules:** no `Math.random` anywhere in this block (check-engine static gate). No default value for `rng`. The params copy is `Object.freeze({ ac, die, atk, dmg })`, never `n`.

---

### 5. `#view-model`: `settingsText`, `simExact`, `simPlacement`, `computeView` (service, transform)

**Analog: `statsView`** (lines 788-821). A contract comment, then `p` from state, then DiceMath calls, then rounding **once** with `tenths`, then formatting with `fixed`, then a flat object of print-ready strings:
```js
  function statsView(state) {
    const p = { ac: state.ac, die: state.die, atk: state.atk, dmg: state.dmg };
    const s = DiceMath.stats(p);
    ...
    const e20T = tenths(s.e20Num, s.e20Den);   // STAT-02: round the 20-round figure once,
    ...
    return {
      params: p,
      ...
      e20Text: fixed(e20T, 1),
```
`simExact(p)` uses the **same** `tenths(s.e20Num, s.e20Den)` → `fixed(eT, 1)`, so `eText` equals the "Expected over 20 rounds" card (`view.e20Text`) by construction (STAT-02). SD tenths: `Math.round(10 * Math.sqrt(v.var20Num / v.var20Den))`. Lopsided rule: `eT - sdT < 0 || s.hitFaces === 1` (RESEARCH Pitfall 1 / Open Question 1). Full bodies are in RESEARCH §Code Examples "VM additions". The helpers to reuse have these exact signatures (775-786):
```js
  function fixed(intScaled, decimals) { ... }          // fixed(1575, 3) -> "1.575"
  const tenths = (num, den) => Math.round((10 * num) / den);
  const signed = (n) => (n < 0 ? '−' + Math.abs(n) : '+' + n);   // U+2212
```

**Analog: a one-line copy helper** (`ruleText`, line 824):
```js
  const ruleText = (t) => (t === 2 ? 'hits on 2+ (95% cap)' : t === 20 ? 'only a nat 20 hits' : `hits on ${t}+`);
```
→ `const settingsText = (p) => \`AC ${p.ac}, d${p.die}, ${signed(p.atk)} to hit, ${signed(p.dmg)} damage\`;`. It is used by the rolled-at note, the `Now:` line, and the log caption suffix.

**Optional memo, if profiling shows a need** (`chartView`, 929-934):
```js
  let chartMemo = { key: null, base: null };
  function chartView(p, n) {
    const key = `${p.ac},${p.atk},${p.die},${p.dmg}`;
    if (chartMemo.key !== key) chartMemo = { key, base: chartBase(p) };
    return { n, ...chartMemo.base };
  }
```
`simExact` is O(X²) and cheap, so a memo is not required. If it is added, use this exact one-entry shape.

**Edit `computeView`** (974-981), currently:
```js
  function computeView(state) {
    const p = { ac: state.ac, die: state.die, atk: state.atk, dmg: state.dmg };
    const compare = compareView(p, state.n);
    return { ...statsView(state), heatMax: compare.heatMax, compare, chart: chartView(p, state.n) };
  }
```
Add `simExact: simExact(p)` to the page view **only**. `statsView` must stay sim-free, because the self-test grid (line 1014 `V`) and check-engine (line 157) call it per combo.

**Export list** (983-986): append `settingsText, simExact, simPlacement`.

---

### 6. `#dice-selftest`: `section('sim', …)` (test, batch)

**Insertion point:** after the last `section('cross', …)` closes (line 1448), before `const failed = results.filter(...)` (line 1450).

**Analog: the crash-isolated section helper** (1143-1150), already defined, so reuse it:
```js
  const section = (name, fn) => {
    try { fn(); } catch (err) {
      results.push({ name: name + ' crashed: ' + (err && err.message), ok: false });
    }
  };
```
**Analog: a short section of single-fact checks** (1155-1166):
```js
  // N control (CTRL-04, D-03): one parser, one domain
  section('cmp', () => {
    const P = VM.parseControl;
    check('cmp: parse n "21" clamps to 20', P('n', '21', 5), 20);
    ...
    check('cmp: CONTROL_SPEC.n min 0 and max 20',
      VM.CONTROL_SPEC.n.min === 0 && VM.CONTROL_SPEC.n.max === 20, true);
  });
```
Available helpers: `check(name, actual, expected, tol = 1e-9)` (996-1001), `throwsType(fn)` (1002-1004), and `same(a, b)` (1006). The complete `section('sim', …)` body with pinned values (seed 1 → 47, 5 → 54, 6 → 71, stub rngs, `54.0 ± 14.2`, spread lines, placements) is in RESEARCH §Code Examples "Self-test section". Name prefix `sim: …` gives the UI-SPEC line pattern.

**Constraints:** the block is DOM-free (comment at line 991: "also runs unchanged in Node"), so use only `DiceMath`, `Sim`, and `VM`. Keep the work O(1): no grids and no large samples, because of the 200 ms budget (currently 188-189 ms in Node). Check names that repeat visible UI strings must be split (IN-06). The UI string `About 2 runs in 3 land between 39.8 and 68.2.` is an **expected value**, not a name, so it is fine. Just don't put it in the check name verbatim.

---

### 7. `#app` renderers (component, transform)

**7a. `renderOutcomeTable` gains `marks`.** Analog: itself (lines 1589-1617), current body:
```js
function renderOutcomeTable(el, { rows, die, threshold, heatMax, caption, captionHidden }) {
  const X = Number(die) | 0;
  ...
  const body = rows.map((row) => {
    const cls = [row.kind, row.d20 === threshold ? 'threshold' : ''].join(' ').trim();
    const cells = row.cells.map((d) => {
      if (row.kind === 'miss' || row.kind === 'fumble') return '<td class="m">0</td>';
      const t = Math.min(1, d / heatMax);
      return `<td class="h${t >= 0.5 ? ' hi' : ''}" style="--t:${t.toFixed(3)}">${d}</td>`;
    }).join('');
    return `<tr class="${cls}"><th scope="row">${row.d20}</th>${cells}<td class="note">${noteFor(row, threshold)}</td></tr>`;
  }).join('');
  el.style.setProperty('--cols', String(X));
  el.tHead.innerHTML = head;
  el.tBodies[0].innerHTML = body;
  if (captionHidden === undefined) {
    el.caption.textContent = caption;
  } else {
    const vh = document.createElement('span');
    vh.className = 'vh';
    vh.textContent = captionHidden;
    el.caption.replaceChildren(document.createTextNode(caption), vh);
  }
}
```
Edits (RESEARCH §Code Examples "Marks in `renderOutcomeTable`"): add `marks` to the destructured options, and change `row.cells.map((d) => …)` to `(d, i) =>` so face = `i + 1`. A hit cell gets ` roll` plus `data-n="${n}"` only when n ≥ 2. The row header becomes `<th scope="row" class="roll" data-n="${rn}">` when `rn > 0`, **keeping `scope="row"` first** (check-page counts the literal `<th scope="row"`). Coerce every count with `| 0` before interpolating (T-01-01 rule, the same as `noteFor`'s `Number(threshold) | 0` at 1583). Marks only land on `kind === 'hit'` cells: the miss branch returns early, so crit/miss rows can never get a cell mark (D-12).

**The caption `.vh` suffix is already supported.** `captionHidden` exists (Phase 2 compact tables pass it at 1643), so there is nothing new to build.

**7b. `renderTable` passthrough.** Analog: itself (1619-1627):
```js
function renderTable(view) {
  const p = view.params;
  renderOutcomeTable(tableEl, {
    rows: view.rows, die: p.die, threshold: view.threshold, heatMax: view.heatMax,
    caption: `Damage dealt for every d20 roll (rows) and d${p.die} face (columns). ` +
      `AC ${p.ac}, attack ${signed(p.atk)}, damage ${signed(p.dmg)}.`,
  });
}
```
Add `marks: simCtx.marks` and, only when marks are non-null, `captionHidden: ' Outlined cells and d20 labels show your last roll …'` (UI-SPEC copy). When marks are null, leave `captionHidden` **undefined** so the caption stays byte-identical. The smoke check `cmp ui: study table caption unchanged (D-01)` (2203-2204) depends on that. `renderCompare` (1631-1649) must **not** pass `marks`: the compact-body class whitelist at 2197-2202 has no `roll` in it.

How `simCtx` reaches `renderTable`: either compute it in `render()` and pass it as a second argument (`r(view, simCtx)` in the RENDERERS loop), or stash it in a module-level `let lastSim` the same way `lastView` works (1661, 1502). Both fit existing patterns. The second argument is more explicit.

**7c. `renderSim`: text-only DOM writes.** Analog: `setCard` (1536-1539) and `renderCompare`'s `num()` builder (1631-1647):
```js
function setCard(id, value, sub) {
  statEl(id).textContent = value;
  statEl(id + '-sub').textContent = sub;
}
...
  const num = (text) => {
    const b = document.createElement('b');
    b.className = 'num';
    b.textContent = text;
    return b;
  };
  ...
    const parts = [t.ruleText + ' · ', num(t.totalText), ' over 20 rounds'];
    if (t.deltaText !== null) parts.push(' · ', num(t.deltaText), ' vs baseline');
    cmpEls[key].stats.replaceChildren(...parts);
```
The spread, placement, `Now:`, and tally lines are built as `replaceChildren(text, num(x), text…)` on their own `<p>` (never on an ancestor of `#roll`, RESEARCH Pitfall 5). Hoist `num` to module scope so both renderers share it. The figure values use `textContent` on the inner spans only. The log `tbody` / `tfoot` are the only new `innerHTML` writes (integers plus the fixed words `hit` / `miss` / `crit`, `—`, ` + `). They are rebuilt only when `sim.run.id !== shownRunId` (RESEARCH Pattern 3). Each frame, only toggle `simEl.classList.toggle('is-stale', stale)` and the `hidden` properties, and set the `Now:` text.

**7d. Legend item.** Analog: `renderLegend` (1856-1868) with `swatch` / `legendItem` (1839-1854):
```js
  legendEl.replaceChildren(
    legendItem(ramp, 'Hit damage, low to high (one scale for every table on the page)'),
    legendItem(swatch('m', '0'), 'Miss: always 0, whatever the die shows'),
    legendItem(swatch('h hi crit', '', 1), 'Natural 20: crit, shown as 2 × face + damage bonus*'),
    legendItem(swatch('threshold', ''), 'Rule: first d20 roll that hits'),
  );
```
Append a fifth, always-present item after the threshold item. Its swatch is `swatch('h roll', String(Math.round(0.25 * view.heatMax)), 0.25)` plus `setAttribute('data-n', '2')`, with the UI-SPEC legend text. It sits outside `.ramp`, so the `rampText()` smoke selector `.ramp .swatch.h` (2102) is unaffected.

---

### 8. `#app` wiring: sim state, roll, render, guarded init (controller, event-driven)

**Element refs:** add them to the top cache in the same style (1460-1481), for example `const simEl = document.getElementById('sim');`, `rollBtn`, `simStatusEl`, `simLogEl`, and so on, with a `// Roll-20-rounds section (Phase 3)` comment like lines 1469 and 1478. Never touch `VM` or `Sim` at top level (comment at 1483-1484, and lazy `signed` at 1506-1508).

**Analog: state lives outside `state`** (1659-1661):
```js
// Hover readout (D-13, RESEARCH Pattern 6). The hovered N lives here, never in state: hover
// never calls setState / scheduleRender / render, and nothing on the chart sets N.
let lastView = null, hoverN = null, hoverPending = false;
```
→ `const sim = { run: null, exact: null, tally: [], seq: 0 }; let shownRunId = 0;` with a comment in the same style (the run is an event, not state: `init()` and the smoke do `Object.assign(state, DEFAULT_STATE)`, which would not clear it, and `renderControls` walks `[data-key]`).

**Analog: the render loop** (1485-1504):
```js
const state = {};
const RENDERERS = [renderControls, renderStats, renderTable, renderLegend, renderFootnote, renderCompare,
  renderChart];

let pending = false;
function setState(patch) {
  Object.assign(state, patch);
  scheduleRender();
}
function scheduleRender() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => { pending = false; render(); });
}
function render() {
  const view = VM.computeView(state);
  for (const r of RENDERERS) r(view);
  lastView = view;
  paintReadout();
}
```
Append `renderSim` to RENDERERS (last, matching page order D-01). In `render()`, derive once per frame, before the loop: `const stale = sim.run !== null && !Sim.sameAttack(sim.run.params, view.params); const marks = sim.run && !stale ? Sim.runMarks(sim.run) : null;`. `render()` stays pure over (state, sim): no `Math.random`, and no writes to `sim` or the status region.

**Analog: rAF-deferred write after a user event** (hover, 1744-1751):
```js
  s.addEventListener('pointermove', (e) => {
    ...
    if (hoverPending) return;
    hoverPending = true;
    requestAnimationFrame(() => { hoverPending = false; paintReadout(); });
  });
```
`onRoll` calls `scheduleRender()` (never `render()` directly), then `simStatusEl.textContent = ''` and `requestAnimationFrame(() => { simStatusEl.textContent = msg; })`. `rollWith(rng)` is shared by the click (`Math.random`, the only occurrence in the file) and the UI smoke (seeded). Bodies are in RESEARCH §Code Examples "App: rolling, the tally, the guarded init".

**Analog: engine check** (2405-2416):
```js
function engineLoaded() {
  try {
    return typeof DiceMath !== 'undefined' && typeof VM !== 'undefined' &&
      typeof SelfTest !== 'undefined' &&
      !SelfTest.results.some((r) => r.name.startsWith('self-test crashed'));
  } catch {
    return false;
  }
}
```
Add `typeof Sim !== 'undefined' &&`. Update the comment ("all three pure blocks" → four).

**Analog: `init()`** (2422-2448), current tail:
```js
  nRangeEl.min = String(VM.CONTROL_SPEC.n.min);
  nRangeEl.max = String(VM.CONTROL_SPEC.n.max);
  chartInit();                             // SVG skeleton once, before the first render (D-09)
  Object.assign(state, VM.DEFAULT_STATE);
  renderControls();                        // D-04: state -> controls, never the reverse
  for (const root of [form, compareForm]) {   // two control roots, one handler (Pattern 1)
    root.addEventListener('submit', (e) => e.preventDefault());
    root.addEventListener('input', onControl);
    root.addEventListener('change', onChange);
  }
  render();
  if (testMode) showSelfTestPanel(SelfTest, runUiSmoke());
```
WR-01 edit: wrap `chartInit()` … `render()` in `try { … rollBtn.addEventListener('click', onRoll); render(); simBodyEl.hidden = false; rollBtn.disabled = false; } catch (err) { console.error('render failed:', err); <show the same banner text as lines 2427-2429>; if (testMode) showSelfTestPanel(…); return; }`. Factor the banner lines (2425-2429) into a `showEngineError()` helper so both paths share the split-literal sentence. `rollBtn.disabled = false` must be the **last** statement inside `try`.

---

### 9. `runUiSmoke()` sim block (test, event-driven)

**Insertion point:** a new `try { … } catch` block **after** the `cross ui` block (ends at 2393) and **before** the final reset (2395-2397). It must run last (RESEARCH Pitfall 4).

**Analog: a Phase 2 smoke block** (2141-2158, 2327-2339):
```js
  // Phase 2 compare section (CTRL-04, CMP-01..05). Check names avoid the displayed strings
  // (IN-06) so check-page --expect can only match the real section.
  try {
    const show = (patch) => { Object.assign(state, VM.DEFAULT_STATE, patch); render(); };
    const nRange = document.getElementById('n-range');
    ...
    send(nRange, '12');
    render();
    check('cmp ui: slider 12 gives n 12', state.n, 12);
    ...
  } catch (err) {
    results.push({ name: 'chart ui smoke crashed: ' + (err && err.message), ok: false });
  }
```
Helpers in scope: `check(name, actual, expected)` (1944), `send(el, value)` (1947-1950), `acRange` / `acNum` (1945-1946), and the `rowOf(n)` pattern (2096: `tableEl.tBodies[0].rows[n - 1]`). Seeded roll: `rollWith(Sim.mulberry32(6)); render();`, then assert `#outcome .roll` = 15, `[data-n]` = 8, and so on (RESEARCH seed-6 row). Staleness: `send(acRange, '16'); render();` → `simEl.classList.contains('is-stale')` and 0 `.roll`. `send(nRange, …)` must keep the run fresh. The layout check copies 2126-2130 (`root.scrollWidth <= root.clientWidth`).

**Mandatory reset at the end of the block** (RESEARCH Pitfall 3): `sim.run = null; sim.exact = null; sim.tally = []; shownRunId = 0;`, then let the existing final reset run:
```js
  Object.assign(state, VM.DEFAULT_STATE);
  renderControls();
  render();
```
`renderSim` must empty `tbody` / `tfoot` and re-hide the log / note / tally when `run === null`. Otherwise the DOM dump shows 101 `<th scope="row"`.

---

### 10. `tools/check-engine.mjs` (test, batch)

**Analog: block list + globals** (lines 53-70):
```js
const ctx = vm.createContext({ console, performance });
for (const id of ['dice-math', 'view-model', 'dice-selftest']) {
  ...
}
let SelfTest, DiceMath, VM;
try {
  SelfTest = vm.runInContext('SelfTest', ctx);
  DiceMath = vm.runInContext('DiceMath', ctx);
  VM = vm.runInContext('VM', ctx);
```
→ `['dice-math', 'dice-sim', 'view-model', 'dice-selftest']`, `let SelfTest, DiceMath, VM, Sim;`, `Sim = vm.runInContext('Sim', ctx);`. Static gates go right after `html` is read (line 45), using the existing `fail()` (39-42): `block('dice-sim')` contains no `Math.random`, and `html.split('Math.random').length - 1 === 1`.

**Analog: invariant registry** (74-102). Add keys `o` (full-domain spread: `s1 === e20Num`, `var20Num >= 0`, safe-integer bounds, `sdT >= 1`, exact tenths, the lopsided rule), `p` (sampled 20-fold convolution, stride 53, band probabilities), and `q` (seeded 100k-round samples with the z-score tolerance). Wording and formulas are in RESEARCH §Code Examples "check-engine additions". `(o)` goes inside the per-combo loop next to `(f)` (157-159), reusing `s` / `base.st` from `statAt` (131-132) so `stats` is not recomputed. `(p)` uses the `combos % N === 0` sampling idiom (line 237) with 53. `(q)` runs once, after the loop and before the report (around line 269). The report loop (272) and pass condition (282-283) pick up the new keys automatically. Extend the header comment (5-31) to list (o)-(q) and the `dice-sim` block.

---

### 11. `tools/check-page.mjs` (test, batch)

**Edit the comment** (line 9): `//   (3) the DOM has exactly 80 row headers (<th scope="row"): 4 tables x 20 rows` → add "at load; the sim log adds 21 only after a roll". The check at 118-119 keeps `=== 80`.

**Analog for the new DOM-state checks** (124-126):
```js
  check('self-test panel stays hidden', /<section id="selftest"[^>]*hidden/.test(rendered));
```
Add two regex checks on `rendered` (RESEARCH Pitfall 6), in both modes:
- `check('engine-error banner stays hidden', /<div id="engine-error" role="alert" hidden/.test(rendered));`
- `check('Roll button enabled after init', /<button[^>]*id="roll"[^>]*>/.test(rendered) && !/<button[^>]*id="roll"[^>]*\bdisabled\b/.test(rendered));`

Update the header list (lines 6-13) to number them. A caught `console.error('render failed')` does not match the `bad` regex (114), so these two checks are the only guard.

---

## Shared Patterns

### Exact integer math, format once (STAT-02)
**Source:** `VM.tenths` / `VM.fixed` (index.html 775-783), and the comment at 796 (`// STAT-02: round the 20-round figure once,`)
**Apply to:** `simExact` (E, SD, bounds), `simPlacement` (diff and SD multiple from **displayed** tenths, UI-SPEC A8), the tally's `(expected 54.0)`, and the `Now:` line. Never use `toFixed` on a float for displayed numbers. The one exception is the existing `t.toFixed(3)` for the `--t` style value (1602), which is not displayed.

### Single rule implementation (RULES-05)
**Source:** `DiceMath.outcome` (587-592), `damageFor` (599-606), `assertParams` (578-585)
**Apply to:** `Sim.simulate` (every round) and `DiceMath.spread` (every cell and crit pair). No new hit/miss/floor logic anywhere.

### innerHTML only for integers and fixed words (T-01-01)
**Source:** comment at 1589-1591 and `noteFor`'s `Number(threshold) | 0` (1583)
**Apply to:** the `renderOutcomeTable` marks (`class="roll"`, `data-n` integers) and the log `tbody` / `tfoot`. Everything else (figures, note, spread, placement, `Now:`, tally, caption, status) uses `textContent` / `createElement` / `replaceChildren`. The non-comment `.innerHTML =` count goes from 2 to 4.

### Crash-isolated test sections
**Source:** `section(name, fn)` in the self-test (1143-1150) and a `try { … } catch (err) { results.push({ name: '… smoke crashed: ' … }) }` per smoke block (2137-2139, 2320-2322, 2391-2393)
**Apply to:** `section('sim', …)` and the new sim smoke block. A crash there must never read as `self-test crashed`, which would trip `engineLoaded()`.

### Split literals in check names (IN-06)
**Source:** smoke names such as `'auto-' + 'miss'` (2111), `'+' + '5'` (2151), and the banner's split sentence (2427)
**Apply to:** every sim check whose name or expected string equals visible copy (`Not rolled yet`, `Expected (exact)`, `Roll 20 rounds`, the spread line), so check-page `--expect` can only match the real section.

### Lazy engine access in the app block
**Source:** comments at 1483-1484 and 1506-1508 (`const signed = (n) => VM.signed(n);`)
**Apply to:** the new top-level `sim` object and element refs. No top-level `Sim.*`, `VM.*`, or `DiceMath.*` calls. Everything runs inside `init()` / `render()` / handlers, after `engineLoaded()`.

### Engine-guarded init (WR-01 fix)
**Source:** `engineLoaded()` / `init()` (2405-2448)
**Apply to:** the roll button's listener and enablement, `.sim-body` un-hiding, and the first `render()`. All of these go inside the new `try`, and the button is enabled last.

### Class-toggle state, no layout shift
**Source:** `tr.threshold > *` / `tr.crit > *` box-shadows (250-254), `.readout` min-height reservation (371-377)
**Apply to:** `#sim.is-stale` (color and border-color only, no opacity), marks as `::before` / `::after` pseudo-elements, and `.sim-note`'s reserved height.

## No Analog Found

| Unit | Role | Data Flow | Reason |
|---|---|---|---|
| `<button id="roll" class="btn-roll">` | component | event-driven (click) | The page's first `<button>`. Visuals borrow the checked-die-segment accent pair (127-128) and the global focus ring (109). Behavior follows UI-SPEC "Component Contract: Roll Button". |
| `Sim.mulberry32` | utility | transform (seed → stream) | No PRNG exists. Copy it verbatim from RESEARCH §Code Examples. It is pinned by `mulberry32(1)() === 0.6270739405881613`. |
| The role="status" live region written only by a click | component | event-driven | No live region exists yet (`#engine-error` is `role="alert"`, written once). Follow UI-SPEC Accessibility: clear, then write in the next rAF. |

## Metadata

**Analog search scope:** `index.html` (all 6 regions, targeted reads of 10-430, 432-569, 570-760, 774-830, 925-1010, 1136-1172, 1440-1660, 1740-1756, 1836-1882, 1941-1960, 2096-2160, 2195-2206, 2318-2453), `tools/check-engine.mjs` (1-160, 225-289), `tools/check-page.mjs` (full), `02-PATTERNS.md` (structure reference)
**Files scanned:** 3 source files + 4 planning docs
**Pattern extraction date:** 2026-09-26
