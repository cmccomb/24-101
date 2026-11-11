import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {systems, defaults} from '../site/systems.js';
import {engineering, requirement} from '../site/engineering.js';
import {parseGCode, parseDXF, pathsToLaserJob, jobSystem, jobTimeline} from '../site/fabrication.js';

const close = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) < tolerance * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);
const absolute = parseGCode('G21\nG90\nM82\nG92 E0\nG1 X10 E1 F600\nG1 X20 E2\n');
const relative = parseGCode('G21\nG91\nM83\nG1 X10 E1 F600\nG1 X10 E1\n');
close(absolute.filament, 2);
close(absolute.motionSeconds, 2);
assert.deepEqual(absolute.bounds, relative.bounds);
close(relative.filament, absolute.filament);

const retract = parseGCode('G90\nM83\nG1 X10 E1 F600\nG1 E-2 F120\nG1 X20 E3 F600\n');
close(retract.filament, 2);
close(retract.motionSeconds, 3);
const eReset = parseGCode('M82\nG1 X10 E1 F600\nG92 E0\nG1 X20 E1\n');
close(eReset.filament, 2);
const offset = parseGCode('G1 X10 E1 F600\nG92 X0\nG1 X10 E2\n');
close(offset.bounds.max[0], 20);
const inches = parseGCode('G20\nG1 X1 E.1 F60\n');
close(inches.bounds.max[0], 25.4);
close(inches.motionSeconds, 1);
const dwell = parseGCode('G1 X10 E1 F600\nG4 P500\nG4 S2\n');
close(dwell.dwellSeconds, 2.5);
const arc = parseGCode('G0 X10 Y10 F600\nM83\nG2 X20 Y10 I5 J0 E2 F600\n');
close(arc.cutLength, Math.PI * 5, .001);
close(arc.filament, 2);
assert.throws(() => parseGCode('G1 X10 E1 F0'), /Feed/);
assert.throws(() => parseGCode('G1 XNaN Y10 E1 F600'), /syntax/);
assert.throws(() => parseGCode('G1 X10 E1 F600\nG5 X20'), /G5/);
assert.throws(() => parseGCode('G1 X10 E1 F600\nM200 D1.75'), /M200/);
assert.throws(() => parseGCode('G1 X10 E1 F600\nT1'), /T1/);
assert.equal(parseGCode('G1 X230 E1 F600').fits, false);
assert.equal(parseGCode('G1 X10 E1 F600').fits, true);

const printer = systems.find(s => s.id === 'printer');
const demo = parseGCode(readFileSync(new URL('../site/examples/ender3-frame.gcode', import.meta.url), 'utf8'));
assert.equal(demo.layers.length, 80);
assert.equal(demo.fits, true);
const print = jobSystem(printer, demo), pp = defaults(print), pr = print.calc(pp), fast = print.calc({...pp, speed: 200});
close(fast.metrics[3].value * 2, pr.metrics[3].value);
close(fast.metrics[0].value, pr.metrics[0].value * 2);
close(fast.metrics[1].value, pr.metrics[1].value * 2);
close(engineering(print, pp).residual, 0);
close(jobTimeline(demo, pp).at(-1).end / 60, pr.metrics[3].value);
const prime = parseGCode('M83\nG1 E5 F60\nG1 X10 E1 F600');
close(prime.filament, 6);
close(prime.peakFilamentRate, 1);
const badPrint = jobSystem(printer, parseGCode('G1 X230 E1 F600'));
assert.equal(requirement(badPrint, badPrint.calc(defaults(badPrint)), 1e9, engineering(badPrint, defaults(badPrint)).valid).met, false);

const dxf = ['0','SECTION','2','HEADER','9','$INSUNITS','70','1','0','ENDSEC','0','SECTION','2','ENTITIES','0','LINE','10','0','20','0','11','1','21','0','0','ENDSEC','0','EOF'].join('\n');
const drawing = parseDXF(dxf);
close(drawing.cutLength, 25.4);
assert.equal(drawing.fits, true);
assert.throws(() => parseDXF(dxf.replace('LINE', 'SPLINE')), /unsupported/);
assert.throws(() => pathsToLaserJob([[[NaN, 0], [1, 1]]]), /invalid/);
const laser = systems.find(s => s.id === 'laser'), acrylic = jobSystem(laser, drawing, 'acrylic'), wood = jobSystem(laser, drawing, 'plywood');
const lp = defaults(acrylic);
close(acrylic.calc(lp).metrics[3].value * 60, 25.4 / lp.speed);
assert.notEqual(acrylic.calc(lp).metrics[2].value, wood.calc(lp).metrics[2].value);
close(engineering(acrylic, lp).residual, 0);
close(jobTimeline(drawing, lp).at(-1).end / 60, acrylic.calc(lp).metrics[3].value);
for (const system of [print, acrylic, wood]) {
  for (let mask = 0; mask < 2 ** system.params.length; mask++) {
    const values = Object.fromEntries(system.params.map((p, i) => [p.key, mask & (1 << i) ? p.max : p.min]));
    const calculated = system.calc(values);
    for (const m of calculated.metrics) assert.ok(Number.isFinite(m.value) && m.value >= 0);
    close(engineering(system, values).residual, 0);
    close(jobTimeline(system.job, values).at(-1).end / 60, calculated.metrics[3].value);
  }
}
console.log('Passed toolpath modes, units, retractions, arcs, file-based physics, materials, envelopes and timeline checks.');
