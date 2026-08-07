const { themes } = require('./lib/theme');
const {
  el,
  rect,
  circle,
  path,
  polygon,
  group,
  label,
  card,
  textWidth,
  MONO,
  SANS,
  fadeIn,
  rise,
  spin,
  EASE_OUT,
  loopTransform,
  svgDocument,
} = require('./lib/svg');
const { backdrop, starfield, corners, pill, pillWidth, typewriter } = require('./lib/scene');
const { writeThemedAssets } = require('./lib/write');

const WIDTH = 1200;
const HEIGHT = 410;
const LEFT = 74;

const NAME = 'Prabhat Sharma';
const ROLE = 'FULL-STACK DEVELOPER';
const HANDLE = 'github.com/prabhatsharma07';

const PHRASES = [
  'building the whole stack, end to end',
  'TypeScript  ·  C#  ·  .NET  ·  Node.js',
  'AWS  ·  Azure  ·  GCP  ·  Kubernetes',
  'Docker  ·  Terraform  ·  GitHub Actions',
  'SQL Server  ·  MongoDB  ·  Redis  ·  GraphQL',
];

const DOMAINS = [
  { text: 'WEB PLATFORMS', accent: 'cyan' },
  { text: 'CLOUD & INFRA', accent: 'violet' },
  { text: 'DEVOPS & CI/CD', accent: 'magenta' },
];

const MARK = { x: 972, y: 205 };
const RINGS = [
  { r: 118, dash: '2 10', dur: 90, dir: 1, opacity: 0.45, stroke: 'textFaint' },
  { r: 100, dash: '46 26', dur: 46, dir: -1, opacity: 0.9, stroke: 'gradient' },
  { r: 84, dash: '1 6', dur: 70, dir: 1, opacity: 0.4, stroke: 'textFaint' },
];
const ORBITS = [
  { r: 118, dur: 34, dir: 1, accent: 'cyan', size: 3.4 },
  { r: 100, dur: 46, dir: -1, accent: 'magenta', size: 2.6 },
  { r: 84, dur: 28, dir: 1, accent: 'violet', size: 2.2 },
];

const stops = (pairs) =>
  pairs.map(([offset, color]) => el('stop', { offset: `${offset}%`, 'stop-color': color })).join('');

function gradients(theme) {
  const flowing = el(
    'linearGradient',
    {
      id: 'nameFlow',
      gradientUnits: 'userSpaceOnUse',
      x1: 0,
      y1: 0,
      x2: 460,
      y2: 0,
      spreadMethod: 'repeat',
    },
    stops([
      [0, theme.cyan],
      [25, theme.violet],
      [50, theme.magenta],
      [75, theme.violet],
      [100, theme.cyan],
    ]) +
      el('animateTransform', {
        attributeName: 'gradientTransform',
        type: 'translate',
        from: '0 0',
        to: '460 0',
        dur: '9s',
        repeatCount: 'indefinite',
      })
  );

  const rule = el(
    'linearGradient',
    { id: 'ruleFade', x1: '0', y1: '0', x2: '1', y2: '0' },
    el('stop', { offset: '0%', 'stop-color': theme.cyan, 'stop-opacity': 0.7 }) +
      el('stop', { offset: '100%', 'stop-color': theme.cyan, 'stop-opacity': 0 })
  );

  const markStroke = el(
    'linearGradient',
    { id: 'markStroke', x1: '0', y1: '0', x2: '1', y2: '1' },
    stops([
      [0, theme.cyan],
      [50, theme.violet],
      [100, theme.magenta],
    ])
  );

  const core = el(
    'radialGradient',
    { id: 'markCore', cx: '38%', cy: '32%', r: '80%' },
    el('stop', { offset: '0%', 'stop-color': theme.surfaceAlt, 'stop-opacity': 0.96 }) +
      el('stop', { offset: '100%', 'stop-color': theme.bgDeep, 'stop-opacity': 0.9 })
  );

  const halo = el(
    'radialGradient',
    { id: 'markHalo', cx: '50%', cy: '50%', r: '50%' },
    el('stop', { offset: '55%', 'stop-color': theme.violet, 'stop-opacity': 0 }) +
      el('stop', { offset: '80%', 'stop-color': theme.violet, 'stop-opacity': 0.22 }) +
      el('stop', { offset: '100%', 'stop-color': theme.cyan, 'stop-opacity': 0 })
  );

  const initials = el(
    'linearGradient',
    { id: 'markText', x1: '0', y1: '0', x2: '0', y2: '1' },
    stops([
      [0, theme.text],
      [100, theme.cyan],
    ])
  );

  const sweep = el(
    'linearGradient',
    { id: 'markSweep', x1: '0', y1: '0', x2: '1', y2: '0' },
    el('stop', { offset: '0%', 'stop-color': theme.cyan, 'stop-opacity': 0 }) +
      el('stop', { offset: '100%', 'stop-color': theme.cyan, 'stop-opacity': 0.9 })
  );

  const { x, y } = MARK;
  const band = el(
    'clipPath',
    { id: 'markBand' },
    path({
      'clip-rule': 'evenodd',
      'fill-rule': 'evenodd',
      d:
        `M${x - 121},${y} a121,121 0 1,0 242,0 a121,121 0 1,0 -242,0 Z ` +
        `M${x - 81},${y} a81,81 0 1,1 162,0 a81,81 0 1,1 -162,0 Z`,
    })
  );

  const starMask =
    el(
      'filter',
      { id: 'softEdge', x: '-20%', y: '-20%', width: '140%', height: '140%' },
      el('feGaussianBlur', { stdDeviation: 26 })
    ) +
    el(
      'mask',
      { id: 'starMask' },
      rect({ width: WIDTH, height: HEIGHT, fill: '#fff' }) +
        rect({ x: 40, y: 70, width: 700, height: 300, rx: 40, fill: '#000', filter: 'url(#softEdge)' })
    );

  return flowing + rule + markStroke + core + halo + initials + sweep + band + starMask;
}

