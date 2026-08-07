// Pulls the contribution calendar and lifetime totals from GitHub's GraphQL
// API. Everything here is best-effort: if there is no token, or the request
// fails, callers get null and render the empty state rather than fabricating
// numbers.
//
// Token notes:
//   GITHUB_TOKEN (the Actions default) sees PUBLIC contributions only.
//   A user PAT also reports private contributions, but only if
//   "Include private contributions on my profile" is enabled under
//   Settings -> Public profile -> Contributions & Activity. Without that
//   setting the calendar is public-only no matter which token is used, which
//   is what `privateShared` below reports back to the renderer.

const LOGIN = process.env.PROFILE_LOGIN || 'prabhatsharma07';

const LEVELS = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];

const CALENDAR_QUERY = `query($login: String!) {
  user(login: $login) {
    name
    login
    createdAt
    contributionsCollection {
      contributionYears
      hasAnyRestrictedContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks {
          firstDay
          contributionDays { date weekday contributionCount contributionLevel }
        }
      }
    }
  }
}`;

/**
 * contributionsCollection accepts at most a one-year window, so lifetime
 * figures have to be assembled a year at a time and summed. The final window
 * is clamped to now — a `to` in the future is not something to rely on.
 */
function lifetimeQuery(years, nowIso) {
  const fields = years
    .map((y) => {
      const to = `${y}-12-31T23:59:59Z`;
      return `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${
        to > nowIso ? nowIso : to
      }") {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalIssueContributions
        restrictedContributionsCount
      }`;
    })
    .join('\n');
  return `query($login: String!) { user(login: $login) { ${fields} } }`;
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

const toDay = (d) => ({
  date: d.date,
  count: d.contributionCount,
  weekday: d.weekday,
  level: Math.max(0, LEVELS.indexOf(d.contributionLevel)),
});

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
  let data;
  try {
    data = await graphql(CALENDAR_QUERY, { login: LOGIN }, token);
  } catch (err) {
    console.warn(`[github] calendar fetch failed — rendering empty state: ${err.message}`);
    return null;
  }

  const user = data && data.user;
  if (!user) {
    console.warn('[github] no user in response — rendering empty state');
    return null;
  }

  const cc = user.contributionsCollection;
  const calendar = cc.contributionCalendar;
  const weeks = calendar.weeks.map((w) => w.contributionDays.map(toDay));
  const days = weeks.flat();
  const { current, longest } = streaks(days);

  // Years the account has contributed in, newest first per the schema.
  const years = (cc.contributionYears || []).slice().sort();
  const lifetime = { commits: 0, pullRequests: 0, reviews: 0, issues: 0, restricted: 0 };
  if (years.length) {
    try {
      const lt = await graphql(
        lifetimeQuery(years, now.toISOString().replace(/\.\d{3}Z$/, 'Z')),
        { login: LOGIN },
        token
      );
      for (const y of years) {
        const c = lt.user[`y${y}`];
        if (!c) continue;
        lifetime.commits += c.totalCommitContributions || 0;
        lifetime.pullRequests += c.totalPullRequestContributions || 0;
        lifetime.reviews += c.totalPullRequestReviewContributions || 0;
        lifetime.issues += c.totalIssueContributions || 0;
        lifetime.restricted += c.restrictedContributionsCount || 0;
      }
    } catch (err) {
      // The calendar is the important part; lifetime totals are a bonus.
      console.warn(`[github] lifetime totals unavailable: ${err.message}`);
    }
  }

  const best = days.reduce((a, b) => (b.count > a.count ? b : a), { count: 0, date: null });

  // Whether the account shares private contribution counts at all. When it
  // does not, the calendar below is public-only and the panel says so instead
  // of quietly presenting a near-empty year as the whole picture.
  const privateShared =
    !!cc.hasAnyRestrictedContributions || (cc.restrictedContributionsCount || 0) > 0;

  return {
    login: user.login,
    name: user.name,
    createdAt: user.createdAt,
    generatedAt: now.toISOString(),
    firstYear: years[0] || new Date(user.createdAt).getUTCFullYear(),
    total: calendar.totalContributions,
    activeDays: days.filter((d) => d.count > 0).length,
    trackedDays: days.length,
    currentStreak: current,
    longestStreak: longest,
    best,
    lifetime,
    privateShared,
    weeks,
  };
}

module.exports = { fetchProfile, streaks, LOGIN };
