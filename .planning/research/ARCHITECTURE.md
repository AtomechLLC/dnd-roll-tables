# Architecture Research

**Domain:** Single-file interactive math visualization (D&D 5e attack-roll probability explorer), vanilla JS, no build step
**Researched:** 2026-09-24
**Confidence:** HIGH for structure and data flow (standard patterns, and the numbers were checked by running the math in Node). MEDIUM for the performance estimates (worked out on paper, not yet timed in a browser).

## Standard Architecture

Small interactive "explorable explanation" pages that don't use a framework mostly share one shape. They have **one state object**, **one pure model function** that turns state into all derived numbers, and **dumb renderers** that turn those numbers into DOM. The only thing that talks to the browser is a small **controls layer** that writes into state and schedules a render. Everything below follows that pattern, adjusted to a single `index.html`.

### System Overview

```
+----------------------------------------------------------------------+
|  DOM INPUT LAYER (only code that reads form controls)                |
|  [AC slider 10..25] [die select 4..12] [atk 0..20] [dmg 0..20] [N]   |
|        \______________ bindControls() ______________/                |
|                         | setState(patch)          [Roll 20] button -+
+-------------------------|-------------------------------------------|+
|  STATE                  v                                            |
|  state = { ac, die, atk, dmg, n }    sim = { result, paramsKey }     |
|                         | scheduleRender()  (rAF-coalesced)          |
+-------------------------|--------------------------------------------+
|  MODEL (pure, no DOM)   v                                            |
|  +------------------------------------------+   +------------------+ |
|  | DiceMath  (the ONLY place rules live)    |<--| Simulator        | |
|  |  isHit . damageFor . outcomeTable        |   | simulate(p,R,rng)| |
|  |  tableStats . expectedPerRound . sweep   |   | uses damageFor() | |
|  |  crossovers                              |   +------------------+ |
|  +--------------------+---------------------+                        |
|                       v                                              |
|  computeView(state) -> view = { tables[3], stats, curves,            |
|                                 crossings, copyValues, maxCell }     |
+-----------------------|----------------------------------------------+
|  RENDER LAYER (view -> DOM; no math, no state writes)                |
|  renderTables | renderChart (SVG) | renderStats | renderCopy | renderSim |
+----------------------------------------------------------------------+
   SelfTest: runs DiceMath/Simulator against known values
             (console always; visible panel on ?test; same checks in Node)
```

Data only flows one way: **controls -> state -> model -> view -> DOM**. Renderers never write to state. Math never touches the DOM. The simulator is the one thing driven by an event rather than recomputed on every change (see Pattern 4).

### Component Responsibilities

| Component | Responsibility | Typical Implementation | Talks to |
|-----------|----------------|------------------------|----------|
| **DiceMath** (math core) | Holds every 5e rule: nat-1 auto-miss, nat-20 auto-hit and crit, hit if `d20 + atk >= ac`, damage per cell, exact expectations, bonus sweeps 0..+20, crossover detection | Frozen namespace object built in an IIFE inside its own `<script id="dice-math">`. Pure functions that take a params object `{ac, die, atk, dmg}`. No DOM, no `Math.random`, no formatting | Nothing. Everything else calls into it |
| **Simulator** | Actually rolls d20 + dX (two dice on a crit) for R rounds and returns per-round records plus a total | `simulate(p, rounds, rng)` in `<script id="dice-sim">`. The `rng` is injected (default `Math.random`, seedable `mulberry32` for tests). Calls `DiceMath.damageFor` so it can't disagree with the table | DiceMath |
| **SelfTest** | Checks DiceMath and the Simulator against hand-verified values and invariants | `<script id="dice-selftest">` that always runs and logs only failures plus a one-line summary to the console. With `?test` in the URL it also shows a visible pass/fail panel | DiceMath, Simulator |
| **State** | Single source of truth for the inputs, plus the last simulation result | A plain `const state = {...}` and a `setState(patch)` that merges, clamps and validates, then calls `scheduleRender()` | Written by Controls, read by computeView |
| **Controls binder** | Turns DOM events into state patches, and on load writes the initial state into the controls | One delegated `input` listener on the controls `<form>`. Uses `data-key` attributes and `Number(el.value)`. Also updates `<output>` labels | State |
| **Scheduler** | Merges many input events into at most one render per frame | `requestAnimationFrame` guarded by a `pending` flag | render() |
| **computeView** | Turns state into everything the page shows, in one place | A pure function that returns a plain object: three tables (baseline, +N hit, +N dmg), stat-card numbers, two 21-point curves, crossing indices, a shared color-scale max, and values for the explanatory text | DiceMath |
| **Renderers** | Turn the view into DOM | `renderTables(view)`, `renderChart(view)`, `renderStats(view)`, `renderCopy(view)`, `renderSim(sim, state)`. Each owns one container element | DOM only |
| **Explanatory copy** | Formulas and the "why" text, with live numbers dropped in | Mostly static HTML in the page, plus `<span data-bind="hitPct">` slots that `renderCopy` fills. Conditional sentences (e.g. "no crossover in 0..+20") are chosen in `computeView`, not built up in the renderer | Renderers |

