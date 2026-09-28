// Dev-only engine check. Never required to build or deploy the site.
//
//   node tools/check-engine.mjs
//
// Extracts the pure script blocks (#dice-math, #dice-sim, #view-model, #dice-selftest)
// from index.html, runs them in one shared Node vm context (top-level const is shared
// across runInContext calls, like classic scripts in a page), then:
//   0. static gates (SIM-06, D-15, 03 IN-02): no pure block mentions Math.random (comments
//      count too), and index.html holds exactly one Math.random, in
//      `const onRoll = () => handleRoll(Math.random);` (the Roll button's click handler),
//   1. reads the in-page SelfTest result (and warns when the Node run exceeds its 200 ms budget), and
//   2. sweeps the full control domain, taken from VM.CONTROL_SPEC (AC 10..30 x 5 dice x
//      atk -5..20 x dmg -5..20 = 70980 combos), checking invariants the in-page self-test
//      only samples. "Sampled" means every SAMPLE-th combo with SAMPLE = 53, which is coprime
//      to 21, 5 and 26; the run asserts the sample reached all 21 AC values, 5 dice, 26 attack
//      and 26 damage bonuses (02-REVIEW WR-03: stride 50 reached only 13 damage bonuses):
//      (a)..(f) Phase 1 engine and formatting rules, plus the Phase 2 compare rules
//      (g) shared heat domain (CMP-02): max cell over base, +N hit, +N dmg === max(1, 2X + D + N)
//      (h) +N-to-hit threshold (CMP-03) === clamp(C - A - N, 2, 20)
//      (i) a sampled VM.compareView agrees with the engine (heatMax, hit threshold,
//          deltas = difference of the displayed tenths)
//      with N in {0, 5, 20}, plus the Phase 2 sweep-chart rules over N = 0..CONTROL_SPEC.n.max:
//      (j) a sampled DiceMath.sweep equals the series built from cached stats, and
//          both series start at the same point (CHART-01/02)
//      (k) every combo: the damage series strictly increases, the attack series never falls
//      (l) a sampled VM.chartView: y ticks cover the larger curve with at most 1.5x
//          headroom, 4 to 6 ticks, one readout line per N
//      and the crossing and band rules (plan 02-03):
//      (m) every combo: DiceMath.crossings finds at most one crossing, the same count as an
//          independent sign-change walk, every marker lies between lastLeadN and flipN, and a
//          sampled VM.chartView draws one marker per crossing plus one per end tie
//      (n) every combo: a flat attack step lies inside DiceMath.attackBands (floor or cap) or
//          comes from a d4 whose normal hits deal 0 (die + dmg <= 0), and nothing else is flat
//      and the Phase 3 simulation rules (plan 03-01):
//      (o) every combo: DiceMath.spread's first moment equals stats().e20Num, var20Num >= 0,
//          integers stay below 2^53, VM.simExact's SD tenths are exact (integer bracket
//          (2t - 1)^2 * den <= 400 * num < (2t + 1)^2 * den) and >= 1, eText equals the stat
//          card, and lopsided === (eT - sdT <= 0 || only a nat 20 hits) (03-REVIEW WR-01)
//      (p) every combo (exhaustive): the exact 20-round distribution (20-fold convolution of
//          the one-round pmf, memoized per (hitFaces, die, dmg): 2,470 distributions) has
//          variance var20, and the spread line's band is honest: "About 2 runs in 3" holds
//          [0.60, 0.80) of runs and "Most runs" (lopsided) holds >= 0.80. The bounds come from
//          the page's own two wordings, not from the data (03-REVIEW WR-01)
//      (q) once: seeded 100k-round Sim.simulate samples at five settings agree with the exact
//          mean (z <= 4), the d20 faces are uniform (5 SE), and every round obeys the rules
//      and the readout rule (02-REVIEW WR-02):
//      (y) every combo and every N: VM.readoutLines(attack, damage, den)[N] ends in 'even'
//          exactly when attack[N] === damage[N], and otherwise names the exact leader
//          ('to hit ahead by' / 'to damage ahead by' from sign(attack[N] - damage[N]))
//      and the Phase 4 copy (plan 04-02), from each combo's VM.statsView result (no engine calls):
//      (r) VM.formulaView hit line: raw faces 21 - (AC - atk), the clamp shown iff they leave
//          1..19, result === the card's percent
//      (s) the per-round line takes the rule branch iff the integer closed form equals
//          2 x e20Num, and its result (line 2 or the table note) is the card's perRoundText;
//          counts pinned: rule 60,740, table 10,240. Claim (04-REVIEW WR-01): the note credits
//          "the table" iff tableSum x die === e20Num (the table's own average is exact)
//      (t) the +1 lines print the card's own strings, 'Which wins' names the larger displayed
//          value and uses the inequality form only when both +1 lines are rule branch; counts
//          pinned: rule/rule 36,850, reason 28,100, table/table 5,950, mixed 80. Claim (WR-01):
//          a +1 line that says "from the table" prints the table's own difference exactly
//      (z) VM.twoRollsText equals the UI-SPEC paragraph, with 'an' before 8, 11 and 18, and
//          every normal threshold 3..19 is seen
//      and the chart explanations (plan 04-03), from the loop's own series, crossings and bands
//      (VM.explainChart is pure, so no new sweep or engine call):
//      (u) the dashed-line text: straightFrom k (the first N from which every damage step is
//          hitFaces x den), 'the line is straight' iff k = 0, else 'From +k on'; counts pinned:
//          k = 0: 60,740; k = 1, 2, 3: 2,730 each; k = 4: 2,050; never above 4
//      (v) the solid-line text: nodmg iff die + dmg <= 0 (1,092), rule iff 2 normalNum ===
//          (X + 1 + 2D) normalDen (60,060), else floor bites (9,828); every attack step outside
//          the bands equals normalNum x die; a band sentence iff that band is drawn (not nodmg,
//          except the whole-chart cap); and the claims (04-REVIEW CR-01): each sentence that
//          prices a step ('worth V', from +0 or 'From +k,') sits where the d20 gains a face and
//          the engine's attack step is V, so no step is priced where +1 to hit adds 0; counts
//          pinned: capped from +0 11,648 (+ 182 nodmg), floor band first 15,360
//      (w) the crossover text picks the variant that matches DiceMath.crossings and prints the
//          ring's N; counts pinned: none-damage 30,095, none-attack 14,677, one adjacent 25,318,
//          one across a tie 874, end tie only 16, touch / two+ / identical 0. Lever claims
//          (04-REVIEW WR-02): a no-crossing text names a higher / lower AC or a bigger / smaller
//          die iff that change alone (a slider value, from the full-domain sweeps) lets the
//          trailing bonus lead at some N, and says "neither" iff none does; sampled
//          VM.chartView lines equal the checked line; the defaults' line is pinned
//      (x) once: every VM.PRESETS entry re-run through the engine at its exact settings: bands,
//          steps, crossings, caption and readout claims (UI-SPEC Presets table), parseControl
//          round trip, the UI-SPEC strings, and parity with the static #explore markup
//      and the Phase 5 kill math (plan 05-02), in its own pass over the 2,470 attack keys
//      (hitFaces, die, dmg) x HP 1..500 = 1,235,000 pairs. Per key it builds the page's
//      DiceMath.killTable once (timed; a WARNING above 8 ms, never a failure) and two oracles
//      that share no code path with the page's thinning method, both from this file's own
//      weights (DiceMath.outcome / damageFor, as dist20Of): a round-by-round float DP over
//      cumulative damage, and a BigInt N_n recurrence for exact E[H] and E[R]. The page's
//      strings come from the pure VM.killViewFrom with this file's tables, never the memo:
//      (K1) medianRound, p10 and p20 equal the round DP (median first t <= 1,000 with
//          P >= 1/2 - 1e-9; 0 = past the cap), and E[R] = 20 E[H] / hitFaces equals an
//          independent per-round recursion (1e-9 relative)
//      (K2) the Hits and Rounds card values equal round-half-up of the exact rationals
//      (K3) every P within 1e-9 of 1/2 at a median step is an exact 1/2 (BigInt round DP)
//      (K4) every-hit-kills iff E[H] = 1 exactly; the simple number is the integer ratio; the
//          median or past-cap wording; '0%' iff the fastest kill is past round 20, else the
//          UI-SPEC percent rule on the oracle P20, never '100%'; the fastest round; and the
//          displayed E[H] is strictly above the displayed simple number
//      (K5) the D-05 reference values at the defaults, from the oracles
//      The research counts (past the cap, near-ties, every hit kills, under 0.1, fallbacks,
//      float-only mismatches, p20 truncated to 0) are pinned as equality checks.
//      Zero-count asserts (02-REVIEW IN-04): no setting has a touch (a tie that is neither a
//      crossing's tieN nor the end tie), a leading tie (tie at N = 1), or two or more
//      crossings. The copy branches for those exist only for synthetic series; a rule change
//      that makes one reachable fails here. It also prints the crossing distribution.
//      Stats are cached per (ac, die), keyed by (atk, dmg), so the +N lookups reuse
//      neighbouring combos.
// Exit 0 only when everything passes.

import fs from 'node:fs';
import vm from 'node:vm';

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
// mention Math.random at all (comments included), and the file holds exactly one, in the
// Roll button's click handler (03-REVIEW IN-02: "at most one" also passed with zero).
const BLOCKS = ['dice-math', 'dice-sim', 'view-model', 'dice-selftest'];
for (const id of BLOCKS) {
  const k = block(id).split('Math.random').length - 1;
  if (k !== 0) fail(`block ${id} mentions Math.random ${k} time(s); the app must inject the rng`);
}
const randomCount = html.split('Math.random').length - 1;
if (randomCount !== 1) fail(`index.html has ${randomCount} Math.random occurrences (exactly 1: the click handler)`);
if (!/const onRoll = \(\) => handleRoll\(Math\.random\);/.test(html)) {
  fail('the one Math.random is not in `const onRoll = () => handleRoll(Math.random);`');
}

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
  p: '(p) SIM-05: exhaustive exact 20-round distribution: variance === var20, "2 in 3" band in [0.60, 0.80), "Most" >= 0.80',
  q: '(q) SIM-01: seeded 100k-round samples: mean within 4 SE, d20 faces within 5 SE, every round obeys the rules',
  y: '(y) CHART-05: VM.readoutLines says "even" iff attack[N] === damage[N], else names the exact leader',
  r: '(r) COPY-02 hit-chance formula',
  s: '(s) COPY-02 per-round formula branch and result',
  t: '(t) COPY-02 +1 formulas and Which wins',
  z: '(z) COPY-01 two-roll text',
  u: '(u) COPY-04 dashed-line explanation',
  v: '(v) COPY-04 solid-line explanation and bands',
  w: '(w) COPY-03 crossover explanation',
  x: '(x) COPY-05 preset claims and markup',
  K1: '(K1) KILL-03 medians, P10 and P20 equal a round-by-round DP; E[R] x hitFaces = 20 E[H], every key x HP 1..500',
  K2: '(K2) KILL-03 Hits and Rounds card values equal exact BigInt rounding, every key x HP 1..500',
  K3: '(K3) KILL-03 every |P - 1/2| < 1e-9 at a median step is an exact 1/2 tie',
  K4: '(K4) KILL-03 sub-lines and Kill-within-20: every-hit-kills iff E[H] = 1, median or past-cap wording, 0% iff fastest > 20, never 100%, displayed E[H] > simple except pinned whole-number ties',
  K5: '(K5) D-05 reference values at the defaults',
  cover: '(cover) the stride-53 sample reaches 21 AC values, 5 dice, 26 attack and 26 damage bonuses',
  zero: '(zero) no touches, no leading ties, no setting with 2+ crossings',
};
const NS = [0, 5, 20];
// 02-REVIEW IN-03: the domain comes from the page's own spec, never a second copy here.
const CS = VM.CONTROL_SPEC;
if (!CS || !CS.ac || !CS.die || !CS.atk || !CS.dmg || !CS.n) fail('VM.CONTROL_SPEC is missing ac, die, atk, dmg or n');
const MAXN = CS.n.max;
const DICE_SET = CS.die.set;
const span = (r) => r.max - r.min + 1;
const TOTAL_COMBOS = span(CS.ac) * DICE_SET.length * span(CS.atk) * span(CS.dmg);   // 70,980
const SAMPLE = 53;   // coprime to 21, 5 and 26, so the sample reaches every value of every control
const sampled = { ac: new Set(), die: new Set(), atk: new Set(), dmg: new Set() };
const counts = Object.fromEntries(Object.keys(names).map((k) => [k, 0]));
const firstFailures = [];
let combos = 0;
const dist = { damageAll: 0, hitAll: 0, hitThenDamage: 0, damageThenHit: 0, tieCross: 0, endTie: 0 };
const zeroCounts = { touch: 0, leadingTie: 0, multiCross: 0 };
const hasCross = typeof DiceMath.crossings === 'function';
const hasBands = typeof DiceMath.attackBands === 'function';
const hasReadout = typeof VM.readoutLines === 'function';

