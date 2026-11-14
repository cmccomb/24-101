import {fmt} from './systems.js?v=1.5.0';

export const machines = {
  printer: {
    name: 'Creality Ender-3',
    area: [220, 220, 250],
    detail: '24-101 course rack · 12 printers · 220 × 220 × 250 mm · 0.4 mm nozzle · 1.75 mm PLA',
    source: 'https://www.creality.com/br/resources/faq'
  },
  laser: {
    name: 'Epilog Fusion Pro',
    area: [1219.2, 914.4, 0],
    detail: 'TechSpark · 120 W CO₂ · 48 × 36 in cutting area',
    source: 'https://engineering.cmu.edu/techspark/facilities/fab-lab.html'
  }
};

// Effective removal energy and absorption are classroom assumptions.
// These values are intentionally separate from machine specifications.
export const laserMaterials = {
  acrylic: {label: 'Acrylic', energy: 2.36, absorption: .7, color: 0xb4cbd5},
  plywood: {label: 'Plywood', energy: 1.5, absorption: .8, color: 0xbe9b76}
};

export const maxSegments = 300000;
export const maxFileBytes = 20 * 1024 * 1024;
const filamentArea = Math.PI * 1.75 ** 2 / 4;
const metric = (label, value, unit) => ({label, value, unit});
const equation = (name, formula, substitution) => ({name, formula, substitution});
const parameter = (key, label, unit, min, max, step, value, help) => ({key, label, unit, min, max, step, value, help});
const distance = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);

export function finishJob(kind, segments, extra = {}) {
  if (!segments.some(segment => segment.active)) throw new Error('The file contains no deposition or cutting paths.');
  const bounds = {min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity]};
  let cutLength = 0, travelLength = 0, motionSeconds = 0, dwellSeconds = 0, filament = 0, peakFilamentRate = 0;
  const layers = new Set();
  for (const segment of segments) {
    segment.length = distance(segment.from, segment.to);
    if (segment.active) {
      cutLength += segment.length;
      layers.add(Math.round(segment.to[2] * 1000) / 1000);
      for (const point of [segment.from, segment.to]) {
        point.forEach((value, axis) => {
          bounds.min[axis] = Math.min(bounds.min[axis], value);
          bounds.max[axis] = Math.max(bounds.max[axis], value);
        });
      }
    } else travelLength += segment.length;
    motionSeconds += segment.seconds || 0;
    dwellSeconds += segment.dwell || 0;
    filament += segment.extrusion || 0;
    if (segment.extrusion > 0 && segment.seconds > 0) peakFilamentRate = Math.max(peakFilamentRate, segment.extrusion / segment.seconds);
  }
  const limit = machines[kind].area;
  const fits = bounds.min.every((value, axis) => value >= -.01 && bounds.max[axis] <= limit[axis] + .01);
  return {
    kind, segments, bounds, fits, cutLength, travelLength, motionSeconds, dwellSeconds,
    filament, peakFilamentRate, layers: [...layers].sort((a, b) => a - b), warnings: [], ...extra
  };
}

