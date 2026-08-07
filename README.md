<!--
  Everything visible here is rendered from source in tools/ and committed to
  assets/. To change the art, edit the generator and run `node tools/build-all.js`.

  Adding your own links: drop them into the "Elsewhere" line near the bottom.
-->

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/prabhatsharma07/prabhatsharma07/main/assets/hero-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/prabhatsharma07/prabhatsharma07/main/assets/hero-light.svg">
    <img alt="Prabhat Sharma — full-stack developer" src="https://raw.githubusercontent.com/prabhatsharma07/prabhatsharma07/main/assets/hero-dark.svg" width="100%">
  </picture>
</div>

<div align="center">

I build software end to end — the interface people touch, the services behind it,
and the infrastructure it all runs on.

</div>

<br>

### What I work on

- **Web platforms** — TypeScript and C#/.NET from the browser to the database: component UIs, typed APIs, GraphQL and REST, auth and sessions.
- **Cloud & infrastructure** — AWS, Azure and Google Cloud; containers orchestrated with Kubernetes, environments declared in Terraform.
- **DevOps & quality** — GitHub Actions and GitLab CI pipelines, linting and static-analysis gates, automated browser testing.

<br>

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/prabhatsharma07/prabhatsharma07/main/assets/stack-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/prabhatsharma07/prabhatsharma07/main/assets/stack-light.svg">
    <img alt="The stack: languages, frontend, backend, data, cloud, devops, version control and quality tooling" src="https://raw.githubusercontent.com/prabhatsharma07/prabhatsharma07/main/assets/stack-dark.svg" width="100%">
  </picture>
</div>

<br>

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/prabhatsharma07/prabhatsharma07/main/assets/activity-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/prabhatsharma07/prabhatsharma07/main/assets/activity-light.svg">
    <img alt="Contribution activity: streaks, active days and a twelve-month contribution heatmap" src="https://raw.githubusercontent.com/prabhatsharma07/prabhatsharma07/main/assets/activity-dark.svg" width="100%">
  </picture>
</div>

<br>

### Under the hood

Every image on this page is generated from source in this repository. No badge
services, no third-party stat widgets — nothing that can rate-limit, restyle
itself, or quietly go offline.

```
tools/
├─ lib/theme.js        design tokens, one set per theme
├─ lib/svg.js          dependency-free SVG writer + deterministic PRNG
├─ lib/scene.js        aurora field, blueprint grid, starfield, typewriter
├─ lib/github.js       GraphQL → contribution model (streaks, totals)
├─ build-hero.js       the banner
├─ build-stack.js      the stack board
├─ build-activity.js   the contribution dashboard
└─ build-all.js        renders every asset into assets/
```

Each asset is rendered twice — once per theme — and swapped by `<picture>` on
`prefers-color-scheme`, so the page follows your GitHub appearance setting. The
animation is plain SMIL and CSS inside the SVG: no JavaScript, no external
fonts, no network calls. Renders are deterministic, so rebuilding without new
data produces byte-identical files and commits nothing.

A scheduled GitHub Action re-renders the activity panel every day against the
GitHub GraphQL API and commits the result back.

<details>
<summary>Running it yourself</summary>

<br>

```bash
node tools/build-all.js   # writes assets/*.svg
```

With no token the activity panel renders an empty state rather than inventing
numbers. In Actions it picks up `GITHUB_TOKEN` automatically, which covers
**public** contributions.

If most of your work lives in private repositories, the public calendar will
look empty and the panel will say so. Two steps fix it:

1. Turn on **Settings → Public profile → Contributions & Activity → Include private contributions on my profile**. This is the one that matters — without it, no token will surface private work.
2. Optionally add a repository secret named `GH_PAT` holding a personal access token, so the lifetime totals count private activity too.

Then run the **profile art** workflow, or wait for the daily schedule.

</details>

<details>
<summary>Notes on what actually renders on GitHub</summary>

<br>

- All motion is **SMIL**, not CSS keyframes. Firefox has a history of not
  animating CSS inside an SVG loaded as an `<img>`, which is exactly how GitHub
  serves these; SMIL animates everywhere.
- No `<script>`, no external fonts, no external images. GitHub serves README
  SVGs under `default-src 'none'`, so anything fetched over the network
  silently fails — type uses system font stacks and the layout never depends on
  exact glyph metrics.
- Every root `<svg>` carries `width`, `height` *and* `viewBox`; without
  intrinsic sizing an SVG in an `<img>` collapses to 300×150.
- `<source>` takes `srcset`, never `src` — the quiet way theme switching breaks.
- `prefers-color-scheme` follows the **browser/OS** setting, not GitHub's theme
  dropdown, so both variants are self-contained cards that hold up on either
  background.

</details>

<br>

---

<div align="center">

**Elsewhere** · [github.com/prabhatsharma07](https://github.com/prabhatsharma07)

<sub>Every pixel above is committed to this repo —
<a href="https://github.com/prabhatsharma07/prabhatsharma07/tree/main/tools">read the source</a>.</sub>

</div>
