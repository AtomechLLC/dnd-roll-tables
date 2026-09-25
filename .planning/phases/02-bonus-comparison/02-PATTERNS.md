# Phase 2: Bonus Comparison - Pattern Map

**Mapped:** 2026-09-25
**Files analyzed:** 9 logical units (7 blocks/sections inside `index.html` + 2 dev tools)
**Analogs found:** 8 / 9 (only the SVG chart renderer and the `<output>` element have no in-repo analog)

The whole app is one file, `index.html` (1,252 lines at mapping time). Each inline block is treated as a "file". All line numbers below refer to the current `index.html` / `tools/*.mjs` and **will shift** as earlier edits land. Executors should re-locate them by the quoted anchor text, not by number.

## File Classification

| New/Modified unit | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `index.html` `<style>` (lines 10-305): `.outcome` retarget, series/band tokens, `#compare` / `.trio` grid, `.chart*` rules | config (stylesheet) | transform (tokens → paint) | `#outcome` tier rules (163-229), `:root` tokens (11-55), `.legend` (252-269) | exact |
| `index.html` markup (lines 385-393): `class="outcome"` on the big table, new `<section id="compare">` and `<section id="chart">` before `</main>` | component (static markup) | request-response (controls → state) | `<form id="controls">` AC group (319-326), `<section id="tables">` (385-392) | exact (except `<output>`, new) |
| `<script id="dice-math">` (399-525): `crossings(a, d)`, `attackBands(p, maxN)` | utility (pure engine) | transform | `sweep` (510-518), `marginals` (485-497) | exact |
| `<script id="view-model">` (527-603): `CONTROL_SPEC.n`, `DEFAULT_STATE.n`, `niceTicks`, `compareView`, `chartView`, `statsView`/`pageView` split | service (view-model) | transform | `CONTROL_SPEC` / `DEFAULT_STATE` (531-537), `computeView` (569-599) | exact |
| `<script id="dice-selftest">` (605-763): Phase 2 assertions | test | batch | `check(...)` sections (673-689, 691-709, 711-722), coarse grid (724-752) | exact |
| `<script id="app">` renderers: generalized `renderTable`, new `renderCompare` | component (renderer) | transform (view → DOM) | `renderTable` (871-892), `renderLegend` / `swatch` / `legendItem` (894-925) | exact |
| `<script id="app">` wiring: second control root, `renderControls` walk, `RENDERERS`, `render()`, `init()` | controller | event-driven | `onControl` (801-807), `renderControls` (809-816), `init` listeners (1235-1245) | exact |
| `<script id="app">` chart: `svgEl`, `linearScale`, `chartInit`, `renderChart`, hover `paintReadout` | component (renderer) | event-driven (pointer) + transform | `renderLegend` (build-with-createElement style) + `scheduleRender` rAF (782-791) | partial (no SVG exists) |
| `<script id="app">` `runUiSmoke()` (997-1203) additions + existing expectation fixes | test | event-driven (synthetic events) | `send(...)` / `show(...)` / `check(...)` in `runUiSmoke` | exact |
| `tools/check-engine.mjs`: invariants (g)-(k), stats cache | test (dev tool) | batch | its own `names` / `record` / `statsAt` cache (53-115) | exact |
| `tools/check-page.mjs`: row-header count 20 → 80 | test (dev tool) | batch | its own line 111-112 | exact |

---

## Pattern Assignments

### 1. `<style>` block (config)

**Analog A: `:root` tokens + dark override** (lines 11-34, 36-55). New series/band tokens go at the end of each `:root` list, same `--name: oklch(...)` shape, one per line, aligned:
```css
      --pass:        oklch(0.45 0.11 145);
      --fail:        oklch(0.47 0.17 27);
      --sp-1: 4px; --sp-2: 8px; --sp-3: 16px; --sp-4: 24px; --sp-5: 32px; --sp-6: 48px;
    }
    /* DARK: candlelit (UI-SPEC Color, D-06). The only theming mechanism; no light-dark(). */
    @media (prefers-color-scheme: dark) {
      :root {
        ...
        --pass:        oklch(0.78 0.13 145);
        --fail:        oklch(0.74 0.15 27);
      }
    }
```
Derived tokens use `color-mix` like `--line` (line 20): `--line: color-mix(in oklch, var(--ink) 20%, var(--paper));`. The proposed `--band: color-mix(in oklch, var(--ink) 8%, var(--paper));` follows it, and it goes **only** in the light `:root`. Like `--line`, it then recomputes from the dark `--ink`/`--paper` automatically, so do not redeclare it in the dark block. Proposed values (RESEARCH §Series tokens): light `--series-hit: oklch(0.45 0.13 255)`, `--series-dmg: oklch(0.47 0.12 50)`; dark `oklch(0.78 0.10 245)`, `oklch(0.78 0.13 55)`.

