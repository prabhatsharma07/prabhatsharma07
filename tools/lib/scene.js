const {
  el,
  rect,
  circle,
  ellipse,
  path,
  group,
  label,
  card,
  roundRect,
  textWidth,
  loop,
  loopTransform,
  increasing,
  randomizer,
  EASE_IN_OUT,
} = require('./svg');

const DEFAULT_BLOBS = (theme) => [
  { color: theme.cyan, x: 0.16, y: 0.26, size: 0.5, dur: 27 },
  { color: theme.violet, x: 0.52, y: 0.72, size: 0.55, dur: 34 },
  { color: theme.magenta, x: 0.84, y: 0.2, size: 0.44, dur: 41 },
  { color: theme.green, x: 0.72, y: 0.86, size: 0.34, dur: 23 },
];

function aurora(theme, { width, height, seed, blobs }) {
  const random = randomizer(seed);
  const shapes = blobs || DEFAULT_BLOBS(theme);

  const defs =
    shapes
      .map((blob, index) =>
        el(
          'radialGradient',
          { id: `aurora${index}` },
          [
            [0, 0.85],
            [55, 0.28],
            [100, 0],
          ]
            .map(([offset, opacity]) =>
              el('stop', { offset: `${offset}%`, 'stop-color': blob.color, 'stop-opacity': opacity })
            )
            .join('')
        )
      )
      .join('') +
    el(
      'filter',
      { id: 'auroraBlur', x: '-40%', y: '-40%', width: '180%', height: '180%' },
      el('feGaussianBlur', { stdDeviation: Math.round(Math.min(width, height) * 0.06) })
    );

  const body = group(
    { filter: 'url(#auroraBlur)', opacity: theme.aurora },
    shapes
      .map((blob, index) => {
        const radius = blob.size * Math.min(width, height) * 1.5;
        const dx = 18 + random() * 34;
        const dy = 12 + random() * 26;
        return ellipse(
          {
            cx: blob.x * width,
            cy: blob.y * height,
            rx: radius,
            ry: radius * 0.78,
            fill: `url(#aurora${index})`,
          },
          loopTransform(
            'translate',
            ['0 0', `${dx.toFixed(1)} ${(-dy).toFixed(1)}`, `${(-dx * 0.7).toFixed(1)} ${(dy * 0.6).toFixed(1)}`, '0 0'],
            { dur: blob.dur, keyTimes: [0, 0.33, 0.66, 1], ease: EASE_IN_OUT }
          )
        );
      })
      .join('')
  );

  return { defs, body };
}

function grid(theme, { width, height, step }) {
  const defs =
    el(
      'pattern',
      { id: 'gridPattern', width: step, height: step, patternUnits: 'userSpaceOnUse' },
      path({ d: `M${step},0 V${step} H0`, stroke: theme.line, 'stroke-width': 1, fill: 'none' })
    ) +
    el(
      'radialGradient',
      { id: 'gridFade', cx: '50%', cy: '46%', r: '72%' },
      [
        [0, 0.9],
        [60, 0.35],
        [100, 0],
      ]
        .map(([offset, opacity]) =>
          el('stop', { offset: `${offset}%`, 'stop-color': '#fff', 'stop-opacity': opacity })
        )
        .join('')
    ) +
    el('mask', { id: 'gridMask' }, rect({ width, height, fill: 'url(#gridFade)' }));

  const body = rect({
    width,
    height,
    fill: 'url(#gridPattern)',
    mask: 'url(#gridMask)',
    opacity: theme.gridLines,
  });

  return { defs, body };
}

function starfield(theme, { width, height, count, seed }) {
  const random = randomizer(seed);
  const stars = Array.from({ length: count }, () => {
    const x = random() * width;
    const y = random() * height;
    const radius = 0.6 + random() * 1.5;
    const color = theme.starColors[Math.floor(random() * theme.starColors.length)];
    const dur = 3 + random() * 6;
    const begin = random() * dur;
    const peak = 0.25 + random() * 0.6;
    return circle(
      { cx: x, cy: y, r: radius, fill: color },
      loop('opacity', [0.05, peak, 0.05], { dur, begin, keyTimes: [0, 0.5, 1], ease: '.4 0 .6 1' })
    );
  });

  return group({ opacity: theme.stars }, stars.join(''));
}

function corners(theme, { width, height, inset = 16, length = 13 }) {
  const marks = [
    `M${inset},${inset + length} V${inset} H${inset + length}`,
    `M${width - inset - length},${inset} H${width - inset} V${inset + length}`,
    `M${width - inset},${height - inset - length} V${height - inset} H${width - inset - length}`,
    `M${inset + length},${height - inset} H${inset} V${height - inset - length}`,
  ];
  return group(
    { stroke: theme.textFaint, 'stroke-width': 1, fill: 'none', opacity: 0.5 },
    marks.map((d) => path({ d })).join('')
  );
}

