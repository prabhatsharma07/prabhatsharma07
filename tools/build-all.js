// Renders every asset in assets/. Static art is deterministic, so re-running
// without new contribution data produces byte-identical files and the refresh
// workflow commits nothing.

const hero = require('./build-hero');
const stack = require('./build-stack');
const activity = require('./build-activity');
const fs = require('fs');
const path = require('path');
const { themes } = require('./lib/theme');
const { fetchProfile } = require('./lib/github');

const OUT = path.join(__dirname, '..', 'assets');

function write(name, contents) {
  const file = path.join(OUT, name);
  const prev = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  fs.writeFileSync(file, contents);
  console.log(`${prev === contents ? 'unchanged' : 'updated  '}  assets/${name}`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  for (const key of ['dark', 'light']) {
    write(`hero-${key}.svg`, hero.render(themes[key]));
    write(`stack-${key}.svg`, stack.render(themes[key]));
  }

  const now = new Date();
  const data = await fetchProfile();
  for (const key of ['dark', 'light']) {
    write(`activity-${key}.svg`, activity.render(themes[key], data, now));
  }

  if (data) {
    console.log(
      `\n${data.total} contributions in the last 12 months · ` +
        `current streak ${data.currentStreak}d · longest ${data.longestStreak}d · ` +
        `${data.activeDays}/${data.trackedDays} active days`
    );
  } else {
    console.log('\nNo contribution data available — activity panel rendered in its empty state.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