**Analog B: `#outcome` tier rules, the lines to retarget** (163-229). Replace every `#outcome` selector with `.outcome`. These are the exact current selectors:
```css
    .table-wrap { display: block; container-type: inline-size; overflow-x: auto; }   /* 162, keep */
    #outcome {                                   /* 163 -> .outcome */
      --cell: 40px; --row: 28px; --rowhead: 44px; --note: 128px;
      border-collapse: collapse; table-layout: fixed;
      width: calc(var(--rowhead) + var(--cols, 8) * var(--cell) + var(--note));
      margin: 0; font-size: 0.875rem;
    }
    #outcome caption { ... }                     /* 172 */
    #outcome th, #outcome td { ... }             /* 177 */
    #outcome tr { ... }                          /* 187 */
    #outcome thead th, #outcome tbody th { ... } /* 188 */
    #outcome thead th { ... }                    /* 189 */
    #outcome thead th.corner { ... }             /* 192 */
    #outcome thead th.corner .cd { ... }         /* 196 */
    #outcome thead th.note, #outcome td.note { width: var(--note); }   /* 197 */
    #outcome thead th.note { ... }               /* 198 */
    #outcome td.note { ... }                     /* 199 */
    #outcome tr.fumble th { ... }                /* 203 */
    @container (width < 42rem) {                 /* 210: "mid tier (Phase 2 three-up at 1366px)" */
      #outcome { --cell: 24px; --row: 24px; --rowhead: 32px; --note: 80px; font-size: 0.75rem; }
      #outcome thead th.corner { line-height: var(--row); text-align: center; padding-inline: 0; }
      #outcome thead th.corner .cd { display: none; }
    }
    @container (width < 25rem) {                 /* 215 */
      #outcome { --cell: 20px; --row: 20px; --rowhead: 24px; --note: 64px; font-size: 0.75rem; }
      #outcome .note-th { ... }                  /* 220 */
      #outcome .note-th::after { ... }           /* 224 */
    }
```
Keep the container-query blocks **after** the base rules (comment at 208-209: "Kept after the base table rules so equal-specificity overrides win"). Class-only rules `.h`, `.h.hi`, `.m`, `tr.threshold > *`, `tr.crit > *` (231-249) are already selector-agnostic. Do not touch them.

**New rules: follow the same comment-header + token-only style.** From RESEARCH Pattern 5 / Pitfall 5:
```css
    #compare { container: compare / inline-size; }
    .trio { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--sp-4) var(--sp-3); }
    @container compare (width >= 77rem) { .trio { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    .trio .table-wrap { max-width: calc(42rem - 1px); }   /* compact tables stay mid/narrow tier */
    .chart-wrap { container: chart / inline-size; touch-action: pan-y; }
```
Name the new containers (`compare`, `chart`). The existing unnamed `@container` rules must keep resolving to `.table-wrap` (Pitfall 12). SVG colors are **CSS class rules** (`.series-hit { stroke: var(--series-hit) }`), never `stroke="var(...)"` attributes. The stat-line text under each compact table should reuse the `.footnote` / `.card .sub` recipe (0.75-0.875rem, `--ink-muted`, `font-variant-numeric: tabular-nums`, lines 150, 272-275).

---

### 2. Markup (component, static)

