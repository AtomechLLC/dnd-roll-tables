# Phase 4: Designer Explanation & Final Ship - Pattern Map

**Mapped:** 2026-09-26
**Files analyzed:** 15 logical units: 11 regions inside `index.html`, 2 dev tools, `README.md`, and the publish run (remote state plus `.planning` traceability). No new files ship.
**Analogs found:** 15 / 15. Every unit has an in-repo analog. The closest thing to a gap is the check-page mini element tree, which replaces regex-over-markup. Its code comes from RESEARCH §Code Examples, and the tool it lands in is its analog.

The whole app is one file, `index.html` (3,412 lines at mapping time, commit 8b66f44). Each inline block or CSS/markup region counts as a "file" here. Every line number below is for the current `index.html` / `tools/*.mjs` and **will shift** as earlier plan edits land. Executors should find each spot by its quoted anchor text, not by the number.

**Already done:** `<link rel="icon" href="data:,">` is already at `index.html` line 8 (RESEARCH Pitfall 8), so no favicon work is left.

Current block map:

| Block | Lines | Anchor |
|---|---|---|
| `<head>` meta + CSP + icon | 3-9 | `<meta http-equiv="Content-Security-Policy" …>` |
| `<style>` | 10-562 | `:root {` … `#selftest li.fail` |
| `<main>` markup | 565-739 | `<section id="sim" …>` ends at 738, `</main>` at 739 |
| `<footer>` | 741-743 | `D&amp;D 5e rules for a single attack` |
| `<script id="dice-math">` | 745-939 | `const DiceMath = (() => {` |
| `<script id="dice-sim">` | 941-1003 | `const Sim = (() => {` |
| `<script id="view-model">` | 1005-1293 | `const VM = (() => {` |
| `<script id="dice-selftest">` | 1295-1851 | `const SelfTest = (() => {` |
| `<script id="app">` | 1853-3410 | `// DOM layer: state, render registry, controls, init, ?test panel.` |

## File Classification

| New/Modified unit | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| U1 `<style>`: `.explain`, `.chart-explain`, `.card.formulas`, `formula` container, `dl.formulas`, `.formula`, `.f-*`, `.nw`, `#explore` + `.explore-*`, `.btn-preset`, `a` links, legend `flex-shrink` | config (stylesheet) | transform | `.chart-caption` (355-358), `.card` / `.card.marginal` (145-162), `#stats` subgrid (144), `#sim` named container (430-434), `.btn-roll` (473-484), `.segs` hover mix (127), `.swatch.roll { flex-shrink: 0 }` (263) | exact |
| U2 Markup: lede sentence, `#formulas` card, `.f-marg` in `#marginal`, `#two-rolls`, `.chart-explain`, `section#explore` | component (static markup) | request-response | `.lede` (571), stat cards + `#marginal` (604-640), `#tables` head (642-644), `#chart-caption` (693), `#sim` section head (697-699), `#roll` (712), `#sim-status` (719) | exact |
| U3 `#view-model`: `statsView.exact` sub-object | service (view-model) | transform | `statsView` (1053-1083) | exact (self) |
| U4 `#view-model`: `formulaView(sv)`, `twoRollsText(sv)` | service (view-model) | transform | `statsView` (1053-1083), `ruleText` (1086), `simExact` branch copy (1248-1262), app `MARG_HIT_ZERO` (1973-1977) | exact |
| U5 `#view-model`: `explainChart(p, series, hits)` called in `chartBase` | service (view-model) | transform | `captionOrder` / `captionCross` / `captionBands` (1137-1182) and their call site in `chartBase` (1224-1230) | exact |
| U6 `#view-model`: `PRESETS`, `presetStatus`, readout fix (02 WR-02), `simExact <= 0` (03 WR-01), exports | service (view-model) | transform | `CONTROL_SPEC` / `DEFAULT_STATE` (1011-1018), `simStatus` + `settingsText` (1241, 1274-1275), `chartBase` readout (1205-1210), export list (1287-1291) | exact |
| U7 `#dice-selftest`: 4 or fewer cheap pins (formula, two-roll, explain, synthetic crossings, WR-01 pin) | test | batch | `section('sim', …)` (1758-1843), `SW` memo (1558-1563), synthetic `crossings` arrays (1642-1658) | exact |
| U8 `#app` renderers: `renderFormulas`, `renderExplain`, `renderExplore` (or folded into `renderStats` / `renderTable` / `renderChart`) | component (renderer) | transform (view → DOM) | `renderStats` / `setCard` (1967-2005), `num()` (2083-2088), `setText` (2170-2172), `renderFootnote` (2489-2499), caption write in `renderChart` (2447) | exact |
| U9 `#app` preset wiring: `lastPreset`, `applyPreset`, delegated click, status write and clear | controller | event-driven | `onControl` (1941-1947), `setState` (1916-1919), `sim` outside-state record (1901-1913), `handleRoll` status write (2125-2141), `render()` comparison (1925-1935) | exact |
| U10 `#app` review fixes: `init()` restructure + `broken` (03 WR-04 / 02 WR-01), `renderSim` no-run reset (03 WR-02), `isPrimary` (02 IN-05) | controller | event-driven | `init()` (3371-3407), `scheduleRender` (1920-1924), `showEngineError` (3363-3369), `renderSim` no-run branch (2181-2204), `pointermove` (2357-2364) | exact (self) |
| U11 `#app` `runUiSmoke()`: formula/table-branch block, explore block + reset, runtime a11y block | test | event-driven (synthetic) | `sim ui` block (3016-3079), `cross ui` helpers (2945-2964), focus use (2599-2606), layout checks (2744-2748), deferred status clear + final reset (3332-3338) | exact |
| U12 `tools/check-engine.mjs`: (o) `<=`, (p) exhaustive with memo, stride 53 + coverage, domain from `CONTROL_SPEC`, new (r)-(y), IN-04 counts, exactly one `Math.random` | test (dev tool) | batch | its own header (1-43), static gate (65-73), `names` / `record` (97-128), domain loops (131-154), (o) (187-201), (p) (203-244), stride sites (257, 287, 322), `dist` tallies (327-335), report (402-421) | exact (self) |
| U13 `tools/check-page.mjs`: mini tree visible text (03 WR-03), URL param parse (02 IN-02), a11y guards (9)-(13), Chrome budget gate (03 IN-01), `--fault render` | test (dev tool) | batch | its own args (34-57), `rendered` / `visible` (105-116), DOM-state regex checks (127-141), `--expect` loop (143-145), browser spawn (71-100) | exact (self; the tree parser code comes from RESEARCH) |
| U14 `README.md` body rewrite + real URL | config (docs) | file-I/O | current `README.md` (1-46) and 01-03-PLAN Task 1 content list | exact |
| U15 Publish run + traceability (`REQUIREMENTS.md`, `STATE.md`, `ROADMAP.md`) | config (ops runbook) | request-response (REST) | `01-03-PLAN.md` Tasks 1-2 (lines 71-160), `01-02-PLAN.md` auth checkpoint (77-107), `REQUIREMENTS.md` traceability rows (162-170) | exact |

