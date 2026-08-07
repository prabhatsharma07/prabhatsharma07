const {
  el,
  circle,
  path,
  group,
  label,
  card,
  roundRect,
  textWidth,
  SANS,
  fadeIn,
  rise,
  loop,
  svgDocument,
} = require('./lib/svg');
const { backdrop, corners } = require('./lib/scene');
const { writeThemedAssets } = require('./lib/write');

const LANES = [
  { label: 'LANGUAGES', accent: 'cyan', items: ['C#', 'TypeScript', 'JavaScript', 'Lua', 'PowerShell', 'HTML5', 'CSS3', 'Markdown'] },
  { label: 'FRONTEND', accent: 'violet', items: ['Tailwind CSS', 'SASS', 'Bootstrap', 'jQuery', 'Webpack', 'Gulp', 'WordPress'] },
  { label: 'BACKEND', accent: 'magenta', items: ['.NET', 'Node.js', 'GraphQL', 'JWT', 'Swagger', 'NPM'] },
  { label: 'DATA', accent: 'green', items: ['SQL Server', 'MongoDB', 'MySQL', 'Redis'] },
  { label: 'CLOUD', accent: 'cyan', items: ['AWS', 'Azure', 'Google Cloud', 'Vercel'] },
  { label: 'DEVOPS', accent: 'violet', items: ['Docker', 'Kubernetes', 'Terraform', 'GitHub Actions', 'GitLab CI'] },
  { label: 'VERSION CTRL', accent: 'magenta', items: ['Git', 'GitHub', 'GitLab', 'Bitbucket', 'Subversion'] },
  { label: 'QUALITY', accent: 'green', items: ['ESLint', 'Prettier', 'SonarQube', 'Selenium', 'Postman', 'Jira'] },
];

const WIDTH = 1200;
const PAD = 46;
const TOP = 132;
const ROW = 44;
const LANE_GAP = 10;
const SPINE = 250;
const LANE_START = 278;
const RIGHT = WIDTH - PAD;
const METER_WIDTH = 88;
const METER_X = RIGHT - 34 - METER_WIDTH;
const RAIL_END = METER_X - 20;
const AVAILABLE = RAIL_END - LANE_START;

const CHIP_HEIGHT = 32;
const CHIP_SIZE = 14.5;
const CHIP_GAP = 9;

const chipWidth = (text) => textWidth(text, CHIP_SIZE) + 32;
const rowWidth = (row) => row.reduce((total, item, i) => total + chipWidth(item) + (i ? CHIP_GAP : 0), 0);

function wrap(items) {
  const rows = [[]];
  for (const item of items) {
    const current = rows[rows.length - 1];
    if (current.length && rowWidth([...current, item]) > AVAILABLE) rows.push([item]);
    else current.push(item);
  }
  for (let i = rows.length - 2; i >= 0; i--) {
    while (rows[i].length > rows[i + 1].length + 1) {
      const moved = rows[i][rows[i].length - 1];
      if (rowWidth([moved, ...rows[i + 1]]) > AVAILABLE) break;
      rows[i + 1].unshift(rows[i].pop());
    }
  }
  return rows;
}

const LAYOUT = LANES.map((lane) => ({ ...lane, rows: wrap(lane.items) }));
const TOTAL_ITEMS = LANES.reduce((sum, lane) => sum + lane.items.length, 0);
const DEEPEST = Math.max(...LANES.map((lane) => lane.items.length));
const HEIGHT =
  TOP + LAYOUT.reduce((sum, lane) => sum + lane.rows.length * ROW + LANE_GAP, 0) - LANE_GAP + 76;

function chip(theme, text, x, middle, accent, delay) {
  const width = chipWidth(text);
  return group(
    { opacity: 0 },
    card({
      x,
      y: middle - CHIP_HEIGHT / 2,
      w: width,
      h: CHIP_HEIGHT,
      r: 8,
      fill: theme.surfaceAlt,
      fillOpacity: theme.chipFill,
      stroke: accent,
      strokeOpacity: theme.chipStroke,
    }) +
      label(text, {
        x: x + width / 2,
        y: middle + 5,
        size: CHIP_SIZE,
        anchor: 'middle',
        fill: theme.text,
      }) +
      fadeIn({ begin: delay }) +
      rise({ begin: delay })
  );
}

function meter(theme, lane, accent, middle, index) {
  const filled = Math.max(7, METER_WIDTH * (lane.items.length / DEEPEST));
  return (
    path({
      d: roundRect(METER_X, middle - 3.5, METER_WIDTH, 7, 3.5),
      fill: theme.line,
      'fill-opacity': theme.name === 'dark' ? 0.7 : 1,
    }) +
    path(
      {
        d: roundRect(METER_X, middle - 3.5, filled, 7, 3.5),
        fill: accent,
        'fill-opacity': 0.85,
        opacity: 0,
      },
      fadeIn({ begin: 1.1 + index * 0.09, dur: 0.6 })
    ) +
    label(String(lane.items.length).padStart(2, '0'), {
      x: RIGHT,
      y: middle + 4.6,
      size: 13,
      tracking: 0.1,
      anchor: 'end',
      fill: theme.textFaint,
    })
  );
}