**Analog: AC range control** (lines 320-326). The N control copies its `data-key` / label / hint structure:
```html
      <div class="group">
        <label class="group-label" for="ac-range">Target AC <span class="hint">10 to 30</span></label>
        <div class="pair">
          <input type="range" id="ac-range" data-key="ac" min="10" max="30" step="1">
          <input type="number" id="ac-num" data-key="ac" min="10" max="30" step="1" aria-label="Target AC (exact value)">
        </div>
      </div>
```
The N slider shape is `<form id="compare-controls" class="n-control" novalidate>`, then `<label class="group-label" for="n-range">Compare at +N</label>`, then `<input type="range" id="n-range" data-key="n" min="0" max="20" step="1">`, then `<output id="n-out" for="n-range">+5</output>`. `.pair input[type="range"]` (line 97) styles the slider if it is wrapped in `.pair`.

**Analog: tables section** (lines 385-392), the insertion point:
```html
    <section id="tables">
      <h2>Outcome table</h2>
      <div id="legend" class="legend"></div>
      <div class="table-wrap">
        <table id="outcome"><caption></caption><thead></thead><tbody></tbody></table>   <!-- 389: add class="outcome" -->
      </div>
      <p id="crit-note" class="footnote"></p>
    </section>
  </main>                                                                                <!-- 393: insert new sections above -->
```
Each compact table uses the same empty skeleton: `<div class="table-wrap"><table class="outcome" id="cmp-base"><caption></caption><thead></thead><tbody></tbody></table></div><p class="cmp-stats" id="cmp-base-stats"></p>`. The same goes for `cmp-hit` and `cmp-dmg`. The chart section is `<section id="chart" aria-labelledby="chart-h">`, with `<h2 id="chart-h">`, an HTML legend div, `<div class="chart-wrap"><svg id="sweep" class="chart" viewBox="0 0 640 360" role="img" aria-labelledby="chart-caption"></svg></div>`, `<p id="chart-readout">` (not a live region), and `<p id="chart-caption">`. Use no `width`/`height` attributes on the SVG (RESEARCH A3 gives the fallback if the SVG collapses).

---

### 3. `<script id="dice-math">`: `crossings`, `attackBands` (utility, transform)

**Analog: `sweep` + `marginals`** (lines 485-518). One comment line stating the contract, a plain `function`, integer numerators over `den = die²`, and a plain object return:
```js
  // STAT-03: exact value of the next +1, as 20-round numerators over den = die^2.
  function marginals(p) {
    const base = stats(p).e20Num;
    ...
    let reason = null;
    if (hitNum === 0) {
      if (p.atk >= p.ac - 2) reason = 'cap';                 // already hits on 2+
      else if (p.ac - (p.atk + 1) >= 20) reason = 'floor';   // +1 still leaves only a nat 20
      else reason = 'nodmg';                                 // extra hits deal 0 at this penalty
    }
    return { hitNum, dmgNum, den: p.die * p.die, reason };
  }
  ...
  // +0..+maxN added to attack vs damage (Phase 2 chart; RULES-08 sanity check now).
  function sweep(p, maxN = 20) {
    const attack = [], damage = [];
    for (let n = 0; n <= maxN; n++) {
      attack.push(stats({ ...p, atk: p.atk + n }).e20Num);
      damage.push(stats({ ...p, dmg: p.dmg + n }).e20Num);
    }
    return { attack, damage, den: p.die * p.die };
  }
```
**Current signatures to consume (do not change):** `sweep(p, maxN = 20) → { attack: int[], damage: int[], den }`, `stats(p) → { rows, hitFaces, pHit, pCrit, e20Num, e20Den, e20, perRound, tableSum, threshold }`, `threshold(p) = Math.min(20, Math.max(2, p.ac - p.atk))` (line 438), `outcomeTable(p)` (441).

**Insert after line 518** (`sweep` closing brace). The code bodies are in RESEARCH Pattern 3 (`crossings(a, d)` returning `{ first, list: [{ x, yNum, lastLeadN, flipN, tieN, to }], endTieN }`) and Pattern 3b (`attackBands(p, maxN = 20)` returning `{ floor: [0, fe] | null, cap: [cs, maxN] | null }`). `crossings` takes arrays, not params, so it does not call `assertParams`. `attackBands` reads only `p.ac`/`p.atk`, the same as `threshold`.

**Edit the export list** (lines 520-523):
```js
  return Object.freeze({
    DICE, avg, assertParams, outcome, isHit, damageFor, threshold,
    outcomeTable, stats, closedFormPerRound, marginals, hitAverages, sweep,
  });
```
Append `crossings, attackBands`.