export function parseGCode(text) {
  if (text.includes('\0')) throw new Error('Choose a text .gcode file exported for the Ender-3.');
  const segments = [], warnings = new Set();
  let position = [0, 0, 0], offset = [0, 0, 0], extruder = 0, retracted = 0;
  let relative = false, relativeExtruder = null, units = 1, feed = 1200, feedFactor = 1, flowFactor = 1, nozzle = 210;
  const add = segment => {
    if (segments.length >= maxSegments) throw new Error('This file exceeds 300,000 preview segments. Export a smaller job.');
    segments.push(segment);
  };
  for (const [index, original] of text.split(/\r?\n/).entries()) {
    const line = original.replace(/\([^)]*\)/g, '').split(';')[0].split('*')[0].trim().toUpperCase().replace(/^N\d+\s*/, '');
    if (!line || line === '%') continue;
    const words = [...line.matchAll(/([A-Z])\s*([-+]?(?:\d+\.?\d*|\.\d+))/g)];
    const first = words.shift();
    if (!first) throw new Error(`Unrecognized G-code at line ${index + 1}.`);
    const command = first[1] + Number(first[2]);
    const values = Object.fromEntries(words.map(word => [word[1], Number(word[2])]));
    if (Object.values(values).some(value => !Number.isFinite(value) || Math.abs(value) > 1e8)) throw new Error(`Invalid numeric value at line ${index + 1}.`);
    if (command === 'G20') { units = 25.4; continue; }
    if (command === 'G21') { units = 1; continue; }
    if (command === 'G90' || command === 'G91') { relative = command === 'G91'; relativeExtruder = null; continue; }
    if (command === 'M82' || command === 'M83') { relativeExtruder = command === 'M83'; continue; }
    if (command === 'G92') {
      for (const [axis, letter] of ['X', 'Y', 'Z'].entries()) if (letter in values) {
        offset[axis] += position[axis] - values[letter] * units;
        position[axis] = values[letter] * units;
      }
      if ('E' in values) extruder = values.E * units;
      continue;
    }
    if (command === 'G28') {
      const axes = ['X', 'Y', 'Z'];
      const selected = axes.filter(letter => new RegExp(letter).test(line));
      for (const letter of selected.length ? selected : axes) {
        const axis = axes.indexOf(letter);
        position[axis] = offset[axis] = 0;
      }
      warnings.add('Homing and heating waits are excluded from the time estimate.');
      continue;
    }
    if (command === 'G4') { add({from: position.map((v, i) => v + offset[i]), to: position.map((v, i) => v + offset[i]), active: false, dwell: Math.max(0, (values.P || 0) / 1000 + (values.S || 0))}); continue; }
    if (command === 'M104' || command === 'M109') {
      if (values.S > 0) nozzle = values.S;
      if (command === 'M109') warnings.add('Homing and heating waits are excluded from the time estimate.');
      continue;
    }
    if (command === 'M190') { warnings.add('Homing and heating waits are excluded from the time estimate.'); continue; }
    if (command === 'M220' || command === 'M221') {
      if (!(values.S > 0)) throw new Error(`Invalid override at line ${index + 1}.`);
      if (command === 'M220') feedFactor = values.S / 100;
      else flowFactor = values.S / 100;
      continue;
    }
    if (['G5', 'G10', 'G11', 'G18', 'G19', 'G53', 'G54', 'G55', 'G56', 'G57', 'G58', 'G59', 'M206', 'M218', 'M428'].includes(command) || (command === 'M200' && values.D > 0) || (first[1] === 'T' && Number(first[2]) !== 0)) {
      throw new Error(`${command} at line ${index + 1} is outside this single-extruder, XY-plane preview. Export ordinary Ender-3 G-code from Cura.`);
    }
    if (!['G0', 'G1', 'G2', 'G3'].includes(command)) {
      if (first[1] === 'G' && !['G17', 'G29'].includes(command)) throw new Error(`Unsupported motion command ${command} at line ${index + 1}.`);
      if (['M0', 'M1', 'M25', 'M600'].includes(command)) warnings.add('Operator pauses are excluded from the time estimate.');
      continue;
    }
    const residue = line.replace(/([A-Z])\s*([-+]?(?:\d+\.?\d*|\.\d+))/g, '').trim();
    if (residue || words.some(word => ['G', 'M', 'T'].includes(word[1]))) throw new Error(`Invalid or combined motion syntax at line ${index + 1}.`);
    if ('F' in values) feed = values.F * units;
    if (!(feed > 0)) throw new Error(`Feed rate must be positive at line ${index + 1}.`);
    const next = position.map((value, axis) => {
      const target = values[['X', 'Y', 'Z'][axis]];
      return target === undefined ? value : (relative ? value : 0) + target * units;
    });
    const eNext = 'E' in values ? ((relativeExtruder ?? relative) ? extruder : 0) + values.E * units : extruder;
    const eDelta = (eNext - extruder) * flowFactor;
    let deposit = 0;
    if (eDelta < 0) retracted -= eDelta;
    else {
      deposit = Math.max(0, eDelta - retracted);
      retracted = Math.max(0, retracted - eDelta);
    }
    const from = position.map((value, axis) => value + offset[axis]);
    const to = next.map((value, axis) => value + offset[axis]);
    if (command === 'G2' || command === 'G3') {
      if (values.P > 0 || values.K) throw new Error('Export single-turn XY arcs with I/J offsets.');
      if ('R' in values) throw new Error('Radius-format arcs are unsupported. Export I/J arcs or linear moves.');
      const center = [from[0] + (values.I || 0) * units, from[1] + (values.J || 0) * units];
      const radius = Math.hypot(from[0] - center[0], from[1] - center[1]);
      if (radius < 1e-8 || Math.abs(Math.hypot(to[0] - center[0], to[1] - center[1]) - radius) > .05) throw new Error(`Invalid XY arc at line ${index + 1}.`);
      const start = Math.atan2(from[1] - center[1], from[0] - center[0]);
      let angle = Math.atan2(to[1] - center[1], to[0] - center[0]) - start;
      if (command === 'G2' && angle >= 0) angle -= Math.PI * 2;
      if (command === 'G3' && angle <= 0) angle += Math.PI * 2;
      const count = Math.max(2, Math.ceil(Math.abs(angle) * radius / .35));
      let previous = from;
      for (let step = 1; step <= count; step++) {
        const fraction = step / count, theta = start + angle * fraction;
        const point = step === count ? to : [center[0] + radius * Math.cos(theta), center[1] + radius * Math.sin(theta), from[2] + (to[2] - from[2]) * fraction];
        add({from: previous, to: point, active: deposit > 0, extrusion: deposit / count, seconds: Math.hypot(radius * angle / count, (to[2] - from[2]) / count) / (feed * feedFactor / 60)});
        previous = point;
      }
    } else {
      const length = distance(from, to);
      add({from, to, active: deposit > 0 && length > 1e-8, extrusion: deposit, seconds: (length > 1e-8 ? length : Math.abs(eNext-extruder)) / (feed * feedFactor / 60)});
    }
    position = next;
    extruder = eNext;
  }
  return finishJob('printer', segments, {nozzle: Math.max(180, Math.min(250, nozzle)), warnings: [...warnings]});
}

