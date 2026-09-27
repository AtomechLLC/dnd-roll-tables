# Phase 4: Designer Explanation & Final Ship - Context

**Gathered:** 2026-09-26
**Status:** Ready for planning

<domain>
## Phase Boundary

The page learns to explain itself to a game designer, and then it ships. Phase 4 adds live, generated explanation copy (COPY-01..05). It does an accessibility pass with automated guards (DEPLOY-04), fixes the open Phase 2 and 3 code review warnings, and publishes the finished page to a public GitHub Pages URL (success criterion 5; the DEPLOY-02 and DEPLOY-03 work that was deferred in Phase 1). No new calculators, controls, or chart features.

</domain>

<decisions>
## Implementation Decisions

### Where the explanation lives
- **D-01:** The copy is woven into the existing sections, next to what it explains. There is no separate "How it works" article and no collapsible panels. Page order stays as it is: header → controls → stat cards → outcome table → Compare +N → sweep chart → Roll 20 rounds. The placements are:
  - **Two-roll structure and joint outcome space (COPY-01):** above or with the outcome table. This covers d20 to hit, then dX for damage, and why each cell is one (d20, die) pair that is equally likely.
  - **Live formulas (COPY-02):** beside or under the stat cards.
  - **Plateau, linear, and crossover (COPY-03, COPY-04):** under the sweep chart. The text refers to the shaded bands by their on-chart names ("95% cap", "only a nat 20 hits").
  - **Suggested explorations (COPY-05):** a short section at the end of the page.
- **D-02:** The voice is short, designer to designer. Each spot gets two to four sentences in plain words, one idea per sentence. Rules are explained only as far as the lesson needs. Existing section intros can be tightened or extended, but not replaced by long paragraphs.

### Live formulas (COPY-02)
- **D-03:** Each formula shows the general rule in symbols, then the same rule with today's values substituted, ending in the result. All numbers update live with every control change, like the stat cards. Target shape at the defaults (AC 15, d8, +5 to hit, +0 damage):
  - Hit chance = faces that hit / 20 = (21 − (AC − bonus)) / 20, clamped to 1..19 faces (5%–95%) = (21 − (15 − 5)) / 20 = 11/20 = 55%
  - Expected per round = P(normal hit) × (avg die + D) + P(crit) × (2 × avg die + D) = 0.50 × 4.5 + 0.05 × 9.0 = 2.70
  - Value of +1 to hit vs +1 to damage: +1 to hit turns one more d20 face into a normal hit, worth (avg die + D) / 20 per round, and nothing once capped. +1 to damage adds 1 to every hit, worth P(hit) per round. +1 to hit wins only while (avg die + D) > 20 × P(hit).
- **D-04:** Every substituted number must equal the figure shown elsewhere on the page. The stat cards and the "Value of the next +1" card use the same rounding (STAT-02), so the formula and the card never disagree.
  - The closed form ignores the 0-damage floor, so it is only exact while the damage bonus is −1 or higher. Where the floor matters (D ≤ −2), the formula text must say so rather than print a number that disagrees with the exact card.
  - When hit chance is clamped (95% cap or nat-20-only), the substituted line shows the clamp explicitly.
- **Note:** during discussion the user approved a preview whose crit term read "P(crit) × avg die". That was a typo in the preview, and D-03's "P(crit) × (2 × avg die + D)" is the correct term. The preview's numbers (0.05 × 9.0 at D = 0) were already right.

### Crossover, plateau, and linear copy (COPY-03, COPY-04)
- **D-05:** The crossover explanation is generated from the same `DiceMath.crossings` result the chart uses. The existing chart caption builders (`VM.captionOrder`, `VM.captionCross`, `VM.captionBands`) are the source to reuse or extend, not a second derivation.
  - The text has distinct wording for no crossing, one crossing, and two crossings, and never claims a crossover that isn't there.
  - Across all 70,980 real settings the engine finds at most one crossing (02-03-SUMMARY). The two-crossing wording is still required by COPY-03, but it is exercised only by synthetic series in tests.
- **D-06:** The plateau text explains the 5%–95% clamp: a nat 1 always misses and a nat 20 always hits, so past the cap +1 to hit buys nothing. The linear text explains that +1 damage adds the same amount to every hit. Both point at the shaded chart bands, and the band wording only appears when a band is actually on the chart at the current settings.

### Suggested explorations (COPY-05)
- **D-07:** Each suggestion is a one-click "Try this" button that sets the controls. Its text says what to look for. There are at least two suggestions:
  - **A crossover:** AC 25 with a d12. At AC 25, +0, d12, +0, the damage bonus leads from +1 to +5 and +N to hit takes over at +6 (Phase 2 D-14 reference).
  - **Damage always wins:** AC 15 with a d8.
- **D-08:** A preset sets AC, die, attack bonus, and damage bonus through the normal control path (`VM.parseControl`), so the controls, outputs, and every section update exactly as if the user had set them. A rolled simulation run goes stale as usual (Phase 3 D-08). Each preset's description must be checked against the engine at those exact settings, so trying it shows exactly what the text says (success criterion 4).

### Accessibility (DEPLOY-04)
- **D-09:** The page must meet DEPLOY-04: every control reachable and operable by keyboard with a visible label, and miss vs hit distinguishable without color. That includes the new "Try this" buttons and the Roll button.
- **D-10:** Automated guards are added to `tools/check-page.mjs` so this stays true:
  - every form control and button has an accessible label;
  - tab order reaches every control;
  - miss cells carry a non-color cue (the `0` text plus the striped miss style).
- **Carried forward:** Phase 2 D-13 already settled keyboard access to the chart. The hover readout follows the slider for keyboard and touch users, and there is no chart focus or keyboard scrubbing. This is not re-opened.

