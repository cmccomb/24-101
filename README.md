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

There are no student accounts, analytics or external runtime dependencies. Three.js 0.170.0 and OrbitControls are vendored under their [MIT license](site/vendor/THREE-LICENSE.txt). OrbitControls' import path is adjusted to use the local Three.js module. Open Sans is vendored under the [SIL Open Font License](site/vendor/fonts/OFL.txt).

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
| `site/style.css`, `site/lab.css` | Shared components and responsive lab layout |
| `tests/physics.test.mjs` | Parameter bounds, conservation, scaling and numerical convergence checks |
| `tests/engineering.test.mjs` | Conservation accounts, requirement equality and feasibility, input roles and applicability |
| `tests/design.test.mjs` | Identity, contrast and asset-version checks |

Run `npm run tokens` after editing the design tokens. Tests reject CSS or 3D palettes that drift from the source tokens. Versioned stylesheet and module URLs keep an interface revision from mixing with cached assets from an older revision.

## Model scope

These are transparent teaching models, not validated equipment simulations or full CAD/CFD/FEA models. Animation uses illustrative speed and scale. Calculations use the stated SI conversions. Every system exposes its assumptions and sources. Numerical balance closure verifies accounting, not physical fidelity. Exercise requirements are editable instructional choices, not equipment ratings or safety limits.

The bicycle uses a lossless chain drive and a prescribed cadence. The refrigerator uses a constant cabinet conductance and an assumed fraction of Carnot cooling COP. Laser cutting uses an assumed removal-energy budget. The EV and Buggy inputs are illustrative, not measurements of CMU team vehicles. The three-wheeled Buggy is shown on an exaggerated straight slope, not the actual course.

The Physics section connects to the published 33-141 topics and identifies extensions into Physics II or later engineering courses. Exact lesson timing should be reviewed against the section's syllabus. Buggy is marked for the week before Spring Carnival (week of April 5, 2027); the library order is not a dated weekly schedule.

## Verification

The test suite checks calculation configurations and conservation accounts across all 14 systems, including drivetrain scaling, refrigerator capacity, and EV integration convergence.

WebGL is needed for the 3D view. The text controls, equations and results remain usable if WebGL is unavailable. Animation respects the reduced-motion preference.
