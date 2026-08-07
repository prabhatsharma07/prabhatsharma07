const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

const esc = (value) => String(value).replace(/[&<>"]/g, (char) => ESCAPES[char]);
const num = (value) => (typeof value === 'number' ? +value.toFixed(2) : value);
const seconds = (value) => `${num(value)}s`;

function el(name, props = {}, children = '') {
  const attrs = Object.entries(props)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => ` ${key}="${esc(num(value))}"`)
    .join('');
  return children ? `<${name}${attrs}>${children}</${name}>` : `<${name}${attrs}/>`;
}

const rect = (props, children) => el('rect', props, children);
const circle = (props, children) => el('circle', props, children);
const ellipse = (props, children) => el('ellipse', props, children);
const path = (props, children) => el('path', props, children);
const polygon = (props) => el('polygon', props);
const group = (props, children) => el('g', props, children);

const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const CHAR_WIDTH = 0.6;

const textWidth = (str, size, tracking = 0) => str.length * size * (CHAR_WIDTH + tracking);

const label = (str, { x, y, size = 12, fill, font = MONO, weight, tracking, anchor, opacity }) =>
  el(
    'text',
    {
      x,
      y,
      fill,
      opacity,
      'font-family': font,
      'font-size': size,
      'font-weight': weight,
      'letter-spacing': tracking ? `${tracking}em` : undefined,
      'text-anchor': anchor,
    },
    esc(str)
  );

function roundRect(x, y, w, h, r) {
  const [tl, tr, br, bl] = Array.isArray(r) ? r : [r, r, r, r];
  return [
    `M${num(x + tl)},${num(y)}`,
    `H${num(x + w - tr)}`,
    `A${num(tr)},${num(tr)} 0 0 1 ${num(x + w)},${num(y + tr)}`,
    `V${num(y + h - br)}`,
    `A${num(br)},${num(br)} 0 0 1 ${num(x + w - br)},${num(y + h)}`,
    `H${num(x + bl)}`,
    `A${num(bl)},${num(bl)} 0 0 1 ${num(x)},${num(y + h - bl)}`,
    `V${num(y + tl)}`,
    `A${num(tl)},${num(tl)} 0 0 1 ${num(x + tl)},${num(y)}`,
    'Z',
  ].join(' ');
}

const card = ({ x, y, w, h, r = 12, fill, fillOpacity, stroke, strokeOpacity }) =>
  (fill ? path({ d: roundRect(x, y, w, h, r), fill, 'fill-opacity': fillOpacity }) : '') +
  (stroke
    ? path({
        d: roundRect(x + 0.5, y + 0.5, w - 1, h - 1, r - 0.5),
        stroke,
        'stroke-opacity': strokeOpacity,
        'stroke-width': 1,
        fill: 'none',
      })
    : '');

const EASE_OUT = '.16 1 .3 1';
const EASE_IN_OUT = '.42 0 .58 1';

const animate = (attribute, props) => el('animate', { attributeName: attribute, ...props });

const animateTransform = (type, props) =>
  el('animateTransform', { attributeName: 'transform', attributeType: 'XML', type, ...props });

const fadeIn = ({ begin = 0, dur = 0.5, to = 1, ease }) =>
  animate('opacity', {
    from: 0,
    to,
    dur: seconds(dur),
    begin: seconds(begin),
    fill: 'freeze',
    calcMode: ease ? 'spline' : undefined,
    keyTimes: ease ? '0;1' : undefined,
    keySplines: ease,
  });

const rise = ({ begin = 0, dur = 0.6, from = 7 }) =>
  animateTransform('translate', {
    from: `0 ${num(from)}`,
    to: '0 0',
    dur: seconds(dur),
    begin: seconds(begin),
    fill: 'freeze',
    calcMode: 'spline',
    keyTimes: '0;1',
    keySplines: EASE_OUT,
  });

const spin = ({ cx, cy, dur, dir = 1 }) =>
  animateTransform('rotate', {
    from: `0 ${num(cx)} ${num(cy)}`,
    to: `${360 * dir} ${num(cx)} ${num(cy)}`,
    dur: seconds(dur),
    repeatCount: 'indefinite',
  });

const loop = (attribute, values, { dur, begin = 0, keyTimes, ease, mode }) =>
  animate(attribute, {
    values: values.map(num).join(';'),
    keyTimes: keyTimes && keyTimes.map(num).join(';'),
    dur: seconds(dur),
    begin: seconds(begin),
    repeatCount: 'indefinite',
    calcMode: mode || (ease ? 'spline' : undefined),
    keySplines: ease ? Array(values.length - 1).fill(ease).join(';') : undefined,
  });

const loopTransform = (type, values, { dur, begin = 0, keyTimes, ease }) =>
  animateTransform(type, {
    values: values.join(';'),
    keyTimes: keyTimes && keyTimes.map(num).join(';'),
    dur: seconds(dur),
    begin: seconds(begin),
    repeatCount: 'indefinite',
    calcMode: ease ? 'spline' : undefined,
    keySplines: ease ? Array(values.length - 1).fill(ease).join(';') : undefined,
  });

function increasing(times) {
  return times.reduce((out, time) => {
    const previous = out[out.length - 1];
    out.push(previous === undefined ? time : Math.max(time, previous + 0.0001));
    return out;
  }, []);
}

function randomizer(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const svgDocument = ({ width, height, title, desc, defs = '', body }) =>
  el(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: `0 0 ${width} ${height}`,
      width,
      height,
      role: 'img',
      fill: 'none',
    },
    (title ? el('title', {}, esc(title)) : '') +
      (desc ? el('desc', {}, esc(desc)) : '') +
      (defs ? el('defs', {}, defs) : '') +
      body
  ) + '\n';

module.exports = {
  esc,
  num,
  seconds,
  el,
  rect,
  circle,
  ellipse,
  path,
  polygon,
  group,
  MONO,
  SANS,
  textWidth,
  label,
  roundRect,
  card,
  EASE_OUT,
  EASE_IN_OUT,
  animate,
  animateTransform,
  fadeIn,
  rise,
  spin,
  loop,
  loopTransform,
  increasing,
  randomizer,
  svgDocument,
};
