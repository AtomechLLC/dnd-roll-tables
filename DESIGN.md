---
name: D&D Combat Roll Simulator
description: Parchment, ink and margin notes, set around exact tables.
colors:
  accent: "oklch(0.48 0.10 70)"
  heat-lo: "oklch(0.925 0.04 62)"
  heat-hi: "oklch(0.42 0.16 25)"
  cell-ink-lo: "oklch(0.20 0.03 40)"
  cell-ink-hi: "oklch(1 0 0)"
  miss-bg: "oklch(0.87 0.006 80)"
  miss-ink: "oklch(0.40 0.01 80)"
  series-hit: "oklch(0.45 0.13 255)"
  series-dmg: "oklch(0.47 0.12 50)"
  pass: "oklch(0.45 0.11 145)"
  fail: "oklch(0.47 0.17 27)"
  paper: "oklch(0.96 0.022 85)"
  surface: "oklch(0.935 0.03 82)"
  band: "color-mix(in oklch, oklch(0.27 0.035 45) 8%, oklch(0.96 0.022 85))"
  line: "color-mix(in oklch, oklch(0.27 0.035 45) 20%, oklch(0.96 0.022 85))"
  ink: "oklch(0.27 0.035 45)"
  ink-muted: "oklch(0.45 0.03 55)"
  rule: "oklch(0.30 0.04 40)"
typography:
  display:
    fontFamily: "Georgia, 'Palatino Linotype', Palatino, 'Book Antiqua', serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Georgia, 'Palatino Linotype', Palatino, 'Book Antiqua', serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.04em"
    fontFeature: "smcp"
  body:
    fontFamily: "Georgia, 'Palatino Linotype', Palatino, 'Book Antiqua', serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  action:
    fontFamily: "Georgia, 'Palatino Linotype', Palatino, 'Book Antiqua', serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.5
  support:
    fontFamily: "Georgia, 'Palatino Linotype', Palatino, 'Book Antiqua', serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Georgia, 'Palatino Linotype', Palatino, 'Book Antiqua', serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
  fine:
    fontFamily: "Georgia, 'Palatino Linotype', Palatino, 'Book Antiqua', serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
  figure:
    fontFamily: "system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    fontFeature: "tnum"
  control:
    fontFamily: "system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "tnum"
  cell:
    fontFamily: "system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "24px"
    fontFeature: "tnum"
  cell-compact:
    fontFamily: "system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "24px"
    fontFeature: "tnum"
rounded:
  sm: "4px"
  md: "8px"
spacing:
  sp-1: "4px"
  sp-2: "8px"
  sp-3: "12px"
  sp-4: "16px"
  sp-5: "20px"
  sp-6: "24px"
components:
  button-roll:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    typography: "{typography.action}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "32px"
  button-roll-hover:
    backgroundColor: "color-mix(in oklch, oklch(0.48 0.10 70) 85%, oklch(0.27 0.035 45))"
  button-preset:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.sm}"
    padding: "4px 12px"
    height: "32px"
  button-step:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "32px"
  button-quiet-hover:
    backgroundColor: "color-mix(in oklch, oklch(0.96 0.022 85) 85%, oklch(0.27 0.035 45))"
  button-disabled:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-muted}"
  input-number:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.sm}"
    width: "80px"
    height: "32px"
  die-segment:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    width: "48px"
    height: "32px"
  die-segment-checked:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
  control-strip:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  stat-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px"
  figure-exact:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.figure}"
    rounded: "{rounded.md}"
    padding: "12px"
  figure-simulated:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.figure}"
    rounded: "{rounded.md}"
    padding: "12px"
  table-cell-miss:
    backgroundColor: "{colors.miss-bg}"
    textColor: "{colors.miss-ink}"
    typography: "{typography.cell}"
---

# Design System: D&D Combat Roll Simulator

## Overview

**Creative North Star: "The Annotated Rulebook"**

