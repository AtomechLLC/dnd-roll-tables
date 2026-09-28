# Phase 5: Hits-to-Kill - Pattern Map

**Mapped:** 2026-09-27
**Files analyzed:** 14 logical units: 12 regions inside `index.html` plus 2 dev tools. No new files ship.
**Analogs found:** 14 / 14. Every unit has an in-repo analog. Four pieces have only partial analogs: the thinning DP, the BigInt tie-break, the LRU memo, and `aria-disabled`. The page has none of these today, so their code comes from RESEARCH §Code Examples.

The whole app is one file, `index.html`: 4,345 lines at mapping time (commit 600ec37). Each inline block or CSS/markup region counts as a "file" here. Every line number below is for the current `index.html` / `tools/*.mjs` and **will shift** as earlier plan edits land. Executors should find each spot by its quoted anchor text, not by the number.

Current block map:

| Block | Lines | Anchor |
|---|---|---|
| `<style>` | 10-690 | `:root {` … `footer` rules |
| `<main>` markup | 693-939 | `form#controls` 704-730, `section#stats` 742-815, `section#sim` 870-911, `section#explore` 913-938 |
| `<script id="dice-math">` | 945-1139 | `const DiceMath = (() => {` |
| `<script id="dice-sim">` | 1141-1211 | `const Sim = (() => {` (unchanged this phase) |
| `<script id="view-model">` | 1213-1855 | `const VM = (() => {` |
| `<script id="dice-selftest">` | 1857-2472 | `const SelfTest = (() => {` |
| `<script id="app">` | 2474-4343 | `const form = document.getElementById('controls');` |
| `tools/check-engine.mjs` | 1-1247 | `names` 148-177, combo loop 639-910, report 1218-1246 |
| `tools/check-page.mjs` | 1-534 | header 1-66, guard (11) 365-389, fault 454-473, guard (7) 478-486, (14) 504-517 |

## File Classification

| New/Modified unit | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| U1 `<style>`: `#controls` alignment, dice legend margin, `.hp-row`, `.hp-steps`, `.hp-hits`, `.btn-step` (+ states), `#stats > .stats-h`, `.kill-note` (+ 64rem rule), `.sim-log` 6-column widths/padding, `tr.kill`, `tr.down`, `.hp-down`, `.hp-kill i`, `#sim.is-stale #sim-kill` | config (stylesheet) | transform | `.strip` (95-101), `fieldset.dice legend` (118), `.pair` (105), `.btn-preset` (598-610), `.explain` (549), `.card.formulas` 64rem placement (638-641), `.sim-log` (506-535), `#sim.is-stale` (539-543) | exact |
| U2 Markup: HP group in `form#controls`, kill heading/cards/note in `#stats`, `#sim-kill`, 6th log header, sim intro sentence | component (static markup) | request-response | `#atk-num` group (722-725), stat card (743-747), `#two-rolls` `p.explain` (734), `#sim-place` / `#sim-status` (889-892), log `thead` (897-905), preset button (921) | exact |
| U3 `#dice-math`: `KILL_*` constants, `hitPmf(p)`, `killTable(p)`, `killHitsExact(t, hp)`, exports | service (pure engine) | batch (DP) | `hitAverages` (1045-1054), `spread` (1111-1131), `stats` crit enumeration (1012-1015), export list (1133-1137) | role-match (the DP body is new; see No Analog) |
| U4 `#view-model`: `CONTROL_SPEC.hp`, `DEFAULT_STATE.hp` | config | CRUD (parse/clamp) | `CONTROL_SPEC` / `DEFAULT_STATE` (1219-1226), `parseControl` (1229-1243) | exact (self) |
| U5 `#view-model`: `roundKill`, `group3`, `killNumText`, `pctText`, `ROUND_WINDOW` | utility | transform | `fixed` / `tenths` / `signed` (1245-1256), `NB` / `tenthsText` helpers (1307-1312) | exact |
| U6 `#view-model`: `hpStep`, pure `killViewFrom(table, sv, hp)`, memo `killView(sv, hp)` (LRU), `hpStatus`, `computeView.kill` | service (view-model) | transform + memo | `chartView` / `chartMemo` (1708-1723), `leverMemo` / `e20At` (1673-1689), `chartExplain` pure vs memo split (1724-1735), `statsView.avgPerHitText` (1280-1281), `presetStatus` (1796), `computeView` (1837-1847) | exact |
| U7 `#view-model`: `killTrack(rounds, hp)`, `killLine`, `tallyEntry`, roll-status kill sentence | service (view-model) | transform | `simPlacement` (1823-1828), `simStatus` (1831-1832), `Sim.runMarks` (1196-1207) | exact |
| U8 `#dice-selftest`: O(1) kill pins | test | batch | `section('copy', …)` (2410-2432), `section('sim', …)` seeded pins (2360-2366) | exact |
| U9 `#app`: HP element refs, `onStepClick`, `renderHp`, `#hp-status` write, init enable, `failPage` disable | controller | event-driven | `applyPreset` / `onPresetClick` (2614-2637), `handleRoll` status (2852-2870), `init` (4300-4340), `failPage` (4284-4298), element refs (2530-2532) | exact |
| U10 `#app`: kill heading + three cards + note in `renderStats` | component (renderer) | transform (view -> DOM) | `setCard` (2657-2660), `renderStats` (2671-2695), `renderExplain` + `setText` (3191-3196, 2898-2901) | exact |
| U11 `#app`: `renderSim` HP column, kill/down rows, tfoot HP, `#sim-kill`, `killShown` cache; `sim.tally` holds runs; `rollWith` / `handleRoll` / `resetSim` | component (renderer) + controller | transform + event-driven | `renderSim` (2903-3000), `logBodyHtml` + `LOG_RESULT_CELL` (2880-2896), `rollWith` (2838-2850), `resetSim` / `shownRunId` (2540-2552) | exact (self) |
| U12 `#app` `runUiSmoke()`: HP control block, re-score block, Phase 3 tally/foot updates, a11y `order` list, `#hp-status` clear | test | event-driven (synthetic) | `sim log ui` block (3836-3990), `explore ui` block with held rAF (4136-4199), `a11y ui` block (4201-4244), final reset (4246-4248) | exact |
| U13 `tools/check-engine.mjs`: K-series (`K1`..`K9`), exhaustive 2,470 keys x HP 1..500 vs round-DP + BigInt oracles, per-setting strings at an HP sample, D-05 pins, claim checks, timing warning | test (dev tool) | batch | `names` / `record` (148-200), `dist20Of` + `distMemo` (202-236), combo loop hook at `VM.statsView(p)` (699-707), (x) markup parity (1038-1069), `extra` + report (1141-1246) | exact (self) |
| U14 `tools/check-page.mjs`: guard (11) list, guard (7) incl. `.btn-step`, fault `.btn-step` disabled, header comments | test (dev tool) | batch | guard (11) (365-389), guard (7) (479-486), fault checks (465-468), header (24-25, 39-42, 54-62) | exact (self) |

