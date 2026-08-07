// The stack board. Replaces the wall of shields.io badges with a single
// composed image: a bus spine, one lane per domain, and every tool as a chip.
// Content is exactly what the profile previously declared — reorganised, not
// invented.
//
// Lanes wrap: type is sized for legibility at GitHub's README width first, and
// the layout reflows to fit rather than the other way round.

const fs = require('fs');
const path = require('path');
const { themes, FONT_MONO, FONT_SANS } = require('./lib/theme');
const { svgDoc, tag, g, text, n, monoWidth, monoWidthLS, roundedRect } = require('./lib/svg');
const { backdrop, cornerMarks } = require('./lib/scene');

const W = 1200;

const LANES = [
  { label: 'LANGUAGES', key: 'cyan', items: ['C#', 'TypeScript', 'JavaScript', 'Lua', 'PowerShell', 'HTML5', 'CSS3', 'Markdown'] },
  { label: 'FRONTEND', key: 'violet', items: ['Tailwind CSS', 'SASS', 'Bootstrap', 'jQuery', 'Webpack', 'Gulp', 'WordPress'] },
  { label: 'BACKEND', key: 'magenta', items: ['.NET', 'Node.js', 'GraphQL', 'JWT', 'Swagger', 'NPM'] },
  { label: 'DATA', key: 'green', items: ['SQL Server', 'MongoDB', 'MySQL', 'Redis'] },
  { label: 'CLOUD', key: 'cyan', items: ['AWS', 'Azure', 'Google Cloud', 'Vercel'] },
  { label: 'DEVOPS', key: 'violet', items: ['Docker', 'Kubernetes', 'Terraform', 'GitHub Actions', 'GitLab CI'] },
  { label: 'VERSION CTRL', key: 'magenta', items: ['Git', 'GitHub', 'GitLab', 'Bitbucket', 'Subversion'] },
  { label: 'QUALITY', key: 'green', items: ['ESLint', 'Prettier', 'SonarQube', 'Selenium', 'Postman', 'Jira'] },
];

const PAD = 46;
const TOP = 132; // top of the first lane block
const ROW_H = 44; // one wrapped row of chips
const LANE_GAP = 10;
const SPINE_X = 250;
const LANE_X = 278;
const RIGHT = W - PAD;
const METER_W = 88;
const METER_X = RIGHT - 34 - METER_W;
const RAIL_END = METER_X - 20;
const AVAIL = RAIL_END - LANE_X;

const CHIP_H = 32;
const CHIP_FS = 14.5;
const CHIP_PAD = 16;
const GAP = 9;
const LABEL_FS = 13;

const chipWidth = (label) => monoWidth(label, CHIP_FS) + CHIP_PAD * 2;

const rowWidth = (row) =>
  row.reduce((s, item, i) => s + chipWidth(item) + (i ? GAP : 0), 0);

/**
 * Greedy wrap, then a balancing pass — a greedy fit leaves orphans (7 chips on
 * one row and 1 on the next), which reads as a mistake rather than a layout.
 */
function wrapLane(items) {
  const rows = [[]];
  let used = 0;
  for (const item of items) {
    const w = chipWidth(item);
    const need = rows[rows.length - 1].length ? used + GAP + w : w;
    if (need > AVAIL && rows[rows.length - 1].length) {
      rows.push([item]);
      used = w;
    } else {
      rows[rows.length - 1].push(item);
      used = need;
    }
  }

  for (let i = rows.length - 2; i >= 0; i--) {
    while (rows[i].length > rows[i + 1].length + 1) {
      const moved = rows[i][rows[i].length - 1];
      if (rowWidth([moved, ...rows[i + 1]]) > AVAIL) break;
      rows[i + 1].unshift(rows[i].pop());
    }
  }
  return rows;
}

const LAYOUT = LANES.map((lane) => ({ ...lane, rows: wrapLane(lane.items) }));
const BLOCK_H = LAYOUT.reduce((s, l) => s + l.rows.length * ROW_H + LANE_GAP, 0) - LANE_GAP;
const H = TOP + BLOCK_H + 76;