The page is a rules page a designer has worked through: parchment, ink and margin notes, with exact tables and the explanations beside them. Words are set like a book and figures like a ledger. The tables are the subject, so everything around them stays quiet, and the strongest color on the page is damage itself.

The system is dense, flat and ruled. Depth comes from two tonal surfaces, hairlines and ink rules; controls are plain, compact and exact. There are two designed themes, parchment and candlelit, each hand-set in oklch rather than inverted. The operating system's color preference picks between them.

Nothing moves. Results appear at once, with no transitions and no animation, by decision. There are no motion tokens because there is no motion.

**Key Characteristics:**
- Parchment and candlelit, both hand-set in oklch.
- Georgia for words, system-ui with tabular numerals for standing figures.
- Flat and ruled: no cast shadows, no transparency, no motion.
- One heat ramp across every table; misses are hatched.
- Accent fill only on Roll and the checked die.

## Colors

Warm neutrals carry the page, a single ochre accent marks action and crits, and an ember ramp shows damage. Frontmatter holds the parchment values; candlelit values live in the sidecar's `colorMeta`. In candlelit, heat runs the other way: more damage is a brighter ember on a dark page, not a darker red on a light one.

### Primary
- **Burnt Ochre** (oklch(0.48 0.10 70)): The fill of Roll and the checked die. As line or text, the crit rule, crit words, focus ring, slider fill and caret.

### Secondary
- **Pale Ember** (oklch(0.925 0.04 62)): The low end of the heat ramp, for the least damage.
- **Deep Ember** (oklch(0.42 0.16 25)): The high end of the heat ramp, for the most damage on the page.
- **Cell Ink, Low and High** (oklch(0.20 0.03 40) / oklch(1 0 0)): The number inside a heat cell. It flips from low to high where the ramp crosses its midpoint.
- **Worn Grey** (oklch(0.87 0.006 80)): The miss cell's ground, under the hatch.
- **Miss Ink** (oklch(0.40 0.01 80)): The 0 in a miss cell, at least 4.5:1 on the darker hatch stripe.

### Tertiary
- **Ledger Blue** (oklch(0.45 0.13 255)): The +N to hit series, a solid line.
- **Sienna** (oklch(0.47 0.12 50)): The +N to damage series, a dashed line.
- **Status Green and Status Red** (oklch(0.45 0.11 145) / oklch(0.47 0.17 27)): Self-test and engine-error status only. Never a damage or hit meaning.

### Neutral
- **Parchment** (oklch(0.96 0.022 85)): The page, input fields, quiet buttons, the note column, and text on an accent fill.
- **Vellum** (oklch(0.935 0.03 82)): The one raised tone: control strip, cards, table headers, readout.
- **Shaded Band** (8% ink into parchment): The chart's flat-stretch region, always with its label in the band.
- **Hairline** (20% ink into parchment): The 1px border of surfaces, table cells and dividers. Faint at 1.55:1, so it never carries meaning alone.
- **Iron Gall Ink** (oklch(0.27 0.035 45)): Body text, figures, the focal rule, the roll ring.
- **Faded Ink** (oklch(0.45 0.03 55)): Supporting text, control outlines, chart axes, and all stale values.
- **Threshold Ink** (oklch(0.30 0.04 40)): The rule above the first d20 row that hits.

### Named Rules

**The One Heat Ramp Rule.** Every outcome table and the legend share one scale: a cell's position is its damage over the largest cell across all the tables on the page, so the same damage is the same color everywhere. Never give a table its own domain. The mix toward Deep Ember runs from 0 to `--ramp-a` below the midpoint and from `--ramp-b` to 100% at or above it (0.62 and 0.70 in parchment, 0.56 and 0.72 in candlelit), and the cell ink flips at that same point.

**The Hatched Miss Rule.** A miss is a 135° hatch (4px ground, 1px of ground with 15% ink) with a printed 0, never a color alone. It is a required cue, and a deliberate exception to the detector's repeating-stripes advisory. The hatch means miss and nothing else.

