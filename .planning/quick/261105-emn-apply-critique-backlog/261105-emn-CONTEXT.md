# Quick Task 261105-emn: Apply the open critique backlog - Context

**Gathered:** 2026-11-05
**Status:** Ready for planning

<domain>
## Task Boundary

User request: "apply them all", answering a report that listed the open backlog in
`.impeccable/critique/2026-11-05T08-08-26Z__index-html.md` plus a few small flaws.
Apply the decisions below to `index.html`, with guards in `tools/check-engine.mjs` and `tools/check-page.mjs`.
Update DESIGN.md, PRODUCT.md, `.planning/PROJECT.md` and CLAUDE.md only where this task makes them untrue. Do not push.

PRODUCT.md rules bind: every number and sentence is true at every setting, exact math, one file, no CDN, no build step, CSP unchanged, voice short and plain.
Refinement, not redesign: keep the tokens, Georgia + system-ui, 4-24px spacing, flat ruled surfaces, no shadows, no transitions (Phase 3 D-16).
This user approved reordering the page and removing the Baseline table. Both reverse earlier decisions on purpose.
</domain>

<decisions>
## Locked decisions

### 1. Page order and the outcome section (P1)
- `main` children become: header, noscript, div#bar, p#try-row, section#tables, section#chart, section#compare, section#kill, section#sim, section#explore.
- `#stats` moves inside `#tables`, after the table. It holds the six key cards, then the marginal card, then the formulas card (marginal first: it is the lesson).
- New `div.table-col` wraps `.table-wrap` and `#crit-note`, so the footnote always sits directly under the table.
- DOM order in `#tables`: h2, #two-rolls, #legend, .table-col, #stats. Phones read it in that order.
- At page >= 64rem: `grid-template-columns: minmax(0, 1fr) 43rem; grid-template-areas: "head head" "explain tcol" "legend tcol" "stats tcol"; grid-template-rows: auto auto 1fr;`. Cards use `minmax(11rem, 1fr)` tracks there (3 per row at 1366, 2 at 1100). Marginal and formulas cards span every track. The old `.card.formulas` / `.card.marginal` half-width rules and the old "note" area go.
- Both folds (`How these numbers are worked out`, `How this is worked out`) are closed in the markup at every width. Live text inside them still updates. Remove init's close-under-40rem for these two.

### 2. Baseline table dropped (P1)
- Remove `#cmp-base` and `#cmp-base-stats` from the page. `.trio` keeps two tables, `#cmp-hit` then `#cmp-dmg`.
- `compareView` keeps `tables.base` for the delta, summary and heatMax, so colors do not change.
- Stats lines say `· +22.5 vs the main table` (was `vs baseline`).
- `#compare` intro: `The same attack two ways: with +N added to the attack roll, and with +N added to the damage roll. Compare both with the main table above. All tables share its color scale, so the same damage is the same color everywhere.`
- Side by side at `@container compare (width >= 52rem)` (2 x 400px d12 tables + gap); one at a time below it (see 4).

### 3. Verdict: reason, 20-round units, and the crossing (P2)
Numbers are the 20-round tenths that the "Value of the next +1" card already prints, so the winner can never contradict the card. The winner still comes only from formulaView's win result.
- The lead stays as is. `rest` becomes `why`:
  - damage ahead: ` Over 20 rounds it adds 11.0: 1 more on each of your 11 expected hits. +1 to hit adds 4.5: one more hit.`
  - hit ahead: ` Over 20 rounds it adds 6.5: one more hit. +1 to damage adds 6.0: 1 more on each of your 6 expected hits.`
  - zero-hit: ` Over 20 rounds +1 to hit adds nothing (<reason>); +1 to damage adds 19.0: 1 more on each of your 19 expected hits.`
  - tie: ` Over 20 rounds each adds <X>.` / about even: ` Over 20 rounds both add about <X>.`
