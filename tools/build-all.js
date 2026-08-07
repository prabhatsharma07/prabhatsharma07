const hero = require('./build-hero');
const stack = require('./build-stack');
const activity = require('./build-activity');
const { fetchProfile } = require('./lib/github');
const { writeThemedAssets } = require('./lib/write');

async function main() {
  writeThemedAssets('hero', hero.render);
  writeThemedAssets('stack', stack.render);

  const data = await fetchProfile();
  writeThemedAssets('activity', activity.render, data, new Date());

  if (!data) {
    console.log('\nNo contribution data available — activity panel rendered in its empty state.');
    return;
  }

  console.log(
    `\n${data.total} contributions in the last 12 months · ` +
      `current streak ${data.currentStreak}d · longest ${data.longestStreak}d · ` +
      `${data.activeDays}/${data.trackedDays} active days`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
