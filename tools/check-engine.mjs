// Dev-only engine check. Never required to build or deploy the site.
//
//   node tools/check-engine.mjs
//
// Extracts the pure script blocks (#dice-math, #dice-sim, #view-model, #dice-selftest)
// from index.html, runs them in one shared Node vm context (top-level const is shared
// across runInContext calls, like classic scripts in a page), then:
//   0. static gates (SIM-06, D-15): no pure block mentions Math.random (comments count
//      too), and index.html holds at most one Math.random (the Roll button's click handler),
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
//      and the crossing and band rules (plan 02-03):
//      (m) every combo: DiceMath.crossings finds at most one crossing, the same count as an
//          independent sign-change walk, every marker lies between lastLeadN and flipN, and a
//          1-in-50 sample of VM.chartView draws one marker per crossing plus one per end tie
//      (n) every combo: a flat attack step lies inside DiceMath.attackBands (floor or cap) or
//          comes from a d4 whose normal hits deal 0 (die + dmg <= 0), and nothing else is flat
//      and the Phase 3 simulation rules (plan 03-01):
//      (o) every combo: DiceMath.spread's first moment equals stats().e20Num, var20Num >= 0,
//          integers stay below 2^53, VM.simExact's SD tenths are exact (integer bracket
//          (2t - 1)^2 * den <= 400 * num < (2t + 1)^2 * den) and >= 1, eText equals the stat
//          card, and lopsided === (eT - sdT < 0 || only a nat 20 hits)
//      (p) a 1-in-53 sample: the exact 20-round distribution (20-fold convolution of the
//          one-round pmf) has variance var20, and the spread line's band is honest: "About 2
//          runs in 3" holds 0.60..0.87 of runs, "Most runs" (lopsided) holds >= 0.80
//      (q) once: seeded 100k-round Sim.simulate samples at five settings agree with the exact
//          mean (z <= 4), the d20 faces are uniform (5 SE), and every round obeys the rules
//      It also prints the crossing distribution (informational, not pass/fail).
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

// Static gates (SIM-06, D-15, T-03-02): randomness is always injected. No pure block may
// mention Math.random at all (comments included), and the file holds at most one.
const BLOCKS = ['dice-math', 'dice-sim', 'view-model', 'dice-selftest'];
for (const id of BLOCKS) {
  const k = block(id).split('Math.random').length - 1;
  if (k !== 0) fail(`block ${id} mentions Math.random ${k} time(s); the app must inject the rng`);
}
const randomCount = html.split('Math.random').length - 1;
if (randomCount > 1) fail(`index.html has ${randomCount} Math.random occurrences (at most 1: the click handler)`);

const ctx = vm.createContext({ console, performance });
for (const id of BLOCKS) {
  const src = block(id);
  try {
    vm.runInContext(src, ctx, { filename: `index.html#${id}` });
  } catch (err) {
    fail(`block ${id} threw: ${err && err.stack ? err.stack : err}`);
  }
}

