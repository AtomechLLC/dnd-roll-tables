# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Game designers, tabletop and video game, who want to understand the math of a D&D 5e attack and not just read off a result. Their typical question is "is +1 to hit or +1 to damage worth more here, and why?". They come to the page to build intuition they can reuse in their own systems. DMs and players can use the page too, but design decisions serve the designer (confirmed 2026-11-03).

## Product Purpose

The page teaches the anatomy of one attack roll exactly: a d20 to hit against Armor Class, then a damage die. It renders the full joint outcome table and derives every number from it. The central lesson is that attack bonuses saturate, because hit chance is clamped between 5% and 95%, while damage bonuses scale linearly. Whether the two ever cross depends on AC and the die. Supporting features exist to serve that lesson:
- a +N bonus comparison with an exact sweep chart;
- a real 20-round roll beside the exact expectation and its spread;
- live formulas;
- hits-to-kill against an enemy with editable HP.

Success means a designer who has never seen the page can read it top to bottom, understand why the curves behave as they do, and trust that every number and sentence is true at the settings they chose. The core job is teaching one attack roll's math exactly, and future work must not dilute it into a general calculator (confirmed 2026-11-03).

## Positioning

Exactness as the teaching device. Every displayed number is computed by exact enumeration of the outcome space, with no Monte Carlo. Every explanatory sentence is generated from the same data that draws the table and chart. Both are verified against independent oracles across the entire control domain: 70,980 attack settings, and 1,235,000 attack × HP cases for kills. The page shows the table that produces the number, says when a simple shortcut such as dividing by an average is wrong, and treats "no crossover" as a normal answer rather than inventing one.

## Operating Context

- **Where it lives:** a public static page at https://atomechllc.github.io/dnd-roll-tables/ (repo AtomechLLC/dnd-roll-tables). Every push to `main` redeploys it through a GitHub Actions Pages workflow. It also works opened straight from disk.
- **How it's used:** visitors explore by adjusting target AC (10 to 30), the damage die (d4 to d12), attack and damage bonuses (−5 to +20), a comparison bonus +N (0 to 20), and enemy HP (1 to 500). They also use one-click "Try this" presets, roll 20 rounds on demand, reset to the defaults, and share a setup through the page's URL.
- **Devices:** used on laptops and phones; the layout must work at both.
- **Self-test:** a `?test` query shows the in-page self-test panel.

## Capabilities and Constraints

- **One file:** the whole deliverable is a single `index.html` with inline CSS and classic inline scripts. There is no build step, no framework, no CDN library and no external request; a restrictive CSP enforces this. A user preference, held since project start.
- **Rules modeled:** a natural 1 always misses; a natural 20 always hits and crits with two real damage dice, the bonus added once; otherwise d20 + attack bonus ≥ AC hits; damage never goes below 0. One damage rule feeds the table, stats, chart, simulation and kill math.
- **Exact math:** displayed figures come from exact enumeration. The only randomness is the explicit "Roll 20 rounds" action, which never re-rolls on its own.
- **Dev-only checks:** `tools/check-engine.mjs` and `tools/check-page.mjs` must keep passing and must never become build dependencies.
- **Out of scope by decision:**
  - multi-dice damage;
  - advantage and disadvantage;
  - multiple attacks per round, class features and spells;
  - player build-optimization framing.

  Multi-dice damage and advantage/disadvantage remain candidates for a future milestone.

## Brand Commitments

- **Name:** "D&D Combat Roll Simulator". The page carries no publisher or company branding (confirmed 2026-11-03).
- **Community link:** the top right corner of the page links to Funsmith Club (https://funsmith.club), shown with the Discord logo (user request, 2026-11-03). Funsmith Club is a Discord-based community for game developers run by Game Design Skills; funsmith.club redirects to gamedesignskills.com/funsmith-club/. It is a community link, not publisher branding: the page's title and voice stay as they are. The club's own page lists the invite https://discord.gg/GMxgxptwpu. The user did not ask for it, so it isn't used.
- **Voice:** designer to designer. Short and plain, two to four sentences per spot, one idea per sentence. Rules are explained only as far as the lesson needs. This voice was set in the Phase 4 discussion.
- **Uses D&D 5e rule terms** to describe the mechanics.

## Evidence on Hand

- **Live page and code:** `index.html`, the live URL above, and `README.md`.
- **Reference values verified by the engine,** at the defaults of AC 15, d8, +5 to hit, +0 damage and 40 HP:
  - 55% hit chance;
  - 54.0 expected damage over 20 rounds, ± 14.2;
  - 8.7 expected hits and 15.8 expected rounds to kill;
  - an 85% chance of a kill within 20 rounds.
- **Planning record:** `.planning/` (PROJECT.md, the milestone archive and the phase records).
- **Absences:** there are no user testimonials, usage analytics, case studies or press, and no endorsement by or affiliation with the D&D publisher. Future work must not invent or imply any of these.

## Product Principles

1. **Every number and every sentence is true at every setting.** Claims are checked against the engine, not against a copy of the page's own text.
2. **Exact before approximate.** Show the true value. When a common shortcut is wrong, say so instead of using it.
3. **The lesson leads.** Features earn their place by making the +hit versus +damage lesson clearer, not by widening scope.
4. **Explain the why next to the what.** Formulas show the rule, then today's numbers. Explanations sit beside the thing they explain.
5. **Respect chance.** Exact expectations and real variance appear side by side, so designers don't over-trust averages.

## Accessibility & Inclusion

- Every control is reachable and operable by keyboard and has a visible label.
- Miss versus hit, and the two chart series, never rely on color alone.
- Status announcements are limited to deliberate actions such as rolling or stepping HP, and slider drags never announce.
- The dev checks enforce these guards, and they must keep passing.