**The Reserved Accent Rule.** Accent as a fill belongs to Roll and the checked die. The only other accent ground is the browser's text selection. Crits use accent as a line and as bold words, and the crit swatch in the legend uses the heat ramp, not the accent.

## Typography

**Display Font:** Georgia (with Palatino Linotype, Palatino, Book Antiqua, serif)
**Body Font:** Georgia (with Palatino Linotype, Palatino, Book Antiqua, serif)
**Label/Mono Font:** system-ui (with Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif), for figures

**Character:** A bookish serif for the argument and a plain sans for the data, so the eye can tell a sentence from a measurement. Small caps on the section heads are the one typographic flourish, and they read as a printed rulebook's running heads.

### Hierarchy
- **Display** (700, 1.75rem, 1.2): The page title only.
- **Title** (700, 1rem, 1.2, small caps, 0.04em): Section heads. Set by weight, caps and tracking rather than size.
- **Body** (400, 1rem, 1.5): The lesson: explanations, verdict, chart caption. Capped at 72ch.
- **Support** (400, 0.875rem, 1.4): Section intros, table captions, footnotes, card labels, legend text. Muted where it is usage help, ink where it is content.
- **Label** (700, 0.875rem, 1.4): Control group labels.
- **Fine** (400, 0.75rem, 1.4): Range hints, the line under a stat figure, footer.
- **Figure** (700, 1.75rem, 1.2, tabular): The value on a stat card or figure card.
- **Control** (400, 0.875rem, tabular): Number inputs, die segments, step and reset buttons.
- **Cell** (400, 0.875rem wide, 0.75rem compact, tabular, line height set by the row): Table cells, log rows, chart data.
- **Chart text** (tabular, in SVG user units: 11.2, 14, 17.5 and 24 by chart width): These scale with the viewBox so every label renders at 12px or more. They are not page type sizes, and the detector's off-ramp finding on them is a known false positive. So are its color findings on candlelit tokens, whose values live in the sidecar.

### Named Rules

**The Two Faces Rule.** Georgia sets words; system-ui with tabular numerals sets every figure that stands as data: table cells, stat values, control values, formula lines, chart ticks, the readout, the round log. A number inside a sentence or a small supporting line stays in Georgia, unless it is set as a figure in its own right. Headings are never system-ui.

**The Installed Faces Rule.** The page makes no external requests, and its content security policy would block a font file if it tried. No webfonts: both stacks resolve to what the reader's machine has.

**The Four Sizes Rule.** Four sizes (12, 14, 16 and 28px) and two weights (400 and 700). Hierarchy comes from face, weight, caps and ink before it comes from size. Chart text steps its user units by container width so it renders at 12px or more.

## Layout

One full-width column, up to 90rem, with 12px side padding and a 20px gap between sections. Spacing runs 4, 8, 12, 16, 20, 24px. The density is deliberate: 24px table rows, 12px card padding.

The page leads with the lesson: header, bar, a one-line preset row, the outcome table with its cards, the chart, then compare, kill, the roll and Try this.

Layout responds to container width, not to the viewport. A page at 64rem or wider puts the two-roll text, legend and cards in a column beside a 43rem table column, with spare height below the cards and the footnote always directly under the table. The cards auto-fit tracks of at least 11rem there, three per row at 1366 and two at 1100, and the marginal and formulas cards span every track. Narrower pages stack them in the same order, on tracks of at least 9rem, up to six. At 72rem the chart's notes sit beside its plot. The plot is up to 50rem wide, and under the sticky bar it narrows with the window's height, to no less than 36rem, so it fits on screen below the bar. The compare section shows +N to hit and +N to damage side by side from a 52rem section width and one at a time below it.

Outcome tables have three size tiers from their own wrapper's width: wide (40px cells, 24px rows), mid under 42rem (24px cells, 24px rows), narrow under 25rem (20px cells, 20px rows). A d12 table still fits a 360px phone, and the page itself never scrolls sideways.

