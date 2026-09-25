# Pitfalls Research

**Domain:** D&D 5e attack-roll probability visualizer (single static `index.html`, vanilla JS, inline SVG, GitHub Pages)
**Researched:** 2026-09-24
**Confidence:** HIGH for the math and reference values (computed by brute-force enumeration in Node 24 and checked against SRD rules text). HIGH for GitHub Pages behaviour (official docs). MEDIUM for UX/visualization guidance (established practice, not project-tested).

Phase names used below: **Math core** (rules engine + exact expectations + self-checks), **Rendering** (2D tables, SVG chart, explanatory text), **Simulation** (roll-20-rounds button), **Deployment** (repo + Pages).

---

## Review of PROJECT.md Context formula

The expected-damage formula in PROJECT.md is **correct**:

```
P(crit)        = 1/20
P(normal hit)  = #{ r in 2..19 : r + A >= C } / 20
E              = P(normal)*(avg + D) + P(crit)*(2*avg + D),  avg = (X+1)/2
P(any hit)     = clamp((21 + A - C) / 20, 1/20, 19/20)
```

Brute-force enumeration over every (d20, damage dice) outcome, with a real 2dX roll on crits, gives exactly the same E for every tested case. The surrounding prose has five problems, though. Fix them before they get copied into the page text:

1. **"+1 to hit adds 5% x average damage"** leaves out the damage bonus. It is 5% x (avg + D). Over 20 rounds each +1 to hit adds exactly `avg + D` damage, but only while the bonus is inside the linear region.
2. **"+1 to damage adds hit chance x 1"** needs to say that this is hit chance *including crits*. The crit adds D once, so the multiplier is `P(any hit)`, not `P(normal hit)`. Over 20 rounds it is `20 x P(any hit)`.
3. **"attack bonus plateaus"** is only half the shape. There is also a **floor dead zone**. When `C - A > 19`, only a nat 20 hits, and the first few +1s add nothing. Example: AC 25, +0 to hit, d8. The attack curve stays flat at 9.0 for N = 0..5 and starts rising at N = 6. So the attack curve is flat, then linear, then flat, not simply a rising line that levels off. The text and chart annotations have to cover both flat regions.
4. **"the crossover moves with AC and die size"** is true, but in most of the control space **there is no crossover at all**. The marginal rule is: +1 to damage beats +1 to hit whenever `P(any hit) > (avg + D) / 20`. With D = 0 the thresholds are d4: 12.5%, d6: 17.5%, d8: 22.5%, d10: 27.5%, d12: 32.5%. At AC 15 with +0 to hit and a d8, the damage curve is above the attack curve at every N from 1 to 20. A crossover only appears when hit chance is low: high AC, low base attack bonus, large die. The page must handle "no crossover in this range" as a normal state, not assume a crossing exists. (See Pitfall 7.)
5. **The 2D table cannot show a true crit.** A table with one column per dX face can only show a crit as `2 x face + D`, which is "double the rolled die". 5e says "roll the damage dice twice and add them together", which is 2dX. The mean is the same, so E is unaffected, but the distributions differ: 2dX is triangular and 2 x dX is flat with only even values. See Pitfall 4.

---

## Critical Pitfalls

### Pitfall 1: Off-by-one on "meets it, beats it" (`>` instead of `>=`, or `20 -` instead of `21 -`)

**What goes wrong:**
The code uses `d20 + A > AC`, or a closed form like `(20 - (C - A)) / 20`. Every hit chance comes out 5 points low: AC 15 with +5 gives 0.50 instead of 0.55. The attack plateau starts one step late, and the crossover moves.

**Why it happens:**
"Beat the AC" is how people say it casually. The SRD says "equals or exceeds." The closed form needs `21` because there are 20 faces and the threshold face itself counts.

**How to avoid:**
- Compute hit chance by **counting faces** (loop r = 1..20), not with a closed form. Use the closed form only as an independent cross-check assertion.
- Put the rule in one function, e.g. `outcome(r, A, C) -> 'miss' | 'hit' | 'crit'`, and use it for the table, the exact math and the simulator.

