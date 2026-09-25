# Phase 1: Live Roll Table, Deployed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-24
**Phase:** 1-live-roll-table-deployed
**Areas discussed:** Page layout, Default state, Visual style (tone, dark mode, heat color, typography), Repo name

Questions were batched into two prompts per the user's stated preference for minimal interruptions. Rules-engine, control, self-test, crit-row, and deploy-path questions were not asked because PROJECT.md and REQUIREMENTS.md already lock them.

---

## Page layout

| Option | Description | Selected |
|--------|-------------|----------|
| Top control strip | Controls in a horizontal panel at the top, stat cards beneath, table full width below. Leaves full width for Phase 2's three tables. | ✓ |
| Sticky top control strip | Same, but pinned while scrolling. More CSS, eats vertical space. | |
| Left sidebar controls | ~18rem sidebar with table and stats to the right. Squeezes three d12 tables at laptop width. | |

**User's choice:** Top control strip
**Notes:** None.

---

## Default state on first load

| Option | Description | Selected |
|--------|-------------|----------|
| AC 15, d8, +5 hit, +0 dmg | Typical mid-level character; matches 55% / 54.0 reference values. | ✓ |
| AC 15, d8, +0, +0 | Plainest baseline (31.5 over 20 rounds); +0 attacker feels artificial. | |
| AC 25, d12, +0, +0 | Opens on a crossover setting for Phase 2; first-load table mostly zeros. | |

**User's choice:** AC 15, d8, +5 hit, +0 dmg
**Notes:** None.

---

## Visual style: tone

| Option | Description | Selected |
|--------|-------------|----------|
| Clean data-tool, light/dark | Neutral sans, single-hue heatmap, follows prefers-color-scheme. | |
| Light only, printable | Fixed white, no dark theme. | |
| Tabletop-flavored | Parchment and ink, serif headings, D&D feel. More CSS; contrast must be watched. | ✓ |

**User's choice:** Tabletop-flavored
**Notes:** Triggered a second batch of follow-ups below.

---

## Visual style: dark mode

| Option | Description | Selected |
|--------|-------------|----------|
| Parchment only, no dark theme | One fixed light theme; smallest CSS. | |
| Add a "candlelit" dark variant | Follows prefers-color-scheme with a dark wood / ink-on-slate base; heat ramp re-tuned. | ✓ |

**User's choice:** Add a "candlelit" dark variant
**Notes:** None.

---

## Visual style: heat color

| Option | Description | Selected |
|--------|-------------|----------|
| Blood red ramp | Pale parchment to deep crimson; misses stay flat greyed parchment. | ✓ |
| Ink blue ramp | Parchment to deep ink blue; calmer, less thematic. | |
| Gold to ember ramp | Parchment to gold to burnt orange; harder top-end contrast, close to miss tone. | |

**User's choice:** Blood red ramp
**Notes:** Miss cells still display `0` per TABLE-01; the muted style is what sets them apart.

---

## Visual style: typography

| Option | Description | Selected |
|--------|-------------|----------|
| Serif headings, tabular sans numbers | System serif for prose; tabular-figure sans/mono for every number. | ✓ |
| Serif everywhere | Proportional serif digits misalign in a dense grid. | |
| Sans everywhere, themed by color only | Least effort, weakest theme. | |

**User's choice:** Serif headings, tabular sans numbers
**Notes:** No external fonts allowed (DEPLOY-01), so system stacks only.

---

## Repo name

| Option | Description | Selected |
|--------|-------------|----------|
| DnD-CombatRollSimulator | Matches the local folder; predictable Pages URL. | ✓ |
| dnd-attack-roll-table | Kebab-case naming the artifact; differs from folder. | |
| dnd-combat-roll-simulator | Same name, lowercase kebab-case. | |

**User's choice:** DnD-CombatRollSimulator
**Notes:** GitHub username to be read from `gh api user` after the user authenticates.

## Claude's Discretion

- Exact color token values (parchment, ink, candlelit dark, red ramp endpoints) subject to contrast.
- Heat ramp domain ([1, max] vs [0, max]).
- Stat card order and wording within STAT-01..03.
- How the threshold rule is drawn.
- README length and structure.
- `<template>` vs `el()` helper.
- Cell dimensions and stacking breakpoint.

## Deferred Ideas

None.