---

### 4. `<script id="view-model">` (service, transform)

**Analog: control spec + defaults** (lines 531-537), the exact current text:
```js
  const CONTROL_SPEC = Object.freeze({
    ac:  Object.freeze({ min: 10, max: 30 }),
    die: Object.freeze({ set: Object.freeze([4, 6, 8, 10, 12]) }),
    atk: Object.freeze({ min: -5, max: 20 }),
    dmg: Object.freeze({ min: -5, max: 20 }),
  });
  const DEFAULT_STATE = Object.freeze({ ac: 15, die: 8, atk: 5, dmg: 0 });   // D-03
```
Add `n:   Object.freeze({ min: 0, max: 20 }),` and `n: 5` in DEFAULT_STATE. `parseControl(key, raw, prev)` (540-554) handles `min/max` specs generically, so it needs no change.

**Analog: `computeView(state)`** (lines 569-599). This is the shape every new view builder copies: build `p` from state, call DiceMath, round once with `tenths`, format with `fixed`, return a flat object of ready-to-print strings:
```js
  function computeView(state) {
    const p = { ac: state.ac, die: state.die, atk: state.atk, dmg: state.dmg };
    const s = DiceMath.stats(p);
    const m = DiceMath.marginals(p);
    const ha = DiceMath.hitAverages(p);
    const e20T = tenths(s.e20Num, s.e20Den);   // STAT-02: round the 20-round figure once,
    ...
    return {
      params: p,
      rows: s.rows,
      threshold: s.threshold,
      ...
      e20Text: fixed(e20T, 1),
      ...
      heatMax: Math.max(1, 2 * X + p.dmg),                      // heat domain [0, crit max]   <- line 596
      critFloorDiffers: s.tableSum * X !== s.e20Num,            // only when dmg <= -3
    };
  }
```
**Required edits:**
- Keep this body as the stats-only view (name it `statsView`, or keep `computeView` and add a separate composed `pageView`). The self-test grid (line 745) and check-engine (line 109) call it per combo and **must not** pull in the sweep (Pitfall 4, +1.4 s per load).
- `compareView(p, n)`: call `DiceMath.stats(p)`, `stats({ ...p, atk: p.atk + n })`, `stats({ ...p, dmg: p.dmg + n })`. `heatMax = Math.max(1, max cell over the three row sets)` (oracle `2X + D + N`). Each table gets `{ rows, threshold, totalText: fixed(t, 1), deltaText }` with `deltaText = fixed(tVariant - tBase, 1)`, the difference of **displayed** tenths (Pitfall 7), signed with `+`.
- `chartView(p, n)`: `DiceMath.sweep(p, CONTROL_SPEC.n.max)`, `DiceMath.crossings(...)`, `DiceMath.attackBands(p, CONTROL_SPEC.n.max)`, `niceTicks(Math.max(a[20], d[20]) / den)`, the caption sentence, and `readout[0..20]` strings (gap = `tenths(a) - tenths(d)`).
- The page view overrides the stats view's `heatMax` with `compare.heatMax` (D-08: the big table and the legend share the domain).

**Formatting helpers to reuse** (lines 556-567, exact signatures):
```js
  function fixed(intScaled, decimals) { ... }          // fixed(1575, 3) -> "1.575"
  const tenths = (num, den) => Math.round((10 * num) / den);
  const signed = (n) => (n < 0 ? '−' + Math.abs(n) : '+' + n);   // U+2212
```
**Export list** (line 601), currently:
```js
  return Object.freeze({ CONTROL_SPEC, DEFAULT_STATE, parseControl, fixed, tenths, signed, computeView });
```
Append `niceTicks, compareView, chartView` and the chosen `statsView`/`pageView` name(s).

---

### 5. `<script id="dice-selftest">` (test, batch)