**Warning signs:**
AC 15 with +5 does not give 0.55. AC 10 with +0 does not give 0.55. The plateau starts at `A = C - 1` instead of `A = C - 2`.

**Phase to address:** Math core (assertions run on page load).

---

### Pitfall 2: Missing or half-applied nat-20 / nat-1 clamp

**What goes wrong:**
One of these happens:
- Hit chance reaches 100% at high bonus because nat 1 is not forced to miss.
- Hit chance reaches 0% at high AC because nat 20 is not forced to hit.
- Nat 20 is counted both as a normal hit and as a crit, so P(hit) goes over 1 or E is inflated by an extra `0.05 x (avg + D)`.
- The clamp is applied to hit chance but not to the table rows. The d20 = 1 row then shows damage when `1 + A >= C`, and the d20 = 20 row shows 0 when `20 + A < C`.

**Why it happens:**
The formula and the table are written separately. The clamp gets added to one and not the other. A sweep up to +20 at AC 10 makes `1 + A >= C` true, which is exactly when the missing nat-1 rule shows up.

**How to avoid:**
- Rule order inside `outcome()`: `if (r === 1) return 'miss'; if (r === 20) return 'crit'; return r + A >= C ? 'hit' : 'miss';`. The order matters.
- The normal-hit loop covers **2..19 only**, as in PROJECT.md.
- Assertions: `P(any hit)` in [0.05, 0.95] for every AC in 10..25 and every A in 0..40. The nat-1 row sums to 0 for all inputs. The nat-20 row is non-zero for all inputs.

**Warning signs:**
The attack-bonus curve keeps rising past the damage curve with no plateau. The table's top or bottom row changes colour when you drag the attack bonus. Any value shows 100% or 0%.

