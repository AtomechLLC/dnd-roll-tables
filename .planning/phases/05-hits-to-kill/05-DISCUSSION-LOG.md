# Phase 5: Hits-to-Kill - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-27
**Phase:** 05-hits-to-kill
**Areas discussed:** Hit size, HP control, Kill stats, Reach, After kill, HP change, Rounding, Tally

The phase was added to the roadmap in the same session from two user messages. The first was "Add support for hits-to-kill and the ability to kill an enemy, set a 40 hp enemy as the starting point". The second, sent mid-turn, was "the ability to modify enemy health (both by individual amount and by adding a 'hit' based on likely average damage for the current attack roll)".

Every gray area was discussed without a selection prompt, per the user's saved minimal-interruption preference, in two batched rounds. Reference values were computed exactly before asking, so the options showed real numbers.

---

## Hit size

| Option | Description | Selected |
|--------|-------------|----------|
| Average damage when it hits | 4.91 at the defaults; the "Average damage on a hit" card | ✓ |
| Average damage per attack roll | 2.70 at the defaults; misses count as 0 | |

## HP control

| Option | Description | Selected |
|--------|-------------|----------|
| HP box plus −1 hit / +1 hit buttons | 1 to 500, default 40; buttons show their step | ✓ |
| HP box plus a "health in hits" box | Two linked boxes | |
| HP slider plus box, with hit buttons | Like the AC control | |

## Kill stats

| Option | Description | Selected |
|--------|-------------|----------|
| Exact hits and rounds to kill, plus kill chance | Exact expected values, median round, P(kill within 20) | ✓ |
| Simple division only | HP ÷ average | |
| Full rounds-to-kill chart | Exact numbers plus a distribution chart | |

## Reach (multi-select)

| Option | Description | Selected |
|--------|-------------|----------|
| The 20-round roll | HP column, kill round in the result | ✓ |
| The compare tables | Rounds-to-kill in each stats line | |
| The sweep chart | Rounds-to-kill mode switch | |

## After kill

| Option | Description | Selected |
|--------|-------------|----------|
| Mark the kill, keep the log | All 20 rounds rolled; kill round highlighted; later rounds "enemy down" | ✓ |
| Stop at the kill | Shorter log; 20-round total no longer comparable | |
| Next enemy steps in | Count kills per 20 rounds | |

## HP change after a roll

| Option | Description | Selected |
|--------|-------------|----------|
| Re-score the same dice live | HP changes no die; run stays current | ✓ |
| Mark the run stale | Treat HP like the attack settings | |

## Rounding

| Option | Description | Selected |
|--------|-------------|----------|
| Nearest whole HP, never below 1 | 4.91 moves HP by 5; label shows the step | ✓ |
| Keep the fraction internally | Decimals in the HP box | |

## Tally

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, total and outcome | "61 · killed R12" / "38 · 2 HP left" | ✓ |
| Totals only | Unchanged tally | |

---

## Claude's Discretion

- The wording of labels, buttons, cards and the note.
- Where the kill cards sit, and the phone layout.
- The cutoff or tail method for extreme settings.
- Whether the presets touch HP (recommended: no).
- Whether the formulas card gets a hits-to-kill line.
- The accessible names of the new controls, and the updates to the tab-order guard.
- Tally outcomes re-score live with HP. This follows from the "HP change" decision, and Claude decided it without asking.

## Deferred Ideas

- Rounds-to-kill in the compare tables.
- A rounds-to-kill mode for the sweep chart.
- A full rounds-to-kill distribution chart.
- "Next enemy steps in" (counting kills per 20 rounds).