**Analog: `check` helper and section layout** (lines 611-627):
```js
  const check = (name, actual, expected, tol = 1e-9) => {
    const ok = typeof expected === 'number' && typeof actual === 'number'
      ? Math.abs(actual - expected) <= tol
      : Object.is(actual, expected);
    results.push({ name, ok, actual, expected });
  };
  ...
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  try {
    const S = (ac, atk, die, dmg) => DiceMath.stats({ ac, atk, die, dmg });
    ...
    const V = (ac, atk, die, dmg) => VM.computeView({ ac, atk, die, dmg });   // 627: keep on the stats-only view
```
**Section style to copy** (673-689): a `// Topic (REQ-IDs)` comment, then one `check` per fact, and array results compared with `.join(' ')` strings or `same(...)`:
```js
    // Sweep and marginals (RULES-08, STAT-03)
    const sw = DiceMath.sweep({ ac: 15, atk: 0, die: 8, dmg: 0 });
    check('sweep AC15 +0 d8 D+0: attack[0] === damage[0]', sw.attack[0], sw.damage[0]);
    ...
    const mCap = M(15, 13, 8, 0);
    check('AC15 +13: +1 to hit adds 0, reason cap', mCap.hitNum === 0 && mCap.reason === 'cap', true);
```
**Parser section to extend** (711-722): `const P = VM.parseControl; check('parse ac "" keeps previous 15', P('ac', '', 15), 15);`. Add the `n` cases `P('n','21',5)===20`, `P('n','-1',5)===0`, `P('n','',5)===5`, `P('n','7.4',5)===7`, and `VM.DEFAULT_STATE.n === 5`.

**Coarse-grid analog** (724-752): counters `let nAll = 0, badX = 0`, a nested loop over `ACS × DICE × ATKS × DMGS`, then one aggregated `check(\`grid: ... (${nAll} combos)\`, badX, 0)` per invariant. Add the +hit threshold `=== clamp(C−A−N,2,20)` rule and the displayed delta = displayed variant − displayed base rule here, with N in a small fixed set such as `[0, 5, 20]`. Line 745 `VM.computeView(p)` must stay on the stats-only view.

New Phase 2 sections: "Chart series and crossings (CHART-01..03)", "Bands (CHART-04)", "niceTicks (CHART-02)", "Compare (CMP-02..04)", "Synthetic crossings". Reference values and synthetic arrays are in RESEARCH §Reference Values and Pattern 3 table.

---

### 6. `<script id="app">`: generalized table renderer + `renderCompare` (component, transform)

**Analog: `renderTable(view)`** (lines 871-892), the current full body. It targets the global `tableEl` (line 768):
```js
// Only numbers and fixed label strings reach innerHTML (T-01-01).
function renderTable(view) {
  const { rows, params: p, threshold, heatMax } = view;
  const head = `<tr><th scope="col" class="corner">d20<span class="cd"> \\ d${p.die}</span></th>` +
    Array.from({ length: p.die }, (_, i) => `<th scope="col">${i + 1}</th>`).join('') +
    '<th scope="col" class="note"><span class="vh">Notes</span></th></tr>';
  const body = rows.map((row) => {
    const cls = [row.kind, row.d20 === threshold ? 'threshold' : ''].join(' ').trim();
    const cells = row.cells.map((d) => {
      if (row.kind === 'miss' || row.kind === 'fumble') return '<td class="m">0</td>';
      const t = Math.min(1, d / heatMax);
      return `<td class="h${t >= 0.5 ? ' hi' : ''}" style="--t:${t.toFixed(3)}">${d}</td>`;
    }).join('');
    return `<tr class="${cls}"><th scope="row">${row.d20}</th>${cells}<td class="note">${noteFor(row, threshold)}</td></tr>`;
  }).join('');
  tableEl.style.setProperty('--cols', String(p.die));
  tableEl.tHead.innerHTML = head;
  tableEl.tBodies[0].innerHTML = body;
  tableEl.caption.textContent =
    `Damage dealt for every d20 roll (rows) and d${p.die} face (columns). ` +
    `AC ${p.ac}, attack ${signed(p.atk)}, damage ${signed(p.dmg)}.`;
}
```
**Edit (D-17):** extract the body into `renderOutcomeTable(el, { rows, die, threshold, heatMax, caption })`, replacing `tableEl` with `el` and the caption template with `caption` (set with `textContent`). `renderTable(view)` becomes a one-line wrapper that passes `tableEl` and the existing caption string, so the RENDERERS entry and the Phase 1 caption stay byte-identical. `noteFor(row, threshold)` (861-869) is reused unchanged. It emits `hits on N+` per table, which is how CMP-03's threshold rule shows. The D-04 decision rules out extra classes in the compact tables, so there is no `new-hit` class and no badges.

