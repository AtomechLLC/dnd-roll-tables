# Phase 4: Designer Explanation & Final Ship - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-26
**Phase:** 04-designer-explanation-final-ship
**Areas discussed:** Publishing, Copy placement, Formula format, Explorations, Review fixes, Accessibility depth, Voice

All seven gray areas were discussed without a selection prompt, because the user's saved preference is minimal interruptions with batched questions. The questions went out in two batched rounds.

---

## Publishing

| Option | Description | Selected |
|--------|-------------|----------|
| Publish at the end of Phase 4 | One pause for the user to run gh auth login; then repo, push, Pages, URL check | ✓ |
| Stay local; keep publishing deferred | Copy and accessibility only; DEPLOY checkboxes corrected to pending | |

**User's choice:** Publish at the end of Phase 4. This reverses the Phase 1 "local git only" choice for this final step.

## Copy placement

| Option | Description | Selected |
|--------|-------------|----------|
| Woven into each section | Text next to what it explains | ✓ |
| One "How it works" section | Single article at top or bottom | |
| Collapsible "Why?" panels | Explanation hidden until clicked | |

**User's choice:** Woven into each section.

## Formula format

| Option | Description | Selected |
|--------|-------------|----------|
| General rule, then live numbers | Symbolic rule, then substituted values and result | ✓ |
| Live numbers only | Plain substituted lines, no symbols | |
| Prose with numbers inline | A short paragraph walking through the math | |

**User's choice:** General rule, then live numbers (approved in preview).
**Notes:** The preview's symbolic crit term had a typo, "P(crit) × avg die". The correct term, P(crit) × (2 × avg die + D), is what CONTEXT.md records, and the preview's numbers were already right. The user was told about the correction.

## Explorations

| Option | Description | Selected |
|--------|-------------|----------|
| One-click "Try this" buttons | Sets the controls; text says what to look for | ✓ |
| Text only | User sets the controls by hand | |

**User's choice:** One-click "Try this" buttons.

## Review fixes

| Option | Description | Selected |
|--------|-------------|----------|
| Fix them in Phase 4 | All 7 open warnings plus the legend-swatch shrink, before publishing | ✓ |
| Leave them to code-review --fix | Run separately | |

**User's choice:** Fix them in Phase 4.

## Accessibility depth

| Option | Description | Selected |
|--------|-------------|----------|
| Requirement plus automated guards | DEPLOY-04 plus label, tab-order, and non-color checks in check-page | ✓ |
| Requirement, checked by hand | One keyboard walk-through, no new checks | |

**User's choice:** Requirement plus automated guards.

## Voice

| Option | Description | Selected |
|--------|-------------|----------|
| Short, designer to designer | Two to four sentences per spot | ✓ |
| Fuller walkthrough | Longer paragraphs with worked examples | |

**User's choice:** Short, designer to designer.

---

## Claude's Discretion

- Exact copy wording and headings.
- The visual treatment of the formulas.
- Any presets beyond the two required, and their +N values and placement.
- Whether the copy is built in the view-model (preferred) or the renderer.
- Which info-level review findings to fix.
- How the publish URL check runs.

## Deferred Ideas

None. The declined alternatives are listed above.
