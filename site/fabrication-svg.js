import {SVGLoader} from './vendor/SVGLoader.js';
import {maxSegments, pathsToLaserJob} from './fabrication.js?v=1.4.2';

function millimeters(length) {
  const match = String(length || '').trim().match(/^([+\-]?(?:\d+\.?\d*|\.\d+))\s*(mm|cm|in|px|pt|pc)?$/i);
  if (!match) throw new Error('Set an explicit SVG page width and height in millimeters or inches before exporting.');
  const factors = {mm: 1, cm: 10, in: 25.4, px: 25.4 / 96, pt: 25.4 / 72, pc: 25.4 / 6};
  const value = Number(match[1]) * factors[(match[2] || 'px').toLowerCase()];
  if (!(value > 0) || value > 50000) throw new Error('The SVG page dimensions are outside the supported range.');
  return value;
}

export function parseSVG(text) {
  const document = new DOMParser().parseFromString(text, 'image/svg+xml');
  if (document.querySelector('parsererror') || document.documentElement.localName !== 'svg') throw new Error('Choose a valid SVG vector drawing.');
  if (document.querySelector('script, foreignObject, image, text, use, clipPath, mask, svg svg')) {
    throw new Error('Export plain vector outlines. Outline text, expand clones and clipping, and remove raster images or embedded content.');
  }
  const linked = [...document.querySelectorAll('*')].some(node => [...node.attributes].some(attribute => attribute.localName === 'href'));
  if (linked || /@import|url\(\s*['"]?(?:https?:|data:|\/\/)/i.test(text)) throw new Error('Remove external resources from the SVG before loading.');
  const root = document.documentElement;
  const width = millimeters(root.getAttribute('width')), height = millimeters(root.getAttribute('height'));
  const viewBox = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number) || [0, 0, width * 96 / 25.4, height * 96 / 25.4];
  if (viewBox.length !== 4 || !viewBox.every(Number.isFinite) || viewBox[2] <= 0 || viewBox[3] <= 0) throw new Error('The SVG viewBox is invalid.');
  const [left, top, viewWidth, viewHeight] = viewBox;
  const preserve = root.getAttribute('preserveAspectRatio') || 'xMidYMid meet';
  const independent = preserve.trim() === 'none';
  const sharedScale = (preserve.includes('slice') ? Math.max : Math.min)(width / viewWidth, height / viewHeight);
  const sx = independent ? width / viewWidth : sharedScale, sy = independent ? height / viewHeight : sharedScale;
  const alignX = preserve.includes('xMin') ? 0 : preserve.includes('xMax') ? 1 : .5;
  const alignY = preserve.includes('YMin') ? 0 : preserve.includes('YMax') ? 1 : .5;
  const dx = independent ? 0 : (width - viewWidth * sx) * alignX, dy = independent ? 0 : (height - viewHeight * sy) * alignY;
  const loader = new SVGLoader();
  loader.defaultDPI = 96;
  const drawing = loader.parse(text), paths = [];
  let total = 0;
  for (const path of drawing.paths) {
    const style = path.userData.style;
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === 0) continue;
    if (style.fill === 'none' && style.stroke === 'none') continue;
    for (const subpath of path.subPaths) {
      const count = Math.max(2, Math.ceil(subpath.getLength() * Math.max(sx, sy) / .35));
      total += count;
      if (total > maxSegments) throw new Error('The SVG exceeds 300,000 preview segments. Simplify the drawing.');
      const points = subpath.getSpacedPoints(count).map(point => [(point.x - left) * sx + dx, (point.y - top) * sy + dy]);
      if (subpath.autoClose && points.length && points[0].some((value, index) => Math.abs(value - points.at(-1)[index]) > 1e-8)) points.push([...points[0]]);
      paths.push(points);
    }
  }
  return pathsToLaserJob(paths);
}
