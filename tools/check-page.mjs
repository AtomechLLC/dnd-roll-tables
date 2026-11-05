// Dev-only headless browser check. Never required to build or deploy the site.
//
//   node tools/check-page.mjs [url] [--plain] [--expect TEXT]... [--width PX] [--dump FILE]
//   node tools/check-page.mjs --fault render|later [--width PX] [--dump FILE]
//
// Loads the page in headless Chrome (or Edge) with a throwaway profile, captures
// the final DOM (--dump-dom) and the console (--enable-logging), then checks:
//   (1) the console contains SELFTEST PASSED
//   (2) the console has no Uncaught / SELFTEST FAIL / CSP / parse / load errors
//   (3) the DOM has exactly 60 row headers (th with scope="row") outside .chart-data at load:
//       3 tables x 20 rows, plus exactly 21 inside .chart-data (the chart data table, one row
//       per N). The sim log adds 21 only after a roll (the ?test smoke resets its run at the end).
//       Counted by walking the tree, so markup order inside a tag does not matter
//   (4) test mode: the visible self-test panel passed; plain mode: the panel is hidden
//   (5) every --expect string appears in the VISIBLE page text (03-REVIEW WR-03). The dump is
//       parsed into a mini element tree; subtrees with a `hidden` attribute, class `vh`,
//       noscript, template and title (svg <title> tooltips) are dropped, and so is the
//       self-test panel (its check names could echo UI strings, 01-REVIEW IN-06). Block
//       elements are padded with spaces, so text never joins across cells or paragraphs
//       ("RndRound" cannot match). Entities are decoded, and U+00A0 and whitespace runs are
//       normalized to one space on both sides. aria-hidden="true" text is KEPT: it is shown
//       on screen (the log's "Rnd"), and the reviewer's suggestion to drop it would contradict
//       "visible". Inline elements join, so a sentence whose numbers sit in <b class="num">
//       still matches.
//   (6) the engine-error banner is still hidden after init
//   (7) both Roll buttons, exactly six .btn-preset buttons (three of them the #try-row's .btn-try),
//       exactly four .btn-nudge steppers, exactly two .btn-step buttons (the Enemy HP hit steps)
//       and #reset are enabled after init (they ship disabled; init enables them together as its
//       last step)
//   (8) the sim section body is shown after init (it ships hidden)
//   (6)-(8) guard 02-REVIEW WR-01: a caught first-render throw logs console.error('render
//   failed'), which the console check does not match, so these are its only guard.
//   Budget gate (03-REVIEW IN-01): the Chrome console's `SELFTEST PASSED: n/n (X ms)` must
//   report X <= 200.
//   Accessibility guards (DEPLOY-04, D-10), on the mini tree minus section#selftest, in both
//   ?test and --plain mode; each prints `CHECK-PAGE FAIL: a11y …` when it fails:
//   (9)  every input / select / textarea / button has an accessible name (aria-labelledby,
//        aria-label, label[for], wrapping label, or button text); radios also need a
//        fieldset legend with text
//   (10) that name is shown on screen: label text is not only inside .vh / [hidden] /
//        aria-hidden, and an aria-label contains its group's visible .group-label (without
//        the .hint), so #ac-num must say "Target AC"
//   (11) no tabindex > 0; no control with a negative tabindex, `disabled`, or a [hidden]
//        ancestor; and the focusable order (same-name radios collapsed, presets by
//        data-preset, links by href, summaries by id) is exactly https://funsmith.club (the header
//        community link), ac-range, ac-num, die, atk-num, dmg-num, n-range, reset, #controls (the
//        verdict's Change link), cross, dmg, cap (the #try-row), roll-table, fold-marginal,
//        fold-formulas, chart-data-summary, hp-num, hp-minus, hp-plus, roll, cross, dmg, cap,
//        #chart, #controls. The two hit step buttons and #reset go inert with aria-disabled only,
//        never `disabled`, so they stay in this order. A dump cannot see display:none, so three
//        things are skipped here and checked on the live page by the ?test smoke: .btn-nudge and
//        the cmp-show radios (shown only at some widths) and #fold-log (inside the .sim-log-wrap
//        that stays [hidden] until the first roll)
//   (12) miss is not color-only: every td.m in the three table.outcome shows 0, every
//        auto-miss row has only td.m data cells, the `.m` style rule has the
//        repeating-linear-gradient hatch, and the legend's .swatch.m shows 0. The Baseline table
//        is gone: #cmp-base and #cmp-base-stats do not exist (quick 261105-emn)
//   (13) the `.series-dmg` style rule has stroke-dasharray and `.series-hit` has none
//   (12) and (13) read the raw <style> text from the dump. A dump cannot prove real focus or
//   rendering; the page's ?test smoke ('a11y ui:') covers that in the live DOM.
//   (14) page order, in every mode including --fault render: main's direct children, ignoring
//        section#selftest, div#engine-error and noscript, run header, div#bar, p#try-row,
//        section#tables, section#chart, section#compare, section#kill, section#sim, section#explore
//        (user request 260927-17o: settings and outcome table at the top; quick 261104-vx6: the
//        bar and the kill section; quick 261105-emn: the lesson first). #bar's element children are
//        form#controls, p#verdict, p#verdict-why. #tables' are h2, p#two-rolls, div#legend,
//        div.table-col, section#stats. .table-col's are p.table-roll, div.table-wrap, p#crit-note.
//        #stats ends with #marginal, then #formulas.
//   (15) community link, in every mode including --fault render: main's header holds exactly
//        one a[href="https://funsmith.club"] that shows and is named "Funsmith Club", with one
//        aria-hidden, focusable="false", fill="currentColor" svg (the Discord mark, no <title>)
//        and no target (user request 2026-11-03, PRODUCT.md Brand Commitments: community link).
//   (16) verdict line, in every non-fault mode (quick 261104-vx6): #bar exists, #verdict and
//        #verdict-why have no [hidden], and when the settings are the defaults (test mode, or no
//        setting in the url) the lead and why are the sentence for AC 15, d8, +5, +0; otherwise
//        the lead is non-empty.
//
// --fault render (02-REVIEW WR-01, 03-REVIEW WR-04): copies index.html to a temp dir, makes
// render() throw, and appends a script that dispatches an `input` event on #ac-range after
// init. It loads that copy in plain mode and, instead of (3), (4), (6)-(8) and the expects,
// checks the guarded init: SELFTEST PASSED, 'render failed' logged, no 'Uncaught', the banner
// shown, #roll, every .btn-preset, both .btn-step buttons and #reset disabled, #verdict hidden,
// and every painted section hidden (section#kill must exist).
// --fault later (04-REVIEW WR-03): the same, but render() throws only from its second call on,
// so init's first render succeeds and wires everything; the appended script then moves
// #ac-range to 20 and dispatches `input`, and the scheduled render is the one that throws.
// Same checks as --fault render: the scheduled render must take the same failure path.
//
// Default url: file:// URL of ../index.html plus ?test (--plain drops ?test).
// Test mode is on exactly when the url's query has a `test` parameter, the same rule as
// the page's URLSearchParams(location.search).has('test') (02-REVIEW IN-02).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(here, '..', 'index.html');

