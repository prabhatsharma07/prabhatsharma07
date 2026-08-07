const {
  el,
  rect,
  path,
  group,
  label,
  card,
  textWidth,
  SANS,
  fadeIn,
  loop,
  svgDocument,
} = require('./lib/svg');
const { backdrop, corners, pill, pillWidth } = require('./lib/scene');
const { fetchProfile, LOGIN } = require('./lib/github');
const { writeThemedAssets } = require('./lib/write');

const WIDTH = 1200;
const HEIGHT = 502;
const PAD = 44;
const RIGHT = WIDTH - PAD;
const GRID_X = PAD + 38;
const GRID_Y = 262;
const LEGEND_Y = 430;
const SPARSE_LIMIT = 25;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const count = (value) => (value == null ? '—' : Number(value).toLocaleString('en-US'));

function blankYear(now) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - end.getUTCDay() - 52 * 7);

  const weeks = [];
  for (let week = 0; week < 53; week++) {
    const days = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + week * 7 + day);
      if (date > end) break;
      days.push({ date: date.toISOString().slice(0, 10), count: 0, weekday: day, level: 0 });
    }
    if (days.length) weeks.push(days);
  }
  return weeks;
}

function tile(theme, { x, y, w, h, name, value, caption, accent, delay }) {
  return (
    card({ x, y, w, h, fill: theme.surface, fillOpacity: theme.surfaceFill, stroke: theme.line }) +
    label(name, { x: x + 18, y: y + 27, size: 12.5, tracking: 0.2, fill: theme.textFaint }) +
    label(value, {
      x: x + 18,
      y: y + 68,
      size: 40,
      font: SANS,
      weight: 700,
      tracking: -0.01,
      fill: accent,
    }) +
    label(caption, { x: x + 18, y: y + 84, size: 12, tracking: 0.14, fill: theme.textFaint }) +
    rect(
      { x: x + 18, y: y + h - 8, width: 0, height: 2, rx: 1, fill: accent, opacity: 0.75 },
      el('animate', {
        attributeName: 'width',
        from: 0,
        to: w - 36,
        dur: '1.1s',
        begin: `${delay}s`,
        fill: 'freeze',
        calcMode: 'spline',
        keyTimes: '0;1',
        keySplines: '.16 1 .3 1',
      })
    )
  );
}

function tiles(theme, data) {
  const gap = 16;
  const width = (WIDTH - PAD * 2 - gap * 3) / 4;
  return [
    { name: 'CONTRIBUTIONS', value: data && count(data.total), caption: 'LAST 12 MONTHS', accent: theme.cyan },
    { name: 'CURRENT STREAK', value: data && count(data.currentStreak), caption: 'CONSECUTIVE DAYS', accent: theme.violet },
    { name: 'LONGEST STREAK', value: data && count(data.longestStreak), caption: 'CONSECUTIVE DAYS', accent: theme.magenta },
    {
      name: 'ACTIVE DAYS',
      value: data && count(data.activeDays),
      caption: `OF ${data ? data.trackedDays : 365} TRACKED`,
      accent: theme.green,
    },
  ]
    .map((spec, index) =>
      tile(theme, {
        ...spec,
        value: spec.value || '—',
        x: PAD + index * (width + gap),
        y: 106,
        w: width,
        h: 100,
        delay: 0.5 + index * 0.12,
      })
    )
    .join('');
}