**Phase to address:** Math core; Rendering (the table's row styling must come from `outcome()` too).

---

### Pitfall 3: Doubling the damage bonus (or the whole damage) on a crit

**What goes wrong:**
The crit is computed as `2 x (die + D)` instead of `2 x dice + D`. E is overstated by `0.05 x D` per round, which is `D` per 20 rounds. That quietly makes damage bonuses look better than they are, and those damage bonuses are one of the two things the page is comparing. At D = 20 the error is +20 damage over 20 rounds.

**Why it happens:**
"Double damage on a crit" is how many tables play it. Implementations also sometimes multiply the result of a `damage()` helper that already includes the bonus.

**How to avoid:**
- Keep dice and modifier separate everywhere: `damage = sumOfDice + D`, where a crit only changes how many dice are rolled.
- Assertion: with A fixed, `E(D+1) - E(D) === P(any hit)` exactly (within 1e-9), including the crit's 0.05. If the difference is `P(any hit) + 0.05`, the bonus is being doubled.

**Warning signs:**
The damage-bonus curve's slope per +1 over 20 rounds is `20 x P(hit) + 1` instead of `20 x P(hit)`. The crit-row cells in the table grow by 2 per +1 damage instead of 1.

**Phase to address:** Math core.

---

### Pitfall 4: Crit row in the 2D table misrepresents 5e (single die doubled vs 2dX)

**What goes wrong:**
The table's crit row shows `2 x face + D`. That is correct on average but not the real 5e distribution, because the real rule rolls two dice. If the simulator uses the same shortcut, its variance is slightly too high. For AC 15, +5, d8, the 20-round SD is 14.53 with the doubled die versus 14.17 with 2d8. It also never produces odd crit totals (with D = 0).

**Why it happens:**
The table has one damage column per face. There is nowhere to put the second die.

**How to avoid:**
- **Simulation:** always roll two dice on a crit. Never double one die.
- **Table:** pick one approach and label it clearly:
  - (a) Show the crit row as "2 x face + D (mean-equivalent)", with a footnote that 5e rolls 2dX and the mean is the same.
  - (b) Show the crit row's cells as `face + avg(dX) + D`, i.e. one rolled die plus the average of the second. This is also mean-equivalent.
  - Option (a) is easier to read. Either way, the table-sum check still holds (see Reference values).
- Explanatory text: one sentence saying that average damage is the same either way, but a real crit is 2dX.

**Warning signs:**
Simulated crit totals are always even. Designers with 5e experience point out that crits aren't doubled.

**Phase to address:** Rendering (label/footnote); Simulation (two dice).

---

### Pitfall 5: Form inputs are strings, so `"5" + 1 === "51"`

**What goes wrong:**
`input.value` is a string. `r + attackInput.value` concatenates instead of adding. `"9" >= "15"` is **true**, because string comparison is lexicographic (verified in Node 24). Hit checks look right for some values and wrong for others: two-digit AC against a one-digit roll is where it breaks. An empty field gives `NaN`, and every comparison with it is false, so everything misses.

**Why it happens:**
Vanilla JS with no framework handling form values. Sliders look numeric, but `.value` is still a string.

**How to avoid:**
- Read all controls through one parser: `const n = el.valueAsNumber; return Number.isFinite(n) ? clamp(Math.round(n), min, max) : fallback;`.
- Store a single `state` object of numbers. Render functions take numbers only, never DOM elements.
- Use the `input` event on sliders so updates are live. `change` only fires on release.

**Warning signs:**
The results look right for AC 10..19 but are wrong or all-miss for some combinations. The console shows `NaN`. Typing in a number box breaks the table until blur.

**Phase to address:** Math core (state and parsing) and Rendering (event wiring).

---

### Pitfall 6: Floating-point display that contradicts itself

**What goes wrong:**
`(1.575).toFixed(2)` gives `"1.57"` and `(4.35).toFixed(1)` gives `"4.3"` (both verified in Node 24). The page shows E/round = 1.57 and E/20 rounds = 31.50. A designer multiplies 1.57 x 20 = 31.4 and decides the math is wrong. Adding `0.05` twenty times gives `1.0000000000000002`, and `0.1*3` shows up as `0.30000000000000004` if printed raw.

**Why it happens:**
Binary floats can't represent values like 1.575 exactly, and hit chance gets accumulated in steps of 0.05.

**How to avoid:**
- Keep probabilities as **integer counts over 20** (hit faces) and damage sums as integers over `20 x X` (or `20 x X^2` for exact 2dX). Divide only at display time.
- Display per-round E with 3 decimals, or show the 20-round total as the primary number, since it is a "nicer" multiple. Show hit chance as `11/20 (55%)`. Game designers like seeing the fraction.
- Never print a raw float. Route every number through one `fmt()` helper.

**Warning signs:**
Numbers ending in ...0000001 or ...9999999. Per-round x 20 differs from the displayed 20-round total.

**Phase to address:** Math core (representation) and Rendering (formatting).

---

### Pitfall 7: The "crossover" story is wrong or oversold

**What goes wrong:**
The explanatory text or a chart marker says "attack bonus wins until +N, then damage wins", or the reverse. It is written as if a crossover always exists. For most AC/die combinations with D = 0, the damage curve is above the attack curve at every N >= 1. Two other mistakes are common:
- The text uses the **marginal** comparison ("the next +1") to explain a chart that plots **cumulative** curves ("+N total"). These cross at different N. At AC 25, +0, d8, the marginal advantage flips at N = 6, but the cumulative curves cross between N = 6 and 7 (13.5 vs 15.0, then 18.0 vs 16.0).
- The text skips the floor dead zone (see "Review" item 3), so the explanation doesn't match the flat start of the attack curve at high AC.

**Why it happens:**
The core insight is described in marginal terms, but the chart is cumulative. Nobody checks the text against real parameter sweeps.

**How to avoid:**
- Compute the crossover numerically from the two 21-point series: first N where the order flips. Render "No crossover in +0..+20: damage bonus is ahead everywhere" as a first-class state.
- In the text, show the marginal rule once, with the variables substituted live: "+1 to hit is worth `avg + D` = 4.5 per 20 rounds; +1 to damage is worth `20 x P(hit)` = 6.0." That explains *why* one curve is steeper right now. The chart shows the cumulative outcome.
- Mark the plateau start (`A + N = C - 2`) and the dead-zone end (`A + N = C - 19`) on the chart when they fall inside 0..20.
- Pick AC/die defaults that make the lesson visible. AC 15 / +0 / d8 shows the plateau clearly, and AC 22-25 shows a crossover. Consider offering a "show me a crossover" preset.

**Warning signs:**
The crossover label points to a spot where the lines don't cross. The text says "attack bonus wins at low bonus" while the chart shows damage ahead from N = 1.

**Phase to address:** Rendering (text + chart annotations); Math core provides `crossoverN()` and plateau/dead-zone helpers.

---

### Pitfall 8: Ambiguous sweep baseline (what is "+N on top of"?)

**What goes wrong:**
The controls include an attack bonus and a damage bonus, and the chart sweeps +0..+20. If the sweep replaces the base instead of adding to it, or if the two curves use different baselines, they don't meet at N = 0 and the comparison is meaningless. The same ambiguity applies to the "+N" in the side-by-side tables.

**How to avoid:**
- Define the sweep as: attack curve = `E(A + N, D)`, damage curve = `E(A, D + N)`, with A and D taken from the controls.
- Assertion: **both curves are equal at N = 0.**
- Name the N used by the side-by-side tables in the UI, e.g. "Compare at +N = [slider]". Keep it in sync with a vertical marker on the chart.
- Label the axis "Extra bonus added (+N)" and not "Attack bonus".

**Warning signs:**
The two lines start at different y values. Changing the base attack bonus does not move the chart.

**Phase to address:** Math core (definition); Rendering (labels and marker).

---

### Pitfall 9: Biased or unauditable dice in the simulator

**What goes wrong:**
- `Math.round(Math.random() * X)` returns 0..X, and the two endpoints get half the probability. Measured over 10^6 draws for X = 8: P(0) = P(8) = 0.063, every other face 0.125. The dice are wrong and there are zeros.
- `Math.ceil(Math.random() * X)` can return 0 when `Math.random()` returns exactly 0.
- `crypto.getRandomValues(...)[0] % X` has modulo bias for X that doesn't divide 2^32.
- There is no record of what was rolled, so a surprising total can't be checked.

**Why it happens:**
Copy-pasted dice snippets. Nobody tests a histogram.

**How to avoid:**
- Use `1 + Math.floor(Math.random() * X)`. Math.random's quality is fine for this. Do not "upgrade" to crypto with `%`.
- Optionally add a tiny seeded PRNG (mulberry32 or sfc32, about 10 lines) with the seed shown in the UI and a "reroll with same seed" option, so a surprising result can be reproduced and shared.
- Show a per-round log: d20 face, hit/miss/crit, dice faces, damage. The log **is** the teaching tool.
- Dev-only self-test: roll 100k dX and check each face is within +/-1% of 1/X.

**Warning signs:**
The log shows a 0 damage face on a hit, or a d20 of 0 or 21. Crit rate over many presses is far from 5%.

**Phase to address:** Simulation.

---

### Pitfall 10: Presenting a 20-round sample as if it should match the expectation

**What goes wrong:**
The page shows "Rolled: 38 / Expected: 54" with no context. The designer assumes a bug, or learns the wrong lesson. Over 20 rounds the spread is huge: at AC 15, +5, d8, the SD of the 20-round total is about **14.2**, so totals from roughly 26 to 82 are unremarkable. At AC 25 the SD (about 13.6 for d12) is **larger than the mean** (13.0).

**Why it happens:**
Showing the variance is an explicit goal ("designers do not over-trust averages"), but implementations display the sample without a scale.

**How to avoid:**
- Compute the exact per-round variance from the same enumeration (with true 2dX crits) and show `Expected 54.0 +/- 14.2 (1 SD)`, and where the roll falls, e.g. "within 1 SD".
- Keep a running history of presses (count, mean of realized totals). The history mean visibly converges toward E, which is the actual lesson. Optionally draw realized totals as dots on a small strip.
- State the sample size explicitly: "20 rounds = 20 attacks, 1 sample."
- Never feed simulated numbers into the "exact" panel. Keep the two visually distinct.

**Warning signs:**
Users report "the simulator disagrees with the math". There is no SD or range anywhere on the page.

**Phase to address:** Simulation (and Math core supplies variance).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Closed-form hit chance instead of face counting | One line | Off-by-one and clamp bugs that are hard to see; diverges from table | Only as a cross-check assertion |
| Separate hit logic in table, math and simulator | Faster to write each part | Three rule implementations drift apart (nat 1/20, `>=`) | Never. Use one `outcome()` |
| Doubling one die for crits everywhere | Fits the table | Simulator variance wrong; misstates 5e | Table display only, with a label |
| Auto-scaling chart Y axis on every update | No axis maths | Curves look the same shape at every AC; changes are invisible | Acceptable if the y-axis max is labelled and gridlines have values; better: fixed max per die (max over AC range) |
| Rebuilding all tables via `innerHTML` on each input | Simple | Fine at 3 x 240 cells; loses focus/scroll if controls are inside the rebuilt region | Acceptable. Keep controls outside re-rendered containers |
| Skipping in-page assertions | Less code | Regressions in the core math ship silently | Never. They are ~30 lines and run in <1 ms |

## Integration Gotchas (GitHub Pages / git / gh)

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GitHub CLI | Assuming `gh` exists. **On this machine it is not installed** (`gh: command not found` in Git Bash; no `C:\Program Files\GitHub CLI`) | Deployment phase must first install it (`winget install --id GitHub.cli`) and run `gh auth login` (interactive, so the user does it), or fall back to creating the repo in the web UI + `git remote add` |
| git default branch | `git init` here defaults to **`master`** (`init.defaultBranch` is unset globally), but the Pages config/API call says `main` | Use `git init -b main` (or `git branch -M main`) and point Pages at the same branch |
| Pages source | Enabling Pages on `gh-pages` or `/docs` while `index.html` sits at repo root on `main` gives a 404 | Source = `main`, path = `/` (root). API: `gh api repos/OWNER/REPO/pages -X POST -f "source[branch]=main" -f "source[path]=/"` |
| Repo visibility | Creating a private repo on GitHub Free: Pages is unavailable | Official docs: on GitHub Free "the repository must be public". Use `gh repo create NAME --public --source . --push` |
| Entry file name | `Index.html` or `index.htm`: works locally on Windows, 404 on Pages (case-sensitive) | Exactly `index.html`, lowercase, at the published root |
| Project-site paths | Root-absolute URLs (`/style.css`, `/favicon.ico`) resolve to `user.github.io/` and not `user.github.io/REPO/` | Single inline file avoids this. If any asset is added later, use relative paths (`./x`) |
| Jekyll | Branch deploys run through Jekyll by default; files/folders starting with `_` are dropped; Liquid runs on files with front matter | Add an empty `.nojekyll` at the root. It costs nothing and removes the whole class of surprises |
| Publish latency | Declaring failure on a 404 right after enabling | Docs: "up to 10 minutes" to publish. Poll `gh api repos/OWNER/REPO/pages/builds/latest` until `status` = `built`, then `curl -I` the URL and expect 200 |
| Encoding | Missing `<meta charset="utf-8">`; symbols in the explanatory text show as mojibake if charset sniffing goes wrong | First line of `<head>`: `<meta charset="utf-8">`; save the file as UTF-8 without BOM |
| Favicon | Console shows a 404 for `/favicon.ico` on every load | Inline data-URI favicon: `<link rel="icon" href="data:,">` |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recomputing 21-point sweeps and 2D tables with DOM writes interleaved with layout reads | Slider feels sticky on low-end laptops | Compute all numbers first (pure functions), then one DOM write per container; optionally wrap in `requestAnimationFrame` | Not at this scale (21 x 20 x 12 ops). Only if layout reads are interleaved with writes |
| Exact variance via 2dX enumeration per sweep point | None realistically | `20 x X^2` = 2,880 ops for d12; fine | Never at this project's scale |
| Future "simulate 100k rounds" feature run on the main thread | UI freeze | Chunk with `setTimeout`/rAF, or cap at 10k | Above ~10^6 rolls per click |

This project has no realistic performance problems. Don't add Workers, virtualization or memoization.

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Writing `input.value` into `innerHTML` unparsed | Self-XSS only (no server, no stored data). Very low risk | Everything goes through the numeric parser. Build text with `textContent` or numbers only |
| Reading state from URL query/hash (share links) into `innerHTML` | Reflected XSS on a public github.io URL | If shareable URLs are added, parse to integers and clamp. Never inject strings |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Continuous colour scale by damage value, with misses at 0 on the same ramp | Miss cells look like "low damage"; the miss/hit boundary, **the** lesson of the table, disappears | Categorical first: misses are neutral grey (or hatched), hits use a single-hue ramp by damage, and the crit row gets a distinct accent/border. Draw a thick horizontal rule at the hit threshold row, since hit/miss depends only on the d20 row |
| Red/green encoding for miss/hit | ~8% of male users can't tell them apart | Grey vs blue/orange; also encode with text weight or a miss glyph and not only hue |
| 20 x 12 table unreadable, especially 3 side-by-side at d12 (36 data columns) | Horizontal scroll or tiny text on a laptop | Fixed cell width about 1.8-2.2em, `font-variant-numeric: tabular-nums`, 11-12px, minimal padding. Budget: 36 x ~28px + 3 row-header columns = about 1,100px, which fits 1280/1366 wide. Stack vertically below ~1100px. Test with d12 specifically |
| Side-by-side tables with no highlight of what changed | Designer can't see the "cell by cell" shift | In the +hit and +dmg tables, highlight cells that differ from baseline (e.g. an outline on newly-hit rows, and a "+N" delta in the cell title) |
| d20 rows ordered inconsistently between tables, or hit region at the bottom | Confusing; the eye expects "higher is better" | Use the same order in all three tables. Put 20 on top so the hit block is above the threshold rule. Label the row header "d20" and the column header "d8 roll" |
| Chart without axis titles, units or tick values | Designers can't read off numbers; looks decorative | Axis titles ("Extra bonus +N", "Expected damage over 20 rounds"), integer x-ticks 0..20, y gridlines with values, y axis starting at 0 (never truncate: it exaggerates the plateau) |
| Two curves differing only by colour | Ambiguous in grayscale/colour-blind view | Solid vs dashed lines plus direct end-of-line labels instead of a detached legend |
| No markers for plateau/dead zone/crossover | The key insight is left for the user to infer | Annotate plateau start, dead-zone end and crossover when they are in range, with a short caption |
| SVG with fixed `width`/`height` in px | Overflows on mobile; text scales badly | `viewBox` + `width:100%`; keep font sizes in SVG user units tuned for the viewBox |
| Showing only percentages or only fractions | Designers lose the "count the faces" intuition | Show both: `11/20 = 55%` |
| Formulas shown with symbols but not the live numbers | Formula text is abstract; readers can't connect it to the chart | Show each formula once symbolically and once with the current values substituted |

## "Looks Done But Isn't" Checklist

- [ ] **Hit rule:** passes AC 15 / +5 = 0.55. Verify `>=` and not `>`.
- [ ] **Clamp:** at AC 10, +20 the nat-1 row is still all 0. At AC 25, +0 the nat-20 row is still non-zero.
- [ ] **Crit:** raising D by 1 raises the crit-row cells by 1, not 2. `E(D+1) - E(D) = P(any hit)`.
- [ ] **Table = formula:** sum of all table cells / (20 x X) equals E from the formula (to 1e-9).
- [ ] **Chart:** both curves share the point at N = 0. The attack curve is flat after `A + N >= C - 2`. It is flat before `A + N >= C - 19` when that is in range.
- [ ] **Crossover text:** shows "no crossover" at AC 15 / +0 / d8 and reports a crossover at AC 25 / +0 / d8 (cumulative flip at N = 7).
- [ ] **Inputs:** clearing a number box does not produce NaN anywhere. AC 9 vs 15 compares numerically.
- [ ] **Simulator:** crits roll two dice (an odd crit total appears with D = 0 in the log eventually). No 0 or out-of-range faces. Shows expected +/- SD.
- [ ] **Display:** per-round E x 20 matches the displayed 20-round total at every setting. No raw float tails.
- [ ] **Readability:** three d12 tables fit without horizontal scroll at 1366 px wide and stack on mobile.
- [ ] **Deploy:** `curl -I https://USER.github.io/REPO/` returns 200 (not just "Pages enabled"). The page works in a private window. The console shows no 404s.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Off-by-one / clamp / crit-bonus bug found late | LOW if there is a single `outcome()`; MEDIUM if logic is duplicated | Consolidate into `outcome()` + enumeration, then add the reference-value assertions |
| Explanatory text contradicts chart | LOW | Generate the text's numbers from the same functions (live substitution); rewrite the crossover paragraph to handle "none in range" |
| Pages 404 after deploy | LOW | Check the branch name (master vs main), source path (`/`), `index.html` casing and repo visibility. Wait up to 10 min and check `pages/builds/latest` |
| Unreadable tables | MEDIUM (CSS rework) | Fix cell width first, then stack breakpoints, then shrink font. Test d12 x 3 at 1366 px |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. `>=` off-by-one | Math core | Assertion: AC 15/+5 gives 11/20 |
| 2. Nat-1/nat-20 clamp | Math core (+ Rendering for row styling) | Assertion sweep AC 10..25 x A 0..40 within [1/20, 19/20]; row 1 sums to 0 |
| 3. Crit doubles bonus | Math core | Assertion: `E(D+1) - E(D) === P(any hit)` |
| 4. Crit row vs 2dX | Rendering (label) + Simulation (two dice) | Footnote present; sim log shows two dice on crit |
| 5. String inputs | Math core (state/parser) + Rendering (events) | Manual: AC 9 vs 15, empty field, live slider |
| 6. Float display | Math core + Rendering | Per-round x 20 = displayed total for all test cases |
| 7. Crossover story | Rendering (text/annotations) using Math-core helpers | AC 15/+0/d8 shows "none"; AC 25/+0/d8 shows N = 7 |
| 8. Sweep baseline | Math core + Rendering | Curves equal at N = 0 |
| 9. Dice bias | Simulation | 100k-roll histogram within +/-1% per face (dev check) |
| 10. Sample vs expectation | Simulation | Expected +/- SD displayed; running mean converges |
| Deploy gotchas | Deployment | `gh` installed and authenticated; branch = main; `.nojekyll`; `curl -I` gives 200 |

---

## Reference Values (self-check assertions)

All values were computed by exhaustive enumeration (every d20 face x every damage die face, true 2dX on crits) and match the PROJECT.md closed form exactly. Notation: AC C, attack bonus A, die dX, damage bonus D. "E20" = expected total over 20 rounds.

**Hit chance: `P(any hit) = clamp((21 + A - C)/20, 1/20, 19/20)`; crit is always 1/20**

| AC | A | P(any hit) | P(normal) | Note |
|----|---|-----------|-----------|------|
| 15 | +5 | **0.55** (11/20) | 0.50 | canonical check |
| 15 | +0 | **0.30** (6/20) | 0.25 | |
| 15 | +12 | 0.90 | 0.85 | one below cap |
| 15 | +13 | **0.95** | 0.90 | cap reached at A = C - 2 |
| 15 | +20 | **0.95** | 0.90 | nat 1 still misses |
| 10 | +0 | 0.55 | 0.50 | |
| 25 | +0 | **0.05** | 0.00 | crit only |
| 25 | +5 | **0.05** | 0.00 | dead zone: still crit only |
| 25 | +6 | 0.10 | 0.05 | first non-crit hit at A = C - 19 |
| any | any | row d20 = 1: 0 damage; row d20 = 20: crit | | |

**Expected damage (E per round / E20)**

| AC | A | Die | D | P(hit) | E / round | E20 | SD of 20-round total (true 2dX crit) |
|----|---|-----|---|--------|-----------|-----|------|
| 15 | +5 | d8 | 0 | 0.55 | 2.700 | **54.0** | 14.17 |
| 15 | +0 | d8 | 0 | 0.30 | 1.575 | **31.5** | 13.01 |
| 15 | +20 | d8 | 0 | 0.95 | 4.500 | **90.0** | 12.06 |
| 15 | +5 | d8 | +3 | 0.55 | 4.350 | **87.0** | 19.77 |
| 13 | +5 | d8 | +3 | 0.65 | 5.100 | **102.0** | 19.30 |
| 15 | +5 | d4 | 0 | 0.55 | 1.500 | 30.0 | 7.58 |
| 15 | +5 | d12 | 0 | 0.55 | 3.900 | 78.0 | 20.74 |
| 10 | +0 | d6 | 0 | 0.55 | 2.100 | 42.0 | 10.88 |
| 20 | +5 | d10 | 0 | 0.30 | 1.925 | 38.5 | 16.00 |
| 25 | +0 | d12 | 0 | 0.05 | 0.650 | **13.0** | 13.58 |
| 10 | +20 | d4 | 0 | 0.95 | 2.500 | 50.0 | 6.12 |

(SD if crits instead double a single die: 14.53 for the first row, i.e. slightly higher. Use this to catch a "doubled die" simulator.)

**Sweep curves (E20; attack curve = +N to hit, damage curve = +N to damage)**

- AC 15, A 0, d8, D 0: N = 0 gives 31.5 / 31.5; N = 1 gives 36.0 / 37.5; N = 12 gives 85.5 / 103.5; **N >= 13: attack flat at 90.0**; N = 20 gives 90.0 / 151.5. Damage curve is ahead for every N >= 1 (**no crossover**).
- AC 15, A 5, d8, D 0: attack flat at 90.0 from N = 8; N = 20 gives 90.0 / 274.0.
- AC 25, A 0, d8, D 0: **attack flat at 9.0 for N = 0..5** (dead zone); N = 6 gives 13.5 / 15.0; **N = 7 gives 18.0 / 16.0 (crossover, attack ahead)**; N = 20 gives 76.5 / 29.0.
- AC 10, A 0, d12, D 0: attack flat at 130.0 from N = 8; N = 20 gives 130.0 / 298.0.

**Structural invariants (cheap asserts that catch whole classes of bugs)**

1. Curves equal at N = 0.
2. Attack-curve step (linear region) = `avg + D` per +1 over 20 rounds. For d8, D 0: 4.5.
3. Damage-curve step = `20 x P(any hit)` per +1. For AC 15/+0: 6.0.
4. Sum of all 2D-table cells / (20 x X) = E (holds for the "2 x face + D" crit row as well).
5. `P(any hit)` in [0.05, 0.95] for every input.
6. Marginal rule: +1 damage beats +1 hit iff `P(any hit) > (avg + D)/20`.

---

## Sources

- SRD 5.2 / 2024 rules, Critical Hit: "If you roll a 20 on the d20 for an attack roll, you score a Critical Hit, and the attack hits regardless of any modifiers or the target's AC... Roll all of the attack's damage dice twice and add them together. Then add any relevant modifiers." [dnd-wiki.org Critical Hit (5e24)](https://dnd-wiki.org/wiki/Critical_Hit_(5e24)), [D&D Beyond: 2024 core rulebooks expand the SRD](https://www.dndbeyond.com/posts/1717-2024-core-rulebooks-to-expand-the-srd). SRD 5.1 (2014) wording on "equals or exceeds", rolling 1 or 20, and crit dice is the same in effect (HIGH from rules knowledge and consistent with 5.2; the SRD 5.1 page fetches returned 403/404, so it was not re-fetched).
- GitHub Docs, [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site): entry file `index.html`/`index.md`/`README.md`; "up to 10 minutes" to publish; `.nojekyll`; Free plan requires a public repository.
- GitHub Docs, [Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site): branch + `/` or `/docs`; removing a selected `/docs` breaks the build.
- GitHub REST, [Pages API](https://docs.github.com/en/rest/pages/pages): `POST /repos/{owner}/{repo}/pages` with `source.branch` / `source.path`; `GET .../pages/builds/latest`.
- Local verification (this machine, 2026-09-24): Node 24.15 enumeration script for all reference values and SDs; `Math.round` dice bias measured over 10^6 draws; `"5"+1 === "51"` and `"9" >= "15" === true`; `(1.575).toFixed(2) === "1.57"`; `gh` not installed; `init.defaultBranch` unset (git 2.45.1 defaults to `master`).

---
*Pitfalls research for: D&D 5e attack-roll probability visualizer (static GitHub Pages)*
*Researched: 2026-09-24*
