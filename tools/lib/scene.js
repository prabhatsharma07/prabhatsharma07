// Shared visual language: aurora field, blueprint grid, starfield, panel chrome.
// Hero, stack board and activity dashboard all compose from these so the three
// images read as one designed system rather than three separate widgets.

const { tag, g, rng, n, roundedRect, esc } = require('./svg');

let uidCounter = 0;
const uid = (p) => `${p}${(uidCounter++).toString(36)}`;

/**
 * Heavily blurred colour blobs that drift on long, prime-ish durations so the
 * loop never visibly repeats.
 */
function aurora(t, { width, height, id = uid('au'), seed = 7, blobs }) {
  const rand = rng(seed);
  const set =
    blobs ||
    [
      { c: t.cyan, x: 0.16, y: 0.26, r: 0.5, dur: 27 },
      { c: t.violet, x: 0.52, y: 0.72, r: 0.55, dur: 34 },
      { c: t.magenta, x: 0.84, y: 0.2, r: 0.44, dur: 41 },
      { c: t.green, x: 0.72, y: 0.86, r: 0.34, dur: 23 },
    ];

  const defs = set
    .map((b, i) =>
      tag(
        'radialGradient',
        { id: `${id}g${i}` },
        tag('stop', { offset: '0%', 'stop-color': b.c, 'stop-opacity': 0.85 }) +
          tag('stop', { offset: '55%', 'stop-color': b.c, 'stop-opacity': 0.28 }) +
          tag('stop', { offset: '100%', 'stop-color': b.c, 'stop-opacity': 0 })
      )
    )
    .join('');

  const filter = tag(
    'filter',
    { id: `${id}b`, x: '-40%', y: '-40%', width: '180%', height: '180%' },
    tag('feGaussianBlur', { stdDeviation: Math.round(Math.min(width, height) * 0.06) })
  );

  const body = set
    .map((b, i) => {
      const cx = b.x * width;
      const cy = b.y * height;
      const r = b.r * Math.min(width, height) * 1.5;
      const dx = (18 + rand() * 34).toFixed(1);
      const dy = (12 + rand() * 26).toFixed(1);
      return tag(
        'ellipse',
        { cx: n(cx), cy: n(cy), rx: n(r), ry: n(r * 0.78), fill: `url(#${id}g${i})` },
        tag('animateTransform', {
          attributeName: 'transform',
          type: 'translate',
          values: `0 0; ${dx} ${-dy}; ${-dx * 0.7} ${dy * 0.6}; 0 0`,
          dur: `${b.dur}s`,
          repeatCount: 'indefinite',
          calcMode: 'spline',
          keyTimes: '0;0.33;0.66;1',
          keySplines: '.42 0 .58 1;.42 0 .58 1;.42 0 .58 1',
        })
      );
    })
    .join('');

  return {
    defs: defs + filter,
    body: g({ filter: `url(#${id}b)`, opacity: t.auroraOpacity }, body),
  };
}

/** Blueprint grid, faded out towards the edges by a radial mask. */
function grid(t, { width, height, step = 34, id = uid('gr'), opacity = 1 }) {
  const defs =
    tag(
      'pattern',
      { id: `${id}p`, width: step, height: step, patternUnits: 'userSpaceOnUse' },
      tag('path', {
        d: `M${step},0 V${step} H0`,
        stroke: t.line,
        'stroke-width': 1,
        fill: 'none',
      })
    ) +
    tag(
      'radialGradient',
      { id: `${id}m`, cx: '50%', cy: '46%', r: '72%' },
      tag('stop', { offset: '0%', 'stop-color': '#fff', 'stop-opacity': 0.9 }) +
        tag('stop', { offset: '60%', 'stop-color': '#fff', 'stop-opacity': 0.35 }) +
        tag('stop', { offset: '100%', 'stop-color': '#fff', 'stop-opacity': 0 })
    ) +
    tag(
      'mask',
      { id: `${id}k` },
      tag('rect', { width, height, fill: `url(#${id}m)` })
    );

  return {
    defs,
    body: tag('rect', {
      width,
      height,
      fill: `url(#${id}p)`,
      mask: `url(#${id}k)`,
      opacity: t.gridOpacity * opacity,
    }),
  };
}

