# Frontend direction — seed 7319

The previous beige editorial direction was rejected by the owner. The accepted
constraint for this revision is quiet black, with a distinctive animation or
pointer interaction. This is a design experiment, not a claim that aesthetics
can be validated automatically.

## Research

- [Anthropic: harness design](https://www.anthropic.com/engineering/harness-design-long-running-apps)
  distinguishes coherent design and originality from technical correctness. It
  also reports that even phrases such as “museum quality” can cause a new visual
  convergence. A different palette alone is insufficient.
- [ET Studio: Sileent](https://www.e-t.studio/works/sileent) uses monochrome and
  pointer interaction as parts of a single identity. Reference for restraint and
  purposeful interaction, not a layout or asset to reproduce.

## Decisions

- Near-black backgrounds, neutral white and gray; no decorative accent palette.
- Manrope for navigation, titles and reading. No italic display serif, ornamental
  arch illustration, feature-card grid, or fabricated editorial quotation.
- A large site name, direct introduction, then actual essay titles in rows.
- One custom interaction: a question mark rendered as a deterministic point
  field. Seed **7319** controls size, opacity and phase. The pointer displaces
  points; easing restores the glyph. Native pointer and scrolling remain intact.
- Hover motion belongs to reading links. No per-section entrance choreography.
- Canvas work stops offscreen, in a hidden tab, or when paused. Pixel ratio is
  capped at two. Reduced motion starts paused, with an explicit in-page opt-in;
  that choice lasts for the browser session. No new animation dependencies.
- On mobile the composition stacks, with no hover-dependent content or actions.

The illustration lives in `src/QuestionField.jsx`; shared layout and appearance
live in `src/index.css` and the semantic Tailwind palette. Existing archive,
language, reading, feedback and Clarus functionality remains in the React app.