## Recommended Project Structure

The deliverable is one file. The "structure" is the order of blocks inside it, plus one optional dev-only helper.

```
DnD-CombatRollSimulator/
+-- index.html                     # the entire site (GitHub Pages serves it at /)
|   +-- <style>                    # layout, heat-color classes, crit/miss/fumble row styles, stacking breakpoint
|   +-- <main>                     # static markup: controls form, stat cards, 3 table slots,
|   |                              #   <svg> chart slot, sim panel, explanatory copy with data-bind spans
|   +-- <script id="dice-math">    # 1. pure math core  -> const DiceMath = Object.freeze({...})
|   +-- <script id="dice-sim">     # 2. rng + simulate() (pure given an rng)
|   +-- <script id="dice-selftest"># 3. assertion table; console always, visible panel on ?test
|   +-- <script id="app">          # 4. state, setState, scheduleRender, computeView, render*, bindControls, init
+-- tools/verify-math.mjs          # OPTIONAL dev-only: pulls out #dice-math + #dice-sim + #dice-selftest
|                                  #   and runs them in node:vm (zero deps). Not linked from the page.
+-- README.md
```

### Structure Rationale

- **Several classic `<script>` blocks, not one big block, and not `type="module"`.** Top-level `const` in a classic script lives in the shared global lexical scope, so later blocks can use `DiceMath` directly. Inline module scripts can't import each other, so modules would force everything back into one block and lose the test seam. Classic scripts also work unchanged when the file is opened by double-click (`file://`). Put the scripts at the end of `<body>` so the DOM already exists when `app` runs. No `defer` or `DOMContentLoaded` juggling is needed.
- **The `id` on each script block is the testability seam.** A dev script (or the build agent) can regex out `<script id="dice-math">...</script>` and run it with `vm.runInNewContext(code + "\n;DiceMath", {})`. The return value is the namespace. We checked this on Node v24.15.0. Note that a top-level `const` does *not* show up as a property on the vm context object, so use the return-value trick.
- **Why not a separate `test.html`.** It can't import inline scripts from `index.html`. `fetch('index.html')` fails from `file://` in Chromium. And a second copy of the code can drift. An in-page `?test` mode tests exactly what ships.
- **Math first in the file, app last.** The file order matches the dependency order. A reader meets the rules before the UI.

## Architectural Patterns

### Pattern 1: Rules in exactly one function (`damageFor`)

**What:** One function decides the outcome of a single attack from concrete dice. The outcome table, the exact stats (the average of the table), and the simulator all go through it.
**When to use:** Always. It is the most important boundary on the page.
**Trade-offs:** No real downside. Without it you get three copies of the nat-1/nat-20 logic that disagree at the edges (e.g. AC 10 with +20, where a natural 1 would "hit" if the auto-miss rule were forgotten in one place).

