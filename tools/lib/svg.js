// Minimal SVG authoring helpers. No dependencies on purpose: the refresh
// workflow should never need an `npm install` step.

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Deterministic PRNG (mulberry32). Every generated frame must be byte-identical
// for the same inputs, otherwise the refresh workflow commits noise every run.
function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Round to 2dp and drop trailing zeros, so the output diffs stay readable.
const n = (v) => {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
};

// Monospace advance width is a reliable 0.6em across the whole system stack,
// which is what makes chip auto-sizing safe without measuring real fonts.
const MONO_ADVANCE = 0.6;
const monoWidth = (text, size) => text.length * size * MONO_ADVANCE;

// letter-spacing adds its em value to every advance, including the last glyph.
// Needed whenever runs of text are laid out end to end by hand.
const monoWidthLS = (text, size, letterSpacingEm = 0) =>
  text.length * size * (MONO_ADVANCE + letterSpacingEm);

function attrs(o) {
  return Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${k}="${esc(v)}"`)
    .join(' ');
}

const tag = (name, o = {}, children = '') =>
  children === '' || children == null
    ? `<${name} ${attrs(o)}/>`
    : `<${name} ${attrs(o)}>${children}</${name}>`;

const g = (o, children) => tag('g', o, children);

function text(str, o = {}) {
  return tag('text', o, esc(str));
}

// A <style> block. GitHub serves README SVGs as images, so CSS inside the file
// is scoped to the image and cannot leak into the page.
const style = (css) => `<style>${css}</style>`;

function svgDoc({ width, height, children, defs = '', title, desc }) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" ` +
    `role="img" fill="none">` +
    (title ? `<title>${esc(title)}</title>` : '') +
    (desc ? `<desc>${esc(desc)}</desc>` : '') +
    (defs ? `<defs>${defs}</defs>` : '') +
    children +
    `</svg>\n`
  );
}

// Rounded-rect path with independent corner radii, for panels that need to
// merge into a neighbouring edge.
function roundedRect(x, y, w, h, r) {
  const [tl, tr, br, bl] = Array.isArray(r) ? r : [r, r, r, r];
  return (
    `M${n(x + tl)},${n(y)} H${n(x + w - tr)} A${n(tr)},${n(tr)} 0 0 1 ${n(x + w)},${n(y + tr)} ` +
    `V${n(y + h - br)} A${n(br)},${n(br)} 0 0 1 ${n(x + w - br)},${n(y + h)} ` +
    `H${n(x + bl)} A${n(bl)},${n(bl)} 0 0 1 ${n(x)},${n(y + h - bl)} ` +
    `V${n(y + tl)} A${n(tl)},${n(tl)} 0 0 1 ${n(x + tl)},${n(y)} Z`
  );
}

// Smooth open path through points (Catmull-Rom converted to cubic beziers).
function smoothPath(points, tension = 0.5) {
  if (points.length < 2) return '';
  let d = `M${n(points[0][0])},${n(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension * 2;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension * 2;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension * 2;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension * 2;
    d += ` C${n(c1x)},${n(c1y)} ${n(c2x)},${n(c2y)} ${n(p2[0])},${n(p2[1])}`;
  }
  return d;
}

// Orthogonal "circuit trace" from a to b: out, along, in — with mitred corners.
function tracePath(ax, ay, bx, by, midX, radius = 8) {
  const dirY = by > ay ? 1 : -1;
  const r = Math.min(radius, Math.abs(by - ay) / 2, Math.abs(midX - ax), Math.abs(bx - midX));
  if (r <= 0.5 || Math.abs(by - ay) < 1) return `M${n(ax)},${n(ay)} H${n(bx)}`;
  return (
    `M${n(ax)},${n(ay)} H${n(midX - r)} ` +
    `Q${n(midX)},${n(ay)} ${n(midX)},${n(ay + r * dirY)} ` +
    `V${n(by - r * dirY)} ` +
    `Q${n(midX)},${n(by)} ${n(midX + r)},${n(by)} ` +
    `H${n(bx)}`
  );
}

module.exports = {
  esc,
  rng,
  n,
  monoWidth,
  monoWidthLS,
  MONO_ADVANCE,
  attrs,
  tag,
  g,
  text,
  style,
  svgDoc,
  roundedRect,
  smoothPath,
  tracePath,
};
