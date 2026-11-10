# 24-101 design language

[Living design reference](https://cmccomb.com/24-101/design/) · [Token source](design/tokens.json)

## Identity

The course number is the primary identity. Pair **24-101** with **Fundamentals of Mechanical Engineering** in Open Sans. A short Carnegie Red rule anchors the number. Use the lockup on white for working material; reserve its reversed version for covers and section dividers. The course identity is distinct from an official university trademark. Use approved CMU assets whenever an official university mark is needed.

The visual character follows Chris McComb's teaching and research presentations: a complete-sentence claim, a dominant evidence region, visible provenance, and enough white space to see the argument. Engineering notation supplies the visual grammar: boundaries, arrows, dimensions, axes, units and constraints.

## Lesson grammar

1. **Claim:** state the relationship students should learn.
2. **System:** show the mechanism and adjustable quantities.
3. **Boundary:** name what the model includes and its time basis.
4. **Account:** show input, output and accumulation with compatible units.
5. **Response:** vary one input while holding the others fixed.
6. **Requirement:** compare the response with an explicit, editable bound.
7. **Applicability:** expose assumptions, extrapolation and sources.

This sequence is the organizing structure for future systems, slides and assignments.

## Color roles

| Role | Token | Use |
| --- | --- | --- |
| Identity and current response | Carnegie Red `#C41230` | Active system, current design, response curve, links, emphasis |
| Structure | Ink `#202124`, Iron Gray `#6D6E71`, Steel Gray `#E0E0E0` | Text, reference quantities, machinery and borders |
| Constraint or accumulation | Blue `#043673` | Requirement line; stored energy or momentum change |
| Heated component or heat flow | Red `#C41230` | Thermal meaning within a 3D diagram |
| Flowing fluid | Blue `#397EAC` | Fluid paths within a 3D diagram |
| Light input | Ochre `#B49A4F` | Sunlight in a physical diagram |

Color roles are local to a figure and must be supported by direct labels. Red is not a generic error signal: a requirement shortfall is stated in text. Meeting a requirement does not receive a celebratory color. The current design, reference and requirement must remain distinguishable without color.

The [CMU core palette](https://brand.cmu.edu/node/) supplies Carnegie Red and core grays. The [CMU data visualization guidance](https://www.cmu.edu/brand/brand-guidelines/data-viz.html) informs the supporting blue. Open Sans follows Chris's established teaching style.

## Typography and layout

- Open Sans throughout; tabular numerals for measured values. Use scientific notation when rounding would hide a meaningful quantity.
- Claim: 28–38 px, regular weight, sentence case, at most two lines in a normal desktop view.
- Section heading: 18 px, semibold. Body and controls: 14 px. Labels: 12 px. Captions and provenance: at least 11 px in the shared design system.
- Use the 4, 8, 12, 16, 24, 32, 48, 64 and 96 px spacing scale. Align related text, plots and diagrams before adding borders.
- Square corners, thin rules and a white canvas. One strong red rule is more useful than repeated decorative containers.
- Desktop: a narrow system index, a dominant model, and adjacent inputs. Tablet: model above controls. Phone: horizontal system index and a single column. Plot coordinates adapt to available width so axis labels remain readable.

## Diagram and plot grammar

| Meaning | Treatment |
| --- | --- |
| System boundary | Dashed graphite enclosure with a named scope |
| Response within assumptions | Solid red curve |
| Current design | Red point with a direct numerical context |
| Requirement | Dashed blue line labeled with value and units |
| Reference | Graphite text with a numerical value and signed change |
| Extrapolation | Dashed gray curve plus an explicit applicability message |
| Accumulation | Blue numerical term, explicitly named as stored energy or momentum change |

Put axis labels and units on the plot. Expose the controlled and varied quantities. Do not infer physical validity from a closed numerical balance. Do not use scaled widths, areas or motion rates unless their quantitative meaning is specified.

## Components and motion

Inputs carry a physical role: geometry, capacity, operating condition, boundary condition, material/contact property or model assumption. Numerical input and slider edit the same value. Result rows show quantity, unit, reference and change. A design requirement shows the bound, current response and margin or shortfall. Outside model applicability, the design is never marked as meeting a requirement.

Use motion to explain a mechanism or transport process. Avoid automatic camera orbit, bobbing, decorative particles and animated counters. The default camera is orthographic. Keep pause and reduced-motion support. Animation scale and time must be distinguished from calculated results. Camera position, material appearance and labels should remain consistent across systems.

## Implementation

`design/tokens.json` is the source of truth for colors, type, spacing, layout and feedback timing. Run `npm run tokens` to generate `site/tokens.css` and the Three.js palette in `site/theme.js`. `npm test` verifies that generated files match the token source and checks text/figure contrast alongside the physics and engineering accounts.

The [living reference](https://cmccomb.com/24-101/design/) uses the same generated tokens, identity lockup and components as the lab. Its sample results are calculated from the actual printer model. Future visual changes should update the reference and the lab together.

Browser rendering remains unreviewed in the authoring environment. Token, contrast, DOM and geometry checks are evidence of implementation consistency, not visual signoff.
