---
phase: quick-261103-d9g
plan: 01
status: complete
subsystem: page header
tags: [header, community-link, a11y, css-grid, container-query]
requires: []
provides:
  - "Header link to https://funsmith.club with the inline Discord mark (currentColor)"
  - "check-page guard (11) order starting with https://funsmith.club; new guard (15) community link"
affects: [index.html, tools/check-page.mjs]
tech-stack:
  added: []
  patterns:
    - "Header is a 2-column grid (title | link, lede below); a named @container page (width < 28rem) block moves the link to its own right-aligned row above the h1"
key-files:
  created: []
  modified: [index.html, tools/check-page.mjs]
decisions:
  - "Same tab: no target, no rel. The accessible name stays exactly 'Funsmith Club' and there is no reverse-tabnabbing surface (guard (15) fails on any target)"
  - "Breakpoint stays at 28rem; at 480px (28.5rem content) the side-by-side layout still keeps the h1 at 2 lines"
metrics:
  duration: 5 min
  completed: 2026-11-03
  tasks: 3
  files: 2
---

# Quick 261103-d9g: Funsmith Club link with the Discord mark Summary

The top right of the header now has one link: the official Discord mark (Clyde, inline SVG, `fill="currentColor"`) followed by "Funsmith Club", pointing to https://funsmith.club. It uses muted 14px ink, no fill, no border and no accent. check-page has a new guard (15) for the link and an updated guard (11) Tab order.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 (RED) | 56307b4 | test(quick-261103-d9g): expect Funsmith Club header link in check-page |
| 2 (GREEN) | 1e889d2 | feat(quick-261103-d9g): add Funsmith Club link with Discord mark to the header |
| 3 (verify) | none | No defects were found, so no fix commit was needed |

## What changed

- **index.html markup:** `<a class="community" href="https://funsmith.club">` sits between the h1 and the lede. It holds an `svg.community-mark` (viewBox 0 0 24 24, 20x20, `fill="currentColor"`, `aria-hidden="true"`, `focusable="false"`, exact Simple Icons / discord.com/branding path data, no title) and `<span>Funsmith Club</span>`. There is no target, no rel and no nav wrapper.
- **index.html CSS:**
  - The header is a grid: `minmax(0,1fr) auto`, areas "title link" / "lede lede", column-gap 16px, align-items start.
  - `.community`: inline-flex, gap 8px, min-height 32px, padding 0 4px, radius 4px, `400 .875rem/1.4` prose font, nowrap, `--ink-muted`. On hover it changes to `--ink`.
  - `@container page (width < 28rem)`: a single column with areas link / title / lede, and the link uses `justify-self: end`.
  - The new rules use no `--accent`, no background and no shadow. The global 2px accent focus ring and the global link underline still apply.
- **index.html 'a11y ui' smoke:** the order now starts with `'https://funsmith.club'`. `find()` resolves `https:` keys through `jump()`, and the comment notes the new first stop. Nothing was added to #dice-selftest.
- **tools/check-page.mjs:**
  - Guard (11) `want` starts with `https://funsmith.club`.
  - The new guard (15) runs in every mode, including both fault modes. It checks for exactly one such link in main > header, with shown text and name "Funsmith Club", one svg that is aria-hidden, focusable=false and fill=currentColor, no svg title, and no target.
  - The header comment documents both guards.
- The CSP meta is byte-identical: `git diff 78a9057 -- index.html | grep -c Content-Security-Policy` = 0.

## RED gate

Against the unchanged index.html, `check-page --plain` reported exactly 2 FAILs: (11) "order ac-range, … (want https://funsmith.club, ac-range, …)" and the community link guard ("count 0"). Every other check was ok.

## Geometry (iframe harness, light theme, default settings)

| Width | Version | H | sw/cw | h1Top | h1H | ledeTop | link top–bottom | aLeft–aRight | aH | mainRight | overlap |
|-------|---------|---|-------|-------|-----|---------|-----------------|--------------|----|-----------|---------|
| 1366 | before | 3901 | 1366/1366 | 16 | 33.6 | 57.6 | none | none | none | 1354 | none |
| 1366 | after | 3901 | 1366/1366 | 16 | 33.6 | 57.6 | 16–48 | 1225.5–1354 | 32 | 1354 | false |
| 480 | before | 7567 | 480/480 | 16 | 33.6 | 57.6 | none | none | none | 468 | none |
| 480 | after | 7601 | 480/480 | 16 | 67.2 | 91.2 | 16–48 | 339.5–468 | 32 | 468 | false |
| 390 | before | 8211 | 390/390 | 16 | 67.2 | 91.2 | none | none | none | 378 | none |
| 390 | after | 8243 | 390/390 | 48 | 67.2 | 123.2 | 16–48 | 249.5–378 | 32 | 378 | false |
| 360 | before | 8493 | 360/360 | 16 | 67.2 | 91.2 | none | none | none | 348 | none |
| 360 | after | 8525 | 360/360 | 48 | 67.2 | 123.2 | 16–48 | 219.5–348 | 32 | 348 | false |

