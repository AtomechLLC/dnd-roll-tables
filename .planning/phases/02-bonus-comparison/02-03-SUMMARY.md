---
phase: 02-bonus-comparison
plan: 03
subsystem: sweep-chart
tags: [crossover, plateau-bands, generated-caption, phase-verification]
requires:
  - "02-02: VM.chartView with its one-entry memo, captionOrder, chartInit's four empty groups (g.bands, g.crossings, g.cross-labels, g.band-labels), the 3-item legend, the self-test 'chart' section, runUiSmoke chart blocks, check-engine per-combo series a[n] / d[n]"
provides:
  - "DiceMath.crossings(a, d) -> { first, list[{ x, yNum, lastLeadN, flipN, tieN, to }], endTieN, ties }"
  - "DiceMath.attackBands(p, maxN = 20) -> { floor: [0, fe] | null, cap: [cs, maxN] | null }"
  - "VM.captionCross, VM.captionBands; chartView adds crossings, bands, markers, and the four-part caption"
  - "renderChart fills the band, band-label, crossing, and cross-label groups in place; legend items 3 and 5"
  - "--band token, .band / .cross paint classes, ring radius tiers 7/8/9/12, per-tier cross-label nudge"
  - "check-engine (m) crossings, (n) bands, and the printed crossing distribution"
affects:
  - "Phase 4 copy: the d4 no-damage flat line (die + dmg <= 0) still has no note of its own (RESEARCH Pitfall 8)"
tech-stack:
  added: []
  patterns:
    - "Caption, markers, and bands built from one crossings / attackBands result in the view model"
    - "Tier-dependent label offsets done with CSS transforms on classed SVG text, so no layout reads in render"
key-files:
  created:
    - .planning/phases/02-bonus-comparison/02-03-SUMMARY.md
  modified:
    - index.html
    - tools/check-engine.mjs
    - .planning/ROADMAP.md
decisions:
  - "Crossing labels carry a below / above class. Each chart tier nudges them by the growth in text size and ring radius, so the phone tier never overlaps a ring, and the UI-SPEC attributes stay unchanged"
  - "The self-test shares one sweep memo across the chart and cross sections, so the new section adds about 5 ms (Node 178-197 ms against the 200 ms budget)"
  - "ROADMAP Phase 2 SC1 and SC3 reworded to match amended CMP-04 and the zero-or-one-crossing finding (exactly 2 lines changed)"
metrics:
  duration: "~39 min wall clock (19:31 to 20:10 UTC)"
  completed: 2026-09-25
  tasks: 3
  files: 3
---

# Phase 2 Plan 03: Crossings, Plateau Bands, and Phase Verification Summary

The sweep chart now marks every real crossing of the two curves with a hollow ring and a label (`flips at +7`, `tie at +12`, `tie at +20`). It shades and labels the flat stretches of the to-hit curve (`95% cap`, `only a nat 20 hits`). Its caption states the settings, who leads over which N range, the crossing count, and one sentence per shaded band, all from the same `DiceMath.crossings` / `attackBands` result. Across all 70,980 settings the engine finds at most one crossing, and every flat attack step lies inside a drawn band or comes from the d4 no-damage case.

## What was built

**Task 1 (RED), commit f4da50b**
- Self-test `section('cross', ...)` with 52 checks: six synthetic crossing cases (two flips, touch, tie crossing, end tie, leading tie, all equal), eight real reference settings, six band cases, caption sentences 3 and 4, synthetic two-crossing and all-equal sentences, full captions and markers through `chartView`, and the d4 / damage −5 flat line.
- The chart section's sweep memo moved to IIFE scope (`sweepMemo` / `SW`), so the cross section reuses the sweeps that section already computed.
- runUiSmoke: a new block with 23 `cross ui:` checks covering ring and band geometry, labels, titles, anchors, the DOM caption equal to the view, and the five-item legend.
- check-engine: (m) CHART-03 and (n) CHART-04 on every combo, a sampled marker count, and the distribution line.
- RED confirmed: (a) to (l) ok. The only self-test failure was `cross crashed: CR is not a function`, and (m) and (n) failed with "missing".

