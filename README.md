# D&D Combat Roll Simulator

A single-page, static site that shows how a D&D 5e attack resolves as a roll table: a d20 to-hit roll against Armor Class, then a single dX damage roll. It is built for game designers who want to understand the math, not just the result: why a bonus to hit stops paying off at the 95% cap while a bonus to damage keeps adding the same amount, and why the point where one overtakes the other depends on AC and the damage die.

What the page shows, top to bottom:

- **The outcome table.** The full live d20 x dX table for the current AC, die, attack bonus and damage bonus. Each cell is one equally likely (d20, die) pair: misses show 0 with a hatched background, hits are shaded by damage, the natural 20 row is a crit (2 x face + damage bonus), and a marked rule shows the first d20 roll that hits. A short paragraph beside the table (above it on narrow screens) explains the two rolls and why the average cell is the expected damage.
- **Six stat cards and "How these numbers are worked out".** The d20 roll that first hits, hit chance, crit chance, average damage on a hit, and expected damage per round and over 20 rounds, plus a card with the value of the next +1 to hit versus the next +1 to damage. In a section that opens on click, each formula is written out as a rule and then with today's numbers substituted, and it always ends in the same figure the card shows. Where the natural 1 / natural 20 clamp or the 0-damage floor applies, the formula says so.
- **The sweep chart.** Expected damage over 20 rounds for every +N from +0 to +20, with +N to hit as a solid line and +N to damage as a dashed line. A ring marks where the curves cross, and shaded bands mark where the to-hit curve is flat (the "95% cap" and "only a nat 20 hits" bands). Three short explanations under the chart say why the dashed line is straight, where the solid line flattens and why, and what moves the crossover. They are generated from the same numbers that draw the chart.
- **Compare +N.** Two tables side by side, or one at a time on a phone: the attack with +N added to the attack roll and with +N added to the damage roll, on the same color scale as the outcome table.
- **Roll 20 rounds.** Rolls real dice for 20 rounds at the current settings and sets the result beside the exact expectation and its spread, so you can see how far one fight lands from the average.
- **Try this.** Three one-click presets that set every control: a crossover at AC 25 with a d12, no crossover at AC 15 with a d8, and the 95% cap flipping the lead at AC 15 with a d12. Each description says what to look for, and every claim in it is checked against the engine.

Every control is a native form element with a visible label and can be reached with the Tab key. Misses are marked by the 0 and the hatch, not only by color.

## Live page

https://atomechllc.github.io/dnd-roll-tables/

Source: https://github.com/AtomechLLC/dnd-roll-tables (published from the `main` branch root with GitHub Pages).

## Self-test

Append `?test` to the page URL (or open `index.html?test` locally) to see a visible panel listing every reference check, plus a set of UI checks run against the live page. A normal load runs the same reference checks and logs the result to the browser console.

## Rules modeled

- A natural 1 always misses.
- A natural 20 always hits and is a critical hit: the damage dice are rolled twice, the damage bonus is added once.
- Otherwise the attack hits when d20 + attack bonus >= AC.
- Damage never drops below 0.

Because of the natural 1 and natural 20 rules, hit chance is always between 5% and 95%.

## Run locally

Open `index.html` directly in a browser, or serve it:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000/`.

## How it's built

One `index.html` with inline CSS and classic inline `<script>` blocks. No build step, no frameworks, no external requests, so the page also works when opened straight from disk. Every number on the page, including the numbers inside the explanations, comes from one exact rules engine; only the Roll 20 rounds button uses randomness.

## Dev checks (optional, Node 24)

```bash
node tools/check-engine.mjs
node tools/check-page.mjs [url] [--plain] [--width PX] [--expect TEXT]
node tools/check-page.mjs --fault render
```

- `check-engine` runs the in-page self-test in Node and checks the engine, the generated copy and the presets against invariants over all 70,980 control settings.
- `check-page` loads the page in headless Chrome and checks that the self-test passes with no console errors, that each `--expect` string is in the visible page text, and that the accessibility guards hold (every control labeled with a visible label, the Tab order, misses not marked by color alone).
- `check-page --fault render` makes the first render fail on purpose and checks that the page shows its error banner and leaves every control inert.

Neither is required to run or deploy the site.
