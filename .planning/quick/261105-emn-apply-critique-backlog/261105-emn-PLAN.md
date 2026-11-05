---
phase: quick-261105-emn
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [index.html, tools/check-engine.mjs, tools/check-page.mjs, DESIGN.md, .planning/PROJECT.md, CLAUDE.md]
autonomous: true
requirements: [QUICK-261105-emn]
must_haves:
  truths:
    - "At 1366 the first screen holds the verdict, a one-line preset row and the outcome table, with the key cards and Value of the next +1 beside the table instead of an empty column; the chart comes straight after #tables"
    - "The verdict says why in 20-round numbers, names the crossing when the sweep has one, and agrees with the Value of the next +1 card, the chart caption and DiceMath.crossings at all 70,980 settings"
    - "The compare section shows +N to hit and +N to damage only, side by side from a 52rem section width and one at a time with a To hit / To damage switch below it; colors and deltas are unchanged and the stats lines say vs the main table"
    - "A phone reader gets 44px steppers on Attack and Damage, a sticky area shorter than before (lead and settings only), a collapsed round log, and no sideways scroll at 320px"
    - "Roll 20 rounds sits beside the outcome table and marks it in place; its note tells the truth before a roll, after a roll and when stale"
    - "Roll marks cover nothing: a cell rolled 2+ times has a heavier ring and every rolled row shows xN in the note column, equal to the count of that d20 face in the run"
    - "Every sentence on the page is still true in the new order: nothing says below or above about a section that moved, and no step label says (0 HP)"
    - "check-engine and check-page pass in every mode (default, --plain, --width 360, --fault render, --fault later), self-test stays under 200 ms in Chrome, the CSP is unchanged, and nothing is pushed"
  artifacts:
    - path: "index.html"
      provides: "New page order, .table-col, #verdict-why, #try-row, #roll-table, steppers, compare switch, log fold, .roll-many, short notes"
      contains: "id=\"verdict-why\""
    - path: "tools/check-engine.mjs"
      provides: "I1 rebuilt for the why sentence and crossing; compare, preset and HP step oracles"
      contains: "expected hits"
    - path: "tools/check-page.mjs"
      provides: "Guards (3), (7), (11), (12), (14), (16) and fault mode for the new structure"
      contains: "p#try-row"
    - path: "DESIGN.md"
      provides: "miss-ink token and layout sections true to the page"
      contains: "miss-ink"
  key_links:
    - from: "VM.verdictView"
      to: "chartView crossings"
      via: "computeView passes its one chart.crossings; no second sweep"
      pattern: "verdictView\\(sv, formulas, chart\\.crossings\\)"
    - from: "VM.verdictView crossing sentence"
      to: "VM.captionCross"
      via: "same function as the chart caption, so the two always read the same"
      pattern: "captionCross\\("
    - from: "#roll-table click"
      to: "onRoll"
      via: "one handler; the file keeps exactly one Math.random"
      pattern: "rollTableBtn\\.addEventListener\\('click', onRoll\\)"
    - from: "#try-row"
      to: "applyPreset"
      via: "delegated onPresetClick; presetBtns selects both rows"
      pattern: "tryRowEl\\.addEventListener\\('click', onPresetClick\\)"
    - from: "#compare:has(#cmp-show-dmg:checked)"
      to: ".cmp one-at-a-time display"
      via: "CSS only inside @container compare (width < 52rem); radios carry no data-key"
      pattern: "cmp-show-dmg:checked"
---

<objective>
Apply the open Impeccable critique backlog: the lesson comes first (chart up, cards beside the table, Baseline table gone, one-line presets), the verdict gives a reason in 20-round units and names the crossing, phones scroll less (steppers, one comparison table at a time, collapsed log), Roll sits beside the table it marks, and the small flaws go.

Purpose: the critique scored 28/40 because the lesson arrives late and the verdict gives a result without a reason. No math changes.

Output: index.html, tools/check-engine.mjs, tools/check-page.mjs and the docs this makes untrue, all checks passing, committed locally on `main`, nothing pushed. Refinement, not redesign: tokens, Georgia + system-ui, 4-24px spacing, flat ruled surfaces, no shadows, no transitions.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md
@./PRODUCT.md
@.planning/quick/261105-emn-apply-critique-backlog/261105-emn-CONTEXT.md

The numbered sections in 261105-emn-CONTEXT.md are the full spec with every exact sentence. This plan cites them as C1-C8 and does not repeat them. Read that file first and copy its strings exactly. The "Left as they are" list stays untouched and is reported in the SUMMARY with its reasons.

<interfaces>
Facts from HEAD c5fa1cc. Line numbers drift after Task 1, so search by the quoted text. index.html is 5,975 lines and check-engine 2,136: read regions, never the whole file.

