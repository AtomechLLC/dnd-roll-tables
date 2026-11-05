# Quick Task 261104-vx6: Impeccable suite improvements - Context

**Gathered:** 2026-11-04
**Status:** Ready for planning

<domain>
## Task Boundary

User request: "Run the whole impeccable suite and then accept its improvements for the page."
Apply the improvements below to `index.html`, with guards in `tools/check-engine.mjs` and `tools/check-page.mjs`.
DESIGN.md is written after this task by a separate step. Do not write it here. Do not push.

Sources: `.impeccable/critique/2026-11-04T01-12-44Z__index-html.md` (critique 26/40) and the technical audit below.
PRODUCT.md rules bind: every number and sentence is true at every setting, exact math, one file, no CDN, no build step, CSP unchanged, voice short and plain.
Refinement, not redesign: keep the parchment/candlelit tokens, Georgia + system-ui, 4-24px spacing scale, flat ruled surfaces, no shadows, no transitions (Phase 3 D-16).
</domain>

<audit>
## Technical audit (2026-11-04): 16/20 Good

| Dimension | Score | Finding |
|---|---|---|
| Accessibility | 3 | Text contrast min 4.6:1 in light mode (measured over all text nodes). Row-label badges cover the d20 labels. Chart has no text alternative for its 21 values. |
| Performance | 4 | Full recompute inside a frame (K9 gate); no external requests. |
| Theming | 4 | Every color is a token; dark values are designed. Browser surfaces (selection, scrollbar, caret) are unthemed: P3. |
| Responsive | 2 | Every control 32px tall on touch screens (below 44px; above WCAG 24px). No sideways scroll at 1366. |
| Implementation integrity | 3 | Detector 3 findings, all false positives (focal ink rule x2, miss hatch). |
</audit>

<decisions>
## Locked decisions

### 1. Sticky bar and one control strip (critique P1: the main loop is split across the page)
- New wrapper `<div id="bar">` directly in `main`, holding `form#controls` then `p#verdict`.
- Move the Compare at +N group (`#n-range`, `#n-out`) into `form#controls`, after Damage bonus. Remove `form#compare-controls`. The n range stays driven by CONTROL_SPEC in init.
- Move the Enemy HP group out of `#controls` into a new `form#kill-controls` (see 2). The strip then fits one row: AC, die, attack, damage, +N, Reset.
- `main` changes from grid to `display:flex; flex-direction:column` with the same gap, because a sticky grid item only sticks inside its grid area. Direct children keep `min-width:0`.
- Wide (page container >= the width where the strip truly fits one row, about 67rem; measure it): `#bar` is `position:sticky; top:0; z-index` above the table badges, opaque paper background, 1px `--line` bottom rule, no shadow. Only when viewport height >= 40rem.
- Narrower: `#bar { display: contents }`, the strip scrolls away and only `#verdict` is sticky at the top.
- `html { scroll-padding-top }` set per the same widths/heights so tabbing and `#chart` / `#controls` jumps are never hidden under the bar (WCAG 2.4.11).
- Sticky must not produce sideways scroll or cover the focus ring.

### 2. Kill section moves below the chart (critique P1 and question 3)
- New `<section id="kill" aria-labelledby="kill-h">` between `#chart` and `#sim`, holding `h2#kill-h`, a short intro, `form#kill-controls` (HP box, +/-1 hit buttons, hits line, hp status), the three kill cards and the kill note. Removed from `#stats`.
- `#kill-h` ships with static text "Killing a 40 HP enemy" (same as the default heading), so it is never empty before scripts run.
- Cards keep label/value/sub subgrid alignment. At page >= 64rem cards take 3 of 6 tracks with the note beside them, as today.
- Listeners: `[form, killForm]` replace `[form, compareForm]`; step clicks listen on `killForm`; `stepBtns` selector updates. `PAINTED_SECTIONS` gains `kill`.
- Page order becomes: header, div#bar, section#tables, section#stats, section#compare, section#chart, section#kill, section#sim, section#explore.

### 3. Verdict line (critique P1: the answer is buried)
- `p#verdict` shows, generated in the view-model as `view.verdict`, with `lead` in bold:
  - zero-hit: lead `+1 to damage wins here.` rest ` +1 to hit adds nothing (<reason>); +1 to damage adds <dmgRound> per round.` Reasons: cap `it already hits on 2+, the 95% cap`; floor `still only a natural 20 hits`; nodmg `the extra hits deal 0 damage at this penalty`.
  - hit ahead: lead `+1 to hit wins here.` rest ` It adds <hitRound> per round; +1 to damage adds <dmgRound>.`
  - damage ahead: lead `+1 to damage wins here.` rest ` It adds <dmgRound> per round; +1 to hit adds <hitRound>.`
  - tie: lead `They tie here.` rest ` Each adds <hitRound> per round.` / about even: lead `They are about even here.` rest ` Both add about <hitRound> per round.`
