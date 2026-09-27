# Phase 4: Designer Explanation & Final Ship - Research

**Researched:** 2026-09-26
**Domain:** Live generated explanation copy in a vanilla single-file page, headless-Chrome accessibility guards, review-fix hardening, and GitHub Pages publishing through `gh` on Windows/Git Bash
**Confidence:** HIGH. Every engine claim below comes from running the page's own `#dice-math` / `#view-model` blocks in Node over the full 70,980-setting domain, and the tool and shell behaviour was tested on this machine. The gh/Pages API facts come from the official docs. MEDIUM only where noted: gh's git-credential wiring and real-browser favicon behaviour.

## Summary

The stack is settled and no packages are added. Phase 4 is four kinds of work on one file (`index.html`) and two dev tools: (1) new view-model copy builders, (2) markup, CSS and render wiring for the UI-SPEC blocks, (3) fixes for seven review warnings plus the legend swatch, and (4) one human-gated publish run. Every piece of copy in the UI-SPEC maps onto values the page already computes (`statsView`, `DiceMath.marginals`, `hitAverages`, the memoized `chartBase` sweep, `crossings`, `attackBands`). The only new engine-facing work is exposing a few exact numerators that `statsView` already has but does not return, and computing `straightFrom` from the damage series.

I verified the UI-SPEC's branch rules exhaustively. The rule-vs-table switch by **exact integer comparison** is correct. The closed form matches the table at 60,740 settings and differs at 10,240. A "D ≤ −2 means table" shortcut would be wrong at exactly 680 settings, all nat-20-only at D = −2. The per-round rule set and the `+1 to damage` rule set are **identical** (70,980 of 70,980). The UI-SPEC has one gap: at **80 settings** (nat-20-only, D = −2, e.g. AC 15 / d8 / −5 / −2), `+1 to hit` is in the table branch while `+1 to damage` is in the rule branch. The `Which wins` line must use the rule-branch inequality only when **both** +1 lines are in the rule branch. The two-roll sentence also needs an article rule ("**an** 8 / 11 / 18 or higher"), which the UI-SPEC's single example hides. Every preset claim and every UI-SPEC reference string was reproduced by the engine.

For the review fixes, re-deriving the check-engine (p) tolerance was done exhaustively. After the `E − SD <= 0` fix, the "About 2 runs in 3" band holds **0.6034 to 0.7882** of runs across all 2,470 distinct one-round distributions, and "Most runs" holds **at least 0.8140**. The fix changes exactly 2 distributions. A band of [0.60, 0.80) for "about 2 in 3" and ≥ 0.80 for "Most" follows from the page's own two wordings, not from the observed data. For publishing, the 01-03 runbook is still accurate, with three updates: gh is already installed, the README text is stale beyond the URL, and I tested MSYS path conversion here. `source[path]=/` passes through Git Bash unchanged, and only a bare `/` is rewritten.

**Primary recommendation:** Five sequential plans. Fixes and honest tools go first, then formulas with the two-roll text, then chart copy with presets, then the a11y guards and pre-ship gate, then publish. The publish plan is the only non-autonomous one. Build every copy string in pure VM functions that take **precomputed** inputs, so check-engine can assert them on all 70,980 settings without re-running sweeps.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Where the explanation lives
- **D-01:** The copy is woven into the existing sections, next to what it explains. There is no separate "How it works" article and no collapsible panels. Page order stays as it is: header → controls → stat cards → outcome table → Compare +N → sweep chart → Roll 20 rounds. The placements are:
  - **Two-roll structure and joint outcome space (COPY-01):** above or with the outcome table. This covers d20 to hit, then dX for damage, and why each cell is one (d20, die) pair that is equally likely.
  - **Live formulas (COPY-02):** beside or under the stat cards.
  - **Plateau, linear, and crossover (COPY-03, COPY-04):** under the sweep chart. The text refers to the shaded bands by their on-chart names ("95% cap", "only a nat 20 hits").
  - **Suggested explorations (COPY-05):** a short section at the end of the page.
- **D-02:** The voice is short, designer to designer. Each spot gets two to four sentences in plain words, one idea per sentence. Rules are explained only as far as the lesson needs. Existing section intros can be tightened or extended, but not replaced by long paragraphs.

#### Live formulas (COPY-02)
- **D-03:** Each formula shows the general rule in symbols, then the same rule with today's values substituted, ending in the result. All numbers update live with every control change, like the stat cards. Target shape at the defaults (AC 15, d8, +5 to hit, +0 damage):
  - Hit chance = faces that hit / 20 = (21 − (AC − bonus)) / 20, clamped to 1..19 faces (5%–95%) = (21 − (15 − 5)) / 20 = 11/20 = 55%
  - Expected per round = P(normal hit) × (avg die + D) + P(crit) × (2 × avg die + D) = 0.50 × 4.5 + 0.05 × 9.0 = 2.70
  - Value of +1 to hit vs +1 to damage: +1 to hit turns one more d20 face into a normal hit, worth (avg die + D) / 20 per round, and nothing once capped. +1 to damage adds 1 to every hit, worth P(hit) per round. +1 to hit wins only while (avg die + D) > 20 × P(hit).
- **D-04:** Every substituted number must equal the figure shown elsewhere on the page. The stat cards and the "Value of the next +1" card use the same rounding (STAT-02), so the formula and the card never disagree.
  - The closed form ignores the 0-damage floor, so it is only exact while the damage bonus is −1 or higher. Where the floor matters (D ≤ −2), the formula text must say so rather than print a number that disagrees with the exact card.
  - When hit chance is clamped (95% cap or nat-20-only), the substituted line shows the clamp explicitly.
- **Note:** during discussion the user approved a preview whose crit term read "P(crit) × avg die". That was a typo in the preview, and D-03's "P(crit) × (2 × avg die + D)" is the correct term. The preview's numbers (0.05 × 9.0 at D = 0) were already right.

#### Crossover, plateau, and linear copy (COPY-03, COPY-04)
- **D-05:** The crossover explanation is generated from the same `DiceMath.crossings` result the chart uses. The existing chart caption builders (`VM.captionOrder`, `VM.captionCross`, `VM.captionBands`) are the source to reuse or extend, not a second derivation.
  - The text has distinct wording for no crossing, one crossing, and two crossings, and never claims a crossover that isn't there.
  - Across all 70,980 real settings the engine finds at most one crossing (02-03-SUMMARY). The two-crossing wording is still required by COPY-03, but it is exercised only by synthetic series in tests.
- **D-06:** The plateau text explains the 5%–95% clamp: a nat 1 always misses and a nat 20 always hits, so past the cap +1 to hit buys nothing. The linear text explains that +1 damage adds the same amount to every hit. Both point at the shaded chart bands, and the band wording only appears when a band is actually on the chart at the current settings.

#### Suggested explorations (COPY-05)
- **D-07:** Each suggestion is a one-click "Try this" button that sets the controls. Its text says what to look for. There are at least two suggestions:
  - **A crossover:** AC 25 with a d12. At AC 25, +0, d12, +0, the damage bonus leads from +1 to +5 and +N to hit takes over at +6 (Phase 2 D-14 reference).
  - **Damage always wins:** AC 15 with a d8.
- **D-08:** A preset sets AC, die, attack bonus, and damage bonus through the normal control path (`VM.parseControl`), so the controls, outputs, and every section update exactly as if the user had set them. A rolled simulation run goes stale as usual (Phase 3 D-08). Each preset's description must be checked against the engine at those exact settings, so trying it shows exactly what the text says (success criterion 4).

#### Accessibility (DEPLOY-04)
- **D-09:** The page must meet DEPLOY-04: every control reachable and operable by keyboard with a visible label, and miss vs hit distinguishable without color. That includes the new "Try this" buttons and the Roll button.
- **D-10:** Automated guards are added to `tools/check-page.mjs` so this stays true:
  - every form control and button has an accessible label;
  - tab order reaches every control;
  - miss cells carry a non-color cue (the `0` text plus the striped miss style).
- **Carried forward:** Phase 2 D-13 already settled keyboard access to the chart. The hover readout follows the slider for keyboard and touch users, and there is no chart focus or keyboard scrubbing. This is not re-opened.

#### Review fixes before shipping
- **D-11:** Phase 4 fixes every open code review warning before the page goes public:
  - **02-REVIEW WR-01:** a view-model throw bypasses the engine-error banner. Check what Phase 3's guarded init already covers.
  - **02-REVIEW WR-02:** the caption and markers use exact numerators, while the readout and deltas use tenths, so they can disagree.
  - **02-REVIEW WR-03:** check-engine's 1-in-50 sample never reaches odd damage bonuses.
  - **03-REVIEW WR-01:** the spread wording test should be `E − SD <= 0`, not `< 0`. At AC 13, −5, d4, −3 the page wrongly says "About 2 runs in 3". The (p) tolerance also needs re-deriving, not fitting.
  - **03-REVIEW WR-02:** the `?test` smoke leaves run text in hidden elements.
  - **03-REVIEW WR-03:** `--expect` matches hidden and screen-reader-only text and joins adjacent elements.
  - **03-REVIEW WR-04:** listeners are wired before the guarded first render.
  - **The deferred legend crit-swatch shrink** at phone width (`.planning/phases/03-roll-20-rounds-simulation/deferred-items.md`).
  - Info-level findings are Claude's discretion.