function backdrop(theme, { width, height, radius = 22, seed, gridStep = 34, blobs }) {
  const glow = aurora(theme, { width, height, seed, blobs });
  const lines = grid(theme, { width, height, step: gridStep });

  const defs =
    glow.defs +
    lines.defs +
    el(
      'linearGradient',
      { id: 'plate', x1: '0', y1: '0', x2: '0.35', y2: '1' },
      el('stop', { offset: '0%', 'stop-color': theme.bg }) +
        el('stop', { offset: '100%', 'stop-color': theme.bgDeep })
    ) +
    el(
      'radialGradient',
      { id: 'vignette', cx: '50%', cy: '45%', r: '78%' },
      el('stop', { offset: '55%', 'stop-color': theme.bgDeep, 'stop-opacity': 0 }) +
        el('stop', { offset: '100%', 'stop-color': theme.bgDeep, 'stop-opacity': theme.vignette })
    ) +
    el('clipPath', { id: 'plateClip' }, path({ d: roundRect(0, 0, width, height, radius) }));

  const body = group(
    { 'clip-path': 'url(#plateClip)' },
    rect({ width, height, fill: 'url(#plate)' }) +
      glow.body +
      lines.body +
      rect({ width, height, fill: 'url(#vignette)' })
  );

  const frame = path({
    d: roundRect(0.5, 0.5, width - 1, height - 1, radius),
    stroke: theme.line,
    'stroke-width': 1,
    fill: 'none',
  });

  return { defs, body, frame, clip: 'url(#plateClip)' };
}

function pill(theme, { x, y, w, h, text, size, tracking, dot, blinkDur = 2.4 }) {
  const middle = y + h / 2;
  return (
    card({
      x,
      y,
      w,
      h,
      r: h / 2,
      fill: theme.surface,
      fillOpacity: theme.surfaceFill,
      stroke: theme.line,
    }) +
    circle(
      { cx: x + 17, cy: middle, r: 3.3, fill: dot },
      loop('opacity', [1, 0.3, 1], { dur: blinkDur })
    ) +
    label(text, { x: x + 30, y: middle + 4, size, tracking, fill: theme.textDim })
  );
}

const pillWidth = (text, size, tracking) => 44 + textWidth(text, size, tracking);

function typewriter(theme, { x, y, phrases, size, color, caret, period = 4.4 }) {
  const typeIn = 1.15;
  const erase = 0.45;
  const tracking = 0.02;
  const total = phrases.length * period;

  const clips = [];
  const lines = [];
  const caretStops = [];
  const caretTimes = [];

  phrases.forEach((phrase, index) => {
    const width = textWidth(phrase, size, tracking);
    const start = index * period;
    const marks = increasing([
      0,
      start / total,
      (start + typeIn) / total,
      (start + period - erase - 0.15) / total,
      (start + period - 0.15) / total,
      1,
    ]);

    clips.push(
      el(
        'clipPath',
        { id: `type${index}` },
        rect(
          { x, y: y - size, width: 0, height: size * 1.6 },
          loop('width', [0, 0, width, width, 0, 0], { dur: total, keyTimes: marks, mode: 'linear' })
        )
      )
    );

    lines.push(
      group(
        { 'clip-path': `url(#type${index})` },
        label(phrase, { x, y, size, tracking, fill: color })
      )
    );

    if (index === 0) {
      caretStops.push(x, x);
      caretTimes.push(marks[0], marks[1]);
    }
    caretStops.push(x + width, x + width, x, x);
    caretTimes.push(marks[2], marks[3], marks[4], marks[5]);
  });

  const cursor = rect(
    {
      x,
      y: y - size * 0.92,
      width: size * 0.58,
      height: size * 1.15,
      rx: 1,
      fill: caret,
      opacity: 0.9,
    },
    loop('x', caretStops, {
      dur: total,
      keyTimes: increasing(caretTimes).map((t) => Math.min(t, 1)),
      mode: 'linear',
    }) +
      loop('opacity', [0.95, 0.95, 0.05, 0.05], {
        dur: 1.06,
        keyTimes: [0, 0.49, 0.5, 1],
        mode: 'discrete',
      })
  );

  return { defs: clips.join(''), body: lines.join('') + cursor };
}

module.exports = { aurora, grid, starfield, corners, backdrop, pill, pillWidth, typewriter };
