---
phase: 04-designer-explanation-final-ship
plan: 05
subsystem: deploy, docs
tags: [publish, github-pages, github-actions, ssh-remote, traceability, deploy-02, deploy-03]

# Dependency graph
requires:
  - phase: 04-designer-explanation-final-ship
    provides: "04-04 a11y guards (9)-(13), README describing the finished page; quick tasks 260927-17o (page order) and 260927-1ty (space density) layered on top"
provides:
  - "Public repo https://github.com/AtomechLLC/dnd-roll-tables with local history on main (pushed over SSH, never forced)"
  - "Live page https://atomechllc.github.io/dnd-roll-tables/ deployed by the repo's GitHub Actions static workflow"
  - "README 'Live page' section with the real URL and source link"
  - "REQUIREMENTS.md DEPLOY-02 / DEPLOY-03 recorded as verified in Phase 4"
affects: [milestone v1.0 close]

# Tech tracking
tech-stack:
  added: [".github/workflows/static.yml (GitHub's stock 'Deploy static content to Pages' workflow, added by the user on the remote)"]
  patterns:
    - "Live verification = HTTP 200 + byte-identical to local index.html + check-page on ?test, plain and --width 390 against the public origin"

key-files:
  created:
    - .github/workflows/static.yml
    - .planning/phases/04-designer-explanation-final-ship/04-05-SUMMARY.md
  modified:
    - README.md
    - .planning/REQUIREMENTS.md
    - .planning/STATE.md

key-decisions:
  - "Repo is AtomechLLC/dnd-roll-tables (user's choice at the Task 1 checkpoint), replacing CONTEXT D-13's DnD-CombatRollSimulator under the user's own account"
  - "No gh auth on this machine: origin is SSH (git@github.com:AtomechLLC/dnd-roll-tables.git); repo creation and Pages setup were done by the user on github.com"
  - "Pages source is GitHub Actions (the user's stock static.yml), not legacy branch publishing from main /; the remote commit was merged with --allow-unrelated-histories rather than force-pushed over"
  - "The stock workflow uploads path '.', so .planning/, tools/ and .github/ are publicly served, consistent with Phase 1 D-12 (root publishing serves every committed file)"

patterns-established:
  - "When the remote gains commits after an emptiness check, merge them (no rebase, no force) and re-run the secret scan and local checks before pushing"

requirements-completed: [DEPLOY-02, DEPLOY-03, DEPLOY-04]

# Metrics
duration: 12min (continuation; Task 1 checkpoint and Task 2 steps 1-5 ran in an earlier session)
completed: 2026-09-27
---

# Phase 4 Plan 05: Publish and Verify Live Summary

**The finished page is live at https://atomechllc.github.io/dnd-roll-tables/, deployed from main of the public repo AtomechLLC/dnd-roll-tables by a GitHub Actions static workflow. The served file is byte-identical to local index.html, and check-page passes on the live origin (SELFTEST PASSED 251/251, no console errors, a11y guards (9)-(13)).**

## Performance

- **Duration:** about 12 min for this continuation; the plan also spans an earlier session (Task 1 checkpoint, Task 2 steps 1-5)
- **Completed:** 2026-09-27
- **Tasks:** 3 of 3 (Task 1 was a human checkpoint)
- **Files modified:** 5 (README.md, .github/workflows/static.yml via merge, REQUIREMENTS.md, STATE.md, this SUMMARY)

## Accomplishments

- Public repo: https://github.com/AtomechLLC/dnd-roll-tables (owner AtomechLLC, default branch main)
- Pages URL: https://atomechllc.github.io/dnd-roll-tables/
- Final deploy run: https://github.com/AtomechLLC/dnd-roll-tables/actions/runs/36339561459 (head f1e10e1, status completed, conclusion success)
- Before the docs push, `origin/main` matched local `main` (`## main...origin/main`, no ahead or behind count)

## Task Commits

1. **Task 1: Human checkpoint.** The user answered with the remote `git@github.com:AtomechLLC/dnd-roll-tables.git` instead of running `gh auth login`. No commit.
2. **Task 2: Wire the remote, finalize the README, push.**
   - `5c4b2a0` docs(04-05): add the live Pages URL to the README (earlier session)
   - `f1e10e1` chore(04-05): merge the Pages workflow from AtomechLLC/dnd-roll-tables (merge of remote `6c77da9` "Create static.yml")
   - Push `6c77da9..f1e10e1 main -> main` over SSH, no force
3. **Task 3: Verify live and record traceability.**
   - `eaa4458` docs(04-05): record DEPLOY-02/03 verified live in Phase 4

**Plan metadata:** the final docs(04-05) commit after this SUMMARY.

## Live Check Results (2026-09-27, public origin)