Conventions
- Work on `main` in the main checkout. Commit locally, never push, never run gh. Stage named files only: `.planning/quick/` stays out of task commits.
- Failing check commit first, then the implementation. Every commit ends with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Git Bash heredocs drop backslashes (it happened during planning). Edit with Write/Edit and re-read regexes that land. NBSP is `String.fromCharCode(0xa0)`.
- Regions: CSS 10-876, markup 879-1182, dice-math 1188, view-model 1552-2460, dice-selftest 2462-3139, app 3141-end, runUiSmoke from 4258, failPage/init from 5894.
- Add no new checks to `dice-selftest` (200 ms budget); editing a pinned string there is fine. New engine checks go in check-engine, new DOM checks in `runUiSmoke`.
- Smoke literals split visible copy (`'hits at ' + '+1'`) so check-page --expect can only match the real page. Keep doing that.

Planner preflight, run over all 70,980 settings against the current view-model (set expectations from it; the oracles must still be written)
- Branches: zero-hit 28,100; hit ahead 26,473; damage ahead 16,356; about even 51; tie 0 (needs a direct pin).
- 20-round tenths never contradict the winner: the winner never shows less and never shows equal. All 51 about-even settings show equal values. `marg.hit20` and `marg.dmg20` are the card's strings, and the winner's value is never 0.0.
- Exact test `sv.exact.dmgNum === sv.hitFaces * sv.exact.den`: true at 60,740, false at 10,240 (zero-hit 4,290, hit ahead 409, damage ahead 5,490, about even 51, where the sentence has no hit wording). hitFaces is 1 at 17,680, of which 2,040 take the floor wording.
- Crossings: none at 44,788 (16 of them meet without crossing, so they get no sentence); exactly one at 26,192; never 2+. **tieN is null at 25,318 of the 26,192**, so today's caption says only "The curves cross once." at 97% of crossing settings. C3 therefore applies: `captionCross` gains the `, between +a and +b` wording from `lastLeadN` and `flipN` (always adjacent when tieN is null), and the chart caption changes with it.
- Longest why with crossing: 155 characters at AC 19, d4, -5, -1; with the lead 178. Use it for the worst-case bar measurement.

Pins, generated from the data above (the leading space is part of the string)
- AC 15 d8 +5 +0 (defaults): ` Over 20 rounds it adds 11.0: 1 more on each of your 11 expected hits. +1 to hit adds 4.5: one more hit.` No crossing.
- AC 15 d12 +0 +0: ` Over 20 rounds it adds 6.5: one more hit. +1 to damage adds 6.0: 1 more on each of your 6 expected hits. The curves cross once, between +14 and +15.`
- AC 25 d12 +0 +0: ` Over 20 rounds +1 to hit adds nothing (still only a natural 20 hits); +1 to damage adds 1.0: 1 more on your 1 expected hit. The curves cross once, between +5 and +6.`
- AC 15 d8 +13 +0: ` Over 20 rounds +1 to hit adds nothing (it already hits on 2+, the 95% cap); +1 to damage adds 19.0: 1 more on each of your 19 expected hits.`
- AC 10 d4 -5 -5: ` Over 20 rounds +1 to hit adds nothing (the extra hits deal 0 damage at this penalty); +1 to damage adds 0.6: 1 more on each hit that deals damage.`
- AC 10 d4 -4 +8: the tail is ` The curves cross once, at +18.`

Corrections and traps the planner found (each overrides a literal reading)
- C1 lists four grid-area rows but three row tracks. `grid-template-rows: auto auto 1fr` would hand the spare height to the legend row, recreating the void C1 removes. Use `auto auto auto 1fr` so the spare height lands below #stats.
- `#stats, #kill` share one six-track template near "Stat cards", and `.kill-note { grid-column: 4 / -1 }` needs those six tracks. Change the tracks to `minmax(11rem, 1fr)` for `#stats` only inside the 64rem block; #kill keeps its template.
- `display: inline` on `#verdict` or `#verdict-why` beats the UA `[hidden]` rule, and fault mode depends on hidden. Write those rules as `#verdict:not([hidden])` and `#verdict-why:not([hidden])`, and let check-page's fault check plus a harness read confirm computed display none.
- `.sim-log-wrap` ships `hidden` until the first roll, so a `summary` inside it trips guard (11)'s inside-[hidden] problem. Give the summary `id="fold-log"`, skip it in (11) by id, and cover it in the smoke after a roll.
- check-page reads a static DOM dump, so it cannot see `display:none`. Guard (11) skips `.btn-nudge` and radios named `cmp-show` by class and name; `runUiSmoke` checks those on the live page with computed style. `#verdict-change` and the `#controls` jump stay in the static list.
- Copy made false by the new order, beyond C7's list: `presetStatus` says `Everything above has updated.`, false from #try-row: use `Everything on the page has updated.` (VM line 2169, check-engine `statusWant` about line 1272). The floor crit footnote says `The stat cards below use the real two-dice rule.`, false at >= 64rem where they sit beside the table: use `The stat cards use the real two-dice rule.` (renderFootnote).
- `Sim.runMarks().rows` counts only non-hit rounds, and self-test pins cells + rows = 20. Leave runMarks alone. In `renderOutcomeTable` sum the row's cell counts while building its cells: the note count is that sum on hit rows and `marks.rows` otherwise. The th ring stays on non-hit rows only (the smoke's count of 7 stays).
- The smoke's independent marks oracle counts `sim.run.rounds` by d20 for each row.
- Light `--miss-ink` candidate: `oklch(0.40 0.01 80)` computes 4.60:1 on the darker stripe (0.45 gives 3.72, matching the critique; 0.41 gives 4.41). Measure the rendered mix in the sweep.

