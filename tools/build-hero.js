// Hero banner. Hand-composed, no external data — this is the one image that
// must look finished the instant the README lands.

const fs = require('fs');
const path = require('path');
const { themes, FONT_MONO, FONT_SANS } = require('./lib/theme');
const { svgDoc, tag, g, text, n, esc, roundedRect, rng, monoWidthLS } = require('./lib/svg');
const { backdrop, starfield, cornerMarks, typewriter } = require('./lib/scene');

const W = 1200;
const H = 410;

// Domains, each backed by tools the profile actually lists.
const DOMAINS = [
  { label: 'WEB PLATFORMS', key: 'cyan' },
  { label: 'CLOUD & INFRA', key: 'violet' },
  { label: 'DEVOPS & CI/CD', key: 'magenta' },
];

const NAME = 'Prabhat Sharma';
const EYEBROW = 'FULL-STACK DEVELOPER';
const HANDLE = 'github.com/prabhatsharma07';

// Every phrase is grounded in the stack the profile actually declares.
const PHRASES = [
  'building the whole stack, end to end',
  'TypeScript  ·  C#  ·  .NET  ·  Node.js',
  'AWS  ·  Azure  ·  GCP  ·  Kubernetes',
  'Docker  ·  Terraform  ·  GitHub Actions',
  'SQL Server  ·  MongoDB  ·  Redis  ·  GraphQL',
];

/** Rotating dashed ring. */
function ring(cx, cy, r, opts) {
  const { stroke, dash, width = 1, dur = 60, dir = 1, opacity = 1 } = opts;
  return tag(
    'circle',
    {
      cx,
      cy,
      r: n(r),
      stroke,
      'stroke-width': width,
      'stroke-dasharray': dash,
      'stroke-linecap': 'round',
      fill: 'none',
      opacity,
    },
    tag('animateTransform', {
      attributeName: 'transform',
      attributeType: 'XML',
      type: 'rotate',
      from: `0 ${cx} ${cy}`,
      to: `${360 * dir} ${cx} ${cy}`,
      dur: `${dur}s`,
      repeatCount: 'indefinite',
    })
  );
}