**Analog: `renderLegend` / `setCard`**, the textContent-only DOM writes for non-numeric text (818-821, 913-925):
```js
function setCard(id, value, sub) {
  statEl(id).textContent = value;
  statEl(id + '-sub').textContent = sub;
}
...
function renderLegend(view) {
  const ramp = document.createElement('span');
  ramp.className = 'ramp';
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    ramp.append(swatch(t >= 0.5 ? 'h hi' : 'h', String(Math.round(t * view.heatMax)), t));
  }
  legendEl.replaceChildren(...);
}
```
`renderCompare(view)` calls `renderOutcomeTable` three times with `view.compare.heatMax`, and sets each `#cmp-*-stats` `<p>` with `textContent`, for example `hits on 5+ · 76.5 over 20 rounds · +22.5 vs baseline`. Element refs are cached at the top of the block like lines 767-775 (`const legendEl = document.getElementById('legend');`). `renderLegend` needs no code change. It reads `view.heatMax`, which the page view now sets to the shared domain.

---

### 7. `<script id="app">`: state wiring (controller, event-driven)

**Analog: state + render loop** (lines 779-795):
```js
const state = {};
const RENDERERS = [renderControls, renderStats, renderTable, renderLegend, renderFootnote];   // 780
let pending = false;
function setState(patch) { Object.assign(state, patch); scheduleRender(); }
function scheduleRender() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => { pending = false; render(); });
}
function render() {
  const view = VM.computeView(state);          // 793: switch to the composed page view
  for (const r of RENDERERS) r(view);
}
```
Append `renderCompare, renderChart` to RENDERERS (after `renderFootnote`, D-02 order). Store `lastView = view` in `render()` and call `paintReadout()` after the loop (RESEARCH Pattern 6).

**Analog: `onControl`** (801-807). It needs no change because it is key-generic:
```js
function onControl(e) {
  const key = e.target.dataset && e.target.dataset.key;
  if (!key) return;
  const v = VM.parseControl(key, e.target.value, state[key]);
  if (v !== state[key]) setState({ [key]: v });
  else scheduleRender();
}
```
**Edit: `renderControls`** (809-816). It currently walks only `#controls` (Pitfall 1):
```js
function renderControls(view) {
  for (const el of form.querySelectorAll('[data-key]')) {      // 810 -> document.querySelectorAll('[data-key]')
    const v = String(state[el.dataset.key]);
    if (el.type === 'radio') { el.checked = el.value === v; continue; }
    if (el === document.activeElement && el.type === 'number') continue;   // never fight the typist
    if (el.value !== v) el.value = v;
  }
}
```
After the loop, add `nOutEl.textContent = signed(state.n);` (the app-level `signed` wrapper, line 799).

**Edit: `init()` listeners** (1235-1245). The inline change handler must become a named `onChange`, and all three listeners must be attached to both roots:
```js
  Object.assign(state, VM.DEFAULT_STATE);
  renderControls();                        // D-04: state -> controls, never the reverse
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('input', onControl);
  form.addEventListener('change', (e) => {
    onControl(e);
    if (e.target.type === 'number' && e.target.dataset.key) {
      e.target.value = String(state[e.target.dataset.key]);   // normalize the committed box
    }
  });
  render();
```
Loop over `[form, document.getElementById('compare-controls')]`. Set `n-range` `min`/`max` from `VM.CONTROL_SPEC.n` here, before `renderControls()` (IN-04: no fifth copy of the domain). Call `chartInit()` here too, after the `engineLoaded()` guard (1224) and before `render()`.

---

### 8. `<script id="app">`: SVG chart + hover (component, event-driven). Partial analog only