// ---- args --------------------------------------------------------------------
const args = process.argv.slice(2);
let url = null, plain = false, width = 1366, dump = null, fault = null;
const expects = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--plain') plain = true;
  else if (a === '--expect') expects.push(args[++i] ?? '');
  else if (a === '--width') width = Number(args[++i]) || 1366;
  else if (a === '--dump') dump = args[++i];
  else if (a === '--fault') fault = args[++i] ?? '';
  else if (a.startsWith('--')) { console.log(`CHECK-PAGE FAIL: unknown option ${a}`); process.exit(1); }
  else url = a;
}
if (fault !== null && fault !== 'render' && fault !== 'later') {
  console.log(`CHECK-PAGE FAIL: unknown fault ${JSON.stringify(fault)} (only "render" or "later")`);
  process.exit(1);
}

if (!fs.existsSync(indexPath) && (url === null || fault !== null)) {
  console.log('CHECK-PAGE FAIL: index.html not found');
  process.exit(1);
}

// Fault mode: a temp copy whose render() throws, plus a synthetic input after init.
let faultDir = null;
if (fault !== null) {
  const src = fs.readFileSync(indexPath, 'utf8');
  const anchor = 'function render() {';
  const at = src.indexOf(anchor);
  const end = src.lastIndexOf('</body>');
  if (at < 0 || end < 0) {
    console.log('CHECK-PAGE FAIL: fault injection anchors not found (function render() { / </body>)');
    process.exit(1);
  }
  // 'later' moves the slider first, so the input is a real change and schedules a render.
  const poke = '<script>setTimeout(() => { const el = document.getElementById(\'ac-range\');' +
    (fault === 'later' ? ' el.value = \'20\';' : '') +
    ' el.dispatchEvent(new Event(\'input\', { bubbles: true })); }, 0);</script>\n';
  const thrower = fault === 'later'
    ? " if (++faultRenders >= 2) throw new Error('injected later render fault');"
    : " throw new Error('injected render fault');";
  let out = src.slice(0, at) + (fault === 'later' ? 'let faultRenders = 0;\n' : '') + anchor + thrower +
    src.slice(at + anchor.length);
  const end2 = out.lastIndexOf('</body>');
  out = out.slice(0, end2) + poke + out.slice(end2);
  faultDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crs-fault-'));
  const faultFile = path.join(faultDir, 'index.html');
  fs.writeFileSync(faultFile, out, 'utf8');
  url = pathToFileURL(faultFile).href;
  plain = true;
}
const cleanFault = () => {
  if (faultDir === null) return;
  try {
    fs.rmSync(faultDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch { /* best effort */ }
};

if (url === null) url = pathToFileURL(indexPath).href + (plain ? '' : '?test');
const u = new URL(url);
if (plain) u.searchParams.delete('test');
url = u.href;
const testMode = u.searchParams.has('test');

// ---- browser -----------------------------------------------------------------
const candidates = [
  process.env.CHROME,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);
const browser = candidates.find((p) => fs.existsSync(p));
if (!browser) {
  console.log('CHECK-PAGE FAIL: no Chrome or Edge found (set CHROME to the browser path)');
  cleanFault();
  process.exit(1);
}

const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'crs-chrome-'));
const baseArgs = [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--user-data-dir=${prof}`, `--window-size=${width},900`,
];
const tailArgs = ['--virtual-time-budget=3000', '--dump-dom', url];
const spawnOpts = { encoding: 'utf8', timeout: 90000, maxBuffer: 32 * 1024 * 1024 };

let dom = '', consoleText = '';
try {
  let run = spawnSync(browser, [...baseArgs, '--enable-logging=stderr', '--v=0', ...tailArgs], spawnOpts);
  if (run.error) throw run.error;
  dom = run.stdout || '';
  consoleText = run.stderr || '';
  if (!/CONSOLE/.test(consoleText)) {
    // Some builds only log to a file; retry once that way.
    const logFile = path.join(prof, 'chrome.log');
    run = spawnSync(browser, [...baseArgs, '--enable-logging', `--log-file=${logFile}`, ...tailArgs], spawnOpts);
    if (run.error) throw run.error;
    dom = run.stdout || dom;
    consoleText = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '';
  }
} catch (err) {
  console.log(`CHECK-PAGE FAIL: could not run browser: ${err && err.message}`);
  fs.rmSync(prof, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  cleanFault();
  process.exit(1);
}
try {
  fs.rmSync(prof, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
} catch { /* best effort: a lingering browser process may still hold a file */ }
cleanFault();

if (dump) fs.writeFileSync(dump, dom, 'utf8');

// ---- mini element tree and visible text (03-REVIEW WR-03) ----------------------
// Judge rendered markup only: script and style source text also contains strings
// like '<th scope="row"', 'Self-test FAILED' and 'crit*', which would fake a match.
// The raw `dom` string stays available for reading the <style> text.
const rendered = dom
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
// Entities Chrome's serializer emits, plus &#39;. &amp; last so an encoded "&lt;" is not
// decoded twice.
const decode = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&nbsp;/g, '\u00a0').replace(/&amp;/g, '&');

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const BLOCK = new Set(['p', 'div', 'li', 'ul', 'ol', 'dl', 'dt', 'dd', 'table', 'tr', 'td', 'th', 'caption', 'section',
  'header', 'footer', 'main', 'form', 'fieldset', 'legend', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'button',
  'output', 'summary', 'details', 'text', 'thead', 'tbody', 'tfoot', 'figure', 'figcaption', 'nav', 'article', 'aside']);
// Tokens: a comment, a doctype / processing instruction (skipped), a start or end tag
// (group 1 '/', 2 name, 3 attributes, 4 self-closing '/'), or a text run (group 5).
function parseTree(markup) {
  const root = { tag: '#root', attrs: {}, children: [], parent: null };
  let cur = root;
  const re = /<!--[\s\S]*?-->|<[!?][^>]*>|<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s=>\/]+(?:="[^"]*")?)*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(markup))) {
    if (m[5] !== undefined) { cur.children.push({ text: m[5], parent: cur }); continue; }
    if (!m[2]) continue;                                            // comment or doctype
    const tag = m[2].toLowerCase();
    if (m[1]) {                                                     // close: pop to the matching open
      let n = cur;
      while (n && n.tag !== tag) n = n.parent;
      if (n && n.parent) cur = n.parent;
      continue;
    }
    const attrs = {};
    for (const a of (m[3] || '').matchAll(/([^\s=]+)(?:="([^"]*)")?/g)) attrs[a[1].toLowerCase()] = decode(a[2] ?? '');
    const el = { tag, attrs, children: [], parent: cur };
    cur.children.push(el);
    if (!VOID.has(tag) && !m[4]) cur = el;
  }
  return root;
}
const classes = (el) => (el.attrs.class || '').split(/\s+/);
const hiddenSelf = (el) => 'hidden' in el.attrs || classes(el).includes('vh') ||
  el.tag === 'noscript' || el.tag === 'template' || el.tag === 'title';
function visibleText(el) {
  if (el.text !== undefined) return decode(el.text);
  if (el.tag !== '#root' && hiddenSelf(el)) return '';
  const inner = el.children.map(visibleText).join('');
  return BLOCK.has(el.tag) ? ` ${inner} ` : inner;
}
const norm = (s) => s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
function* walk(el) {
  for (const c of el.children || []) {
    if (c.text !== undefined) continue;
    yield c;
    yield* walk(c);
  }
}
const byId = (tree, id) => {
  for (const el of walk(tree)) if (el.attrs.id === id) return el;
  return null;
};
function detach(el) {
  if (el && el.parent) el.parent.children = el.parent.children.filter((c) => c !== el);
}

const tree = parseTree(rendered);
// Row headers by walking the tree: those inside .chart-data (21, one per N) and all the others.
function rowHeaderCounts(root) {
  const counts = { outside: 0, chartData: 0 };
  for (const el of walk(root)) {
    if (el.tag !== 'th' || el.attrs.scope !== 'row') continue;
    let inChartData = false;
    for (let n = el.parent; n; n = n.parent) if (n.attrs && (n.attrs.class || '').split(/\s+/).includes('chart-data')) inChartData = true;
    if (inChartData) counts.chartData++; else counts.outside++;
  }
  return counts;
}
// The --expect haystack: the page minus the self-test panel.
const pageTree = parseTree(rendered);
const selftestEl = byId(pageTree, 'selftest');
if (selftestEl && selftestEl.tag === 'section') detach(selftestEl);
const pageText = norm(visibleText(pageTree));

// ---- accessibility guards (9)-(13), DEPLOY-04 / D-10 ----------------------------
// They walk pageTree (rendered markup minus section#selftest). (12) and (13) read the raw
// <style> text from `dom`, because `rendered` has the style blocks stripped.
function* ancestors(el) {
  for (let n = el.parent; n; n = n.parent) yield n;
}
const closest = (el, pred) => {
  for (let n = el; n && n.tag !== '#root'; n = n.parent) if (n.text === undefined && pred(n)) return n;
  return null;
};
const hasClass = (el, c) => classes(el).includes(c);
const ariaHidden = (el) => el.attrs['aria-hidden'] === 'true';
// Text with some subtrees dropped. `drop` runs on every element below the start node.
function textExcept(el, drop) {
  if (el.text !== undefined) return decode(el.text);
  if (el.tag !== '#root' && drop(el)) return '';
  const inner = el.children.map((c) => textExcept(c, drop)).join('');
  return BLOCK.has(el.tag) ? ` ${inner} ` : inner;
}
// Name text (what a screen reader gets): .vh counts, [hidden] and aria-hidden do not.
const nameText = (el) => norm(textExcept(el, (e) =>
  'hidden' in e.attrs || ariaHidden(e) || e.tag === 'noscript' || e.tag === 'template' || e.tag === 'title'));
// Shown text (what a sighted user reads): also drops .vh.
const shownText = (el) => norm(textExcept(el, (e) => hiddenSelf(e) || ariaHidden(e)));
// A group label without its .hint ("Target AC 10 to 30" -> "Target AC").
const groupLabelText = (el) => norm(textExcept(el, (e) => hiddenSelf(e) || ariaHidden(e) || hasClass(e, 'hint')));
const inHiddenTree = (el) => [el, ...ancestors(el)].some((n) => n.tag !== '#root' && n.text === undefined &&
  (hiddenSelf(n) || ariaHidden(n)));
const pageEls = [...walk(pageTree)];
const idIndex = new Map();
for (const el of pageEls) if (el.attrs.id && !idIndex.has(el.attrs.id)) idIndex.set(el.attrs.id, el);
const isControl = (el) => (el.tag === 'input' && el.attrs.type !== 'hidden') ||
  el.tag === 'select' || el.tag === 'textarea' || el.tag === 'button';
const isFocusable = (el) => isControl(el) || (el.tag === 'a' && 'href' in el.attrs) || el.tag === 'summary' ||
  ('tabindex' in el.attrs && Number(el.attrs.tabindex) >= 0);
const ctlName = (el) => el.attrs.id ? `#${el.attrs.id}` : el.attrs.name ? `${el.tag}[name=${el.attrs.name}]` :
  el.attrs['data-preset'] ? `${el.tag}[data-preset=${el.attrs['data-preset']}]` : el.tag;

// The accessible name source, in ARIA precedence: aria-labelledby, aria-label, <label>
// (for= or wrapping), then a button's own content.
function nameSource(el) {
  const lb = (el.attrs['aria-labelledby'] || '').trim();
  if (lb) {
    const refs = lb.split(/\s+/).map((id) => idIndex.get(id)).filter(Boolean);
    return { kind: 'aria-labelledby', els: refs, text: norm(refs.map(nameText).join(' ')) };
  }
  const al = (el.attrs['aria-label'] || '').trim();
  if (al) return { kind: 'aria-label', els: [], text: norm(al) };
  const labels = [];
  if (el.attrs.id) for (const l of pageEls) if (l.tag === 'label' && l.attrs.for === el.attrs.id) labels.push(l);
  const wrap = el.parent ? closest(el.parent, (n) => n.tag === 'label') : null;
  if (wrap && !labels.includes(wrap)) labels.push(wrap);
  if (labels.length) return { kind: 'label', els: labels, text: norm(labels.map(nameText).join(' ')) };
  if (el.tag === 'button') return { kind: 'content', els: [el], text: nameText(el) };
  return { kind: 'none', els: [], text: '' };
}

function a11yGuards() {
  const controls = pageEls.filter(isControl);

  // (9) every control has an accessible name; radios also need a fieldset legend with text.
  const unnamed = [];
  for (const el of controls) {
    const src = nameSource(el);
    if (!src.text) unnamed.push(`${ctlName(el)} (no name)`);
    if (el.tag === 'input' && el.attrs.type === 'radio') {
      const fs = closest(el, (n) => n.tag === 'fieldset');
      const legend = fs ? fs.children.find((c) => c.tag === 'legend') : null;
      if (!legend || !nameText(legend)) unnamed.push(`${ctlName(el)} (no fieldset legend)`);
    }
  }
  check(`a11y (9) every control has an accessible name (${controls.length} controls)`,
    controls.length > 0 && unnamed.length === 0, unnamed.slice(0, 8).join('; '));

  // (10) the label a control uses is shown on screen, and an aria-label contains the visible
  // group label (label in name, WCAG 2.5.3).
  const unseen = [];
  for (const el of controls) {
    const src = nameSource(el);
    if (src.kind === 'aria-label') {
      const group = closest(el, (n) => hasClass(n, 'group'));
      const gl = group ? [...walk(group)].find((n) => hasClass(n, 'group-label')) : null;
      const vis = gl && !inHiddenTree(gl) ? groupLabelText(gl) : (el.tag === 'button' ? shownText(el) : '');
      if (!vis) unseen.push(`${ctlName(el)}: aria-label with no visible label beside it`);
      else if (!src.text.toLowerCase().includes(vis.toLowerCase())) {
        unseen.push(`${ctlName(el)}: aria-label ${JSON.stringify(src.text)} lacks the visible label ${JSON.stringify(vis)}`);
      }
    } else if (src.kind === 'none') {
      unseen.push(`${ctlName(el)}: no label`);
    } else {
      const shown = src.els.filter((n) => !inHiddenTree(n)).map(shownText).join(' ').trim();
      if (!shown) unseen.push(`${ctlName(el)}: ${src.kind} text is only in .vh / [hidden] / aria-hidden`);
    }
    if (el.tag === 'input' && el.attrs.type === 'radio') {
      const fs = closest(el, (n) => n.tag === 'fieldset');
      const legend = fs ? fs.children.find((c) => c.tag === 'legend') : null;
      if (!legend || inHiddenTree(legend) || !shownText(legend)) unseen.push(`${ctlName(el)}: legend not shown`);
    }
  }
  check('a11y (10) labels are visible', unseen.length === 0, unseen.slice(0, 8).join('; '));

  // (11) keyboard reach: no positive tabindex, no control removed from the tab order,
  // disabled or inside a [hidden] ancestor, and the focus order equals the reading order.
  const problems = [];
  for (const el of pageEls) {
    if ('tabindex' in el.attrs && Number(el.attrs.tabindex) > 0) problems.push(`${ctlName(el)} tabindex=${el.attrs.tabindex}`);
  }
  // Skipped by class, name and id; the smoke checks these on the live page (see the header).
  const liveOnly = (el) => hasClass(el, 'btn-nudge') || (el.tag === 'input' && el.attrs.name === 'cmp-show') ||
    el.attrs.id === 'fold-log';
  const focusables = pageEls.filter((el) => isFocusable(el) && !liveOnly(el));
  for (const el of focusables) {
    if (el.attrs.tabindex !== undefined && Number(el.attrs.tabindex) < 0) problems.push(`${ctlName(el)} tabindex=${el.attrs.tabindex}`);
    if ('disabled' in el.attrs) problems.push(`${ctlName(el)} disabled`);
    if ([el, ...ancestors(el)].some((n) => n.attrs && 'hidden' in n.attrs)) problems.push(`${ctlName(el)} inside [hidden]`);
  }
  const order = [];
  for (const el of focusables) {
    let key;
    if (el.tag === 'input' && el.attrs.type === 'radio') key = el.attrs.name || ctlName(el);
    else if (el.tag === 'button' && el.attrs['data-preset']) key = el.attrs['data-preset'];
    else if (el.tag === 'a') key = el.attrs.href;
    else key = el.attrs.id || ctlName(el);
    if (el.tag === 'input' && el.attrs.type === 'radio' && order.includes(key)) continue;   // one stop per group
    order.push(key);
  }
  const want = ['https://funsmith.club', 'ac-range', 'ac-num', 'die', 'atk-num', 'dmg-num', 'n-range', 'reset', '#controls',
    'cross', 'dmg', 'cap', 'roll-table', 'fold-marginal', 'fold-formulas', 'chart-data-summary', 'hp-num', 'hp-minus',
    'hp-plus', 'roll', 'cross', 'dmg', 'cap', '#chart', '#controls'];
  if (order.join(' ') !== want.join(' ')) problems.push(`order ${order.join(', ')} (want ${want.join(', ')})`);
  check('a11y (11) tab order reaches every control', problems.length === 0, problems.slice(0, 8).join('; '));

  // (12) miss is not color-only: text 0 in every miss cell, the hatch rule, the legend key,
  // and auto-miss rows hold only miss cells.
  const miss = [];
  const tables = pageEls.filter((el) => el.tag === 'table' && hasClass(el, 'outcome'));
  let missCells = 0, autoRows = 0;
  for (const t of tables) {
    for (const el of walk(t)) {
      if (el.tag === 'td' && hasClass(el, 'm')) {
        missCells++;
        if (shownText(el) !== '0') miss.push(`#${t.attrs.id} td.m shows ${JSON.stringify(shownText(el))}`);
      }
      if (el.tag === 'tr') {
        const note = el.children.find((c) => c.tag === 'td' && hasClass(c, 'note'));
        if (!note || shownText(note) !== 'auto-miss') continue;
        autoRows++;
        const data = el.children.filter((c) => c.tag === 'td' && !hasClass(c, 'note'));
        if (data.length === 0 || !data.every((c) => hasClass(c, 'm'))) miss.push(`#${t.attrs.id} auto-miss row has a non-miss cell`);
      }
    }
  }
  if (tables.length !== 3) miss.push(`${tables.length} table.outcome (want 3)`);
  for (const id of ['cmp-base', 'cmp-base-stats']) if (idIndex.has(id)) miss.push(`#${id} still exists`);
  if (missCells === 0) miss.push('no td.m cells found');
  if (autoRows < tables.length) miss.push(`${autoRows} auto-miss rows for ${tables.length} tables`);
  if (!rulesFor('.m').some((r) => r.body.includes('repeating-linear-gradient'))) miss.push('the .m rule has no repeating-linear-gradient hatch');
  const legendEl = idIndex.get('legend');
  const key = legendEl ? [...walk(legendEl)].find((el) => hasClass(el, 'swatch') && hasClass(el, 'm')) : null;
  if (!key) miss.push('legend has no .swatch.m');
  else if (shownText(key) !== '0') miss.push(`legend .swatch.m shows ${JSON.stringify(shownText(key))}`);
  check(`a11y (12) miss is not color-only (${missCells} miss cells, ${autoRows} auto-miss rows)`,
    miss.length === 0, miss.slice(0, 8).join('; '));

  // (13) the two chart series differ by more than color: the damage line is dashed, the
  // to-hit line is not.
  const series = [];
  if (!rulesFor('.series-dmg').some((r) => r.body.includes('stroke-dasharray'))) series.push('.series-dmg has no stroke-dasharray');
  if (rulesFor('.series-hit').some((r) => r.body.includes('stroke-dasharray'))) series.push('.series-hit is dashed too');
  check('a11y (13) series are not color-only', series.length === 0, series.join('; '));
}

// CSS rules from the raw <style> text: innermost { } blocks, so rules inside @media and
// @container are found too. Selector lists are split on commas.
const styleText = [...dom.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '');
const cssRules = [...styleText.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map((m) => ({ sels: m[1].split(',').map((s) => s.trim().replace(/\s+/g, ' ')), body: m[2] }));
const rulesFor = (sel) => cssRules.filter((r) => r.sels.includes(sel));

// ---- checks ------------------------------------------------------------------
const consoleLines = consoleText.split(/\r?\n/).filter((l) => /CONSOLE/.test(l));
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });

check('console has SELFTEST PASSED', consoleText.includes('SELFTEST PASSED'));

const bad = /Uncaught|SELFTEST FAIL|Content Security Policy|cannot be parsed|Failed to load resource/;
const badLines = consoleText.split(/\r?\n/).filter((l) => bad.test(l));
check('console has no errors', badLines.length === 0, badLines.slice(0, 5).join('\n      '));

// 03-REVIEW IN-01: the in-page self-test's 200 ms budget, measured in Chrome.
const budget = consoleText.match(/SELFTEST PASSED: (\d+)\/(\d+) \(([\d.]+) ms\)/);
check('self-test within 200 ms (Chrome)', budget !== null && Number(budget[3]) <= 200,
  budget ? `${budget[3]} ms` : 'no SELFTEST PASSED timing line');

if (fault !== null) {
  if (fault === 'later') {
    // The first render painted all three tables before the scheduled one threw.
    const rowHeads = rowHeaderCounts(tree);
    check('fault later: the first render painted (60 row headers, 21 in the chart data)',
      rowHeads.outside === 60 && rowHeads.chartData === 21, `found ${rowHeads.outside} + ${rowHeads.chartData}`);
  }
  check('fault: console has "render failed"', consoleText.includes('render failed'));
  check('fault: console has no "Uncaught"', !consoleText.includes('Uncaught'),
    consoleText.split(/\r?\n/).filter((l) => l.includes('Uncaught')).slice(0, 3).join('\n      '));
  const banner = byId(tree, 'engine-error');
  check('fault: engine-error banner shown', banner !== null && !('hidden' in banner.attrs));
  const roll = byId(tree, 'roll');
  check('fault: #roll disabled', roll !== null && 'disabled' in roll.attrs);
  const presets = [...walk(tree)].filter((el) => el.tag === 'button' && classes(el).includes('btn-preset'));
  check(`fault: every .btn-preset disabled (${presets.length})`, presets.length === 6 && presets.every((b) => 'disabled' in b.attrs));
  const rollTable = byId(tree, 'roll-table');
  check('fault: #roll-table disabled', rollTable !== null && 'disabled' in rollTable.attrs);
  const tries = presets.filter((b) => classes(b).includes('btn-try'));
  check(`fault: every .btn-try disabled (${tries.length})`, tries.length === 3 && tries.every((b) => 'disabled' in b.attrs));
  const nudges = [...walk(tree)].filter((el) => el.tag === 'button' && classes(el).includes('btn-nudge'));
  check(`fault: every .btn-nudge disabled (${nudges.length})`, nudges.length === 4 && nudges.every((b) => 'disabled' in b.attrs));
  const steps = [...walk(tree)].filter((el) => el.tag === 'button' && classes(el).includes('btn-step'));
  check(`fault: every .btn-step disabled (${steps.length})`, steps.length === 2 && steps.every((b) => 'disabled' in b.attrs));
  const resetEl = byId(tree, 'reset');
  check('fault: #reset disabled', resetEl !== null && 'disabled' in resetEl.attrs);
  const verdictFault = byId(tree, 'verdict');
  check('fault: #verdict hidden', verdictFault !== null && 'hidden' in verdictFault.attrs);
  const whyFault = byId(tree, 'verdict-why');
  check('fault: #verdict-why hidden', whyFault !== null && 'hidden' in whyFault.attrs);
  const killSec = byId(tree, 'kill');
  check('fault: section#kill exists', killSec !== null && killSec.tag === 'section');
  for (const id of ['tables', 'stats', 'compare', 'chart', 'kill', 'sim', 'explore']) {
    const sec = byId(tree, id);
    if (sec === null || sec.tag !== 'section') continue;
    check(`fault: section#${id} hidden`, 'hidden' in sec.attrs);
  }
} else {
  const rowHeads = rowHeaderCounts(tree);
  check('DOM has 60 row headers outside the chart data', rowHeads.outside === 60, `found ${rowHeads.outside}`);
  check('the chart data table has 21 row headers', rowHeads.chartData === 21, `found ${rowHeads.chartData}`);

  check('engine-error banner stays hidden', /<div id="engine-error" role="alert" hidden/.test(rendered));
  // Both Roll buttons, the six presets, the four steppers and the two hit step buttons ship disabled;
  // init enables them together, last.
  const rollEl = byId(tree, 'roll');
  const rollTableEl = byId(tree, 'roll-table');
  const btnsOf = (c) => [...walk(tree)].filter((el) => el.tag === 'button' && classes(el).includes(c));
  const presetEls = btnsOf('btn-preset'), tryEls = btnsOf('btn-try'), nudgeEls = btnsOf('btn-nudge'), stepEls = btnsOf('btn-step');
  const off = (els) => els.filter((b) => 'disabled' in b.attrs).length;
  const resetBtn = byId(tree, 'reset');
  check('#reset exists and is enabled after init', resetBtn !== null && resetBtn.tag === 'button' && !('disabled' in resetBtn.attrs),
    resetBtn ? 'it is disabled' : 'missing');
  const rollState = (el) => (el ? ('disabled' in el.attrs ? 'disabled' : 'enabled') : 'missing');
  check('Roll, preset, stepper and step buttons enabled after init',
    rollEl !== null && rollEl.tag === 'button' && !('disabled' in rollEl.attrs) &&
      rollTableEl !== null && rollTableEl.tag === 'button' && !('disabled' in rollTableEl.attrs) &&
      presetEls.length === 6 && off(presetEls) === 0 &&
      tryEls.length === 3 && tryEls.every((b) => classes(b).includes('btn-preset')) &&
      nudgeEls.length === 4 && off(nudgeEls) === 0 &&
      stepEls.length === 2 && off(stepEls) === 0,
    `roll ${rollState(rollEl)}, roll-table ${rollState(rollTableEl)}, ` +
      `${presetEls.length} .btn-preset, ${off(presetEls)} disabled, ${tryEls.length} .btn-try, ` +
      `${nudgeEls.length} .btn-nudge, ${off(nudgeEls)} disabled, ${stepEls.length} .btn-step, ${off(stepEls)} disabled`);
  check('sim section body shown after init',
    /<div class="sim-body"/.test(rendered) && !/<div class="sim-body"[^>]*\bhidden\b/.test(rendered));

  if (testMode) {
    check('self-test panel shows "Self-test passed"',
      rendered.includes('Self-test passed') && !rendered.includes('Self-test FAILED'));
  } else {
    check('self-test panel stays hidden', /<section id="selftest"[^>]*hidden/.test(rendered));
  }

  for (const text of expects) {
    check(`page shows ${JSON.stringify(text)}`, pageText.includes(norm(text)));
  }

  a11yGuards();
}