---

## Pattern Assignments

### U1. `<style>` additions (config)

**Insertion points:** the strip edits go **in place** at 96 and 118. `.hp-*` / `.btn-step` go after the die-group rules (after 137), before `/* Stat cards */` (139). `#stats > .stats-h` and `.kill-note` go after `.card.marginal h2` (165). The log edits go **in place** at 506-535, and the kill/down rules follow line 535. `#sim.is-stale #sim-kill` joins the selector list at 539. The `.kill-note` wide rule goes inside `@container page (width >= 64rem)`, next to `.card.formulas { grid-column: 1 / span 3; }` (640).

**Analog A: the strip, in place** (95-101, 117-118):
```css
    .strip {
      display: flex; flex-wrap: wrap; gap: var(--sp-3) var(--sp-4); align-items: flex-end;
      ...
    }
    fieldset.dice legend { padding: 0; margin-bottom: var(--sp-2); }
```
UI-SPEC A3: add `#controls { align-items: flex-start; }`, scoped to `#controls` so `.n-strip` keeps `flex-end`. Change the legend margin to `var(--sp-1)`. Do **not** edit `.strip` itself, because `#compare-controls` also uses it.

**Analog B: the row of controls = `.pair`** (105): `.pair { display: flex; gap: var(--sp-2); align-items: center; }` → `.hp-row { display: flex; flex-wrap: wrap; gap: var(--sp-2); align-items: center; }` and `.hp-steps { display: flex; flex-wrap: nowrap; gap: var(--sp-2); }`. The number box needs no new rule (108-113 already gives 80 x 32).

**Analog C: the secondary button = `.btn-preset`** (598-610):
```css
    .btn-preset {
      background: var(--paper); color: var(--ink);
      border: 1px solid var(--ink-muted); border-radius: 4px;
      font: 700 1rem/1.5 var(--font-prose);
      min-height: 32px; padding: var(--sp-1) var(--sp-3); ...
      cursor: pointer; touch-action: manipulation;
    }
    .btn-preset:hover:not(:disabled) { background: color-mix(in oklch, var(--paper) 85%, var(--ink)); }
    .btn-preset:active:not(:disabled) { background: color-mix(in oklch, var(--paper) 75%, var(--ink)); }
    .btn-preset:disabled {
      background: var(--surface); color: var(--ink-muted); border-color: var(--line); cursor: not-allowed;
    }
```
`.btn-step` copies the fill, border and radius, with UI-SPEC changes: `font: 400 0.875rem/1.4 var(--font-num); font-variant-numeric: tabular-nums; white-space: nowrap; height: 32px; min-width: 120px; padding: 0 var(--sp-2);`. Hover and active add `:not([aria-disabled="true"])` to the `:not(:disabled)` chain. The inert rule is **one selector list**, `.btn-step[aria-disabled="true"], .btn-step:disabled { … }`, byte-identical in body to `.btn-preset:disabled`. Add no focus rule: the global `:focus-visible` (114) covers it.

**Analog D: the muted small line = `.hint` / `.card .sub`** (104, 161) → `.hp-hits { margin: 0; max-width: 42ch; font-family: var(--font-prose); font-size: 0.875rem; line-height: 1.4; color: var(--ink-muted); }`.