function monogram(t, cx, cy) {
  const id = 'mg';
  const defs =
    tag(
      'linearGradient',
      { id: `${id}stroke`, x1: '0', y1: '0', x2: '1', y2: '1' },
      tag('stop', { offset: '0%', 'stop-color': t.cyan }) +
        tag('stop', { offset: '50%', 'stop-color': t.violet }) +
        tag('stop', { offset: '100%', 'stop-color': t.magenta })
    ) +
    tag(
      'radialGradient',
      { id: `${id}core`, cx: '38%', cy: '32%', r: '80%' },
      tag('stop', { offset: '0%', 'stop-color': t.surfaceAlt, 'stop-opacity': 0.96 }) +
        tag('stop', { offset: '100%', 'stop-color': t.bgDeep, 'stop-opacity': 0.9 })
    ) +
    tag(
      'radialGradient',
      { id: `${id}halo`, cx: '50%', cy: '50%', r: '50%' },
      tag('stop', { offset: '55%', 'stop-color': t.violet, 'stop-opacity': 0 }) +
        tag('stop', { offset: '80%', 'stop-color': t.violet, 'stop-opacity': 0.22 }) +
        tag('stop', { offset: '100%', 'stop-color': t.cyan, 'stop-opacity': 0 })
    ) +
    tag(
      'linearGradient',
      { id: `${id}text`, x1: '0', y1: '0', x2: '0', y2: '1' },
      tag('stop', { offset: '0%', 'stop-color': t.text }) +
        tag('stop', { offset: '100%', 'stop-color': t.cyan })
    ) +
    tag(
      'linearGradient',
      { id: `${id}sweep`, x1: '0', y1: '0', x2: '1', y2: '0' },
      tag('stop', { offset: '0%', 'stop-color': t.cyan, 'stop-opacity': 0 }) +
        tag('stop', { offset: '100%', 'stop-color': t.cyan, 'stop-opacity': 0.9 })
    ) +
    // Annulus between the inner and outer rings.
    tag(
      'clipPath',
      { id: `${id}band` },
      // Inner circle is wound the opposite way so it punches a hole under both
      // nonzero and evenodd rules.
      tag('path', {
        'clip-rule': 'evenodd',
        'fill-rule': 'evenodd',
        d:
          `M${n(cx - 121)},${n(cy)} a121,121 0 1,0 242,0 a121,121 0 1,0 -242,0 Z ` +
          `M${n(cx - 81)},${n(cy)} a81,81 0 1,1 162,0 a81,81 0 1,1 -162,0 Z`,
      })
    );

  // Hexagon at r=60.
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${n(cx + Math.cos(a) * 62)},${n(cy + Math.sin(a) * 62)}`;
  }).join(' ');

  const orbit = (r, dur, dir, color, size) =>
    g(
      {},
      tag(
        'circle',
        { cx: n(cx + r), cy: n(cy), r: size, fill: color },
        tag('animateTransform', {
          attributeName: 'transform',
          attributeType: 'XML',
          type: 'rotate',
          from: `0 ${cx} ${cy}`,
          to: `${360 * dir} ${cx} ${cy}`,
          dur: `${dur}s`,
          repeatCount: 'indefinite',
        })
      )
    );

  const inner =
    tag('circle', { cx, cy, r: 150, fill: `url(#${id}halo)`, opacity: t.glow }) +
      // textFaint rather than line: on white, the line token is too pale to
      // hold the rings together.
      ring(cx, cy, 118, { stroke: t.textFaint, dash: '2 10', dur: 90, dir: 1, opacity: 0.45 }) +
      ring(cx, cy, 100, { stroke: `url(#${id}stroke)`, dash: '46 26', dur: 46, dir: -1, opacity: 0.9 }) +
      ring(cx, cy, 84, { stroke: t.textFaint, dash: '1 6', dur: 70, dir: 1, opacity: 0.4 }) +
      // Radar sweep, clipped to the ring band so it reads as light travelling
      // around the rings rather than a wedge poking out of the mark.
      g(
        { 'clip-path': `url(#${id}band)` },
        tag(
          'path',
          {
            d: `M${cx},${cy} L${n(cx + 130)},${n(cy - 52)} A140,140 0 0 1 ${n(cx + 130)},${n(cy + 52)} Z`,
            fill: `url(#${id}sweep)`,
            opacity: 0.5 * t.glow,
          },
          tag('animateTransform', {
            attributeName: 'transform',
            attributeType: 'XML',
            type: 'rotate',
            from: `0 ${cx} ${cy}`,
            to: `360 ${cx} ${cy}`,
            dur: '11s',
            repeatCount: 'indefinite',
          })
        )
      ) +
      tag('polygon', {
        points: hex,
        fill: `url(#${id}core)`,
        stroke: `url(#${id}stroke)`,
        'stroke-width': 1.4,
        'stroke-opacity': 0.8,
      }) +
      text('PS', {
        x: cx,
        y: n(cy + 15),
        fill: `url(#${id}text)`,
        'font-family': FONT_SANS,
        'font-size': 46,
        'font-weight': 700,
        'letter-spacing': '0.06em',
        'text-anchor': 'middle',
      }) +
    orbit(118, 34, 1, t.cyan, 3.4) +
    orbit(100, 46, -1, t.magenta, 2.6) +
    orbit(84, 28, 1, t.violet, 2.2);

  // Fade the whole mark in once on load.
  const body = g(
    { opacity: 0 },
    inner +
      tag('animate', {
        attributeName: 'opacity',
        from: 0,
        to: 1,
        dur: '1.4s',
        begin: '0.15s',
        fill: 'freeze',
        calcMode: 'spline',
        keyTimes: '0;1',
        keySplines: '.16 1 .3 1',
      })
  );

  return { defs, body };
}

function render(t) {
  const bd = backdrop(t, { width: W, height: H, radius: 22, seed: 7, gridStep: 36 });

  const nameGrad = tag(
    'linearGradient',
    {
      id: 'ng',
      gradientUnits: 'userSpaceOnUse',
      x1: 0,
      y1: 0,
      x2: 460,
      y2: 0,
      spreadMethod: 'repeat',
    },
    tag('stop', { offset: '0%', 'stop-color': t.cyan }) +
      tag('stop', { offset: '25%', 'stop-color': t.violet }) +
      tag('stop', { offset: '50%', 'stop-color': t.magenta }) +
      tag('stop', { offset: '75%', 'stop-color': t.violet }) +
      tag('stop', { offset: '100%', 'stop-color': t.cyan }) +
      tag('animateTransform', {
        attributeName: 'gradientTransform',
        type: 'translate',
        from: '0 0',
        to: '460 0',
        dur: '9s',
        repeatCount: 'indefinite',
      })
  );

  const ruleGrad = tag(
    'linearGradient',
    { id: 'rg', x1: '0', y1: '0', x2: '1', y2: '0' },
    tag('stop', { offset: '0%', 'stop-color': t.cyan, 'stop-opacity': 0.7 }) +
      tag('stop', { offset: '100%', 'stop-color': t.cyan, 'stop-opacity': 0 })
  );

  const X = 74;
  const tw = typewriter(t, {
    x: X + 26,
    y: 244,
    phrases: PHRASES,
    size: 19,
    font: FONT_MONO,
    color: t.textDim,
    caretColor: t.cyan,
    perPhrase: 4.4,
  });

  const mg = monogram(t, 972, 205);

  // Keep the starfield out of the text column so no dot ever lands on a glyph.
  const starMask =
    tag(
      'filter',
      { id: 'sm', x: '-20%', y: '-20%', width: '140%', height: '140%' },
      tag('feGaussianBlur', { stdDeviation: 26 })
    ) +
    tag(
      'mask',
      { id: 'starmask' },
      tag('rect', { width: W, height: H, fill: '#fff' }) +
        tag('rect', {
          x: 40,
          y: 70,
          width: 700,
          height: 300,
          rx: 40,
          fill: '#000',
          filter: 'url(#sm)',
        })
    );

  // Capability chips.
  let chipX = X;
  const chips = DOMAINS.map((d) => {
    // 30 leading (dot + gap) + measured text + 14 trailing.
    const w = 34 + monoWidthLS(d.label, 13.5, 0.16) + 16;
    const el = g(
      {},
      tag('path', {
        d: roundedRect(chipX, 288, w, 32, 16),
        fill: t.surface,
        'fill-opacity': t.name === 'dark' ? 0.5 : 0.8,
      }) +
        tag('path', {
          d: roundedRect(chipX + 0.5, 288.5, w - 1, 31, 15.5),
          stroke: t.line,
          'stroke-width': 1,
          fill: 'none',
        }) +
        tag(
          'circle',
          { cx: chipX + 17, cy: 304, r: 3.2, fill: t[d.key] },
          tag('animate', {
            attributeName: 'opacity',
            values: '1;0.35;1',
            dur: '2.8s',
            repeatCount: 'indefinite',
          })
        ) +
        text(d.label, {
          x: chipX + 30,
          y: 308,
          fill: t.textDim,
          'font-family': FONT_MONO,
          'font-size': 13.5,
          'letter-spacing': '0.16em',
        })
    );
    chipX += w + 12;
    return el;
  }).join('');

  const eyebrow = g(
    {},
    tag('rect', {
      x: X,
      y: 96,
      width: 7,
      height: 7,
      fill: t.cyan,
      transform: `rotate(45 ${X + 3.5} 99.5)`,
    }) +
      text(EYEBROW, {
        x: X + 20,
        y: 105,
        fill: t.textDim,
        'font-family': FONT_MONO,
        'font-size': 14,
        'font-weight': 500,
        'letter-spacing': '0.34em',
      })
  );

  const name = g(
    { opacity: 0, transform: 'translate(0 16)' },
    text(NAME, {
      x: X,
      y: 183,
      fill: 'url(#ng)',
      'font-family': FONT_SANS,
      'font-size': 72,
      'font-weight': 700,
      'letter-spacing': '-0.022em',
    }) +
      tag('animate', {
        attributeName: 'opacity',
        from: 0,
        to: 1,
        dur: '1s',
        begin: '0.1s',
        fill: 'freeze',
      }) +
      tag('animateTransform', {
        attributeName: 'transform',
        type: 'translate',
        from: '0 16',
        to: '0 0',
        dur: '1.1s',
        begin: '0.1s',
        fill: 'freeze',
        calcMode: 'spline',
        keyTimes: '0;1',
        keySplines: '.16 1 .3 1',
      })
  );

  const prompt = text('▸', {
    x: X,
    y: 244,
    fill: t.violet,
    'font-family': FONT_MONO,
    'font-size': 16,
  });

  const footer = g(
    {},
    tag('rect', { x: X, y: 348, width: 460, height: 1, fill: 'url(#rg)' }) +
      text(HANDLE, {
        x: X,
        y: 376,
        fill: t.textFaint,
        'font-family': FONT_MONO,
        'font-size': 14,
        'letter-spacing': '0.08em',
      })
  );

  const defs = bd.defs + mg.defs + tw.defs + nameGrad + ruleGrad + starMask;

  const children =
    bd.body +
    g(
      { 'clip-path': bd.clip, mask: 'url(#starmask)' },
      starfield(t, { width: W, height: H, count: 84, seed: 23 })
    ) +
    cornerMarks(t, { width: W, height: H, inset: 16, len: 13 }) +
    eyebrow +
    name +
    prompt +
    tw.body +
    chips +
    footer +
    mg.body +
    bd.frame;

  return svgDoc({
    width: W,
    height: H,
    defs,
    children,
    title: `${NAME} — ${EYEBROW}`,
    desc: 'Animated banner: aurora field, rotating monogram, and a terminal readout cycling through the stack.',
  });
}

function main() {
  const out = path.join(__dirname, '..', 'assets');
  fs.mkdirSync(out, { recursive: true });
  for (const key of ['dark', 'light']) {
    const file = path.join(out, `hero-${key}.svg`);
    fs.writeFileSync(file, render(themes[key]));
    console.log(`wrote ${path.relative(process.cwd(), file)}`);
  }
}

if (require.main === module) main();
module.exports = { render, W, H };