```javascript
const DiceMath = (() => {
  const DICE = [4, 6, 8, 10, 12];
  const avg = (x) => (x + 1) / 2;

  // Single source of truth for the attack rules.
  function isHit(d20, atk, ac) {
    if (d20 === 1) return false;          // natural 1: auto-miss
    if (d20 === 20) return true;          // natural 20: auto-hit
    return d20 + atk >= ac;
  }
  // dieRolls: [k] for a normal hit, [k1, k2] for a crit (dice doubled, flat bonus once)
  function damageFor(d20, dieRolls, p) {
    if (!isHit(d20, p.atk, p.ac)) return 0;
    return dieRolls.reduce((s, k) => s + k, 0) + p.dmg;
  }
  // 20 x die grid. Crit row convention: see note below.
  function outcomeTable(p) {
    const rows = [];
    for (let r = 1; r <= 20; r++) {
      const kind = r === 1 ? 'fumble' : r === 20 ? 'crit' : isHit(r, p.atk, p.ac) ? 'hit' : 'miss';
      const cells = [];
      for (let k = 1; k <= p.die; k++) cells.push(damageFor(r, r === 20 ? [k, k] : [k], p));
      rows.push({ d20: r, kind, weight: 1 / 20, cells });   // weight: hedge for adv/disadv later
    }
    return rows;
  }
  function tableStats(rows, die) {
    let sum = 0, hitRows = 0;
    for (const row of rows) {
      if (row.kind === 'hit' || row.kind === 'crit') hitRows++;
      for (const c of row.cells) sum += c;
    }
    return { pHit: hitRows / 20, pCrit: 1 / 20, perRound: sum / (20 * die), sum }; // sum is an exact integer
  }
  function expectedPerRound(p) {             // closed form from PROJECT.md; drives sweep + cross-check
    let normal = 0;
    for (let r = 2; r <= 19; r++) if (r + p.atk >= p.ac) normal++;
    return (normal / 20) * (avg(p.die) + p.dmg) + (1 / 20) * (2 * avg(p.die) + p.dmg);
  }
  function sweep(p, rounds = 20, maxN = 20) {
    const attack = [], damage = [];
    for (let n = 0; n <= maxN; n++) {
      attack.push(rounds * expectedPerRound({ ...p, atk: p.atk + n }));
      damage.push(rounds * expectedPerRound({ ...p, dmg: p.dmg + n }));
    }
    return { attack, damage };
  }
  // Every n >= 1 where the leader changes. There can be 0, 1 or 2 in range.
  function crossovers({ attack, damage }, eps = 1e-9) {
    const out = []; let prev = 0;
    for (let n = 1; n < attack.length; n++) {
      const d = attack[n] - damage[n];
      const sign = Math.abs(d) < eps ? 0 : Math.sign(d);
      if (sign !== 0 && prev !== 0 && sign !== prev) out.push({ n, leader: sign > 0 ? 'attack' : 'damage' });
      if (sign !== 0) prev = sign;
    }
    return out;
  }
  return Object.freeze({ DICE, avg, isHit, damageFor, outcomeTable, tableStats, expectedPerRound, sweep, crossovers });
})();
```

**Crit cell convention (decide in the requirements phase).** RAW, a crit *rolls the damage dice twice*. A 20 x X grid has only one die column, so the nat-20 row can't show two independent dice. The recommended display is `2k + D`, with a footnote: "shown doubled for readability; the actual rule rolls a second die. The expected value is identical: 2*avg + D." The table average stays exactly equal to the closed form, and the simulator rolls two real dice through `damageFor(20, [k1, k2], p)`. This choice belongs to the math core and must not be made separately in a renderer.

### Pattern 2: Single state object + rAF-coalesced full render

**What:** Every control change goes through `setState(patch)`. That merges, clamps and schedules *one* `render()` for the next animation frame. `render()` calls `computeView(state)` once and hands the result to every renderer.
**When to use:** Any page where the whole view is cheap to recompute, which is the case here (see Performance).
**Trade-offs:** Simple and can't drift between panels. The cost is re-rendering panels that didn't change, which doesn't matter at this size. **Debouncing is not recommended.** It adds lag after the drag stops, and the page is meant to feel live while the AC slider moves. rAF already caps the work at one render per frame, however fast `input` events fire.