- Expected hits are `hitFaces` (an integer: 20 rounds x k/20). Singular: `1 more on your 1 expected hit`.
- "1 more on each of your k expected hits" is true only when the 20-round damage gain equals k exactly. When damage floors at 0 use `1 more on each hit that deals damage`. Decide with an exact integer test; check-engine proves it across every setting.
- Crossing sentence appended only when the sweep has at least one crossing: reuse `captionCross` verbatim so it matches the chart caption (`The curves cross once, at +6.`). If a single crossing has no `tieN`, name the gap from the crossing's own data: `The curves cross once, between +3 and +4.`; if captionCross gets this wording, the chart caption and its oracle change with it. Use the memoized chart base, never a second sweep.
- DOM: `p#verdict` keeps the lead and `.verdict-meta` (settings + Change). New `p#verdict-why` directly after it inside `#bar` holds the rest, using `setNumbered`.
  - Below the sticky widths `#verdict` sticks (lead and settings only) and `#verdict-why` scrolls away, so the sticky area on a phone gets shorter, not taller.
  - At sticky widths both are inline in one paragraph flow inside the bar. Measure: the bar must stay about 131px at 1366x768 with the defaults, and it must not cover focus.
- Re-measure `--scroll-pad` worst cases and update the numbers in its comment.
- Fault mode hides `#verdict-why` too.

### 4. Phone scroll (P2)
- **Steppers:** Attack and Damage boxes share one row at coarse pointers below the 70rem page width, each as `[−][number][+]` with 44px buttons. New `button.btn-nudge[data-nudge-key][data-nudge="±1"]`, `aria-label="Attack bonus down 1"` etc. `display: none` everywhere else, so they add no tab stops at laptop widths or to the sticky strip. They go through parseControl and setState, `aria-disabled` at the limits, disabled before init and in failPage. Must fit 320px with no sideways scroll. Hide the number spinners where the steppers show.
- **One comparison table at a time:** `fieldset.cmp-switch` with radios `#cmp-show-hit` (checked) and `#cmp-show-dmg`, name `cmp-show`, no `data-key`, labelled `To hit` / `To damage`, styled like `.segs` with natural width. Under the 52rem compare width show only the chosen `.cmp`, CSS only (`#compare:has(#cmp-show-dmg:checked)`). Without `:has()` both show, which is fine. At or above 52rem the switch is `display:none` and both tables show. `#cmp-summary` stays visible, so both totals are always readable.
- **Collapsed log:** the round log goes in `<details class="fold sim-log-fold" open><summary>Round by round</summary>`. Init closes it under a 40rem page, as the other folds did.

### 5. Roll beside the table (P3)
- New `p.table-roll` at the top of `.table-col`: `button#roll-table.btn-roll` labelled `Roll 20 rounds`, then `span#roll-table-note`.
- `#roll` stays in the sim section. Both buttons run the same handler. Both are disabled before init and in failPage. Roll stays the only accent-filled action.
- Note text, from the sim view's own strings, never recomputed:
  - before any roll: `Outlines each cell it lands on.`
  - after: `This run: 61 damage; expected 54.0.` + link `See the rounds` to `#sim`
  - stale: `Settings changed. Roll again to compare.`

### 6. One-line presets (P1)
- `p#try-row` directly after `#bar`: `Try:` then three `button.btn-preset.btn-try[data-preset]`, labelled with the preset titles: `A crossover`, `No crossover`, `The cap flips it`. Same `aria-describedby` as the explore buttons. A delegated listener calls `applyPreset`, and `presetBtns` includes them. Natural width, 32px (44px coarse). Not sticky.

### 7. Copy
- Preset title `Damage always wins` becomes `No crossover`, in the view, the HTML and every oracle.
- Chart intro gains: `The line at the top is about the very next +1; this chart adds N all at once.`
- Search for copy made false by the new order: `the settings above`, `Baseline`, `three`, `the table above`, `the numbers above`. Sim's `The numbers above are exact averages` stays only if true.