Anchors
- View-model: `verdictView(sv, fv)` and `VERDICT_REASON` about line 1776; `computeView` about 2436; `captionCross` 1876; `compareView` 1805 (`vs baseline` in statsText); `hpStep`-labels 2311-2312; PRESETS 2150-2165.
- Self-test pins that change with `captionCross` (dice-selftest): lines 2870, 2895, 2906, 2907. The `vs baseline` pins: 2662, 2664. The internal base title `Baseline (+0)` stays because compareView keeps `tables.base`.
- check-engine: `checkVerdict` line 329, called inside `checkCopy` (832) BEFORE the sweep series `a`, `d` (about 927) and `crossRes` (about 983) exist. Have `checkCopy` keep the verdict inputs, then rebuild the sentence right after `crossRes` is set. Independent exact test there: `d[1] - d[0] === s.hitFaces * s.e20Den` from the sweep cache. Caption pins at 1244 and 1266; preset title 1146; `statusWant` 1272; HP labels 1702-1703; compare checks in (i) about 905-925; direct I1 pins about 2004.
- check-page: (7) preset counts lines 26, 517-530; (3) and fault later 10, 486-487, 513; (11) want list 391-417; (12) `tables.length !== 4` 439; (14) 549-566; (16) 597-620; fault block 482-510.
- App block: `CMP_KEYS` 3167; `presetBtns` 3211 (`#explore button.btn-preset`); `RENDERERS` 3227; `render` 3308; `applyPreset`/`onPresetClick` 3386; `onStepClick` 3413 (the handler shape to copy); `renderVerdict` 3484; `noteFor` 3604; `renderOutcomeTable` 3620; `renderCompare` 3684; `ROLL_ERROR_TEXT` 3701; `handleRoll` 3726; `renderSim` 3786; `renderLegend` 4168; `renderFootnote` about 4190.
- Smoke counts to update: `th[scope="row"]...` 80 becomes 60 at about 4946, 5123, 5235 and comments 3802, 4795, 4939, 5118, 5231; `cmp ui` block 4473-4555 (`three`, `cmp-base cmp-hit cmp-dmg`, `10 5 10`, `titles`, the three-up geometry at 4535-4553, which must read visible tables only under 52rem); marks block from 5142; `document.querySelector('button.btn-preset')` 5607, 5759, 5815 now scoped to `#explore`; a11y order 5838; `verdict-rest` 4457, 5690.
- CSS: sticky block 205-254, `--scroll-pad` 216-218 and 843-846, stat cards 260-266, run marks 394-415, narrow-tier `data-short` 362-373, compare 447-456, 64rem block 794-815, touch block 833-847.
- `.btn-preset` has `align-self: end`; #try-row needs `align-self: center` on `.btn-try`.
- `--width` sets `--window-size`, and Chrome will not size a window under about 497px. A true 360 or 320 needs the iframe harness in `.planning/quick/260927-1ty-make-the-page-more-space-dense/260927-1ty-PLAN.md` lines 86-141. Pass `--blink-settings=preferredColorScheme=1` for light (Windows is in dark mode).
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Verdict why, crossing wording and view-model copy, with check-engine oracles (C2 strings, C3 sentence, C7, C8 HP)</name>
  <files>tools/check-engine.mjs, tools/check-page.mjs, index.html</files>
  <read_first>
    - tools/check-engine.mjs lines 315-356, 830-836, 905-930, 975-1000, 1140-1150, 1240-1275, 1700-1705, 2004-2022
    - index.html lines 1776-1835, 1876-1887, 2150-2170, 2305-2315, 2436-2450, 2866-2915, 3484-3489, 3684-3696
  </read_first>
  <behavior>
    - I1, all settings: the sentence equals one rebuilt in check-engine from `marg.hit20`, `marg.dmg20`, the reason table, an independent exact test on the sweep series (`d[1] - d[0] === hitFaces * e20Den`) choosing among the three hit wordings, and a crossing tail rebuilt from `DiceMath.crossings` on the sweep series (none when `list` is empty; `, at +t` when tieN is set; `, between +a and +b` otherwise). The lead still maps from the independent (t) verdict. The winner's 20-round value is never below the loser's; about-even values are equal.
    - I1 counts pinned: zero-hit 28,100; tie 0; exact hit wording 60,740; floor wording 10,240; crossing tails 26,192, of which between 25,318.
    - I1 direct pins: every string under "Pins" in the interfaces; a `they tie.` result gives ` Over 20 rounds each adds 0.3.`-shaped text from a fake; about even gives `both add about`; `computeView` at AC 15 d12 passes the real crossing through.
    - Sampled combos: `chartView(p, 5).caption` contains the same crossing sentence the verdict appends.
    - Compare (i): statsText says `· +22.5 vs the main table` shape; summary unchanged.
    - Presets: `dmg` title `No crossover` in VM and markup; preset status `Everything on the page has updated.`
    - HP labels: a 0 HP step gives exactly `−1 hit` / `+1 hit` at both limits.
  </behavior>
  <action>