function rail(theme, accent, middle, delay) {
  return (
    path({
      d: `M${LANE_START - 24},${middle} H${RAIL_END}`,
      stroke: theme.lineSoft,
      'stroke-width': 1,
      'stroke-dasharray': '1 5',
    }) +
    circle(
      { cx: LANE_START, cy: middle, r: 2.8, fill: accent, opacity: 0 },
      loop('cx', [LANE_START, RAIL_END], { dur: 7, begin: delay }) +
        loop('opacity', [0, 0.9, 0.9, 0], { dur: 7, begin: delay, keyTimes: [0, 0.08, 0.85, 1] })
    )
  );
}

function lanes(theme) {
  let y = TOP;
  let chipIndex = 0;
  const parts = [];
  const heads = [];

  LAYOUT.forEach((lane, laneIndex) => {
    const accent = theme[lane.accent];
    const head = y + ROW / 2;
    heads.push(head);

    parts.push(
      path({
        d: `M${SPINE},${head} H${LANE_START - 24}`,
        stroke: accent,
        'stroke-opacity': 0.5,
        'stroke-width': 1.2,
      }),
      circle({ cx: SPINE, cy: head, r: 3.8, fill: theme.bg, stroke: accent, 'stroke-width': 1.5 }),
      label(lane.label, {
        x: SPINE - 20,
        y: head + 4.6,
        size: 13,
        weight: 600,
        tracking: 0.16,
        anchor: 'end',
        fill: accent,
      }),
      meter(theme, lane, accent, head, laneIndex)
    );

    lane.rows.forEach((row, rowIndex) => {
      const middle = y + rowIndex * ROW + ROW / 2;
      parts.push(rail(theme, accent, middle, 1.4 + (laneIndex * 2 + rowIndex) * 0.55));

      let x = LANE_START;
      for (const item of row) {
        parts.push(chip(theme, item, x, middle, accent, 0.45 + chipIndex * 0.028));
        x += chipWidth(item) + CHIP_GAP;
        chipIndex++;
      }
    });

    y += lane.rows.length * ROW + LANE_GAP;
  });

  const first = heads[0];
  const last = heads[heads.length - 1];
  const spine =
    path({ d: `M${SPINE},${first} V${last}`, stroke: theme.line, 'stroke-width': 1.2 }) +
    circle(
      { cx: SPINE, cy: first, r: 2.8, fill: theme.cyan },
      loop('cy', [first, last, first], { dur: 9, keyTimes: [0, 0.5, 1], ease: '.45 0 .55 1' })
    );

  return spine + parts.join('');
}

function header(theme) {
  return (
    label('THE STACK', {
      x: PAD,
      y: 68,
      size: 32,
      font: SANS,
      weight: 700,
      tracking: 0.01,
      fill: 'url(#stackTitle)',
    }) +
    label(`${TOTAL_ITEMS} tools  ·  ${LANES.length} domains`, {
      x: PAD,
      y: 93,
      size: 13,
      tracking: 0.14,
      fill: theme.textFaint,
    })
  );
}

function footer(theme) {
  return (
    path({ d: `M${PAD},${HEIGHT - 52} H${RIGHT}`, stroke: theme.lineSoft, 'stroke-width': 1 }) +
    label('day to day, in production', {
      x: PAD,
      y: HEIGHT - 28,
      size: 12.5,
      tracking: 0.12,
      fill: theme.textFaint,
    }) +
    label('◆ ◆ ◆', {
      x: RIGHT,
      y: HEIGHT - 28,
      size: 11,
      tracking: 0.3,
      anchor: 'end',
      opacity: 0.6,
      fill: theme.textFaint,
    })
  );
}

function render(theme) {
  const plate = backdrop(theme, {
    width: WIDTH,
    height: HEIGHT,
    seed: 31,
    gridStep: 32,
    blobs: [
      { color: theme.cyan, x: 0.1, y: 0.15, size: 0.42, dur: 31 },
      { color: theme.violet, x: 0.9, y: 0.5, size: 0.46, dur: 39 },
      { color: theme.magenta, x: 0.45, y: 0.95, size: 0.36, dur: 27 },
    ],
  });

  const title = el(
    'linearGradient',
    { id: 'stackTitle', x1: '0', y1: '0', x2: '1', y2: '0' },
    el('stop', { offset: '0%', 'stop-color': theme.cyan }) +
      el('stop', { offset: '55%', 'stop-color': theme.violet }) +
      el('stop', { offset: '100%', 'stop-color': theme.magenta })
  );

  return svgDocument({
    width: WIDTH,
    height: HEIGHT,
    title: 'The stack',
    desc: LANES.map((lane) => `${lane.label}: ${lane.items.join(', ')}`).join('. '),
    defs: plate.defs + title,
    body:
      plate.body +
      corners(theme, { width: WIDTH, height: HEIGHT }) +
      header(theme) +
      lanes(theme) +
      footer(theme) +
      plate.frame,
  });
}

if (require.main === module) writeThemedAssets('stack', render);

module.exports = { render, LANES, LAYOUT, WIDTH, HEIGHT };