- The winner comes from the same `formulaView` win result, never a second comparison. Must always agree with `#f-plus-win-live` and the card values.
- At narrow widths `#verdict` also shows `<span class="verdict-set">` = `VM.settingsText(params)` + `, compare at +N`, and a `<a href="#controls">Change</a>` link. Both `display:none` at sticky-strip widths.
- check-engine: across all 70,980 settings verify the lead against the existing independent verdict oracle (check-engine ~line 455) and verify the displayed numbers do not contradict the lead (the winner's displayed value is never less than the loser's). If a rounding contradiction exists, report and fix the sentence, not the check.
- Visual weight: 1rem prose on paper, lead 700. Not a card.

### 4. The +1 on the main table (critique question 2)
- `view.flipRow`: `threshold - 1` when `marg.reason === null`, else null. In `#outcome` only, that row's note cell shows `<span class="note-flip">hits at +1</span>` in muted italic.
- check-engine: across all settings, flipRow is the only d20 row that misses at `atk` and hits with damage > 0 at `atk + 1` under DiceMath; null when none exists.

### 5. Roll marks stop covering labels (critique P2, confirmed in the browser)
- Row-header marks keep the outline ring, lose the straddling badge, and the count moves to the note cell: `<span class="note-count" aria-hidden="true">×N</span>` after any note text, shown at every N >= 1. Remove `data-down`, the chain logic and the `th.roll` badge CSS. Hit-cell badges stay.
- Narrow tier `--note: 72px` (d12: 24 + 240 + 72 = 336, still fits a 360 viewport) so `auto-miss ×2` and `hits at +1 ×2` fit.
- Legend sentence: `Outlined: rolled in your last 20 rounds (×2 = rolled twice). Misses and crits are counted in the note column.`

### 6. Legend swatches (critique minor)
- Crit swatch shows the word `crit`; rule swatch shows `hits`, so neither reads as an empty or highest-damage box. Contrast >= 4.5:1 in both themes.

### 7. Reset (heuristic 3)
- `<button type="button" id="reset" class="btn-reset">Reset</button>` last in `#controls`. Same look as `.btn-step` with natural width. Ships disabled, enabled last in init, disabled in failPage. Sets every key of `DEFAULT_STATE` through parseControl in one setState. `aria-disabled="true"` when state already equals the defaults (keeps focus; returns before any write).
- `p#reset-status.vh role=status` announces after a click only, using the lastPreset pattern: `Back to the defaults: AC 15, d8, +5 to hit, +0 damage, compare at +5, Enemy HP 40.` built from DEFAULT_STATE. render() clears it once state moves on.