let SelfTest, DiceMath, VM, Sim;
try {
  SelfTest = vm.runInContext('SelfTest', ctx);
  DiceMath = vm.runInContext('DiceMath', ctx);
  VM = vm.runInContext('VM', ctx);
  Sim = vm.runInContext('Sim', ctx);
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
  m: '(m) CHART-03: <= 1 crossing, count = independent sign walk, lastLeadN <= x <= flipN, sampled markers',
  n: '(n) CHART-04: attack[n + 1] === attack[n] exactly inside a floor/cap band or when die + dmg <= 0',
  o: '(o) SIM-05: spread s1 === e20Num, var20 >= 0 and < 2^53, SD tenths exact and >= 1, eText === stat card, lopsided rule',
  p: '(p) SIM-05: sampled exact 20-round distribution: variance === var20, "2 in 3" band 0.60..0.87, "Most" >= 0.80',
  q: '(q) SIM-01: seeded 100k-round samples: mean within 4 SE, d20 faces within 5 SE, every round obeys the rules',
};
const NS = [0, 5, 20];
const MAXN = (VM.CONTROL_SPEC && VM.CONTROL_SPEC.n && VM.CONTROL_SPEC.n.max) || 20;
const counts = Object.fromEntries(Object.keys(names).map((k) => [k, 0]));
const firstFailures = [];
let combos = 0;
const dist = { damageAll: 0, hitAll: 0, hitThenDamage: 0, damageThenHit: 0, tieCross: 0, endTie: 0 };
const hasCross = typeof DiceMath.crossings === 'function';
const hasBands = typeof DiceMath.attackBands === 'function';

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

        // Exact spread (o), SIM-05 / D-05, reusing the cached stats s
        const sp = DiceMath.spread(p);
        const ex = VM.simExact(p);
        const sdT = ex.sdT, v400 = 400 * sp.var20Num;
        if (sp.s1 !== s.e20Num) record('o', p, `s1 ${sp.s1} vs e20Num ${s.e20Num}`);
        else if (!(sp.var20Num >= 0)) record('o', p, `var20Num ${sp.var20Num}`);
        else if (!(v400 < Number.MAX_SAFE_INTEGER && sp.den1 * sp.s2 < Number.MAX_SAFE_INTEGER)) {
          record('o', p, `unsafe integers: 400 * var20Num ${v400}, den1 * s2 ${sp.den1 * sp.s2}`);
        } else if (!(sdT >= 1)) record('o', p, `sdT ${sdT}`);
        else if (!((2 * sdT - 1) ** 2 * sp.var20Den <= v400 && v400 < (2 * sdT + 1) ** 2 * sp.var20Den)) {
          record('o', p, `SD tenths ${sdT} not exact for ${sp.var20Num} / ${sp.var20Den}`);
        } else if (ex.eText !== view.e20Text) record('o', p, `eText ${ex.eText} vs stat card ${view.e20Text}`);
        else if (ex.lopsided !== (ex.eT - ex.sdT < 0 || s.hitFaces === 1)) {
          record('o', p, `lopsided ${ex.lopsided} with eT ${ex.eT}, sdT ${ex.sdT}, hitFaces ${s.hitFaces}`);
        }

        // Exact 20-round distribution (p): stride 53 is coprime to 21, 5 and 26 (02-REVIEW WR-03)
        if (combos % 53 === 0) {
          const w = new Map();   // one-round damage -> integer weight over den1 = 20 * X^2
          const add = (dm, wt) => w.set(dm, (w.get(dm) || 0) + wt);
          for (let r = 1; r <= 20; r++) {
            const kind = DiceMath.outcome(r, atk, ac);
            if (kind === 'hit') {
              for (let k = 1; k <= die; k++) add(DiceMath.damageFor(r, [k], p), die);
            } else if (kind === 'crit') {
              for (let x = 1; x <= die; x++) for (let y = 1; y <= die; y++) add(DiceMath.damageFor(20, [x, y], p), 1);
            } else {
              add(DiceMath.damageFor(r, [], p), die * die);
            }
          }
          const one = [...w].map(([dm, wt]) => [dm, wt / sp.den1]);
          const maxDm = Math.max(...one.map((e) => e[0]));
          let dist20 = [1];
          for (let i = 0; i < 20; i++) {
            const next = new Array(dist20.length + maxDm).fill(0);
            for (let t = 0; t < dist20.length; t++) {
              if (dist20[t] === 0) continue;
              for (const [dm, pr] of one) next[t + dm] += dist20[t] * pr;
            }
            dist20 = next;
          }
          let mean = 0;
          for (let t = 0; t < dist20.length; t++) mean += t * dist20[t];
          let v = 0;
          for (let t = 0; t < dist20.length; t++) v += (t - mean) ** 2 * dist20[t];
          const V = sp.var20Num / sp.var20Den;
          if (!(Math.abs(v - V) <= 1e-9 * Math.max(V, 1))) record('p', p, `convolution variance ${v} vs var20 ${V}`);
          const lo = ex.loT / 10, hi = ex.hiT / 10;
          let inBand = 0, below = 0;
          for (let t = 0; t < dist20.length; t++) {
            if (t >= lo && t <= hi) inBand += dist20[t];
            if (t <= hi) below += dist20[t];
          }
          if (!ex.lopsided && !(inBand >= 0.60 && inBand <= 0.87)) {
            record('p', p, `"2 in 3" band ${lo}..${hi} holds ${inBand.toFixed(4)}`);
          }
          if (ex.lopsided && !(below >= 0.80)) record('p', p, `"Most runs" band 0..${hi} holds ${below.toFixed(4)}`);
        }

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

        // Crossings (m): engine result vs an independent walk over the last non-zero sign
        if (!hasCross) {
          record('m', p, 'DiceMath.crossings missing');
        } else {
          const c = DiceMath.crossings(a, d);
          let lastSign = 0, flips = 0;
          for (let n = 1; n <= MAXN; n++) {
            const sg = Math.sign(a[n] - d[n]);
            if (sg === 0) continue;
            if (lastSign !== 0 && sg !== lastSign) flips++;
            lastSign = sg;
          }
          if (c.list.length > 1) record('m', p, `${c.list.length} crossings`);
          if (c.list.length !== flips) record('m', p, `${c.list.length} crossings vs ${flips} sign changes`);
          for (const e of c.list) {
            if (!(e.lastLeadN <= e.x && e.x <= e.flipN)) record('m', p, `x ${e.x} outside [${e.lastLeadN}, ${e.flipN}]`);
          }
          if (combos % 50 === 0) {
            const markers = (VM.chartView(p, 5).markers || []).length;
            const want = c.list.length + (c.endTieN !== null ? 1 : 0);
            if (markers !== want) record('m', p, `${markers} markers vs ${want}`);
          }
          if (c.list.length === 0) {
            if (c.first === 'damage') dist.damageAll++;
            else if (c.first === 'attack') dist.hitAll++;
          } else if (c.list.length === 1) {
            if (c.list[0].to === 'damage') dist.hitThenDamage++;
            else dist.damageThenHit++;
          }
          for (const e of c.list) if (e.tieN !== null) dist.tieCross++;
          if (c.endTieN !== null) dist.endTie++;
        }

        // Bands (n): flat attack steps are exactly the cap / floor bands, plus the d4 no-damage line
        if (!hasBands) {
          record('n', p, 'DiceMath.attackBands missing');
        } else {
          const b = DiceMath.attackBands(p, MAXN);
          const nodmg = die + dmg <= 0;
          for (let n = 0; n < MAXN; n++) {
            const flat = a[n + 1] === a[n];
            const banded = (b.floor !== null && n + 1 <= b.floor[1]) || (b.cap !== null && n >= b.cap[0]) || nodmg;
            if (flat !== banded) { record('n', p, `N ${n} -> ${n + 1}: flat ${flat}, banded ${banded}`); break; }
          }
        }
      }
    }
  }
}
const sweepMs = (performance.now() - t0).toFixed(0);