function chip(t, label, x, cy, accent, delay) {
  const w = chipWidth(label);
  const y = cy - CHIP_H / 2;
  return g(
    { opacity: 0 },
    tag('path', {
      d: roundedRect(x, y, w, CHIP_H, 8),
      fill: t.surfaceAlt,
      'fill-opacity': t.name === 'dark' ? 0.82 : 0.95,
    }) +
      tag('path', {
        d: roundedRect(x + 0.5, y + 0.5, w - 1, CHIP_H - 1, 7.5),
        stroke: accent,
        'stroke-opacity': t.name === 'dark' ? 0.42 : 0.5,
        'stroke-width': 1,
        fill: 'none',
      }) +
      text(label, {
        x: n(x + w / 2),
        y: n(cy + 5),
        fill: t.text,
        'font-family': FONT_MONO,
        'font-size': CHIP_FS,
        'text-anchor': 'middle',
      }) +
      tag('animate', {
        attributeName: 'opacity',
        from: 0,
        to: 1,
        dur: '0.5s',
        begin: `${n(delay)}s`,
        fill: 'freeze',
      }) +
      tag('animateTransform', {
        attributeName: 'transform',
        type: 'translate',
        from: '0 7',
        to: '0 0',
        dur: '0.6s',
        begin: `${n(delay)}s`,
        fill: 'freeze',
        calcMode: 'spline',
        keyTimes: '0;1',
        keySplines: '.16 1 .3 1',
      })
  );
}

