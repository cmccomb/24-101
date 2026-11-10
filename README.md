# 24-101 · MechE Systems Lab

[Open the lab](https://cmccomb.com/24-101/) · [CMU 24-101](https://www.meche.engineering.cmu.edu/education/courses/24-101.html)

Fourteen mechanical engineering systems explored through animated procedural 3D models, adjustable design and operating parameters, and live physics calculations. The collection emphasizes thermal and energy systems, begins with the 3D printer and laser cutter, and includes CMU Buggy and an illustrative electric race car.

## Explore

- Orbit, zoom, pause, change animation speed, and inspect transparent geometry.
- Adjust parameters and see calculated quantities update immediately.
- Read equations with numeric substitutions, units, assumptions, source links, and connections to CMU Physics I and subsequent MechE courses.
- Compare designs against a baseline and sweep one parameter across its range.
- Record predictions and observations, export experiments as JSON, and download sweep data as CSV.
- Share a URL that preserves the selected system and its inputs.

Notes stay in the browser's local storage. There are no student accounts, analytics or external runtime dependencies. Three.js 0.170.0 and OrbitControls are vendored under their [MIT license](site/vendor/THREE-LICENSE.txt). OrbitControls' import path is adjusted to use the local Three.js module.

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
| `site/models.js` | Procedural 3D geometry, animation, orbit controls and labels |
| `site/app.js` | Controls, results, charts, comparison, sharing, notes and exports |
| `site/style.css` | Responsive layout and accessible controls |
| `tests/physics.test.mjs` | Parameter bounds, conservation, scaling and numerical convergence checks |

## Model scope

These are transparent teaching models, not validated equipment simulations or full CAD/CFD/FEA models. Animation uses illustrative speed and scale. Calculations use the stated SI conversions. Every system exposes its assumptions and sources.

The steam plant uses a generic heat-engine balance and a Carnot bound, rather than steam tables or a Rankine property calculation. Laser cutting uses an assumed removal-energy budget. The EV and Buggy inputs are illustrative, not measurements of CMU team vehicles. The three-wheeled Buggy is shown on an exaggerated straight slope, not the actual course.

The Physics section connects to the published 33-141 topics and identifies extensions into Physics II or later engineering courses. Exact lesson timing should be reviewed against the section's syllabus. Buggy is marked for the week before Spring Carnival (week of April 5, 2027); the library order is not a dated weekly schedule.

## Verification

The initial prototype passes 328 parameter configurations across all 14 systems, conservation/scaling checks, and EV integration convergence. Separate DOM checks exercised all 53 inputs, tabs, baseline comparisons, graph paths, notes, sharing and exports. Three.js scene assembly and animation transforms were checked at default and maximum inputs for all 14 models. Browser rendering has not been visually reviewed because browser access was disabled in the authoring environment.

WebGL is needed for the 3D view. The text controls, equations and results remain usable if WebGL is unavailable. Tabs support keyboard navigation and animation respects the reduced-motion preference.