```javascript
const state = { ac: 15, die: 8, atk: 5, dmg: 0, n: 5 };
let sim = null;            // { rounds, total, expected, paramsKey } -- see Pattern 4
let pending = false;

function setState(patch) {
  Object.assign(state, clampState({ ...state, ...patch }));
  scheduleRender();
}
function scheduleRender() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => { pending = false; render(); });
}
function render() {
  const view = computeView(state);       // all math happens here, once per frame
  renderStats(view); renderTables(view); renderChart(view); renderCopy(view);
  renderSim(sim, state);                 // shows result or a "stale" badge; never re-rolls
}
// One delegated listener. 'input' fires continuously while a range slider is dragged.
document.querySelector('#controls').addEventListener('input', (e) => {
  const key = e.target.dataset.key; if (!key) return;
  setState({ [key]: Number(e.target.value) });
});
```

### Pattern 3: Derive once, render dumb (`computeView`)

**What:** Put all the derived numbers in one plain object. Renderers only format and place them.
**When to use:** Always. It keeps rounding and percent formatting out of the math core, and the self-test can check `computeView` output without a DOM.
**Trade-offs:** One extra object per frame. Negligible.

```javascript
function computeView(s) {
  const base = { ac: s.ac, die: s.die, atk: s.atk, dmg: s.dmg };
  const tBase = DiceMath.outcomeTable(base);
  const tHit  = DiceMath.outcomeTable({ ...base, atk: base.atk + s.n });
  const tDmg  = DiceMath.outcomeTable({ ...base, dmg: base.dmg + s.n });
  const curves = DiceMath.sweep(base);
  return {
    params: base, n: s.n,
    tables: [
      { label: 'Baseline',            rows: tBase, stats: DiceMath.tableStats(tBase, s.die) },
      { label: `+${s.n} to hit`,      rows: tHit,  stats: DiceMath.tableStats(tHit,  s.die) },
      { label: `+${s.n} to damage`,   rows: tDmg,  stats: DiceMath.tableStats(tDmg,  s.die) },
    ],
    curves,
    crossings: DiceMath.crossovers(curves),
    maxCell: 2 * s.die + s.dmg + s.n,   // ONE color scale shared by all three tables
  };
}
```

Use a **shared color scale** (`maxCell`) for the three side-by-side tables. If each table normalizes its own colors, the "+N to damage" table looks no warmer than the baseline, which defeats the point of comparing them.

### Pattern 4: The simulation is an event, not a derivation

**What:** "Roll 20 rounds" is the only non-deterministic output. It runs only on a button click and stores `{rounds[], total, expected, paramsKey}`. On later control changes, `renderSim` compares `paramsKey` with the current state. If they differ, it greys the result out and labels it "rolled at AC 15, d8, +5/+0; re-roll for current settings" instead of silently re-rolling.
**When to use:** Any Monte Carlo panel next to live exact math.
**Trade-offs:** Needs a little staleness UI. The alternative, re-rolling on every slider tick, makes numbers flicker randomly while dragging. That reads as noise and hides the variance lesson.

The simulator uses an injected `rng`. The self-test can then pass a seeded `mulberry32` and assert exact totals, or run 100k rounds with a fixed seed and assert the sample mean is within a small tolerance of `expectedPerRound`.

### Pattern 5: Hand-built SVG with a fixed viewBox

**What:** The chart is `<svg viewBox="0 0 600 320" preserveAspectRatio="xMidYMid meet">`. Its axes, gridlines and x-ticks (0..20) are built once. Each render updates two `<path d="...">` attributes, the crossover markers, a "current N" marker, and the y-axis tick labels.
**When to use:** 2 series x 21 points. A charting library would be overkill (and is out of scope).
**Trade-offs:** The y-scale must be recomputed from `max(attack[20], damage[20])` on every render. Pick "nice" tick steps (1/2/5 x 10^k) so labels don't jitter while dragging. The fixed viewBox means no `getBoundingClientRect` or other layout reads during render.

