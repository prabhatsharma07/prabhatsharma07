const LOGIN = process.env.PROFILE_LOGIN || 'prabhatsharma07';
const ENDPOINT = 'https://api.github.com/graphql';
const LEVELS = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];

const CALENDAR = `query($login: String!) {
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
          contributionDays { date weekday contributionCount contributionLevel }
        }
      }
    }
  }
}`;

const lifetimeQuery = (years, until) => {
  const windows = years
    .map((year) => {
      const end = `${year}-12-31T23:59:59Z`;
      return `y${year}: contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${
        end > until ? until : end
      }") {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalIssueContributions
        restrictedContributionsCount
      }`;
    })
    .join('\n');
  return `query($login: String!) { user(login: $login) { ${windows} } }`;
};

async function query(document, token) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'profile-readme-art',
    },
    body: JSON.stringify({ query: document, variables: { login: LOGIN } }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }

  const payload = await response.json();
  if (payload.errors) {
    throw new Error(JSON.stringify(payload.errors).slice(0, 300));
  }
  return payload.data;
}

const toDay = (day) => ({
  date: day.date,
  count: day.contributionCount,
  weekday: day.weekday,
  level: Math.max(0, LEVELS.indexOf(day.contributionLevel)),
});

function streaks(days) {
  let longest = 0;
  let run = 0;
  for (const day of days) {
    run = day.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  let index = days.length - 1;
  if (index >= 0 && days[index].count === 0) index -= 1;

  let current = 0;
  while (index >= 0 && days[index].count > 0) {
    current++;
    index--;
  }

  return { current, longest };
}

function sumLifetime(user, years) {
  const totals = { commits: 0, pullRequests: 0, reviews: 0, issues: 0, restricted: 0 };
  for (const year of years) {
    const window = user[`y${year}`];
    if (!window) continue;
    totals.commits += window.totalCommitContributions || 0;
    totals.pullRequests += window.totalPullRequestContributions || 0;
    totals.reviews += window.totalPullRequestReviewContributions || 0;
    totals.issues += window.totalIssueContributions || 0;
    totals.restricted += window.restrictedContributionsCount || 0;
  }
  return totals;
}

async function fetchProfile() {
  const token = process.env.GH_PAT || process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn('[github] no GH_PAT or GITHUB_TOKEN — rendering empty state');
    return null;
  }

  const now = new Date();
  let user;
  try {
    user = (await query(CALENDAR, token)).user;
  } catch (error) {
    console.warn(`[github] calendar unavailable — rendering empty state: ${error.message}`);
    return null;
  }
  if (!user) {
    console.warn('[github] no such user — rendering empty state');
    return null;
  }

  const collection = user.contributionsCollection;
  const weeks = collection.contributionCalendar.weeks.map((week) =>
    week.contributionDays.map(toDay)
  );
  const days = weeks.flat();
  const { current, longest } = streaks(days);
  const years = [...(collection.contributionYears || [])].sort();

  let lifetime = { commits: 0, pullRequests: 0, reviews: 0, issues: 0, restricted: 0 };
  if (years.length) {
    try {
      const until = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
      const totals = await query(lifetimeQuery(years, until), token);
      lifetime = sumLifetime(totals.user, years);
    } catch (error) {
      console.warn(`[github] lifetime totals unavailable: ${error.message}`);
    }
  }

  return {
    login: user.login,
    name: user.name,
    createdAt: user.createdAt,
    generatedAt: now.toISOString(),
    total: collection.contributionCalendar.totalContributions,
    activeDays: days.filter((day) => day.count > 0).length,
    trackedDays: days.length,
    currentStreak: current,
    longestStreak: longest,
    best: days.reduce((best, day) => (day.count > best.count ? day : best), { count: 0, date: null }),
    privateShared:
      Boolean(collection.hasAnyRestrictedContributions) ||
      (collection.restrictedContributionsCount || 0) > 0,
    lifetime,
    weeks,
  };
}

module.exports = { fetchProfile, streaks, LOGIN };