// Seeded large samples (q), SIM-01 / D-14: z-score tolerances, never a relative 1% (RESEARCH).
const tq = performance.now();
const R = 100000;
const QSET = [
  { ac: 15, atk: 5, die: 8, dmg: 0 },
  { ac: 25, atk: 0, die: 12, dmg: 0 },
  { ac: 15, atk: 5, die: 4, dmg: -3 },
  { ac: 10, atk: 20, die: 12, dmg: 20 },
  { ac: 30, atk: -5, die: 4, dmg: -5 },
];
const qMeans = [];
for (const p of QSET) {
  let run;
  try {
    run = Sim.simulate(p, R, Sim.mulberry32(20260926));
  } catch (err) {
    record('q', p, `simulate threw: ${err && err.message}`);
    continue;
  }
  const st = DiceMath.stats(p), sp = DiceMath.spread(p);
  const E1 = st.e20Num / st.e20Den / 20, V1 = sp.var20Num / sp.var20Den / 20;
  const faces = new Array(21).fill(0);
  let sum = 0, bad = null;
  for (const r of run.rounds) {
    faces[r.d20]++;
    sum += r.damage;
    if (bad) continue;
    const want = r.kind === 'crit' ? 2 : r.kind === 'hit' ? 1 : 0;
    if (!(Number.isInteger(r.d20) && r.d20 >= 1 && r.d20 <= 20)) bad = `round ${r.round}: d20 ${r.d20}`;
    else if (r.kind !== DiceMath.outcome(r.d20, p.atk, p.ac)) bad = `round ${r.round}: kind ${r.kind}`;
    else if (r.dice.length !== want) bad = `round ${r.round}: ${r.dice.length} dice on a ${r.kind}`;
    else if (!r.dice.every((k) => Number.isInteger(k) && k >= 1 && k <= p.die)) bad = `round ${r.round}: dice ${r.dice}`;
    else if (r.damage !== DiceMath.damageFor(r.d20, r.dice, p)) bad = `round ${r.round}: damage ${r.damage}`;
  }
  if (bad) record('q', p, bad);
  if (sum !== run.total) record('q', p, `total ${run.total} vs damage sum ${sum}`);
  const mean = sum / R, se = Math.sqrt(V1 / R);
  qMeans.push(`AC${p.ac} ${p.atk} d${p.die} ${p.dmg}: z ${((mean - E1) / se).toFixed(2)}`);
  if (!(Math.abs(mean - E1) <= 4 * se)) record('q', p, `mean ${mean} vs E ${E1} (SE ${se})`);
  const faceTol = 5 * Math.sqrt(R * 0.05 * 0.95);
  for (let f = 1; f <= 20; f++) {
    if (!(Math.abs(faces[f] - R / 20) <= faceTol)) { record('q', p, `d20 face ${f} count ${faces[f]}`); break; }
  }
}
const qMs = (performance.now() - tq).toFixed(0);