RED: Update tools/check-engine.mjs per the behavior list and its header comment and `names` entry for I1. Move the sentence check after `crossRes` as the interfaces describe. In tools/check-page.mjs change only guard (16)'s rest literal to the new default string, keeping its id reading `#verdict-rest` for now so this commit's page path stays testable. Run `node tools/check-engine.mjs`: only I1, (i), presets and the HP oracle may fail. Commit tools/check-engine.mjs and tools/check-page.mjs as `test(quick-261105-emn): expect the verdict's reason, the crossing wording and the new copy`.

GREEN, in index.html:
- `captionCross`: a single crossing with null tieN reads `The curves cross once, between ${signed(lastLeadN)} and ${signed(flipN)}.` per C3. Update the self-test pins (2870, 2895, 2906, 2907 give `+6 and +7`, `+6 and +7`, `+14 and +15`, `+5 and +6`; read each setting) and check-engine's caption pins 1244 and 1266.
- `verdictView(sv, fv, crossings)` returns `{ lead, why }` per C3. It reads `fv.win.verdict` and `fv.branch.win` for the winner, `sv.marg.hit20` and `.dmg20` for numbers, and one local helper for the hit wording using the exact test `sv.exact.dmgNum === sv.hitFaces * sv.exact.den`. It appends `' ' + captionCross(crossings)` only when `crossings.list.length > 0`. It never compares values and never sweeps. Keep VERDICT_REASON.
- `computeView`: name `const chart = chartView(p, state.n)`, use it in the view and pass `chart.crossings`.
- `renderVerdict`: write `v.why` into the existing #verdict-rest for this commit, so the page keeps working until Task 2 moves it.
- `compareView` statsText and `renderCompare`'s literal: `vs the main table`. Pins 2662, 2664. Update the comments that call Baseline a shown table, including the one above renderCompare that reads `delta vs baseline`: base stays for the delta, summary and heatMax per C2.
- Preset title per C7 in PRESETS and the `.explore-title` markup. `presetStatus` per the interfaces.
- HP labels per C8, and the comment at 2307.

Run `node tools/check-engine.mjs` and `node tools/check-page.mjs --plain`. Confirm the Node self-test stays under its budget (a WARNING over 200 ms: rerun once, that is load). Commit index.html (and tools/check-engine.mjs if touched) as `feat(quick-261105-emn): give the verdict its reason and crossing in 20-round units, and fix preset and step copy`.

