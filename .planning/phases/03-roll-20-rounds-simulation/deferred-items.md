# Deferred Items (Phase 03)

- **Legend crit swatch shrinks at phone width (pre-existing, Phase 1).** At 360 px the `Natural 20: crit ...` legend item wraps, and its `.swatch.h.hi.crit` flex item shrinks below its 40px width (about 35px). Found during 03-03 screenshots. Out of scope for 03-03, which only pinned its own `.swatch.roll` with `flex-shrink: 0`. A one-line fix would be `.legend-item > .swatch { flex-shrink: 0; }`.