---

## Pattern Assignments

### U1. `<style>` additions (config)

**Insertion point:** after the sim rules, before the self-test panel rules. Anchor: the comment `/* Self-test panel and engine-error banner (UI-SPEC Self-test Panel, States) */` (line 534). The legend fix goes **in place** at line 263.

**Analog A: explanation paragraph = chart caption** (lines 355-358). `.explain` copies this Body/ink rule and swaps the margin:
```css
    .chart-caption {
      margin: var(--sp-3) 0 0; max-width: 72ch;
      font-family: var(--font-prose); font-size: 1rem; line-height: 1.5; color: var(--ink);
    }
```
Use `.explain { margin: 0 0 var(--sp-3); max-width: 72ch; font-size: 1rem; line-height: 1.5; color: var(--ink); }`, `.chart-explain { margin-top: var(--sp-3); display: grid; gap: var(--sp-2); }`, `.chart-explain .explain { margin: 0; }`. **Do not** reuse `.section-intro` (319-322, 14px muted). UI-SPEC A3 keeps the lesson in ink.

**Analog B: card + full-row marginal card** (lines 145-162):
```css
    #stats > .card:not(.marginal) { grid-row: span 3; grid-template-rows: subgrid; }
    .card {
      display: grid; gap: var(--sp-2); padding: var(--sp-3); align-content: start;
      background: var(--surface);
      border: 1px solid var(--line); border-radius: 8px;
    }
    ...
    .card.marginal { grid-column: 1 / -1; }
    .card.marginal h2 { margin: 0; }
    .marg-line { margin: 0; font-size: 1rem; line-height: 1.5; }
    .marg-line .lead { font-weight: 700; }
    .marg-line .mv { font-family: var(--font-num); font-variant-numeric: tabular-nums; font-weight: 700; }
```
- **Subgrid trap:** line 144 applies `grid-row: span 3; grid-template-rows: subgrid` to every `#stats > .card:not(.marginal)`. The new `.card.formulas` would match it. Change the selector to `#stats > .card:not(.marginal):not(.formulas)`, or give `.formulas` its own `grid-row: auto; grid-template-rows: none;`.
- `.card.formulas { grid-column: 1 / -1; container: formula / inline-size; }`, `.card.formulas h2 { margin: 0; }` (copy line 159). Add `container: formula / inline-size;` to `.card.marginal`.
- `.f-live` copies `.marg-line .mv` (the num face, tabular) at weight 400, and its result `<b class="num">` gets 700.

**Analog C: a named container with a width query** (lines 430-434):
```css
    #sim { container: sim / inline-size; }
    .sim-body { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--sp-4); }
    @container sim (width >= 54rem) {
      .sim-body { grid-template-columns: minmax(0, 32rem) auto; column-gap: var(--sp-5); align-items: start; }
    }
```
→ `.formula { display: grid; grid-template-columns: minmax(0, 1fr); }` and `@container formula (width >= 40rem) { .formula { grid-template-columns: 12rem minmax(0, 1fr); column-gap: var(--sp-3); } .formula > dt { grid-row: 1 / span 6; } }`. The container **must be named**. The unnamed table-tier queries at 215/220 (`@container (width < 42rem)`) would otherwise resolve against it (see the comment at 426-427).

**Analog D: italic prose line** (`.fig .value .empty`, lines 463-466):
```css
    .fig .value .empty {
      font-family: var(--font-prose); font-style: italic; font-weight: 400;
      font-size: 1rem; color: var(--ink-muted);
    }
```
→ `.f-rule` is prose italic 400 in `--ink` (not muted). `.f-rule .num` is upright `--font-num` so digits line up (UI-SPEC Typography). `.f-key` / `.f-note` use Label 14 / 1.4 (copy `.card .label`, line 150; `.f-key` muted, `.f-note` ink). The hanging indent on `dd.f-rule, dd.f-live` is `padding-left: var(--sp-3); text-indent: calc(-1 * var(--sp-3));`. `.nw { white-space: nowrap; }` copies the per-part rule at 457 (`.fig .value .num, .fig .value .sd { white-space: nowrap; }`).

**Analog E: preset card grid = stats subgrid** (lines 138-144). `.explore-list` uses `list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); gap: var(--sp-3);`. `.explore-item` uses the `.card` look plus `grid-row: span 4; grid-template-rows: subgrid;`, the same technique as line 144.

**Analog F: the page's button** (lines 471-484):
```css
    .btn-roll {
      background: var(--accent); color: var(--paper);
      border: 1px solid var(--accent); border-radius: 4px;
      font: 700 1rem/1.5 var(--font-prose);
      min-height: 40px; padding: 0 var(--sp-4); width: fit-content; justify-self: start;
      cursor: pointer; touch-action: manipulation;
    }
    .btn-roll:hover:not(:disabled) { background: color-mix(in oklch, var(--accent) 85%, var(--ink)); }
    .btn-roll:active:not(:disabled) { background: color-mix(in oklch, var(--accent) 70%, var(--ink)); }
    .btn-roll:disabled {
      background: var(--surface); color: var(--ink-muted); border-color: var(--line); cursor: not-allowed;
    }
```
`.btn-preset` copies the shape with UI-SPEC values: `background: var(--paper); color: var(--ink); border: 1px solid var(--ink-muted);`, `padding: var(--sp-2) var(--sp-3); max-width: 100%; text-align: left; justify-self: start; align-self: end;`. Hover uses `color-mix(in oklch, var(--paper) 85%, var(--ink))` (the `.segs` hover recipe at 127 applied to `--paper`), and active uses 75%. `:disabled` is **byte-identical** to `.btn-roll:disabled`. Add no focus rule, because the global `:focus-visible` (109) covers it. Links get `a { color: var(--ink); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 2px; } a:hover { text-decoration-thickness: 2px; }` (no accent, UI-SPEC Color).

**Analog G: legend shrink fix (in place)** at line 263:
```css
    .swatch.roll { flex-shrink: 0; }   /* keeps its 40px beside the long legend text */
```
→ `.legend-item > .swatch, .legend-item > .ramp { flex-shrink: 0; }`. It generalizes the rule, and line 263 may be folded in. It must sit after `.legend-item` (286) or use equal specificity. Two classes beat `.swatch` (288) either way.