If an oracle finds a contradiction between the sentence and the numbers, report it and fix the sentence, not the check.
  </action>
  <verify>
    <automated>cd C:/Projects/GameDesignSkills/DnD-CombatRollSimulator && node tools/check-engine.mjs | tail -1 | grep PASS && node tools/check-page.mjs | tail -1 | grep PASS && node tools/check-page.mjs --plain | tail -1 | grep PASS && grep -q "cross once, between" index.html</automated>
  </verify>
  <done>CHECK-ENGINE PASS with I1's new counts printed; the default verdict reads the C3 sentence on the page; no layout changed yet; two commits made.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: New page structure, guards and UI smoke (C1, C2 layout, C3 DOM, C4, C5, C6, C8 Go to the controls)</name>
  <files>tools/check-page.mjs, index.html</files>
  <read_first>
    - C:/Users/alexy/.claude/skills/impeccable/reference/craft-floor.md, immediately before editing
    - index.html regions 127-154, 205-254, 260-270, 447-456, 625-631, 768-775, 794-847, markup 891-1040 and 1111-1181
    - index.html app regions named in the interfaces, plus 5680-5700 and 5812-5860 (smoke), 5894-5965 (failPage and init)
    - tools/check-page.mjs lines 318-327, 391-417, 436-442, 482-532, 549-566, 597-620
  </read_first>
  <behavior>
    - (14): main's children are header, div#bar, p#try-row, section#tables, section#chart, section#compare, section#kill, section#sim, section#explore. Bar children are form#controls, p#verdict, p#verdict-why. #tables' children are h2, p#two-rolls, div#legend, div.table-col, section#stats. .table-col's are p.table-roll, div.table-wrap, p#crit-note. #stats ends with #marginal then #formulas.
    - (11) static order: https://funsmith.club, ac-range, ac-num, die, atk-num, dmg-num, n-range, reset, #controls, cross, dmg, cap, roll-table, fold-marginal, fold-formulas, chart-data-summary, hp-num, hp-minus, hp-plus, roll, cross, dmg, cap, #chart, #controls. Skips `.btn-nudge`, radios named `cmp-show`, and #fold-log per the interfaces.
    - (3), fault later: 60 row headers outside .chart-data, plus 21 inside. (12): three table.outcome. #cmp-base and #cmp-base-stats absent.
    - (7): six .btn-preset, three of them .btn-try, four .btn-nudge, and #roll-table, none disabled after init. Fault: #roll-table, every .btn-try and .btn-nudge disabled; #verdict and #verdict-why hidden. PAINTED_SECTIONS still lists every painted section.
    - (16): #verdict-why has no [hidden] and reads the default sentence.
    - Smoke, new try/catch blocks restoring state in finally:
      - order `cmp-hit cmp-dmg`; compare stats equal the view.
      - folds: both start closed, `#f-plus-win-live` still has the live text; .sim-log-fold ships open and init closes it only under a 40rem page.
      - verdict: lead in #verdict and why in #verdict-why; below the sticky width #verdict sticks and #verdict-why is not sticky; #verdict-why not a live region.
      - roll beside the table: #roll-table rolls and marks #outcome; the note in all three states, stale matching `.note-stale`'s text, `This run:` total and expected equal to #sim-total and #sim-e; the link `See the rounds` goes to `#sim`; Reset of the sim returns the first state.
      - try row: labels equal `VM.PRESETS` titles; a click applies the preset, describedby present; #roll is not affected.
      - steppers: atk 19 then + twice gives 20 with `aria-disabled="true"`, no write on the third click; dmg -4 then − twice gives -5; focus stays; computed display none at a fine pointer.
      - switch: toggling #cmp-show-dmg changes no state and no URL and leaves `.btn-*` alone; under 52rem exactly the chosen `.cmp` is displayed, at or above it the switch is display none and both show.
      - a11y order (live): as (11), adding `verdict-change`, the switch and nudges only when computed display is not none, and skipping the final `#controls` jump when it computes none.
      - layout at >= 64rem: #stats is left of .table-col; at 1366 three card tracks; #crit-note directly under .table-wrap; no sideways scroll.
  </behavior>
  <action>
RED: Update tools/check-page.mjs per the behavior list and header comment. Run `node tools/check-page.mjs --plain`: the structural guards fail. Commit only tools/check-page.mjs as `test(quick-261105-emn): expect the new page order, try row, roll button, steppers and two compare tables`.

GREEN, markup (keep every other id; the hp markup bytes stay unchanged because K7 parses them):
- C1: section order per (14). Move #stats into #tables after new `div.table-col`. Swap #marginal before #formulas. Remove `open` from both `details.fold` and remove init's loop.
- C3: `<p id="verdict-why" hidden>` directly after #verdict in #bar. Remove span#verdict-rest and its ref; renderVerdict writes `v.why` to #verdict-why with setNumbered.
- C2: remove the Baseline `.cmp`. New intro string. `CMP_KEYS = ['hit', 'dmg']`. Add `cmp-hit-col` and `cmp-dmg-col` classes to the two `.cmp`.
- C4: `.group-bonus` on Attack and Damage groups, each input wrapped in `.nudge-row` between two `button.btn-nudge` shipping `disabled`, `data-nudge-key`, `data-nudge`, the C4 aria-labels and visible text `−` / `+`. `fieldset.cmp-switch` per C4 before `.trio` with a visually hidden legend. Wrap `#sim-log` in `<details class="fold sim-log-fold" open><summary id="fold-log">Round by round</summary>` inside `.sim-log-wrap`.
- C5: `p.table-roll` per C5 at the top of `.table-col`; `#roll-table` ships `disabled`.
- C6: `p#try-row` per C6; each `button.btn-preset.btn-try` ships `disabled`.
- C8: `.jump-controls` class on the "Go to the controls" link and its separator span.