function record(key, p, detail) {
  counts[key]++;
  if (firstFailures.length < 5) firstFailures.push(`${key} AC${p.ac} atk${p.atk} d${p.die} dmg${p.dmg}: ${detail}`);
}

// (p) The exact 20-round distribution depends only on the one-round pmf, which is fixed by
// (hitFaces, die, dmg): the d20 enters only through how many faces hit. One memo entry per
// key (2,470 keys) makes the check exhaustive at about 3 s.
function dist20Of(p, sp) {
  const { ac, atk, die } = p;
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
  return { dist20, variance: v };
}
const distMemo = new Map();
const cov = { minTwoInThree: Infinity, maxTwoInThree: -Infinity, minMost: Infinity };

// Phase 4 copy (r)(s)(t)(z), COPY-01 / COPY-02 / D-04. VM.formulaView and VM.twoRollsText are
// pure functions of the loop's statsView result (view.exact carries the engine numerators), so
// these checks add no engine calls. Every expectation below is computed independently from p
// and view.exact; strings are compared after U+00A0 -> space (the page's no-break wrapping).
const hasFormula = typeof VM.formulaView === 'function';
const hasTwoRolls = typeof VM.twoRollsText === 'function';
const nb = (x) => String(x ?? '').replaceAll(String.fromCharCode(0xa0), ' ');
const MINUS = '−';
const minusInt = (n) => (n < 0 ? MINUS + Math.abs(n) : String(n));
const fx1 = (k) => (k < 0 ? MINUS + VM.fixed(-k, 1) : VM.fixed(k, 1));   // k in tenths
const branchCounts = { roundRule: 0, roundTable: 0, ruleRule: 0, reason: 0, tableTable: 0, mixed: 0, other: 0 };
const thresholdsSeen = new Set();
const WANT_BRANCHES = { roundRule: 60740, roundTable: 10240, ruleRule: 36850, reason: 28100, tableTable: 5950, mixed: 80, other: 0 };
const flatSeg = (g) => (g ? nb(g.pre) + nb(g.result) + nb(g.post) : String(g));
const flatWin = (w) => (w ? nb(w.pre) + nb(w.verdict) + nb(w.post) : String(w));

function checkCopy(p, view, tab) {
  const { ac, atk, die: X, dmg: D } = p;
  const ex = view.exact;
  const hf = view.hitFaces;
  const normal = hf - 1;                 // the crit face is always one of the hit faces
  const twoAvgD = X + 1 + 2 * D;         // 2 x (avg die + D)
  const sg = D < 0 ? MINUS : '+', aD = Math.abs(D);
  const avg = VM.fixed(5 * (X + 1), 1);
  const pN = VM.fixed(5 * normal, 2);

  // (z) two-roll paragraph (COPY-01, D-02), including the article rule (RESEARCH Pitfall 3)
  if (!hasTwoRolls) {
    record('z', p, 'VM.twoRollsText missing');
  } else {
    const t = view.threshold;
    let s1;
    if (view.hitState === 'cap') s1 = 'anything but a natural 1 hits (the 95% cap).';
    else if (view.hitState === 'floor') s1 = 'only a natural 20 hits (the 5% floor).';
    else {
      thresholdsSeen.add(t);
      s1 = `${[8, 11, 18].includes(t) ? 'an' : 'a'} ${t} or higher hits.`;
    }
    const want = `Every attack is two rolls, and the d20 comes first: with ${VM.signed(atk)} against AC ${ac}, ${s1} ` +
      `Only a hit rolls damage: one d${X}, or two on a natural 20, and a miss deals 0. ` +
      `The table pairs all 20 d20 faces with all ${X} damage faces, so its ${20 * X} cells are equally likely outcomes. ` +
      (view.critFloorDiffers
        ? 'That makes the average cell close to the expected damage per attack (the note under the table explains the small gap).'
        : 'That makes the average cell the expected damage per attack.');
    let got;
    try { got = nb(VM.twoRollsText(view)); } catch (err) { got = `threw ${err && err.message}`; }
    if (got !== want) record('z', p, `${JSON.stringify(got)} vs ${JSON.stringify(want)}`);
  }

  if (!hasFormula) {
    record('r', p, 'VM.formulaView missing');
    record('s', p, 'VM.formulaView missing');
    record('t', p, 'VM.formulaView missing');
    return;
  }
  if (!ex) {
    record('s', p, 'statsView.exact missing');
    record('t', p, 'statsView.exact missing');
    return;
  }
  let fv;
  try { fv = VM.formulaView(view); } catch (err) {
    const msg = `formulaView threw: ${err && err.message}`;
    record('r', p, msg); record('s', p, msg); record('t', p, msg);
    return;
  }

  // (r) hit chance: raw faces F, the clamp shown iff F leaves 1..19, result = the card's percent
  {
    const F = 21 - (ac - atk);
    const atkT = atk < 0 ? `(${MINUS}${-atk})` : String(atk);
    const pre = nb(fv.hit && fv.hit.pre);
    const head = `= (21 − (${ac} − ${atkT})) / 20`;
    let bad = null;
    if (Math.min(19, Math.max(1, F)) !== hf) bad = `clamp(F ${F}) vs hitFaces ${hf}`;
    else if (!pre.startsWith(head)) bad = `pre ${JSON.stringify(pre)} does not start ${JSON.stringify(head)}`;
    else if (!pre.endsWith(`= ${hf}/20 = `)) bad = `pre ${JSON.stringify(pre)} does not end in "= ${hf}/20 = "`;
    else if (F >= 1 && F <= 19 && pre !== `${head} = ${hf}/20 = `) bad = `unclamped pre ${JSON.stringify(pre)}`;
    else if (pre.includes('kept to 19') !== (F > 19)) bad = `cap clamp wording with F ${F}: ${JSON.stringify(pre)}`;
    else if (pre.includes('raised to 1') !== (F < 1)) bad = `floor clamp wording with F ${F}: ${JSON.stringify(pre)}`;
    else if ((F > 19 || F < 1) && !pre.includes(`→ ${minusInt(F)} faces`)) bad = `clamp without raw faces ${F}: ${JSON.stringify(pre)}`;
    else if (fv.hit.result !== `${view.hitPct}%`) bad = `result ${fv.hit.result} vs card ${view.hitPct}%`;
    else if (nb(fv.hit.post) !== '') bad = `post ${JSON.stringify(fv.hit.post)}`;
    if (bad) record('r', p, bad);
  }

  // (s) per round: rule branch iff the integer closed form equals the exact numerator (D-04)
  const roundRule = normal * X * X * twoAvgD + X * X * (2 * X + 2 + 2 * D) === 2 * ex.e20Num;
  if (roundRule) branchCounts.roundRule++; else branchCounts.roundTable++;
  {
    const r = fv.round || {};
    const keyWant = `A normal hit is any hit except the natural 20. avg die = (${X} + 1) / 2 = ${avg}, ` +
      'and D is the damage bonus. A crit rolls the die twice and adds D once.';
    const l1Want = `= ${pN} × (${avg} ${sg} ${aD}) + 0.05 × (2 × ${avg} ${sg} ${aD})`;
    let bad = null;
    if (nb(fv.roundKey) !== keyWant) bad = `key ${JSON.stringify(nb(fv.roundKey))}`;
    else if (nb(r.l1) !== l1Want) bad = `l1 ${JSON.stringify(nb(r.l1))} vs ${JSON.stringify(l1Want)}`;
    else if ((fv.branch && fv.branch.round) !== (roundRule ? 'rule' : 'table')) bad = `branch.round ${fv.branch && fv.branch.round}, rule ${roundRule}`;
    else if (roundRule) {
      const l2Pre = `= ${pN} × ${fx1(5 * twoAvgD)} + 0.05 × ${fx1(5 * (2 * X + 2 + 2 * D))} = `;
      if (!r.l2 || r.note !== null) bad = 'rule branch needs l2 and a null note';
      else if (nb(r.l2.pre) !== l2Pre) bad = `l2 pre ${JSON.stringify(nb(r.l2.pre))} vs ${JSON.stringify(l2Pre)}`;
      else if (r.l2.result !== view.perRoundText) bad = `l2 result ${r.l2.result} vs card ${view.perRoundText}`;
    } else {
      const notePre = `Not exact here: at a damage bonus of ${VM.signed(D)}, some rolls would deal less than 0, ` +
        'but damage stops at 0. ' + (view.critFloorDiffers
        ? 'Counting every roll exactly, with a real two-dice crit, gives ' : 'The table gives ');
      if (r.l2 !== null || !r.note) bad = 'table branch needs a null l2 and a note';
      else if (nb(r.note.pre) !== notePre) bad = `note pre ${JSON.stringify(nb(r.note.pre))}`;
      else if (r.note.result !== view.perRoundText) bad = `note result ${r.note.result} vs card ${view.perRoundText}`;
      else if (nb(r.note.post) !== ' per round, the same as the Expected per round card.') bad = `note post ${JSON.stringify(r.note.post)}`;
    }
    // Claim (04-REVIEW WR-01, IN-02): the note may credit "the table" only where the table's own
    // average (tableSum / X per 20 rounds) is the exact expectation, so the number printed is the
    // table's, at the card's rounding too.
    if (!bad && r.note) {
      const saysTable = /\btable\b/.test(nb(r.note.pre) + nb(r.note.post));
      const tableExact = tab.ts * X === ex.e20Num;
      if (saysTable !== tableExact) bad = `note ${saysTable ? 'credits' : 'does not credit'} the table, tableSum x die === e20Num is ${tableExact}`;
      else if (saysTable && VM.fixed(VM.tenths(tab.ts, X) * 5, 3) !== r.note.result) bad = `table average vs note ${r.note.result}`;
    }
    if (bad) record('s', p, bad);
  }

  // (t) +1 to hit, +1 to damage, Which wins (D-03, D-04, RESEARCH Pitfall 1)
  {
    const marg = view.marg;
    const hitRule = marg.reason === null && 2 * ex.hitNum === twoAvgD * ex.den;
    const dmgRule = ex.dmgNum === hf * ex.den;
    if (marg.reason !== null) branchCounts.reason++;
    else if (hitRule && dmgRule) branchCounts.ruleRule++;
    else if (!hitRule && !dmgRule) branchCounts.tableTable++;
    else if (!hitRule && dmgRule) branchCounts.mixed++;
    else branchCounts.other++;
    const b = fv.branch || {};
    const ph = fv.plusHit || {}, pd = fv.plusDmg || {}, w = fv.win || {};
    const form = marg.reason ? 'zero-hit' : hitRule && dmgRule ? 'inequality' : 'compare-displayed';
    const mHitT = VM.tenths(ex.hitNum, ex.den), mDmgT = VM.tenths(ex.dmgNum, ex.den);
    let bad = null;
    if (marg.reason !== null) {
      if (ph.result !== '' || !nb(ph.pre).startsWith('= 0')) bad = `zero +1 to hit ${JSON.stringify(flatSeg(ph))}`;
      else if (b.hit !== 'zero') bad = `branch.hit ${b.hit} with reason ${marg.reason}`;
    } else if (ph.result !== marg.hitRound) bad = `+1 to hit result ${ph.result} vs card ${marg.hitRound}`;
    else if (b.hit !== (hitRule ? 'rule' : 'table')) bad = `branch.hit ${b.hit}, rule ${hitRule}`;
    else if (hitRule && nb(ph.pre) !== `= (${avg} ${sg} ${aD}) / 20 = `) bad = `+1 to hit pre ${JSON.stringify(nb(ph.pre))}`;
    else if (!hitRule && (nb(ph.pre) !== '= ' || !nb(ph.post).includes('from the table'))) bad = `+1 to hit table ${JSON.stringify(flatSeg(ph))}`;
    if (!bad) {
      if (pd.result !== marg.dmgRound) bad = `+1 to damage result ${pd.result} vs card ${marg.dmgRound}`;
      else if (b.dmg !== (dmgRule ? 'rule' : 'table')) bad = `branch.dmg ${b.dmg}, rule ${dmgRule}`;
      else if (dmgRule && nb(pd.pre) !== `= ${hf}/20 = `) bad = `+1 to damage pre ${JSON.stringify(nb(pd.pre))}`;
      else if (!dmgRule && (nb(pd.pre) !== '= ' || !nb(pd.post).includes(view.critFloorDiffers ? 'counted exactly' : 'from the table'))) {
        bad = `+1 to damage table ${JSON.stringify(flatSeg(pd))}`;
      }
    }
    // Claims (04-REVIEW WR-01): a +1 line that says "from the table" prints the table's own
    // difference, i.e. (table sum after the +1 - table sum now) x die is the exact numerator.
    if (!bad && nb(flatSeg(ph)).includes('from the table') && (tab.tsHit - tab.ts) * X !== ex.hitNum) {
      bad = `+1 to hit credits the table: table step ${(tab.tsHit - tab.ts) * X} vs exact ${ex.hitNum}`;
    }
    if (!bad && nb(flatSeg(pd)).includes('from the table') && (tab.tsDmg - tab.ts) * X !== ex.dmgNum) {
      bad = `+1 to damage credits the table: table step ${(tab.tsDmg - tab.ts) * X} vs exact ${ex.dmgNum}`;
    }
    if (!bad) {
      let verdict;
      if (marg.reason) verdict = '+1 to damage wins.';
      else if (mHitT > mDmgT) verdict = '+1 to hit wins.';
      else if (mHitT < mDmgT) verdict = '+1 to damage wins.';
      else verdict = form === 'inequality' ? 'they tie.' : 'they are about even.';
      let preWant;
      if (form === 'zero-hit') preWant = 'Here +1 to hit adds nothing, so ';
      else if (form === 'inequality') {
        const op = twoAvgD < 2 * hf ? '<' : twoAvgD > 2 * hf ? '>' : '=';
        preWant = `Here ${VM.fixed(5 * twoAvgD, 1)} ${op} 20 × ${VM.fixed(5 * hf, 2)} = ${VM.fixed(10 * hf, 1)}, so `;
      } else if (mHitT === mDmgT) preWant = `Here both add about ${marg.hitRound} per round, so `;
      else {
        const [big, small] = mHitT > mDmgT ? [marg.hitRound, marg.dmgRound] : [marg.dmgRound, marg.hitRound];
        preWant = `Here ${big} > ${small} per round, so `;
      }
      if (b.win !== form) bad = `branch.win ${b.win} vs ${form}`;
      else if (nb(w.verdict) !== verdict) bad = `verdict ${JSON.stringify(w.verdict)} vs ${JSON.stringify(verdict)}`;
      else if (nb(w.pre) !== preWant) bad = `win pre ${JSON.stringify(nb(w.pre))} vs ${JSON.stringify(preWant)}`;
      else if (nb(w.post) !== '') bad = `win post ${JSON.stringify(w.post)}`;
    }
    if (bad) record('t', p, bad);
  }
}