function render(t) {
  const bd = backdrop(t, {
    width: W,
    height: H,
    radius: 22,
    seed: 31,
    gridStep: 32,
    blobs: [
      { c: t.cyan, x: 0.1, y: 0.15, r: 0.42, dur: 31 },
      { c: t.violet, x: 0.9, y: 0.5, r: 0.46, dur: 39 },
      { c: t.magenta, x: 0.45, y: 0.95, r: 0.36, dur: 27 },
    ],
  });

  const total = LANES.reduce((s, l) => s + l.items.length, 0);
  const maxItems = Math.max(...LANES.map((l) => l.items.length));

  let defs = bd.defs;
  let lanes = '';
  let index = 0;
  let y = TOP;
  let firstCy = null;
  let lastCy = null;

  LAYOUT.forEach((lane, li) => {
    const accent = t[lane.key];
    const headCy = y + ROW_H / 2;
    if (firstCy === null) firstCy = headCy;
    lastCy = headCy;

    // Junction on the spine, plus the stub feeding this lane.
    lanes += tag('path', {
      d: `M${SPINE_X},${n(headCy)} H${LANE_X - 24}`,
      stroke: accent,
      'stroke-opacity': 0.5,
      'stroke-width': 1.2,
    });
    lanes += tag('circle', {
      cx: SPINE_X,
      cy: n(headCy),
      r: 3.8,
      fill: t.bg,
      stroke: accent,
      'stroke-width': 1.5,
    });
    lanes += text(lane.label, {
      x: SPINE_X - 20,
      y: n(headCy + 4.6),
      fill: accent,
      'font-family': FONT_MONO,
      'font-size': LABEL_FS,
      'font-weight': 600,
      'letter-spacing': '0.16em',
      'text-anchor': 'end',
    });

    // Depth meter, aligned to the lane head.
    const frac = lane.items.length / maxItems;
    lanes += tag('path', {
      d: roundedRect(METER_X, headCy - 3.5, METER_W, 7, 3.5),
      fill: t.line,
      'fill-opacity': t.name === 'dark' ? 0.7 : 1,
    });
    lanes += tag(
      'path',
      {
        d: roundedRect(METER_X, headCy - 3.5, Math.max(7, METER_W * frac), 7, 3.5),
        fill: accent,
        'fill-opacity': 0.85,
        opacity: 0,
      },
      tag('animate', {
        attributeName: 'opacity',
        from: 0,
        to: 1,
        dur: '0.6s',
        begin: `${n(1.1 + li * 0.09)}s`,
        fill: 'freeze',
      })
    );
    lanes += text(String(lane.items.length).padStart(2, '0'), {
      x: RIGHT,
      y: n(headCy + 4.6),
      fill: t.textFaint,
      'font-family': FONT_MONO,
      'font-size': 13,
      'letter-spacing': '0.1em',
      'text-anchor': 'end',
    });

    lane.rows.forEach((row, ri) => {
      const cy = y + ri * ROW_H + ROW_H / 2;

      lanes += tag('path', {
        d: `M${LANE_X - 24},${n(cy)} H${RAIL_END}`,
        stroke: t.lineSoft,
        'stroke-width': 1,
        'stroke-dasharray': '1 5',
      });

      // A pulse of light travelling down the rail.
      lanes += tag(
        'circle',
        { cx: LANE_X, cy: n(cy), r: 2.8, fill: accent, opacity: 0 },
        tag('animate', {
          attributeName: 'cx',
          values: `${LANE_X};${RAIL_END}`,
          dur: '7s',
          begin: `${n(1.4 + (li * 2 + ri) * 0.55)}s`,
          repeatCount: 'indefinite',
        }) +
          tag('animate', {
            attributeName: 'opacity',
            values: '0;0.9;0.9;0',
            keyTimes: '0;0.08;0.85;1',
            dur: '7s',
            begin: `${n(1.4 + (li * 2 + ri) * 0.55)}s`,
            repeatCount: 'indefinite',
          })
      );

      let x = LANE_X;
      row.forEach((item) => {
        lanes += chip(t, item, x, cy, accent, 0.45 + index * 0.028);
        x += chipWidth(item) + GAP;
        index++;
      });
    });

    y += lane.rows.length * ROW_H + LANE_GAP;
  });

  const spine =
    tag('path', {
      d: `M${SPINE_X},${n(firstCy)} V${n(lastCy)}`,
      stroke: t.line,
      'stroke-width': 1.2,
    }) +
    tag(
      'circle',
      { cx: SPINE_X, cy: n(firstCy), r: 2.8, fill: t.cyan },
      tag('animate', {
        attributeName: 'cy',
        values: `${n(firstCy)};${n(lastCy)};${n(firstCy)}`,
        dur: '9s',
        repeatCount: 'indefinite',
        calcMode: 'spline',
        keyTimes: '0;0.5;1',
        keySplines: '.45 0 .55 1;.45 0 .55 1',
      })
    );

  defs += tag(
    'linearGradient',
    { id: 'sh', x1: '0', y1: '0', x2: '1', y2: '0' },
    tag('stop', { offset: '0%', 'stop-color': t.cyan }) +
      tag('stop', { offset: '55%', 'stop-color': t.violet }) +
      tag('stop', { offset: '100%', 'stop-color': t.magenta })
  );

  const header =
    text('THE STACK', {
      x: PAD,
      y: 68,
      fill: 'url(#sh)',
      'font-family': FONT_SANS,
      'font-size': 32,
      'font-weight': 700,
      'letter-spacing': '0.01em',
    }) +
    text(`${total} tools  ·  ${LANES.length} domains`, {
      x: PAD,
      y: 93,
      fill: t.textFaint,
      'font-family': FONT_MONO,
      'font-size': 13,
      'letter-spacing': '0.14em',
    }) +
    tag('path', { d: `M${PAD},${H - 52} H${RIGHT}`, stroke: t.lineSoft, 'stroke-width': 1 }) +
    text('day to day, in production', {
      x: PAD,
      y: n(H - 28),
      fill: t.textFaint,
      'font-family': FONT_MONO,
      'font-size': 12.5,
      'letter-spacing': '0.12em',
    }) +
    text('◆ ◆ ◆', {
      x: RIGHT,
      y: n(H - 28),
      fill: t.textFaint,
      'font-family': FONT_MONO,
      'font-size': 11,
      'letter-spacing': '0.3em',
      'text-anchor': 'end',
      opacity: 0.6,
    });

  const children =
    bd.body +
    cornerMarks(t, { width: W, height: H, inset: 16, len: 13 }) +
    header +
    spine +
    lanes +
    bd.frame;

  return svgDoc({
    width: W,
    height: H,
    defs,
    children,
    title: 'The stack',
    desc: LANES.map((l) => `${l.label}: ${l.items.join(', ')}`).join('. '),
  });
}

function main() {
  const out = path.join(__dirname, '..', 'assets');
  fs.mkdirSync(out, { recursive: true });
  for (const key of ['dark', 'light']) {
    const file = path.join(out, `stack-${key}.svg`);
    fs.writeFileSync(file, render(themes[key]));
    console.log(`wrote ${path.relative(process.cwd(), file)}`);
  }
}

if (require.main === module) main();
module.exports = { render, LANES, LAYOUT, W, H };