### Pattern 6: Live numbers in static copy via `data-bind`

**What:** The explanatory prose is authored as HTML with slots such as `<span data-bind="hitPct"></span>` or `<span data-bind="crossText"></span>`. `renderCopy` loops over `[data-bind]` and sets `textContent` from `view.copyValues`.
**Trade-offs:** Keeps prose editable as prose. Branching sentences ("damage bonus leads at every N here" vs "attack bonus overtakes at +6") come from a small lookup in `computeView`, never from string concatenation inside a renderer.

## Data Flow

### Control-change flow (runs on every slider tick)

```
user drags AC slider
    | 'input' event (fires continuously during drag)
    v
bindControls -> setState({ ac: 17 }) -> clamp/validate -> state mutated
    |
    v
scheduleRender()  -- already pending? -> return (coalesced)
    | next animation frame
    v
render()
  +- computeView(state)                         <- DiceMath (pure)
  |     outcomeTable x3, tableStats x3, sweep (2 x 21 expectations), crossovers
  +- renderStats(view)    -> stat card textContent
  +- renderTables(view)   -> 3 x innerHTML (row class per kind, heat class per cell)
  +- renderChart(view)    -> 2 path d-attrs + markers + tick labels
  +- renderCopy(view)     -> [data-bind] textContent
  +- renderSim(sim,state) -> mark stale if paramsKey != current (no re-roll)
```