**Analog E: a full-row item in `#stats` = `.card.formulas`** (554-555, 164):
```css
    .card.formulas { grid-column: 1 / -1; container: formula / inline-size; }
    .card.formulas h2 { margin: 0; }
```
→ `#stats > .stats-h { grid-column: 1 / -1; margin: 0; padding-top: var(--sp-2); }` (the global `h2` at 84-87 gives the small-caps). `.kill-note { grid-column: 1 / -1; margin: 0; }` (overrides `.explain`'s bottom margin at 549).
- **Subgrid selector check:** line 150, `#stats > .card:not(.marginal):not(.formulas) { grid-row: span 3; grid-template-rows: subgrid; }`, already matches `.card.kill`, so the kill cards need no card CSS (UI-SPEC). The `h2` and `p` are not `.card`, so they are unaffected.
- **Wide placement analog** (638-641, inside `@container page (width >= 64rem)`): `.card.formulas { grid-column: 1 / span 3; } .card.marginal { grid-column: 4 / -1; }` → add `.kill-note { grid-column: 4 / -1; grid-row: span 3; align-self: start; padding-top: var(--sp-3); }` in the same block.

**Analog F: log columns, in place** (508, 515-516, 521-525):
```css
    .sim-log { border-collapse: collapse; table-layout: fixed; width: 296px; background: var(--paper); }
    .sim-log th, .sim-log td {
      height: 24px; line-height: 24px; padding: 0 var(--sp-2); ...
    .sim-log thead th:nth-child(1) { width: 48px; }
    ... (5) { width: 56px; }
```
→ width `316px`, padding `0 var(--sp-1)`, widths 36 / 36 / 52 / 60 / 44, and a new `:nth-child(6) { width: 88px; }`. Update the comments at 506 and 509 ("296px").

**Analog G: row-scoped color and weight = the stale rules** (539-541):
```css
    #sim.is-stale .fig .value, #sim.is-stale .fig .sd, #sim.is-stale #sim-spread, #sim.is-stale #sim-place,
    #sim.is-stale .sim-log, #sim.is-stale .sim-log .res-crit,
    #sim.is-stale .sim-log th, #sim.is-stale .sim-log td { color: var(--ink-muted); }
```
- Append `#sim.is-stale #sim-kill` to this list.
- `.sim-log tr.down > *, .sim-log tr.down .res-crit { color: var(--ink-muted); }`. The `.res-crit` part is needed because 531 sets `color: var(--accent)` at higher specificity. Keep `font-weight: 700` on crit.
- `.sim-log tr.kill > * { font-weight: 700; box-shadow: inset 0 -2px 0 0 var(--ink); }`. The inset stroke copies the outcome table's threshold rule idea.
- `.hp-down { font-family: var(--font-prose); font-style: italic; font-size: 0.75rem; white-space: nowrap; }` and `.hp-kill i { font-family: var(--font-prose); font-weight: 700; }`.
- Specificity check: `.sim-log th, .sim-log td { font-weight: 400 }` (515-518) is 0-1-1, and `.sim-log tr.kill > *` is 0-2-1, so it wins.

---

### U2. Markup additions (component, static)

**HP group:** append after the `Damage bonus` group (726-729), before `</form>` (730). Analog (722-725):
```html
      <div class="group">
        <label class="group-label" for="atk-num">Attack bonus <span class="hint">−5 to +20</span></label>
        <input type="number" id="atk-num" data-key="atk" min="-5" max="20" step="1">
      </div>
```
→ UI-SPEC block verbatim: `div.group.hp`, `label for="hp-num"` + `.hint` `1 to 500`, `input#hp-num data-key="hp" … aria-describedby="hp-hits"`, `.hp-row` > `.hp-steps` > two `button.btn-step` with `data-step="-1"` / `"1"`, `aria-describedby="hp-hits"`, and `disabled`, then `p#hp-hits.hp-hits` and `p#hp-status.vh[role=status]`.
- **Button analog** (921, the preset): `<button type="button" class="btn-preset" data-preset="cross" aria-describedby="…" disabled>`. It is shipped `disabled`, has no `onclick`, and **never carries `data-key`**. `renderControls` (2647-2653) writes `.value` on every `[data-key]`.
- **Status analog** (892): `<p id="sim-status" class="vh" role="status"></p>`.
- **Pitfall 9, static labels:** if the markup ships `−1 hit (−5 HP)` / `+1 hit (+5 HP)` / the hits line for the no-JS state, add a parity check in check-engine (U13), modeled on (x) (1038-1069).

**`#stats`:** insert after the focal card's `</div>` (772), before `<div class="card formulas" id="formulas">` (773). Card analog (743-747):
```html
      <div class="card">
        <span class="label">Hits on</span>
        <span class="value" id="stat-threshold"></span>
        <span class="sub" id="stat-threshold-sub"></span>
      </div>
```
→ `h2#kill-h.stats-h`, three `div.card.kill` with ids `stat-khits` / `stat-krounds` / `stat-k20` (and each with a `-sub`), then `p.explain.kill-note#kill-note`. The `p.explain` analog is `#two-rolls` (734): `<p class="explain" id="two-rolls"></p>`. The `setCard(id, …)` helper writes `id` and `id + '-sub'`, so these id pairs must match.

**`#sim`:**
- `<p id="sim-kill" class="sim-line" hidden></p>` goes right after `<p id="sim-place" class="sim-line"></p>` (889). The `hidden` usage copies `#sim-now` (890).
- The 6th header goes after the Dmg `th` (903). Analog (903): `<th scope="col"><span aria-hidden="true">Dmg</span><span class="vh">Damage</span></th>` → `<th scope="col"><span aria-hidden="true">Enemy HP</span><span class="vh">Enemy HP left</span></th>`.
- The intro sentence is appended to the `.section-intro` at 872.

**Load-count guard:** the log `tbody` / `tfoot` stay empty in markup, so check-page's 80 `<th scope="row">` (3) holds.

---

### U3. `#dice-math`: kill engine (service, batch)

**Insertion point:** after `spread` (1111-1131), before `return Object.freeze({` (1133). Add `hitPmf, killTable, killHitsExact` and the `KILL_*` constants to the export list at 1134-1136.

**Analog A: enumeration through the one damage rule** (`hitAverages`, 1045-1054):
```js
  function hitAverages(p) {
    assertParams(p);
    const X = p.die;
    let normalNum = 0, critNum = 0;
    for (let k = 1; k <= X; k++) normalNum += damageFor(20, [k], p);
    for (let a = 1; a <= X; a++) for (let b = 1; b <= X; b++) critNum += damageFor(20, [a, b], p);
    return { normalNum, normalDen: X, critNum, critDen: X * X };
  }
```
`hitPmf(p)` is exactly this loop, but it accumulates **weights per damage value** into a `Map` instead of sums. Normal faces add `(hf - 1) * X` each and crit pairs add 1, over `den = hf * X * X`, with `hf = 21 - threshold(p)`. It is RESEARCH §Code Examples `hitPmf` verbatim. `damageFor(20, …)` is the right call because d20 = 20 always passes the hit gate (the comment at 1046).

**Analog B: integer weights over a fixed den, documented header** (`spread`, 1111-1114):
```js
  // SIM-05, D-05: exact spread of the 20-round total. One-round moments over den1 = 20 * X^2
  // (weight X per normal-hit cell, 1 per true 2dX crit pair), all through damageFor (RULES-05).
  // ...
  // Kept apart from stats(), which the sweeps and the self-test grid call thousands of times.
```
→ give `killTable` the same kind of header: D-06, "exact DP, thinning for the median and P10/P20, cap `KILL_MEDIAN_CAP = 1000`, tails < `KILL_TINY` dropped (A2), `KILL_TIE_EPS` for exact 1/2 ties", and "memo-free; the VM memoizes per (hitFaces, die, dmg)".

**Purity rules (check-engine gate 0, 115-119):** no `Math.random` anywhere in the block, **comments included**. Use no DOM, no formatting and no memo in DiceMath (the VM owns memos, as `leverMemo` does).

**Body:** RESEARCH §Code Examples `killTable` / `killHitsExact` verbatim (typed arrays, BigInt `N_n` recurrence). No in-repo analog exists for the DP loop itself (see No Analog Found).

---

### U4. `#view-model`: `CONTROL_SPEC.hp`, `DEFAULT_STATE.hp` (config)

**Analog: itself** (1219-1226):
```js
  const CONTROL_SPEC = Object.freeze({
    ac:  Object.freeze({ min: 10, max: 30 }),
    ...
    n: Object.freeze({ min: 0, max: 20 }),   // Phase 2 "Compare at +N" (CTRL-04): the one copy of its domain
  });
  const DEFAULT_STATE = Object.freeze({ ac: 15, die: 8, atk: 5, dmg: 0, n: 5 });   // D-03 (Phase 1 and 2)
```
→ add `hp: Object.freeze({ min: 1, max: 500 }),   // Phase 5 "Enemy HP" (KILL-01)` and `hp: 40` to `DEFAULT_STATE`. `parseControl` (1229-1243) needs **no change**: its min/max branch clamps, and blank or `12abc` input returns `prev`.
- **Ripple:** `Object.assign(state, VM.DEFAULT_STATE, patch)` in every smoke `show()` (3843, 3997, 4095) resets HP to 40 for free. check-engine derives `TOTAL_COMBOS` from `CS.ac/die/atk/dmg` only (185), so adding `hp` does not change it. Do not fold `hp` into `TOTAL_COMBOS`. `PRESET_KEYS` (2559) stays at five keys (UI-SPEC A10).

---

### U5. `#view-model`: rounding and format helpers (utility)

**Placement:** after `signed` (1256), or grouped with the Phase 4 helpers (1307-1312).

**Analog: exact formatting from scaled integers** (1245-1256):
```js
  function fixed(intScaled, decimals) {
    const neg = intScaled < 0, a = Math.abs(intScaled), p = 10 ** decimals;
    const whole = Math.trunc(a / p), frac = String(a % p).padStart(decimals, '0');
    return (neg ? '-' : '') + whole + (decimals ? '.' + frac : '');
  }
  const tenths = (num, den) => Math.round((10 * num) / den);
```
- `roundKill(x, scale, exact)` returns an integer, which then goes through `fixed(t, 1)`. **Never** call `toFixed` on the float E[H] / E[R] (Pitfall 2).
- `group3` uses the regex from RESEARCH, never `toLocaleString`.
- `pctText(p20, fastest)` follows the UI-SPEC percent table. `0%` comes only from the integer test `fastest > 20`. Build its decimals with `fixed(Math.round(p * 1000), 1)` / `Math.round(p * 100)`.
- Constants follow the `NB` style (1307): `const ROUND_WINDOW = 1e-6;   // display units; >= 50x the worst float error`.
- The minus sign is `'−'` U+2212, as in `signed` (1256). Build U+00A0 with `String.fromCharCode(0xa0)` (1307), never a literal escape.

---

### U6. `#view-model`: `hpStep`, `killViewFrom`, `killView` memo, `hpStatus`, `computeView.kill` (service)

**Placement:** a new `// ---- Hits to kill (Phase 5) ----` section after `presetStatus` (1796), before `simExact` (1798). Add the exports at 1849-1853.

**Analog A: integer-exact step from the card's own numerators** (`statsView.avgPerHitText`, 1280-1281):
```js
      avgPerHitText: s.hitFaces
        ? fixed(Math.round((100 * s.e20Num) / (s.e20Den * s.hitFaces)), 2) : '0.00',
```
`hpStep(sv, hp)` reads `sv.exact.e20Num`, `sv.exact.e20Den` and `sv.hitFaces` (the `exact` sub-object at 1290-1293 already carries them) and returns `{ step, minus, plus }` with `step = Math.floor((2 * num + den) / (2 * den))`, where `den = e20Den * hitFaces`. It is pure and makes no DiceMath call, the same contract as `formulaView` (the comment at 1302-1304: "Pure functions of a statsView result: they never call DiceMath").

**Analog B: pure builder + memo wrapper** (`chartExplain` vs `chartView`, 1708-1735):
```js
  let chartMemo = { key: null, base: null, q: null, explain: null };
  function chartView(p, n) {
    const key = `${p.ac},${p.atk},${p.die},${p.dmg}`;
    if (chartMemo.key !== key) {
      const q = { ac: p.ac, atk: p.atk, die: p.die, dmg: p.dmg };
      chartMemo = { key, base: chartBase(q), q, explain: null };
    }
    ...
  }
  function chartExplain(p, base) { ... return explainChart(p, { … }, { … }); }
```
→ `killViewFrom(table, sv, hp)` is **pure**. check-engine calls it with its own 2,470-table `Map` (RESEARCH Pattern 2). `killView(sv, hp)` is the memo wrapper, keyed `` `${sv.hitFaces},${sv.params.die},${sv.params.dmg}` ``. It adds a single-entry string memo keyed `hf,die,dmg,hp`, in the shape of `chartMemo`.

**Analog C: a keyed `Map` memo** (`leverMemo`, 1673-1687):
```js
  const leverMemo = new Map();
  function e20At(ac, atk, die, dmg) {
    const key = die * 1000 + dmg;
    let h = leverMemo.get(key);
    if (!h) {
      ...
      leverMemo.set(key, h);
    }
```
→ the kill-table LRU is the same `get` / `set` plus eviction: `if (m.size > 8) m.delete(m.keys().next().value);`. On a hit, `delete` then `set` to refresh recency. `leverMemo` has no eviction, so the LRU part is new (RESEARCH A4).

**Analog D: the one announcement string** (`presetStatus`, 1796): `const presetStatus = (s) => \`Set to ${settingsText(s)}, …\`;` → `hpStatus(sv, hp)` returns `Enemy HP {hp}: about {simple} average hits.` plus the bound sentence. The app writes it only from the click handler (U9).

**Analog E: the page view adds a key** (`computeView`, 1837-1847):
```js
    return {
      ...sv, heatMax: compare.heatMax, compare, chart: chartView(p, state.n),
      simExact: simExact(p), formulas: formulaView(sv), twoRolls: twoRollsText(sv),
    };
```
→ add `kill: killView(sv, state.hp)`. Keep `statsView` kill-free. The comment at 1258-1262 says the per-combo callers must not pay for extra work, and check-engine calls `statsView` 70,980 times. Update the comment at 1841-1842 to say that `kill` is page-view only too.

**Copy-branch discipline** (the Phase 4 `formulaView` rule, 1302-1304, 1362-1375): every card, note and hits-line variant is chosen by an **exact integer** test. That covers every-hit-kills (`2 + D >= hp` and, when hitFaces >= 2, `1 + D >= hp`), `0%` (`fastest > 20`), past-the-cap (`medianRound[hp] === 0`), step 0, and simple under 0.1. The note prints the **card's own strings** (`sv.hitPct`, the card 1 / card 2 texts), so D-07 holds by construction.

---

### U7. `#view-model`: `killTrack`, `killLine`, `tallyEntry`, roll-status sentence (service)

**Placement:** after `simStatus` (1831-1832).

**Analog A: a pure function of a frozen run** (`Sim.runMarks`, 1196-1207):
```js
  function runMarks(run) {
    const cells = new Map(), rows = new Map();
    for (const r of run.rounds) {
      if (r.kind === 'hit') { ... } else { ... }
    }
    return { cells, rows };
  }
```
→ `killTrack(rounds, hp)` is RESEARCH §Code Examples verbatim. It reads `r.result` (`'hit' | 'miss' | 'crit'`, from `Sim.RESULT` at 1165, where a nat 1 is already `'miss'`) and `r.damage`. It returns `Object.freeze({ hpAfter, killRound, hits, leftAfter })`. It lives in **VM, not Sim**: `#dice-sim` is unchanged this phase (the draw-order contract, 1167-1169).

**Analog B: one-line copy from integers** (`simPlacement` / `simStatus`, 1823-1832):
```js
  const simStatus = (total, ex) =>
    `Rolled 20 rounds: ${total} damage. Expected ${ex.eText} ± ${ex.sdText}. ` + simPlacement(total, ex);
```
- `killLine(track)` returns the text form `Killed in round K (H hits).` / `Killed in round K (1 hit).` / `Survived with L HP left.`. The app bolds the numbers with `numberedParts`-style splitting, or builds nodes with `num()` (U11).
- `tallyEntry(run, hp)` returns `` `${total} · killed R${K}` `` / `` `${total} · ${left} HP left` ``.
- Roll status: either give `simStatus` a third `track` argument, or have `handleRoll` concatenate `' ' + killLine(track)`. **Keep the existing self-test pin** at 2390-2391, which calls `VM.simStatus(r1.total, ex)` with two arguments. Either keep the 2-argument form byte-identical, or update the pin in the same commit.

---

### U8. `#dice-selftest`: O(1) kill pins (test)

**Insertion point:** a new `section('kill', …)` after `section('explain', …)` closes (2464), before `const failed = …` (2466).

**Analog: the copy-pin section** (2410-2432):
```js
  section('copy', () => {
    const sv = VM.statsView(VM.DEFAULT_STATE);
    const nb = (x) => String(x).replaceAll(String.fromCharCode(0xa0), ' ');
    const hasF = typeof VM.formulaView === 'function';
    const fv = hasF ? VM.formulaView(sv) : null;
    check('copy: hit and round lines at the defaults',
      hasF ? … : 'formulaView missing',
      '= (21 − (15 − 5)) / 20 = 11/20 = 55% | …');
```
Pins, following RESEARCH Pitfall 7 (the Node run is at 191.5 ms of 200):
1. `VM.killView(sv, 40)` at the defaults. This warms the LRU, so the first render reuses it. Pin the card values and sub-lines in one joined string (`8.7`, `on average (simple division says 8.1)`, `15.8`, `…by round 15`, `85%`, `fastest possible: round 3`).
2. The raw engine values from `DiceMath.killTable(DEF)` at hp 40, checked with the numeric `check(name, actual, expected, tol)` form (1863-1866): E[H] 8.69985, E[R] 15.81790, median 15, P20 0.846580, P10 0.111420 (D-05), with `tol` about 5e-6.
3. The default step: `VM.hpStep(sv, 40)` → `5 / 5 / 5`.
4. One hand-made 3-round `killTrack` (frozen literal records, no `Sim.simulate`).
- Guard every call with `typeof VM.killView === 'function' ? … : 'killView missing'`, in the `hasF` style above. A missing function then fails a check instead of crashing the section.
- **Split-literal rule (IN-06):** check **names** must not repeat visible copy such as `Killing a 40 HP enemy`. Expected values may. See the `'lead changes ' + 'twice'` style at 2460.

---

### U9. `#app`: HP control wiring (controller, event-driven)

**Element refs:** add a `// Enemy HP and kill cards (Phase 5)` group after the explore refs (2530-2532), in the same style:
```js
const exploreListEl = document.querySelector('#explore .explore-list');
const presetBtns = Array.from(document.querySelectorAll('#explore button.btn-preset'));
const exploreStatusEl = document.getElementById('explore-status');
```
→ `hpHitsEl`, `hpStatusEl`, `stepBtns = Array.from(document.querySelectorAll('#controls button.btn-step'))`, `hpMinusEl`, `hpPlusEl`, `killHeadEl`, `killNoteEl`, `simKillEl`.

**Analog A: delegated click → parse → one setState → status in the next frame** (`applyPreset` / `onPresetClick`, 2621-2637):
```js
function applyPreset(key) {
  ...
  for (const k of PRESET_KEYS) patch[k] = VM.parseControl(k, pr.sets[k], state[k]);
  const applied = Object.freeze({ ...patch });
  lastPreset = applied;
  setState(patch);
  exploreStatusEl.textContent = '';
  const msg = VM.presetStatus(applied);
  requestAnimationFrame(() => { if (lastPreset === applied) exploreStatusEl.textContent = msg; });
}

function onPresetClick(e) {
  const b = e.target.closest('button[data-preset]');
  if (b && !b.disabled) applyPreset(b.dataset.preset);
}
```
→ `onStepClick(e)` is RESEARCH §Code Examples verbatim. It uses `closest('button[data-step]')` and computes the step **from `state`** through `VM.hpStep(VM.statsView(state), state.hp)`, never from the painted label or `aria-disabled` (Pitfall 4). An applied step of 0 returns silently. Otherwise it calls `VM.parseControl('hp', state.hp + applied, state.hp)`, then one `setState({ hp })`. It clears `hpStatusEl`, then writes in the rAF with the guard `if (state.hp === hp)`, the same idea as `lastPreset === applied`.
- `state.hp` is read synchronously after `setState`. `Object.assign` has already run (2564-2567), so a double click near 500 gives 500, then an inert step.

**Analog B: control renderer** (`renderControls`, 2647-2655). It already syncs `#hp-num` through `[data-key]` and never overwrites a focused number box. `renderHp(view)` is a **new renderer** registered after `renderControls` in `RENDERERS` (2537-2538). It writes the two step labels with `setText`, sets `aria-disabled` (`el.setAttribute('aria-disabled', 'true')` / `removeAttribute`, written only on change), and writes `hpHitsEl` with `setText`. It **never** writes `hpStatusEl` (UI-SPEC Live regions). Alternatively, fold it into `renderControls(view)`, which already receives `view`.

**Analog C: init wiring and enabling last** (`init`, 4323-4332):
```js
    rollBtn.addEventListener('click', onRoll);
    exploreListEl.addEventListener('click', onPresetClick);   // Try this: one delegated listener
    simBodyEl.hidden = false;
    rollBtn.disabled = false;
    for (const b of presetBtns) b.disabled = false;          // enabled with Roll, last (D-09)
```
→ add `form.addEventListener('click', onStepClick);` after the preset listener, and `for (const b of stepBtns) b.disabled = false;` next to the preset enable. Update the comment block at 4309-4314 ("the control listeners, the Roll click and the preset click come after it") to include the step click. Note that `form` already gets `input` / `change` / `submit` listeners in the loop at 4323-4327. Adding a separate `click` listener is fine. `type="button"` keeps the buttons from submitting.

**Analog D: the failure path** (`failPage`, 4295-4296):
```js
  rollBtn.disabled = true;
  for (const b of presetBtns) b.disabled = true;
```
→ add `for (const b of stepBtns) b.disabled = true;`. Update the comment at 4284-4286.

---

### U10. `#app`: kill heading, cards, note (component)

**Analog A: `setCard`** (2657-2660), called from `renderStats` (2681-2685):
```js
function setCard(id, value, sub) {
  statEl(id).textContent = value;
  statEl(id + '-sub').textContent = sub;
}
...
  setCard('stat-avg', view.avgPerHitText, `normal ${view.normalAvgText} · crit ${view.critAvgText}`);
```
→ at the end of `renderStats`: `setCard('stat-khits', k.cards[0].value, k.cards[0].sub)` and so on for the other two, plus `setText(killHeadEl, k.heading)` and `setText(killNoteEl, k.note)`, where `const k = view.kill`. Every string comes from VM. The renderer builds no sentence (Phase 4 shared pattern "Copy lives in VM, renderers only assign").

**Analog B: write-on-change for rarely changing text** (`renderExplain`, 3191-3196, and `setText`, 2899-2901):
```js
function renderExplain(view) {
  const e = view.chart.explain;
  setText(explainDmgEl, e.dmgLine);
  ...
}
```
→ use `setText` for the heading and the note. Typing in HP changes them on every keystroke, and `setText` avoids node churn when nothing changed (for example, an N drag).

---

### U11. `#app`: `renderSim` scoring, tally of runs, roll path (component + controller)

**Analog A: the run record and its reset** (2540-2552):
```js
const sim = { run: null, exact: null, tally: [], seq: 0, rollError: false };
let shownRunId = 0;
function resetSim() {
  sim.run = null;
  sim.exact = null;
  sim.tally = [];
  sim.rollError = false;
  shownRunId = 0;
}
```
→ add `let killShown = { runId: 0, hp: 0 };` next to `shownRunId`, reset it in `resetSim()`, and extend the comment at 2540-2543 ("`sim.tally` holds frozen runs").

**Analog B: the tally write** (`rollWith`, 2843-2845):
```js
  sim.tally = sim.run && Sim.sameAttack(sim.run.params, run.params)
    ? [run.total, ...sim.tally].slice(0, 5) : [run.total];
  sim.run = Object.freeze({ ...run, id: ++sim.seq });
```
→ store the frozen run instead of `run.total`. The object written into `sim.run` has the `id`, so build it first and then push that same object: `const fresh = Object.freeze({ ...run, id: ++sim.seq }); sim.tally = … ? [fresh, ...sim.tally].slice(0, 5) : [fresh]; sim.run = fresh;`. The reset rule is unchanged. **Every reader of `sim.tally` must change** (RESEARCH Pattern 7): 2982-2998 (`join(' · ')`, `sim.tally[0] | 0`, `for (const t of sim.tally.slice(1))`), and the smoke at 3966 and 3974 (`.length`, still fine).

**Analog C: the roll status** (`handleRoll`, 2856-2869):
```js
    const run = rollWith(rng);
    msg = VM.simStatus(run.total, sim.exact);
  ...
  scheduleRender();
  simStatusEl.textContent = '';
  requestAnimationFrame(() => { simStatusEl.textContent = msg; });
```
→ `msg = VM.simStatus(run.total, sim.exact) + ' ' + VM.killLine(VM.killTrack(run.rounds, state.hp))`, or the 3-argument form (U7). Status is still written only here.

**Analog D: rows built once per run id, cheap toggles every frame** (`renderSim`, 2944-2959 and 2961-2999):
```js
  if (run.id !== shownRunId) {
    ...
    simLogEl.tBodies[0].innerHTML = logBodyHtml(run);
    simLogEl.tFoot.innerHTML = `<tr><th scope="row" colspan="4">Total</th><td>${run.total | 0}</td></tr>`;
    ...
    shownRunId = run.id;
  }
  // Every frame: cheap toggles only (D-08, D-09, D-13).
```
- `logBodyHtml` (2888-2895) gains a 6th **empty** `<td></td>` per row. The tfoot gains a 6th `<td></td>` after the total, and `Total` keeps `colspan="4"`. The innerHTML rule is unchanged (T-03-07: only `| 0` integers and fixed literals).
- After the per-id block, add a new every-frame section: `if (killShown.runId !== run.id || killShown.hp !== state.hp) { … }`. It computes `const tr = VM.killTrack(run.rounds, state.hp)` and, **for each body row in place**, sets cell 5 via `replaceChildren`:
  - a text number for `hpAfter[i]`;
  - for the kill row, the nodes `num('0')`, `' '`, an `aria-hidden` span `'←'`, `' '`, `<i>killed</i>` wrapped in `.hp-kill`;
  - for down rows, `<span class="hp-down">enemy down</span>`.
  It then does `row.classList.toggle('kill', i + 1 === tr.killRound)` and `row.classList.toggle('down', tr.killRound !== null && i + 1 > tr.killRound)`, sets the tfoot HP cell `textContent = String(tr.leftAfter)`, and fills `#sim-kill` with `killLine` using `num()`. Finally it sets `killShown = { runId: run.id, hp: state.hp }`. **Never rebuild rows**: the smoke checks `body().rows[0] === row0` (3901, 3919).
- It must run in **both** stale and fresh states. HP re-scores a stale run too (UI-SPEC States: "Run, then attack edited").
- The tally write follows the existing `want`-string compare (2986-2998). The new `want` is `lead + sim.tally.map((r) => VM.tallyEntry(r, state.hp)).join('; ') + ' (expected ' + sim.exact.eText + ')'`. Node building stays the same: `num(String(sim.tally[0].total | 0))` for the newest total, `plain(…)` for the older totals, and outcome text as plain strings.

**Analog E: the no-run branch cleanup** (2924-2941, 03-REVIEW WR-02):
```js
    if (simNowEl.firstChild !== null) simNowEl.replaceChildren();
    if (simTallyEl.firstChild !== null) simTallyEl.replaceChildren();
    ...
    simTallyEl.hidden = true;
```
→ add `if (simKillEl.firstChild !== null) simKillEl.replaceChildren(); simKillEl.hidden = true;` and `killShown = { runId: 0, hp: 0 };`, so the markup matches a fresh load.

---

### U12. `runUiSmoke()` updates and additions (test)

**Phase 3 checks that break (update in place):**
- 3862-3864: `footCells[footCells.length - 1]` is now the HP cell. Change it to `footCells[1]`, because `Total` spans 4 columns (RESEARCH anti-pattern).
- 3951: `tallyWant` becomes `'Last 3 runs ' + 'at these settings, newest first: 71 · killed R15; 54 · killed R11; 47 · killed R16 (expected 54.0)'` at HP 40 (RESEARCH Pitfall 6 table).
- 3954 (`newest tally total is bold` → `'71'`) stays.

**New block A, HP control:** insert after the `formula ui` block (ends 4134), before `explore ui` (4136). Use the `explore ui` shell with held rAF (4143-4199) for the step-button click:
```js
    const queued = [];
    const realRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) => { queued.push(cb); return 0; };
    try {
      btns.find((b) => b.dataset.preset === 'cross').click();   // the real button, the real handler
    } finally {
      window.requestAnimationFrame = realRaf;
    }
    render();
    for (const cb of queued) cb(performance.now());
```
Checks:
- typing clamps, via `send(node('hp-num'), '0')` and `'9999'` and `''` (the `send` helper, 3313-3316, as the AC-box checks at 3322-3324 do);
- `+1 hit` → 45 and status text equals `VM.hpStatus(...)`;
- clicks at 499 → 500 then inert (`aria-disabled="true"`, state unchanged);
- step 0 at `show({ dmg: -4, die: 4 })`, where both buttons are inert;
- focus stays on the button (`document.activeElement === btn`);
- no button carries `data-key`.

In `finally`, clear `#hp-status` in a registered rAF, the same way as 4196-4197:
```js
    const statusEl = document.getElementById('explore-status');
    requestAnimationFrame(() => { if (statusEl) statusEl.textContent = ''; });
```

**New block B, re-score without staling:** after `sim log ui` (ends 3990), before `sim marks ui` (3992). Use the `sim log ui` shell (3839-3851: `$`, `txt`, `hid`, `show`, `body()`, `cellsAt`, `isStale`) and end with `resetSim()` in `finally` (3988-3990). Using the seed-6 pins (RESEARCH Pitfall 6), check that:
- at HP 40, `tr.kill` is row 15;
- `show({ hp: 72 })` keeps the same `sim.run.id`, `body().rows[0] === row0`, and `isStale() === false`, with no `tr.kill`, tfoot HP `1`, and a `#sim-kill` survived line;
- `show({ hp: 47 })` puts the kill on seed 1 row 20 with no `down` rows;
- `show({ ac: 16 })` still stales, and HP edits while stale still move `tr.kill`.

Use `cellsAt(5)` for the HP column.

**a11y ui order** (4228-4229):
```js
    const order = ['ac-range', 'ac-num', 'die', 'atk-num', 'dmg-num', 'n-range', 'roll', 'cross', 'dmg', 'cap',
      '#chart', '#controls'];
```
→ insert `'hp-num', 'hp-minus', 'hp-plus'` after `'dmg-num'`. `find` (4212-4217) falls through to `getElementById`, which works for these ids. `labelOf` (4218-4227) returns the button itself for `BUTTON` and `el.labels[0]` for `#hp-num`, so it needs no change.

**Final reset** (4246-4248) already restores `DEFAULT_STATE`, which now includes `hp: 40`.

---

### U13. `tools/check-engine.mjs`: K-series (test, batch)

**Header** (1-91): add a `and the Phase 5 kill math (plan 05-01):` paragraph listing K1..K9, in the (r)-(x) style.

**Invariant registry** (148-177): letters `a`..`z` are used up (Pitfall 8). Add string keys in the same `'(K1) …'` label style, for example `K1: '(K1) KILL-03 E[H] exact tenths/whole vs BigInt, every key x HP 1..500'`, and so on. `counts` (188) and the report (1219-1221) iterate `Object.keys(names)`, so they need no change. Add `extra.K*` entries (1141-1154) for coverage numbers: fallbacks taken, tie counts, "over 1,000" pairs, worst `killTable` ms.

**`record`** (197-200) takes `p` with `ac/atk/die/dmg`. For per-key failures, pass a synthetic `p` plus `hp` in `detail`, like `xp(key)` in (x) at 1026-1027:
```js
  const xp = (key) => ({ ac: `(preset ${key})`, atk: '', die: '', dmg: '' });
  const bad = (key, detail) => record('x', xp(key), detail);
```

**Analog: per-key memo, outside the per-setting work** (`dist20Of` + `distMemo`, 202-236 and 728-738):
```js
// (p) The exact 20-round distribution depends only on the one-round pmf, which is fixed by
// (hitFaces, die, dmg): the d20 enters only through how many faces hit. One memo entry per
// key (2,470 keys) makes the check exhaustive at about 3 s.
function dist20Of(p, sp) {
  ...
  for (let r = 1; r <= 20; r++) {
    const kind = DiceMath.outcome(r, atk, ac);
    if (kind === 'hit') { for (let k = 1; k <= die; k++) add(DiceMath.damageFor(r, [k], p), die); }
    else if (kind === 'crit') { … add(DiceMath.damageFor(20, [x, y], p), 1); }
    else { add(DiceMath.damageFor(r, [], p), die * die); }
  }
```
- The **round-DP oracle** reuses this exact per-round weight enumeration (`den1 = 20 * X^2`) and runs it as an absorbing DP over cumulative damage truncated at 500. This keeps it independent of the page's thinning method.
- The **BigInt oracle** is the `N_n` recurrence (RESEARCH Pattern 3).
- Both run in **their own loop over the 2,470 keys**, after the combo loop (after 911, next to the (y)/(s)(t) pins). Build `const killTabs = new Map()` keyed `${hf},${die},${dmg}` from `DiceMath.killTable`. **Never** call `VM.killView` in the loop, because the LRU would thrash (RESEARCH Pattern 2).

**Per-setting strings:** hook them inside the combo loop next to `checkCopy(p, view, …)` (699-707), reusing `view`. For each HP in the RESEARCH sample set {1, 2, 3, 5, 40, 45, 100, 499, 500, 1+D, 2+D, 3+D, 20·(2X+D), 20·(2X+D)+1, m·step±1}, clamped to 1..500, call `VM.killViewFrom(killTabs.get(key), view, hp)`. Compare every printed number with the **oracle's own** value, never with a re-run of the VM formatter (Pattern 8, Phase 4 IN-02). Also check the step from exact vs the card (all 70,980; 1,412 step-0, 99 ties).

**Pins:** D-05 values at the defaults, in the style of the (t) pins (941-952):
```js
  for (const [pin, want] of WIN_PINS) {
    let got;
    try { got = flatWin(VM.formulaView(VM.statsView(pin)).win); } catch (err) { got = `threw ${err && err.message}`; }
    if (got !== want) record('t', pin, `pin ${JSON.stringify(got)} vs ${JSON.stringify(want)}`);
  }
```

**Markup parity** (if static labels ship, Pitfall 9): copy (x)'s raw-file slice and `dec()` (1038-1043, 1063). Grab `#hp-minus` / `#hp-plus` / `#hp-hits` text from `html` and compare it with `VM.killView(VM.statsView(VM.DEFAULT_STATE), 40)` strings.

**Timing:** after the report's self-test time line (1237-1238), print the worst `killTable` ms over the 2,470 keys. Use `WARNING:` above 8 ms, and never fail on it:
```js
if (Number(SelfTest.ms) > 200) console.log(`WARNING: Node self-test took ${SelfTest.ms} ms (budget 200)`);
else console.log(`selftest time ${SelfTest.ms} ms (budget 200)`);
```

---

### U14. `tools/check-page.mjs` (test, batch)

**Guard (11) list** (387):
```js
  const want = ['ac-range', 'ac-num', 'die', 'atk-num', 'dmg-num', 'n-range', 'roll', 'cross', 'dmg', 'cap', '#chart', '#controls'];
```
→ insert `'hp-num', 'hp-minus', 'hp-plus'` after `'dmg-num'`. The keying at 378-383 uses `el.attrs.id` for buttons without `data-preset`, so the step buttons key by id with no code change. The `disabled` problem at 374 enforces that init removed `disabled`. Inert must be `aria-disabled` (UI-SPEC A2). Update the header list at 39-42.

**Guard (7)** (479-486):
```js
  const presetEls = [...walk(tree)].filter((el) => el.tag === 'button' && classes(el).includes('btn-preset'));
  check('Roll and preset buttons enabled after init',
    rollEl !== null && … && presetEls.length === 3 && presetEls.every((b) => !('disabled' in b.attrs)),
```
→ add `stepEls` filtered by `btn-step`. Require `stepEls.length === 2 && stepEls.every(no disabled)`, rename the check to include the step buttons, and extend the detail string. Update the header at 24-25.

**Fault modes** (465-468):
```js
  const presets = [...walk(tree)].filter((el) => el.tag === 'button' && classes(el).includes('btn-preset'));
  check(`fault: every .btn-preset disabled (${presets.length})`, presets.every((b) => 'disabled' in b.attrs));
```
→ add the same check for `.btn-step`, and also assert `length === 2`. Update the header at 54-62.

**Unchanged (verified against the guard code):** (3) 80 row headers (the log is empty at load), (9)/(10) names (the `label for` and the button text), (12)/(13), and (14) page order (the HP group is inside `form#controls`, the kill cards inside `section#stats`).

**`--expect` at defaults** is a CLI argument, not code. List the UI-SPEC handoff strings in the plan's verify step: `−1 hit (−5 HP)`, `≈ 8.1 average hits (1 hit ≈ 4.91 HP)`, `Killing a 40 HP enemy`, `on average, half of fights by round 15`, `the exact average is 8.7`. `norm()` already folds U+00A0 (header 18-19).

---

## Shared Patterns

### Copy lives in VM, renderers only assign
**Source:** `VM.formulaView` / `twoRollsText` (1302-1334) → `renderFormulas` / `renderTwoRolls`, and `VM.simStatus` (1831) → `handleRoll` (2858).
**Apply to:** kill cards, heading, note, hits line, step labels, `hpStatus`, `killLine`, `tallyEntry`. The DOM layer never builds a sentence. It only adds `num()` bolding.

### Exact integers, format once, exact-integer branch tests
**Source:** `fixed` / `tenths` / `signed` (1245-1256), `avgPerHitText` (1280-1281), and `formulaView`'s `===` branch tests (1362, 1381-1382).
**Apply to:** `hpStep`, the simple-division tenths (integer ratio), and `roundKill` (float + BigInt fallback → integer → `fixed`). Choose each branch by an integer test (`fastest > 20`, `2 + D >= hp`, `medianRound[hp] === 0`), never by a float compare.

### Pure builder + memo wrapper; per-combo callers never hit the memo
**Source:** `chartExplain` vs `chartView` (1708-1735), `leverMemo` (1673), check-engine `distMemo` (236), and the `statsView` contract comment (1258-1262).
**Apply to:** `killViewFrom` (pure) vs `killView` (LRU), check-engine's own `killTabs` Map, and `statsView` staying kill-free.

### Event record outside state; status written only by the handler, cleared by render or the smoke
**Source:** `sim` + `shownRunId` (2540-2552), `lastPreset` (2554-2559), and `handleRoll` / `applyPreset` rAF writes (2868-2869, 2629-2631).
**Apply to:** `killShown`, `#hp-status`, and `sim.tally` as runs. `render()` never writes `#hp-status`.

### Guarded init, enable last; failPage disables
**Source:** `init()` (4315-4332) and `failPage` (4287-4298).
**Apply to:** the step-button click listener and enabling (with Roll and the presets), and disabling them in `failPage`. check-page `--fault render|later` is the automated proof.

### textContent / replaceChildren only; innerHTML for integers and fixed literals
**Source:** `num()` (2812-2817), `setText` (2899-2901), and `logBodyHtml` T-03-07 (2880-2896).
**Apply to:** HP log cells (`replaceChildren` with `num` / text / `<i>` / `.hp-down` span), `#sim-kill`, and the tally. The new empty 6th `<td></td>` in `logBodyHtml` is a fixed literal.

### Crash-isolated tests and split literals (IN-06)
**Source:** `section(name, fn)` (2013-2017), the per-block `try/catch/finally` in `runUiSmoke` (3986-3990), and split strings such as `'Round by ' + 'round'` (3886).
**Apply to:** `section('kill')`, the HP control smoke, and the re-score smoke. Any expected value that repeats visible kill copy is split. `finally` always calls `resetSim()` and clears the status in a rAF.

### Dev tools fail loudly with one prefix
**Source:** check-engine `fail()` / `record()` / report (98-101, 197-200, 1218-1246), and check-page `check()` + `CHECK-PAGE FAIL` (441, 528-534).
**Apply to:** K1..K9, the oracle comparisons, the extended guards (7)/(11), and the fault checks. Timing only **warns**.

## No Analog Found

| Unit / piece | Role | Data Flow | Reason |
|---|---|---|---|
| `killTable` thinning DP (binomial `b[]` on `[lo, hi]`, `F` rows with suffix sums, median pointer) | service (engine) | batch | No DP over remaining HP exists. The nearest is check-engine's `dist20Of` convolution (205-235). Use RESEARCH §Code Examples verbatim. |
| `killHitsExact` / `roundKill` BigInt tie-break | utility | transform | The page has no `BigInt` today (grep: 0 hits). Use RESEARCH Pattern 3 and §Code Examples. |
| Kill-table LRU eviction | service | memo | `leverMemo` and `chartMemo` have no eviction. Add `Map` delete-oldest past ~8 entries (RESEARCH A4). |
| `aria-disabled` inert state | component | event-driven | The page has no `aria-disabled` today (grep: 0 hits). Style and semantics come from UI-SPEC Step button states and A2. The click guard is in `onStepClick`. |
| check-engine round-DP / BigInt oracles | test | batch | New oracles. The per-round weight enumeration reuses `dist20Of` (209-218). The DP and BigInt `N_n` come from RESEARCH §Code Examples "check-engine oracles". |

## Metadata

**Analog search scope:** `index.html` (style 84-165, 479-658; markup 690-939; `#dice-math` 945-1139 in full; `#dice-sim` 1141-1211 in full; `#view-model` 1213-1392 and 1644-1855; `#dice-selftest` 1857-1876, 2008-2019, 2316-2471; `#app` 2530-2710, 2808-3000, 3191-3196, 3307-3328, 3768-3995, 4084-4343), `tools/check-engine.mjs` (1-260, 636-755, 905-964, 995-1069, 1100-1246), `tools/check-page.mjs` (1-66 header via grep, 364-534)
**Files scanned:** 3 source files + 4 planning docs (05-CONTEXT, 05-RESEARCH, 05-UI-SPEC, 04-PATTERNS)
**Pattern extraction date:** 2026-09-27
