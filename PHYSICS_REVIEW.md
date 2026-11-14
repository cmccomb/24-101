# Physics model review — November 13, 2026

The first version rendered recognizable machines, but several inputs affected only numbers or animation speed. The revision gives each course model an explicit physical relationship to explain. Controls, 3D evidence and response plots remain beside each other on desktop; phones retain the model/plot switch and pinned results.

The hydraulic press replaces the excavator in week 6, reducing overlap with the single robot-arm lesson. The shared course notes, course-plan page, coverage map and repository list use the same replacement. Earlier examples remain under Further systems.

| Step | System | Finding and revision | Health |
| --- | --- | --- | --- |
| 1 | Laser cutter | Kerf was effectively invisible. Added an enlarged kerf/stock section, absorbed-power arrow, travel arrow and energy-budget depth. File mode shows feed, kerf, optical-power and stock cues. | Verified |
| 2 | FDM 3D printer | Bead width and temperature had little visible effect. Added an enlarged bead section, layer count, heating demand and temperature color. File mode adds feed/power arrows and enlarged extrusion/temperature markers. | Verified |
| 3 | Bicycle brake and wheel | Motion did not expose the braking load path. Added weight, normal reaction, braking force and stopping-distance cues; rotor geometry uses the physical wheel/rotor radius ratio. | Verified |
| 4 | Elevator | Acceleration affected calculations without explaining the load case. Added weight/tension vectors on a common force scale, velocity and acceleration cues, opposed car/counterweight motion and connected ropes. | Verified |
| 5 | Robot arm and gripper | Settled motion could hide gain changes. One arm now has an equal-time response trace, a fixed 2 s comparison marker and world-vertical payload weight; redundant callouts were removed. | Verified |
| 6 | Hydraulic press | Replaced the second arm-like example. Connected piston chambers expose piston-area ratio, force, stroke, pressure and conserved liquid volume during motion. | Verified |
| 7 | Centrifugal pump and piping | Pipe length and bore were weakly represented. Added an enlarged bore, repeated pipe runs, outlet elevation and flow cues. No-flow conditions suppress the flow arrow. | Verified |
| 8 | Refrigerator / heat pump | Flow particles did not show the first-law account. Added cabinet/room temperatures, insulation, heat leak, cold-side removal, electrical input, heat rejection and required duty. | Verified |
| 9 | Espresso machine | Pressure incorrectly changed stream speed despite prescribed flow. Restored constant 2 mL/s flow; pressure changes brew-face force. Water level, target temperature, heater input and a fixed 30 s heat-up comparison explain the thermal model. | Verified |
| 10 | Washing machine suspension | Springs did not remain properly attached. Horizontal springs and damper now follow the modeled translation. The view shows rotating imbalance, transmitted-force amplitude and a magnified motion envelope. | Verified |
| 11 | Quadcopter | Rotor motion alone concealed thrust and control effects. Added swept area, hover thrust, world-vertical weight, equal-time roll-response dots and a fixed 1 s marker. | Verified |
| 12 | CMU Buggy | Normalizing each run to one playback duration concealed resistance changes. Retained the three-wheel shell, added an exit-force budget and a physical 20 s position marker, and changed playback to a common physical clock. | Verified |
| 13 | Autoinjector | Needle bore and liquid resistance were difficult to see. Added an enlarged bore, spring force, plunger motion, expelled-liquid cue and fixed 5 s stroke marker. Laminar-model extrapolations remain marked. | Verified |
| 14 | Data-center cooling | IT load and supply temperature barely affected the scene. Added IT heat, airflow and fan-power cues plus a defined 10–60 °C air-color scale. | Verified |

## Verification

- The complete calculation, conservation, scheduling, design-token and fabrication suites pass.
- The real explanatory renderer is exercised in 126 default/boundary scene configurations at multiple animation times. Checks cover finite geometry, gravity direction, depicted press liquid volume, fixed espresso flow, attached springs and Buggy dynamics against an independent time-step solver.
- All 56 mechanism controls and seven fabrication-job controls were checked with playback paused. Stable full-screen captures were cropped to the canvas, and text-label regions were excluded from pixel comparison. Every control changed rendered content. An unchanged paused view produced matching pixels.
- All four built-in parts loaded; laser material switching updated the preview and calculations. Browser console checks returned no errors. The phone view was checked for horizontal overflow, readable controls and model/plot switching.

## Interpretation and limits

Physical quantities retain the calculation models' units and assumptions. Schematics use display magnification where small dimensions would disappear. Press input/output force arrows use different declared display scales; they should be compared using their numeric labels. Response dots mark equal time intervals, rather than a second arm or aircraft.

File previews preserve the imported paths. Cursor and power/feed arrows expose overrides; they do not reslice a model, predict cut quality, or validate fabrication settings. Screen checks and keyboard editing do not establish full screen-reader or accessibility compliance. Boundary-value visual checks establish that controls affect the renderer, not that every small increment is perceptually large or that the equipment model is calibrated.

The local audit artifact contains the accepted before/after screenshots and per-control evidence. Preliminary clipped captures were superseded by stable full-frame comparisons.
