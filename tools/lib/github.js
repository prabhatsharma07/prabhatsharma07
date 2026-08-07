// Pulls the contribution calendar and lifetime totals from GitHub's GraphQL
// API. Everything here is best-effort: if there is no token, or the request
// fails, callers get null and render the empty state rather than fabricating
// numbers.
//
// Token notes:
//   GITHUB_TOKEN (the Actions default) sees PUBLIC contributions only.
//   A user PAT with `read:user` also reports private contributions, provided
//   "Include private contributions on my profile" is enabled in
//   Settings -> Public profile -> Contributions & Activity.

const LOGIN = process.env.PROFILE_LOGIN || 'prabhatsharma07';
const ACCOUNT_CREATED_YEAR = 2020;

function yearWindows(fromYear, now) {
  const windows = [];
  for (let y = fromYear; y <= now.getUTCFullYear(); y++) {
    windows.push({
      alias: `y${y}`,
      from: `${y}-01-01T00:00:00Z`,
      to: `${y}-12-31T23:59:59Z`,
    });
  }
  return windows;
}

function buildQuery(windows) {
  const yearFields = windows
    .map(
      (w) => `${w.alias}: contributionsCollection(from: "${w.from}", to: "${w.to}") {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalIssueContributions
        restrictedContributionsCount
      }`
    )
    .join('\n');

  return `query($login: String!) {
    user(login: $login) {
      name
      login
      createdAt
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            firstDay
            contributionDays { date weekday contributionCount contributionLevel }
          }
        }
      }
      ${yearFields}
    }
  }`;
}

async function graphql(query, variables, token) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'profile-readme-art',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`GraphQL HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors).slice(0, 300)}`);
  }
  return json.data;
}

/** Flatten the calendar into an ordered list of days. */
function flattenDays(calendar) {
  const days = [];
  for (const week of calendar.weeks) {
    for (const d of week.contributionDays) {
      days.push({
        date: d.date,
        count: d.contributionCount,
        weekday: d.weekday,
        level: ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'].indexOf(
          d.contributionLevel
        ),
      });
    }
  }
  return days;
}

/**
 * Streaks are computed from the tail of the calendar. A zero on today alone
 * does not break the current streak — the day is still in progress.
 */
function streaks(days) {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    if (run > longest) longest = run;
  }

  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i -= 1; // today may not have landed yet
  let current = 0;
  for (; i >= 0; i--) {
    if (days[i].count === 0) break;
    current++;
  }
  return { current, longest };
}

async function fetchProfile() {
  const token = process.env.GH_PAT || process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn('[github] no GH_PAT or GITHUB_TOKEN in env — rendering empty state');
    return null;
  }

  const now = new Date();
  const windows = yearWindows(ACCOUNT_CREATED_YEAR, now);

  let data;
  try {
    data = await graphql(buildQuery(windows), { login: LOGIN }, token);
  } catch (err) {
    console.warn(`[github] fetch failed — rendering empty state: ${err.message}`);
    return null;
  }

  const user = data && data.user;
  if (!user) {
    console.warn('[github] no user in response — rendering empty state');
    return null;
  }

  const calendar = user.contributionsCollection.contributionCalendar;
  const days = flattenDays(calendar);
  const { current, longest } = streaks(days);

  const lifetime = { commits: 0, pullRequests: 0, reviews: 0, issues: 0, restricted: 0 };
  for (const w of windows) {
    const c = user[w.alias];
    if (!c) continue;
    lifetime.commits += c.totalCommitContributions || 0;
    lifetime.pullRequests += c.totalPullRequestContributions || 0;
    lifetime.reviews += c.totalPullRequestReviewContributions || 0;
    lifetime.issues += c.totalIssueContributions || 0;
    lifetime.restricted += c.restrictedContributionsCount || 0;
  }

  const weeks = calendar.weeks.map((w) =>
    w.contributionDays.map((d) => ({
      date: d.date,
      count: d.contributionCount,
      weekday: d.weekday,
      level: ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'].indexOf(
        d.contributionLevel
      ),
    }))
  );

  const best = days.reduce((a, b) => (b.count > a.count ? b : a), { count: 0, date: null });

  return {
    login: user.login,
    name: user.name,
    createdAt: user.createdAt,
    generatedAt: now.toISOString(),
    total: calendar.totalContributions,
    activeDays: days.filter((d) => d.count > 0).length,
    trackedDays: days.length,
    currentStreak: current,
    longestStreak: longest,
    best,
    lifetime,
    weeks,
  };
}

module.exports = { fetchProfile, streaks, flattenDays, LOGIN };