export function pathsToLaserJob(paths, extra = {}) {
  const segments = [];
  let previous = [0, 0, 0];
  for (const path of paths) {
    if (path.length < 2) continue;
    const first = [...path[0], 0];
    if (!first.every(Number.isFinite)) throw new Error('The vector file contains invalid coordinates.');
    if (distance(previous, first) > 1e-8) segments.push({from: previous, to: first, active: false});
    previous = first;
    for (const point of path.slice(1)) {
      const next = [...point, 0];
      if (!next.every(Number.isFinite)) throw new Error('The vector file contains invalid coordinates.');
      if (distance(previous, next) > 1e-8) segments.push({from: previous, to: next, active: true});
      previous = next;
      if (segments.length > maxSegments) throw new Error('This file exceeds 300,000 preview segments. Simplify the vector paths.');
    }
  }
  return finishJob('laser', segments, extra);
}

export function parseDXF(text) {
  const lines = text.replace(/\r/g, '').split('\n');
  const groups = [];
  for (let index = 0; index + 1 < lines.length; index += 2) groups.push([Number(lines[index].trim()), lines[index + 1].trim()]);
  const unitIndex = groups.findIndex(([code, value]) => code === 9 && value === '$INSUNITS');
  const unitCode = unitIndex >= 0 ? Number(groups[unitIndex + 1]?.[1]) : 0;
  const scales = {0: 1, 1: 25.4, 2: 304.8, 4: 1, 5: 10, 6: 1000};
  if (!(unitCode in scales)) throw new Error('DXF units are unsupported. Export millimeters or inches.');
  const scale = scales[unitCode], paths = [];
  let inEntities = false, polyline = null;
  for (let index = 0; index < groups.length; index++) {
    const [code, type] = groups[index];
    if (code === 2 && type === 'ENTITIES') { inEntities = true; continue; }
    if (!inEntities || code !== 0) continue;
    if (type === 'ENDSEC') break;
    let end = index + 1;
    while (end < groups.length && groups[end][0] !== 0) end++;
    const data = groups.slice(index + 1, end), value = (key, fallback = 0) => Number(data.find(pair => pair[0] === key)?.[1] ?? fallback);
    if (value(210) !== 0 || value(220) !== 0 || value(230, 1) !== 1) throw new Error('Export DXF entities in the XY plane with the default extrusion direction.');
    if (data.some(([key, entry]) => (key === 30 || key === 31 || key === 38) && Math.abs(Number(entry)) > 1e-8)) throw new Error('Export a planar XY DXF with Z = 0.');
    if (type === 'LINE') paths.push([[value(10), value(20)], [value(11), value(21)]]);
    else if (type === 'CIRCLE' || type === 'ARC') {
      const radius = value(40);
      if (!(radius > 0)) throw new Error('A DXF arc has an invalid radius.');
      const start = type === 'CIRCLE' ? 0 : value(50) * Math.PI / 180;
      let sweep = type === 'CIRCLE' ? 2 * Math.PI : (value(51) - value(50)) * Math.PI / 180;
      if (sweep <= 0) sweep += Math.PI * 2;
      const count = Math.max(12, Math.ceil(sweep * radius * scale / .35));
      if (count > maxSegments) throw new Error('DXF arc size exceeds the preview limit. Check the drawing units.');
      paths.push(Array.from({length: count + 1}, (_, i) => [value(10) + radius * Math.cos(start + sweep * i / count), value(20) + radius * Math.sin(start + sweep * i / count)]));
    } else if (type === 'LWPOLYLINE') {
      if (data.some(([key, entry]) => key === 42 && Math.abs(Number(entry)) > 1e-8)) throw new Error('Explode bulged DXF polylines into LINE/ARC entities before loading.');
      const points = [];
      for (let i = 0; i < data.length; i++) if (data[i][0] === 10) {
        if (data[i + 1]?.[0] !== 20) throw new Error('Malformed DXF vertex.');
        points.push([Number(data[i][1]), Number(data[i + 1][1])]);
      }
      if (value(70) & 1 && points.length) points.push([...points[0]]);
      paths.push(points);
    } else if (type === 'POLYLINE') {
      if (polyline || value(70) & (2 | 4 | 8 | 16 | 64)) throw new Error('Export a straight 2D DXF polyline.');
      polyline = {points: [], closed: Boolean(value(70) & 1)};
    } else if (type === 'VERTEX' && polyline) {
      if (Math.abs(value(42)) > 1e-8) throw new Error('Explode bulged DXF polylines into LINE/ARC entities before loading.');
      polyline.points.push([value(10), value(20)]);
    } else if (type === 'SEQEND' && polyline) {
      if (polyline.closed && polyline.points.length) polyline.points.push([...polyline.points[0]]);
      paths.push(polyline.points);
      polyline = null;
    } else throw new Error(`DXF entity ${type} is unsupported. Explode blocks, outline text and export LINE, ARC, CIRCLE or 2D POLYLINE entities.`);
    index = end - 1;
  }
  if (polyline) throw new Error('The DXF polyline is missing its SEQEND record.');
  return pathsToLaserJob(paths.map(path => path.map(point => point.map(value => value * scale))), {warnings: unitCode === 0 ? ['DXF has no declared units. Coordinates are interpreted as millimeters.'] : []});
}