There is **no SVG, no `createElementNS`, and no `<output>` in the current file** (grep confirmed). Borrow these pieces:
- **Build-with-DOM-API discipline** from `swatch` / `legendItem` (896-911): create the element, set `className` or attributes, set `textContent`, append. The SVG equivalent is the `svgEl(tag, attrs, text)` helper in RESEARCH §Code Examples. Use `class` attributes plus CSS for color. Never use `innerHTML` for SVG.
- **Update in place with `replaceChildren`** from `renderLegend` (919) for the bands, y-grid, and crossings groups. Build the skeleton once in `chartInit()`. Never rebuild the `<svg>`.
- **rAF coalescing** from `scheduleRender` (787-791): the `hoverPending` flag in RESEARCH Pattern 6 has the same `if (pending) return; pending = true; requestAnimationFrame(...)` shape. Hover must **not** call `setState`/`render()`. `hoverN` lives outside `state`.
- **Lazy VM access** from line 797-799 (`const signed = (n) => VM.signed(n);`): any top-level helper that touches `VM` must stay lazy so a broken VM block cannot crash the app block before the error banner shows.

Geometry constants (viewBox 640×360, plot 64..540 × 28..300), `linearScale` with `.invert`, polyline `points`, band/crossing markup, direct-label de-collision (Pitfall 9), and `pointer-events: all` on the background hit rect (Pitfall 10) are all in RESEARCH Pattern 4 / 6 and §Code Examples.

---

### 9. `runUiSmoke()` additions and required fixes (test, event-driven)

**Analog helpers** (998-1007, 1157):
```js
  const check = (name, actual, expected) => results.push({ name, ok: Object.is(actual, expected), actual, expected });
  const send = (el, value) => {
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  ...
  const show = (patch) => { Object.assign(state, VM.DEFAULT_STATE, patch); render(); };
```
The N slider test copies the AC slider pattern (1047-1050):
```js
    send(acRange, '22');
    render();
    check('AC slider 22 gives AC 22', state.ac, 22);
    check('AC box mirrors the slider ("22")', acNum.value, '22');
```
The layout check copies the width-aware pattern (1180-1184):
```js
    const root = document.documentElement;
    check(`d12: no horizontal page scroll at ${root.clientWidth}px`, root.scrollWidth <= root.clientWidth, true);
    const wrap = tableEl.closest('.table-wrap');
    check('d12: table fits inside its wrapper',
      tableEl.getBoundingClientRect().width <= wrap.getBoundingClientRect().width + 1, true);
```
**Must-edit existing expectation** (1159-1161). The shared heatMax at the default N = 5 turns `0,4,8,12,16` into `0,5,11,16,21`:
```js
    show({});
    check('defaults: legend ramp swatches read 0,4,8,12,16',
      Array.from(legendEl.querySelectorAll('.ramp .swatch.h')).map((s) => s.textContent).join(','), '0,4,8,12,16');
```
Either update the expected string and the name, or pin this check with `show({ n: 0 })`. Every `Object.assign(state, VM.DEFAULT_STATE)` (1010, 1059, 1101, 1115, 1146, 1195) now also resets `n` to 5, which is intended. **Check-name rule (IN-06):** split any literal that also appears in UI text (`'hits on ' + '10+'`, `'95' + '% cap'`, as at 1164, 1135), because check-page `--expect` would otherwise match the panel text.

---

### 10. `tools/check-engine.mjs` (test, batch)

**Analog: its own invariant registry** (53-69):
```js
const names = {
  a: '(a) 0.05 <= pHit <= 0.95',
  ...
  f: '(f) STAT-02: fixed(round(perRoundText * 200), 1) === e20Text',
};
const counts = Object.fromEntries(Object.keys(names).map((k) => [k, 0]));
function record(key, p, detail) {
  counts[key]++;
  if (firstFailures.length < 5) firstFailures.push(`${key} AC${p.ac} atk${p.atk} d${p.die} dmg${p.dmg}: ${detail}`);
}
```
Add keys `g`..`k` (N = 0 equality, crossings ≤ 1 plus an independent count, band ⇔ flat, damage strictly increasing, heatMax oracle). The report loop (119) and pass condition (127-128) pick them up automatically.