The control bar sticks when the page is at least 70rem wide and the viewport at least 40rem tall, and holds the strip and the verdict on opaque paper over a hairline. Below that the strip scrolls away and only the verdict's lead sticks, with the settings and a Change link; the reason scrolls away with the page, so a phone's sticky area stays short. Scroll padding keeps focus and jump targets clear of the sticky area. On a coarse pointer every control reaches 44px; table cells stay as they are, because they are read and not tapped. On a phone the round log and both derivations start closed; the derivations start closed at every width.

## Elevation & Depth

This system casts no shadows. Depth comes from tone (parchment under vellum), 1px hairlines and ink rules. The `box-shadow` property does appear, but only as a drawing tool: inset, zero blur, used to put a rule inside a table cell without shifting layout. Those are lines on the page, not height above it.

### Shadow Vocabulary
- **Threshold rule** (`box-shadow: inset 0 3px 0 0`, threshold ink): Top of the first row that hits.
- **Crit rule** (`box-shadow: inset 0 -2px 0 0`, accent): Bottom of the natural 20 row.
- **Kill rule** (`box-shadow: inset 0 -2px 0 0`, ink): Bottom of the round log's kill row.
- **Roll ring halo** (`box-shadow: inset 0 0 0 1px`, paper): Inside the 2px ink ring, so it reads on every heat color.

### Named Rules

**The Flat And Ruled Rule.** Nothing casts a shadow, at rest or in any state, including the sticky bar. If a surface needs separating, it gets a tone or a hairline. Inset, zero-blur rules inside tables are the only `box-shadow` allowed.

**The One Focal Figure Rule.** A 3px ink top rule marks one figure: the exact expected damage over 20 rounds, on its stat card and on its figure card beside the simulated run. No other card gets it. It is an ink rule rather than an accent hue, and a deliberate exception to the detector's border-accent rule.

## Shapes

Gently softened rectangles: 8px on surfaces (strip, cards, readout) and 4px on controls and swatches. Tables are square-cornered, as printed tables are. Die segments and the legend's heat ramp join into a single bar that rounds only its outer corners. Surfaces and controls take a 1px border; heavier lines are kept for the focal rule and the rules inside tables. The simulated figure keeps 1px and changes its stroke to dashed.

## Components

Plain, compact and exact: controls look like the form fields of a ruled worksheet, and nothing announces itself except Roll.

### Buttons
- **Shape:** Softly squared corners (4px), at least 32px tall, 44px on a coarse pointer.
- **Roll:** Accent fill, parchment text, bold Georgia, 16px side padding. The page's one primary action.
- **Roll beside the table:** The same button and handler as the roll section's, so Roll stays the one accent-filled action. Its note says what it does, what the last run scored, or that the settings moved on.
- **Presets:** Parchment fill, faded-ink outline, bold Georgia. Secondary to Roll, and never accent. The try row under the bar repeats them at natural width with the preset titles as labels.
- **Step and Reset:** Parchment fill, faded-ink outline, regular system-ui. Step buttons hold a 120px minimum so a changing label moves nothing.
- **Steppers:** The Step fill at 44 by 44px either side of the Attack and Damage boxes, on a coarse pointer below the 70rem page only. They add no tab stops anywhere else, and go inert with `aria-disabled` at a limit.
- **Hover / Focus:** Hover and press mix 15% and 25% ink into the fill (Roll 15% and 30%). Focus is a 2px accent outline at 2px offset. All of it is instant.
- **Disabled:** Vellum fill, faded-ink text, hairline border. An inert Step or Reset uses `aria-disabled` so focus stays put.

### Inputs / Fields
- **Number input:** 80 by 32px, parchment fill, 1px faded-ink outline, 4px corners, centered tabular numerals, accent caret.
- **Slider:** Native range with accent fill, 32px tall, paired with its number box or value.
- **Die selector:** Five joined 48 by 32px segments on vellum over real radios, one tab stop. The checked segment takes the accent fill and bold.
- **Compare switch:** The same segments at natural width, To hit and To damage, shown only where the compare section is under 52rem. CSS only, with no state and no URL; without `:has()` it stays hidden and both tables show.
- **Group label:** Bold label over its control, with a muted range hint beside it. A correction sentence appears under the strip only when a typed value changed.