function heatmap(theme, weeks) {
  const pitch = Math.min((RIGHT - GRID_X) / weeks.length, 150 / 7);
  const size = Math.max(6, pitch - 3.6);
  const radius = Math.max(2, size * 0.22);
  const gridWidth = weeks.length * pitch;

  const cells = [];
  const months = [];
  let lastMonth = -1;

  weeks.forEach((week, column) => {
    const x = GRID_X + column * pitch;
    const first = week[0];

    if (first && column < weeks.length - 1) {
      const month = Number(first.date.slice(5, 7)) - 1;
      if (month !== lastMonth && Number(first.date.slice(8, 10)) <= 7) {
        months.push(label(MONTHS[month], { x, y: GRID_Y - 12, size: 12, tracking: 0.1, fill: theme.textFaint }));
        lastMonth = month;
      }
    }

    for (const day of week) {
      cells.push(
        rect(
          {
            x,
            y: GRID_Y + day.weekday * pitch,
            width: size,
            height: size,
            rx: radius,
            fill: theme.heat[Math.min(4, Math.max(0, day.level))],
            opacity: 0,
          },
          fadeIn({
            begin: 0.45 + column * 0.013 + day.weekday * 0.02,
            to: day.level === 0 ? (theme.name === 'dark' ? 0.85 : 0.9) : 1,
          })
        )
      );
    }
  });

  const weekdays = [
    [1, 'Mon'],
    [3, 'Wed'],
    [5, 'Fri'],
  ].map(([row, name]) =>
    label(name, {
      x: GRID_X - 12,
      y: GRID_Y + row * pitch + size * 0.75,
      size: 12,
      anchor: 'end',
      fill: theme.textFaint,
    })
  );

  const sweep = group(
    { 'clip-path': 'url(#gridClip)' },
    rect(
      { x: GRID_X - 120, y: GRID_Y - 4, width: 120, height: 7 * pitch + 8, fill: 'url(#gridSweep)' },
      loop('x', [GRID_X - 140, GRID_X + gridWidth + 40], { dur: 9, begin: 2.6 })
    )
  );

  const clip = el(
    'clipPath',
    { id: 'gridClip' },
    rect({ x: GRID_X - 4, y: GRID_Y - 4, width: gridWidth + 8, height: 7 * pitch + 8 })
  );

  return { body: months.join('') + weekdays.join('') + cells.join('') + sweep, defs: clip };
}

function legend(theme) {
  const box = 11;
  const gap = 4;
  const swatches = theme.heat.length * (box + gap) - gap;
  const width = textWidth('Less', 12) + 10 + swatches + 10 + textWidth('More', 12);

  let x = RIGHT - width;
  const parts = [label('Less', { x, y: LEGEND_Y + 9, size: 12, fill: theme.textFaint })];

  x += textWidth('Less', 12) + 10;
  for (const shade of theme.heat) {
    parts.push(rect({ x, y: LEGEND_Y, width: box, height: box, rx: 2.6, fill: shade }));
    x += box + gap;
  }

  parts.push(label('More', { x: x + 6, y: LEGEND_Y + 9, size: 12, fill: theme.textFaint }));
  return parts.join('');
}

function lifetimeStrip(theme, lifetime) {
  const parts = [
    ['commits', lifetime.commits],
    ['pull requests', lifetime.pullRequests],
    ['reviews', lifetime.reviews],
    ['issues', lifetime.issues],
  ].filter(([, value]) => value > 0);

  const pieces = [
    label('SINCE 2020', {
      x: PAD,
      y: HEIGHT - 26,
      size: 12,
      weight: 600,
      tracking: 0.2,
      fill: theme.textDim,
    }),
  ];

  let x = PAD + textWidth('SINCE 2020', 12, 0.2) + 22;
  parts.forEach(([name, value], index) => {
    const text = `${count(value)} ${name}`;
    pieces.push(label(text, { x, y: HEIGHT - 26, size: 12, tracking: 0.1, fill: theme.textFaint }));
    x += textWidth(text, 12, 0.1);
    if (index < parts.length - 1) {
      pieces.push(
        label('·', { x: x + 8, y: HEIGHT - 26, size: 12, opacity: 0.5, fill: theme.textFaint })
      );
      x += 24;
    }
  });

  return pieces.join('');
}