// Phase 4 chart copy (u)(v)(w), COPY-03 / COPY-04 / D-05 / D-06. VM.explainChart is fed the
// loop's own series a / d, crossings c and bands b (the objects that draw the rings and bands),
// plus hitFaces and the normal-hit average from view.exact, so it costs no engine call. Every
// expected string is rebuilt here from p and those objects; U+00A0 is normalized first.
const hasExplain = typeof VM.explainChart === 'function';
const S = (n) => VM.signed(n);
const LQ = '“', RQ = '”';   // U+201C / U+201D around the on-chart band names
const explainCounts = {
  straight: [0, 0, 0, 0, 0], straightOver: 0,
  nodmg: 0, rule: 0, floorBites: 0, capAll: 0, capAllNodmg: 0, floorFirst: 0,
  noneDamage: 0, noneAttack: 0, oneAdjacent: 0, oneTie: 0, endTieOnly: 0, touch: 0, multi: 0, identical: 0,
};
const WANT_STRAIGHT = [60740, 2730, 2730, 2730, 2050];
const WANT_HIT = { nodmg: 1092, rule: 60060, floorBites: 9828, capAll: 11648, capAllNodmg: 182, floorFirst: 15360 };
const WANT_CROSS = { noneDamage: 30095, noneAttack: 14677, oneAdjacent: 25318, oneTie: 874, endTieOnly: 16, touch: 0, multi: 0, identical: 0 };
// (w) lever claims (04-REVIEW WR-02). leadTab: one byte per setting, from the loop's own sweeps:
// bit 1 = +N to hit leads at some N >= 1, bit 2 = +N to damage does. leverClaims: what each
// no-crossing text names, checked after the loop. Counts pinned per leader and lever set.
const leadIdx = (ac, die, atk, dmg) => (((ac - CS.ac.min) * DICE_SET.length + DICE_SET.indexOf(die)) * span(CS.atk) +
  (atk - CS.atk.min)) * span(CS.dmg) + (dmg - CS.dmg.min);
const leadTab = new Uint8Array(TOTAL_COMBOS);
const leverClaims = [];
const leverCounts = { damage: { both: 0, ac: 0, die: 0, none: 0 }, attack: { both: 0, ac: 0, die: 0, none: 0 } };
const WANT_LEVERS = { damage: { both: 2946, ac: 16687, die: 1744, none: 8718 }, attack: { both: 1961, ac: 10916, die: 56, none: 1744 } };
const RING_TAIL = ' Change the AC or the die and watch the ring move, or disappear.';
const RINGS_TAIL = ' Change the AC or the die and watch the rings move, or disappear.';

// lv: the page's VM.crossLevers answer for this setting. The (w) lever claims below test that
// answer against the sweeps; this only rebuilds the sentence it selects.
const LEVER_TEXT = {
  damage: {
    both: 'A higher AC leaves fewer hits for +1 damage to add to, and a bigger die makes each extra hit worth more. ' +
      'Either can let +N to hit pull ahead.',
    ac: 'A higher AC leaves fewer hits for +1 damage to add to, and that can let +N to hit pull ahead.',
    die: 'A bigger die makes each extra hit worth more, and that can let +N to hit pull ahead.',
    none: 'Here neither a higher AC nor a bigger die, on its own, lets +N to hit pull ahead.',
  },
  attack: {
    both: 'A lower AC gives +1 damage more hits to add to, and a smaller die makes each extra hit worth less. ' +
      'Either can hand the lead to +N to damage.',
    ac: 'A lower AC gives +1 damage more hits to add to, and that can hand the lead to +N to damage.',
    die: 'A smaller die makes each extra hit worth less, and that can hand the lead to +N to damage.',
    none: 'Here neither a lower AC nor a smaller die, on its own, hands the lead to +N to damage.',
  },
};
const leverKey = (lv) => (lv.ac && lv.die ? 'both' : lv.ac ? 'ac' : lv.die ? 'die' : 'none');

function crossWant(c, lv) {
  const k = c.list.length;
  const at = (e) => S(e.tieN ?? e.flipN);
  if (c.first === 'none') return ['identical', 'At these settings the two curves are identical, so neither bonus is better.'];
  if (k === 0 && c.endTieN !== null) {
    return ['endTieOnly', `At these settings the curves only meet at ${S(c.endTieN)}, at the ring on the right edge: ` +
      'they touch but do not cross.' + RING_TAIL];
  }
  if (k === 0 && c.ties.length > 0) {
    return ['touch', `At these settings the curves touch at ${S(c.ties[0])} without crossing, so there is no ring on the ` +
      'chart. Change the AC or the die and watch the gap open or a crossover appear.'];
  }
  if (k === 0) {
    return [c.first === 'damage' ? 'noneDamage' : 'noneAttack', 'At these settings the curves never cross, so there is ' +
      'no ring on the chart.' + (lv ? ' ' + LEVER_TEXT[c.first][leverKey(lv)] : '')];
  }
  if (k === 1 && c.list[0].tieN === null) {
    return ['oneAdjacent', `At these settings the lead changes once, at ${S(c.list[0].flipN)}: the ring on the chart.` + RING_TAIL];
  }
  if (k === 1) {
    return ['oneTie', `At these settings the two are even at ${S(c.list[0].tieN)}, and the lead changes there: ` +
      'the ring on the chart.' + RING_TAIL];
  }
  if (k === 2) {
    return ['multi', `At these settings the lead changes twice, at ${at(c.list[0])} and ${at(c.list[1])}: ` +
      'the two rings on the chart.' + RINGS_TAIL];
  }
  return ['multi', `At these settings the lead changes ${k} times: the rings on the chart.` + RINGS_TAIL];
}

