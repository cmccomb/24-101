# 24-101 · MechE Systems Lab

[Open the lab](https://cmccomb.com/24-101/) · [CMU 24-101](https://www.meche.engineering.cmu.edu/education/courses/24-101.html)

Fourteen mechanical engineering systems organized around engineering claims, explicit system boundaries, conservation laws, parameter studies and editable design requirements. The collection emphasizes thermal and energy systems, begins with the 3D printer and laser cutter, and includes CMU Buggy and an illustrative electric race car.

## Explore

- Orbit and zoom an orthographic 3D schematic, pause motion, and inspect transparent geometry.
- Distinguish geometry, design capacities, operating conditions, boundary conditions and model assumptions.
- Adjust inputs and see calculated quantities update immediately.
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
| `site/models.js` | Procedural 3D geometry, animation, orbit controls and labels |
| `site/app.js` | Controls, results, accounts, charts, requirements, comparison, sharing and CSV export |
| `site/style.css` | Responsive layout and accessible controls |
| `tests/physics.test.mjs` | Parameter bounds, conservation, scaling and numerical convergence checks |
| `tests/engineering.test.mjs` | Conservation accounts, requirement equality and feasibility, input roles and applicability |

## Model scope

These are transparent teaching models, not validated equipment simulations or full CAD/CFD/FEA models. Animation uses illustrative speed and scale. Calculations use the stated SI conversions. Every system exposes its assumptions and sources. Numerical balance closure verifies accounting, not physical fidelity. Exercise requirements are editable instructional choices, not equipment ratings or safety limits.

The steam plant uses a generic heat-engine balance and a Carnot bound, rather than steam tables or a Rankine property calculation. Laser cutting uses an assumed removal-energy budget. The EV and Buggy inputs are illustrative, not measurements of CMU team vehicles. The three-wheeled Buggy is shown on an exaggerated straight slope, not the actual course.

The Physics section connects to the published 33-141 topics and identifies extensions into Physics II or later engineering courses. Exact lesson timing should be reviewed against the section's syllabus. Buggy is marked for the week before Spring Carnival (week of April 5, 2027); the library order is not a dated weekly schedule.

## Verification

The current version passes 328 calculation configurations and 208 conservation-account/requirement configurations across all 14 systems, including conservation/scaling checks and EV integration convergence. Separate DOM checks exercised all 53 inputs, tabs, reference comparisons, graph paths, requirement edits, invalid-model states, responsive chart coordinates, sharing and CSV export. Three.js scene assembly and animation transforms were checked at default and maximum inputs for all 14 models. Browser rendering has not been visually reviewed because browser access was disabled in the authoring environment.

WebGL is needed for the 3D view. The text controls, equations and results remain usable if WebGL is unavailable. Tabs support keyboard navigation and animation respects the reduced-motion preference.