### 8. Small flaws
- **Go to the controls:** give that link and its separator a class and `display:none` inside the block where the bar is sticky. The tab order guard allows for it.
- **×2 badge:** remove the `data-n` straddling badge everywhere. Hit cells rolled 2+ times get `.roll-many` (3px ring). The note column shows the row's `×N` on every rolled row, normal hits included. Legend sentence: `Outlined: rolled in your last 20 rounds; a heavier outline means that exact cell came up more than once. ×N in the note column counts how often that d20 face came up.` The legend swatch shows `.roll-many`. The row count must equal the sum of that row's cell counts on hit rows (extend the marks oracle).
- **Tight phone notes:** in the narrow tier use the existing `data-short` technique: `auto-miss` shows `miss`, `hits at +1` shows `at +1`; full words stay in the DOM. `×N` keeps its gap, so it no longer reads like arithmetic.
- **Miss text contrast:** light `--miss-ink` drops until 12px miss text is >= 4.5:1 on the darker hatch stripe (measured 3.72:1 today). Update the DESIGN.md token.
- **500 HP:** when a step applies 0 HP, the label is `+1 hit` / `−1 hit` with no `(0 HP)`.

### Left as they are, with reasons (report these)
- Chart Y scale rescaling: a fixed scale would flatten d4 at low bonuses to fit d12 +20.
- Typing "25" passing through AC 10: changing it reverses the live-update rule on number boxes.
- Skip link: guard 15 and the user's request make the community link the first tab stop.
- `td.m` reading only "0": the row's note and caption carry it; adding text to 240 cells costs self-test time.
- AC by die grid (a critique question, not a finding): a new feature, not a fix.
- Detector's 8 items: documented deliberate choices and false positives in DESIGN.md.
- Bar growing when a clamp note appears: rare and temporary.

### Claude's Discretion
Exact CSS values on the 4-24 scale, helper names, and how to split guards between check-engine, the UI smoke and check-page.
</decisions>

<guards>
## Guards (write failing checks first, per project convention)
- check-engine I1 rebuilds the new sentence independently across all 70,980 settings: lead, numbers, the exact-integer choice of hit wording, and the crossing sentence against `DiceMath.crossings`.
- Compare oracle: `vs the main table`, summary unchanged.
- Presets oracle: new title. HP step label at both limits.
- UI smoke: order `cmp-hit cmp-dmg`; marks; `.roll-many`; note counts on hit rows; `#roll-table` rolling and marking the table; note text in all three states; `#try-row` applying a preset; stepper clamp and aria-disabled; switch radios change no state and no URL.
- check-page: (11) tab order (legal at every mode it runs: nudges and switch only where shown); (14) page order, including #try-row; bar children `form#controls, p#verdict, p#verdict-why`; (16) defaults string of the new verdict; fault mode: `#roll-table`, `.btn-try`, `.btn-nudge` disabled, `#verdict-why` hidden; PAINTED_SECTIONS still lists every painted section; #cmp-base absent.
- Self-test budget: Chrome under 200 ms, currently 185-190 ms in Node, so new self-test checks must be cheap. Removing a rendered table helps; do not spend it all.
- Every mode must pass: `node tools/check-engine.mjs`; `node tools/check-page.mjs` with default, `--plain`, `--width 360`, `--fault render`, `--fault later`.

## Windows note
Heredocs in Git Bash can drop backslashes in regexes. Use the Edit tool for regex code and re-read what landed.
</guards>

<canonical_refs>
## Canonical References
- `.impeccable/critique/2026-11-05T08-08-26Z__index-html.md`
- `.planning/quick/261104-vx6-impeccable-suite-improvements/261104-vx6-CONTEXT.md` (the structures this task changes)
- `PRODUCT.md`, `DESIGN.md`
- `C:/Users/alexy/.claude/skills/impeccable/reference/craft-floor.md`
</canonical_refs>
</content>