### Review fixes before shipping
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

### Publishing (success criterion 5; DEPLOY-02 and DEPLOY-03 deferred from Phase 1)
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirements
- `.planning/ROADMAP.md` §"Phase 4: Designer Explanation & Final Ship" — goal, the 5 success criteria, Mode: mvp
- `.planning/REQUIREMENTS.md` — COPY-01..COPY-05, DEPLOY-04 (and DEPLOY-02/03, which are not actually verified yet, per D-14); STAT-02 (rounding consistency) and STAT-03 (value of the next +1)
- `.planning/PROJECT.md` — the expected-damage formula and core-insight paragraph (the source of the D-03 formulas), and the Key Decisions table

### Prior decisions and runbooks
- `.planning/phases/01-live-roll-table-deployed/01-CONTEXT.md` — D-11..D-13 repository and Pages decisions, the theme, and the table markup
- `.planning/phases/01-live-roll-table-deployed/01-03-PLAN.md` — the full deploy runbook (gh install, auth checkpoint, repo create, Pages API, URL check), deferred at its auth checkpoint
- `.planning/phases/02-bonus-comparison/02-CONTEXT.md` — D-13 (chart hover and keyboard access) and D-14 (crossover rules and reference cases)
- `.planning/phases/02-bonus-comparison/02-03-SUMMARY.md` — the crossing distribution (at most one real crossing) and caption builders
- `.planning/phases/03-roll-20-rounds-simulation/03-CONTEXT.md` — staleness rules that presets trigger

### Fixes in scope (D-11)
- `.planning/phases/02-bonus-comparison/02-REVIEW.md` — WR-01..WR-03
- `.planning/phases/03-roll-20-rounds-simulation/03-REVIEW.md` — WR-01..WR-04
- `.planning/phases/03-roll-20-rounds-simulation/deferred-items.md` — legend crit-swatch shrink

### Research
- `.planning/research/PITFALLS.md` — reference values for the explorations and formulas
- `.planning/research/FEATURES.md` — explorable-explanation patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `VM.captionOrder`, `VM.captionCross`, and `VM.captionBands` (`index.html` ~line 1137–1180) already generate the "who leads", crossing-count, and band sentences from `DiceMath.crossings` / `attackBands`. COPY-03 and COPY-04 should reuse or extend them, not re-derive.
- `DiceMath.marginals(p)` returns the exact value of the next +1 to hit and to damage, with a `reason` of 'cap', 'floor', or 'nodmg'. It feeds the existing "Value of the next +1" card and can drive the +1 formula text and its special cases.
- `DiceMath.stats(p)` and `DiceMath.closedFormPerRound(p)`: the closed form is documented as valid only for dmg ≥ −1, which is the D-04 caveat.
- `VM.CONTROL_SPEC` / `VM.parseControl` are the single parse path the presets must use (D-08).
- `VM.settingsText(p)` (Phase 3) formats settings as "AC 15, d8, +5 to hit, +0 damage" with a U+2212 minus. It is reusable in preset labels.
- `tools/check-page.mjs` already takes `[url]`, `--plain`, `--expect`, and `--width`, and checks for the banner being hidden and the Roll button being enabled. It is the natural home for the D-10 guards and the public-URL check.

### Established Patterns
- The page is one file with classic inline scripts: `dice-math` (~line 745) → `dice-sim` (~941) → `view-model` (~1005) → `dice-selftest` (~1295) → `app` (~1853). `tools/check-engine.mjs` loads the pure blocks by id.
- Every number is computed in the view-model and rendered through `textContent`. `innerHTML` is only used for integers and fixed literals. New copy follows the same rule.
- The in-page self-test is at about 186–196 ms of its 200 ms budget. New copy assertions must be few and cheap in the page; exhaustive checks go in `tools/check-engine.mjs`.
- Renders are coalesced with `requestAnimationFrame`, and staleness is a comparison, so presets that set four controls at once must produce one coherent render.
- The existing section intro style is `<p class="section-intro">`, plus `.lede` in the header and `.footnote` under the table.

### Integration Points
- New copy blocks sit inside the existing `<section>` elements (`#stats`, `#tables`, `#chart`), plus one new explorations section at the end of `<main>`.
- The preset buttons dispatch through the same `onControl` / state path as the controls in `<script id="app">`.
- Publishing uses `gh` (installed at `C:\Program Files\GitHub CLI\gh.exe`, not authenticated) and `git push`. There is no git remote yet.

</code_context>

<specifics>
## Specific Ideas

- Formula look the user approved, with the crit term corrected per D-03:
  ```
  Hit chance = faces that hit / 20
             = (21 − (AC − bonus)) / 20, clamped to 5%–95%
             = (21 − (15 − 5)) / 20 = 11/20 = 55%

  Expected per round = P(normal hit) × (avg die + D) + P(crit) × (2 × avg die + D)
                     = 0.50 × 4.5 + 0.05 × 9.0 = 2.70
  ```
- Exploration anchors named in the requirements: AC 25 with a d12 shows a crossover, and AC 15 with a d8 shows the damage bonus always winning.

</specifics>

<deferred>
## Deferred Ideas

None. The discussion stayed within phase scope. Three options were offered and declined:
- A single "How it works" article, and collapsible "Why?" panels (D-01 chose woven copy).
- A fuller walkthrough voice with worked examples (D-02 chose short).
- Leaving the review fixes to a separate `/gsd-code-review --fix` run (D-11 folds them in).

</deferred>

---

*Phase: 04-designer-explanation-final-ship*
*Context gathered: 2026-09-26*