#### Publishing (success criterion 5; DEPLOY-02 and DEPLOY-03 deferred from Phase 1)
- **D-12:** Publishing is the last step of the phase, after the copy, accessibility, and fixes are done and every check passes. The plan stops at one human checkpoint where **the user runs `gh auth login` themselves** in a terminal. The executor never authenticates for them. After auth, the plan runs the rest without further prompts:
  - create the public repo;
  - push `main`;
  - enable Pages from `main` at `/` through the REST API;
  - set the repo homepage;
  - check that the URL returns HTTP 200 and renders with no console errors.
- **D-13:** The Phase 1 repository decisions stand (Phase 1 D-11..D-13):
  - Public repo named `DnD-CombatRollSimulator`, default branch `main` (already renamed), with `.nojekyll` and `README.md` already at the root.
  - Pages publishes from `main` at `/`, so `.planning/` is served publicly, which was accepted.
  - The GitHub username comes from `gh api user` after auth, never guessed.
  - The README gets the real Pages URL once it's known.
- **D-14:** REQUIREMENTS.md marks DEPLOY-02 and DEPLOY-03 complete even though nothing is published yet. They should be treated as open until the publish step verifies them, and the traceability should record that they were verified in Phase 4.

### Claude's Discretion
- Exact copy wording within D-02's voice rules, and headings for any new sub-blocks.
- Visual treatment of the formulas: monospace block, definition list, or table. The only constraint is that they read as "rule, then numbers" and stay legible at phone width.
- How many "Try this" presets beyond the two required (for example a "95% cap" one or a "nat-20 only" one), what each one sets for +N, and where the buttons sit.
- Whether the explanation text is built in the view-model (the preferred route, so self-test and check-engine can assert it) or in the renderer.
- Which info-level review findings to fix alongside the warnings.
- How the publish URL check runs. `tools/check-page.mjs` already accepts a URL argument.

### Deferred Ideas (OUT OF SCOPE)
None. The discussion stayed within phase scope. Three options were offered and declined:
- A single "How it works" article, and collapsible "Why?" panels (D-01 chose woven copy).
- A fuller walkthrough voice with worked examples (D-02 chose short).
- Leaving the review fixes to a separate `/gsd-code-review --fix` run (D-11 folds them in).

**Also locked:** `04-UI-SPEC.md` (status: approved). It fixes the exact copy strings, the preset values (cross 25/12/0/0/n6, dmg 15/8/0/0/n5, cap 15/12/0/0/n15), the formula layout, a11y guards (9)–(13), and the handoff notes. The research below verifies it and fills its gaps. It does not reopen it.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COPY-01 | Explain the two-roll structure and the 2D table as the joint outcome space | `VM.twoRollsText(sv)` from `statsView` (threshold, hitState, die, critFloorDiffers). Article rule for thresholds 8/11/18. See Pattern 2 and Pitfall 3. |
| COPY-02 | Formulas for hit chance, expected per round, and +1 to hit vs +1 to damage, with live substituted values | `VM.formulaView(sv)` with exact-integer branch selection, verified on all 70,980 settings: rule 60,740 / table 10,240. The +1 lines: rule/rule 36,850, reason 28,100, table/table 5,950, **mixed 80**. See Pattern 3 and the Reference Values. |
| COPY-03 | Crossover text from the crossing list: distinct 0/1/2 wording, never a false claim | `VM.explainChart` reads the memoized `chartBase.crossings`. Real states: 0-damage 30,095, 0-attack 14,677, 1-adjacent 25,318, 1-across-tie 874, end-tie-only 16. Touch, 2+, and all-equal occur 0 times (synthetic tests only). See Pattern 4. |
| COPY-04 | Plateau (5–95% clamp) and linear explanations tied to the shaded bands | `attackBands` (no setting has zero bands). `straightFrom` from the damage series (0 at 60,740 settings, 1/2/3 at 2,730 each, 4 at 2,050). The hit-step variants are rule 60,060, floor-bites 9,828, nodmg 1,092. |
| COPY-05 | Suggested explorations, including AC 25 + d12 (crossover) and AC 15 + d8 (damage wins) | All three UI-SPEC presets were reproduced exactly (Reference Values). They go through `VM.parseControl`, then a single `setState(patch)` and one rAF render. See Pattern 5. |
| DEPLOY-04 | Keyboard operable, every control labeled, miss not color-only | Guards (9)–(13) on a mini element tree built from `--dump-dom`, plus a runtime focus smoke in `?test`, plus a manual keyboard walk. The DOM dump's limits are listed in Pattern 6. |
| DEPLOY-02 / DEPLOY-03 (deferred from Phase 1, per D-12..D-14) | Public repo on `main`, Pages from `main /` via REST, the URL returns 200 with no console errors | The Publish Runbook, updated from 01-03. MSYS conversion was verified. check-page runs against the live URL. The traceability update is in the Publish Runbook. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **One `index.html`**, inline CSS and classic inline `<script>` blocks. No build step, no frameworks, no CDN, no external `.js`/`.css`, no `npm`/`package.json`. (The Phase 1 decision refined the "inline module" wording in CLAUDE.md to classic scripts, per DEPLOY-01.)
- **GitHub Pages static only**, from branch `main` at `/`, with `.nojekyll`, and a **public** repo (GitHub Free).
- **Readability:** the 2D table stays legible at d12 and three side by side at about 1366px, and stacks on mobile. There is no horizontal page scroll.
- **Rendering rules:** build with `createElement`/`textContent`. `innerHTML` only for integers and fixed literals. `addEventListener` only (no inline handlers, CSP-safe). Listen for `input`, not `change`, for live updates.
- **Exact math from the table:** no Monte Carlo for displayed stats. Randomness only in the Roll click handler (`Math.random` appears exactly once).
- **Node is dev-only** (`tools/*.mjs`) and never a deploy dependency.
- **Git Bash on Windows rewrites `/`-prefixed arguments.** Use `MSYS_NO_PATHCONV=1` if needed. `POST .../pages` returns 409 if Pages exists, so use PUT then. The project URL is `https://<owner>.github.io/<repo>/`, and publishing can take up to 10 minutes.
- **GSD workflow:** file edits only inside GSD commands. Commit through the workflow.
- **User memory (binding):** never run `gh auth login` for the user. Stop at the checkpoint. Outside the publish plan, commit locally and do not push. The user prefers minimal interruptions, so the publish plan has exactly one human gate.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Copy strings (formulas, two-roll, chart explanation, preset status) | Browser: `#view-model` (pure) | — | Pure functions of exact values, so the self-test and check-engine can assert them in Node (CONTEXT discretion, preferred route) |
| Branch selection (rule vs table, clamp variants, crossing variants) | Browser: `#view-model` | `#dice-math` (exact numerators) | Decided by exact integer comparison on engine outputs, never by thresholds in the DOM layer |
| Painting copy, formulas, presets and status | Browser: `#app` (DOM layer) | — | `textContent` only. Same frame as the cards (rAF-coalesced `render()`) |
| Preset application | Browser: `#app` | `#view-model` (`parseControl`, `PRESETS`) | One parse path (D-08). One `setState` gives one render |
| Staleness of a rolled run | Browser: `#app` (`render()` comparison) | `#dice-sim` (`sameAttack`) | Already a pure comparison. Presets trigger it for free |
| Exhaustive copy/engine invariants | Dev tool: `tools/check-engine.mjs` (Node vm) | — | 70,980 settings are too many for the in-page budget |
| A11y and visible-text guards | Dev tool: `tools/check-page.mjs` (headless Chrome `--dump-dom`) | Browser `?test` smoke (runtime focus and visibility) | The dump proves structure. Only the live DOM proves focusability and layout |
| Hosting | GitHub Pages (static CDN) | GitHub REST via `gh` | Branch publishing from `main /`, `build_type=legacy` |

## Standard Stack

No new libraries or packages. Everything is hand-written and inline, per CLAUDE.md.

