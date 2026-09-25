# Phase 2: Bonus Comparison - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-25
**Phase:** 02-bonus-comparison
**Areas discussed:** Tables layout, Page order, Diff marks (CMP-04), Chart interaction

All four areas were asked in one batched round, per the user's stated preference for minimal interruptions. Remaining details were settled by Claude and recorded under Claude's Discretion in CONTEXT.md.

---

## Tables layout

| Option | Description | Selected |
|--------|-------------|----------|
| Replace it with a row of three (Recommended) | Phase 1 table becomes the left-hand baseline of a three-up row; no duplicated baseline; compact 24 px tier at 1366 px. | |
| Keep the big table, add three compact ones below | Full-size 40 px table stays as the study view; a second section shows baseline / +N hit / +N damage at compact size. | ✓ |

**User's choice:** Keep the big table, add three compact ones below.
**Notes:** None.

---

## Page order

| Option | Description | Selected |
|--------|-------------|----------|
| Stats → chart → tables (Recommended) | Curve first with the N marker, then the tables that produce the marked point. | |
| Stats → tables → chart | Cell-by-cell view first, chart as the summary underneath. | ✓ |

**User's choice:** Stats → tables → chart. Combined with the previous answer: controls → stats → big table → Compare +N (slider + three compact tables) → chart.
**Notes:** None.

---

## Diff marks (CMP-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Row outline + note column (Recommended) | Flipped rows outlined with "new hit" notes; +damage note column shows "+N" per hit row. | |
| Add a "show delta" toggle too | Same marks plus a toggle showing per-cell differences vs baseline. | |
| Badges in cells | Tiny "+N" badge on each changed cell. | |
| Other (free text) | "change the total in the cells, no special highlight" | ✓ |

**User's choice:** Plain values in every cell, no diff highlighting of any kind.
**Notes:** This contradicts CMP-04 as originally written and ROADMAP.md Phase 2 success criterion 1. CMP-04 in REQUIREMENTS.md was rewritten to match; the roadmap clause is recorded as superseded in CONTEXT.md D-05.

---

## Chart interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Hover readout only (Recommended) | Pointer over the chart shows both values and the gap; the marker comes only from the slider. | ✓ |
| Click or drag on chart sets N | Linked views: pointer on the chart moves the slider and tables. | |
| Static | Marker from the slider, no hover behavior. | |

**User's choice:** Hover readout only.
**Notes:** None.

---

## Claude's Discretion

- N slider placement (head of the Compare section) and default value (+5).
- Shared heat domain across the big table and the three compact tables, one legend.
- Chart y-axis auto-scales to the current curves with labeled gridlines (a fixed per-die max would squash high-AC settings).
- Crossover tie handling, marker placement, caption wording, plateau band labels.
- Series colors and dash pattern, viewBox, grid breakpoint, hover implementation.
- Whether to fold in the 01-REVIEW.md WR-01 fix while touching `computeView`.

## Deferred Ideas

- "Show delta" toggle for the +N tables.
- Click or drag on the chart to set N.
- Row outlines, note-column "+N" marks, in-cell badges (declined CMP-04 styles).