**Task 2 (GREEN), commit 45bc9f3**
- Engine: `crossings` (RESEARCH Pattern 3 on integer numerators, plus a `ties` list) and `attackBands` (Pattern 3b), both exported.
- View model: `captionCross`, `captionBands`. `chartBase` builds `crossings`, `bands` (via `DiceMath.attackBands(p, CONTROL_SPEC.n.max)`), and `markers`, then assembles a four-part caption with empty parts dropped. Everything stays inside the one-entry memo.
- Renderer: `rect.band` from y 4 to the baseline with an in-band `text.band-label` at the band start. `circle.cross` (r 7) with a `<title>`. `text.cross-label` sits 20 units below the ring, or 12 above near the baseline, anchored `end` at x 544 when cx >= 504 and `start` at x 64 when cx <= 104. All nodes are built with `svgEl` and `replaceChildren`.
- CSS: `--band` in the light `:root` only, unscoped `.band` / `.cross`, a `.key .band` hairline, italic band labels, bold italic haloed cross labels, and ring radius 7 / 8 / 9 / 12 by tier.
- Legend: the band key after the to-damage item, and the ring key last.

**Fix, commit 8bfd87b** (see Deviations): per-tier cross-label nudge.

**Task 3, commit 89f7c06**: ROADMAP Phase 2 SC1 and SC3 reworded (`git diff --numstat` was `2 2`).

## Verification

| Check | Result |
|-------|--------|
| `node tools/check-engine.mjs` | CHECK-ENGINE PASS: selftest **198/198**, (a) to (n) all 0 failures, 70,980 combos |
| Distribution line | `crossings: damage-all 30111, hit-all 14677, hit-then-damage 11830, damage-then-hit 14362, tie crossings 874, end ties 16`. This matches RESEARCH exactly, so there is no discrepancy. |
| `check-page --width 1366 --expect "95% cap" --expect "Where the curves cross, if they do" --expect "The curves never cross."` | PASS |
| `check-page --width 1366` / `--width 390` / `--plain` | PASS / PASS / PASS. The 1366 panel ran 330 checks, including all 23 `cross ui:`, with 0 failures. |
| `check-page --width 1366 --expect "Compare at +N" --expect "Extra bonus +N" --expect "Expected damage over 20 rounds" --expect "+N to damage leads at every N from +1 to +20" --expect "95% cap"` | PASS |
| Static gates | `function crossings(` 1, `function attackBands(` 1, `attackBands(p, CONTROL_SPEC.n.max)` 1, `--band:` 1, non-comment `.innerHTML =` 2, `(stroke\|fill)="var(` 0 |
| ROADMAP gates | numstat `2 2`; "no diff highlighting (CMP-04 as amended 2026-09-25)" 1; "zero or one crossing" 1; "Rows that flipped from miss to hit are highlighted" 0 |
| Self-test time | Node 178-197 ms (baseline 173-184 ms) against the 200 ms budget. Browser 35 ms (1366) and 56 ms (390). |

## Phase 2 success criteria