### Core (unchanged, verified present)
| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| `index.html` classic inline scripts | — | `#dice-math` → `#dice-sim` → `#view-model` → `#dice-selftest` → `#app` | The established block order. check-engine loads the four pure blocks by id [VERIFIED: codebase] |
| Native `<dl>/<dt>/<dd>`, `<ul>` + `<button>`, `<a href="#…">` | HTML | Formulas, presets, jump links | Required by the UI-SPEC. `<div>` wrappers inside `<dl>` are valid HTML [CITED: html.spec.whatwg.org/#the-dl-element] |
| CSS container queries, subgrid, `color-mix(in oklch)` | Baseline | Formula grid at `@container formula (width >= 40rem)`, preset card subgrid | Already used on the page (`#stats` subgrid, `#sim` container) [VERIFIED: codebase] |

### Tooling
| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| gh CLI | 2.101.0 | Repo create, Pages REST, homepage | `C:\Program Files\GitHub CLI\gh.exe`. **Not on the Git Bash PATH in this session**, so call it by absolute path. Not authenticated [VERIFIED: local probe] |
| Chrome | installed | `tools/check-page.mjs` headless `--dump-dom` | `C:\Program Files\Google\Chrome\Application\chrome.exe`. Edge is also present [VERIFIED] |
| Node | 24.15.0 | check-engine / check-page | Dev-only [VERIFIED] |
| curl | 8.7.1 (mingw) | Live URL HTTP status | Or Node's global `fetch` [VERIFIED] |
| git | 2.45.1, `credential.helper=manager` | Push | Branch `main`, no remote, working tree clean [VERIFIED] |

**Installation:** none.

## Package Legitimacy Audit

No external packages are installed in this phase, so there is nothing to audit. slopcheck was not run because there are no candidates. The page stays at zero dependencies, and the tools use only `node:` built-ins.

## Architecture Patterns

### System Architecture Diagram

```
 user input (slider/number/radio)      preset button click           Roll click
            │                                   │                          │
            ▼                                   ▼                          ▼
   onControl(e) ──parseControl──┐   applyPreset(key): each value     handleRoll(Math.random)
                                │   → parseControl → ONE patch        │ (sim.run, not state)
                                ▼                ▼                    ▼
                         setState(patch) ──► scheduleRender() (one rAF, coalesced)
                                                     │
                                                     ▼
                                   render(): VM.computeView(state)
                     ┌───────────────┬───────────────┼────────────────┬──────────────────┐
                     ▼               ▼               ▼                ▼                  ▼
              statsView(p)    formulaView(sv)  compareView(p,n)  chartView(p,n)      simExact(p)
              (+ exact nums)  twoRollsText(sv)                   └─ chartMemo[key] ─► chartBase(p):
                                                                     sweep → crossings → bands
                                                                     → markers, caption
                                                                     → explainChart(...)  (NEW, memoized)
                                                     │
                     stale = sim.run && !sameAttack(run.params, p)   (comparison, never a flag)
                     presetStale = lastPreset && !samePreset(state, lastPreset) → clear #explore-status
                                                     │
                                                     ▼
          RENDERERS: controls, stats(+formulas), table(+two-rolls), legend, footnote,
                     compare, chart(+explain), sim, explore        → textContent only
                                                     │
                     ┌───────────────────────────────┴──────────────────────────┐
                     ▼                                                          ▼
         ?test: runUiSmoke() (DOM checks, then reset)          tools/check-page.mjs --dump-dom
                                                               → visible text, a11y guards (9)–(13)
```

### Recommended structure inside `index.html` (additions only)

```
<style>        + .explain, .chart-explain, .card.formulas, dl.formulas, .formula, .f-*, .nw,
                 #explore…, .btn-preset, a (links), .legend-item > .swatch/.ramp {flex-shrink:0}
<main>         #stats: + div.card.formulas#formulas; #marginal + dl.formulas.f-marg
               #tables: + p.explain#two-rolls ; #chart .chart-wrap: + div.chart-explain
               + section#explore (last)
#view-model    + formulaView, twoRollsText, explainChart (called inside chartBase), PRESETS,
                 presetStatus; statsView returns an `exact` sub-object; readout fix (02 WR-02);
                 simExact `<= 0` (03 WR-01)
#dice-selftest + ≤ 4 cheap pins (settings already in sweepMemo, or statsView only)
#app           + renderFormulas/renderExplain/renderExplore, applyPreset, lastPreset,
                 init() restructure (03 WR-04), renderSim no-run reset (03 WR-02),
                 explore smoke block + reset
```

### Pattern 1: Expose exact numerators from `statsView` (cheap, no new engine calls)

**What:** `statsView` already computes `s = stats(p)`, `m = marginals(p)` and `ha = hitAverages(p)`, but returns only strings. Add one frozen sub-object so `formulaView` and `twoRollsText` never re-run the engine.
**Why:** check-engine calls `statsView` per setting already, for (f). A builder that re-called `marginals` would add 3 `stats` calls per setting, and one that called `chartView` would add a 42-`stats` sweep (about 2.5 ms per d12 sweep in Node, measured). Both would add minutes to the exhaustive run.

```js
// in VM.statsView return object (values already in scope)
exact: {
  e20Num: s.e20Num, e20Den: s.e20Den,
  hitNum: m.hitNum, dmgNum: m.dmgNum, den: m.den,
  normalNum: ha.normalNum, normalDen: ha.normalDen,
},
```

### Pattern 2: `VM.twoRollsText(sv)` (COPY-01)

A pure function of `sv.params`, `threshold`, `hitState` and `critFloorDiffers`. Copy is exactly the UI-SPEC's. Build rules:
- Sentence 1 variant by `hitState`: `normal` → `with {signed atk} against AC {ac}, {a|an} {t} or higher hits.`, `cap` → `…anything but a natural 1 hits (the 95% cap).`, `floor` → `…only a natural 20 hits (the 5% floor).`
- **Article:** normal thresholds span 3..19 [VERIFIED: full-domain probe]. Use `an` for 8, 11 and 18, and `a` otherwise. The UI-SPEC shows only `a 10`.
- Cell count `20 × die`, die name `d{die}`. The last sentence switches on `critFloorDiffers`.

### Pattern 3: `VM.formulaView(sv)` with exact branch selection (COPY-02, D-03, D-04)

**Every branch is chosen by exact integer comparison.** All results print the card's own strings (`hitPct`, `perRoundText`, `marg.hitRound`, `marg.dmgRound`).

```js
// X = die, D = dmg, normal = hitFaces - 1 (the crit face is always 1)
const twoAvgD = X + 1 + 2 * D;                                   // 2 × (avg die + D), an integer
// Per-round rule branch: the closed form in integers equals the exact numerator (×2 to clear halves)
const roundRule = normal * X * X * twoAvgD + X * X * (2 * X + 2 + 2 * D) === 2 * ex.e20Num;
// +1 lines
const hitRule = marg.reason === null && 2 * ex.hitNum === twoAvgD * ex.den;
const dmgRule = ex.dmgNum === sv.hitFaces * ex.den;                // identical set to roundRule (verified)
// Which-wins line: the inequality form ONLY when both +1 lines are rule branch
const verdictForm = marg.reason ? 'zero-hit' : (hitRule && dmgRule) ? 'inequality' : 'compare-displayed';
```

Number formats (all exact from integers, no float `toFixed`):
- `P(normal hit)` = `fixed(normal * 5, 2)` (`0.50`). `P(hit)` = `fixed(hitFaces * 5, 2)`. `P(crit)` = `0.05`.
- `avg die` / `avg die + D` / `2 × avg die + D` = `fixed(k * 5, 1)` where k is the doubled integer (e.g. `twoAvgD * 5` gives `45`, printed `4.5`).
- Unevaluated groups print the sign with U+2212: `(4.5 − 3)`. In the rule branch every evaluated value is ≥ 0 [VERIFIED: the rule branch needs D ≥ −1, or nat-20-only with D = −2 where 2·avg + D ≥ 3.0].
- Hit-chance raw faces `F = 21 − (AC − atk)`. `clamp(F, 1, 19) === hitFaces` and `× 5 === hitPct` on all 70,980 settings [VERIFIED]. A negative attack is parenthesized: `(15 − (−2))`.
- **Live lines:** U+00A0 inside parenthesized groups and around `×`, per the UI-SPEC wrapping rule.

**Return shape (recommended):** `{ hit: { live, result }, round: { lines: [l1, l2] | [l1], note | null, result }, plusHit: { live, result }, plusDmg: { live, result }, win: { text, verdict } }`. For the per-round table branch, ship **both** `dd.f-live` (line 2) and `dd.f-note` in the markup and toggle `hidden`. The DOM shape then stays fixed, and the check-page visible-text extraction proves which one shows.

**The UI-SPEC gap (mixed case, 80 settings, all nat-20-only at D = −2 with AC − atk = 20):** e.g. AC 15 / d8 / −5 / −2. Here `+1 to hit` = 0.130 per round (table: the escaping face is a normal hit with the floored average 2.625), `+1 to damage` = 0.050 per round (rule, `= 1/20`), and per round = 0.350 (rule branch). The inequality `Here 2.5 > 20 × 0.05 = 1.0` would print `2.5`, which is not the real 2.625. Use the table-branch verdict instead: `Here 0.130 > 0.050 per round, so +1 to hit wins.`

**Displayed tie (51 settings, all in the table branch):** the displayed per-round strings are equal while the exact values differ (e.g. AC 13 / d12 / −5 / −5: both `0.115`). The UI-SPEC's `Here both add about 0.115 per round, so they are about even.` is honest ("about"). The rule branch never ties [VERIFIED].

### Pattern 4: `VM.explainChart(p, series, hits)` called inside `chartBase` (COPY-03, COPY-04, D-05)

**What:** One pure builder that returns `{ dmgLine, hitLine, crossLine }`. It reads only:
- `series = { attack, damage, den, crossings, bands }`, the same objects `chartBase` already holds. It never recomputes `crossings` or `attackBands`.
- `hits = { hitFaces, normalNum, normalDen }`, from `DiceMath.stats(p).hitFaces` and `DiceMath.hitAverages(p)`. These are cheap and run once per memo key.

**Why this signature:** check-engine already builds `a`, `d`, `DiceMath.crossings(a, d)` and `attackBands(p)` per setting from its cache, for (m) and (n). It can call `VM.explainChart(p, {attack: a, damage: d, den, crossings: c, bands: b}, hits)` for about zero extra sweep cost. The page gets it memoized with `chartMemo` automatically, so an N-slider drag recomputes nothing (UI-SPEC Interaction Contract).

Rules (all verified on the full domain):
- `straightFrom` = smallest k with `damage[j+1] − damage[j] === hitFaces × den` for all j ≥ k. It is 0 exactly on the 60,740 rule-branch settings, 1..4 otherwise (never more than 4).
- Hit-step variant: `die + dmg <= 0` → nodmg (1,092 settings: d4 at −4/−5), else `2·normalNum === (X+1+2D)·normalDen` → rule (60,060), else floor-bites (9,828, printed with the card's `normalAvgText`).
- Bands: floor-only, cap-only, both (only at AC − atk = 21: floor `[0,1]` and cap `[19,20]`), and none (0 real settings, but it must not crash). The floor band never covers the whole chart (max end +15).
- Crossing variants map one-to-one onto `crossings` (`first`, `list[k].tieN`, `endTieN`, `ties`). All 16 end ties are at +20, but build from `endTieN`, never a literal. The tie-crossing N ranges over 3..18.
- `k ≥ 2`, touch, and `first === 'none'` are synthetic-only. Test them with synthetic arrays in the self-test, which is cheap because there are no sweeps (D-05).

### Pattern 5: Preset application through the one parse path (COPY-05, D-07, D-08)

```js
// #view-model: frozen data. Verified against the engine (Reference Values)
const PRESETS = Object.freeze([
  Object.freeze({ key: 'cross', sets: Object.freeze({ ac: 25, die: 12, atk: 0, dmg: 0, n: 6 }) /*, title, button, desc, setsText */ }),
  Object.freeze({ key: 'dmg',   sets: Object.freeze({ ac: 15, die: 8,  atk: 0, dmg: 0, n: 5 }) }),
  Object.freeze({ key: 'cap',   sets: Object.freeze({ ac: 15, die: 12, atk: 0, dmg: 0, n: 15 }) }),
]);
const presetStatus = (s) => `Set to ${settingsText(s)}, compare at ${signed(s.n)}. Everything above has updated.`;

// #app
let lastPreset = null;                        // like `sim`: an event record, never in state
const PRESET_KEYS = ['ac', 'die', 'atk', 'dmg', 'n'];
function applyPreset(key) {
  const pr = VM.PRESETS.find((x) => x.key === key);
  if (!pr) return;
  const patch = {};
  for (const k of PRESET_KEYS) patch[k] = VM.parseControl(k, pr.sets[k], state[k]);   // D-08
  const applied = Object.freeze({ ...patch });
  lastPreset = applied;
  setState(patch);                            // ONE rAF render: controls, cards, tables, chart, sim stale
  exploreStatusEl.textContent = '';
  const msg = VM.presetStatus(applied);
  requestAnimationFrame(() => { if (lastPreset === applied) exploreStatusEl.textContent = msg; });
}
// in render(), after computeView: only ever clears
if (lastPreset && PRESET_KEYS.some((k) => state[k] !== lastPreset[k])) {
  lastPreset = null;
  if (exploreStatusEl.textContent !== '') exploreStatusEl.textContent = '';
}
```

- rAF callbacks run in registration order, so the render registered by `setState` runs before the status write. If a render was already pending, it still sees the mutated `state`. The `lastPreset === applied` guard covers a control change that lands in the same frame.
- **The preset buttons must not carry `data-key`.** `renderControls()` walks `[data-key]`, and `onControl` is delegated on the two forms. `#explore` is outside both forms, and `data-preset` is used instead.
- Wire one delegated `click` listener on `.explore-list` (`e.target.closest('button[data-preset]')`). Wire it **after** the first render succeeds, and enable the buttons in the same final step as Roll (see Fix 03 WR-04).
- A rolled run goes stale through the existing comparison. The N change alone never stales a run (Phase 3 decision), but the presets change `ac`/`die`/`atk` too, so a run goes stale unless the run was rolled at exactly the preset's attack.

### Pattern 6: What a `--dump-dom` can and cannot prove (guards (9)–(13))

**Verified on this machine:** Chrome serializes U+00A0 in text as `&nbsp;` and keeps `×`, `“ ”` and `−` as raw UTF-8. Setting `el.hidden = false` / `button.disabled = false` removes the attribute in the dump. Unicode `--expect` arguments pass from Git Bash to Node intact.

| The dump CAN prove | The dump CANNOT prove (use the runtime smoke or a manual check) |
|---|---|
| Presence and DOM order of `input/button/select/textarea/a[href]/summary/[tabindex]` | Real sequential focus order under CSS reordering (`order`, grid placement). None is used on controls today |
| `tabindex` values, `disabled` / `hidden` attributes on the element and its ancestors | CSS `display:none` / `visibility:hidden` / `inert` from stylesheets or container-query tiers |
| Label wiring: `label[for]`, wrapping `<label>`, `aria-label`, `aria-labelledby` targets, `<legend>` | That the label text is visually rendered (not clipped). `.vh` is detectable by class, and CSS tier hiding is not |
| Miss cells' text `0`, the `.m` rule text in `<style>` (`repeating-linear-gradient`), the `.series-dmg` `stroke-dasharray` | Actual rendered contrast, the pattern visible at runtime, the focus ring visible |
| Visible text minus `[hidden]`, `.vh`, `noscript`, `svg title` | Pseudo-element text (`data-short` via `::after`) and text hidden by CSS tiers |
| — | Keyboard operation (Space/Enter/arrows) and focusable scroll containers (Chrome 130+, see Pitfall 7) |

**Implementation recommendation:** build one **mini element tree** from the dump in check-page, with a tag-stack tokenizer of about 40 lines. Derive both the visible text (WR-03) and guards (9)–(13) from it. Regex-over-markup cannot handle nested `hidden` ancestors such as `<div class="sim-body" hidden>` containing divs. Complement it with a small **runtime a11y block in the `?test` smoke**: for each control id in the expected order, check `el.focus(); document.activeElement === el`, and check that the label element's `checkVisibility()` is true with a non-zero `getBoundingClientRect()`. This proves real focusability and a rendered label in Chrome. Keep the manual keyboard walk in the pre-ship gate.

Guard notes that the UI-SPEC's one-line spec hides:
- **(10) label-in-name for `#ac-num`:** the `.group-label` text is `Target AC 10 to 30` (it includes `<span class="hint">`). Compare against the label text **without `.hint`** (`Target AC`), or the guard fails on the correct markup.
- **(9)/(10) radios:** the input is `.vh`, but its wrapping `<label>` text (`d4` in a visible `<span>`) is the visible label. The `.vh` exclusion applies to label **text**, not to the control.
- **(11) radio groups are one tab stop.** Collapse same-`name` radios to one entry when comparing against the expected order: `ac-range, ac-num, die, atk-num, dmg-num, n-range, roll, cross, dmg, cap, #chart, #controls`. Exclude everything inside `section#selftest` (its `<summary>` exists in `?test` mode).
- **(12)/(13) read the raw `<style>` text** (check-page's `rendered` string strips `<style>`, so use `dom`).

### Anti-Patterns to Avoid
- **Deriving copy in the renderer.** It then can't be asserted in Node. All strings belong in VM, and renderers only assign `textContent`.
- **Calling `VM.chartView`/`DiceMath.sweep` from a per-setting check or a copy builder.** Take precomputed series instead (Pattern 4).
- **A hard-coded `dmg <= -2` branch rule.** It is wrong at 680 settings (verified).
- **Writing `#explore-status` from `render()`.** `render()` only clears it. Writes come only from the click handler (Phase 3 `#sim-status` pattern).
- **Adding page self-test loops.** The Node self-test is at 177–196 ms of 200. Put exhaustive work in check-engine and DOM-dependent work in `runUiSmoke`.

## Review Fixes: Concrete Changes and Interactions (D-11)

| Item | Status today | Concrete fix | Test that proves it | Interactions |
|---|---|---|---|---|
| **02 WR-01** view-model throw bypasses the banner | **Mostly closed** by the Phase 3 guarded `init()`: a `render()` throw now shows the banner, and `?test` still shows the panel [VERIFIED: code read]. What remains is 03 WR-04 (listeners) and partly-painted sections under the banner | Folded into 03 WR-04 below. Record it as closed with evidence | `check-page --fault render` (new, below): banner shown, Roll and presets `disabled`, painted sections hidden, no `Uncaught` after a synthetic input | Presets must be enabled only on success |
| **03 WR-04** listeners wired before the guarded render | Open (`index.html` `init()`) | Move the `submit/input/change` listeners, the Roll click, and the new preset click **after** `render()` succeeds. Add `let broken = false;`, have `scheduleRender()` return when `broken`, and set `broken = true` in the catch. In the catch, also set `hidden` on `#stats, #tables, #compare, #chart, #sim, #explore` so the banner's "not shown" is true (the header and form stay; controls are inert because no listeners are wired) | `--fault render`: inject a throwing `render` into a temp copy, then an end-of-body script dispatches `input` on `#ac-range`. With the fix there is no `Uncaught` in the console, and without it there is | The chart `pointermove` listener is attached in `chartInit()` before render, but `paintReadout()` returns early while `lastView === null`, so it is safe. The UI smoke still works because it runs only after success |
| **03 WR-02** `?test` smoke leaves hidden run text | Open (`renderSim` no-run branch) | In the no-run branch: `simNoteBaseEl.textContent = ''; simNoteStaleEl.hidden = true; simNowEl.replaceChildren(); simTallyEl.replaceChildren();`. Fold in 03 IN-05 (compare before writing, clear the log only when `shownRunId !== 0`) | Visible-text check-page run with `--expect "Now: expected"` must now **fail** (negative test). The `?test` and `--plain` dumps of `#sim` are identical | None |
| **03 WR-03** `--expect` matches hidden / `.vh` text and joins elements | Open (`tools/check-page.mjs`) | Replace the `visible.includes(text) \|\| visibleText.includes(text)` fallback with a tree-based visible-text extractor (Code Examples). Drop subtrees with a `hidden` attribute, class `vh`, `noscript`, `template` or `svg title`. **Keep `aria-hidden="true"` text**, because it is visually shown (e.g. `Rnd`). Insert a space at block-element boundaries. Decode `&nbsp;` and normalize U+00A0 and whitespace runs to one space in **both** haystack and needle | Negative runs: `--expect "Now: expected"`, `--expect "Settings changed. Roll again"`, `--expect "RndRound"` must fail. Re-run the prior phases' `--expect` list (Pitfall 9) | The reviewer's text says to drop `aria-hidden`. That contradicts "visible", so keep it and record why. This makes the UI-SPEC's NBSP note moot |
| **03 WR-01** spread wording at `E − SD = 0` | Open (`VM.simExact`) | `const lopsided = eT - sdT <= 0 \|\| s.hitFaces === 1;` Update check-engine (o) to `<= 0` in the same commit, or it fails | Self-test pin: `VM.simExact({ac:13, atk:-5, die:4, dmg:-3}).spreadText === 'Most runs land between 0.0 and 5.2 (damage cannot go below 0, so the spread is lopsided).'` (O(1)). check-engine (p) exhaustive (below) | STATE.md / 03 decision text "E − SD < 0" needs updating |
| **03 WR-01 (tolerance)** (p) band fitted to 0.87 | Open | Make (p) **exhaustive** by memoizing the 20-round distribution per `${hitFaces},${die},${dmg}` (2,470 keys, about 3 s in Node, measured). Bounds from the page's own vocabulary: "About 2 runs in 3" must hold **[0.60, 0.80)** (below 3/5 it isn't "about 2 in 3", and at 4/5 or more the page's own "Most runs" wording applies). "Most runs" must hold **≥ 0.80** | After the fix: min 0.6034 (hf2 d6 D−3, e.g. AC 14 / −5 / d6 / −3), max 0.7882 (hf12 d6 D−5). "Most" min 0.8140. Only 2 distributions change wording (hf3 d4 D−3 and hf6 d6 D−5) | Note the thin low-end margin (0.0034) in the SUMMARY. It is a real property of the ±1 SD band on a 0-floored lattice, not a fit |
| **02 WR-02** readout "even" vs exact lead | Open (`chartBase` readout) | Readout gap word from the exact sign: `exact === 0 ? 'even' : '{leader} ahead by ' + (gapT ? fixed(gapT,1) : 'less than 0.1')`. **Leave compare-table deltas unchanged.** They state no leader, and equal rounded totals are true. Record this decision | New check-engine invariant (y), exhaustive per setting and N: the readout says `even` iff `attack[n] === damage[n]`, and the leader word matches `sign(attack[n] − damage[n])`. It changes 434 (setting, N) readouts, 75 of them at a ring's `flipN`. Pin: AC 17 / d12 / −5 / −4 at +3 → `At +3: to hit 12.0 · to damage 12.0 · to hit ahead by less than 0.1` | The UI-SPEC's `Which wins` "about even" (51 settings) is a separate, hedged convention, and both are honest. The existing self-test pin `readout at n 0 … even` stays valid |
| **02 WR-03** 1-in-50 stride misses odd `dmg` | Open for (i), (j), (l) and (m)-markers ((p) already uses 53) | `const SAMPLE = 53;` for every sampled check, and record `sampled.{ac,die,atk,dmg}` sets. At the end, assert sizes 21/5/26/26 | Stride 50 reaches 13 of 26 `dmg` values. Stride 53 reaches 26/26 `dmg`, 26 `atk`, 5 dice, 21 AC with 1,339 samples [VERIFIED] | Fold in 02 IN-03: derive the loop bounds and `TOTAL_COMBOS` from `VM.CONTROL_SPEC`, and drop the `\|\| 20` fallback |
| **Legend crit swatch shrink** | Open | `.legend-item > .swatch, .legend-item > .ramp { flex-shrink: 0; }` (the UI-SPEC rule) | 360px screenshot of `#legend` in both schemes. Optional smoke at the current width: every `.legend-item > .swatch` `getBoundingClientRect().width >= 39.5` | None |

**Info-level (discretion). Recommended because they are cheap and touch files already being edited:**
- 03 IN-01 (budget unenforced): check-page parses `SELFTEST PASSED: n/n (X ms)` from the **Chrome** console and fails above 200 ms (Chrome runs 34–57 ms here). check-engine prints a warning (not a failure) when Node is above 200 ms.
- 02 IN-02: check-page uses `new URL(url).searchParams.has('test')` and `.delete('test')` for `--plain`. This matters for the live-URL runs.
- 02 IN-04: add check-engine counts asserting 0 touches, 0 leading ties and 0 two-crossings, so a future rule change that makes the synthetic-only copy branches reachable is noticed.
- 02 IN-05: `if (!e.isPrimary) return;` in `pointermove`. One line.
- 03 IN-02: require exactly one `Math.random`, matching `const onRoll = () => handleRoll(Math.random);`.
- 03 IN-03/IN-04: `rollDie` range guard and `rounds` validation, and move the orphaned comment. Trivial.
- Skip 02 IN-01 (N-domain copy duplication) and 02 IN-06 (band-label overflow near +19, cosmetic) unless time allows.

**New dev-tool option (recommended): `check-page --fault render`.** It copies `index.html` to `os.tmpdir()` and replaces the first `function render() {` with `function render() { throw new Error('injected render fault');`. It then appends before `</body>` a `<script>` that dispatches `new Event('input', {bubbles:true})` on `#ac-range` in a `setTimeout(…, 0)`. It loads the copy in `--plain` mode and asserts: banner shown, `#roll` and every `.btn-preset` `disabled`, the six sections `hidden`, and the console has `render failed` but **no `Uncaught`**. The CSP allows inline scripts. This is the only automated proof for 02 WR-01 and 03 WR-04.

## Publish Runbook (D-12..D-14): 01-03 checked against today

**What changed since 01-03:** gh 2.101.0 is installed (no winget step). The branch is already `main`, and `.nojekyll` (0 bytes) and `README.md` are committed. There is still no remote and no auth [VERIFIED]. **The README body is stale**: it says "Phase 1 delivers…" and "Not published yet". The Pages REST contract is unchanged [CITED: docs.github.com/en/rest/pages/pages]: POST 201/409/422, PUT 204, GET `html_url`, `status` ∈ built/building/errored/null, `source.path` ∈ `/` or `/docs`. The `gh repo create` flags are unchanged [CITED: cli.github.com/manual/gh_repo_create]. Everything else in 01-03 still holds.

**MSYS path conversion (tested here):** `"source[path]=/"`, `"source[path]=/docs"` and `repos/o/r/pages` pass to a native Windows exe **unchanged**. A **bare `/` becomes `C:/Program Files/Git/`**. Prefix every `gh api` call with `MSYS_NO_PATHCONV=1` anyway (harmless). Never use a leading-slash endpoint like `/user`; use `user`.

**Pre-publish (autonomous, earlier plan):** rewrite the README body for the finished page (tables, compare, chart, simulation, explanations, presets, `?test`, local run, dev checks). Keep the URL placeholder until the owner is known.

**Plan (autonomous: false), tasks in order:**
1. **checkpoint:human-action (the only gate).** The user opens a NEW PowerShell/Windows Terminal (where gh is on PATH) and runs `gh auth login --hostname github.com --git-protocol https --web`. They approve in the browser, answer **Yes** to "Authenticate Git with your GitHub credentials?", run `gh auth status`, and reply "authed". Verification: `"/c/Program Files/GitHub CLI/gh.exe" auth status` exits 0 and contains `Logged in to github.com`, and `gh api user -q .login` is non-empty. (Reuse the 01-02 Task 2 wording, minus the install step.)
2. **Auto: wire git, then finalize the README.** In every Bash call: `GH="/c/Program Files/GitHub CLI/gh.exe"`, `OWNER=$("$GH" api user -q .login)`, `REPO=DnD-CombatRollSimulator`. Run `"$GH" auth setup-git` (idempotent; configures git to use gh's token and is not authentication). Put `https://${OWNER,,}.github.io/DnD-CombatRollSimulator/` into the README. Run the secret scan `git grep -nE 'gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}'` and require exit 1 (it is clean today [VERIFIED]). Commit.
3. **Auto: create, push, enable, verify.**
   - Idempotent create: if `"$GH" repo view "$OWNER/$REPO"` fails, run `"$GH" repo create "$REPO" --public --source=. --remote=origin --description "D&D 5e attack roll anatomy: d20 vs AC x damage die, +hit vs +damage"`. If it exists and `origin` matches, continue. Otherwise stop. Never force-push.
   - `git push -u origin main` (explicit; `--push`'s ref behaviour is not documented beyond "push local commits").
   - `"$GH" repo view "$OWNER/$REPO" --json defaultBranchRef,visibility -q '.defaultBranchRef.name + " " + .visibility'` must print `main PUBLIC`.
   - `MSYS_NO_PATHCONV=1 "$GH" api -X POST "repos/$OWNER/$REPO/pages" -f build_type=legacy -f "source[branch]=main" -f "source[path]=/"`. On failure (409), run the same with `-X PUT`. Confirm with GET `-q '.source.branch + " " + .source.path'` that it prints `main /`.
   - `URL=$("$GH" api "repos/$OWNER/$REPO/pages" -q .html_url)`, then `"$GH" repo edit "$OWNER/$REPO" --homepage "$URL"`. If `URL` differs from the README, fix it, commit and push.
   - Poll for up to 10 minutes as a **background** Bash loop (40 × 15 s): `curl -s -o /dev/null -w '%{http_code}' "$URL"` plus `"$GH" api "repos/$OWNER/$REPO/pages/builds/latest" -q .status`. Break on 200. On timeout, report `.error.message`.
   - Verify on the live origin (retry for up to 3 minutes in case of a stale CDN): `curl -s "$URL" | grep -c 'id="dice-math"'` prints 1. `node tools/check-page.mjs "${URL}?test" --expect "11/20 = 55%" --expect "Try AC 25 with a d12"` ends `CHECK-PAGE PASS`, with guards (9)–(13) running. `node tools/check-page.mjs "$URL"` ends `CHECK-PAGE PASS`.
   - `git status -sb` shows `## main...origin/main` with no ahead count.
4. **Auto: traceability (D-14).** REQUIREMENTS.md traceability sets DEPLOY-02 and DEPLOY-03 to "Complete (verified in Phase 4, <date>, <URL>)", DEPLOY-04 and COPY-01..05 to Complete, and the ROADMAP/STATE progress. Commit and push, which is allowed inside this plan.
5. **Manual note in the SUMMARY:** open the live URL once in a real Chrome with DevTools and confirm the console is empty. Headless `--dump-dom` never requests `/favicon.ico` (verified with a local `http.server` run: only the page was requested), so a real-browser-only favicon 404 or CSP message would not be caught automatically. See Pitfall 8.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Deciding rule vs table text | A damage-bonus threshold (`dmg <= -2`) | Exact integer equality of closed form vs `e20Num` / `hitNum` / `dmgNum` | The threshold is wrong at 680 settings. The equality is D-04's definition |
| Chart copy crossing logic | A second sign-walk over the series | `chartBase.crossings` / `bands` (the same objects as the rings and bands) | D-05, "never claims a crossover the chart does not draw" |
| Preset parsing | Direct `state.ac = 25` | `VM.parseControl` per key, then one `setState(patch)` | D-08, clamping, one render |
| HTML parsing in check-page | A regex per guard over raw markup | One tag-stack mini tree (void elements, `hidden`/`.vh` ancestry) | Nested hidden containers defeat regexes (03 WR-03) |
| Accessible-name computation | Full accname spec | The five rules in guard (9) (for / wrapping label / aria-label / aria-labelledby / button text) plus `legend` | The page uses only these patterns. A runtime smoke covers the rest |
| GitHub auth | Token handling in scripts | The user's `gh auth login`, then `gh auth setup-git` | Memory rule and D-12. Tokens never touch the repo |
| Pages polling | A fixed `sleep 600` | A loop on the HTTP code plus `pages/builds/latest` status | Builds usually finish in about a minute, but can take up to 10 |

## Common Pitfalls

### Pitfall 1: The mixed +1 branch prints a false inequality
**What goes wrong:** `Which wins` prints `Here 2.5 > 20 × 0.05 = 1.0` at AC 15 / d8 / −5 / −2, while `+1 to hit` shows 0.130 (not 2.5 / 20 = 0.125).
**Why:** the UI-SPEC assumes that the per-round rule branch implies both +1 lines are rule. That fails at nat-20-only with D = −2 (80 settings).
**How to avoid:** use the inequality form only when `hitRule && dmgRule`. check-engine (t) asserts that the inequality's numbers equal `avg + D` and `hitFaces`, and are used only in that case.

### Pitfall 2: A false positive `--expect` from a different element
**What goes wrong:** the UI-SPEC's `--expect "= 2.700"` also matches the stat card sub-line `= 2.700 × 20`, so it passes even if the formula is missing.
**How to avoid:** use expectations unique to the new block: `0.05 × 9.0 = 2.700`, `11/20 = 55%`, `so +1 to damage wins.`, `a 10 or higher hits`, `160 cells`.

### Pitfall 3: Wrong article in the two-roll sentence
**What goes wrong:** `a 8 or higher`, `a 11 or higher`, `a 18 or higher`.
**How to avoid:** `[8, 11, 18].includes(t) ? 'an' : 'a'` (normal thresholds are 3..19). Add check-engine coverage over every threshold.

### Pitfall 4: Self-test budget overrun
**What goes wrong:** the Node self-test (the project's gate) is 177–196 ms of 200. A d12 sweep costs about 2.5 ms in Node.
**How to avoid:** add at most about 4 pins, using `statsView` only (formulas and two-roll) or series already in `sweepMemo` (the defaults are `SW(15,5,8,0)`). Put the preset click path and DOM text in `runUiSmoke` (browser-only, not in the Node gate), and exhaustive checks in check-engine. **Headroom lever if needed:** the Phase 1 coarse grid takes about 113–117 ms of the Node run (measured standalone, cold), and check-engine (a)–(f) already cover it exhaustively. Thinning it is justified if the median crosses 200.

### Pitfall 5: The preset status leaks into the DOM dump
**What goes wrong:** the smoke clicks a preset, whose rAF then writes `#explore-status` after the smoke's reset, so the dump carries "Set to AC 25…" and the defaults `--expect` gets confused.
**How to avoid:** at the end of the explore smoke, set `lastPreset = null`, register `requestAnimationFrame(() => exploreStatusEl.textContent = '')` **after** the click (registration order), then restore `DEFAULT_STATE` (the Phase 3 `sim-status` pattern). Run the explore smoke before the final `resetSim()` / defaults block. If it rolls a run to test staleness, the existing final `resetSim()` clears it.

### Pitfall 6: The listener fix breaks the UI smoke
**What goes wrong:** moving listeners after `render()` while leaving `runUiSmoke()` inside the try, before wiring, means `send()` events hit nothing.
**How to avoid:** order is `chartInit` → `renderControls` → `render()` → wire listeners → enable Roll and presets → `simBodyEl.hidden = false` → (after the try) `if (testMode) runUiSmoke()`.

### Pitfall 7: Chrome 130+ makes overflowing scrollers tab stops
**What goes wrong:** the UI-SPEC says "nothing else is focusable", but an `overflow-x:auto` `.table-wrap` or `.sim-log-wrap` that actually overflows (e.g. d12 at 360px) becomes a tab stop in Chrome 130+ when it has no focusable children [CITED: developer.chrome.com/blog/keyboard-focusable-scrollers].
**How to avoid:** this is correct accessible behaviour, not a bug. Guard (11) compares **controls** only, so it is unaffected. In the manual keyboard walk at 360px, note any extra stop and do not "fix" it with `tabindex="-1"`.

### Pitfall 8: Real browsers may log a favicon message that headless never sees
**What goes wrong:** success criterion 5 says "no console errors" at the public URL. Headless `--dump-dom` does not fetch `/favicon.ico` (verified). A real browser requests `https://<owner>.github.io/favicon.ico` (404), and the page CSP is `default-src 'none'; img-src data:`.
**How to avoid:** optional insurance: `<link rel="icon" href="data:,">` in `<head>` (allowed by `img-src data:`, no request, no visible change). Either way, do one manual DevTools look at the live URL. [ASSUMED: whether current Chrome logs the favicon 404 or CSP refusal. Low risk, cheap to prevent.]

### Pitfall 9: Stricter `--expect` silently breaks earlier verification commands
**What goes wrong:** after WR-03, strings in hidden or `.vh` elements no longer match.
**How to avoid:** re-run the prior phases' visible strings once after the change: `55%`, `54.0`, `2.700`, `4.91`, `normal 4.50`, `hits on 10+`, `auto-miss`, `crit*`, `2d8 + damage bonus`, `Value of the next +1`, `+0.225 per round`, `+11.0 over 20 rounds`, `Baseline (+0)`, `+5 to hit`, `+5 to damage`, `Bonus sweep, +0 to +20`, `At +5: to hit 76.5`, `Extra bonus +N`, `The curves never cross.`, `95% cap`, `20 rounds, rolled for real`, `Expected (exact)`, `This run (simulated)`, `Not rolled yet`, `± 14.2`, `About 2 runs in 3 land between 39.8 and 68.2.`, `Roll 20 rounds`, `Outlined: rolled in your last 20 rounds`. All are in visible elements today. (`Self-test passed` and `UI checks` live in the self-test panel, which `--expect` has excluded since Phase 2, so they are not part of this list.)

### Pitfall 10: Shell quirks when writing code
**What goes wrong:** in this agent environment, Bash heredocs stripped backslashes from JS (`\s` became `s`, and `C:\Program Files` lost its separators) during research. **How to avoid:** edit `index.html` and the tools with the Edit/Write tools, not heredocs. Use forward-slash Windows paths in Node spawns.

### Pitfall 11: Public push exposes the commit author email
**What goes wrong:** all 93 commits carry `Alexander Brazie <alex@xelnath.com>`. Publishing makes that email public. If the GitHub account enables "Block command line pushes that expose my email" for a private email, the push is rejected (GH007) [ASSUMED].
**How to avoid:** mention it in the checkpoint text so the user can object before the push. If GH007 appears, stop and report. Do not rewrite history automatically.

## Code Examples

### check-page: mini tree plus visible text (03 WR-03 and the base for guards (9)–(13))
```js
// Source: designed for this repo's dump (Chrome --dump-dom serialization verified locally)
const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr']);
const BLOCK = new Set(['p','div','li','ul','ol','dl','dt','dd','table','tr','td','th','caption','section',
  'header','footer','main','form','fieldset','legend','h1','h2','h3','h4','h5','h6','label','button','output','summary','details','text']);
function parseTree(markup) {
  const root = { tag: '#root', attrs: {}, children: [], parent: null };
  let cur = root;
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s=>\/]+(?:="[^"]*")?)*)\s*\/?>|([^<]+)/g;
  let m;
  while ((m = re.exec(markup))) {
    if (m[4] !== undefined) { cur.children.push({ text: m[4] }); continue; }
    if (!m[2]) continue;                                            // comment
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
    if (!VOID.has(tag)) cur = el;
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
// decode(): &lt; &gt; &quot; &nbsp; (-> \u00a0) and &amp; last.
// Page text: norm(visibleText(tree minus section#selftest)); match with norm(expect).
```

### init() restructure (03 WR-04, closes 02 WR-01)
```js
let broken = false;
function scheduleRender() {
  if (pending || broken) return;
  pending = true;
  requestAnimationFrame(() => { pending = false; render(); });
}
function init() {
  const testMode = new URLSearchParams(location.search).has('test');
  if (!engineLoaded()) { /* unchanged */ }
  try {
    nRangeEl.min = String(VM.CONTROL_SPEC.n.min);
    nRangeEl.max = String(VM.CONTROL_SPEC.n.max);
    chartInit();
    Object.assign(state, VM.DEFAULT_STATE);
    renderControls();
    render();                                   // guarded first render: nothing is wired yet
    for (const root of [form, compareForm]) {
      root.addEventListener('submit', (e) => e.preventDefault());
      root.addEventListener('input', onControl);
      root.addEventListener('change', onChange);
    }
    rollBtn.addEventListener('click', onRoll);
    exploreListEl.addEventListener('click', onPresetClick);
    simBodyEl.hidden = false;
    rollBtn.disabled = false;
    for (const b of presetBtns) b.disabled = false;
  } catch (err) {
    broken = true;
    console.error('render failed:', err);
    for (const id of ['stats', 'tables', 'compare', 'chart', 'sim', 'explore']) document.getElementById(id).hidden = true;
    showEngineError();
    const st = selfTestIfLoaded();
    if (testMode && st) showSelfTestPanel(st);
    return;
  }
  if (testMode) showSelfTestPanel(SelfTest, runUiSmoke());
}
```

### check-engine (p) exhaustive with the vocabulary-derived bounds (03 WR-01)
```js
const distMemo = new Map();                   // key `${hitFaces},${die},${dmg}`: 2,470 entries, about 3 s
// ...inside the loop, replacing `if (combos % 53 === 0)`:
const dk = `${s.hitFaces},${die},${dmg}`;
if (!distMemo.has(dk)) distMemo.set(dk, dist20Of(p, sp));   // the existing convolution, factored out
const dist20 = distMemo.get(dk);
// "About 2 runs in 3": [0.60, 0.80). "Most runs": >= 0.80. Both are the page's own vocabulary, not fitted.
if (!ex.lopsided && !(inBand >= 0.60 && inBand < 0.80)) record('p', p, …);
if (ex.lopsided && !(below >= 0.80)) record('p', p, …);
```
(The band test still runs per setting, because `lo`/`hi` come from that setting's `simExact`. Only the distribution is shared.)

### Publish: the Pages call with explicit MSYS safety
```bash
cd /c/Projects/GameDesignSkills/DnD-CombatRollSimulator
GH="/c/Program Files/GitHub CLI/gh.exe"; OWNER=$("$GH" api user -q .login); REPO=DnD-CombatRollSimulator
MSYS_NO_PATHCONV=1 "$GH" api -X POST "repos/$OWNER/$REPO/pages" \
  -f build_type=legacy -f "source[branch]=main" -f "source[path]=/" \
|| MSYS_NO_PATHCONV=1 "$GH" api -X PUT "repos/$OWNER/$REPO/pages" \
  -f build_type=legacy -f "source[branch]=main" -f "source[path]=/"
"$GH" api "repos/$OWNER/$REPO/pages" -q '.source.branch + " " + .source.path'   # expect: main /
```

## Reference Values (all computed this session by the page's own engine)

**Defaults (AC 15 / d8 / +5 / +0, N 5):** hit 55%, 11 faces, threshold 10. Per round `2.700`, 20 rounds `54.0`. Normal `4.50`. Marginals `0.225` / `0.550`, reason null. Rule branch everywhere. Cap band `[8,20]`, no crossing (0-damage). Spread `About 2 runs in 3 land between 39.8 and 68.2.`

| Setting | Key values |
|---|---|
| AC 15 / d8 / +5 / −1 | per round `2.150`. Rule branch: `0.50 × 3.5 + 0.05 × 8.0`. Marginals `0.175` / `0.550` |
| AC 25 / d8 / +0 / +0 | 5%, per round `0.450`, reason `floor`, `0.00 × 4.5 + 0.05 × 9.0` |
| AC 15 / d8 / +5 / −3 (table branch) | per round `1.240`, normal `1.88`. Marginals `0.095` / `0.425` (hit20 1.9, dmg20 8.5). critFloorDiffers true. straightFrom 2 |
| AC 15 / d8 / −2 / +2 | 20%, 4 faces, per round `1.525`. Marginals `0.325` / `0.200` (hit wins; `6.5 > 20 × 0.20 = 4.0`) |
| AC 15 / d8 / +14 / +0 | 95%, raw F = 20, reason `cap`, marginals `0.000` / `0.950` |
| AC 25 / d12 / +0 / +0 | 5%, raw F = −4, per round `0.650`, reason `floor`. Floor band `[0,5]`. One crossing, flipN 6 |
| AC 15 / d4 / +5 / −4 | per round `0.065`, normal `0.00`, reason `nodmg`, marginals `0.000` / `0.165`. Table branch |
| AC 25 / d12 / +0 / −2 | per round `0.550`, **rule** branch (the D ≤ −2 exception), normal `4.58`, reason `floor` |
| **AC 15 / d8 / −5 / −2 (mixed)** | 1 face, per round `0.350` (rule). `+1 to hit` `0.130` (table, exact 2.625/20). `+1 to damage` `0.050` (rule) |
| AC 13 / d4 / −5 / −3 (03 WR-01) | after the fix: `Most runs land between 0.0 and 5.2 (damage cannot go below 0, so the spread is lopsided).` |
| AC 17 / d12 / −5 / −4, N 3 (02 WR-02) | today `At +3: to hit 12.0 · to damage 12.0 · even` (exact gap 0.0278, ring `flips at +3`). After the fix: `… · to hit ahead by less than 0.1` |
| AC 10 / d8 / +0 / +12 | a tie crossing: ring `tie at +12`, caption `The curves cross once, at +12.` |
| AC 27 / d4 / −5 / +0 | end tie only: `tie at +20`, caption `The curves meet at +20 but do not cross.` |

**Presets (reproduced exactly):**
- `cross` 25/12/0/0/n6: 5%. Floor `[0,5]`, no cap. Attack steps 0 ×5 then 6.5. Damage steps 1.0. One crossing, flipN 6, `flips at +6`. Caption `…+N to damage leads from +1 to +5, then +N to hit leads from +6 to +20. The curves cross once.` Readout `At +6: to hit 19.5 · to damage 19.0 · to hit ahead by 0.5`. Compare: `hits on 19+ · 19.5 …` vs `only a nat 20 hits · 19.0 …`.
- `dmg` 15/8/0/0/n5: 30%, 6 faces. Damage step 6.0. Attack step 4.5, 0 from +13, cap `[13,20]`. No crossing, no ties, no end tie. Caption `+N to damage leads at every N from +1 to +20. The curves never cross.` Readout `… to damage ahead by 7.5`.
- `cap` 15/12/0/0/n15: 30%. Attack step 6.5 vs damage 6.0. Cap `[13,20]`. One crossing, flipN 15 (`to: damage`). Caption `+N to hit leads from +1 to +14, then +N to damage leads from +15 to +20. The curves cross once.` Readout `… to damage ahead by 5.5`.

## Suggested Plan Breakdown (MVP vertical slices; all sequential because everything edits `index.html`)

| Plan | Wave | Autonomous | Content | Requirements / fixes |
|---|---|---|---|---|
| 04-01 Ship-blocking fixes and honest tools | 1 | yes | check-page: tree-based visible text, NBSP and whitespace normalization, URL-param parsing, Chrome budget gate, `--fault render`, negative `--expect` runs and the prior-strings regression. index.html: init restructure (`broken`, listeners after render, hide sections), `renderSim` no-run reset, readout exact sign, `simExact <= 0`, legend `flex-shrink`, `isPrimary`. check-engine: (o) `<=`, (p) exhaustive with [0.60, 0.80) and ≥ 0.80, stride 53 plus coverage, (y) readout, domain from `CONTROL_SPEC`, IN-04 counts, the `Math.random` gate | 02 WR-01..03, 03 WR-01..04, legend, chosen IN items |
| 04-02 Formulas and the two-roll story | 2 | yes | `statsView.exact`, `VM.formulaView`, `VM.twoRollsText` (article rule), lede sentence, `#formulas` card, `.f-marg` in `#marginal`, `#two-rolls`, CSS, renderers. At most 2 self-test pins (defaults via `statsView`). check-engine (r)(s)(t) plus the two-roll threshold/article coverage. Smoke: table branch via DOM at AC 15/d8/+5/−3 and the mixed case. `--expect` | COPY-01, COPY-02 |
| 04-03 Chart explanations and "Try this" | 3 | yes | `VM.explainChart` inside `chartBase`, `VM.PRESETS`, `VM.presetStatus`, `.chart-explain`, `#explore` markup and CSS, `applyPreset` + `lastPreset` + status clearing, jump links, enabling presets with Roll. At most 2 self-test pins (defaults via `sweepMemo`, synthetic 2-crossing and touch arrays). check-engine (u)(v)(w)(x). Smoke: preset click → 1 `.cross`, `#explain-cross` contains `at +6`, a rolled run goes stale, then reset. `--expect` | COPY-03, COPY-04, COPY-05 |
| 04-04 Accessibility guards and pre-ship gate | 4 | yes | Guards (9)–(13) on the mini tree (both modes). Runtime focus/visibility smoke. Manual gate: 1366 and 360, both schemes, defaults / floor-bite / each preset, keyboard walk. README body rewrite (placeholder URL). Full check runs | DEPLOY-04 |
| 04-05 Publish | 5 | **no** | Checkpoint (`gh auth login` by the user) → setup-git, README URL, secret scan → create/push/Pages/homepage/poll → live check-page → traceability (D-14) | DEPLOY-02, DEPLOY-03 (verified), SC5 |

With coarse granularity, 04-04 can merge into 04-03. Keep 04-05 separate because it is the only non-autonomous plan, and D-12 makes it last.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Scroll containers never in the tab order (Chrome) | Keyboard-focusable scrollers when there are no focusable children | Chrome 130 (the 127 rollout was reverted) [CITED: developer.chrome.com/blog/keyboard-focusable-scrollers] | An overflowing `.table-wrap` can be an extra tab stop at narrow widths (Pitfall 7) |
| check-page `--expect` on markup or tag-stripped text | Visible text from a parsed tree with hidden ancestry | This phase (03 WR-03) | `--expect` becomes real visibility evidence |
| (p) 1-in-53 sample, tolerance up to 0.87 | Exhaustive over 2,470 distributions, bounds from the page's vocabulary | This phase (03 WR-01) | No fitted tolerances |

**Deprecated/outdated:** the CLAUDE.md "Environment Facts" row "gh CLI is NOT installed" is stale (it is installed at 2.101.0). The README body says "Phase 1 delivers…". Both are text-only updates.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Answering "Yes" to "Authenticate Git with your GitHub credentials?" (or running `gh auth setup-git`) makes `git push` use gh's token without a Git Credential Manager prompt | Publish Runbook | Low. At worst GCM opens one browser prompt during the push, which the user can approve. Note it in the checkpoint text |
| A2 | Current Chrome may log a favicon 404 or CSP refusal in a real (non-headless) session | Pitfall 8 | Low. The `data:,` icon link prevents the request. A manual DevTools check covers it |
| A3 | GH007 email-privacy push rejection could apply to the author email | Pitfall 11 | Low. It would stop the push with a clear error, and the user decides |
| A4 | `<ul>` with `list-style: none` may lose list semantics in Safari/VoiceOver, so add `role="list"` to `.explore-list` | Pattern 5 / markup | Very low. The extra attribute is harmless |
| A5 | [0.60, 0.80) is the right honesty band for "about 2 in 3". It is derived from the page's two wordings, and a reviewer could argue a narrower band | Review Fixes | Low. Observed values (0.6034–0.7882) are recorded, so any narrower policy can be evaluated immediately |

## Open Questions

1. **Does any `overflow:auto` wrapper overflow at 360px with d12 (Pitfall 7)?**
   - What we know: the `?test` smoke checks table fit only at the run width (1366).
   - What's unclear: the 360px behaviour of `.table-wrap` / `.sim-log-wrap` under Chrome 130+.
   - Recommendation: in the 04-04 manual walk, record any extra tab stop at 360px. Accept it (correct behaviour) and note it in the SUMMARY.
2. **Should compare-table deltas also get an "under 0.1 apart" note (02 WR-02, 49 views)?**
   - Recommendation: no. They name no leader, so equal rounded totals are true. Fix the readout only and record the decision.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | check-engine / check-page | ✓ | 24.15.0 | — |
| Chrome | check-page headless | ✓ | installed (Edge also) | Edge via the tool's candidate list |
| Python | Local preview | ✓ | 3.14.4 | Open the file directly |
| gh CLI | Publish | ✓ (absolute path only) | 2.101.0 | — |
| gh auth | Publish | ✗ | — | **None. This is the human checkpoint (D-12)** |
| git + remote | Publish | git ✓, no remote | 2.45.1 | `gh repo create --source=. --remote=origin` |
| curl | Live URL status | ✓ | 8.7.1 | Node `fetch` |

**Missing with no fallback:** gh authentication. It is by design the single human gate in plan 04-05.

## Security Domain

(`security_enforcement` is absent from config, so it is treated as enabled.)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (static page); publish auth is the user's own `gh auth login` | Tokens stay in the OS credential store and never in the repo |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | `VM.parseControl` (numeric, clamp, set membership). Presets use the same path |
| V6 Cryptography | no | `Math.random` is only for dice (documented non-crypto use) |
| V14 Configuration | yes | The existing CSP `<meta>` (`default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:`). No new sources are needed (fragment links are navigation) |

| Threat Pattern | STRIDE | Mitigation |
|---------|--------|---------------------|
| DOM XSS through generated copy | Tampering | Copy is built from integers and fixed literals and rendered via `textContent`. The `innerHTML` rule is unchanged |
| Secret leakage on the first public push | Information disclosure | The `git grep` token scan must return exit 1 (clean today) |
| `.planning/` and the author email become public | Information disclosure | `.planning/` was accepted (D-13). No personal paths or emails in tracked files [VERIFIED: grep]. The commit email is disclosed in the checkpoint text |
| Overwriting someone else's repo | Tampering | Idempotent create, stop if `origin` mismatches, never `--force` |

## Sources

### Primary (HIGH confidence)
- Local codebase: `index.html` blocks `#dice-math`, `#dice-sim`, `#view-model`, `#dice-selftest`, `#app`; `tools/check-engine.mjs`; `tools/check-page.mjs`. Read in full for the relevant ranges.
- Engine probes run in the session scratchpad over all 70,980 settings: branch sets, mixed case, displayed ties, crossing states, bands, straightFrom, hit-step variants, readout ties, end ties, presets, and the exact 20-round distributions for all 2,470 one-round distributions.
- Local environment probes: gh 2.101.0 unauthenticated, Chrome/Edge, Node 24.15.0, curl 8.7.1, git 2.45.1 with `credential.helper=manager`, branch `main`, no remote; MSYS argv conversion test; Chrome `--dump-dom` NBSP and attribute-reflection test; `http.server` run showing no favicon request from headless.
- Baseline runs: `node tools/check-engine.mjs` PASS (self-test 245/245 in 186 ms, sweep about 30 s); `check-page` PASS in both modes, over file:// and http://.
- https://docs.github.com/en/rest/pages/pages: POST/PUT/GET, `build_type`, `source.path` values, status enum, `html_url`, `builds/latest`.
- https://cli.github.com/manual/gh_repo_create: `--public --source --remote --push --description --homepage`.
- https://cli.github.com/manual/gh_auth_login: the web flow, `--git-protocol`, the credential store.

### Secondary (MEDIUM confidence)
- https://developer.chrome.com/blog/keyboard-focusable-scrollers: focusable scrollers shipping in Chrome 130 (the 127 rollout was stopped), only when the scroller has no focusable children.
- Project history: 02-REVIEW, 03-REVIEW, 01-03-PLAN/SUMMARY, 01-02-PLAN (checkpoint wording), 02/03 SUMMARY timing notes.

### Tertiary (LOW confidence)
- Real-browser favicon console behaviour, GH007, and VoiceOver list semantics (Assumptions A2–A4).

## Metadata

**Confidence breakdown:**
- Copy and branch rules: HIGH. They are exhaustive over the real domain, and every UI-SPEC example was reproduced.
- Review fixes: HIGH. Each fix was traced in code, and the tolerance was derived from full data.
- A11y guards: HIGH for what the dump proves (tested serialization). The limits are documented, with runtime and manual complements.
- Publishing: HIGH for the API, flags and MSYS behaviour. MEDIUM for credential-helper interplay (A1).

**Research date:** 2026-09-26
**Valid until:** 2026-10-26 for the code and engine facts (stable until `index.html` changes). Re-check gh and Pages docs if publishing slips past about 30 days.
