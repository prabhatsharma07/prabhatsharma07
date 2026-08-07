// Live contribution dashboard. Rendered from real GitHub data when a token is
// available; otherwise it renders an honest empty state — never invented
// numbers.

const fs = require('fs');
const path = require('path');
const { themes, FONT_MONO, FONT_SANS } = require('./lib/theme');
const { svgDoc, tag, g, text, n, monoWidth, monoWidthLS, roundedRect } = require('./lib/svg');
const { backdrop, cornerMarks, panel } = require('./lib/scene');
const { fetchProfile, LOGIN } = require('./lib/github');

const W = 1200;
const H = 502;
const PAD = 44;
const RIGHT = W - PAD;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmt = (v) => (v == null ? '—' : Number(v).toLocaleString('en-US'));

/** A 53-week grid of real dates with no counts, for the pre-sync state. */
function placeholderWeeks(now) {
  const weeks = [];
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  // Walk back to the most recent Sunday, then back 52 more weeks.
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - end.getUTCDay() - 52 * 7);
  for (let w = 0; w < 53; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start);
      cur.setUTCDate(start.getUTCDate() + w * 7 + d);
      if (cur > end) break;
      days.push({ date: cur.toISOString().slice(0, 10), count: 0, weekday: d, level: 0 });
    }
    if (days.length) weeks.push(days);
  }
  return weeks;
}

function statTile(t, { x, y, w, h, label, value, suffix, accent, delay }) {
  const barW = w - 36;
  return (
    panel(t, { x, y, w, h, radius: 12 }) +
    text(label, {
      x: x + 18,
      y: y + 27,
      fill: t.textFaint,
      'font-family': FONT_MONO,
      'font-size': 12.5,
      'letter-spacing': '0.2em',
    }) +
    text(value, {
      x: x + 18,
      y: y + 68,
      fill: accent,
      'font-family': FONT_SANS,
      'font-size': 40,
      'font-weight': 700,
      'letter-spacing': '-0.01em',
    }) +
    text(suffix, {
      x: x + 18,
      y: y + 84,
      fill: t.textFaint,
      'font-family': FONT_MONO,
      'font-size': 12,
      'letter-spacing': '0.14em',
    }) +
    // Underline that draws itself in, clear of the caption's descenders.
    tag(
      'rect',
      { x: x + 18, y: y + h - 8, width: 0, height: 2, rx: 1, fill: accent, opacity: 0.75 },
      tag('animate', {
        attributeName: 'width',
        from: 0,
        to: barW,
        dur: '1.1s',
        begin: `${n(delay)}s`,
        fill: 'freeze',
        calcMode: 'spline',
        keyTimes: '0;1',
        keySplines: '.16 1 .3 1',
      })
    )
  );
}