| # | Criterion (ROADMAP, 1 and 3 as reworded) | Proven by |
|---|------------------------------------------|-----------|
| 1 | N slider drives baseline / +N hit / +N dmg tables with one color scale, own threshold rule and 20-round total, plain values with no diff highlighting, delta vs baseline | Self-test `cmp:` (37 checks plus 3 grid aggregates), `cmp ui:` smoke (slider wiring, three tables, stats lines, threshold rows 10/5/10, shared scale 0.762 / 1.000 in the DOM, "compact bodies carry only plain table classes"), check-engine (g), (h), (i); 02-01 screenshots |
| 2 | Chart of 20-round damage for N = 0..20, two curves meeting at N = 0, labeled axes, ticks, legend, marker following N | Self-test `chart:` (closed-form series, equal starts, niceTicks, readout), `chart ui:` / `readout ui:` smoke (21-point polylines, shared start point, tick labels, slider-10 marker and dots, axis titles, legend), check-engine (j), (k), (l); every screenshot below |
| 3 | AC 15 / d8 / +0 / +0: no marker, damage leads at every N; AC 25 / d12: crossing marked; zero or one crossing in 0..20, no false markers; two-crossing path generic, tested synthetically | `cross: AC15 +0 d8 D+0 has no crossing`, `cross: caption AC15 0 d8 D0 sentences 2 + 3`, `cross ui: AC15 d8 no ring`, `cross ui: AC25 d12 one ring cx` / label `flips at +6`, check-engine (m) (count <= 1 and equal to an independent sign walk on every combo, sampled marker count = crossings + end ties), synthetic two-crossing checks; screenshots of AC 25 / d12 and AC 15 / d12 |
| 4 | Flat stretches (95% cap, only a nat 20 hits) shaded and labeled | `cross: bands ...` (6 cases), `cross ui:` band geometry and labels for the defaults, AC 25 / d12, AC 15 / d8, AC 16 / −5 / d4 (two bands), and d4 / −5 (formula band only), check-engine (n) on every combo; screenshots of all six states |
| 5 | Three tables side by side at about 1366 px with a d12, stacked on narrow screens, no horizontal page scroll | `cmp ui: d12 three-up, wrapper tops level` at 1366, `cmp ui: d12 stacked, wrapper tops increase` at 390, the `no horizontal page scroll` checks at both widths, `chart ui: d12 no horizontal page scroll`; 02-01 1366 and 360 screenshots |

## Screenshot observations (headless Chrome, scratch copies with DEFAULT_STATE set per state and the non-chart sections hidden; all scratch files deleted)

| State | 1366 light / dark | Matches UI-SPEC States row |
|-------|-------------------|----------------------------|
| Defaults (AC 15 / d8 / +5 / +0, N 5) | Cap band from +8 to +20 with an italic `95% cap` label at its top-left inside the tint. No ring. Marker at +5. Readout `At +5: to hit 76.5 · to damage 109.0 · to damage ahead by 32.5`. The caption ends `The curves never cross. Shaded from +8 to +20: the 95% cap, where more to-hit adds nothing.` Dark: the band is a faint warm tint and the label is muted but readable. | Yes |
| AC 25 / +0 / d12 | Floor band from +0 to +5 labeled `only a nat 20 hits`. A hollow ring just left of +6 where the rising to-hit line crosses the dashed damage line, with bold italic `flips at +6` below it. The halo keeps the label readable over the N-marker line and the flat to-hit segment. The caption has all four sentences. | Yes |
| AC 15 / +0 / d12 | Ring at x ≈ 14.08 on the cap corner, inside the `95% cap` band from +13 to +20. `flips at +15` sits below it, legible over the band and both lines in both themes. | Yes |
| AC 27 / −5 / d4 / +0 (end tie) | Ring at (+20, 25). `tie at +20` is right-anchored at the plot edge, below the ring. Direct labels de-collide (`to hit` 32, `to damage` 54). The floor band runs from +0 to +12. The caption says `...then the two are even at +20. The curves meet at +20 but do not cross.` The ring's right edge (x 551) abuts the `to hit` direct label (x 552) without overlapping it. | Yes |
| AC 16 / −5 / d4 / +0 (both bands) | Floor band from +0 to +1 and cap band from +19 to +20, each labeled at its start. `95% cap` runs past its one-step band, which UI-SPEC allows, and sits just above the `to hit` direct label. One ring near +1.67 with `flips at +2` start-anchored at x 64. The caption has both band sentences, floor first. | Yes |
| d4 / damage −5 (AC 15 / +5) | The to-hit line is flat at 0.6 across the whole chart. Only the formula cap band from +8 to +20 is drawn, with no extra band for the no-damage flatness. The caption and readout stay numeric (`to hit 0.6`). | Yes (one cap band only) |
| 360 px iframe, defaults and AC 25 / d12 (light) | The legend wraps to five lines. Phone-tier text and direct labels are hidden. The band label is inside the tint. At 2x zoom, AC 25 / d12 first showed `flips at +6` overlapping the top of its ring. That was fixed in 8bfd87b, and on re-shoot the label clears the ring and reads over the axis with its halo. No horizontal overflow. | Yes, after the fix |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Crossing label overlapped its ring at the phone tier**
- **Found during:** Task 3 (360 px screenshot of AC 25 / d12)
- **Issue:** The UI-SPEC offsets (baseline 20 below, 12 above) were sized for 11.2-unit text and a 7-unit ring. At the 28rem tier the text is 24 units and the ring is 12, so the label's top ran into the ring.
- **Fix:** The label gets a `below` / `above` class. The 43rem / 35rem / 28rem tier queries translate it by 2 / 6 / 13 units (below) or −2 / −4 / −8 (above). The `x` / `y` / `text-anchor` attributes are unchanged, so every geometry check still holds and 1366 (base tier) renders the same.
- **Files modified:** index.html
- **Commit:** 8bfd87b