// (14) page order (260927-17o, 261105-emn): the settings, the outcome table with its cards, the chart.
{
  const mainEl = [...walk(tree)].find((el) => el.tag === 'main') || null;
  const skip = new Set(['section#selftest', 'div#engine-error', 'noscript']);
  const actual = mainEl === null ? '(no main)' : mainEl.children
    .filter((c) => c.text === undefined)
    .map((c) => (c.attrs.id ? `${c.tag}#${c.attrs.id}` : c.tag))
    .filter((k) => !skip.has(k))
    .join(', ');
  const expected = ['header', 'div#bar', 'p#try-row', 'section#tables', 'section#chart', 'section#compare',
    'section#kill', 'section#sim', 'section#explore'].join(', ');
  check('page order: header, bar, try row, tables, chart, compare, kill, sim, explore', actual === expected,
    'got ' + actual);
  const kidsOf = (el) => (el === null ? '(missing)' : el.children.filter((c) => c.text === undefined)
    .map((c) => (c.attrs.id ? `${c.tag}#${c.attrs.id}` : classes(c)[0] ? `${c.tag}.${classes(c)[0]}` : c.tag)).join(', '));
  const barKids = kidsOf(byId(tree, 'bar'));
  check('the bar holds the controls, the verdict, then its reason',
    barKids === 'form#controls, p#verdict, p#verdict-why', 'got ' + barKids);
  const tablesKids = kidsOf(byId(tree, 'tables'));
  check('#tables holds the heading, two-roll text, legend, table column, then the cards',
    tablesKids === 'h2, p#two-rolls, div#legend, div.table-col, section#stats', 'got ' + tablesKids);
  const tableCol = [...walk(tree)].find((el) => el.tag === 'div' && classes(el).includes('table-col')) || null;
  const colKids = kidsOf(tableCol);
  check('.table-col holds Roll, the table, then the footnote directly under it',
    colKids === 'p.table-roll, div.table-wrap, p#crit-note', 'got ' + colKids);
  const statKids = (kidsOf(byId(tree, 'stats'))).split(', ');
  check('#stats ends with the marginal card, then the formulas card',
    statKids.slice(-2).join(', ') === 'div#marginal, div#formulas', 'got ' + statKids.slice(-2).join(', '));
}