### Control Strip
Vellum, 1px hairline, 8px corners, 12 by 16px padding, wrapping groups aligned at the bottom edge. Flat even when stuck to the top of the screen.

### Cards / Containers
- **Corner Style:** 8px.
- **Background:** Vellum.
- **Shadow Strategy:** None; see Elevation & Depth.
- **Border:** 1px hairline.
- **Internal Padding:** 12px, with 8px between label, value and supporting line. Rows of cards use subgrid so those three line up across the row.

### Verdict Line
Body type on paper, not a card: a bold lead sentence, then why, in the 20-round numbers the Value of the next +1 card prints, then the chart caption's crossing sentence when the curves cross. The lead and the why are one paragraph flow inside the sticky bar. Below it the lead sticks alone with a hairline under it, and the why reads as the next paragraph.

### Outcome Table
The signature component. A semantic table, fixed layout, hairlines on every cell, with a note column on parchment in Georgia italic for "auto-miss", "hits on N+", "hits at +1" and "crit". Heat cells and hatched misses follow the color rules above. The threshold and crit rules are the only heavy lines. Rolled cells get a 2px ink ring with a parchment halo, or a heavier 3px ring when that exact cell came up more than once; crit, miss and nat 1 row labels keep the ring. Every rolled row shows ×N in the note column, how often that d20 face came up, so no mark covers a number. In the narrow tier the notes shorten to "N+", "miss" and "at +1"; the full words stay in the DOM.

### Exact And Simulated Figures
Side by side, never alike. See the rule below.

**The Exact Versus Simulated Rule.** Exact and simulated figures never share styling. Exact is a solid vellum card under the focal ink rule, with one decimal and a spread; simulated is a dashed outline on parchment with a whole number. Their labels say which is which, so no cue is color.

**The Stale Ink Rule.** When settings move on from a rolled run, values go to faded ink, frames go to hairline, and a sentence says so; the sentence itself stays in full ink. Never opacity, and no element on the page uses it.

### Sweep Chart
Inline SVG, up to 50rem wide. The two series differ by stroke as well as hue: solid for +N to hit, dashed 8 4 for +N to damage, both 3px and non-scaling, with direct labels where there is room. The flat stretch is a labeled band, a crossing is a hollow ink ring, and the +N marker is a faded-ink line with solid dots. A vellum readout reserves its height so hovering never shifts the page, and a closed disclosure holds every value as a table.

### Round Log
A 316px table with 24px rows, hairlines between rows only, and a vellum header. The total sits under a 2px ink rule. Crit is the one accent word. Rows after a kill go to faded ink.

### Community Link
Faded-ink support type with the inline Discord mark in the top right; ink on hover. No fill and no accent, so the title leads.

## Do's and Don'ts

### Do:
- **Do** derive heat from the shared page-wide maximum, per The One Heat Ramp Rule.
- **Do** draw any new table rule as an inset, zero-blur line or a 1px hairline, so it never shifts layout.
- **Do** tune candlelit values by hand when adding a color; set both themes in oklch.
- **Do** tell states apart with words, stroke or hatch as well as color.
- **Do** keep text tokens at 4.5:1 or better on their grounds in both themes.
- **Do** stay on the 4 to 24px spacing scale, the four type sizes and the two weights.

### Don't:
- **Don't** cast a shadow from any surface, including the sticky bar.
- **Don't** add transitions, animation or smooth scrolling; results appear at once.
- **Don't** use opacity to dim stale, disabled or secondary content.
- **Don't** fill anything with accent except Roll and the checked die.
- **Don't** give a table its own heat scale, or use the hatch for anything but a miss.
- **Don't** put the 3px ink top rule on any figure but exact expected damage over 20 rounds.
- **Don't** let exact and simulated figures share a card style.
- **Don't** load a webfont or any other external resource, or set headings in system-ui.