GREEN, CSS:
- C1 at `@container page (width >= 64rem)`: the grid in C1 with the row-track correction from the interfaces; `.table-col { grid-area: tcol; min-width: 0 }`; `#stats { grid-area: stats; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)) }`. Delete the half-width formulas and marginal rules and `#tables > .table-wrap`, `#crit-note` area rules. Formulas and marginal both span `1 / -1` from their existing base rules. Below 64rem give `#stats` `margin-top: var(--sp-4)`, because it no longer gets main's gap.
- C2: `.trio` two columns at `@container compare (width >= 52rem)`; delete the 77rem rule and update its comment.
- C3: base `#verdict-why { margin: 0; max-width: 72ch; font-size: 1rem; line-height: 1.5 }`. In the sticky block: `#controls { margin-bottom: var(--sp-2) }`, `#verdict:not([hidden]), #verdict-why:not([hidden]) { display: inline }` and drop `#verdict`'s margin-top.
- C4 steppers: `.btn-nudge { display: none }`. In `@media (pointer: coarse)` wrapping `@container page (width < 70rem)`: `.group-bonus { flex: 1 1 calc(50% - var(--sp-4)); min-width: 0 }`, `.nudge-row` flex with `gap: var(--sp-1)`, `.btn-nudge` inline-flex 44 by 44, shared fill with `.btn-step`, `input` in .nudge-row `flex: 1 1 0; width: auto; min-width: 0`, spinners hidden (`appearance: textfield` plus the two webkit pseudo-elements). Must fit 320px.
- C4 switch: `.cmp-switch { display: none }`. Inside `@supports selector(:has(*))` and `@container compare (width < 52rem)`: the switch shows as `.segs`-styled radios at natural width, and `#compare:has(#cmp-show-hit:checked) .cmp-dmg-col` and `#compare:has(#cmp-show-dmg:checked) .cmp-hit-col` are display none. The radios are `.vh`, never display none, so arrow keys work.
- C5: `.table-roll` flex row, wrapping, `gap: var(--sp-2)`, center aligned, 0.875rem note in `--ink-muted`.
- C6: `#try-row` flex wrap, `gap: var(--sp-2)`, `margin: 0`, `.btn-try { align-self: center }`. The touch block already raises `.btn-preset`.
- C8: `.jump-controls { display: none }` inside the sticky block. Fix the comments there and on `z-index 2` (no badge is left after Task 3).
- `--scroll-pad`: measure with the harness per C3 and update values and comment: base and coarse base are the sticky #verdict alone at 320px (lead and settings), so smaller than today; sticky widths are the bar with the 178-character sentence plus a clamp note, plus `--sp-2`.

GREEN, app block:
- Refs and init: `rollTableBtn`, `rollTableNoteEl`, `tryRowEl`, `nudgeBtns`, `verdictWhyEl`, log fold. `presetBtns` selects `button.btn-preset` everywhere. `rollTableBtn.addEventListener('click', onRoll)`, `tryRowEl.addEventListener('click', onPresetClick)`, `form.addEventListener('click', onNudgeClick)`. Under `(width < 40rem)` close the log fold only. Enable the new buttons with the others, last, and unhide #verdict-why with #verdict. Add the same to failPage.
- `onNudgeClick`: `closest('button[data-nudge]')`; return if `disabled` or aria-disabled; `VM.parseControl(key, state[key] + delta, state[key])` then `setState` only when changed.
- `renderNudges(view)` in RENDERERS: writes `aria-disabled` from `VM.CONTROL_SPEC` limits, on change only.
- `renderRollNote(view, simCtx)` in RENDERERS per C5: no run (with `sim.rollError` showing `ROLL_ERROR_TEXT`, because the note stands beside the button that failed), fresh with total from `sim.run.total` and expected from `sim.exact.eText` plus a created link, stale with `simNoteStaleEl.textContent.trim()`. Rewrite the DOM only when the state or text changes, so a focused link survives a drag.
- Update the smoke per the interfaces and behavior, including stale "two control roots" comments that this makes false.

Run `node tools/check-engine.mjs`, `node tools/check-page.mjs`, `--plain`, `--width 360`, `--fault render`, `--fault later`. Commit only index.html as `feat(quick-261105-emn): lead with the table and chart, drop the Baseline table, add the try row, roll button, steppers and compare switch`.
  </action>
  <verify>
    <automated>cd C:/Projects/GameDesignSkills/DnD-CombatRollSimulator && node tools/check-engine.mjs | tail -1 | grep PASS && node tools/check-page.mjs | tail -1 | grep PASS && node tools/check-page.mjs --plain | tail -1 | grep PASS && node tools/check-page.mjs --width 360 | tail -1 | grep PASS && node tools/check-page.mjs --fault render | tail -1 | grep PASS && node tools/check-page.mjs --fault later | tail -1 | grep PASS && ! grep -q 'id="cmp-base' index.html</automated>
  </verify>
  <done>All six commands print PASS, the page order and tab order match the guards, #cmp-base is gone, the three-track card column holds at 1366, and --scroll-pad values come from measurement.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Roll marks, short notes, contrast, remaining copy, docs and the full sweep (C7, C8)</name>
  <files>index.html, DESIGN.md, .planning/PROJECT.md, CLAUDE.md</files>
  <read_first>
    - index.html regions: run marks CSS 394-415, narrow tier 355-373, renderOutcomeTable, renderLegend, renderFootnote, smoke `sim marks ui` from 5142
    - DESIGN.md lines 11, 163, 197, 218, 250-258, 284-310
    - .planning/quick/260927-1ty-make-the-page-more-space-dense/260927-1ty-PLAN.md lines 86-141 (harness)
  </read_first>
  <behavior>
    - Smoke `sim marks ui`, seed 6 at the defaults: 15 marked elements remain; no `[data-n]` anywhere in #outcome or the legend; `.roll-many` count 1 (cell 11,1); ×N on every rolled row, equal to the count of that d20 in `sim.run.rounds` for every row; compact tables have none.
    - Legend: the fifth item's sentence is the C8 sentence; its swatch has `.roll-many`.
    - Short notes: `auto-miss` and the flip note carry `data-short` values `miss` and `at +1`; full words stay in textContent.
    - Chart intro holds the C7 sentence.
  </behavior>
  <action>