function monogram(theme) {
  const { x, y } = MARK;

  const hexagon = Array.from({ length: 6 }, (unused, index) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    return `${(x + Math.cos(angle) * 62).toFixed(2)},${(y + Math.sin(angle) * 62).toFixed(2)}`;
  }).join(' ');

  const rings = RINGS.map(({ r, dash, dur, dir, opacity, stroke }) =>
    circle(
      {
        cx: x,
        cy: y,
        r,
        stroke: stroke === 'gradient' ? 'url(#markStroke)' : theme[stroke],
        'stroke-width': 1,
        'stroke-dasharray': dash,
        'stroke-linecap': 'round',
        fill: 'none',
        opacity,
      },
      spin({ cx: x, cy: y, dur, dir })
    )
  ).join('');

  const radar = group(
    { 'clip-path': 'url(#markBand)' },
    path(
      {
        d: `M${x},${y} L${x + 130},${y - 52} A140,140 0 0 1 ${x + 130},${y + 52} Z`,
        fill: 'url(#markSweep)',
        opacity: 0.5 * theme.glow,
      },
      spin({ cx: x, cy: y, dur: 11 })
    )
  );

  const orbits = ORBITS.map(({ r, dur, dir, accent, size }) =>
    group({}, circle({ cx: x + r, cy: y, r: size, fill: theme[accent] }, spin({ cx: x, cy: y, dur, dir })))
  ).join('');

  return group(
    { opacity: 0 },
    circle({ cx: x, cy: y, r: 150, fill: 'url(#markHalo)', opacity: theme.glow }) +
      rings +
      radar +
      polygon({
        points: hexagon,
        fill: 'url(#markCore)',
        stroke: 'url(#markStroke)',
        'stroke-width': 1.4,
        'stroke-opacity': 0.8,
      }) +
      label('PS', {
        x,
        y: y + 15,
        size: 46,
        font: SANS,
        weight: 700,
        tracking: 0.06,
        anchor: 'middle',
        fill: 'url(#markText)',
      }) +
      orbits +
      fadeIn({ begin: 0.15, dur: 1.4, ease: EASE_OUT })
  );
}

function eyebrow(theme) {
  return (
    rect({
      x: LEFT,
      y: 96,
      width: 7,
      height: 7,
      fill: theme.cyan,
      transform: `rotate(45 ${LEFT + 3.5} 99.5)`,
    }) +
    label(ROLE, { x: LEFT + 20, y: 105, size: 14, weight: 500, tracking: 0.34, fill: theme.textDim })
  );
}

function name() {
  return group(
    { opacity: 0, transform: 'translate(0 16)' },
    label(NAME, {
      x: LEFT,
      y: 183,
      size: 72,
      font: SANS,
      weight: 700,
      tracking: -0.022,
      fill: 'url(#nameFlow)',
    }) +
      fadeIn({ begin: 0.1, dur: 1 }) +
      rise({ begin: 0.1, dur: 1.1, from: 16 })
  );
}

function domains(theme) {
  let x = LEFT;
  return DOMAINS.map(({ text, accent }) => {
    const width = pillWidth(text, 13.5, 0.16);
    const chip = pill(theme, {
      x,
      y: 288,
      w: width,
      h: 32,
      text,
      size: 13.5,
      tracking: 0.16,
      dot: theme[accent],
      blinkDur: 2.8,
    });
    x += width + 12;
    return chip;
  }).join('');
}

function footer(theme) {
  return (
    rect({ x: LEFT, y: 348, width: 460, height: 1, fill: 'url(#ruleFade)' }) +
    label(HANDLE, { x: LEFT, y: 376, size: 14, tracking: 0.08, fill: theme.textFaint })
  );
}

function render(theme) {
  const plate = backdrop(theme, { width: WIDTH, height: HEIGHT, seed: 7, gridStep: 36 });
  const typing = typewriter(theme, {
    x: LEFT + 26,
    y: 244,
    phrases: PHRASES,
    size: 19,
    color: theme.textDim,
    caret: theme.cyan,
  });

  return svgDocument({
    width: WIDTH,
    height: HEIGHT,
    title: `${NAME} — ${ROLE}`,
    desc: 'Animated banner: aurora field, rotating monogram, and a terminal readout cycling through the stack.',
    defs: plate.defs + gradients(theme) + typing.defs,
    body:
      plate.body +
      group(
        { 'clip-path': plate.clip, mask: 'url(#starMask)' },
        starfield(theme, { width: WIDTH, height: HEIGHT, count: 84, seed: 23 })
      ) +
      corners(theme, { width: WIDTH, height: HEIGHT }) +
      eyebrow(theme) +
      name() +
      label('▸', { x: LEFT, y: 244, size: 19, fill: theme.violet }) +
      typing.body +
      domains(theme) +
      footer(theme) +
      monogram(theme) +
      plate.frame,
  });
}

if (require.main === module) writeThemedAssets('hero', render);

module.exports = { render, WIDTH, HEIGHT };