function checkExplain(p, a, d, den, hf, ex, c, b, markers, cvExplain) {
  if (!hasExplain) {
    record('u', p, 'VM.explainChart missing');
    record('v', p, 'VM.explainChart missing');
    record('w', p, 'VM.explainChart missing');
    return;
  }
  const { die: X, dmg: D } = p;
  // The plain no-crossing text names levers from the page's own probe (chartBase does the same).
  const neverCross = c.list.length === 0 && c.endTieN === null && c.ties.length === 0 && c.first !== 'none';
  let e, lv = null;
  try {
    if (neverCross) lv = VM.crossLevers(p, c.first, MAXN);
    e = VM.explainChart(p, { attack: a, damage: d, den, crossings: c, bands: b, levers: lv },
      { hitFaces: hf, normalNum: ex.normalNum, normalDen: ex.normalDen });
  } catch (err) {
    const msg = `explainChart threw: ${err && err.message}`;
    record('u', p, msg); record('v', p, msg); record('w', p, msg);
    return;
  }

  // (u) dashed line: straightFrom k and the step hitFaces (1 decimal)
  {
    const step = VM.fixed(10 * hf, 1);
    let k = MAXN;
    for (let j = MAXN - 1; j >= 0 && d[j + 1] - d[j] === hf * den; j--) k = j;
    if (k <= 4) explainCounts.straight[k]++; else explainCounts.straightOver++;
    const want = k === 0
      ? `Each +1 to damage adds 1 to every hit. You expect ${hf} ${hf === 1 ? 'hit' : 'hits'} in 20 rounds, ` +
        `so every step adds the same ${step} and the line is straight.`
      : `Each +1 to damage adds 1 to every hit, but damage stops at 0, so at a damage bonus of ${S(D)} the first ` +
        `steps add less. From ${S(k)} on, every step adds the same ${step}: ` +
        (hf === 1 ? 'one for the 1 hit you expect in 20 rounds.' : `one for each of the ${hf} hits you expect in 20 rounds.`);
    const got = nb(e.dmgLine);
    if (got !== want) record('u', p, `k ${k}: ${JSON.stringify(got)} vs ${JSON.stringify(want)}`);
    else if ((k === 0) !== got.includes('the line is straight')) record('u', p, `k ${k} straight wording`);
  }

  // (v) solid line: the step variant, the step itself outside the bands, one sentence per band,
  // then the claims themselves (04-REVIEW CR-01, IN-02), read back from the text and tested
  // against the engine's own attack series, never against a rebuilt string.
  {
    const nodmg = X + D <= 0;
    const capAll = b.cap !== null && b.cap[0] === 0;
    const rule = !nodmg && 2 * ex.normalNum === (X + 1 + 2 * D) * ex.normalDen;
    if (nodmg) explainCounts.nodmg++; else if (rule) explainCounts.rule++; else explainCounts.floorBites++;
    if (capAll) explainCounts[nodmg ? 'capAllNodmg' : 'capAll']++;
    else if (b.floor !== null && !nodmg) explainCounts.floorFirst++;
    let bad = null;
    for (let n = 0; n < MAXN && !bad; n++) {
      const inBand = (b.floor !== null && n + 1 <= b.floor[1]) || (b.cap !== null && n >= b.cap[0]);
      if (!inBand && a[n + 1] - a[n] !== ex.normalNum * X) {
        bad = `attack step at N ${n} is ${a[n + 1] - a[n]}, not normalNum x die ${ex.normalNum * X}`;
      }
    }
    const parts = [];
    if (nodmg) {
      parts.push(capAll
        ? `It is flat across the whole chart, in the band marked ${LQ}95% cap${RQ}: you already hit on 2+, and at a ` +
          `damage bonus of ${S(D)} a normal d${X} hit deals 0 anyway, so only crits deal damage here.`
        : `Each +1 to hit turns one more d20 face into a hit, but at a damage bonus of ${S(D)} a normal d${X} ` +
          'hit deals 0. So this line stays flat even outside the shaded bands, and only crits deal damage here.');
    } else if (capAll) {
      parts.push(`It is flat across the whole chart, in the band marked ${LQ}95% cap${RQ}: you already hit on 2+, ` +
        'and a natural 1 always misses, so +1 to hit has no face left to turn into a hit.');
    } else {
      const step = 'turns one more d20 face into a hit: one more hit in 20 rounds, ' + (rule
        ? `worth an average d${X} ${D < 0 ? '−' : '+'} ${Math.abs(D)} = ${VM.fixed(5 * (X + 1 + 2 * D), 1)}.`
        : `worth ${VM.fixed(Math.round((100 * ex.normalNum) / ex.normalDen), 2)} on average here, since damage stops at 0.`);
      if (b.floor) {
        parts.push(`It is flat in the band marked ${LQ}only a nat 20 hits${RQ}, up to ${S(b.floor[1])}: a natural 20 ` +
          `always hits, but nothing else does until ${S(b.floor[1] + 1)}.`);
        if (b.floor[1] < MAXN) parts.push(`From ${S(b.floor[1] + 1)}, each +1 to hit ${step}`);
      } else {
        parts.push('Each +1 to hit ' + step);
      }
      if (b.cap) {
        parts.push(`It goes flat${b.floor ? ' again' : ''} in the band marked ${LQ}95% cap${RQ}, from ${S(b.cap[0])}: ` +
          'a natural 1 always misses, so once you hit on 2+, more to-hit buys nothing.');
      }
    }
    const want = parts.join(' ');
    const got = nb(e.hitLine);
    if (!bad && got !== want) bad = `${JSON.stringify(got)} vs ${JSON.stringify(want)}`;
    if (!bad && got.includes('only a nat 20 hits') !== (b.floor !== null && !nodmg)) bad = 'floor sentence presence';
    if (!bad && got.includes('95% cap') !== (b.cap !== null && (!nodmg || capAll))) bad = 'cap sentence presence';
    if (!bad && got.includes('whole chart') !== capAll) bad = 'whole-chart wording';
    if (!bad && got.includes('flat again') !== (b.floor !== null && b.cap !== null && !nodmg)) bad = 'flat-again wording';
    // Claims (CR-01): each sentence that prices a step names where it starts ("From +k," or +0).
    // At that N the d20 must gain a face and the engine's attack step must be the printed value
    // (to the printed 2 decimals). So no step is priced where the card says +1 to hit adds 0.
    const facesAt = (n) => 21 - Math.min(20, Math.max(2, p.ac - p.atk - n));
    for (const s of got.split(/(?<=\.) (?=[A-Z])/)) {
      if (bad || !s.includes('worth')) continue;
      const m = s.match(/^(?:From ([+−]\d+), each|Each) \+1 to hit turns one more d20 face into a hit: one more hit in 20 rounds, worth (?:an average d\d+ [+−] \d+ = )?(\d+\.\d+)/);
      if (!m) { bad = `unparsed step sentence ${JSON.stringify(s)}`; break; }
      const k = m[1] ? Number(m[1].replace('−', '-')) : 0;
      const stepNum = k >= 0 && k < MAXN ? a[k + 1] - a[k] : NaN;
      if (facesAt(k + 1) !== facesAt(k) + 1) bad = `claims a new hit face at ${S(k)}: faces ${facesAt(k)} -> ${facesAt(k + 1)}`;
      else if (!(stepNum > 0)) bad = `prices a step of ${m[2]} at ${S(k)}, where the line steps by ${stepNum}`;
      else if (Math.round(100 * Number(m[2])) !== Math.round((100 * stepNum) / den)) {
        bad = `prices ${m[2]} at ${S(k)}, engine step ${(stepNum / den).toFixed(4)}`;
      }
    }
    if (!bad && a[1] === a[0] && /(^|\. )Each \+1 to hit turns[^.]*worth/.test(got)) bad = 'prices the next +1 to hit where it adds 0';
    if (bad) record('v', p, bad);
  }

  // (w) crossover: the variant matches crossings, and every ring's N is the N printed
  {
    const [variant, want] = crossWant(c, lv);
    explainCounts[variant]++;
    const got = nb(e.crossLine);
    let bad = got !== want ? `${variant}: ${JSON.stringify(got)} vs ${JSON.stringify(want)}` : null;
    if (!bad && markers) {
      for (const m of markers) {
        const N = (m.label.match(/[+−]\d+$/) || [''])[0];
        if (!got.includes('at ' + N)) { bad = `ring "${m.label}" N not in ${JSON.stringify(got)}`; break; }
      }
    }
    // Sampled: the page's chartView wires the same probe into the same line.
    if (!bad && cvExplain && nb(cvExplain.crossLine) !== got) bad = `chartView crossLine ${JSON.stringify(nb(cvExplain.crossLine))}`;
    if (bad) record('w', p, bad);
    // Lever claims (04-REVIEW WR-02, IN-02): read the levers back from the text; checked after
    // the loop against every sweep, since they name other ACs and dice.
    if (neverCross) {
      const neither = got.includes('neither');
      leverClaims.push({
        p, first: c.first, neither,
        ac: !neither && /\b(higher|lower) AC\b/.test(got),
        die: !neither && /\b(bigger|smaller) die\b/.test(got),
      });
    }
  }
}