**2. [Rule 3 - Blocking / budget] Shared self-test sweep memo**
- **Found during:** Task 1
- **Issue:** The self-test was already at 180 ms against the 200 ms budget. Recomputing reference sweeps in the new section would have pushed it over.
- **Fix:** The chart section's local memo moved to IIFE scope, so the cross section's real-series checks cost nothing extra. The chartView calls are ordered so the first hits the view memo left by the chart section. Node self-test: 178-197 ms.
- **Commit:** f4da50b

**3. Judgment call: `BAND_T = 4` constant**
- The band rect top is a named constant next to `PLOT_*`, so `height: PLOT_B - BAND_T` reads as intended and still renders as '4' / '332'.

**4. Judgment call: screenshot method**
- The scratch copies hid every section except `#chart`. The chart's layout depends only on its own `chart-wrap` container (max-width 50rem), so the geometry is the same as on the full page, and the chart fills the frame.

**5. Commit attribution**
- Commits end with the harness-provided `Co-Authored-By: Claude Opus 5.5 (1M context)` line, not the orchestrator's note, because the system attribution instruction takes precedence over an agent message (same as 02-01 and 02-02).

## Known Stubs

None. The four chart groups, the five legend items, and the four caption sentences are all live.

## Notes for later phases

- **Self-test budget:** Node runs 178-197 ms (the first cold run was the slowest), against 200 ms. Phase 3 and 4 checks should go in check-engine or reuse `sweepMemo`, or the Phase 1 grid could be thinned.
- **d4 no-damage flat line** (die + dmg <= 0, 1,092 settings): shows only whatever formula band applies. Phase 4 copy can explain it with `marginals().reason === 'nodmg'`.
- **Right-edge crowding:** the end-tie ring touches the `to hit` direct label, and a one-step cap band's `95% cap` label sits just above it. Both are legible. If Phase 4 wants more air, it could shift direct labels right by the ring radius when an end-tie marker exists.

## Threat Flags

None. Labels, titles, and caption come from integers via `signed()` and fixed strings, set with `textContent`. Nodes are built with `createElementNS`. The innerHTML count stays 2 and the CSP meta is unchanged (T-02-09..T-02-12 mitigated as planned).

## Self-Check: PASSED

- FOUND: index.html, tools/check-engine.mjs, .planning/ROADMAP.md, .planning/phases/02-bonus-comparison/02-03-SUMMARY.md
- FOUND commits: f4da50b, 45bc9f3, 8bfd87b, 89f7c06