RED: Change the `sim marks ui`, legend and short-note smoke checks per the behavior, with literals split. `node tools/check-page.mjs` must fail on those checks only. Commit only index.html as `test(quick-261105-emn): expect heavier rings, row counts on hit rows and short phone notes`.

GREEN:
- C8 marks: remove `data-n` and both `.roll[data-n]::after` rules. Add `.outcome .roll-many::before, .swatch.roll-many::before { border-width: 3px }`. Note counts per the interfaces. Rewrite the CSS and function comments. Legend per C8.
- C8 short notes: `noteFor` gives `.note-miss` `data-short="miss"`, and the flip span gets `data-short="at +1"`. Generalize the narrow-tier `.note-th` rules to `.outcome [data-short]` and its `::after`. Widen `.note-count`'s narrow margin to `var(--sp-1)`.
- C8 contrast: light `--miss-ink` per the interfaces; dark stays.
- C7: the chart intro sentence. Search the markup and VM strings for `the settings above`, `Baseline`, `three`, `the table above`, `the numbers above`, `below`, `above`, `at the top`, `further down`, and record each result in the SUMMARY. Expected still true: `the settings above`, the sim's `The numbers above are exact averages` (tables, stats, chart, compare and kill all precede it), the Try this `controls at the top of the page`, the kill intro's `last roll below`, `the note under the table` (now guaranteed by .table-col), `the links below`.
- Docs, only where untrue. DESIGN.md: both miss-ink mentions, layout (page order, card column, compare at 52rem, one at a time, sticky verdict rule), Verdict Line, new stepper, try-row and switch notes, and the roll ring. .planning/PROJECT.md line 81 and CLAUDE.md line 15: two tables side by side, not three. Search PRODUCT.md and README.md too and record the result. Leave CLAUDE.md's Technology Stack research tables as they are: they record the original research, not the page.

Commit index.html as `feat(quick-261105-emn): mark repeat rolls with a heavier ring, count every rolled row, shorten phone notes and raise miss contrast`, then the docs as `docs(quick-261105-emn): keep DESIGN, PROJECT and CLAUDE true to the new page`.

