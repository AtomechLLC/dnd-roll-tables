// Dev-only headless browser check. Never required to build or deploy the site.
//
//   node tools/check-page.mjs [url] [--plain] [--expect TEXT]... [--width PX] [--dump FILE]
//
// Loads the page in headless Chrome (or Edge) with a throwaway profile, captures
// the final DOM (--dump-dom) and the console (--enable-logging), then checks:
//   (1) the console contains SELFTEST PASSED
//   (2) the console has no Uncaught / SELFTEST FAIL / CSP / parse / load errors
//   (3) the DOM has exactly 80 row headers (<th scope="row"): 4 tables x 20 rows at
//       load; the sim log adds 21 only after a roll, and the ?test smoke clears its run
//   (4) test mode: the visible self-test panel passed; plain mode: the panel is hidden
//   (5) every --expect string appears in the visible page text: the self-test panel is
//       removed first (its check names could echo UI strings, 01-REVIEW IN-06) and the
//       &amp; &lt; &gt; &quot; entities are decoded
//   (6) the engine-error banner is still hidden after init
//   (7) the Roll button is enabled after init (it ships disabled; init enables it last)
//   (8) the sim section body is shown after init (it ships hidden)
//   (6)-(8) guard 02-REVIEW WR-01: a caught first-render throw logs console.error('render
//   failed'), which the console check does not match, so these are its only guard.
//
// Default url: file:// URL of ../index.html plus ?test (--plain drops ?test).
// For an explicit url, test mode is on exactly when the url contains ?test.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(here, '..', 'index.html');

// ---- args --------------------------------------------------------------------
const args = process.argv.slice(2);
let url = null, plain = false, width = 1366, dump = null;
const expects = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--plain') plain = true;
  else if (a === '--expect') expects.push(args[++i] ?? '');
  else if (a === '--width') width = Number(args[++i]) || 1366;
  else if (a === '--dump') dump = args[++i];
  else if (a.startsWith('--')) { console.log(`CHECK-PAGE FAIL: unknown option ${a}`); process.exit(1); }
  else url = a;
}

if (url === null) {
  if (!fs.existsSync(indexPath)) {
    console.log('CHECK-PAGE FAIL: index.html not found');
    process.exit(1);
  }
  url = pathToFileURL(indexPath).href + (plain ? '' : '?test');
} else if (plain) {
  url = url.replace(/\?test\b&?/, '?').replace(/\?$/, '');
}
const testMode = url.includes('?test');

// ---- browser -----------------------------------------------------------------
const candidates = [
  process.env.CHROME,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);
const browser = candidates.find((p) => fs.existsSync(p));
if (!browser) {
  console.log('CHECK-PAGE FAIL: no Chrome or Edge found (set CHROME to the browser path)');
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
  process.exit(1);
}
try {
  fs.rmSync(prof, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
} catch { /* best effort: a lingering browser process may still hold a file */ }

if (dump) fs.writeFileSync(dump, dom, 'utf8');

// ---- checks ------------------------------------------------------------------
// Judge rendered markup only: script and style source text also contains strings
// like '<th scope="row"', 'Self-test FAILED' and 'crit*', which would fake a match.
const rendered = dom
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
// --expect matches only the visible page: drop the self-test panel, decode entities
// (&amp; last so an encoded "&lt;" is not decoded twice).
const visible = rendered
  .replace(/<section id="selftest"[^>]*>[\s\S]*?<\/section>/i, '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const consoleLines = consoleText.split(/\r?\n/).filter((l) => /CONSOLE/.test(l));
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });

check('console has SELFTEST PASSED', consoleText.includes('SELFTEST PASSED'));

const bad = /Uncaught|SELFTEST FAIL|Content Security Policy|cannot be parsed|Failed to load resource/;
const badLines = consoleText.split(/\r?\n/).filter((l) => bad.test(l));
check('console has no errors', badLines.length === 0, badLines.slice(0, 5).join('\n      '));

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

for (const text of expects) check(`page shows ${JSON.stringify(text)}`, visible.includes(text));

console.log(`url: ${url} (${testMode ? 'test' : 'plain'} mode, ${width}px, ${path.basename(browser)})`);
console.log(`console lines: ${consoleLines.length}`);
for (const l of consoleLines.filter((x) => /SELFTEST/.test(x)).slice(0, 5)) console.log(`  ${l.trim().slice(0, 200)}`);
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