function heatmap(t, weeks, { x0, y0, width, height }) {
  const cols = weeks.length;
  const pitch = Math.min(width / cols, height / 7);
  const cell = Math.max(6, pitch - 3.6);
  const r = Math.max(2, cell * 0.22);

  let cells = '';
  let monthLabels = '';
  let lastMonth = -1;

  weeks.forEach((week, ci) => {
    const cx = x0 + ci * pitch;

    // Month tick when a new month starts inside this column.
    const first = week[0];
    if (first) {
      const m = Number(first.date.slice(5, 7)) - 1;
      if (m !== lastMonth && ci < cols - 1) {
        // Only label once the month actually owns this column.
        const day = Number(first.date.slice(8, 10));
        if (day <= 7) {
          monthLabels += text(MONTHS[m], {
            x: n(cx),
            y: n(y0 - 12),
            fill: t.textFaint,
            'font-family': FONT_MONO,
            'font-size': 12,
            'letter-spacing': '0.1em',
          });
          lastMonth = m;
        }
      }
    }

    week.forEach((day) => {
      const cy = y0 + day.weekday * pitch;
      const fill = t.heat[Math.max(0, Math.min(4, day.level))];
      const delay = 0.45 + ci * 0.013 + day.weekday * 0.02;
      const target = day.level === 0 ? (t.name === 'dark' ? 0.85 : 0.9) : 1;
      cells += tag(
        'rect',
        {
          x: n(cx),
          y: n(cy),
          width: n(cell),
          height: n(cell),
          rx: n(r),
          fill,
          opacity: 0,
        },
        tag('animate', {
          attributeName: 'opacity',
          from: 0,
          to: target,
          dur: '0.5s',
          begin: `${n(delay)}s`,
          fill: 'freeze',
        })
      );
    });
  });

  // Weekday gutter.
  let weekdays = '';
  [
    [1, 'Mon'],
    [3, 'Wed'],
    [5, 'Fri'],
  ].forEach(([row, label]) => {
    weekdays += text(label, {
      x: n(x0 - 12),
      y: n(y0 + row * pitch + cell * 0.75),
      fill: t.textFaint,
      'font-family': FONT_MONO,
      'font-size': 12,
      'text-anchor': 'end',
    });
  });

  // A slow highlight sweeping left to right across the grid.
  const gridW = cols * pitch;
  const sweep = tag(
    'g',
    { 'clip-path': 'url(#hmclip)' },
    tag(
      'rect',
      { x: n(x0 - 120), y: n(y0 - 4), width: 120, height: n(7 * pitch + 8), fill: 'url(#sweepg)' },
      tag('animate', {
        attributeName: 'x',
        values: `${n(x0 - 140)};${n(x0 + gridW + 40)}`,
        dur: '9s',
        begin: '2.6s',
        repeatCount: 'indefinite',
      })
    )
  );

  const clip = tag(
    'clipPath',
    { id: 'hmclip' },
    tag('rect', { x: n(x0 - 4), y: n(y0 - 4), width: n(gridW + 8), height: n(7 * pitch + 8) })
  );

  return { cells, monthLabels, weekdays, sweep, clip, pitch, cell, gridW };
}