export function jobSystem(system, job, material = 'acrylic') {
  const printer = system.id === 'printer', stock = laserMaterials[material];
  const params = printer ? [
    parameter('speed', 'Feed override', '%', 25, 200, 5, 100, 'Multiplies all programmed move feeds. Acceleration and firmware limits are omitted.'),
    parameter('flow', 'Extrusion override', '%', 75, 125, 1, 100, 'Scales deposited filament. Geometry follows the original sliced paths.'),
    parameter('temp', 'Nozzle temperature', '°C', 180, 250, 1, job.nozzle, 'Uniform temperature override for the sensible-heating estimate.')
  ] : [
    parameter('power', 'Optical power', 'W', 5, 120, 1, 60, 'Assumed delivered optical power. The machine is rated at 120 W.'),
    parameter('speed', 'Cut speed', 'mm/s', 2, 100, .5, 12, 'Constant vector-cut feed. Machine percentage settings require calibration.'),
    parameter('thick', 'Sheet thickness', 'mm', .5, 10, .05, 3.175, 'Thickness of the stock. The example begins at 1/8 inch.'),
    parameter('kerf', 'Assumed kerf', 'mm', .08, .4, .01, .15, 'Width of removed material in the energy estimate.')
  ];
  const lesson = printer ? {
    claim: 'The sliced path connects print time, material use and heater demand.',
    problem: 'Replay an Ender-3 toolpath and compare faster feeds with a hotend power budget.',
    boundary: 'Hotend at the path’s peak extrusion rate', balance: 'Pheater = ṁpeak cₚΔT + Q̇loss',
    kind: 'Peak hotend power', unit: 'W', sweep: ['speed', 2],
    criterion: {metric: 2, sense: 'max', target: 40, label: 'Assumed hotend power budget'},
    roles: {speed: 'Operating condition', flow: 'Operating condition', temp: 'Operating condition'},
    interpretation: 'The G-code determines path length, feed and extrusion. Feed override changes nominal motion time and peak heating rate. Heat-up, acceleration and firmware speed limits add time beyond this estimate.'
  } : {
    claim: 'The same cutting path requires different energy for each material.',
    problem: 'Compare job time and an assumed removal-energy budget on the Epilog Fusion Pro.',
    boundary: 'Beam and sheet during a constant-feed cut', balance: 'Poptical = Pabsorbed + Punabsorbed',
    kind: 'Optical power', unit: 'W', sweep: ['speed', 2],
    criterion: {metric: 2, sense: 'min', target: 1, label: 'Absorbed power / removal demand'},
    roles: {power: 'Operating condition', speed: 'Operating condition', thick: 'Geometry', kerf: 'Model assumption'},
    interpretation: 'Time follows the imported vector length. The energy ratio compares assumed absorption with effective material-removal energy. Material variability, charring, focus, fumes and edge quality require physical process knowledge.'
  };
  return {
    ...system, job, material: printer ? null : material, params, lesson,
    title: printer ? 'Ender-3 printer' : 'Epilog laser cutter',
    assumptions: printer
      ? 'Ender-3 envelope 220 × 220 × 250 mm, 1.75 mm PLA. Density 1,240 kg/m³, heat capacity 1,800 J/(kg·K), filament enters at 25 °C. Ambient hotend loss assumed 0.08 W/K. The 40 W hotend budget is an instructional assumption. Sensible heat only. Time includes programmed feeds, retractions and G4 dwells. Heating, homing, acceleration, firmware limits and operator pauses are excluded. Extrusion override changes material and heating estimates along the existing sliced path.'
      : `${stock.label}. Assumed absorption ${fmt(stock.absorption * 100)}%, effective removal energy ${stock.energy} J/mm³. These are illustrative classroom constants. The optical-power input is a physical estimate in watts. Vector length and constant cut feed determine on-time. Travel assumes 300 mm/s. All visible outlines are cut once in document order. The model excludes raster engraving, controller path optimization, acceleration, thermal diffusion and actual material qualification. TechSpark requires 24-105 training and approved stock.`,
    prompt: printer ? 'Double feed override. Compare estimated duration, peak hotend demand and deposited material. Then change extrusion override and explain the difference.' : 'Keep the drawing and thickness fixed. Compare acrylic and plywood, then change speed. Explain the tradeoff between job time and absorbed energy per millimeter.',
    calc(p) {
      if (printer) {
        const factor = p.speed / 100, volume = job.filament * filamentArea * p.flow / 100;
        const peak = job.peakFilamentRate * filamentArea * factor * p.flow / 100;
        const sensible = peak * 1e-9 * 1240 * 1800 * (p.temp - 25);
        const duration = job.motionSeconds / factor + job.dwellSeconds, loss = .08 * (p.temp - 25);
        return {metrics: [
          metric('Peak material flow', peak, 'mm³/s'), metric('Peak sensible heating', sensible, 'W'),
          metric('Peak hotend demand', sensible + loss, 'W'), metric('Nominal motion time', duration / 60, 'min')
        ], equations: [
          equation('Filament to deposited material', 'V = πd² Lfilament fextrusion / 4', `${fmt(job.filament)} mm × ${fmt(filamentArea,3)} mm² × ${p.flow / 100} = ${fmt(volume / 1000)} cm³ ≈ ${fmt(volume * .00124)} g PLA`),
          equation('Programmed motion time', 't = Σ(Lsegment / vsegment) / ffeed + tdwell', `${fmt(job.motionSeconds)} s ÷ ${factor} + ${fmt(job.dwellSeconds)} s = ${fmt(duration / 60)} min`),
          equation('Peak hotend power', 'P = ρ Q̇peak cₚ (Tnozzle − Tin) + Q̇loss', `${fmt(sensible)} W sensible heating + ${fmt(loss)} W assumed loss = ${fmt(sensible + loss)} W`)
        ]};
      }
      const absorbed = stock.absorption * p.power, demand = p.speed * p.thick * p.kerf * stock.energy;
      return {metrics: [
        metric('Absorbed line energy', absorbed / p.speed, 'J/mm'), metric('Removal demand', demand, 'W'),
        metric('Budget / demand', absorbed / demand, '×'), metric('Nominal job time', (job.cutLength / p.speed + job.travelLength / 300) / 60, 'min')
      ], equations: [
        equation('Cut time', 'tcut = Lcut / vcut', `${fmt(job.cutLength)} mm ÷ ${p.speed} mm/s = ${fmt(job.cutLength / p.speed)} s, plus ${fmt(job.travelLength / 300)} s travel`),
        equation('Absorbed line energy', 'Eline = αP / v', `${stock.absorption} × ${p.power} W ÷ ${p.speed} mm/s = ${fmt(absorbed / p.speed)} J/mm`),
        equation('Material removal budget', 'Premoval = v h kerf eremoval', `${p.speed} × ${p.thick} × ${p.kerf} × ${stock.energy} = ${fmt(demand)} W`)
      ]};
    },
    account(p, r) {
      const input = [{label: printer ? 'Hotend demand' : 'Incident optical power', value: printer ? r.metrics[2].value : p.power}];
      const output = printer
        ? [{label: 'Peak filament heating', value: r.metrics[1].value}, {label: 'Assumed hotend loss', value: .08 * (p.temp - 25)}]
        : [{label: 'Absorbed by stock', value: stock.absorption * p.power}, {label: 'Unabsorbed', value: (1 - stock.absorption) * p.power}];
      return {...lesson, input, output, total: input[0].value, residual: input[0].value - output.reduce((sum, term) => sum + term.value, 0), valid: job.fits, validity: job.fits ? 'Within the selected machine envelope.' : 'The deposition or cut extends outside the selected machine envelope. Check the drawing origin and dimensions.'};
    }
  };
}

export function jobTimeline(job, p) {
  const factor = p.speed / 100;
  let elapsed = 0, variableEnd = 0, fixedEnd = 0;
  return job.segments.map(segment => {
    const seconds = job.kind === 'printer' ? (segment.seconds || 0) / factor + (segment.dwell || 0) : segment.length / (segment.active ? p.speed : 300);
    variableEnd += job.kind === 'printer' ? (segment.seconds || 0) : segment.active ? segment.length : 0;
    fixedEnd += job.kind === 'printer' ? (segment.dwell || 0) : segment.active ? 0 : segment.length / 300;
    const start = elapsed;
    elapsed += seconds;
    return {start, end: elapsed, variableEnd, fixedEnd};
  });
}