**Analog: the memo cache** (75-80). Extend it to a cross-`atk` / cross-`dmg` `Map` keyed `ac,atk,die,dmg` so series are assembled from `e20Num` without calling `DiceMath.sweep` per combo (about 2 minutes otherwise):
```js
      const byDmg = new Map();
      const statsAt = (dmg) => {
        if (!byDmg.has(dmg)) byDmg.set(dmg, DiceMath.stats({ ac, atk, die, dmg }));
        return byDmg.get(dmg);
      };
```
Line 109 `const view = VM.computeView(p);` must keep calling the stats-only view. Cross-check `DiceMath.sweep` on a roughly 1-in-50 sample. The header comment (5-11) should list the new checks.

### 11. `tools/check-page.mjs` (test, batch)

Must edit (lines 9 and 111-112):
```js
//   (3) the DOM has exactly 20 row headers (<th scope="row")
...
const rowHeads = rendered.split('<th scope="row"').length - 1;
check('DOM has 20 <th scope="row"> headers', rowHeads === 20, `found ${rowHeads}`);
```
Change both the comment and the check to 80 (4 tables × 20). No other change is required. `--expect` strings for the axis titles are passed on the command line.

---

## Shared Patterns

### Single parser / single domain (IN-04)
**Source:** `VM.CONTROL_SPEC` + `VM.parseControl` (index.html 531-554)
**Apply to:** the N slider markup min/max (set in `init()`), `sweep(p, CONTROL_SPEC.n.max)`, `attackBands(p, CONTROL_SPEC.n.max)`, the hover clamp in `nFromPointer`. Never hard-code `20` for the N range.

### Exact integer math, format once
**Source:** `VM.tenths` / `VM.fixed` (556-564), STAT-02 comment at 574
**Apply to:** compare totals, deltas (the difference of displayed tenths), readout values and gaps, and the caption. Crossing detection runs on integer numerators, never on `/ den` floats.

### innerHTML only for numeric table cells
**Source:** comment at 871 ("Only numbers and fixed label strings reach innerHTML (T-01-01)") and `noteFor` (861-869, which coerces with `Number(threshold) | 0`)
**Apply to:** `renderOutcomeTable` only. Captions, stats lines, readout, chart caption, and all SVG use `textContent` / `createElement(NS)` / `setAttribute` / `style.setProperty`.

### Heat cell recipe
**Source:** renderTable cells (879-883) + `.h` / `.h.hi` / `.m` CSS (231-244)
**Apply to:** all four tables with the one shared `heatMax`: `t = Math.min(1, d / heatMax)`, class `h` plus `hi` when `t >= 0.5`, `style="--t:${t.toFixed(3)}"`. Miss/fumble cells get `<td class="m">0</td>`.

### Engine-guarded init
**Source:** `engineLoaded()` / `init()` (1208-1247)
**Apply to:** `chartInit()` and any new top-level DOM setup. It runs inside `init()` after the guard. Nothing at the app block's top level may call `VM`/`DiceMath` eagerly (see the comments at 777-778 and 797-798).

### Self-test dual-run
**Source:** `dice-selftest` is DOM-free (606) and run by `tools/check-engine.mjs` via `vm.runInContext` (33-41)
**Apply to:** every new Phase 2 assertion in that block. Use no `document`/`window`, only DiceMath and VM calls, so it passes in Node too. DOM checks go in `runUiSmoke()` only.

## No Analog Found

| Unit | Role | Data Flow | Reason |
|---|---|---|---|
| `svgEl`, `linearScale`, `chartInit`, `renderChart`, hover (`nFromPointer`, `paintReadout`) | component | event-driven | No SVG or pointer handling exists yet. Use RESEARCH Pattern 4 / 6 and §Code Examples, with the DOM discipline from `renderLegend`. |
| `<output id="n-out">` for the N value | component | request-response | No `<output>` exists. The AC control pairs a range with a number box instead. `renderControls` writes it via `textContent` (see §7). |
| ROADMAP.md SC1/SC3 note (RESEARCH Open Question 3) | doc | — | Doc touch-up, no code analog |

## Metadata

**Analog search scope:** `index.html` (all 1,252 lines read), `tools/check-engine.mjs`, `tools/check-page.mjs`, `.planning/phases/01-live-roll-table-deployed/01-REVIEW.md` (IN-04, WR-01, IN-06)
**Files scanned:** 5
**Pattern extraction date:** 2026-09-25