- **1366:** H, h1Top and ledeTop are identical before and after. The link's right edge equals the content right edge (1354), aTop 16 ≥ h1Top 16, and aBottom 48 ≤ ledeTop 57.6. All pass.
- **360:** there is no horizontal scroll. aBottom 48 ≤ h1Top 48, so the link is above the title. h1H is 67.2 (2 lines) and H grows by 32, which is the link row. All pass.
- **480 and 390:** there is no horizontal scroll, no overlap, aH is 32 and h1H is at most 67.2. All pass.
  - At 480, which is the side-by-side layout just above the breakpoint, the h1 wraps to 2 lines beside the link and the lede moves down 33.6px. That is within the gate (h1H ≤ 68).
  - The final breakpoint is **28rem**, unchanged. The key_link pattern `@container page (width < 28rem)` still holds, and the grep count is 1.
- **Self-test in the harness:** `w=360&test` and `w=1366&test` both report selftest=pass, so the in-page a11y ui smoke runs at a true 360px width.
- **Computed link color:** oklch(0.45 0.03 55), which is light-theme `--ink-muted`.

## Check sweep (all pass)

| Run | Result |
|-----|--------|
| `node tools/check-engine.mjs` | CHECK-ENGINE PASS: selftest 261/261, sweep 70980 combos. Node selftest 194.5 ms (budget 200); K9 8.4 ms |
| `node tools/check-page.mjs` (?test) | CHECK-PAGE PASS, Chrome selftest 60.4 ms |
| `node tools/check-page.mjs --plain` | CHECK-PAGE PASS |
| `node tools/check-page.mjs --width 390` | CHECK-PAGE PASS (36.8 ms) |
| `node tools/check-page.mjs --fault render` | CHECK-PAGE PASS (43.9 ms) |
| `node tools/check-page.mjs --fault later` | CHECK-PAGE PASS (43.4 ms) |
| `--plain --expect "Funsmith Club" --expect "D&D Combat Roll Simulator"` | CHECK-PAGE PASS, both expects ok |

## Impeccable detector

`impeccable detect --json index.html` found **3 findings**, exactly the three known ones: 2x border-accent-on-rounded (`border-top: 3px + border-radius: 8px`) and 1x repeating-stripes-gradient advisory (the miss hatch). Nothing new points at the header or `.community`.

## Screenshots (inspected, then deleted)

- **(a) 1366 light:** the Clyde mark is undistorted and the same muted brown as the underlined "Funsmith Club". It sits at the far right on the title's row and is clearly secondary to the 28px bold title. The title and lede are where they were.
- **(b) 1366 dark:** the mark and text are muted parchment on the candlelit --paper, legible and the same color as each other, with no overlap.
- **(c) 360 light:** the link is on its own row at the top right, fully visible above the 2-line title. The lede and controls flow normally below it.
- **(d) 360 dark:** the same layout as (c), and the mark and text are legible on dark paper.
- **(e) 1366 light, focus on a.community:** the 2px accent ring with rounded 4px corners goes all the way around the mark and text, 2px out, and is not clipped at the right edge (the ring ends at 1358 of 1366).

## Deviations from Plan

None. The plan was executed exactly as written. One small addition: the a11y ui smoke's leading comment now says the order starts with the header's Funsmith Club link. The plan asked for this comment to keep saying the list is guard (11)'s order, and it still does.

## Threat model

- T-d9g-01: guard (15) pins the exact href and a count of 1.
- T-d9g-02: there is no target, and guard (15) fails if one appears.
- T-d9g-03: the CSP is byte-identical, the mark is inline SVG, and console guard (2) is clean.
- T-d9g-05: guard (11) and the in-page smoke pass, and screenshot (e) shows the focus ring.

No new threat surface beyond the register.

## Housekeeping

- The scratch files h.html, before.html, after.html and shot-a..e.png were deleted.
- `git status -sb` shows `main...origin/main [ahead 6]` with only this quick directory untracked.
- Nothing was pushed and gh was not run.

## Self-Check: PASSED

- index.html contains `href="https://funsmith.club"` (count 1) and `@container page (width < 28rem)` (count 1).
- tools/check-page.mjs contains `'https://funsmith.club', 'ac-range'` (count 1).
- Commits 56307b4 and 1e889d2 are present in `git log`.
