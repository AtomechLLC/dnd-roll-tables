// Dev-only engine check. Never required to build or deploy the site.
//
//   node tools/check-engine.mjs
//
// Extracts the pure script blocks (#dice-math, #view-model, #dice-selftest) from
// index.html, runs them in one shared Node vm context (top-level const is shared
// across runInContext calls, like classic scripts in a page), then:
//   1. reads the in-page SelfTest result, and
//   2. sweeps the full control domain (AC 10..30 x 5 dice x atk -5..20 x dmg -5..20
//      = 70980 combos) checking invariants the in-page self-test only samples.
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
};
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
    for (let atk = -5; atk <= 20; atk++) {
      // Cache stats by dmg so invariant (d) reuses the neighbouring value.
      const byDmg = new Map();
      const statsAt = (dmg) => {
        if (!byDmg.has(dmg)) byDmg.set(dmg, DiceMath.stats({ ac, atk, die, dmg }));
        return byDmg.get(dmg);
      };
      for (let dmg = -5; dmg <= 20; dmg++) {
        combos++;
        const p = { ac, atk, die, dmg };
        const s = statsAt(dmg);

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
          const diff = statsAt(dmg + 1).perRound - s.perRound;
          if (!(Math.abs(diff - s.pHit) < TOL)) record('d', p, `E diff ${diff} vs pHit ${s.pHit}`);
        }

        if (dmg >= -2 && s.tableSum * die !== s.e20Num) record('e', p, `tableSum*die ${s.tableSum * die} vs e20Num ${s.e20Num}`);

        const view = VM.computeView(p);
        const back = VM.fixed(Math.round(Number(view.perRoundText) * 200), 1);
        if (back !== view.e20Text) record('f', p, `perRound ${view.perRoundText} x 20 -> ${back} vs ${view.e20Text}`);
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