Sweep (edit only to fix a defect; commit fixes as `fix(quick-261105-emn): ...`). Keep the harness in the session scratchpad and delete it at the end.
1. Harness geometry, light theme, recording numbers:
   - Widths 1920, 1366x768, 1366x900, 1144 (70rem page + 24px padding), 1143, 1100, 1048 (64rem page + 24px padding), 1047, 800, 480, 360, 320: `scrollWidth == clientWidth`. Record the card track count at 1366, 1100 and 1048.
   - Bar at 1366x768 with defaults: about 131px, recorded. Worst case with the 178-character sentence and a clamp note: recorded against --scroll-pad. The chart plus readout still fits under the bar at 1366x768 (`--plot-w`'s 21rem); adjust if it does not.
   - The lesson: the y of `#chart` at 1366 and 360 before (2255, 4505 from the critique) and after; the empty height under the left column at 1366.
   - Sticky: at 1366 the bar stays at top 0 after scrolling to #chart and #sim; at 360 only #verdict sticks and #verdict-why has scrolled away; sticky height at 320 recorded against today's worst case of 152px.
   - Focus: `.focus()` onto #hp-num, #roll, #roll-table, a `.btn-try`, an explore preset, #fold-formulas and #chart-data-summary after scrolling; each top >= sticky bottom with its 2px ring uncovered, in both modes.
   - Fault mode via harness: #verdict-why computes display none at 1366 (the [hidden] trap).
   - 360, d12: table width <= 336; force the worst notes (`hits at +1` and auto-miss with ×2) and check one line and an unchanged row height.
   - 360 and 1366 with `?test`: self-test pass. Fold state at both widths: formulas and marginal closed; log open at 1366 and closed at 360 after a roll.
   - Coarse: in a scratch copy replace `(pointer: coarse)` with `all` and assert steppers are visible and 44 by 44, Attack and Damage share one row at 320, 360 and 800, no sideways scroll, spinners hidden, hidden at 1366; every other control still >= 44px.
   - Switch at 360: both radios show the right table with no state or URL change; `#cmp-summary` visible in both.
   - Contrast: read the rendered 12px miss text against the darker stripe in light mode, >= 4.5:1.
   - URL: a try-row preset and a stepper write the query; the switch and the roll write nothing; `?test` keeps its own.
2. Full checks, each must print PASS: `node tools/check-engine.mjs`, `node tools/check-page.mjs`, `--plain`, `--width 390`, `--width 360`, `--fault render`, `--fault later`, and `node tools/check-page.mjs "file:///C:/Projects/GameDesignSkills/DnD-CombatRollSimulator/index.html?ac=25&die=12&atk=0&dmg=0&n=6&hp=100" --plain --expect "Killing a 100 HP enemy" --expect "between +5 and +6"`. Self-test under 200 ms. CSP unchanged: `git diff c5fa1cc -- index.html | grep -c Content-Security-Policy` is 0.
3. Detector: `C:/Users/alexy/.claude/skills/impeccable/scripts/impeccable detect --json index.html` from the repo root. The known eight are documented in DESIGN.md (2 border-accent-on-rounded, 1 repeating-stripes, 2 design-system-color, 3 design-system-font-size). Fix any new finding, re-run once, report the exact count.
4. Screenshots, inspect each with the Read tool, one line each: 1366 light and dark at the top; 1366 light scrolled to #chart; 1366 light #compare; 1100 light #tables; 360 light and dark at the top; 360 with a roll present (counts and short notes); 360 #compare with the switch; legend close-up in both themes.
5. Cleanup: delete every scratch file. `git status --short` shows only the quick directory and the SUMMARY. Do not push.
6. SUMMARY: scroll-pad values; geometry numbers; check output; detector count; screenshot lines; copy search result; the row-track correction and the two extra copy fixes as deviations; the "Left as they are" list with reasons.
  </action>
  <verify>
    <automated>cd C:/Projects/GameDesignSkills/DnD-CombatRollSimulator && node tools/check-engine.mjs | tail -1 | grep PASS && for m in "" "--plain" "--width 390" "--width 360" "--fault render" "--fault later"; do node tools/check-page.mjs $m | tail -1 | grep PASS || exit 1; done; ! grep -q 'data-n="' index.html && ! grep -q 'Damage always wins' index.html && ! grep -q 'vs baseline' index.html && grep -q 'roll-many' index.html</automated>
  </verify>
  <done>Every check mode prints PASS, the grep gates hold, the harness gates hold with numbers recorded, the detector shows no new finding, screenshots are inspected, scratch is deleted, and `git status -sb` shows main ahead of origin/main with nothing pushed.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| URL query to page state | Unchanged from 261104-vx6; every value passes parseControl. This task adds no new read. |
| Stepper click to state | New write path; values come from state plus a fixed data attribute, through parseControl. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-emn-01 | Tampering | onNudgeClick | mitigate | parseControl clamps every result; data-nudge is shipped markup and is read through Number; the smoke pins the limits and aria-disabled. |
| T-emn-02 | Tampering (DOM injection) | #roll-table-note, note counts | mitigate | The note uses textContent and createElement; counts stay integers coerced with `\| 0` before innerHTML (T-03-11). |
| T-emn-03 | Spoofing (false claim) | #verdict-why, caption | mitigate | Winner from formulaView only, numbers from the card's own strings, hit wording from an exact integer test; I1 rebuilds the sentence independently at all 70,980 settings. |
| T-emn-04 | Spoofing (false claim) | Page in fault mode | mitigate | #verdict-why hides with #verdict; the `:not([hidden])` selectors keep the `display: inline` rule from revealing it; check-page and the harness confirm. |
| T-emn-05 | Denial of service (a11y) | Sticky bar covering focus (WCAG 2.4.11) | mitigate | scroll-padding-top from measured heights; the focus gate in the sweep covers the new controls. |
| T-emn-06 | Tampering | CSP and the one-Math.random gate | mitigate | The CSP line stays byte-identical (sweep), and both Roll buttons share `onRoll`, so check-engine's static gate still holds. No external request is added. |
| T-emn-07 | Information disclosure | Compare switch, roll | accept | Neither touches the URL; the smoke proves it. No user data exists on this page. |
</threat_model>

<verification>
- `node tools/check-engine.mjs` prints CHECK-ENGINE PASS with the new I1 counts.
- `node tools/check-page.mjs` prints CHECK-PAGE PASS in default, --plain, --width 390, --width 360, --fault render, --fault later, and on the shared-URL command.
- Self-test under 200 ms in Chrome; the harness reports pass at true 360 and 1366.
- Geometry, sticky, focus, coarse, switch, contrast and URL gates are recorded in the SUMMARY.
- The detector shows no finding beyond the documented eight.
- `git log` shows test-then-feat commits for each task, each with the Co-Authored-By line; nothing pushed.
</verification>

<success_criteria>
- Every decision C1-C8 is implemented with its exact strings, and nothing under "Left as they are" changed.
- A designer sees the table, the cards, the reason and a preset on the first screen at 1366, and the chart is the next thing below.
- Every number and sentence stays true at every setting and in the new order; the math is untouched.
- One file, no CDN, no build step, CSP unchanged, all dev checks pass, nothing pushed.
</success_criteria>

<output>
Create `.planning/quick/261105-emn-apply-critique-backlog/261105-emn-SUMMARY.md` when done.
</output>