/** Seeded twinkling starfield. Deterministic for byte-stable regeneration. */
function starfield(t, { width, height, count = 70, seed = 11, colors }) {
  const rand = rng(seed);
  const palette = colors || t.starColors || [t.cyan, t.violet, t.magenta, t.text];
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const r = 0.6 + rand() * 1.5;
    const c = palette[Math.floor(rand() * palette.length)];
    const dur = 3 + rand() * 6;
    const begin = rand() * dur;
    const peak = 0.25 + rand() * 0.6;
    out += tag(
      'circle',
      { cx: n(x), cy: n(y), r: n(r), fill: c },
      tag('animate', {
        attributeName: 'opacity',
        values: `0.05;${n(peak)};0.05`,
        dur: `${n(dur)}s`,
        begin: `${n(begin)}s`,
        repeatCount: 'indefinite',
        calcMode: 'spline',
        keyTimes: '0;0.5;1',
        keySplines: '.4 0 .6 1;.4 0 .6 1',
      })
    );
  }
  return g({ opacity: t.starOpacity }, out);
}

/** L-shaped registration marks in each corner — engineering-drawing detail. */
function cornerMarks(t, { width, height, inset = 18, len = 14, stroke }) {
  const c = stroke || t.textFaint;
  const a = inset;
  const marks = [
    `M${a},${a + len} V${a} H${a + len}`,
    `M${width - a - len},${a} H${width - a} V${a + len}`,
    `M${width - a},${height - a - len} V${height - a} H${width - a - len}`,
    `M${a + len},${height - a} H${a} V${height - a - len}`,
  ];
  return g(
    { stroke: c, 'stroke-width': 1, fill: 'none', opacity: 0.5 },
    marks.map((d) => tag('path', { d })).join('')
  );
}

/** Base plate every image sits on: deep fill, aurora, grid, vignette, border. */
function backdrop(t, { width, height, radius = 20, seed = 7, gridStep = 34, blobs }) {
  const id = uid('bd');
  const au = aurora(t, { width, height, seed, blobs });
  const gr = grid(t, { width, height, step: gridStep });

  const defs =
    au.defs +
    gr.defs +
    tag(
      'linearGradient',
      { id: `${id}base`, x1: '0', y1: '0', x2: '0.35', y2: '1' },
      tag('stop', { offset: '0%', 'stop-color': t.bg }) +
        tag('stop', { offset: '100%', 'stop-color': t.bgDeep })
    ) +
    tag(
      'radialGradient',
      { id: `${id}vig`, cx: '50%', cy: '45%', r: '78%' },
      tag('stop', { offset: '55%', 'stop-color': t.bgDeep, 'stop-opacity': 0 }) +
        tag('stop', {
          offset: '100%',
          'stop-color': t.bgDeep,
          'stop-opacity': t.name === 'dark' ? 0.85 : 0.4,
        })
    ) +
    tag(
      'clipPath',
      { id: `${id}clip` },
      tag('path', { d: roundedRect(0, 0, width, height, radius) })
    );

  const body = g(
    { 'clip-path': `url(#${id}clip)` },
    tag('rect', { width, height, fill: `url(#${id}base)` }) +
      au.body +
      gr.body +
      tag('rect', { width, height, fill: `url(#${id}vig)` })
  );

  const frame = tag('path', {
    d: roundedRect(0.5, 0.5, width - 1, height - 1, radius),
    stroke: t.line,
    'stroke-width': 1,
    fill: 'none',
  });

  return { defs, body, frame, clip: `url(#${id}clip)` };
}

