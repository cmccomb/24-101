# 24-101 · MechE Systems Lab

[Open the lab](https://cmccomb.com/24-101/) · [Design reference](https://cmccomb.com/24-101/design/) · [Design specification](DESIGN.md) · [CMU 24-101](https://www.meche.engineering.cmu.edu/education/courses/24-101.html)

Fourteen mechanical engineering systems organized around engineering claims, explicit system boundaries, conservation laws, parameter studies and editable design requirements. The 3D printer and laser cutter lead into thermal systems, including a heat pump and refrigerator, and motion systems, including a bicycle drivetrain, CMU Buggy and an illustrative electric race car.

## Explore

- Orbit and zoom an orthographic 3D schematic, pause motion, and inspect transparent geometry.
- Distinguish geometry, design capacities, operating conditions, boundary conditions and model assumptions.
- Adjust inputs while watching the model, response plot and calculated quantities. On phones, switch between the model and plot while keeping the results in view.
- Account for energy inputs, outputs and accumulation, or driving force, resistance and momentum change.
- Read equations with numeric substitutions, units, assumptions, source links, and connections to CMU Physics I and subsequent MechE courses.
- Compare designs against reference inputs and sweep one parameter across its range.
- Change an exercise requirement and inspect its margin, shortfall and graph threshold.
- Distinguish model applicability from meeting a design requirement. Solar tank values at or above 100 °C are marked as extrapolations and cannot be labeled feasible.
- Download parameter-study data as CSV, including the applicability flag.
- Share a URL that preserves the system, inputs and exercise requirement.

## Simulate a fabrication file

The printer profile follows the course-rack Ender-3 setup. Its build envelope is 220 × 220 × 250 mm with a 0.4 mm nozzle and 1.75 mm PLA. The laser profile follows TechSpark's published Epilog Fusion Pro specification, with 120 W CO₂ power and a 48 × 36 inch cutting area.

- **Printer.** Export text G-code from Cura using the Ender-3 profile, then choose **Load G-code**. Replay and scrub the actual deposition and travel paths, inspect Z height, and compare feed, extrusion and temperature overrides with nominal motion time and peak hotend demand. **Machine view** animates the bed and X/Z head motion. **Fit job** shows paths in build-plate coordinates.
- **Laser.** Choose **Load SVG / DXF**. Replay vector outlines and travel in document order, center the drawing on the bed, and compare acrylic with plywood using editable power, cut feed, thickness and kerf.
- **Examples.** Use **Example part** to choose a hollow frame or flanged spacer for the printer, and a linkage plate or kerf-fit coupon for the laser. The spacer includes a bore, a flange and alternating infill. The coupon has nominal 3.0, 3.2 and 3.4 mm slots. **Mechanism** restores the original teaching schematic.
- **Privacy.** File parsing and playback run inside the browser. Files remain in memory until the page is closed or refreshed. A shared file-mode URL contains settings. Reopen the same file to restore that job.

G-code supports millimeter/inch units, absolute/relative axes and extrusion, G92 resets, G0/G1 moves, I/J XY arcs, retraction recovery, G4 dwells and feed/flow overrides. Unsupported motion, coordinate systems, firmware retraction and multiple extruders produce an error.

SVG imports require explicit page dimensions, vector outlines and expanded text/clones. DXF imports support LINE, ARC, CIRCLE and straight 2D POLYLINE/LWPOLYLINE entities with millimeter, centimeter, meter, inch or foot units. Unitless DXF coordinates are interpreted as millimeters with a visible note. Curves are sampled at approximately 0.35 mm intervals. Jobs are limited to 300,000 preview segments and 20 MB, with a 2 MB limit for SVG.

Time estimates use constant commanded feed and include known dwells. Heating, homing, acceleration, controller limits, operator pauses and controller path optimization require additional modeling. The printer thermal estimate uses uniform nozzle temperature and sensible heating. The 40 W hotend budget, material-removal energies and optical absorption fractions are explicit classroom assumptions. TechSpark material qualification and machine settings remain part of the fabrication workflow. Raster engraving and PDF/AI files require conversion to supported vector outlines.

There are no student accounts, analytics or external runtime dependencies. Three.js 0.170.0, OrbitControls and SVGLoader are vendored under their [MIT license](site/vendor/THREE-LICENSE.txt). Their import paths use the local Three.js module. Open Sans is vendored under the [SIL Open Font License](site/vendor/fonts/OFL.txt).

## Run locally

Requires Python 3 for the development server; Node.js 24 is used for tests.

```sh
git clone https://github.com/cmccomb/24-101.git
cd 24-101
npm start
```

Open http://localhost:8765. No dependency installation or build is needed. Use a server rather than opening `index.html` with `file://`, because browsers restrict JavaScript modules on local files.

```sh
npm test
```

## Publish

GitHub Pages deploys the `site/` directory after every push to `main`, following successful calculation and syntax checks. Pull requests run validation without deploying. The workflow is in [`.github/workflows/pages.yml`](.github/workflows/pages.yml).

## Source layout

| File | Purpose |
| --- | --- |
| `site/systems.js` | Parameters, SI conversions, calculation models, assumptions, prompts and sources |
| `site/engineering.js` | Lesson claims, boundaries, conservation accounts, requirements and model-applicability checks |
| `design/tokens.json` | Shared color, typography, spacing, layout and motion tokens |
| `site/tokens.css`, `site/theme.js` | Generated CSS and 3D material theme |
| `site/design/` | Living visual reference with a working specimen using the actual printer model |
| `site/models.js` | Procedural 3D geometry, animation, orbit controls and labels |
| `site/app.js` | Controls, results, accounts, charts, requirements, comparison, sharing and CSV export |
| `site/fabrication.js` | Machine profiles, G-code/DXF parsers, file-based physics and playback timing |
| `site/fabrication-svg.js`, `site/fabrication-worker.js` | Local SVG import and background G-code/DXF parsing |
| `site/examples/` | Synthetic fabrication files |
| `site/style.css`, `site/lab.css` | Shared components and responsive lab layout |
| `tests/physics.test.mjs` | Parameter bounds, conservation, scaling and numerical convergence checks |
| `tests/engineering.test.mjs` | Conservation accounts, requirement equality and feasibility, input roles and applicability |
| `tests/design.test.mjs` | Identity, contrast and asset-version checks |
| `tests/fabrication.test.mjs` | Parser modes, units, extrusion, curves, envelopes, material comparisons and timing |

Run `npm run tokens` after editing the design tokens. Tests reject CSS or 3D palettes that drift from the source tokens. Versioned stylesheet and module URLs keep an interface revision from mixing with cached assets from an older revision.

## Model scope

These are transparent teaching models, not validated equipment simulations or full CAD/CFD/FEA models. Animation uses illustrative speed and scale. Calculations use the stated SI conversions. Every system exposes its assumptions and sources. Numerical balance closure verifies accounting, not physical fidelity. Exercise requirements are editable instructional choices, not equipment ratings or safety limits.

The bicycle uses a lossless chain drive and a prescribed cadence. The refrigerator uses a constant cabinet conductance and an assumed fraction of Carnot cooling COP. Laser cutting uses an assumed removal-energy budget. The EV and Buggy inputs are illustrative, not measurements of CMU team vehicles. The three-wheeled Buggy is shown on an exaggerated straight slope, not the actual course.

The Physics section connects to the published 33-141 topics and identifies extensions into Physics II or later engineering courses. Exact lesson timing should be reviewed against the section's syllabus. Buggy is marked for the week before Spring Carnival (week of April 5, 2027); the library order is not a dated weekly schedule.

## Verification

The test suite checks calculation configurations and conservation accounts across all 14 systems, including drivetrain scaling, refrigerator capacity, and EV integration convergence.

WebGL is needed for the 3D view. The text controls, equations and results remain usable if WebGL is unavailable. Animation respects the reduced-motion preference.