// (15) community link (user request 2026-11-03): one Funsmith Club link in the header, its
// Discord mark decorative and drawn in the link's own color, same tab.
{
  const mainEl = [...walk(tree)].find((el) => el.tag === 'main') || null;
  const header = mainEl === null ? null : mainEl.children.find((c) => c.tag === 'header') || null;
  const links = header === null ? [] : [...walk(header)].filter((el) => el.tag === 'a' && el.attrs.href === 'https://funsmith.club');
  const why = [];
  if (header === null) why.push('no main > header');
  if (links.length !== 1) why.push(`count ${links.length}`);
  const link = links[0];
  if (link) {
    const shown = norm(shownText(link));
    const named = norm(nameText(link));
    if (shown !== 'Funsmith Club') why.push(`shown ${JSON.stringify(shown)}`);
    if (named !== 'Funsmith Club') why.push(`name ${JSON.stringify(named)}`);
    const svgs = [...walk(link)].filter((el) => el.tag === 'svg');
    if (svgs.length !== 1) why.push(`${svgs.length} svg`);
    const svg = svgs[0];
    if (svg) {
      if (!ariaHidden(svg)) why.push('svg aria-hidden missing');
      if (svg.attrs.focusable !== 'false') why.push('svg focusable="false" missing');
      if (svg.attrs.fill !== 'currentColor') why.push(`svg fill ${JSON.stringify(svg.attrs.fill ?? null)}`);
      if (svg.children.some((c) => c.tag === 'title')) why.push('svg has a title');
    }
    if ('target' in link.attrs) why.push('has target');
  }
  check('community link: header has one Funsmith Club link with the Discord mark', why.length === 0, why.join('; '));
}