/** Inset panel used for stat readouts and section blocks. */
function panel(t, { x, y, w, h, radius = 12, fill, stroke, opacity = 1 }) {
  return g(
    { opacity },
    tag('path', {
      d: roundedRect(x, y, w, h, radius),
      fill: fill || t.surface,
      'fill-opacity': t.name === 'dark' ? 0.55 : 0.75,
    }) +
      tag('path', {
        d: roundedRect(x + 0.5, y + 0.5, w - 1, h - 1, radius),
        stroke: stroke || t.line,
        'stroke-width': 1,
        fill: 'none',
      })
  );
}

/**
 * A terminal-style typewriter that cycles phrases. Uses a clip rect whose width
 * animates, which is why the phrases must be set in a monospace stack — the
 * advance width has to be predictable without measuring the real font.
 */
function typewriter(t, {
  x,
  y,
  phrases,
  size = 17,
  color,
  caretColor,
  perPhrase = 4.2,
  typeIn = 1.15,
  erase = 0.45,
  font,
  id = uid('tw'),
}) {
  const { monoWidth } = require('./svg');
  const total = phrases.length * perPhrase;
  const col = color || t.textDim;
  const caretCol = caretColor || t.cyan;

  let defs = '';
  let body = '';
  let caretVals = [];
  let caretTimes = [];

  const EPS = 0.0008;
  phrases.forEach((phrase, i) => {
    const w = monoWidth(phrase, size);
    const s = i * perPhrase;
    const holdEnd = s + perPhrase - erase - 0.15;
    const eraseEnd = s + perPhrase - 0.15;

    const times = [0, s / total, (s + typeIn) / total, holdEnd / total, eraseEnd / total, 1];
    // keyTimes must be strictly increasing; nudge duplicates at the seams.
    for (let k = 1; k < times.length; k++) {
      if (times[k] <= times[k - 1]) times[k] = times[k - 1] + EPS;
    }
    const values = [0, 0, w, w, 0, 0];

    defs += tag(
      'clipPath',
      { id: `${id}c${i}` },
      tag(
        'rect',
        { x: n(x), y: n(y - size), width: '0', height: n(size * 1.6) },
        tag('animate', {
          attributeName: 'width',
          values: values.map(n).join(';'),
          keyTimes: times.map((v) => v.toFixed(5)).join(';'),
          dur: `${n(total)}s`,
          repeatCount: 'indefinite',
          calcMode: 'linear',
        })
      )
    );

    body += g(
      { 'clip-path': `url(#${id}c${i})` },
      tag(
        'text',
        {
          x: n(x),
          y: n(y),
          fill: col,
          'font-family': font,
          'font-size': size,
          'letter-spacing': '0.02em',
        },
        esc(phrase)
      )
    );

    if (i === 0) {
      caretVals.push(x, x);
      caretTimes.push(0, times[1]);
    }
    caretVals.push(x + w, x + w, x, x);
    caretTimes.push(times[2], times[3], times[4], times[5]);
  });

  // Collapse the caret schedule into a strictly increasing series.
  const ct = [];
  caretTimes.forEach((v, i) => ct.push(i === 0 ? v : Math.max(v, ct[i - 1] + EPS)));

  const caret = tag(
    'rect',
    {
      x: n(x),
      y: n(y - size * 0.92),
      width: n(size * 0.58),
      height: n(size * 1.15),
      fill: caretCol,
      opacity: 0.9,
      rx: 1,
    },
    tag('animate', {
      attributeName: 'x',
      values: caretVals.map(n).join(';'),
      keyTimes: ct.map((v) => Math.min(v, 1).toFixed(5)).join(';'),
      dur: `${n(total)}s`,
      repeatCount: 'indefinite',
      calcMode: 'linear',
    }) +
      tag('animate', {
        attributeName: 'opacity',
        values: '0.95;0.95;0.05;0.05',
        keyTimes: '0;0.49;0.5;1',
        dur: '1.06s',
        repeatCount: 'indefinite',
        calcMode: 'discrete',
      })
  );

  return { defs, body: body + caret };
}

module.exports = { aurora, grid, starfield, cornerMarks, backdrop, panel, typewriter, uid };
