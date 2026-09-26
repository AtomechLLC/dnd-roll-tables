# Phase 3: Roll-20-Rounds Simulation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-25
**Phase:** 03-roll-20-rounds-simulation
**Areas discussed:** Placement and result display, Round log and roll feel, Stale runs and first load, Run history and table link

All four gray areas were discussed without a selection prompt, because the user's saved preference is minimal interruptions with batched questions. The questions went out in three batched rounds.

---

## Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Own section after the chart | Last step after exact numbers and the comparison; nothing above moves | ✓ |
| Right under the stat cards | Realized total beside the "Expected over 20 rounds" card; pushes the table down | |
| Between the big table and Compare | Close to the table for cell marking; splits the table from the comparison | |

**User's choice:** Own section after the chart.

## Spread display

| Option | Description | Selected |
|--------|-------------|----------|
| ± SD plus a typical-range line | "54.0 ± 14.2", "about 2 runs in 3 land between 39.8 and 68.2", "this run is 7.0 above expected (0.5 SD)" | ✓ |
| ± SD only | "54.0 ± 14.2 (SD)" | |
| Number-line strip | Bar with expected, ±1 SD band, and a tick for this run | |

**User's choice:** ± SD plus a typical-range line (approved in preview).

## Round log

| Option | Description | Selected |
|--------|-------------|----------|
| Compact 20-row table | Round, d20, Result, Damage dice, Damage; crit shows "6 + 3"; total row | ✓ |
| Chip strip | 20 colored chips with details on hover or focus | |
| Text lines | One sentence per round | |

**User's choice:** Compact 20-row table (approved in preview).

## Roll feel

| Option | Description | Selected |
|--------|-------------|----------|
| Instant | All 20 rounds appear at once | ✓ |
| Quick reveal | Rounds fill in over about a second; skipped for reduced motion | |

**User's choice:** Instant.

## Stale run

| Option | Description | Selected |
|--------|-------------|----------|
| Dim it and keep its own expected | Rolled-at note, dimmed run with its rolled-at expected, plus a "Now:" line | ✓ |
| Dim it; expected follows current settings | Always-current expected, but the pair describes different attacks | |
| Keep it bright, add a stale banner | Least churn, easiest to miss | |

**User's choice:** Dim it and keep its own expected (approved in preview).

## First load

| Option | Description | Selected |
|--------|-------------|----------|
| Empty slot with a prompt | Expected ± SD shown; realized reads "Not rolled yet"; log hidden | ✓ |
| A labeled example run | Fixed-seed example labeled "Example run" | |

**User's choice:** Empty slot with a prompt.

## History

| Option | Description | Selected |
|--------|-------------|----------|
| Latest run only | Each click replaces the run | |
| Tally of the last few totals | Last 5 run totals at the current settings; cleared when settings change | ✓ |

**User's choice:** Tally of the last few totals (not the recommended option).

## Table link

| Option | Description | Selected |
|--------|-------------|----------|
| Log only | The log stands alone | |
| Mark rolled cells in the big table | Counter or outline on each rolled (d20, die) cell | ✓ |
| Highlight on log-row hover | Pointing at a log row outlines its cell | |

**User's choice:** Mark rolled cells in the big table (not the recommended option). This raised the crit-mapping follow-up below.

## Follow-up: crit mark

| Option | Description | Selected |
|--------|-------------|----------|
| Mark the row, not a cell | Crit counts on the nat-20 row label; the log has the real dice | ✓ |
| Mark both dice's columns | Marks two crit-row cells whose displayed values were not dealt | |
| Mark the first die's column | Simplest; misrepresents the roll | |

**User's choice:** Mark the row, not a cell.

## Follow-up: mark style

| Option | Description | Selected |
|--------|-------------|----------|
| Outline plus a small count | Ink outline, "×2" badge for repeats | ✓ |
| Outline only | Repeats invisible | |
| Dot in the cell corner | Quietest; hard to see at compact size | |

**User's choice:** Outline plus a small count.

## Follow-up: on change

| Option | Description | Selected |
|--------|-------------|----------|
| Clear marks, clear tally | Old marks would point at the wrong cells; the dimmed run and log stay | ✓ |
| Keep the tally, clear marks | Tally mixes different attacks | |

**User's choice:** Clear marks, clear tally.

---

## Claude's Discretion

- Whether the compare +N slider stales the run. It should not, because it does not change the rolled attack.
- How misses and nat 1s appear in table marks. The recommendation is a count on the row label.
- Wording of the notes and prompts, the treatment that keeps exact and simulated figures distinct, the spread line when E − SD < 0, the tally format, the script block placement, and the phone layout.

## Deferred Ideas

None. The quick reveal and the number-line strip were offered and declined.
