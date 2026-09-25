// Dev-only engine check. Never required to build or deploy the site.
//
//   node tools/check-engine.mjs
//
// Extracts the pure script blocks (#dice-math, #view-model, #dice-selftest) from
// index.html, runs them in one shared Node vm context (top-level const is shared
// across runInContext calls, like classic scripts in a page), then:
//   1. reads the in-page SelfTest result, and
//   2. sweeps the full control domain (AC 10..30 x 5 dice x atk -5..20 x dmg -5..20
//      = 70980 combos) checking invariants the in-page self-test only samples:
//      (a)..(f) Phase 1 engine and formatting rules, plus the Phase 2 compare rules
//      (g) shared heat domain (CMP-02): max cell over base, +N hit, +N dmg === max(1, 2X + D + N)
//      (h) +N-to-hit threshold (CMP-03) === clamp(C - A - N, 2, 20)
//      (i) a 1-in-50 sample of VM.compareView agrees with the engine (heatMax, hit threshold,
//          deltas = difference of the displayed tenths)
//      with N in {0, 5, 20}, plus the Phase 2 sweep-chart rules over N = 0..CONTROL_SPEC.n.max:
//      (j) a 1-in-50 sample of DiceMath.sweep equals the series built from cached stats, and
//          both series start at the same point (CHART-01/02)
//      (k) every combo: the damage series strictly increases, the attack series never falls
//      (l) a 1-in-50 sample of VM.chartView: y ticks cover the larger curve with at most 1.5x
//          headroom, 4 to 6 ticks, one readout line per N
//      Stats are cached per (ac, die), keyed by (atk, dmg), so the +N lookups reuse
//      neighbouring combos.
// Exit 0 only when everything passes.

import fs from 'node:fs';
import vm from 'node:vm';

const TOTAL_COMBOS = 70980;
const indexUrl = new URL('../index.html', import.meta.url);

function fail(msg) {
  console.log(`CHECK-ENGINE FAIL: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(indexUrl)) fail('index.html not found');
const html = fs.readFileSync(indexUrl, 'utf8');

function block(id) {
  const m = html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)</script>`));
  if (!m) fail(`missing block ${id}`);
  return m[1];
}

const ctx = vm.createContext({ console, performance });
for (const id of ['dice-math', 'view-model', 'dice-selftest']) {
  const src = block(id);
  try {
    vm.runInContext(src, ctx, { filename: `index.html#${id}` });
  } catch (err) {
    fail(`block ${id} threw: ${err && err.stack ? err.stack : err}`);
  }
}

let SelfTest, DiceMath, VM;
try {
  SelfTest = vm.runInContext('SelfTest', ctx);
  DiceMath = vm.runInContext('DiceMath', ctx);
  VM = vm.runInContext('VM', ctx);
} catch (err) {
  fail(`engine globals not defined: ${err && err.message}`);
}

// ---- full-domain sweep -------------------------------------------------------
const TOL = 1e-9;
const names = {
  a: '(a) 0.05 <= pHit <= 0.95',
  b: '(b) every table cell is an integer >= 0',
  c: '(c) dmg >= -1: perRound === closedFormPerRound',
  d: '(d) -1 <= dmg <= 19: E(dmg+1) - E(dmg) === pHit',
  e: '(e) dmg >= -2: tableSum * die === e20Num',
  f: '(f) STAT-02: fixed(round(perRoundText * 200), 1) === e20Text',
  g: '(g) CMP-02: max cell over base, +N hit, +N dmg === max(1, 2X + D + N), N in {0,5,20}',
  h: '(h) CMP-03: +N-to-hit threshold === clamp(C - A - N, 2, 20), N in {0,5,20}',
  i: '(i) sampled VM.compareView agrees (heatMax, hit threshold, deltas = displayed difference)',
  j: '(j) CHART-01/02: sampled DiceMath.sweep equals the cached series, both start equal',
  k: '(k) sweep series: damage strictly increasing, attack non-decreasing',
  l: '(l) sampled VM.chartView: ticks cover max with <= 1.5x headroom, 4..6 ticks, maxN + 1 readouts',
};
const NS = [0, 5, 20];
const MAXN = (VM.CONTROL_SPEC && VM.CONTROL_SPEC.n && VM.CONTROL_SPEC.n.max) || 20;
const counts = Object.fromEntries(Object.keys(names).map((k) => [k, 0]));
const firstFailures = [];
let combos = 0;

