# Stack Research

**Domain:** Zero-build, single-file interactive probability visualization (D&D 5e attack-roll math) hosted on GitHub Pages
**Researched:** 2026-09-24
**Confidence:** HIGH (deployment mechanics and platform APIs checked against current GitHub docs, gh CLI manual, MDN, and web-features Baseline data). Two items are MEDIUM and are flagged inline.

---

## Environment Facts (verified on this machine, 2026-09-24)

The roadmap has to account for these. They change the deployment phase.

| Fact | Observed | Implication |
|------|----------|-------------|
| **`gh` CLI is NOT installed** | Not found in bash PATH, PowerShell, Program Files, or WinGet links | Deployment phase must start with `winget install --id GitHub.cli --source winget`, then `gh auth login`. Open a **new terminal window** afterward because the installer changes PATH. |
| `winget` available | v1.29.380 | Official, recommended gh install path on Windows |
| git | 2.45.1.windows.1, Git Credential Manager (`credential.helper=manager`) | `git push` over HTTPS works once gh auth is set up (`gh auth setup-git`) |
| **Local branch is `master`** | `init.defaultBranch=master` in system gitconfig; repo is on `master` with 2 commits | The Pages source branch must match whatever gets pushed. Rename to `main` before the first push (recommended), or use `master` everywhere. |
| No git remote yet | `git remote -v` is empty | `gh repo create --source=. --push` adds `origin` and pushes |
| Python 3.14.4, Node 24.15.0 present | | Local preview via `python -m http.server`. Node is optional and only for dev checks. It must never become a build dependency. |

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| **HTML5, one `index.html`** | Living Standard | The whole deliverable: markup, inline `<style>`, inline `<script type="module">` | GitHub Pages looks for `index.html` at the top level of the publishing source. One file means no asset paths to break under the `/<repo>/` project-site subpath. | HIGH |
| **Inline `<script type="module">` (ES2022+)** | Evergreen browsers | All logic: probability engine, rendering, simulation | Module scripts are deferred (run after parse, so no `DOMContentLoaded` wrapper), strict by default, and scoped at the top level (no globals leak). An inline module with **no `import`s** also runs when you double-click the file (`file://`). The CORS restriction only affects fetching *external* module files. | MEDIUM (the file:// behavior for inline modules comes from community sources and spec reasoning; check once in the browser) |
| **Semantic `<table>` for each 20xN outcome table** | HTML | d20 rows x dX columns, cell = damage | This is tabular data, so use `<th scope="row">` and `<th scope="col">`. Screen readers announce row and column headers for free. With `table-layout: fixed` and `font-variant-numeric: tabular-nums` (Baseline since 2020), 20x12 stays aligned. Do **not** build the table itself with CSS grid `div`s. | HIGH |
| **CSS Grid for page layout** | Baseline, widely available | Controls sidebar, three side-by-side tables, chart, and explanation panels | `grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr))` puts three tables side by side on a laptop and stacks them on mobile with no media queries. | HIGH |
| **CSS Container Queries** | Baseline widely available (2025-08-14) | Shrink table font and padding based on the width of each table's own column, not the viewport | The PROJECT.md constraint is "legible at d12, three tables side by side." Each table's available width depends on its grid track, so `@container (max-width: 24rem) { td { font-size: .75rem } }` is the right tool. | HIGH |
| **CSS custom properties + `color-mix()` in `oklch`** | `color-mix()` and oklab/oklch Baseline widely available (2025-11) | Heatmap cell shading (damage intensity), a distinct color for misses, a crit highlight | Set `--t` (0 to 1) per cell from JS, then `background: color-mix(in oklch, var(--hot) calc(var(--t)*100%), var(--cold))`. The ramp is perceptually even and needs no color library or JS color math. | HIGH |
| **Inline SVG built with `document.createElementNS`** | SVG 1.1/2, universal | Line chart: x = bonus 0..20, two series (bonus to hit vs bonus to damage), expected 20-round damage | 2 series x 21 points is trivial. Use a fixed `viewBox="0 0 640 360"` with `width:100%; height:auto` so it scales responsively. Use `<polyline points="...">` per series, `<circle>` markers with `<title>` children for native hover tooltips, and `vector-effect="non-scaling-stroke"` so line weight stays constant when scaled. Add `role="img"` + `aria-labelledby` pointing at a caption. | HIGH |
| **Native form controls** | HTML | AC slider, die selector, bonus inputs | Use `<input type="range" min="10" max="25">` paired with `<output for="ac">` (Baseline since 2018) to show the live value. Use a `<fieldset>` of radio buttons for d4/d6/d8/d10/d12 (one visible choice per die, keyboard accessible, no custom widget code). Listen for the `input` event (live while dragging), not `change`. | HIGH |
| **`Math.random()` behind a `rollDie(sides, rng = Math.random)` seam** | ES | "Roll 20 rounds" simulation | MDN recommends `Math.random()` for non-cryptographic uses. `Math.floor(rng()*n)+1` has no measurable bias for n <= 20. Taking `rng` as a parameter lets tests pass a seeded PRNG (mulberry32, about 6 lines) and get reproducible rolls. | HIGH |

### Supporting "Libraries" (all hand-written, inline, zero dependencies)

The no-CDN, no-build rule means each of these is a small function in the one script, not a package.

| Piece | Size | Purpose | When to Use |
|-------|------|---------|-------------|
| `outcomeTable({ac, die, atk, dmg})` returns a 20xX array of `{damage, kind: 'miss' / 'hit' / 'crit'}` | ~20 lines | Single source of truth. Tables, stats, and chart all derive from it. | Always. PROJECT.md requires exact stats to be derived from the table. |
| `stats(table)` returns `{pHit, pCrit, ePerRound, e20}` | ~10 lines | Exact math: sum of cell damage / (20*X). Cross-check against the closed-form formula in PROJECT.md. | Always |
| `mulberry32(seed)` | ~6 lines | Deterministic PRNG for tests and optional "replay this roll" | Self-test mode, and a debugging aid |
| `linearScale(domain, range)` | ~3 lines | Maps data to SVG coordinates (a stand-in for d3-scale) | Chart |
| `niceTicks(max, count)` | ~10 lines | Y-axis tick values (1/2/5 x 10^k steps) | Chart. Y max changes with die and AC. |
| `el(tag, attrs, ...children)` / `svg(tag, attrs)` | ~10 lines | Small DOM helper so rendering code stays readable without a framework | Everywhere |
| `Intl.NumberFormat` | built-in | Format percentages (`style:'percent', maximumFractionDigits:1`) and decimals consistently | All displayed numbers |
| `<template>` element | built-in | Optional: static markup for a repeated panel (baseline / +N hit / +N dmg) cloned 3 times | Only if the three table panels share non-trivial chrome (caption + stats line). Otherwise `el()` is simpler. |
| `requestAnimationFrame` + `prefers-reduced-motion` | built-in | Optional "rolling" animation that highlights the rolled cell for each of the 20 rounds | Differentiator. Skip the animation when reduced motion is requested. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **`python -m http.server 8000`** (Python 3.14 installed) | Local preview at an http:// origin, matching Pages | Opening `index.html` directly also works for an import-free inline module, but serving it matches production. No install needed. |
| **In-page self-test (`?selftest` query param)** | Checks the math engine with `console.assert` and a visible pass/fail banner | Assert known values, e.g. AC 15, +5, d8: normal hits on r=10..19 give P(normal hit)=10/20, P(crit)=1/20, E = 0.5*4.5 + 0.05*9 = 2.70/round, 54.0 over 20 rounds. Also check nat-1 miss at +20, nat-20 hit at AC 25 with +0, and hit chance clamped to [5%, 95%]. Ships in the file at no cost and needs no test runner. |
| **gh CLI** v2.101.0 (latest, 2026-09-15) | Repo creation, Pages enablement via `gh api`, build status checks | Install: `winget install --id GitHub.cli --source winget` |
| Browser DevTools, responsive mode | Check legibility at laptop width (~1366px) with 3 x d12 tables | This is the hard layout case from PROJECT.md constraints |
| Optional: W3C Nu validator (validator.w3.org/nu) | HTML validity | Paste the file in, no install |

---

## Installation / Deployment

No `npm install`. Nothing to install for the site. The only tool install is gh:

```powershell
# 1. Install GitHub CLI (official Windows method), then OPEN A NEW TERMINAL WINDOW
winget install --id GitHub.cli --source winget

# 2. Authenticate (browser flow; choose HTTPS; lets gh configure git credentials)
gh auth login
gh auth setup-git
```

### Recommended: publish from branch root (no workflow file)

GitHub's own guidance: *"If you do not need any control over the build process for your site, we recommend that you publish your site when changes are pushed to a specific branch."* That fits this project exactly.

```bash
cd C:/Projects/GameDesignSkills/DnD-CombatRollSimulator

# 3. Normalize branch name (system default here is 'master')
git branch -m master main

# 4. Disable Jekyll processing (nothing to build; skips Jekyll and makes deploys faster and predictable)
touch .nojekyll          # PowerShell: New-Item .nojekyll -ItemType File
git add index.html .nojekyll && git commit -m "feat: initial site"

# 5. Create PUBLIC repo from the existing local repo, add 'origin', push commits
#    (Public is required for Pages on GitHub Free)
gh repo create DnD-CombatRollSimulator --public --source=. --remote=origin --push \
  --description "D&D 5e attack roll anatomy: d20 vs AC x damage die, +hit vs +damage"

# 6. Enable Pages: branch 'main', folder '/' (legacy = branch-based build)
#    No native `gh pages` command exists; use the REST API through gh api.
#    {owner}/{repo} placeholders resolve from the current directory's git remote.
gh api -X POST "repos/{owner}/{repo}/pages" \
  -f build_type=legacy -f "source[branch]=main" -f "source[path]=/"

# 7. Set the repo homepage to the Pages URL and check the build
gh repo edit --homepage "https://$(gh api user -q .login).github.io/DnD-CombatRollSimulator/"
gh api "repos/{owner}/{repo}/pages" -q '.status + "  " + .html_url'    # built | building | errored
gh api "repos/{owner}/{repo}/pages/builds/latest" -q .status
gh run list --limit 1        # branch publishing still runs as a "pages-build-deployment" Actions run
gh run watch                 # optional: follow it live
```

Notes:
- **Git Bash on Windows rewrites `/`-prefixed arguments into paths.** `-f "source[path]=/"` is safe because the argument does not start with a slash. If an MSYS path conversion ever mangles an argument, prefix the command with `MSYS_NO_PATHCONV=1`. PowerShell is unaffected.
- `POST .../pages` returns **409** if Pages is already enabled. Use `gh api -X PUT "repos/{owner}/{repo}/pages" -f "source[branch]=main" -f "source[path]=/"` to change the source.
- Project-site URL format: `https://<owner>.github.io/<repo>/`. Changes can take **up to 10 minutes** to publish.
- `index.html` must be at the root of the publishing source.

### Alternative: GitHub Actions deployment (use only if a build step appears later)

```bash
gh api -X POST "repos/{owner}/{repo}/pages" -f build_type=workflow
# or, if Pages already exists:
gh api -X PUT  "repos/{owner}/{repo}/pages" -f build_type=workflow
```

Then commit `.github/workflows/pages.yml`. This is GitHub's `static.yml` starter with action versions updated to the latest releases (checked against the GitHub releases API on 2026-09-24; the starter template itself still pins older majors):

```yaml
name: Deploy static content to Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: "pages"
  cancel-in-progress: false
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7               # latest v7.0.1 (2026-07); starter pins v4
      - uses: actions/configure-pages@v6        # latest v6.0.0 (2026-03); starter pins v5
      - uses: actions/upload-pages-artifact@v5  # latest v5.0.0 (2026-04); starter pins v3
        with:
          path: '.'
      - id: deployment
        uses: actions/deploy-pages@v5           # latest v5.0.1 (2026-09)
```

Confidence: MEDIUM on the bumped majors working together (they are the current releases, but I did not read each changelog for input changes). The starter's pinned versions (checkout@v4, configure-pages@v5, upload-pages-artifact@v3, deploy-pages@v5) are the lower-risk fallback. For this project, **don't use the workflow at all**. Branch publishing does the same thing with zero YAML.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Branch publishing (`main` + `/`) | GitHub Actions `build_type=workflow` | Only if a build step is added later (minification, multiple generated pages) or you want to publish a folder other than `/` or `/docs` |
| `main` root | `main` + `/docs` folder | If you don't want non-site files served. Currently `.planning/` **will be publicly served** from root. That is harmless for this project, but it should be a deliberate choice (see Stack Patterns). |
| Semantic `<table>` | CSS Grid of `div`s | Never for the outcome table. Grid is only for page layout. |
| Inline SVG | `<canvas>` 2D | Canvas pays off only with thousands of points or per-frame redraws. 42 points gain nothing, and you lose crisp scaling, DOM hit-testing, `<title>` tooltips, and accessibility. |
| `Math.random()` | `crypto.getRandomValues()` + rejection sampling | If you want a "cryptographically fair dice" talking point for the audience. It works in insecure contexts per MDN, but needs rejection sampling to avoid modulo bias, which is extra code with no teaching value. |
| `<input type="range">` + `<output>` | `<input type="number">` | Pair them (range for feel, number for exact entry) for the bonus control if +0..+20 on a slider feels imprecise |
| Recompute everything on every `input` event | Diffing / incremental DOM updates | Never needed. 3 tables x 240 cells + a 42-point chart rebuild in well under a frame. |
| Hand-written `el()` helper | Lit / Preact / htm via CDN | Ruled out by the no-CDN constraint. Would only make sense with dozens of stateful components. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Chart.js / D3 / Plotly via CDN | Explicitly out of scope. Adds a third-party runtime dependency, and a CDN outage breaks the page. | Inline SVG + `linearScale` + `niceTicks` (~40 lines total) |
| `npm`, `package.json`, Vite, bundlers, TypeScript | Out of scope. Any build step forces the Actions deployment path and adds maintenance. | Plain ES2022 in an inline module. Use JSDoc comments if you want types for editor hints. |
| External `.js`/`.css` files (`<script src>`, ES module `import`) | Violates the one-file constraint, and ES module imports fail over `file://` (CORS, null origin) | Everything inline |
| Monte Carlo for the displayed stats | PROJECT.md requires exact math derived from the table. Sampling noise would muddy the lesson. | Enumerate all 20xX cells. Monte Carlo only for the "roll 20 rounds" button. |
| `innerHTML` string-building for interactive parts | Loses element references needed for highlighting rolled cells, and it's an unsafe habit | `el()`/`createElementNS`. `innerHTML` is acceptable only for static, fully numeric output. |
| `change` event on sliders | Fires only on release, so the table doesn't feel live | `input` event |
| `light-dark()` as the *only* theming mechanism | Baseline "newly available" (2024-05), not widely available until ~2026-11 | `@media (prefers-color-scheme: dark)` overriding custom properties. `light-dark()` is fine as progressive enhancement. |
| Fixed pixel `width`/`height` on the SVG | Doesn't scale on mobile or in narrow grid tracks | `viewBox` + `width:100%; height:auto` + `vector-effect="non-scaling-stroke"` |
| `document.write`, inline `onclick=""` attributes, jQuery | Legacy patterns. Inline handlers break a future CSP. | `addEventListener` in the module |
| Leaving Jekyll on | Jekyll ignores files and folders starting with `_`, and runs an unnecessary build | Commit an empty `.nojekyll` at the root |
| Private repo on GitHub Free | Pages requires the repo to be public on Free plans | `--public` |

## Stack Patterns by Variant

**If the page grows to several files (e.g. v2 multi-dice page):**
- Keep branch publishing and use relative paths only (`./style.css`, never `/style.css`)
- Because project sites live under `/<repo>/`, a root-absolute `/` path points at `<owner>.github.io/` and 404s

**If you want the planning docs kept off the public site:**
- Move the site into `/docs` and set `source[path]=/docs`
- Because root publishing serves every committed file, including `.planning/*.md`. Harmless here, but worth one deliberate decision.

**If a test harness is wanted beyond `?selftest`:**
- A dev-only `node --test` script can read `index.html`, extract the `<script type="module" id="engine">` block, and import it as a `data:` URL module (Node 24 is installed)
- Must stay optional, never required to deploy

## Version Compatibility

| Component | Minimum | Notes |
|-----------|---------|-------|
| Container queries (size) | Chrome 105 / Safari 16 / Firefox 110 | Baseline widely available since 2025-08-14 |
| `color-mix()`, `oklch()` | Chrome 111 / Safari 16.2 / Firefox 113 | Baseline widely available since 2025-11-09 |
| `:has()` (optional, e.g. style the checked die radio's label) | Chrome 105 / Safari 15.4 / Firefox 121 | Baseline widely available 2026-06-19 |
| `light-dark()` | Baseline newly available 2024-05-13 | Enhancement only |
| `<output>`, `font-variant-numeric`, inline SVG, ES modules | Universal in evergreen browsers | |
| gh CLI | v2.101.0 current | `gh api` nested `key[sub]=value` fields and `{owner}/{repo}` placeholders are documented in the current manual |
| Pages Actions (alternative path only) | checkout v7.0.1, configure-pages v6.0.0, upload-pages-artifact v5.0.0, deploy-pages v5.0.1 | Starter template still pins v4/v5/v3/v5 |

Browser minimum versions are from training data (MEDIUM). The Baseline dates come from the web-features dataset (HIGH).

## Sources

- https://cli.github.com/manual/gh_repo_create — `--public`, `--source`, `--remote`, `--push`, `--description`, `--homepage` flags; example `gh repo create my-project --public --source=. --push` (HIGH)
- https://cli.github.com/manual/gh_api — `-f` vs `-F`, nested `key[subkey]=value`, default POST when fields are given, `{owner}/{repo}` placeholders (HIGH)
- https://cli.github.com/manual/ — command index checked: no native `gh pages` command; `https://cli.github.com/manual/gh_pages` returns 404 (HIGH)
- https://raw.githubusercontent.com/cli/cli/trunk/docs/install_windows.md — `winget install --id GitHub.cli --source winget`, new-window PATH note (HIGH)
- https://api.github.com/repos/cli/cli/releases/latest — v2.101.0, 2026-09-15 (HIGH)
- https://docs.github.com/en/rest/pages/pages — POST/PUT/GET `/repos/{owner}/{repo}/pages`, `build_type` legacy|workflow, `source.branch`, `source.path` `/` or `/docs`, 409 on conflict, `status` enum built/building/errored, `/pages/builds/latest` (HIGH)
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site — branch publishing recommended when no build control is needed; branch deploys still run via an Actions workflow (HIGH)
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site — GitHub Free requires public repo; `index.html` at the top level of the source; `.nojekyll`; up to 10 min to publish (HIGH)
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits — 1 GB site, 100 GB/month soft bandwidth, 10 min deploy timeout (HIGH)
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages — project site URL `<owner>.github.io/<repo>` (HIGH)
- https://github.com/actions/starter-workflows/blob/main/pages/static.yml — static Pages workflow structure (HIGH), with latest action tags from the GitHub releases API (versions HIGH; cross-major compatibility MEDIUM)
- https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues — usable in insecure contexts, 65,536-byte limit, `Math.random()` recommended for non-crypto uses (HIGH)
- web-features dataset (github.com/web-platform-dx/web-features) — Baseline dates for container queries, color-mix, oklab/oklch, :has, light-dark, output, font-variant-numeric (HIGH)
- https://github.com/whatwg/html/issues/8121, https://barker.codes/blog/javascript-modules-and-the-file-uri-scheme/ — module scripts and `file://`: external module fetches blocked by CORS; import-free inline modules unaffected (MEDIUM)
- Local environment inspection (git config, PATH, winget, python, node) on 2026-09-24 (HIGH)

---
*Stack research for: zero-build single-file interactive probability visualization on GitHub Pages*
*Researched: 2026-09-24*