// (16) the verdict line (quick 261104-vx6): shown after init, and at the defaults it is the
// sentence the engine check pins. Text comes from the page's own spans, so a heading elsewhere
// cannot satisfy it. In a url with settings only the lead's presence is checked here; use
// --expect for its wording.
if (fault === null) {
  const OWNED = ['ac', 'die', 'atk', 'dmg', 'n', 'hp'];
  const atDefaults = testMode || !OWNED.some((k) => u.searchParams.has(k));
  const bar = byId(tree, 'bar');
  const verdictEl = byId(tree, 'verdict');
  const leadEl = byId(tree, 'verdict-lead');
  const whyEl = byId(tree, 'verdict-why');
  check('verdict: #bar exists', bar !== null);
  check('verdict: #verdict is shown', verdictEl !== null && !('hidden' in verdictEl.attrs));
  check('verdict: #verdict-why is shown', whyEl !== null && !('hidden' in whyEl.attrs));
  const lead = leadEl ? norm(visibleText(leadEl)) : '';
  // Not normalized at the start: the why starts with the one space that joins it to the lead.
  const why = whyEl ? whyEl.children.map(visibleText).join('') : '';
  if (atDefaults) {
    check('verdict: lead at the defaults', lead === '+1 to damage wins here.', `got ${JSON.stringify(lead)}`);
    check('verdict: why at the defaults', why === ' Over 20 rounds it adds 11.0: 1 more on each of your 11 expected hits. +1 to hit adds 4.5: one more hit.', `got ${JSON.stringify(why)}`);
  } else {
    check('verdict: lead is not empty', lead !== '', 'empty');
  }
}

const mode = fault !== null ? `, mode: fault ${fault}` : '';
console.log(`url: ${url} (${testMode ? 'test' : 'plain'} mode, ${width}px, ${path.basename(browser)})${mode}`);
console.log(`console lines: ${consoleLines.length}`);
for (const l of consoleLines.filter((x) => /SELFTEST|render failed/.test(x)).slice(0, 5)) console.log(`  ${l.trim().slice(0, 200)}`);
for (const r of results) {
  console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}`);
  if (!r.ok && r.detail) console.log(`      ${r.detail}`);
}
const failed = results.filter((r) => !r.ok).length;
for (const r of results.filter((x) => !x.ok)) console.log(`CHECK-PAGE FAIL: ${r.name}`);
if (failed === 0) {
  console.log('CHECK-PAGE PASS');
  process.exit(0);
}
console.log(`CHECK-PAGE FAIL (${failed})`);
process.exit(1);