const t0 = performance.now();
for (let ac = CS.ac.min; ac <= CS.ac.max; ac++) {
  for (const die of DICE_SET) {
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
    for (let atk = CS.atk.min; atk <= CS.atk.max; atk++) {
      for (let dmg = CS.dmg.min; dmg <= CS.dmg.max; dmg++) {
        combos++;
        const p = { ac, atk, die, dmg };
        const inSample = combos % SAMPLE === 0;
        if (inSample) {
          sampled.ac.add(ac);
          sampled.die.add(die);
          sampled.atk.add(atk);
          sampled.dmg.add(dmg);
        }
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

        // Phase 4 copy (r)(s)(t)(z) from the same view. The table sums at +1 to hit / +1 to
        // damage come from the cache the sweep below reuses (04-REVIEW WR-01 claim checks).
        checkCopy(p, view, {
          ts: s.tableSum, tsHit: statAt(atk + 1, dmg).st.tableSum, tsDmg: statAt(atk, dmg + 1).st.tableSum,
        });

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
        else if (ex.lopsided !== (ex.eT - ex.sdT <= 0 || s.hitFaces === 1)) {
          record('o', p, `lopsided ${ex.lopsided} with eT ${ex.eT}, sdT ${ex.sdT}, hitFaces ${s.hitFaces}`);
        }

        // Exact 20-round distribution (p), every combo (03-REVIEW WR-01). The distribution is
        // shared per (hitFaces, die, dmg); the band test runs per setting because lo / hi come
        // from that setting's simExact.
        {
          const dk = `${s.hitFaces},${die},${dmg}`;
          let dd = distMemo.get(dk);
          if (!dd) {
            dd = dist20Of(p, sp);
            const V = sp.var20Num / sp.var20Den;
            if (!(Math.abs(dd.variance - V) <= 1e-9 * Math.max(V, 1))) {
              record('p', p, `convolution variance ${dd.variance} vs var20 ${V}`);
            }
            distMemo.set(dk, dd);
          }
          const dist20 = dd.dist20;
          const lo = ex.loT / 10, hi = ex.hiT / 10;
          let inBand = 0, below = 0;
          for (let t = 0; t < dist20.length; t++) {
            if (t >= lo && t <= hi) inBand += dist20[t];
            if (t <= hi) below += dist20[t];
          }
          // The bounds are the page's own vocabulary, not a fit to the data: "About 2 runs in 3"
          // is false below 3/5, and at 4/5 or more the page's other wording, "Most runs", applies.
          if (!ex.lopsided) {
            cov.minTwoInThree = Math.min(cov.minTwoInThree, inBand);
            cov.maxTwoInThree = Math.max(cov.maxTwoInThree, inBand);
            if (!(inBand >= 0.60 && inBand < 0.80)) record('p', p, `"2 in 3" band ${lo}..${hi} holds ${inBand.toFixed(4)}`);
          } else {
            cov.minMost = Math.min(cov.minMost, below);
            if (!(below >= 0.80)) record('p', p, `"Most runs" band 0..${hi} holds ${below.toFixed(4)}`);
          }
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
        if (inSample) {
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
        {
          let lb = 0;
          for (let n = 1; n <= MAXN; n++) lb |= a[n] > d[n] ? 1 : a[n] < d[n] ? 2 : 0;
          leadTab[leadIdx(ac, die, atk, dmg)] = lb;
        }

        // Readout leader (y), 02-REVIEW WR-02: the word comes from the exact numerators, so the
        // readout never says "even" where the ring says the curves flip.
        if (!hasReadout) {
          record('y', p, 'VM.readoutLines missing');
        } else {
          const lines = VM.readoutLines(a, d, den);
          if (!Array.isArray(lines) || lines.length !== MAXN + 1) {
            record('y', p, `${lines && lines.length} readout lines`);
          } else {
            for (let n = 0; n <= MAXN; n++) {
              const sg = Math.sign(a[n] - d[n]), line = lines[n];
              const ok = sg === 0 ? line.endsWith(' · even')
                : !line.endsWith('even') && line.includes(sg > 0 ? ' · to hit ahead by ' : ' · to damage ahead by ');
              if (!ok) { record('y', p, `N ${n} (sign ${sg}): ${line}`); break; }
            }
          }
        }
        if (inSample) {
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
        let crossRes = null, bandRes = null;
        if (!hasCross) {
          record('m', p, 'DiceMath.crossings missing');
        } else {
          const c = DiceMath.crossings(a, d);
          crossRes = c;
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
          if (inSample) {
            const markers = (VM.chartView(p, 5).markers || []).length;
            const want = c.list.length + (c.endTieN !== null ? 1 : 0);
            if (markers !== want) record('m', p, `${markers} markers vs ${want}`);
          }
          // Zero counts (02-REVIEW IN-04): the synthetic-only copy branches stay unreachable.
          // A touch is a tie with the same leader on both sides (the nearest non-zero signs).
          const signAt = (n) => Math.sign(a[n] - d[n]);
          const isTouch = (t) => {
            let before = 0, after = 0;
            for (let n = t - 1; n >= 1 && before === 0; n--) before = signAt(n);
            for (let n = t + 1; n <= MAXN && after === 0; n++) after = signAt(n);
            return before !== 0 && before === after;
          };
          if ((c.ties || []).some(isTouch)) zeroCounts.touch++;
          if ((c.ties || []).includes(1)) zeroCounts.leadingTie++;
          if (c.list.length >= 2) zeroCounts.multiCross++;
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
          bandRes = b;
          const nodmg = die + dmg <= 0;
          for (let n = 0; n < MAXN; n++) {
            const flat = a[n + 1] === a[n];
            const banded = (b.floor !== null && n + 1 <= b.floor[1]) || (b.cap !== null && n >= b.cap[0]) || nodmg;
            if (flat !== banded) { record('n', p, `N ${n} -> ${n + 1}: flat ${flat}, banded ${banded}`); break; }
          }
        }

        // Chart explanations (u)(v)(w) from the same series, crossings and bands. Sampled combos
        // also compare the drawn rings' N (the chartView memo already holds this setting).
        if (crossRes && bandRes) {
          const cv = inSample && typeof VM.chartView === 'function' ? VM.chartView(p, 5) : null;
          checkExplain(p, a, d, den, s.hitFaces, view.exact, crossRes, bandRes, cv ? cv.markers : null, cv ? cv.explain : null);
        }
      }
    }
  }
}
const sweepMs = (performance.now() - t0).toFixed(0);

// (y) pin: the 02-REVIEW WR-02 case. The displayed tenths are equal (12.0 and 12.0), but the
// exact attack total is ahead by 0.0278, and the ring there says "flips at +3".
if (hasReadout) {
  const pin = { ac: 17, atk: -5, die: 12, dmg: -4 };
  const sw = DiceMath.sweep(pin, MAXN);
  const got = VM.readoutLines(sw.attack, sw.damage, sw.den)[3];
  const want = 'At +3: to hit 12.0 · to damage 12.0 · to hit ahead by less than 0.1';
  if (got !== want) record('y', pin, `pin N 3: ${JSON.stringify(got)} vs ${JSON.stringify(want)}`);
}

// (s)(t)(z) branch counts and threshold coverage (RESEARCH Pattern 3, Pitfalls 1 and 3). The
// counts are the full-domain distribution; a rule change that moves any setting fails here.
if (hasFormula) {
  for (const [k, want] of Object.entries(WANT_BRANCHES)) {
    if (branchCounts[k] === want) continue;
    const key = k.startsWith('round') ? 's' : 't';
    counts[key]++;
    firstFailures.push(`${key}: branch count ${k} ${branchCounts[k]} vs ${want}`);
  }
}
if (hasTwoRolls) {
  const seen = [...thresholdsSeen].sort((x, y) => x - y).join(',');
  const want = Array.from({ length: 17 }, (_, i) => i + 3).join(',');
  if (seen !== want) {
    counts.z++;
    firstFailures.push(`z: normal thresholds seen ${seen} vs ${want}`);
  }
}
// (t) pins: the table branch and the mixed case (hit table, damage rule) compare displayed values.
if (hasFormula) {
  const WIN_PINS = [
    [{ ac: 15, die: 8, atk: 5, dmg: -3, n: 5 }, 'Here 0.425 > 0.095 per round, so +1 to damage wins.'],
    [{ ac: 15, die: 8, atk: -5, dmg: -2, n: 5 }, 'Here 0.130 > 0.050 per round, so +1 to hit wins.'],
  ];
  for (const [pin, want] of WIN_PINS) {
    let got;
    try { got = flatWin(VM.formulaView(VM.statsView(pin)).win); } catch (err) { got = `threw ${err && err.message}`; }
    if (got !== want) record('t', pin, `pin ${JSON.stringify(got)} vs ${JSON.stringify(want)}`);
  }
}

// (u)(v)(w) state counts over the full domain (RESEARCH Pattern 4). A rule change that moves any
// setting between variants fails here.
if (hasExplain) {
  const tally = (key, label, got, want) => {
    if (got === want) return;
    counts[key]++;
    firstFailures.push(`${key}: count ${label} ${got} vs ${want}`);
  };
  WANT_STRAIGHT.forEach((want, k) => tally('u', `straightFrom ${k}`, explainCounts.straight[k], want));
  tally('u', 'straightFrom > 4', explainCounts.straightOver, 0);
  for (const [k, want] of Object.entries(WANT_HIT)) tally('v', k, explainCounts[k], want);
  for (const [k, want] of Object.entries(WANT_CROSS)) tally('w', k, explainCounts[k], want);

  // (w) lever claims (04-REVIEW WR-02): each no-crossing text names a lever iff one of the
  // slider's own values, changed alone, makes the trailing bonus lead at some N (from leadTab,
  // the loop's sweeps), and says "neither" iff no such value exists.
  for (const cl of leverClaims) {
    const { ac, die, atk, dmg } = cl.p;
    const bit = cl.first === 'damage' ? 1 : 2;
    let tAC = false, tDie = false;
    for (let c2 = CS.ac.min; c2 <= CS.ac.max; c2++) {
      if ((bit === 1 ? c2 > ac : c2 < ac) && (leadTab[leadIdx(c2, die, atk, dmg)] & bit)) tAC = true;
    }
    for (const x of DICE_SET) {
      if ((bit === 1 ? x > die : x < die) && (leadTab[leadIdx(ac, x, atk, dmg)] & bit)) tDie = true;
    }
    leverCounts[cl.first][leverKey({ ac: tAC, die: tDie })]++;
    if (cl.ac !== tAC || cl.die !== tDie || cl.neither !== (!tAC && !tDie)) {
      record('w', cl.p, `levers named: AC ${cl.ac}, die ${cl.die}, neither ${cl.neither}; the sweeps: AC ${tAC}, die ${tDie}`);
    }
  }
  for (const first of ['damage', 'attack']) {
    for (const [k, want] of Object.entries(WANT_LEVERS[first])) tally('w', `${first}-first levers ${k}`, leverCounts[first][k], want);
  }
  // Pin: the page's own chartView at the defaults (the self-test passes this probe result as a literal).
  const defLine = nb(VM.chartView({ ac: 15, atk: 5, die: 8, dmg: 0 }, 5).explain.crossLine);
  const defWant = 'At these settings the curves never cross, so there is no ring on the chart. A higher AC leaves fewer ' +
    'hits for +1 damage to add to, and that can let +N to hit pull ahead.';
  if (defLine !== defWant) record('w', { ac: 15, atk: 5, die: 8, dmg: 0 }, `defaults pin ${JSON.stringify(defLine)}`);
}

// Presets (x): COPY-05, D-07, D-08, success criterion 4. Every preset's description re-derived from the
// engine at its exact settings, the UI-SPEC strings, the parse round trip, and markup parity.
const PRESET_WANT = {
  cross: {
    title: 'A crossover',
    button: 'Try AC 25 with a d12',
    desc: 'At AC 25 only a natural 20 hits, so +1 to hit buys nothing until +6. After that, each +1 to hit adds a ' +
      'whole extra d12 hit (6.5 over 20 rounds), while +1 to damage adds just 1.0. Look for the ring at +6, where ' +
      '+N to hit takes over.',
    setsText: 'Sets: AC 25, d12, +0 to hit, +0 damage, compare at +6',
    sets: { ac: 25, die: 12, atk: 0, dmg: 0, n: 6 },
  },
  dmg: {
    title: 'Damage always wins',
    button: 'Try AC 15 with a d8',
    desc: 'At AC 15 with +0 to hit you expect 6 hits in 20 rounds, so each +1 to damage adds 6.0. Each +1 to hit ' +
      'adds one more hit, worth only 4.5. The dashed line stays on top at every N, and there is no ring.',
    setsText: 'Sets: AC 15, d8, +0 to hit, +0 damage, compare at +5',
    sets: { ac: 15, die: 8, atk: 0, dmg: 0, n: 5 },
  },
  cap: {
    title: 'The cap flips it',
    button: 'Try AC 15 with a d12',
    desc: 'With a d12, one more hit is worth 6.5 and +1 to damage adds 6.0, so +N to hit leads at first. At +13 it ' +
      'reaches the 95% cap and goes flat, and +N to damage passes it at +15.',
    setsText: 'Sets: AC 15, d12, +0 to hit, +0 damage, compare at +15',
    sets: { ac: 15, die: 12, atk: 0, dmg: 0, n: 15 },
  },
};
const presetFacts = [];
{
  const xp = (key) => ({ ac: `(preset ${key})`, atk: '', die: '', dmg: '' });
  const bad = (key, detail) => record('x', xp(key), detail);
  const PRESETS = VM.PRESETS;
  if (!Array.isArray(PRESETS)) {
    bad('all', 'VM.PRESETS missing');
  } else {
    if (PRESETS.map((pr) => pr.key).join(',') !== Object.keys(PRESET_WANT).join(',')) {
      bad('all', `keys ${PRESETS.map((pr) => pr.key).join(',')}`);
    }
    if (!Object.isFrozen(PRESETS) || !PRESETS.every((pr) => Object.isFrozen(pr) && Object.isFrozen(pr.sets))) {
      bad('all', 'VM.PRESETS is not deeply frozen');
    }
    // The static #explore markup, read from the raw file (entities decoded)
    const dec = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    const exStart = html.indexOf('<section id="explore"');
    const exEnd = exStart < 0 ? -1 : html.indexOf('</section>', exStart);
    const exHtml = exStart < 0 || exEnd < 0 ? '' : html.slice(exStart, exEnd);
    if (!exHtml) bad('all', 'no <section id="explore"> in index.html');
    const items = [...exHtml.matchAll(/<li class="explore-item">([\s\S]*?)<\/li>/g)].map((m) => m[1]);
    if (exHtml && items.length !== PRESETS.length) bad('all', `${items.length} .explore-item vs ${PRESETS.length} presets`);
    for (const pr of PRESETS) {
      const key = pr.key, want = PRESET_WANT[key];
      if (!want) { bad(key, 'unknown preset'); continue; }
      const sets = pr.sets || {};
      // UI-SPEC strings, exactly
      for (const f of ['title', 'button', 'desc', 'setsText']) {
        if (pr[f] !== want[f]) bad(key, `${f} ${JSON.stringify(pr[f])} vs ${JSON.stringify(want[f])}`);
      }
      if (JSON.stringify(sets) !== JSON.stringify(want.sets)) bad(key, `sets ${JSON.stringify(sets)}`);
      // D-08: every value survives the one parse path unchanged
      for (const k of ['ac', 'die', 'atk', 'dmg', 'n']) {
        if (VM.parseControl(k, sets[k], VM.DEFAULT_STATE[k]) !== sets[k]) bad(key, `parseControl changes ${k} ${sets[k]}`);
      }
      // Markup parity: the item holding this key's button
      const item = items.find((it) => it.includes(`data-preset="${key}"`));
      if (exHtml && !item) bad(key, 'no .explore-item with this data-preset');
      if (item) {
        const grab = (re) => { const m = item.match(re); return m ? dec(m[1]).trim() : null; };
        const mk = {
          title: grab(/<h3 class="explore-title">([\s\S]*?)<\/h3>/),
          desc: grab(new RegExp(`<p class="explore-desc" id="ex-${key}-d">([\\s\\S]*?)</p>`)),
          setsText: grab(new RegExp(`<p class="explore-sets" id="ex-${key}-s">([\\s\\S]*?)</p>`)),
          button: grab(new RegExp(`<button[^>]*data-preset="${key}"[^>]*>([\\s\\S]*?)</button>`)),
        };
        for (const f of Object.keys(mk)) {
          if (mk[f] !== pr[f]) bad(key, `markup ${f} ${JSON.stringify(mk[f])} vs VM ${JSON.stringify(pr[f])}`);
        }
        const tag = (item.match(new RegExp(`<button[^>]*data-preset="${key}"[^>]*>`)) || [''])[0];
        if (!tag.includes(`aria-describedby="ex-${key}-d ex-${key}-s"`)) bad(key, `button aria-describedby: ${tag}`);
        if (!/\bdisabled\b/.test(tag)) bad(key, 'button does not ship disabled');
        if (/data-key=|onclick=/.test(tag)) bad(key, 'button carries data-key or an inline handler');
      }

      // Engine facts at the exact settings (UI-SPEC Presets table, RESEARCH Reference Values)
      const q = { ac: sets.ac, die: sets.die, atk: sets.atk, dmg: sets.dmg };
      let sw, st, c, b, lines, cv;
      try {
        sw = DiceMath.sweep(q, MAXN);
        st = DiceMath.stats(q);
        c = DiceMath.crossings(sw.attack, sw.damage);
        b = DiceMath.attackBands(q, MAXN);
        lines = VM.readoutLines(sw.attack, sw.damage, sw.den);
        cv = VM.chartView(q, sets.n);
      } catch (err) {
        bad(key, `engine threw at the preset: ${err && err.message}`);
        continue;
      }
      const stepT = (arr, n) => VM.tenths(arr[n + 1] - arr[n], sw.den);
      const stepsOk = (arr, f) => Array.from({ length: MAXN }, (_, n) => n).every((n) => stepT(arr, n) === f(n));
      const labels = cv.markers.map((m) => m.label).join(' | ');
      const facts = [];
      const expect = (label, ok) => { facts.push(label); if (!ok) bad(key, `claim failed: ${label}`); };
      if (key === 'cross') {
        expect('hitFaces 1 (5%)', st.hitFaces === 1);
        expect('floor band [+0, +5], no cap band', JSON.stringify(b) === '{"floor":[0,5],"cap":null}');
        expect('attack steps 0.0 up to +5, then 6.5', stepsOk(sw.attack, (n) => (n < 5 ? 0 : 65)));
        expect('damage steps 1.0', stepsOk(sw.damage, () => 10));
        expect('one crossing, flipN 6, to attack', c.list.length === 1 && c.list[0].flipN === 6 && c.list[0].to === 'attack');
        expect('ring label "flips at +6"', labels === 'flips at +6');
        expect('caption: damage leads +1..+5, hit leads +6..+20, cross once', cv.caption.includes(
          '+N to damage leads from +1 to +5, then +N to hit leads from +6 to +20. The curves cross once.'));
        expect('readout at +6: to hit ahead by 0.5', lines[6] === 'At +6: to hit 19.5 · to damage 19.0 · to hit ahead by 0.5');
        expect('crossover text names +6', !!cv.explain && nb(cv.explain.crossLine).includes('the lead changes once, at +6'));
      } else if (key === 'dmg') {
        expect('hitFaces 6 (30%)', st.hitFaces === 6);
        expect('damage steps 6.0', stepsOk(sw.damage, () => 60));
        expect('attack steps 4.5 up to +13, then 0.0', stepsOk(sw.attack, (n) => (n < 13 ? 45 : 0)));
        expect('cap band [+13, +20], no floor band', JSON.stringify(b) === '{"floor":null,"cap":[13,20]}');
        expect('no crossing, no tie, no end tie, damage first',
          c.list.length === 0 && c.ties.length === 0 && c.endTieN === null && c.first === 'damage');
        expect('no ring', labels === '');
        expect('caption: damage leads at every N, never cross', cv.caption.includes(
          '+N to damage leads at every N from +1 to +20. The curves never cross.'));
        expect('readout at +5: to damage ahead by 7.5', lines[5].endsWith('to damage ahead by 7.5'));
      } else if (key === 'cap') {
        expect('hitFaces 6 (30%)', st.hitFaces === 6);
        expect('attack steps 6.5 up to +13, then 0.0', stepsOk(sw.attack, (n) => (n < 13 ? 65 : 0)));
        expect('damage steps 6.0', stepsOk(sw.damage, () => 60));
        expect('cap band [+13, +20], no floor band', JSON.stringify(b) === '{"floor":null,"cap":[13,20]}');
        expect('one crossing, flipN 15, to damage', c.list.length === 1 && c.list[0].flipN === 15 && c.list[0].to === 'damage');
        expect('ring label "flips at +15"', labels === 'flips at +15');
        expect('caption: hit leads +1..+14, damage leads +15..+20, cross once', cv.caption.includes(
          '+N to hit leads from +1 to +14, then +N to damage leads from +15 to +20. The curves cross once.'));
        expect('readout at +15: to damage ahead by 5.5', lines[15].endsWith('to damage ahead by 5.5'));
      }
      presetFacts.push(`${key}: ${facts.length} claims`);
    }
    const cross = PRESETS.find((pr) => pr.key === 'cross');
    const statusWant = 'Set to AC 25, d12, +0 to hit, +0 damage, compare at +6. Everything above has updated.';
    let status;
    try { status = cross && VM.presetStatus(cross.sets); } catch (err) { status = `threw ${err && err.message}`; }
    if (status !== statusWant) bad('cross', `presetStatus ${JSON.stringify(status)}`);
  }
}

// ---- Phase 5 kill math (KILL-03, D-05, D-06) ----------------------------------
// The kill numbers depend on the attack only through (hitFaces, die, dmg), so this pass walks
// the 2,470 keys once, with the first p seen as the representative. It keeps its own Map of
// DiceMath.killTable results and calls the pure VM.killViewFrom; it never calls VM.killView or
// VM.killTableFor in a loop (their 8-entry LRU would thrash, RESEARCH Pattern 2). The oracles
// use this file's own weights, never DiceMath.hitPmf or the page's thinning.
const K_KEYS_WANT = 2470;
const K_CAP = 1000;                // UI-SPEC: the median search stops at 1,000 rounds
const K_EPS = 1e-9;                // exact 1/2 median ties; K3 proves each use is a real tie
const K_PAST_CAP = 'on average; half of fights last over 1,000 rounds';
const kHave = typeof DiceMath.killTable === 'function' && typeof VM.killViewFrom === 'function' && !!CS.hp;
const HPN = CS.hp ? CS.hp.max : 0;   // 500
const kx = (what) => ({ ac: `(kill ${what})`, atk: '', die: '', dmg: '' });
const kfmt = new Intl.NumberFormat('en-US');
// Oracle display format (UI-SPEC Number formats), chosen by the rounded tenths: under 10,000
// tenths 'int.d', else the rounded whole value with commas.
const kText = (ten, whole) => (ten < 10000 ? `${Math.floor(ten / 10)}.${ten % 10}` : kfmt.format(whole));
// Round-half-up of num / den at scale s, exact (BigInt; num, den > 0).
const rhuB = (num, den, s) => (2n * s * num + den) / (2n * den);
// UI-SPEC "Kill within 20" percent rule, applied to the oracle P20 (the '0%' branch is the
// integer fastest-kill test, decided by the caller).
const kTenthPct = (p) => { const r = Math.round(p * 1000); return `${Math.floor(r / 10)}.${r % 10}%`; };
function kPct(p) {
  if (p < 0.001) return '<0.1%';
  if (p < 0.01) return kTenthPct(p);
  if (p < 0.99) return `${Math.round(p * 100)}%`;
  if (p < 0.999) return kTenthPct(p);
  return '>99.9%';
}

// Own weights, enumerated like dist20Of. Hit weights over den = hitFaces * X^2 (X per normal
// face and die face, 1 per crit pair); a round adds (20 - hitFaces) * X^2 of misses at 0, over
// den1 = 20 * X^2. ds / ks are the damaging (d >= 1) hit weights.
function killWeightsOf(p) {
  const X = p.die, hit = new Map();
  const add = (d, k) => hit.set(d, (hit.get(d) || 0) + k);
  let hf = 0, missW = 0, missBad = false;
  for (let r = 1; r <= 20; r++) {
    const kind = DiceMath.outcome(r, p.atk, p.ac);
    if (kind === 'hit') {
      hf++;
      for (let k = 1; k <= X; k++) add(DiceMath.damageFor(r, [k], p), X);
    } else if (kind === 'crit') {
      hf++;
      for (let a = 1; a <= X; a++) for (let b = 1; b <= X; b++) add(DiceMath.damageFor(20, [a, b], p), 1);
    } else {
      if (DiceMath.damageFor(r, [], p) !== 0) missBad = true;
      missW += X * X;
    }
  }
  const hitW = [...hit].sort((x, y) => x[0] - y[0]);
  let A = 0, w0 = 0, maxD = 0, sum = 0;
  for (const [d, k] of hitW) { A += d * k; sum += k; if (d === 0) w0 = k; if (d > maxD) maxD = d; }
  const pos = hitW.filter(([d]) => d > 0);
  return {
    X, hf, den: hf * X * X, den1: 20 * X * X, missW, w0, A, maxD, sum, missBad,
    ds: Int32Array.from(pos, ([d]) => d), ks: Float64Array.from(pos, ([, k]) => k),
  };
}

// Round-by-round DP (the UI-SPEC's method) over cumulative damage 0..HPN-1 plus an absorbing
// ">= HPN" bucket; suffix sums give P(dead by t) for every hp. The median pointer only moves
// forward (medians are non-decreasing in HP). pMed / pPrev keep P at the median step and the
// step before (at the cap for past-cap HP) for K3. traceHp records P(dead by t) at one hp.
function roundOracle(o, traceHp) {
  const H = HPN, K = o.ds.length, ds = o.ds;
  const q0 = (o.missW + o.w0) / o.den1, qs = Float64Array.from(o.ks, (k) => k / o.den1);
  let cur = new Float64Array(H + 1), nxt = new Float64Array(H + 1);
  let suf = new Float64Array(H + 1), prev = new Float64Array(H + 1);
  cur[0] = 1;
  const med = new Int32Array(H + 1), p10 = new Float64Array(H + 1), p20 = new Float64Array(H + 1);
  const pMed = new Float64Array(H + 1).fill(NaN), pPrev = new Float64Array(H + 1);
  const trace = [];
  let open = 1;
  for (let t = 1; t <= K_CAP; t++) {
    nxt.fill(0);
    nxt[H] = cur[H];
    for (let s = 0; s < H; s++) {
      const c = cur[s];
      if (c === 0) continue;
      nxt[s] += c * q0;
      for (let k = 0; k < K; k++) { const j = s + ds[k]; nxt[j < H ? j : H] += c * qs[k]; }
    }
    let x = cur; cur = nxt; nxt = x;
    x = prev; prev = suf; suf = x;
    suf[H] = cur[H];
    for (let s = H - 1; s >= 1; s--) suf[s] = suf[s + 1] + cur[s];
    if (t === 10) p10.set(suf);
    if (t === 20) p20.set(suf);
    if (traceHp) trace.push(suf[traceHp]);
    while (open <= H && suf[open] >= 0.5 - K_EPS) { med[open] = t; pMed[open] = suf[open]; pPrev[open] = prev[open]; open++; }
    if (open > H && t >= 20) break;
  }
  for (let hp = open; hp <= H; hp++) pPrev[hp] = suf[hp];   // past the cap: P(dead by 1,000)
  return { med, p10, p20, pMed, pPrev, trace };
}

// Independent E[rounds] by a per-round recursion (misses included in the zero weight):
// r(n) = (den1 + sum_{d>=1} w1_d r(n - d)) / (den1 - w1_0), r(n <= 0) = 0.
function roundsOracle(o) {
  const H = HPN, K = o.ds.length, r = new Float64Array(H + 1), z = o.missW + o.w0;
  for (let n = 1; n <= H; n++) {
    let s = o.den1;
    for (let k = 0; k < K; k++) if (n > o.ds[k]) s += o.ks[k] * r[n - o.ds[k]];
    r[n] = s / (o.den1 - z);
  }
  return r;
}

// Exact E[H](n) = N_n / c^n with c = den - w0 (RESEARCH Pattern 3), from this file's weights:
// N_n = den c^(n-1) + sum_{d>=1} w_d c^(d-1) N_(n-d).
function exactOracle(o) {
  const H = HPN, denB = BigInt(o.den), c = denB - BigInt(o.w0);
  const a = Array.from(o.ds, (d, i) => [d, BigInt(o.ks[i]) * c ** BigInt(d - 1)]);
  const N = new Array(H + 1), cp = new Array(H + 1);
  N[0] = 0n; cp[0] = 1n;
  for (let n = 1; n <= H; n++) {
    let s = denB * cp[n - 1];
    for (const [d, x] of a) if (n > d) s += x * N[n - d];
    N[n] = s; cp[n] = cp[n - 1] * c;
  }
  return { N, cp };
}

// K3: P(dead by t) at hp as an exact BigInt over den1^t; true iff it is exactly 1/2.
function exactHalf(o, hp, t) {
  const den1 = BigInt(o.den1);
  const w = [[0, BigInt(o.missW + o.w0)], ...Array.from(o.ds, (d, i) => [d, BigInt(o.ks[i])])];
  let cur = new Array(hp + 1).fill(0n);
  cur[0] = 1n;
  for (let i = 0; i < t; i++) {
    const nxt = new Array(hp + 1).fill(0n);
    nxt[hp] = cur[hp] * den1;
    for (let s = 0; s < hp; s++) {
      const c = cur[s];
      if (c === 0n) continue;
      for (const [d, k] of w) nxt[s + d < hp ? s + d : hp] += c * k;
    }
    cur = nxt;
  }
  return 2n * cur[hp] === den1 ** BigInt(t);
}

const kKeys = new Map();   // key -> { p, o, tab, ehT, ehW, erT, erW } (K6 reuses these)
const kc = {
  pairs: 0, pastCap: 0, erRelMax: 0, fbCalls: 0, fbPairs: 0, mmH: 0, mmR: 0, nearTies: 0, tieMaxT: 0,
  gapMin: Infinity, everyHitKills: 0, under01: 0, zeroPct: 0, p20Trunc: 0, pins: 0,
  wholeTies: 0, nearTiesBelow: 0, fbH: 0, fbR: 0, mmHd: 0, mmRd: 0,
};
let kWorstMs = 0, kWorstKey = '';
const tk = performance.now();
if (!kHave) {
  record('K1', kx('all'), 'DiceMath.killTable, VM.killViewFrom or VM.CONTROL_SPEC.hp missing');
} else {
  if (HPN !== 500 || DiceMath.KILL_HP_MAX !== HPN) record('K1', kx('all'), `HP max ${HPN} / KILL_HP_MAX ${DiceMath.KILL_HP_MAX}`);
  for (let ac = CS.ac.min; ac <= CS.ac.max; ac++) {
    for (const die of DICE_SET) {
      for (let atk = CS.atk.min; atk <= CS.atk.max; atk++) {
        for (let dmg = CS.dmg.min; dmg <= CS.dmg.max; dmg++) {
          const p = { ac, die, atk, dmg };
          const key = `${21 - DiceMath.threshold(p)},${die},${dmg}`;
          if (!kKeys.has(key)) kKeys.set(key, { p });
        }
      }
    }
  }
  if (kKeys.size !== K_KEYS_WANT) record('K1', kx('all'), `${kKeys.size} attack keys, want ${K_KEYS_WANT}`);
  const inWin = (y) => Math.abs(y - Math.floor(y) - 0.5) < 1e-6;   // the page's ROUND_WINDOW, for the count only
  const numOf = (s) => (s === 'under 0.1' ? 0 : Number(String(s).replaceAll(',', '')));
  // All tables first, timed on their own (the BigInt oracles below churn the heap). Each key is
  // built twice and the faster build counts, so a GC pause in this large heap does not pose as
  // an algorithmic slowdown; the worst over keys is the RESEARCH Pitfall 3 signal.
  const killTabs = new Map();
  for (const [key, e] of kKeys) {
    let ms = Infinity, tab = null;
    for (let i = 0; i < 2; i++) {
      const t1 = performance.now();
      tab = DiceMath.killTable(e.p);
      ms = Math.min(ms, performance.now() - t1);
    }
    killTabs.set(key, tab);
    if (ms > kWorstMs) { kWorstMs = ms; kWorstKey = key; }
  }
  for (const [key, e] of kKeys) {
    const p = e.p, sv = VM.statsView(p), tab = killTabs.get(key);
    const o = killWeightsOf(p);
    if (o.hf !== sv.hitFaces || o.hf !== tab.hitFaces || `${o.hf},${p.die},${p.dmg}` !== key || o.sum !== o.den || o.missBad) {
      record('K1', p, `weights: hitFaces ${o.hf} / ${sv.hitFaces} / ${tab.hitFaces}, sum ${o.sum} vs ${o.den}, miss damage ${o.missBad}`);
      continue;
    }
    const ro = roundOracle(o, 0), rr = roundsOracle(o), { N, cp } = exactOracle(o), hfB = BigInt(o.hf);
    const ehT = new Float64Array(HPN + 1), ehW = new Float64Array(HPN + 1);
    const erT = new Float64Array(HPN + 1), erW = new Float64Array(HPN + 1);
    Object.assign(e, { o, tab, ehT, ehW, erT, erW });
    for (let hp = 1; hp <= HPN; hp++) {
      kc.pairs++;
      const at = `HP ${hp}`, m = ro.med[hp];
      // K1: the round DP and the per-round recursion
      if (m === 0) kc.pastCap++;
      if (tab.medianRound[hp] !== m) record('K1', p, `${at}: medianRound ${tab.medianRound[hp]} vs round DP ${m}`);
      if (!(Math.abs(tab.p10[hp] - ro.p10[hp]) <= 1e-12)) record('K1', p, `${at}: p10 ${tab.p10[hp]} vs round DP ${ro.p10[hp]}`);
      if (!(Math.abs(tab.p20[hp] - ro.p20[hp]) <= 1e-12)) record('K1', p, `${at}: p20 ${tab.p20[hp]} vs round DP ${ro.p20[hp]}`);
      const erF = (20 * tab.eHits[hp]) / tab.hitFaces, rel = Math.abs(erF - rr[hp]) / rr[hp];
      if (rel > kc.erRelMax) kc.erRelMax = rel;
      if (!(rel <= 1e-9)) record('K1', p, `${at}: 20 E[H] / hitFaces ${erF} vs per-round recursion ${rr[hp]}`);

      // K2: the card values against round-half-up of the exact rationals
      const Nn = N[hp], cn = cp[hp], rd = hfB * cn;
      ehT[hp] = Number(rhuB(Nn, cn, 10n)); ehW[hp] = Number(rhuB(Nn, cn, 1n));
      erT[hp] = Number(rhuB(20n * Nn, rd, 10n)); erW[hp] = Number(rhuB(20n * Nn, rd, 1n));
      const ehS = kText(ehT[hp], ehW[hp]), erS = kText(erT[hp], erW[hp]);
      const v = VM.killViewFrom(tab, sv, hp);
      if (v.cards[0].value !== ehS) record('K2', p, `${at}: Hits to kill ${v.cards[0].value} vs exact ${ehS}`);
      if (v.cards[1].value !== erS) record('K2', p, `${at}: Rounds to kill ${v.cards[1].value} vs exact ${erS}`);
      const fh = 10 * tab.eHits[hp], fr = 10 * erF;
      if (Math.round(fh) !== ehT[hp]) kc.mmH++;
      if (Math.round(fr) !== erT[hp]) kc.mmR++;
      if ((ehT[hp] < 10000 ? Math.round(fh) !== ehT[hp] : Math.round(tab.eHits[hp]) !== ehW[hp])) kc.mmHd++;
      if ((erT[hp] < 10000 ? Math.round(fr) !== erT[hp] : Math.round(erF) !== erW[hp])) kc.mmRd++;
      const fbH = inWin(fh) + (ehT[hp] >= 10000 && inWin(tab.eHits[hp]));
      const fbR = inWin(fr) + (erT[hp] >= 10000 && inWin(erF));
      kc.fbH += fbH; kc.fbR += fbR; kc.fbCalls += fbH + fbR;
      if (fbH + fbR) kc.fbPairs++;

      // K3: a float P within 1e-9 of 1/2 at the median step (or the step before) is exact
      for (const [x, tt] of [[ro.pMed[hp], m], [ro.pPrev[hp], m === 0 ? K_CAP : m - 1]]) {
        if (!Number.isFinite(x) || tt < 1) continue;
        const g = Math.abs(x - 0.5);
        if (g < K_EPS) {
          kc.nearTies++;
          if (x < 0.5) kc.nearTiesBelow++;
          if (tt > kc.tieMaxT) kc.tieMaxT = tt;
          if (!exactHalf(o, hp, tt)) record('K3', p, `${at}: P(dead by ${tt}) = ${x} is not exactly 1/2`);
        } else if (g < kc.gapMin) kc.gapMin = g;
      }

      // K4: sub-lines and the percent card, from the oracles
      const exactOne = Nn === cn, sub0 = v.cards[0].sub;
      if (exactOne) kc.everyHitKills++;
      if (sub0.startsWith('every hit kills') !== exactOne) record('K4', p, `${at}: "${sub0}" but E[H] = 1 is ${exactOne}`);
      const simT = Math.floor((20 * hp * o.den + o.A) / (2 * o.A));
      const simS = simT === 0 ? 'under 0.1' : kText(simT, Math.floor((2 * hp * o.den + o.A) / (2 * o.A)));
      if (simT === 0) kc.under01++;
      const sm = /^(?:every hit kills|on average) \(simple division says (.+)\)$/.exec(sub0);
      if (!sm || sm[1] !== simS) record('K4', p, `${at}: "${sub0}" vs simple ${simS}`);
      const sub1 = m === 0 ? K_PAST_CAP : `on average, half of fights by round ${kfmt.format(m)}`;
      if (v.cards[1].sub !== sub1) record('K4', p, `${at}: "${v.cards[1].sub}" vs "${sub1}"`);
      const fastest = Math.ceil(hp / o.maxD);
      if ((ro.p20[hp] === 0) !== (fastest > 20)) record('K4', p, `${at}: round-DP P20 ${ro.p20[hp]} with fastest ${fastest}`);
      if (fastest > 20) kc.zeroPct++;
      if (tab.p20[hp] === 0 && fastest <= 20) kc.p20Trunc++;
      const pct = fastest > 20 ? '0%' : kPct(ro.p20[hp]);
      if (v.cards[2].value !== pct || v.cards[2].value === '100%') record('K4', p, `${at}: Kill within 20 ${v.cards[2].value} vs ${pct}`);
      if (v.cards[2].sub !== `fastest possible: round ${fastest}`) record('K4', p, `${at}: "${v.cards[2].sub}" vs fastest ${fastest}`);
      // Displayed E[H] above the displayed simple number. Exactly, E[H] > simple always (Wald,
      // K6); in print the two can only meet when both round to the same whole number (>= 1,000),
      // where the note takes its "rounds to the same" branch. Those ties are counted and pinned.
      const eD = numOf(v.cards[0].value), sD = numOf(sm ? sm[1] : NaN);
      if (eD === sD && ehT[hp] >= 10000 && simT >= 10000) kc.wholeTies++;
      else if (!(eD > sD)) record('K4', p, `${at}: displayed E[H] ${v.cards[0].value} is not above simple ${sm && sm[1]}`);
    }
  }

  // K5: the D-05 reference values at the defaults, from the oracles (not the page's table).
  const D5 = VM.DEFAULT_STATE, dp = { ac: D5.ac, die: D5.die, atk: D5.atk, dmg: D5.dmg }, hp = D5.hp;
  const o = killWeightsOf(dp), ro = roundOracle(o, hp), { N, cp } = exactOracle(o), sv = VM.statsView(dp);
  const dec = (q, places) => { const s = String(q).padStart(places + 1, '0'); return `${s.slice(0, -places)}.${s.slice(-places)}`; };
  let hc = new Float64Array(hp + 1), medHits = 0, minHits = 0;   // hit-count DP: P(S_j >= hp)
  hc[0] = 1;
  for (let j = 1; j <= K_CAP && !medHits; j++) {
    const nx = new Float64Array(hp + 1);
    nx[hp] = hc[hp];
    for (let s = 0; s < hp; s++) {
      if (hc[s] === 0) continue;
      nx[s] += (hc[s] * o.w0) / o.den;
      for (let k = 0; k < o.ds.length; k++) nx[Math.min(hp, s + o.ds[k])] += (hc[s] * o.ks[k]) / o.den;
    }
    hc = nx;
    if (!minHits && hc[hp] > 0) minHits = j;
    if (hc[hp] >= 0.5) medHits = j;
  }
  const { e20Num, e20Den } = sv.exact;
  const pins = [
    ['average hit', dec(rhuB(BigInt(o.A), BigInt(o.den), 1000n), 3), '4.909'],
    ['simple hits', dec(rhuB(BigInt(hp * o.den), BigInt(o.A), 1000n), 3), '8.148'],
    ['exact expected hits', dec(rhuB(N[hp], cp[hp], 1000n), 3), '8.700'],
    ['median hits', medHits, 9],
    ['minimum hits', minHits, 3],
    ['per attack', dec(rhuB(BigInt(e20Num), BigInt(20 * e20Den), 100n), 2), '2.70'],
    ['simple rounds', dec(rhuB(BigInt(20 * hp * e20Den), BigInt(e20Num), 100n), 2), '14.81'],
    ['exact expected rounds', dec(rhuB(20n * N[hp], BigInt(o.hf) * cp[hp], 1000n), 3), '15.818'],
    ['median round', ro.med[hp], 15],
    ['minimum round', ro.trace.findIndex((x) => x > 0) + 1, 3],
    ['P20', ro.p20[hp].toFixed(4), '0.8466'],
    ['P10', ro.p10[hp].toFixed(4), '0.1114'],
  ];
  for (const [what, got, want] of pins) {
    kc.pins++;
    if (got !== want) record('K5', dp, `HP ${hp} ${what}: ${got} vs ${want}`);
  }

  // Pinned counts (first passing run, 05-02; the SUMMARY compares them with the research
  // counts). The float-only counts depend on the engine's float operation order at exact .x5
  // ties, so a float refactor that moves them must be re-proven here, not re-pinned blindly.
  const K_WANT = [
    ['K1', 'past the cap', kc.pastCap, 40163],
    ['K2', 'E[H] float-window fallbacks', kc.fbH, 1523],
    ['K2', 'E[R] float-window fallbacks', kc.fbR, 4897],
    ['K2', 'E[H] float-only tenths mismatches', kc.mmH, 559],
    ['K2', 'E[R] float-only tenths mismatches', kc.mmR, 1195],
    ['K3', 'near-ties', kc.nearTies, 1424],
    ['K3', 'near-ties below 1/2 in the float', kc.nearTiesBelow, 878],
    ['K3', 'largest near-tie round', kc.tieMaxT, 5],
    ['K4', 'every hit kills', kc.everyHitKills, 22055],
    ['K4', 'simple under 0.1', kc.under01, 539],
    ['K4', '0% (fastest past round 20)', kc.zeroPct, 229900],
    ['K4', 'p20 truncated to 0 where a kill is possible', kc.p20Trunc, 190],
    ['K4', 'whole-number display ties', kc.wholeTies, 6],
  ];
  for (const [k, what, got, want] of K_WANT) if (got !== want) record(k, kx('counts'), `${what}: ${got}, pinned ${want}`);
}
const kMs = (performance.now() - tk).toFixed(0);

const extra = {
  s: ` (rule ${branchCounts.roundRule}, table ${branchCounts.roundTable})`,
  t: ` (rule/rule ${branchCounts.ruleRule}, reason ${branchCounts.reason}, table/table ${branchCounts.tableTable}, ` +
    `mixed ${branchCounts.mixed}, other ${branchCounts.other})`,
  z: ` (normal thresholds seen ${thresholdsSeen.size ? Math.min(...thresholdsSeen) + '..' + Math.max(...thresholdsSeen) : 'none'}, ${thresholdsSeen.size} values)`,
  u: ` (straightFrom 0..4: ${explainCounts.straight.join(' / ')}, above 4: ${explainCounts.straightOver})`,
  v: ` (nodmg ${explainCounts.nodmg}, rule ${explainCounts.rule}, floor bites ${explainCounts.floorBites}; capped from ` +
    `+0 ${explainCounts.capAll} + ${explainCounts.capAllNodmg} nodmg, floor band first ${explainCounts.floorFirst})`,
  w: ` (none-damage ${explainCounts.noneDamage}, none-attack ${explainCounts.noneAttack}, one adjacent ` +
    `${explainCounts.oneAdjacent}, one across a tie ${explainCounts.oneTie}, end tie only ${explainCounts.endTieOnly}, ` +
    `touch ${explainCounts.touch}, two+ ${explainCounts.multi}, identical ${explainCounts.identical}; levers ` +
    ['damage', 'attack'].map((f) => `${f}-first ${Object.entries(leverCounts[f]).map(([k, v]) => `${k} ${v}`).join(' / ')}`).join(', ') + ')',
  x: ` (${presetFacts.join(', ') || 'no presets'})`,
  K1: ` (${kKeys.size} keys, ${kc.pairs} pairs; past the cap ${kc.pastCap}; E[R] worst relative gap ${kc.erRelMax.toExponential(1)})`,
  K2: ` (float-window fallbacks ${kc.fbPairs} pairs / ${kc.fbCalls} calls, E[H] ${kc.fbH} + E[R] ${kc.fbR}; ` +
    `float-only tenths mismatches E[H] ${kc.mmH}, E[R] ${kc.mmR}; at the displayed scale ${kc.mmHd} / ${kc.mmRd})`,
  K3: ` (near-ties ${kc.nearTies}, ${kc.nearTiesBelow} of them below 1/2 in the float, all exact, max t ${kc.tieMaxT}; ` +
    `smallest non-tie gap ${kc.gapMin.toExponential(2)})`,
  K4: ` (every hit kills ${kc.everyHitKills}, simple under 0.1 ${kc.under01}, 0% ${kc.zeroPct}, ` +
    `p20 truncated to 0 where a kill is possible ${kc.p20Trunc}, whole-number display ties ${kc.wholeTies})`,
  K5: ` (${kc.pins} pins)`,
};

// (cover) 02-REVIEW WR-03: the sample must reach every value of every control.
const coverWant = { ac: span(CS.ac), die: DICE_SET.length, atk: span(CS.atk), dmg: span(CS.dmg) };
for (const k of Object.keys(coverWant)) {
  if (sampled[k].size !== coverWant[k]) {
    counts.cover++;
    firstFailures.push(`cover: sample reached ${sampled[k].size} of ${coverWant[k]} ${k} values`);
  }
}
// (zero) 02-REVIEW IN-04
for (const k of Object.keys(zeroCounts)) {
  if (zeroCounts[k] !== 0) {
    counts.zero++;
    firstFailures.push(`zero: ${zeroCounts[k]} settings with ${k}`);
  }
}

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
for (const k of Object.keys(names)) {
  console.log(`${counts[k] === 0 ? 'ok  ' : 'FAIL'} ${names[k]}: ${counts[k]} failures${extra[k] || ''}`);
}
const n = SelfTest.results.length;
console.log(`selftest ${SelfTest.passed}/${n}`);
for (const r of SelfTest.results.filter((x) => !x.ok)) {
  console.log(`  selftest FAIL ${r.name}: got ${JSON.stringify(r.actual)}, expected ${JSON.stringify(r.expected)}`);
}
console.log(`sweep ${combos} combos in ${sweepMs} ms`);
console.log(`sample (stride ${SAMPLE}): ${sampled.ac.size} AC, ${sampled.die.size} dice, ` +
  `${sampled.atk.size} atk, ${sampled.dmg.size} dmg`);
const f4 = (x) => (Number.isFinite(x) ? x.toFixed(4) : 'n/a');
console.log(`(p) ${distMemo.size} distributions: "2 in 3" coverage min ${f4(cov.minTwoInThree)} ` +
  `max ${f4(cov.maxTwoInThree)} (bounds [0.60, 0.80)); "Most runs" min ${f4(cov.minMost)} (bound >= 0.80)`);
console.log(`sim samples (${R} rounds each, ${qMs} ms): ${qMeans.join('; ')}`);
console.log(`crossings: damage-all ${dist.damageAll}, hit-all ${dist.hitAll}, hit-then-damage ${dist.hitThenDamage}, ` +
  `damage-then-hit ${dist.damageThenHit}, tie crossings ${dist.tieCross}, end ties ${dist.endTie}; ` +
  `touches ${zeroCounts.touch}, leading ties ${zeroCounts.leadingTie}, 2+ crossings ${zeroCounts.multiCross}`);
if (Number(SelfTest.ms) > 200) console.log(`WARNING: Node self-test took ${SelfTest.ms} ms (budget 200)`);
else console.log(`selftest time ${SelfTest.ms} ms (budget 200)`);
// RESEARCH Pitfall 3: 8 ms in Node is about 16 ms (one frame) in Chrome. A warning, never a failure.
const kWorst = `killTable worst ${kWorstMs.toFixed(1)} ms over ${kKeys.size} keys (${kWorstKey}, best of 2 builds); kill section ${kMs} ms`;
console.log(kWorstMs > 8 ? `WARNING: ${kWorst} (budget 8 ms in Node)` : kWorst);

const invariantFailures = Object.values(counts).reduce((a, b) => a + b, 0);
if (SelfTest.failed === 0 && n > 0 && invariantFailures === 0 && combos === TOTAL_COMBOS) {
  console.log(`CHECK-ENGINE PASS: selftest ${SelfTest.passed}/${n}, sweep ${TOTAL_COMBOS} combos`);
  process.exit(0);
}
console.log(`CHECK-ENGINE FAIL: selftest ${SelfTest.passed}/${n}, ${invariantFailures} invariant failures, ${combos}/${TOTAL_COMBOS} combos`);
for (const f of firstFailures) console.log(`  ${f}`);
process.exit(1);