function render(t, data, now) {
  const isLive = !!data;
  const weeks = isLive ? data.weeks : placeholderWeeks(now);

  const bd = backdrop(t, {
    width: W,
    height: H,
    radius: 22,
    seed: 53,
    gridStep: 32,
    blobs: [
      { c: t.cyan, x: 0.12, y: 0.8, r: 0.44, dur: 29 },
      { c: t.violet, x: 0.55, y: 0.12, r: 0.42, dur: 37 },
      { c: t.green, x: 0.92, y: 0.7, r: 0.36, dur: 25 },
    ],
  });

  const hm = heatmap(t, weeks, { x0: PAD + 38, y0: 262, width: RIGHT - (PAD + 38), height: 150 });

  const titleGrad = tag(
    'linearGradient',
    { id: 'ah', x1: '0', y1: '0', x2: '1', y2: '0' },
    tag('stop', { offset: '0%', 'stop-color': t.cyan }) +
      tag('stop', { offset: '60%', 'stop-color': t.violet }) +
      tag('stop', { offset: '100%', 'stop-color': t.magenta })
  );

  const sweepGrad = tag(
    'linearGradient',
    { id: 'sweepg', x1: '0', y1: '0', x2: '1', y2: '0' },
    tag('stop', { offset: '0%', 'stop-color': t.cyan, 'stop-opacity': 0 }) +
      tag('stop', { offset: '50%', 'stop-color': t.cyan, 'stop-opacity': t.name === 'dark' ? 0.16 : 0.1 }) +
      tag('stop', { offset: '100%', 'stop-color': t.cyan, 'stop-opacity': 0 })
  );

  const synced = (isLive ? data.generatedAt : now.toISOString()).slice(0, 10);
  const subtitle = isLive
    ? `last 12 months  ·  synced ${synced}`
    : 'last 12 months  ·  waiting for first sync';

  // Status pill, right-aligned.
  const pillLabel = isLive ? `SYNCED ${synced}` : 'AWAITING SYNC';
  const pillW = 30 + monoWidthLS(pillLabel, 12, 0.14) + 14;
  const pillX = RIGHT - pillW;
  const pillAccent = isLive ? t.green : t.amber;
  const pill =
    tag('path', {
      d: roundedRect(pillX, 40, pillW, 28, 14),
      fill: t.surface,
      'fill-opacity': t.name === 'dark' ? 0.5 : 0.85,
    }) +
    tag('path', {
      d: roundedRect(pillX + 0.5, 40.5, pillW - 1, 27, 13.5),
      stroke: t.line,
      'stroke-width': 1,
      fill: 'none',
    }) +
    tag(
      'circle',
      { cx: pillX + 17, cy: 54, r: 3.4, fill: pillAccent },
      tag('animate', {
        attributeName: 'opacity',
        values: '1;0.25;1',
        dur: '2.2s',
        repeatCount: 'indefinite',
      })
    ) +
    text(pillLabel, {
      x: pillX + 30,
      y: 58,
      fill: t.textDim,
      'font-family': FONT_MONO,
      'font-size': 12,
      'letter-spacing': '0.14em',
    });

  const header =
    text('CONTRIBUTION ACTIVITY', {
      x: PAD,
      y: 60,
      fill: 'url(#ah)',
      'font-family': FONT_SANS,
      'font-size': 32,
      'font-weight': 700,
      'letter-spacing': '0.01em',
    }) +
    text(subtitle, {
      x: PAD,
      y: 82,
      fill: t.textFaint,
      'font-family': FONT_MONO,
      'font-size': 13,
      'letter-spacing': '0.12em',
    }) +
    pill;

  // Stat tiles.
  const tileGap = 16;
  const tileW = (W - PAD * 2 - tileGap * 3) / 4;
  const tiles = [
    {
      label: 'CONTRIBUTIONS',
      value: isLive ? fmt(data.total) : '—',
      suffix: 'LAST 12 MONTHS',
      accent: t.cyan,
    },
    {
      label: 'CURRENT STREAK',
      value: isLive ? fmt(data.currentStreak) : '—',
      suffix: 'CONSECUTIVE DAYS',
      accent: t.violet,
    },
    {
      label: 'LONGEST STREAK',
      value: isLive ? fmt(data.longestStreak) : '—',
      suffix: 'CONSECUTIVE DAYS',
      accent: t.magenta,
    },
    {
      label: 'ACTIVE DAYS',
      value: isLive ? fmt(data.activeDays) : '—',
      suffix: isLive ? `OF ${data.trackedDays} TRACKED` : 'OF 365 TRACKED',
      accent: t.green,
    },
  ]
    .map((tile, i) =>
      statTile(t, {
        ...tile,
        x: PAD + i * (tileW + tileGap),
        y: 106,
        w: tileW,
        h: 100,
        delay: 0.5 + i * 0.12,
      })
    )
    .join('');

  // Heat legend under the grid, right-aligned.
  const legendY = 430;
  let legend = '';
  {
    const box = 11;
    const gap = 4;
    const label = 'Less';
    const moreW = monoWidth('More', 12);
    const swatchesW = t.heat.length * (box + gap) - gap;
    const totalW = monoWidth(label, 12) + 10 + swatchesW + 10 + moreW;
    let lx = RIGHT - totalW;
    legend += text(label, {
      x: n(lx),
      y: legendY + 9,
      fill: t.textFaint,
      'font-family': FONT_MONO,
      'font-size': 12,
    });
    lx += monoWidth(label, 12) + 10;
    t.heat.forEach((c) => {
      legend += tag('rect', { x: n(lx), y: legendY, width: box, height: box, rx: 2.6, fill: c });
      lx += box + gap;
    });
    lx += 6;
    legend += text('More', {
      x: n(lx),
      y: legendY + 9,
      fill: t.textFaint,
      'font-family': FONT_MONO,
      'font-size': 12,
    });
  }

  // Best day, left-aligned opposite the legend.
  if (isLive && data.best && data.best.count > 0) {
    legend =
      text(`peak  ${fmt(data.best.count)} contributions on ${data.best.date}`, {
        x: PAD,
        y: legendY + 9,
        fill: t.textFaint,
        'font-family': FONT_MONO,
        'font-size': 12,
        'letter-spacing': '0.1em',
      }) + legend;
  }

  // Lifetime strip — only shown when there is something real to show.
  let footer = tag('path', {
    d: `M${PAD},${H - 50} H${RIGHT}`,
    stroke: t.lineSoft,
    'stroke-width': 1,
  });

  const lt = isLive ? data.lifetime : null;
  const hasLifetime = lt && lt.commits + lt.pullRequests + lt.reviews + lt.issues > 0;
  if (hasLifetime) {
    const parts = [
      ['commits', lt.commits],
      ['pull requests', lt.pullRequests],
      ['reviews', lt.reviews],
      ['issues', lt.issues],
    ].filter(([, v]) => v > 0);
    let fx = PAD;
    footer += text('SINCE 2020', {
      x: fx,
      y: H - 26,
      fill: t.textDim,
      'font-family': FONT_MONO,
      'font-size': 12,
      'font-weight': 600,
      'letter-spacing': '0.2em',
    });
    fx += monoWidthLS('SINCE 2020', 12, 0.2) + 22;
    parts.forEach(([label, v], i) => {
      const str = `${fmt(v)} ${label}`;
      footer += text(str, {
        x: n(fx),
        y: H - 26,
        fill: t.textFaint,
        'font-family': FONT_MONO,
        'font-size': 12,
        'letter-spacing': '0.1em',
      });
      fx += monoWidthLS(str, 12, 0.1);
      if (i < parts.length - 1) {
        footer += text('·', {
          x: n(fx + 8),
          y: H - 26,
          fill: t.textFaint,
          'font-family': FONT_MONO,
          'font-size': 12,
          opacity: 0.5,
        });
        fx += 24;
      }
    });
  } else {
    footer += text(
      isLive
        ? 'private contributions are hidden — enable them in Settings › Public profile to count them here'
        : 'run the "profile art" workflow to populate this panel with live data',
      {
        x: PAD,
        y: H - 26,
        fill: t.textFaint,
        'font-family': FONT_MONO,
        'font-size': 12,
        'letter-spacing': '0.08em',
      }
    );
  }

  footer += text(`@${LOGIN}`, {
    x: RIGHT,
    y: H - 26,
    fill: t.textFaint,
    'font-family': FONT_MONO,
    'font-size': 12,
    'letter-spacing': '0.12em',
    'text-anchor': 'end',
  });

  const defs = bd.defs + titleGrad + sweepGrad + hm.clip;

  const children =
    bd.body +
    cornerMarks(t, { width: W, height: H, inset: 16, len: 13 }) +
    header +
    tiles +
    hm.monthLabels +
    hm.weekdays +
    hm.cells +
    hm.sweep +
    legend +
    footer +
    bd.frame;

  return svgDoc({
    width: W,
    height: H,
    defs,
    children,
    title: 'Contribution activity',
    desc: isLive
      ? `${data.total} contributions in the last 12 months. Current streak ${data.currentStreak} days, longest ${data.longestStreak} days, ${data.activeDays} active days.`
      : 'Contribution activity panel, awaiting its first data sync.',
  });
}

async function main() {
  const now = new Date();
  const data = await fetchProfile();
  const out = path.join(__dirname, '..', 'assets');
  fs.mkdirSync(out, { recursive: true });
  for (const key of ['dark', 'light']) {
    const file = path.join(out, `activity-${key}.svg`);
    fs.writeFileSync(file, render(themes[key], data, now));
    console.log(`wrote ${path.relative(process.cwd(), file)}${data ? '' : ' (empty state)'}`);
  }
  if (data) {
    console.log(
      `[github] ${data.total} contributions · streak ${data.currentStreak} · longest ${data.longestStreak}`
    );
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { render, placeholderWeeks, W, H };
