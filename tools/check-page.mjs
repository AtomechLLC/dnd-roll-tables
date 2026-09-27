// Dev-only headless browser check. Never required to build or deploy the site.
//
//   node tools/check-page.mjs [url] [--plain] [--expect TEXT]... [--width PX] [--dump FILE]
//   node tools/check-page.mjs --fault render [--width PX] [--dump FILE]
//
// Loads the page in headless Chrome (or Edge) with a throwaway profile, captures
// the final DOM (--dump-dom) and the console (--enable-logging), then checks:
//   (1) the console contains SELFTEST PASSED
//   (2) the console has no Uncaught / SELFTEST FAIL / CSP / parse / load errors
//   (3) the DOM has exactly 80 row headers (<th scope="row">) at load: 4 tables x 20 rows;
//       the sim log adds 21 only after a roll (the ?test smoke resets its run at the end)
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
//   (7) the Roll button is enabled after init (it ships disabled; init enables it last)
//   (8) the sim section body is shown after init (it ships hidden)
//   (6)-(8) guard 02-REVIEW WR-01: a caught first-render throw logs console.error('render
//   failed'), which the console check does not match, so these are its only guard.
//   Budget gate (03-REVIEW IN-01): the Chrome console's `SELFTEST PASSED: n/n (X ms)` must
//   report X <= 200.
//
// --fault render (02-REVIEW WR-01, 03-REVIEW WR-04): copies index.html to a temp dir, makes
// render() throw, and appends a script that dispatches an `input` event on #ac-range after
// init. It loads that copy in plain mode and, instead of (3), (4), (6)-(8) and the expects,
// checks the guarded init: SELFTEST PASSED, 'render failed' logged, no 'Uncaught', the banner
// shown, #roll and every .btn-preset disabled, and every painted section hidden.
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
if (fault !== null && fault !== 'render') {
  console.log(`CHECK-PAGE FAIL: unknown fault ${JSON.stringify(fault)} (only "render")`);
  process.exit(1);
}

if (!fs.existsSync(indexPath) && (url === null || fault !== null)) {
  console.log('CHECK-PAGE FAIL: index.html not found');
  process.exit(1);
}

// Fault mode: a temp copy whose render() throws, plus a synthetic input after init.
let faultDir = null;
if (fault === 'render') {
  const src = fs.readFileSync(indexPath, 'utf8');
  const anchor = 'function render() {';
  const at = src.indexOf(anchor);
  const end = src.lastIndexOf('</body>');
  if (at < 0 || end < 0) {
    console.log('CHECK-PAGE FAIL: fault injection anchors not found (function render() { / </body>)');
    process.exit(1);
  }
  const poke = '<script>setTimeout(() => document.getElementById(\'ac-range\')' +
    '.dispatchEvent(new Event(\'input\', { bubbles: true })), 0);</script>\n';
  let out = src.slice(0, at) + anchor + " throw new Error('injected render fault');" + src.slice(at + anchor.length);
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
// The --expect haystack: the page minus the self-test panel.
const pageTree = parseTree(rendered);
const selftestEl = byId(pageTree, 'selftest');
if (selftestEl && selftestEl.tag === 'section') detach(selftestEl);
const pageText = norm(visibleText(pageTree));

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

if (fault === 'render') {
  check('fault: console has "render failed"', consoleText.includes('render failed'));
  check('fault: console has no "Uncaught"', !consoleText.includes('Uncaught'),
    consoleText.split(/\r?\n/).filter((l) => l.includes('Uncaught')).slice(0, 3).join('\n      '));
  const banner = byId(tree, 'engine-error');
  check('fault: engine-error banner shown', banner !== null && !('hidden' in banner.attrs));
  const roll = byId(tree, 'roll');
  check('fault: #roll disabled', roll !== null && 'disabled' in roll.attrs);
  const presets = [...walk(tree)].filter((el) => el.tag === 'button' && classes(el).includes('btn-preset'));
  check(`fault: every .btn-preset disabled (${presets.length})`, presets.every((b) => 'disabled' in b.attrs));
  for (const id of ['stats', 'tables', 'compare', 'chart', 'sim', 'explore']) {
    const sec = byId(tree, id);
    if (sec === null || sec.tag !== 'section') continue;
    check(`fault: section#${id} hidden`, 'hidden' in sec.attrs);
  }
} else {
  const rowHeads = rendered.split('<th scope="row"').length - 1;
  check('DOM has 80 <th scope="row"> headers', rowHeads === 80, `found ${rowHeads}`);

  check('engine-error banner stays hidden', /<div id="engine-error" role="alert" hidden/.test(rendered));
  check('Roll button enabled after init',
    /<button[^>]*id="roll"[^>]*>/.test(rendered) && !/<button[^>]*id="roll"[^>]*\bdisabled\b/.test(rendered));
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
}

const mode = fault === 'render' ? ', mode: fault render' : '';
console.log(`url: ${url} (${testMode ? 'test' : 'plain'} mode, ${width}px, ${path.basename(browser)})${mode}`);
console.log(`console lines: ${consoleLines.length}`);
for (const l of consoleLines.filter((x) => /SELFTEST|render failed/.test(x)).slice(0, 5)) console.log(`  ${l.trim().slice(0, 200)}`);
for (const r of results) {
  console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}`);
  if (!r.ok && r.detail) console.log(`      ${r.detail}`);
}
const failed = results.filter((r) => !r.ok).length;
if (failed === 0) {
  console.log('CHECK-PAGE PASS');
  process.exit(0);
}
console.log(`CHECK-PAGE FAIL (${failed})`);
process.exit(1);