### 8. Shareable settings in the URL (heuristic 7)
- Pure `VM.stateFromQuery(search)` (through parseControl; garbage falls back to the default) and `VM.queryFromState(state, keep)` (omits defaults, preserves other params). Read in init before the first render; written with `history.replaceState` at the end of render only when the string changes, in try/catch (file:// and rate limits). Both are skipped when `?test` is present so the self-test stays deterministic.
- check-engine: round-trip across a sweep plus garbage (`ac=abc`, `die=7`, `atk=999`, `hp=-3`, repeated keys).

### 9. Clamp messages (heuristics 5, 9)
- Pure `VM.clampNote(key, raw, applied)`, returns '' or one sentence. Out of range: `Target AC goes up to 30, so 40 became 30.` / `goes down to`. Not a number: `Target AC needs a number, so it stayed at 15.` Fraction: `Target AC takes whole numbers, so 15.5 became 16.` Labels match the visible labels.
- Written on `change` for number inputs only, never during drags, to `p#ctl-note` (in `#controls`, full row) or `p#hp-note` (in `#kill-controls`) with role=status, hidden when empty, cleared by the next control input in that form.
- check-engine covers each branch.

### 10. Compare summary (critique P2 phone)
- `p#cmp-summary` under the compare intro, from the compare view's own strings: `Over 20 rounds: 54.0 as set, 76.5 with +5 to hit, 81.0 with +5 to damage.` (values illustrative; use the view). Must equal what `.cmp-stats` print; extend the existing compare oracle.

### 11. Progressive disclosure (critique P2 copy)
- The formulas card body and the marginal card's `.f-marg` go inside `<details class="fold" open><summary>…</summary>`. Summaries: `How these numbers are worked out` (keep it a heading inside the summary) and `How this is worked out`. init closes `details.fold` when the page is under 40rem; otherwise they stay open. Do not break `.formula` container queries.

### 12. Chart data table (Sam persona, audit)
- `<details class="chart-data"><summary>Chart data</summary><table>` under the chart readout: 21 rows, N, +N to hit, +N to damage, using the exact strings the readout uses. `<th scope>` headers, tabular numbers, updated in renderChart only when values change. Closed by default.

### 13. Copy (distill / clarify; meaning unchanged)
- Lede last sentence: `The line under the controls answers a design question: is the next +1 worth more on the attack roll or on the damage roll?`
- Chart h2: `Every bonus from +0 to +20`. Chart intro: `Expected damage over 20 rounds for every extra bonus from +0 to +20, at the settings above. Point at or drag across the chart to read any N; the +N slider in the controls sets the marker.`
- Sim intro: `The numbers above are exact averages. This rolls real dice for 20 rounds, so you can see how far one fight lands from the average. Nothing rolls until you click, and changing a setting never re-rolls.`
- Kill intro: `Rounds after a kill still roll and count toward the total. Changing Enemy HP re-scores the last roll below instead of rolling again.`
- Crit footnote: `* On a natural 20 you roll the damage die twice and add the bonus once (for a d8: 2d8 + damage bonus). Each column is one die face, so the crit row shows 2 × face + damage bonus, and averaged across the row that equals a real 2d8 crit. So this table's average is exactly the expected damage.` Keep the floor sentences.
- Footer last sentence: `Add ?test to the address to see the self-test that checks them.` Check the previous sentence still reads.
- Any other copy that says Enemy HP is "at the top" or that the slider is elsewhere must become true. Search for it.

### 14. Touch targets, type, browser surfaces (adapt / typeset / polish)
- `@media (pointer: coarse)`: number inputs, range inputs, die segments, `.btn-step`, `.btn-reset`, `.btn-roll`, `.btn-preset`, `.community`, summaries, the Change link and explore links reach 44px.
- `text-wrap: balance` on h1, h2; `text-wrap: pretty` on prose roles.
- `::selection` from accent + paper tokens, `caret-color: var(--accent)` on inputs, `scrollbar-color` from tokens on html, in both themes.
- Remove CSS and comments made obsolete (`.n-strip`, `#compare` flex rule, `data-down`, stale comments).

### Left as they are, with reasons
- Per-round third decimal (2.700): it is exact, and `= 54.0 ÷ 20` depends on it (known debt WR-01).
- Crit chance card: a stat requirement.
- Focal 3px ink rule and miss hatch: deliberate; documented as detector exceptions in DESIGN.md.
- No animation: Phase 3 D-16 chose instant results.

### Claude's Discretion
Exact CSS values on the 4-24 scale, the sticky threshold after measuring, naming of helpers, and how to split guards between check-engine, the UI smoke and check-page.
</decisions>

<guards>
## Guards to update (write failing checks first, per project convention)
- check-page (11) tab order and UI smoke (~line 5318): ac-range, ac-num, die, atk-num, dmg-num, n-range, reset, `#controls` (Change), fold summaries, chart-data summary, hp-num, hp-minus, hp-plus, roll, presets, `#chart`, `#controls`, with the community link first. Make `isFocusable` include `summary`.
- check-page (14) page order. Fault-mode section list gains `kill`; `#verdict` hidden in fault mode.
- Button-enabled and fault checks include `#reset`.
- UI smoke: `#controls > .group` (~5203), marks (~4785), hp ui, notes.
- New check-page guard (16): `#bar` exists and `#verdict` is non-empty at the defaults.
- All must pass: `node tools/check-engine.mjs`, `node tools/check-page.mjs` in `--plain`, `?test` default, `--fault render`, `--fault later`, `--width 360`-style modes, self-test under 200 ms in Chrome.
</guards>

<canonical_refs>
## Canonical References
- `.impeccable/critique/2026-11-04T01-12-44Z__index-html.md`
- `PRODUCT.md`
- `C:/Users/alexy/.claude/skills/impeccable/reference/craft-floor.md`
</canonical_refs>
</content>