function record(key, p, detail) {
  counts[key]++;
  if (firstFailures.length < 5) firstFailures.push(`${key} AC${p.ac} atk${p.atk} d${p.die} dmg${p.dmg}: ${detail}`);
}

const t0 = performance.now();
for (let ac = 10; ac <= 30; ac++) {
  for (const die of DiceMath.DICE) {
    // Per-(ac, die) cache keyed `${atk},${dmg}`: invariant (d) reuses dmg + 1 and the
    // compare invariants reuse atk + N / dmg + N. Created here so memory stays bounded.
    const cache = new Map();
    const statAt = (atk, dmg) => {
      const key = `${atk},${dmg}`;
      let e = cache.get(key);
      if (!e) {
        const st = DiceMath.stats({ ac, atk, die, dmg });
        let max = -Infinity;
        for (const row of st.rows) for (const c of row.cells) if (c > max) max = c;
        e = { st, max };
        cache.set(key, e);
      }
      return e;
    };
    const tenthsOf = (st) => VM.tenths(st.e20Num, st.e20Den);
    const deltaText = (v, b) => {
      const d = tenthsOf(v) - tenthsOf(b);
      return (d < 0 ? '−' : '+') + VM.fixed(Math.abs(d), 1);
    };
    for (let atk = -5; atk <= 20; atk++) {
      for (let dmg = -5; dmg <= 20; dmg++) {
        combos++;
        const p = { ac, atk, die, dmg };
        const base = statAt(atk, dmg);
        const s = base.st;

        if (!(s.pHit >= 0.05 && s.pHit <= 0.95)) record('a', p, `pHit ${s.pHit}`);

        let badCell = null;
        for (const row of s.rows) {
          for (const c of row.cells) {
            if (!Number.isInteger(c) || c < 0) { badCell = `row ${row.d20} cell ${c}`; break; }
          }
          if (badCell) break;
        }
        if (badCell) record('b', p, badCell);

        if (dmg >= -1) {
          const cf = DiceMath.closedFormPerRound(p);
          if (!(Math.abs(s.perRound - cf) < TOL)) record('c', p, `perRound ${s.perRound} vs closed form ${cf}`);
        }

        if (dmg >= -1 && dmg <= 19) {
          const diff = statAt(atk, dmg + 1).st.perRound - s.perRound;
          if (!(Math.abs(diff - s.pHit) < TOL)) record('d', p, `E diff ${diff} vs pHit ${s.pHit}`);
        }

        if (dmg >= -2 && s.tableSum * die !== s.e20Num) record('e', p, `tableSum*die ${s.tableSum * die} vs e20Num ${s.e20Num}`);

        const view = VM.statsView(p);
        const back = VM.fixed(Math.round(Number(view.perRoundText) * 200), 1);
        if (back !== view.e20Text) record('f', p, `perRound ${view.perRoundText} x 20 -> ${back} vs ${view.e20Text}`);

        // Phase 2 compare invariants, from the engine alone (g, h)
        for (const N of NS) {
          const hitV = statAt(atk + N, dmg), dmgV = statAt(atk, dmg + N);
          const maxCell = Math.max(base.max, hitV.max, dmgV.max);
          const oracle = Math.max(1, 2 * die + dmg + N);
          if (maxCell !== oracle) record('g', p, `N ${N}: max cell ${maxCell} vs ${oracle}`);
          const th = Math.min(20, Math.max(2, ac - atk - N));
          if (hitV.st.threshold !== th) record('h', p, `N ${N}: threshold ${hitV.st.threshold} vs ${th}`);
        }

        // Sampled VM.compareView agreement (i)
        if (combos % 50 === 0) {
          if (typeof VM.compareView !== 'function') {
            record('i', p, 'VM.compareView missing');
          } else {
            for (const N of NS) {
              const cv = VM.compareView(p, N);
              const hitV = statAt(atk + N, dmg), dmgV = statAt(atk, dmg + N);
              const heat = Math.max(1, base.max, hitV.max, dmgV.max);
              if (cv.heatMax !== heat) record('i', p, `N ${N}: heatMax ${cv.heatMax} vs ${heat}`);
              if (cv.tables.hit.threshold !== hitV.st.threshold) {
                record('i', p, `N ${N}: hit threshold ${cv.tables.hit.threshold} vs ${hitV.st.threshold}`);
              }
              const dh = deltaText(hitV.st, s), dd = deltaText(dmgV.st, s);
              if (cv.tables.hit.deltaText !== dh) record('i', p, `N ${N}: hit delta ${cv.tables.hit.deltaText} vs ${dh}`);
              if (cv.tables.dmg.deltaText !== dd) record('i', p, `N ${N}: dmg delta ${cv.tables.dmg.deltaText} vs ${dd}`);
            }
          }
        }

        // Sweep series from the cache (j, k, l): +n on the attack roll vs +n on the damage roll
        const a = [], d = [];
        for (let n = 0; n <= MAXN; n++) {
          a.push(statAt(atk + n, dmg).st.e20Num);
          d.push(statAt(atk, dmg + n).st.e20Num);
        }
        const den = die * die;
        for (let n = 1; n <= MAXN; n++) {
          if (!(d[n] > d[n - 1])) { record('k', p, `damage not increasing at N ${n}: ${d[n - 1]} -> ${d[n]}`); break; }
          if (a[n] < a[n - 1]) { record('k', p, `attack falls at N ${n}: ${a[n - 1]} -> ${a[n]}`); break; }
        }
        if (combos % 50 === 0) {
          const sw = DiceMath.sweep(p, MAXN);
          if (sw.attack.join(',') !== a.join(',')) record('j', p, 'sweep attack differs from the cached series');
          if (sw.damage.join(',') !== d.join(',')) record('j', p, 'sweep damage differs from the cached series');
          if (sw.attack[0] !== sw.damage[0]) record('j', p, `start ${sw.attack[0]} vs ${sw.damage[0]}`);
          if (typeof VM.chartView !== 'function') {
            record('l', p, 'VM.chartView missing');
          } else {
            const c = VM.chartView(p, 5);
            const m = Math.max(a[MAXN], d[MAXN]) / den;
            if (!(c.ticks.top >= m)) record('l', p, `top ${c.ticks.top} below max ${m}`);
            if (!(c.ticks.top <= 1.5 * m)) record('l', p, `top ${c.ticks.top} over 1.5 x max ${m}`);
            const nt = c.ticks.ticks.length;
            if (nt < 4 || nt > 6) record('l', p, `${nt} ticks`);
            if (c.readout.length !== MAXN + 1) record('l', p, `${c.readout.length} readout lines`);
          }
        }
      }
    }
  }
}
const sweepMs = (performance.now() - t0).toFixed(0);

// ---- report -----------------------------------------------------------------
for (const k of Object.keys(names)) console.log(`${counts[k] === 0 ? 'ok  ' : 'FAIL'} ${names[k]}: ${counts[k]} failures`);
const n = SelfTest.results.length;
console.log(`selftest ${SelfTest.passed}/${n}`);
for (const r of SelfTest.results.filter((x) => !x.ok)) {
  console.log(`  selftest FAIL ${r.name}: got ${JSON.stringify(r.actual)}, expected ${JSON.stringify(r.expected)}`);
}
console.log(`sweep ${combos} combos in ${sweepMs} ms`);

const invariantFailures = Object.values(counts).reduce((a, b) => a + b, 0);
if (SelfTest.failed === 0 && n > 0 && invariantFailures === 0 && combos === TOTAL_COMBOS) {
  console.log(`CHECK-ENGINE PASS: selftest ${SelfTest.passed}/${n}, sweep ${TOTAL_COMBOS} combos`);
  process.exit(0);
}
console.log(`CHECK-ENGINE FAIL: selftest ${SelfTest.passed}/${n}, ${invariantFailures} invariant failures, ${combos}/${TOTAL_COMBOS} combos`);
for (const f of firstFailures) console.log(`  ${f}`);
process.exit(1);