**Status line:** `.explore-status { margin: var(--sp-3) 0 0; min-height: 1.4em; max-width: 72ch; font-size: 0.875rem; line-height: 1.4; color: var(--ink); }`. The reserved-height precedent is `.readout` min-height (395-401).

---

### U2. Markup additions (component, static)

**Lede** (line 571): append one sentence to the existing `<p class="lede">` text (UI-SPEC Copywriting). Change nothing else in the header.

**`#stats` insertion points** (604-640): the new `div.card.formulas#formulas` goes **between** the focal card's `</div>` (634) and `<div class="card marginal" id="marginal">` (635). `dl.formulas.f-marg` goes inside `#marginal` after `<p class="marg-line" id="marg-dmg">` (638).

**Analog: static label, empty live slot** (the stat card, 605-609, and the marginal line, 637):
```html
      <div class="card">
        <span class="label">Hits on</span>
        <span class="value" id="stat-threshold"></span>
        <span class="sub" id="stat-threshold-sub"></span>
      </div>
      ...
        <p class="marg-line" id="marg-hit"><span class="lead">+1 to hit:</span> <span class="mv" id="marg-hit-v"></span><span class="mnote" id="marg-hit-n"></span></p>
```
Formula groups follow this split: `dt` and `dd.f-rule` / `dd.f-key` text are **static markup** (so they show with no JS, per UI-SPEC States). Every `dd.f-live` / `dd.f-note` is an **empty slot with an id**, filled by `textContent` / `replaceChildren`. For the per-round table branch, ship both `dd.f-live` (line 2) and `dd.f-note` and toggle `hidden` (RESEARCH Pattern 3). Copy the `hidden` attribute usage from `#sim-now` (717).

**`#tables`** (642-644): insert `<p class="explain" id="two-rolls"></p>` between `<h2>Outcome table</h2>` (643) and `<div id="legend" class="legend">` (644).

**`#chart`** (693-694): insert `div.chart-explain` right after `<p id="chart-caption" class="chart-caption"></p>` (693), **inside** `.chart-wrap` (it closes at 694). Each `p.explain` holds a static `<b>` lead-in and an empty `<span>` for the generated body. The lead-in plus span shape copies `.marg-line` (637: static `.lead` + live `.mv`).

**`section#explore`**: insert between `</section>` of `#sim` (738) and `</main>` (739). Analog section head (697-699):
```html
    <section id="sim" aria-labelledby="sim-h">
      <h2 id="sim-h">20 rounds, rolled for real</h2>
      <p class="section-intro">The numbers above are exact averages. …</p>
```
→ `<section id="explore" aria-labelledby="explore-h">`, `<h2 id="explore-h">Try this</h2>`, `<p class="section-intro">…</p>`, then `<ul class="explore-list" role="list">` (RESEARCH A4).

**Analog: the button** (712):
```html
              <button type="button" id="roll" class="btn-roll" disabled>Roll 20 rounds</button>
```
→ `<button type="button" class="btn-preset" data-preset="cross" aria-describedby="ex-cross-d ex-cross-s" disabled>Try AC 25 with a d12</button>`. It is `disabled` in the markup, with no `onclick`. **Never `data-key`**: `renderControls` (1958) walks every `[data-key]`, and `onControl` (1942) keys off `dataset.key` (RESEARCH Pattern 5).

**Analog: status region** (719): `<p id="sim-status" class="vh" role="status"></p>` → `<p id="explore-status" class="explore-status" role="status"></p>`. It is **visible** (no `.vh`), per UI-SPEC.

**No-analog detail:** the jump links `<a href="#chart">` / `<a href="#controls">` are the page's first links. Both targets already have ids (`#chart` at 679, `form#controls` at 576).

**Page-order check that will break:** the smoke at 3032-3034 asserts `sim` is the last `<section>` in `main` (`'sim after chart'`). Update it to expect `explore` last, after `sim`.

---

### U3. `#view-model`: `statsView.exact` (service, transform)

**Analog: itself** (1053-1083). `s`, `m`, `ha` are already in scope:
```js
  function statsView(state) {
    const p = { ac: state.ac, die: state.die, atk: state.atk, dmg: state.dmg };
    const s = DiceMath.stats(p);
    const m = DiceMath.marginals(p);
    const ha = DiceMath.hitAverages(p);
    ...
      marg: {
        hit20: fixed(mHitT, 1), hitRound: fixed(mHitT * 5, 3),
        dmg20: fixed(mDmgT, 1), dmgRound: fixed(mDmgT * 5, 3),
        reason: m.reason,
      },
      heatMax: Math.max(1, 2 * X + p.dmg),                      // heat domain [0, crit max]
      critFloorDiffers: s.tableSum * X !== s.e20Num,            // only when dmg <= -3
    };
```
Add `exact: { e20Num: s.e20Num, e20Den: s.e20Den, hitNum: m.hitNum, dmgNum: m.dmgNum, den: m.den, normalNum: ha.normalNum, normalDen: ha.normalDen }` next to `marg`. It adds **no** new engine calls. The contract comment at 1050-1052 ("the self-test grid and check-engine call it per combo … never pulls in compare or sweep work") still holds and should be extended by one clause.

---

### U4. `#view-model`: `formulaView(sv)` and `twoRollsText(sv)` (service, transform)

**Placement:** after `ruleText` (1086), before `compareView` (1091). Both are pure functions of a `statsView` result. They never call `DiceMath` again (RESEARCH Pattern 1 rationale).

