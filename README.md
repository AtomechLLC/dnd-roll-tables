# D&D Combat Roll Simulator

A single-page, static site that shows how a D&D 5e attack resolves as a roll table: a d20 to-hit roll against Armor Class, then a single dX damage roll. It renders the full 20 x X outcome table (0 damage on a miss) and exact headline stats, all derived from one self-tested rules engine. Later phases add the comparison of +N to hit versus +N to damage, shown as side-by-side tables and a sweep chart, plus a "roll 20 rounds" simulation. Built for game designers who want to understand the math, not just the result.

Phase 1 delivers the live outcome table and exact stats. The bonus comparison chart comes later.

## Live page

Not published yet. When it is deployed to GitHub Pages, the address will be
`https://<owner>.github.io/DnD-CombatRollSimulator/` (replace `<owner>` with the GitHub account that hosts the repo).

## Self-test

Append `?test` to the page URL (or open `index.html?test` locally) to see a visible panel listing every reference check. A normal load runs the same checks and logs the result to the browser console.

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

One `index.html` with inline CSS and classic inline `<script>` blocks. No build step, no frameworks, no external requests, so the page also works when opened straight from disk.

## Dev checks (optional, Node 24)

```bash
node tools/check-engine.mjs
node tools/check-page.mjs
```

The engine check runs the in-page self-test in Node and sweeps every control combination for math invariants. The page check loads the page in headless Chrome and confirms the self-test passes with no console errors. Neither is required to run or deploy the site.