function render(theme, data, now) {
  const weeks = data ? data.weeks : blankYear(now);
  const publicOnly = data && !data.privateShared;
  const understated = publicOnly && data.total < SPARSE_LIMIT;
  const synced = (data ? data.generatedAt : now.toISOString()).slice(0, 10);

  const plate = backdrop(theme, {
    width: WIDTH,
    height: HEIGHT,
    seed: 53,
    gridStep: 32,
    blobs: [
      { color: theme.cyan, x: 0.12, y: 0.8, size: 0.44, dur: 29 },
      { color: theme.violet, x: 0.55, y: 0.12, size: 0.42, dur: 37 },
      { color: theme.green, x: 0.92, y: 0.7, size: 0.36, dur: 25 },
    ],
  });

  const grid = heatmap(theme, weeks);

  const scope = !data
    ? 'waiting for first sync'
    : data.privateShared
      ? 'public + private contributions'
      : 'public contributions only';

  const status = !data ? 'AWAITING SYNC' : understated ? 'PRIVATE WORK HIDDEN' : `SYNCED ${synced}`;
  const statusWidth = pillWidth(status, 12, 0.14);

  const note = !data
    ? 'run the "profile art" workflow to populate this panel with live data'
    : understated
      ? 'this counts public repositories only — turn on Settings › Public profile › Include private contributions'
      : 'no contributions recorded in this window';

  const lifetime = data && data.lifetime;
  const showLifetime =
    lifetime &&
    !understated &&
    lifetime.commits + lifetime.pullRequests + lifetime.reviews + lifetime.issues > 0;

  const defs =
    plate.defs +
    grid.defs +
    el(
      'linearGradient',
      { id: 'activityTitle', x1: '0', y1: '0', x2: '1', y2: '0' },
      el('stop', { offset: '0%', 'stop-color': theme.cyan }) +
        el('stop', { offset: '60%', 'stop-color': theme.violet }) +
        el('stop', { offset: '100%', 'stop-color': theme.magenta })
    ) +
    el(
      'linearGradient',
      { id: 'gridSweep', x1: '0', y1: '0', x2: '1', y2: '0' },
      el('stop', { offset: '0%', 'stop-color': theme.cyan, 'stop-opacity': 0 }) +
        el('stop', {
          offset: '50%',
          'stop-color': theme.cyan,
          'stop-opacity': theme.name === 'dark' ? 0.16 : 0.1,
        }) +
        el('stop', { offset: '100%', 'stop-color': theme.cyan, 'stop-opacity': 0 })
    );

  return svgDocument({
    width: WIDTH,
    height: HEIGHT,
    title: 'Contribution activity',
    desc: data
      ? `${data.total} contributions in the last 12 months. Current streak ${data.currentStreak} days, longest ${data.longestStreak} days, ${data.activeDays} active days.`
      : 'Contribution activity panel, awaiting its first data sync.',
    defs,
    body:
      plate.body +
      corners(theme, { width: WIDTH, height: HEIGHT }) +
      label('CONTRIBUTION ACTIVITY', {
        x: PAD,
        y: 60,
        size: 32,
        font: SANS,
        weight: 700,
        tracking: 0.01,
        fill: 'url(#activityTitle)',
      }) +
      label(`last 12 months  ·  ${scope}${data ? `  ·  synced ${synced}` : ''}`, {
        x: PAD,
        y: 82,
        size: 13,
        tracking: 0.12,
        fill: theme.textFaint,
      }) +
      pill(theme, {
        x: RIGHT - statusWidth,
        y: 40,
        w: statusWidth,
        h: 28,
        text: status,
        size: 12,
        tracking: 0.14,
        dot: data && !understated ? theme.green : theme.amber,
        blinkDur: 2.2,
      }) +
      tiles(theme, data) +
      grid.body +
      (data && data.best && data.best.count > 0
        ? label(`peak  ${count(data.best.count)} contributions on ${data.best.date}`, {
            x: PAD,
            y: LEGEND_Y + 9,
            size: 12,
            tracking: 0.1,
            fill: theme.textFaint,
          })
        : '') +
      legend(theme) +
      path({ d: `M${PAD},${HEIGHT - 50} H${RIGHT}`, stroke: theme.lineSoft, 'stroke-width': 1 }) +
      (showLifetime
        ? lifetimeStrip(theme, lifetime)
        : label(note, { x: PAD, y: HEIGHT - 26, size: 12, tracking: 0.08, fill: theme.textFaint })) +
      label(`@${LOGIN}`, {
        x: RIGHT,
        y: HEIGHT - 26,
        size: 12,
        tracking: 0.12,
        anchor: 'end',
        fill: theme.textFaint,
      }) +
      plate.frame,
  });
}

async function main() {
  const now = new Date();
  const data = await fetchProfile();
  writeThemedAssets('activity', render, data, now);
}

if (require.main === module) main().catch((error) => { console.error(error); process.exit(1); });

module.exports = { render, blankYear, WIDTH, HEIGHT };