| Check | Result |
|-------|--------|
| `curl -w %{http_code}` on the Pages URL | 200 (the first poll right after the push returned 404, the second, about 25 s later, returned 200) |
| Served bytes vs local index.html | 231,753 vs 231,753, `cmp` identical; `id="dice-math"` and `id="explore"` each present once |
| `check-page.mjs "${URL}?test" --expect "11/20 = 55%" --expect "Try AC 25 with a d12" --expect "the curves never cross, so there is no ring on the chart"` | CHECK-PAGE PASS, `SELFTEST PASSED: 251/251 (62.7 ms)`, one console line, no errors |
| `check-page.mjs "${URL}?test"` (1366 px) | CHECK-PAGE PASS, `SELFTEST PASSED: 251/251 (35.1 ms)` |
| `check-page.mjs "$URL" --plain` | CHECK-PAGE PASS (self-test panel hidden, a11y (9)-(13) ok, page order ok) |
| `check-page.mjs "${URL}?test" --width 390` and `"$URL" --width 390` | CHECK-PAGE PASS |
| Local `check-page.mjs` and `--plain` after the merge, before the push | CHECK-PAGE PASS both |
| `${URL}.planning/STATE.md` | 200 (planning docs are public, as accepted in Phase 1 D-12) |

## Decisions Made

See the key-decisions frontmatter. In short, the user owns the repo name, account and Pages mode. This plan adapted to those choices without touching GitHub settings, which would need auth.

## Deviations from Plan

### User-directed changes (checkpoint answers)

**1. Repo and owner: AtomechLLC/dnd-roll-tables instead of `<gh user>/DnD-CombatRollSimulator` (CONTEXT D-13)**
- **Found during:** Task 1 checkpoint
- **Change:** The user supplied the SSH remote directly. The README URL and source link use https://atomechllc.github.io/dnd-roll-tables/ and AtomechLLC/dnd-roll-tables. The plan's artifact pattern `github.io/DnD-CombatRollSimulator` therefore does not apply.
- **Commit:** 5c4b2a0

**2. gh CLI steps skipped (D-12)**
- No `gh auth login`, `gh auth setup-git`, `gh repo create`, `gh api .../pages` POST/PUT, or homepage update was run. The executor never authenticated or handled tokens. `git push` used the user's existing SSH setup. Because the plan's automated verify block derives OWNER and URL from `gh api`, it was replaced by direct curl, public Actions API and check-page runs against the known URL.
- The repo homepage field (acceptance criterion `gh repo view --json homepageUrl`) was **not set or verified**. That needs auth; see User Setup Required.

**3. Pages mode: GitHub Actions workflow instead of legacy branch publishing (main /)**
- **Found during:** Task 2 push (rejected with "fetch first")
- **Issue:** After the orchestrator's emptiness check, the user created `.github/workflows/static.yml` on the remote (commit 6c77da9 by Alexander Brazie). It is GitHub's stock static Pages workflow: on push to main, upload path '.', deploy-pages. It had no shared history with local main.
- **Fix:** At the checkpoint, option A was auto-selected (non-destructive): `git fetch`, then `git merge origin/main --allow-unrelated-histories`. The merge added only that file (`git diff --stat HEAD~1 HEAD`: 1 file, 43 insertions). The secret scan and local checks were re-run, then a normal push. No force and no rebase.
- **Effect:** `.nojekyll` is now irrelevant, because the Actions artifact is not Jekyll-processed. The whole repo (including `.planning/`, `tools/` and `.github/`) is published, which matches the Phase 1 D-12 acceptance of root publishing.
- **Commit:** f1e10e1

### Auto-fixed Issues

None. The secret scan's broad `git grep` matched only the regex text quoted in planning docs. A token-shaped-only scan (`git grep -hoE`) over HEAD found nothing (exit 1), and no .env, key, pem or credential files are tracked.

## Issues Encountered

- The first push was rejected because the remote had gained a commit. It was resolved by the merge above.
- Right after the push, the Pages URL answered 200 while the API still showed the run as "queued". The run completed with success seconds later, and the byte-identical comparison confirms the served page is this build.

## User Setup Required

Optional, on github.com (needs your login):
1. Repo **Settings > General > About**: set the website to https://atomechllc.github.io/dnd-roll-tables/ (the plan's homepage step, skipped without gh auth).
2. Open https://atomechllc.github.io/dnd-roll-tables/ once in a real Chrome with DevTools and confirm the console is empty (headless Chrome never requests /favicon.ico; the page ships `<link rel="icon" href="data:,">`, so none should be requested).
3. If you would rather not publish `.planning/` and `tools/`, change the workflow's `path: '.'` to a folder that holds only `index.html` (not required; Phase 1 D-12 accepted publishing them).

## Known Stubs

None.

## Next Phase Readiness

This is the last plan of the last phase. Every v1 requirement (47) is Complete, and the milestone is ready for verification and close. Each later push to main redeploys automatically through the workflow.

## Self-Check: PASSED

- FOUND: .github/workflows/static.yml, README.md (live URL), .planning/REQUIREMENTS.md (2x "verified in Phase 4")
- FOUND commits: 5c4b2a0, 6c77da9, f1e10e1, eaa4458