**Single render vs targeted updates:** use **one full render**. The only case for targeting would be skipping the chart when only `n` changes. The sweep doesn't depend on `n`, so the curves stay the same and only the "current N" marker moves. Don't build that unless measurement shows a need (it won't).

**Die change** is the only change that alters DOM *shape* (the column count goes 4 to 12). With full-replacement `innerHTML` rendering this needs no special handling, which is one more reason to prefer full replacement over incremental cell patching.

### Simulation flow

```
click "Roll 20 rounds"
    v
sim = simulate(currentParams, 20, Math.random)
      per round: d20 = roll(20); dice = d20 === 20 ? [roll(X), roll(X)] : [roll(X)]
                 dmg = DiceMath.damageFor(d20, dice, p)
    v store sim + paramsKey
scheduleRender() -> renderSim shows round list, realized total vs 20*E
```

### Initial load

`init()` writes the default `state` *into* the controls (so markup defaults can't disagree with state), binds listeners, and calls `render()` synchronously once so there's no empty flash. The self-test block has already run by this point, because script order guarantees it.

### Optional: URL hash state

Serializing `state` to `location.hash` (`#ac=17&die=10&atk=5&dmg=2&n=4`) lets designers share a scenario. It's cheap because all state is in one object. Parse it in `init`, write it with `history.replaceState` at the end of `render`. This is a nice-to-have, not core.

## Verifying the Math Core (no framework)

The self-test is a table of known cases plus invariant loops. Every value below was **computed locally in Node and cross-checked**: brute-forced table average == PROJECT.md closed form in every case.

| Case | Expected | Notes |
|------|----------|-------|
| `pHit` AC 15, +5 | 0.55 | d20 rolls 10..20 hit (11/20) |
| `pHit` AC 25, +0 | 0.05 | only nat 20. Floor of the clamp |
| `pHit` AC 10, +20 | 0.95 | nat 1 still misses. Ceiling of the clamp |
| E/round AC 15, d8, atk +5, dmg +0 | 2.7 -> 20 rounds = **54** | |
| E/round AC 15, d8, atk +5, dmg +3 | 4.35 -> **87** | |
| E/round AC 25, d4, +0, +0 | 0.25 -> **5** | crit-only damage |
| E/round AC 10, d12, +20, +5 | 11.25 -> **225** | |
| E/round AC 18, d6, +3, +2 | 1.825 -> **36.5** | |

**Invariants worth asserting in a loop** (AC 10..25 x 5 dice x atk 0..20 x dmg 0..20 = ~35k combos, well under 100 ms):
1. `tableStats(outcomeTable(p)).perRound` approx equals `expectedPerRound(p)` (tolerance 1e-9, never `===` on floats). The table sum is an exact integer, so `Math.round(20 * die * E) === sum` is also a safe exact check.
2. `0.05 <= pHit <= 0.95` always.
3. `sweep(p).attack[0] === sweep(p).damage[0]` (both curves start at the same point).
4. The damage curve is exactly linear with slope `20 * pHit(p)` per +1.
5. The attack curve is non-decreasing and flat once `atk + n >= ac - 2` (a d20 roll of 2 already hits).
6. Row 1 is all zeros, and row 20 is all non-zero, for every p.
7. The simulator with a seeded rng reproduces a known total. Over 100k seeded rounds, the mean is within ~1% of `expectedPerRound`.

**Crossover cases (verified). These matter for the explanatory text:**
- AC 15, d8, +5/+0: the damage bonus leads at **every** N from 1..20. There is **no crossover**. With a 55% hit chance, +1 damage adds 0.55/round while +1 to hit adds only 0.05 * 4.5 = 0.225/round.
- AC 25, d12, +0/+0: damage leads for N = 1..5, and attack leads from **N = 6** on. The attack curve is flat at first because only a nat 20 hits until `atk + n >= ac - 19`.
- AC 25, d4, +0/+0: attack takes the lead from **N = 9**.
- AC 20, d12, +0/+0: attack leads at every N, but the gap starts closing at N = 19 because hit chance saturates. With a wider range there would be a *second* crossing back to damage.

So `crossovers()` must return **a list** (0, 1 or 2 entries), and the copy needs three variants. Useful rule of thumb for the copy: +1 to hit is worth more than +1 to damage exactly while `0.05 * (avg(dX) + D) > P(hit)`, and only while the attack bonus is inside the non-capped band.

**Runner:** `console.assert` only logs and does not throw (MDN), so the self-test should count failures itself, e.g. a `check(name, actual, expected, tol)` that pushes into a results array. Log `console.error` for each failure and a single `console.info('DiceMath self-test: 42/42 passed')`. With `?test`, render the results array into a fixed panel. `tools/verify-math.mjs` runs the same `check` table in Node. A build agent should run it after every math edit (`node tools/verify-math.mjs`, exit code 1 on any failure).

## Performance

| Work per render | Size | Estimate |
|-----------------|------|----------|
| outcomeTable x3 | 3 x 20 x 12 = 720 cells max | microseconds |
| sweep | 2 x 21 x `expectedPerRound` (loop of 18) = ~760 ops | microseconds |
| Table DOM | 3 x one `innerHTML` of ~260 `<td>`/`<th>` | low single-digit ms (estimate, MEDIUM; confirm with `performance.now()`) |
| SVG | 2 `d` attributes + ~10 text nodes | negligible |

- **rAF coalescing is enough.** Range `input` events fire continuously during a drag and can arrive faster than frames. The `pending` flag makes sure at most one render runs per frame. `requestAnimationFrame` is one-shot and pauses in background tabs, which is fine here.
- **Don't debounce.** A 100-200 ms debounce would make the AC slider feel broken on a page whose whole point is watching values move.
- **Build each table's HTML with `array.join('')`, then assign `innerHTML` once per table.** Don't `appendChild` 720 nodes one at a time. All values are numbers produced by our own code, so there's no injection concern.
- **Use CSS classes for heat colors** (`.h0`..`.h9` buckets from `cell / maxCell`, plus `.miss`, `.fumble`, `.crit` row classes), not inline style strings per cell. That gives smaller strings and keeps theming in CSS.
- **No layout reads in render.** Don't read `offsetWidth` or `getBoundingClientRect`. The SVG viewBox makes the chart resolution-independent.
- If profiling ever shows a problem (unlikely), the next step is to keep the `<table>` skeleton until `die` changes and update only `textContent`/`className` per cell. Don't do this up front.

## Scaling Considerations

"Users" don't matter here. It's a static file on GitHub Pages. What could grow is **scope**:

| Scope change | Architecture adjustment |
|--------------|-------------------------|
| v1 (this plan) | The 2D table works because damage is one die. The closed form and the table average are both trivial |
| Advantage/disadvantage (v2 candidate) | Only the d20 row weights change (non-uniform). The `weight` field on each row (always 1/20 in v1) lets `tableStats` become a weighted average without restructuring. This is a cheap hedge |
| Multi-dice damage (v2 candidate) | The 2D grid stops being readable. The core would switch to a damage *distribution* (probability array via convolution), and the table becomes d20 x damage-total. Don't build this now. `damageFor(d20, dieRolls[], p)` already takes an array, so the simulator path carries over |

### Scaling Priorities

1. **First bottleneck:** readability, not CPU. Three 20x12 tables side by side on a laptop is the tight spot. The fix is CSS (compact cells, sticky row headers, a stacking breakpoint), not architecture.
2. **Second bottleneck:** the explanatory copy drifting from the math. The fix is `data-bind` slots fed from `computeView`, never numbers hard-coded in prose.

## Anti-Patterns

### Anti-Pattern 1: Rules duplicated across table, stats and simulator
**What people do:** Write `if (r === 20)` logic separately in the table renderer, the stats formula and the dice roller.
**Why it's wrong:** They drift. The typical bugs are the simulator forgetting nat-1 auto-miss at high bonuses, or the table doubling the flat bonus on crits.
**Do this instead:** All of them go through `DiceMath.damageFor`. The closed form exists only to drive the sweep and as a self-test cross-check against the table average.

### Anti-Pattern 2: Math reading the DOM or returning formatted strings
**What people do:** `hitChance()` calls `document.getElementById('ac').value`, or returns `"55%"`.
**Why it's wrong:** It can't be tested in Node or the self-test, and rounding creeps into later calculations.
**Do this instead:** DiceMath takes numbers and returns numbers. Formatting (`toFixed`, `%`) lives only in renderers.

### Anti-Pattern 3: Monte Carlo feeding the "exact" numbers
**What people do:** Estimate hit chance or E by sampling because it's easy.
**Why it's wrong:** PROJECT.md requires exact values. Sampled numbers jitter and undermine the lesson.
**Do this instead:** Exact numbers come from the table and the closed form. The simulator appears only in the "roll 20 rounds" panel, shown *next to* 20*E.

### Anti-Pattern 4: Re-rolling the simulation on every control change
**Why it's wrong:** The numbers flicker randomly during slider drags, and the randomness gets confused with the effect of the control.
**Do this instead:** Mark the result stale (Pattern 4). Re-roll only on click.

### Anti-Pattern 5: Per-renderer event listeners
**What people do:** Each panel attaches its own `input` listener and updates itself.
**Why it's wrong:** Order-dependent bugs, panels showing different parameter sets mid-drag, and repeated computation.
**Do this instead:** One listener -> `setState` -> one scheduled `render()`.

### Anti-Pattern 6: Assuming exactly one crossover
**Why it's wrong:** Verified above: there can be 0 crossings (AC 15, d8, +5 is a common default and has none), 1 (AC 25, d12), or 2 over a wide enough range. Copy that says "crossover at +X" will be wrong or show `undefined`/`NaN` for common settings.
**Do this instead:** `crossovers()` returns an array. The copy has three variants.

### Anti-Pattern 7: Per-table color normalization
**Why it's wrong:** Each side-by-side table looks equally "hot", so the shift the comparison is meant to show disappears.
**Do this instead:** One shared `maxCell` scale across all three tables.

### Anti-Pattern 8: Inline `type="module"` scripts or `DOMContentLoaded` spaghetti
**Why it's wrong:** Inline modules can't share bindings with each other, so the math block would have to merge into the app block and lose its extraction seam. Ordering also becomes deferred and less obvious.
**Do this instead:** Classic scripts at the end of `<body>`, one namespace per block.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub Pages | `index.html` at the repo root, deploy from branch | No build step. A single HTML file with no `_`-prefixed paths doesn't need `.nojekyll`. Use relative paths only. Deploy the walking skeleton early to de-risk the Pages setup |

No other external services (no CDN, no analytics).

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Controls -> State | `setState(patch)` direct call | The only writer of `state`. Clamps AC 10..25, die in DICE, bonuses and N to 0..20 |
| State -> Model | `computeView(state)` pure call | The only reader of state in the render path |
| Model -> DiceMath | Direct namespace calls | DiceMath knows nothing of state shape beyond `{ac, die, atk, dmg}` |
| Simulator -> DiceMath | `damageFor` | Guarantees the simulator follows the same rules as the table |
| View -> Renderers | Plain object argument | Renderers never call DiceMath or read `state`, except `renderSim`, which reads `state` only to compare `paramsKey` |
| SelfTest -> DiceMath/Simulator | Direct calls, seeded rng | The same assertion table is reused by `tools/verify-math.mjs` in Node |

## Suggested Build Order

Dependencies run strictly downward. Each step can be verified before the next starts.

1. **DiceMath + Simulator core + SelfTest** (no UI). `isHit`, `damageFor`, `outcomeTable`, `tableStats`, `expectedPerRound`, `sweep`, `crossovers`, `simulate`/`mulberry32`, and the check table above. Gate: 0 failures in the console and in Node via `vm`. *Everything else consumes this, so it must be right first.*
2. **Walking skeleton: state + controls + one table + stat cards.** `setState`, the rAF scheduler, `computeView` (baseline only), one `renderTables` output, `renderStats`. Deploying to GitHub Pages here is worth it (it de-risks the deployment requirement early).
3. **Comparison views: N control, three side-by-side tables with a shared scale, SVG chart with crossover markers.** Both read the same `computeView`. The chart only needs `sweep` and `crossovers` from step 1.
4. **Simulation panel.** Roll button, round list, realized vs expected, staleness badge. Depends only on `simulate` and state.
5. **Explanatory copy with `data-bind` slots**, including the three crossover-text variants and the displayed formulas. Last, because it depends on every derived number being final.
6. **Legibility/responsive polish, final deploy, README.** Three 20x12 tables on a laptop, stacked on mobile.

With the config's `granularity: coarse`, these fold naturally into roughly **three roadmap phases**:
- **(A) Math core + live skeleton, deployed** (steps 1-2)
- **(B) Comparison tables, chart, simulation** (steps 3-4)
- **(C) Designer-facing copy, polish, final deploy** (steps 5-6)

## Sources

- MDN, `HTMLElement: input event`: `input` fires on user-initiated value changes, `change` on commit. https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event (HIGH)
- MDN, `<input type="range">`: the example uses `input` for live updates while dragging. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/range (HIGH)
- MDN, `Window.requestAnimationFrame()`: one-shot, runs at display refresh rate, paused in background tabs. https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame (HIGH)
- MDN, `console.assert()`: logs on failure, does not throw. https://developer.mozilla.org/en-US/docs/Web/API/console/assert_static (HIGH)
- Node.js docs, `node:vm` (Stability 2, returns the value of the last statement). https://nodejs.org/api/vm.html (HIGH). The script-extraction approach was checked locally on Node v24.15.0.
- Math values and crossover behavior: computed locally in Node by brute-forcing the outcome table and comparing it with the PROJECT.md closed form (HIGH).
- Classic-script global lexical scope sharing and inline-module isolation: HTML/ECMAScript semantics from training knowledge, consistent with the vm check (MEDIUM-HIGH).
- Performance timings: estimated from operation counts, not browser-measured (MEDIUM).

---
*Architecture research for: single-file vanilla-JS D&D attack-roll probability visualizer*
*Researched: 2026-09-24*