// ---- report -----------------------------------------------------------------
for (const k of Object.keys(names)) console.log(`${counts[k] === 0 ? 'ok  ' : 'FAIL'} ${names[k]}: ${counts[k]} failures`);
const n = SelfTest.results.length;
console.log(`selftest ${SelfTest.passed}/${n}`);
for (const r of SelfTest.results.filter((x) => !x.ok)) {
  console.log(`  selftest FAIL ${r.name}: got ${JSON.stringify(r.actual)}, expected ${JSON.stringify(r.expected)}`);
}
console.log(`sweep ${combos} combos in ${sweepMs} ms`);
console.log(`sim samples (${R} rounds each, ${qMs} ms): ${qMeans.join('; ')}`);
console.log(`crossings: damage-all ${dist.damageAll}, hit-all ${dist.hitAll}, hit-then-damage ${dist.hitThenDamage}, ` +
  `damage-then-hit ${dist.damageThenHit}, tie crossings ${dist.tieCross}, end ties ${dist.endTie}`);

const invariantFailures = Object.values(counts).reduce((a, b) => a + b, 0);
if (SelfTest.failed === 0 && n > 0 && invariantFailures === 0 && combos === TOTAL_COMBOS) {
  console.log(`CHECK-ENGINE PASS: selftest ${SelfTest.passed}/${n}, sweep ${TOTAL_COMBOS} combos`);
  process.exit(0);
}
console.log(`CHECK-ENGINE FAIL: selftest ${SelfTest.passed}/${n}, ${invariantFailures} invariant failures, ${combos}/${TOTAL_COMBOS} combos`);
for (const f of firstFailures) console.log(`  ${f}`);
process.exit(1);