**Analog A: flat print-ready strings from exact integers** (`statsView`, above). Every number is `fixed(intScaled, decimals)` (1038-1042), never a float `toFixed`:
```js
  function fixed(intScaled, decimals) {
    const neg = intScaled < 0, a = Math.abs(intScaled), p = 10 ** decimals;
    ...
  }
  const tenths = (num, den) => Math.round((10 * num) / den);
  const signed = (n) => (n < 0 ? '−' + Math.abs(n) : '+' + n);
```
Note that `fixed` emits ASCII `-` for negatives. Unevaluated groups like `(4.5 − 3)` must build the U+2212 sign explicitly (the same idea as `compareView`'s delta, line 1107: `(dT < 0 ? '−' : '+') + fixed(Math.abs(dT), 1)`).

**Analog B: one-line variant switch** (`ruleText`, 1086):
```js
  const ruleText = (t) => (t === 2 ? 'hits on 2+ (95% cap)' : t === 20 ? 'only a nat 20 hits' : `hits on ${t}+`);
```
→ `twoRollsText` sentence 1 switches on `sv.hitState` (`'cap' | 'floor' | 'normal'`, set at 1074). The article rule is `[8, 11, 18].includes(t) ? 'an' : 'a'`. The last sentence switches on `sv.critFloorDiffers` (1081). The cell count is `20 * sv.params.die`.

**Analog C: two-wording branch in one builder** (`simExact`, 1248-1262):
```js
    const lopsided = eT - sdT < 0 || s.hitFaces === 1;
    ...
      spreadText: lopsided
        ? `Most runs land between ${loText} and ${hiText} (damage cannot go below 0, so the spread is lopsided).`
        : `About 2 runs in 3 land between ${loText} and ${hiText}.`,
```
→ `formulaView` returns one object with every branch **decided by exact integer equality**, using the conditions verbatim from RESEARCH Pattern 3 (`roundRule`, `hitRule`, `dmgRule`, `verdictForm`, with the mixed case using `compare-displayed`). The results **print the card's own strings** (`sv.hitPct + '%'`, `sv.perRoundText`, `sv.marg.hitRound`, `sv.marg.dmgRound`, `sv.normalAvgText`), so D-04 holds by construction.

**Analog D: reason-keyed copy** (app block, 1973-1977):
```js
const MARG_HIT_ZERO = Object.freeze({
  cap: ' (already hits on 2+, the 95% cap)',
  floor: ' (still only a natural 20 hits)',
  nodmg: ' (the extra hits deal 0 damage at this damage penalty)',
});
```
→ the `+1 to hit` live line for `marg.reason` in `cap` / `floor` / `nodmg` is a frozen VM map in the same shape, with UI-SPEC strings. It lives **in VM**, not the app, so check-engine can assert it.

**Return shape:** RESEARCH Pattern 3: `{ hit: { live, result }, round: { lines, note, result }, plusHit, plusDmg, win: { text, verdict } }`. Live strings carry U+00A0 inside groups and around `×` (UI-SPEC wrapping rule).

---

### U5. `#view-model`: `explainChart(p, series, hits)` (service, transform)

**Analog: the three caption builders** (1135-1182). Each builder is pure, is fed the **same** `crossings` / `bands` objects, and returns a sentence. The empty string means "not drawn":
```js
  function captionCross(cr) {
    const k = cr.list.length;
    if (cr.first === 'none' || (k === 0 && cr.ties.length === 0)) return 'The curves never cross.';
    if (k === 0) return `The curves meet at ${signed(cr.ties[0])} but do not cross.`;
    if (k === 1) {
      const t = cr.list[0].tieN;
      return 'The curves cross once' + (t !== null ? `, at ${signed(t)}` : '') + '.';
    }
    return k === 2 ? 'The curves cross twice.' : `The curves cross ${k} times.`;
  }

  function captionBands(b) {
    const parts = [];
    if (b.floor) { parts.push(`Shaded from ${signed(b.floor[0])} to ${signed(b.floor[1])}: ` + …); }
    if (b.cap) { parts.push(`Shaded from ${signed(b.cap[0])} to ${signed(b.cap[1])}: ` + …); }
    return parts.join(' ');
  }
```
`explainChart` returns `{ dmgLine, hitLine, crossLine }` and follows the same discipline:
- `crossLine` switches on `cr.first`, `cr.list.length`, `cr.list[0].tieN` / `flipN`, `cr.endTieN`, and `cr.ties`. It uses the same precedence as `captionCross`, but distinguishes end-tie-only (`cr.endTieN !== null`) from touch (ties, no end tie). The N values come from `flipN` / `tieN` / `endTieN`, **never literals** (the ring labels at 1214-1223 use the same fields).
- `hitLine` = step sentence + band sentences **floor first** (the `captionBands` order), only for bands that are non-null. `cap[0] === 0` gets the "whole chart" wording. `die + dmg <= 0` (nodmg) gets the flat sentence and **no** band sentences.
- `dmgLine`: `straightFrom` is computed from `series.damage` steps vs `hits.hitFaces * series.den` (RESEARCH Pattern 4).

**Call site: inside `chartBase`** (1224-1233). This is where memoization comes for free (`chartMemo`, 1191-1196):
```js
    const caption = [
      `Expected damage over 20 rounds at AC ${p.ac}, …`,
      captionOrder(attack, damage),
      captionCross(crossings),
      captionBands(bands),
    ].filter((part) => part !== '').join(' ');
    return {
      maxN, den, attack, damage, attackText, damageText, ticks, readout, crossings, bands, markers, caption,
    };
```
Add `const st = DiceMath.stats(p), ha = DiceMath.hitAverages(p);` (once per memo key), then `explain: explainChart(p, { attack, damage, den, crossings, bands }, { hitFaces: st.hitFaces, normalNum: ha.normalNum, normalDen: ha.normalDen })`, and append `explain` to the return. An N-slider drag hits the memo, so it recomputes nothing (UI-SPEC Interaction Contract). The Phase 2 `caption` stays **byte-identical** (UI-SPEC A10). The smoke at 2963-2964 compares it to `VM.computeView(state).chart.caption`.

---

### U6. `#view-model`: presets, readout fix, `simExact` fix, exports (service, transform)

**Analog: frozen config data** (1011-1018):
```js
  const CONTROL_SPEC = Object.freeze({
    ac:  Object.freeze({ min: 10, max: 30 }),
    ...
  });
  const DEFAULT_STATE = Object.freeze({ ac: 15, die: 8, atk: 5, dmg: 0, n: 5 });   // D-03 (Phase 1 and 2)
```
→ `const PRESETS = Object.freeze([Object.freeze({ key, title, button, desc, sets: Object.freeze({ ac, die, atk, dmg, n }) }), …])` with the three UI-SPEC rows (cross 25/12/0/0/6, dmg 15/8/0/0/5, cap 15/12/0/0/15). If the markup's static title/desc/sets text is kept in HTML, check-engine (x) or the smoke should assert that the markup matches `VM.PRESETS`, so the data and the copy cannot drift.

**Analog: status sentence from `settingsText`** (1241, 1274-1275):
```js
  const settingsText = (p) => `AC ${p.ac}, d${p.die}, ${signed(p.atk)} to hit, ${signed(p.dmg)} damage`;
  ...
  const simStatus = (total, ex) =>
    `Rolled 20 rounds: ${total} damage. Expected ${ex.eText} ± ${ex.sdText}. ` + simPlacement(total, ex);
```
→ `const presetStatus = (s) => \`Set to ${settingsText(s)}, compare at ${signed(s.n)}. Everything above has updated.\`;`

**02 WR-02 readout fix, in place** (1205-1210), current:
```js
    const readout = aT.map((ta, k) => {
      const td = dT[k];
      const gap = ta > td ? `to hit ahead by ${fixed(ta - td, 1)}`
        : td > ta ? `to damage ahead by ${fixed(td - ta, 1)}` : 'even';
      return `At ${signed(k)}: to hit ${attackText[k]} · to damage ${damageText[k]} · ${gap}`;
    });
```
Decide the leader from `Math.sign(attack[k] - damage[k])` (exact numerators, the same test as `captionOrder` at 1141). Keep the tenths gap text, and use `'less than 0.1'` when the displayed gap is 0 but the exact gap is not. The comment at 1188 ("Readout gaps are the difference of the displayed tenths") gets amended. The existing self-test pin `chart: view defaults readout at n 5` (1600) must stay green.

**03 WR-01 fix, in place** (1252): `const lopsided = eT - sdT < 0 || s.hitFaces === 1;` → `<= 0`. Update the comment at 1245 ("lopsided: E - SD < 0") and `STATE.md` line 85 in the same plan.

**Exports** (1287-1291): append `formulaView, twoRollsText, explainChart, PRESETS, presetStatus`.

---

### U7. `#dice-selftest`: cheap pins (test, batch)

**Insertion point:** a new `section('copy', …)` (or `'explain'`) after `section('sim', …)` closes (1843), before `const failed = results.filter(...)` (1845).

**Analog: section helper + O(1) section** (1451-1455, 1758-1788):
```js
  const section = (name, fn) => {
    try { fn(); } catch (err) {
      results.push({ name: name + ' crashed: ' + (err && err.message), ok: false });
    }
  };
  ...
  section('sim', () => {
    const DEF = { ac: 15, atk: 5, die: 8, dmg: 0 };
    ...
    check('sim: settingsText at the defaults', VM.settingsText(DEF), 'AC 15, d8, +5 to hit, +0 damage');
```
Budget rules (RESEARCH Pitfall 4, the Node run is at 177-196 ms of 200): use `VM.statsView` only for formula and two-roll pins, and reuse `SW(15, 5, 8, 0)` (1559-1563, already computed by `section('chart')`) for any explain pin. **Never** call `VM.chartView` on a fresh setting.

**Analog: synthetic crossing arrays with no sweep** (1642-1658):
```js
    let c = CR([0, 1, 4, 7, 8, 9], [0, 2, 3, 4, 9, 10]);
    check('cross: synthetic two flips, count', c.list.length, 2);
    c = CR([0, 1, 3, 3], [0, 2, 3, 4]);
    check('cross: synthetic touch is no crossing (count, first, ties, end tie)', …);
```
→ feed these same arrays (plus the all-equal `[0, 1, 2]`) to `VM.explainChart` for the synthetic-only branches (two crossings, touch, `first === 'none'`, D-05). Supply `bands` / `hits` as literal objects.

**03 WR-01 pin** (O(1)): `check('sim: AC 13 −5 d4 −3 uses the lopsided sentence', VM.simExact({ ac: 13, atk: -5, die: 4, dmg: -3 }).spreadText, 'Most runs land between 0.0 and 5.2 (damage cannot go below 0, so the spread is lopsided).')`. Copy the style of the pin at 1775-1776.

**Split-literal rule (IN-06):** check **names** must not repeat visible copy (for example `'11/20 = 55%'` or `'Try AC 25 with a d12'`), because check-page's `--expect` excludes the panel only when the tree extractor drops `section#selftest`. Expected **values** are fine.

---

### U8. `#app` renderers (component, transform)

**Analog A: textContent-only card writer** (1967-1970, 1981-2005):
```js
function setCard(id, value, sub) {
  statEl(id).textContent = value;
  statEl(id + '-sub').textContent = sub;
}
...
function renderStats(view) {
  const { params: p, threshold, hitState, marg } = view;
  ...
  margDmgVEl.textContent = `+${marg.dmgRound} per round (+${marg.dmg20} over 20 rounds)`;
}
```
**Analog B: prose with a bold number, built as nodes** (2083-2088, 2098-2100):
```js
function num(text) {
  const b = document.createElement('b');
  b.className = 'num';
  b.textContent = text;
  return b;
}
...
    const parts = [t.ruleText + ' · ', num(t.totalText), ' over 20 rounds'];
    cmpEls[key].stats.replaceChildren(...parts);
```
→ each `dd.f-live` is `el.replaceChildren(liveText, num(result))`. The `Which wins` verdict and the `dd.f-note` figure use the same pattern with `<b>`. `num()` is already module-scope.

**Analog C: write only on change** (2170-2172):
```js
function setText(el, text) {
  if (el.textContent !== text) el.textContent = text;
}
```
→ use it for `#two-rolls` and the three `#explain-*` spans, which change rarely. It also avoids needless node churn during drags.

**Analog D: single-paragraph generated copy** (`renderFootnote`, 2489-2499, and the caption write at 2447 `chartCaptionEl.textContent = c.caption;`).

**Registration** (1898-1899):
```js
const RENDERERS = [renderControls, renderStats, renderTable, renderLegend, renderFootnote, renderCompare,
  renderChart, renderSim];
```
Either add `renderFormulas` after `renderStats`, `renderTwoRolls` after `renderTable`, and `renderExplain` after `renderChart`, or fold each into its host renderer. Append `renderExplore` last, but it may only **clear** status (U9). Formulas are **not** live regions (UI-SPEC). Element refs go into the top cache (1855-1893) under a `// Explanations and Try this (Phase 4)` comment, in the style of 1864/1873/1877.

---

### U9. `#app` preset wiring (controller, event-driven)

**Analog A: the one control path** (1941-1947, 1916-1919):
```js
function onControl(e) {
  const key = e.target.dataset && e.target.dataset.key;
  if (!key) return;
  const v = VM.parseControl(key, e.target.value, state[key]);
  if (v !== state[key]) setState({ [key]: v });
  else scheduleRender();
}
...
function setState(patch) {
  Object.assign(state, patch);
  scheduleRender();
}
```
→ `applyPreset(key)` builds **one** patch by calling `VM.parseControl(k, pr.sets[k], state[k])` for each `k` of `['ac', 'die', 'atk', 'dmg', 'n']`, then calls `setState(patch)` **once** (D-08). The full body is in RESEARCH Pattern 5. `renderControls` (1957-1965) then syncs every `[data-key]` control and `<output>`.

**Analog B: event record outside state** (1901-1913):
```js
// The last run lives here, never in state (RESEARCH Pattern 2, Pitfall 2): a run is an event,
// not a derivation. init() and the UI smoke do Object.assign(state, DEFAULT_STATE), which would
// not clear it, and renderControls walks [data-key]. …
const sim = { run: null, exact: null, tally: [], seq: 0, rollError: false };
```
→ `let lastPreset = null;` gets the same style of comment.

**Analog C: clear, then write in the next frame** (2138-2140):
```js
  scheduleRender();
  simStatusEl.textContent = '';
  requestAnimationFrame(() => { simStatusEl.textContent = msg; });
```
→ `exploreStatusEl.textContent = ''; requestAnimationFrame(() => { if (lastPreset === applied) exploreStatusEl.textContent = msg; });`. rAF runs callbacks in registration order, so the render queued by `setState` runs first.

**Analog D: staleness is a comparison inside `render()`** (1925-1935):
```js
function render() {
  const view = VM.computeView(state);
  // Derived once per frame (D-08, D-09, D-13): staleness is a comparison …, never a flag
  const stale = sim.run !== null && !Sim.sameAttack(sim.run.params, view.params);
  ...
}
```
→ add `if (lastPreset && PRESET_KEYS.some((k) => state[k] !== lastPreset[k])) { lastPreset = null; setText(exploreStatusEl, ''); }`. `render()` only ever **clears** the status. A rolled run goes stale through the existing comparison, with no new code.

**Delegated click:** one listener on `.explore-list` using `e.target.closest('button[data-preset]')`. It is wired in `init()` **after** the first render (U10), in the same way `rollBtn.addEventListener('click', onRoll)` is wired (3395).

---

### U10. `#app` review fixes: init, scheduleRender, renderSim, pointermove (controller)

**03 WR-04 / 02 WR-01: `init()`** (3371-3407), current `try` body:
```js
  try {
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
    rollBtn.addEventListener('click', onRoll);
    render();
    simBodyEl.hidden = false;
    rollBtn.disabled = false;
  } catch (err) {
    console.error('render failed:', err);
    showEngineError();
    ...
```
Target order (RESEARCH §Code Examples "init() restructure", Pitfall 6): `chartInit` → `renderControls` → **`render()`** → wire the form listeners, Roll, and the preset click → `simBodyEl.hidden = false` → enable Roll **and** every `.btn-preset` as the last statements. In `catch`: `broken = true;`, hide `#stats, #tables, #compare, #chart, #sim, #explore`, then the existing `showEngineError()` (3363-3369, keep its split literal) and the panel. `if (testMode) showSelfTestPanel(SelfTest, runUiSmoke());` stays **after** the `try`.

**`scheduleRender`** (1920-1924): add `|| broken` to the early return, with `let broken = false;` next to `let pending = false;` (1915).

**03 WR-02: `renderSim` no-run branch** (2181-2204). It currently empties the log and hides the note, now-line and tally, but leaves their text. Add `simNoteBaseEl.textContent = ''; simNoteStaleEl.hidden = true; simNowEl.replaceChildren(); simTallyEl.replaceChildren();`. Fold in 03 IN-05: guard the rebuild writes with `shownRunId !== 0`, in the same style as the existing guard at 2186 (`if (shownRunId !== 0 || simTotalEl.firstElementChild === null)`).

**02 IN-05** (2357-2358): the first line of the `pointermove` handler becomes `if (!e.isPrimary) return;`.

**03 IN-02 (the one random source)**: line 2144 `const onRoll = () => handleRoll(Math.random);` stays the file's only `Math.random`. check-engine tightens its gate to `=== 1` (U12).

---

### U11. `runUiSmoke()` additions (test, event-driven)

**Insertion point:** new `try { … } catch` blocks **after** the `sim marks ui` block (it ends at 3331) and **before** the deferred status clear and final reset (3332-3338). Explore must run after the sim blocks (it may roll a run to test staleness), and its own status clear must be registered after its click (RESEARCH Pitfall 5).

**Analog: block shell, text helper, split literals** (3013-3034, 3075-3079):
```js
  try {
    const text = (id) => document.getElementById(id).textContent;
    resetSim();
    Object.assign(state, VM.DEFAULT_STATE);
    render();
    ...
    check('sim ui: button label', btn.textContent, 'Roll 20 ' + 'rounds');
  } catch (err) {
    results.push({ name: 'sim ui smoke crashed: ' + (err && err.message), ok: false });
  } finally {
    try { resetSim(); } catch { /* … */ }
  }
```
**Analog: settings via `show(patch)` and ring counting** (2946-2958):
```js
    const show = (patch) => { Object.assign(state, VM.DEFAULT_STATE, patch); render(); };
    const svg = document.getElementById('sweep');
    const all = (sel) => Array.from(svg.querySelectorAll(sel));
    const rings = () => all('g.crossings circle.cross');
    ...
    show({});
    check('cross ui: defaults draw no ring', rings().length, 0);
```
**Analog: click through the real handler** (3054-3057): `btn.click(); check('sim ui: a click rolls exactly once', sim.seq, before + 1);` → `document.querySelector('button[data-preset="cross"]').click(); render();` (a synchronous `render()` flushes the patch just as the sim smoke does after `rollWith`). Then assert the controls read 25/12/0/0/6, `rings().length === 1`, and that `#explain-cross` contains `'at ' + '+6'`. If a run was rolled first, assert `simEl.classList.contains('is-stale')`.

**Formula block:** `show({ dmg: -3 })` → the per-round `dd.f-live` line 2 is `hidden` and `dd.f-note` is shown, and its text contains `view.perRoundText`. `show({ atk: -5, dmg: -2 })` → the mixed case uses the compare-displayed verdict.

**Runtime a11y block (DEPLOY-04):** focus and visibility per control in the expected order. The analogs are `acNum.focus()` (2599) and the layout checks (2744-2748, `getBoundingClientRect`, `scrollWidth <= clientWidth`). For each id, check `el.focus(); document.activeElement === el`, then `el.blur()`, and check that the label element's `checkVisibility()` is true with a non-zero rect.

**Reset, mirroring 3332-3338:**
```js
  requestAnimationFrame(() => { document.getElementById('sim-status').textContent = ''; });

  Object.assign(state, VM.DEFAULT_STATE);
  renderControls();
  render();
```
Add `lastPreset = null;` and `requestAnimationFrame(() => { exploreStatusEl.textContent = ''; });` next to the existing sim-status clear. Also update the page-order check at 3032-3034 (U2).

---

### U12. `tools/check-engine.mjs` (test, batch)

**Header** (5-43): extend the list with (r)-(y), and fix the stale "(i) 1-in-50", "(j) 1-in-50", "(l) 1-in-50", "(m) … 1-in-50" and "(p) a 1-in-53 sample … 0.60..0.87" wording.

**02 IN-03 / WR-03: domain from `CONTROL_SPEC`** (48, 117, 131-154), current:
```js
const TOTAL_COMBOS = 70980;
...
const MAXN = (VM.CONTROL_SPEC && VM.CONTROL_SPEC.n && VM.CONTROL_SPEC.n.max) || 20;
...
for (let ac = 10; ac <= 30; ac++) {
  for (const die of DiceMath.DICE) {
    ...
    for (let atk = -5; atk <= 20; atk++) {
      for (let dmg = -5; dmg <= 20; dmg++) {
```
→ `const CS = VM.CONTROL_SPEC;` gives the loop bounds `CS.ac.min..max`, `CS.die.set`, `CS.atk`, `CS.dmg`, `MAXN = CS.n.max` (no `|| 20`), and `TOTAL_COMBOS` as the product. Replace `combos % 50` at 257, 287 and 322 with `combos % SAMPLE` where `const SAMPLE = 53;`. Record `sampled.{ac,die,atk,dmg}` as Sets and assert sizes 21/5/26/26 before the report.

**Static gate** (72-73), current `if (randomCount > 1)`. Change it to `!== 1` and match `const onRoll = () => handleRoll(Math.random);` (03 IN-02).

**Invariant registry** (97-115) + `record` (125-128). Add keys with the same `'(x) …'` label style:
- (r) `#f-hit` faces / percent, (s) per-round branch + result string, (t) +1 lines and the `Which wins` form (inequality only when `hitRule && dmgRule`), and the two-roll threshold article over 3..19.
- (u) `straightFrom` and the dashed-line step, (v) the solid-line step and band sentences vs `attackBands`, (w) the crossover variant vs `crossings` and ring-label N, (x) every preset claim at its settings, (y) readout leader word vs `sign(attack[n] − damage[n])` for every N.
Hook points inside the per-combo loop: (r)(s)(t) next to `const view = VM.statsView(p);` (183), reusing `view` (it already carries `exact`). (u)(v)(w) after `DiceMath.crossings(a, d)` (309) and `attackBands` (342), calling `VM.explainChart(p, { attack: a, damage: d, den, crossings: c, bands: b }, hits)` with **no** new sweep. (y) uses the same `a` / `d` arrays. (x) runs once after the loop, next to (q) (356-400).

**03 WR-01: (o)** (199-201): change `ex.eT - ex.sdT < 0` to `<= 0`, **in the same commit** as the VM fix.

**03 WR-01: (p) exhaustive** (203-244): lift the one-round pmf and the 20-fold convolution (205-227) into `dist20Of(p, sp)`, and memoize it in a `Map` keyed `${s.hitFaces},${die},${dmg}` (RESEARCH §Code Examples). Drop the `if (combos % 53 === 0)` guard. Change the band test at 240 from `inBand <= 0.87` to `inBand < 0.80`, and keep `below >= 0.80` at 243.

**02 IN-04 counts:** next to `dist` (121, tallied at 327-335), count touches, leading ties and two-crossings, and fail if any is non-zero. Print them on the `crossings:` report line (411-412).

**03 IN-01:** after the report (403-409), print a warning (not a failure) when `Number(SelfTest.ms) > 200`.

---

### U13. `tools/check-page.mjs` (test, batch)

**Header** (1-23): renumber and add (9)-(13), the fault mode, and the budget gate. Rewrite item (5) to "visible text only".

**02 IN-02: URL handling** (48-57), current:
```js
} else if (plain) {
  url = url.replace(/\?test\b&?/, '?').replace(/\?$/, '');
}
const testMode = url.includes('?test');
```
→ `const u = new URL(url); if (plain) u.searchParams.delete('test'); url = u.href; const testMode = u.searchParams.has('test');`. This matters for the live-URL runs in U15.

**Args** (35-46): add `--fault` with a value (`render`), in the same `else if` style. Fault mode copies `index.html` to `fs.mkdtempSync(path.join(os.tmpdir(), 'crs-fault-'))`, which mirrors the profile dir at 71. It replaces the first `function render() {`, injects a `setTimeout` input dispatch before `</body>`, forces plain mode, and asserts: the banner is shown, `#roll` and every `.btn-preset` are `disabled`, the six sections are `hidden`, the console has `render failed`, and there is **no** `Uncaught`. Clean up the temp dir the same way as at 98-100.

**03 WR-03: visible text** (105-116, 143-145), current:
```js
const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const visibleMarkup = rendered.replace(/<section id="selftest"[^>]*>[\s\S]*?<\/section>/i, '');
const visible = decode(visibleMarkup);
const visibleText = decode(visibleMarkup.replace(/<[^>]*>/g, ''));
...
for (const text of expects) {
  check(`page shows ${JSON.stringify(text)}`, visible.includes(text) || visibleText.includes(text));
}
```
Replace this with `parseTree(rendered)` → drop `section#selftest` → `norm(visibleText(tree))`, matched against `norm(text)`. The code is in RESEARCH §Code Examples. Extend `decode` with `&nbsp;` → U+00A0, keeping `&amp;` last. Keep `aria-hidden="true"` text, and record why. Keep `rendered` (script/style stripped) for the existing regex checks, and use raw `dom` for the `<style>` reads in guards (12)/(13).

**Analog for new DOM-state guards** (127-141):
```js
const rowHeads = rendered.split('<th scope="row"').length - 1;
check('DOM has 80 <th scope="row"> headers', rowHeads === 80, `found ${rowHeads}`);

check('engine-error banner stays hidden', /<div id="engine-error" role="alert" hidden/.test(rendered));
check('Roll button enabled after init',
  /<button[^>]*id="roll"[^>]*>/.test(rendered) && !/<button[^>]*id="roll"[^>]*\bdisabled\b/.test(rendered));
```
Guards (9)-(13) use the same `check(name, ok, detail)` helper (119), with names prefixed `a11y …` so a failure prints `CHECK-PAGE FAIL`. They walk the mini tree, not regexes: labels via `for` / wrapping `label` / `aria-label` / `aria-labelledby` / text / `legend`, label-in-name for `#ac-num` excluding `.hint`, tab order with same-name radios collapsed and `section#selftest` excluded, `td.m` text `0` + the `.m` rule has `repeating-linear-gradient` (style line 245-246), and `.series-dmg` has `stroke-dasharray` (style line 342). Extend the Roll-enabled check to the three `.btn-preset`. The 80-row-header check stays unchanged, because formulas are a `<dl>`.

**03 IN-01 budget gate:** parse `SELFTEST PASSED: n/n (X ms)` from `consoleText` (it is already scanned at 121 and 149), and fail when X > 200.

---

### U14. `README.md` (docs)

**Current stale lines:** line 5 (`Phase 1 delivers the live outcome table and exact stats. The bonus comparison chart comes later.`) and lines 9-10 (`Not published yet. …`). The sections that stay are Self-test (12-14), Rules modeled (16-23), Run locally (25-33), How it's built (35-37), and Dev checks (39-46).

**Analog: the 01-03-PLAN Task 1 content list** (01-03-PLAN lines 93-101). It gives the same section list, now describing the finished page: tables, compare, chart, simulation, explanations, presets, `?test`. The pre-publish rewrite (04-04) keeps the `<owner>` placeholder. The publish plan swaps in the real URL. Write the file with the Write tool, not a heredoc (RESEARCH Pitfall 10).

---

### U15. Publish run + traceability (ops)

**Analog: 01-02-PLAN Task 2 checkpoint** (lines 77-107): the `<task type="checkpoint:human-action" gate="blocking">` wording, the steps `gh auth login --hostname github.com --git-protocol https --web` → answer Yes to git auth → `gh auth status`, the resume signal `authed`, and the verification `"/c/Program Files/GitHub CLI/gh.exe" auth status`. **Drop step 1 (the winget install)**, because gh 2.101.0 is installed. **Add** the author-email disclosure note (RESEARCH Pitfall 11).

**Analog: 01-03-PLAN Tasks 1-2** (lines 71-160). Reuse them verbatim, with these edits:
- Skip the branch rename and the `.nojekyll` creation (both are done). Keep the OWNER derivation and README URL step, and keep the secret scan `git grep -nE 'gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}'` (exit 1).
- Add `"$GH" auth setup-git` before the push.
- Prefix every `gh api` call with `MSYS_NO_PATHCONV=1`, and use `user`, never `/user`. The POST-then-PUT Pages call is in RESEARCH §Code Examples "Publish".
- Step 6's background poll loop (40 × 15 s, `curl` code + `pages/builds/latest` status) stays as is.
- Step 7's live checks: `--expect "11/20 = 55%" --expect "Try AC 25 with a d12"` (the Phase 4 unique strings, per RESEARCH Pitfall 2), plus the plain run.

**Traceability** (`REQUIREMENTS.md` lines 71-82 checkboxes and 162-170 table rows):
```
| DEPLOY-02 | Phase 1 | Partial (main branch, .nojekyll, README done locally; public repo deferred 2026-09-25, user chose local git) |
| DEPLOY-03 | Phase 1 | Deferred (user chose local git only on 2026-09-25; gh installed, not authenticated) |
```
→ `Complete (verified in Phase 4, <date>, <URL>)`. COPY-01..05 and DEPLOY-04 go from `Pending` to Complete, and their `- [ ]` checkboxes are ticked. Per D-14, the DEPLOY-02/03 checkboxes (currently `[x]` at 80-81) are only trusted after the live check passes.

---

## Shared Patterns

### Copy lives in VM, renderers only assign
**Source:** `VM.captionOrder/captionCross/captionBands` (1137-1182) → `renderChart` line 2447 `chartCaptionEl.textContent = c.caption;`, and `VM.simExact().spreadText` (1258-1260) → `renderSim` (2192).
**Apply to:** `formulaView`, `twoRollsText`, `explainChart`, `presetStatus`, and the reason maps. The DOM layer never builds a sentence (RESEARCH Anti-Patterns).

### Exact integer math, format once (STAT-02, D-04)
**Source:** `fixed` / `tenths` / `signed` (1037-1048), and the comment at 1058 (`// STAT-02: round the 20-round figure once,`).
**Apply to:** every substituted number in the formulas (the `fixed(k * 5, 1)` / `fixed(n * 5, 2)` forms from RESEARCH Pattern 3), the readout fix, and the dashed/solid step values. Branches are chosen by `===` on integers, never by a `dmg <= -2` threshold.

### One memo, no new sweeps
**Source:** `chartMemo` / `chartView` (1191-1196), self-test `SW` (1558-1563), and check-engine's per-(ac, die) `statAt` cache (135-147).
**Apply to:** `explainChart` (called inside `chartBase`), the self-test pins, and check-engine (u)-(y), which reuse the loop's `a` / `d` / `c` / `b`.

### textContent / replaceChildren only (T-01-01)
**Source:** comment at 2020-2024 and `num()` (2083-2088).
**Apply to:** all new renderers. The non-comment `.innerHTML =` count does not change in Phase 4.

### Event record outside state, status written only by the handler
**Source:** `sim` (1901-1913), `handleRoll` (2138-2140), and the `render()` comparison (1929).
**Apply to:** `lastPreset` and `#explore-status`. `render()` may only clear it.

### Guarded init, enable last
**Source:** `init()` (3380-3405) and `showEngineError()` (3363-3369).
**Apply to:** the listener wiring order, enabling Roll and the presets, `broken`, and hiding the sections on failure. check-page `--fault render` is its only automated proof.

### Crash-isolated test sections and split literals (IN-06)
**Source:** `section(name, fn)` (1451-1455), the per-block `try/catch` in the smoke (for example 3075-3076), and split strings such as `'Not rolled ' + 'yet'` (3022) and `'95% ' + 'cap @260.00'` (2962).
**Apply to:** every new self-test and smoke check that repeats visible Phase 4 copy.

### Dev tools fail loudly with one prefix
**Source:** check-engine `fail()` (51-54) / `record()` (125-128), and check-page `check()` (119) plus the `CHECK-PAGE PASS` / `FAIL (n)` tail (150-160).
**Apply to:** the new invariants (r)-(y), the coverage asserts, the a11y guards (9)-(13), the fault mode, and the budget gate.

## No Analog Found

| Unit | Role | Data Flow | Reason |
|---|---|---|---|
| check-page mini element tree (`parseTree`, `visibleText`, `norm`) | utility (dev tool) | transform | check-page has only regex-over-markup today (105-116). Use RESEARCH §Code Examples verbatim (VOID/BLOCK sets, tag-stack tokenizer). It lands inside U13. |
| `<a href="#…">` jump links | component | navigation | These are the page's first links. The style comes from UI-SPEC Color "Links" and the markup from UI-SPEC `#explore`. |

## Metadata

**Analog search scope:** `index.html` (head 1-9, style 78-163, 245-305, 316-363, 426-484, markup 563-745, dice-math 798-914, view-model 1005-1293 in full, self-test 1295-1320, 1448-1475, 1553-1600, 1638-1660, 1750-1851, app 1853-2006, 2083-2263, 2285-2296, 2355-2368, 2440-2500, 2559-2606, 2740-2765, 2940-2970, 3012-3083, 3325-3410), `tools/check-engine.mjs` (full), `tools/check-page.mjs` (full), `README.md` (full), `01-03-PLAN.md` (69-160), `01-02-PLAN.md` (77-107), `REQUIREMENTS.md` traceability, and `STATE.md` line 85
**Files scanned:** 3 source files + README + 7 planning docs
**Pattern extraction date:** 2026-09-26
