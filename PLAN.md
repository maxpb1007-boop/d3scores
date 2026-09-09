# d3scores — build plan

Written 2026-09-08, after Phase 0 validation. Every number here came from hitting the live API, not from guessing.

---

## The product, in one sentence

A public website where anyone can see live Division III college football scores, and eventually live win probability — because nobody else does this well for D3.

That last clause is the actual reason this project is worth doing. D1 has ESPN. D3 has a scattering of Sidearm pages nobody can navigate. The gap is real.

---

## What the data can support

| Fact | Number |
|---|---|
| Games returned by one scoreboard call | 117 (week 1, 2026) |
| Distinct D3 teams in that call | 232 |
| Distinct conferences | 30 |
| Landmark games in that call | 8 |
| API cache lifetime | 60 seconds |
| Cost of "all of D3" vs "Landmark only" | **identical — same single request** |

Live fields available per game: `gameState`, `currentPeriod`, `contestClock`, `startTimeEpoch`, both scores.

Endpoints that work: `/scoreboard`, `/game/{id}/boxscore`, `/game/{id}/play-by-play`, `/game/{id}/scoring-summary`, `/game/{id}/team-stats`.

Endpoints that don't: `/standings/football/d3/2026` returns 500. `/rankings/football/d3` returns 200 but is stale — it served regional rankings "through Nov 15, 2025." **Do not build a standings or rankings feature on this API.** If you want standings, compute them yourself from game results.

---

## Scope decision: v1 is all of D3

Build the full-division scoreboard, defaulting the view to Landmark. Reasons:

- The data is free either way. Filtering to 8 games throws away 109 you already fetched.
- A Landmark-only site has an audience of about six athletic departments. An all-D3 site has 232 schools' worth of players, parents, and students.
- You still get your Landmark scoreboard — it's the default filter.

The scope cost is UI, not plumbing: conference grouping, a filter control, and a mobile layout that survives 117 rows.

---

## Architecture for v1

**The problem to design around:** the API sends no `Access-Control-Allow-Origin` header. A browser cannot call it directly. Everything below is a way to solve that.

**Chosen approach — static frontend + one serverless proxy function.**

```
browser  →  your-site.vercel.app/api/scoreboard  →  ncaa-api.henrygd.me
              (serverless function, ~20 lines,          (60s cache)
               caches 60s, adds CORS)
```

- Frontend: one `index.html`, plain HTML and CSS, mobile-first. No framework.
- Backend: a single serverless function that proxies and caches. No database.
- Host: Vercel or Cloudflare Pages. Free tier. Real public URL. Deploy is `git push`.

**Why not the alternatives:**

- *Local SQLite + local HTML file* (the original plan): only runs on your laptop. Doesn't satisfy "people can see it."
- *GitHub Actions writing data.json every 5 min + GitHub Pages*: genuinely simpler and free, but caps you at a 5-minute lag. That's not "live" during a close fourth quarter. Keep it as a fallback if the serverless setup fights you.

**No database in v1.** You don't need one to show today's scores. A database arrives in Phase 2, when you start *accumulating* play-by-play for the model — that's a storage problem, and it's a different problem.

---

## Phases

### Phase 1 — Scoreboard *(target: this week, ~6–8 hours)*

Done when a stranger can open a URL on their phone and see today's D3 scores.

1. Repo + Vercel project, deployed hello-world. Get the deploy loop working before writing features.
2. Proxy function returning scoreboard JSON.
3. `index.html` renders games grouped by conference: teams, scores, status, clock.
4. Conference filter, defaulting to Landmark.
5. Auto-refresh every 60s.
6. Ship it. Send the link to one person.

**Stop here and sit with it for a week.** Resist everything below until Phase 1 is live and you've watched a real game weekend on it.

### Phase 2 — Game detail *(~4–6 hours)*

Tap a game → box score and scoring summary. Both endpoints already work and need no reconstruction. This is the highest value-per-hour work in the whole project.

### Phase 3 — Historical collection *(~10–15 hours, boring, unavoidable)*

The unglamorous prerequisite to any model.

1. Database (SQLite locally, Postgres when hosted).
2. Backfill script: walk every week of 2026, and prior seasons if available, saving raw play-by-play JSON.
3. **Parser.** This is the hard part, and it exists because of the three defects in CLAUDE.md:
   - reconstruct running score from `playText` + `/scoring-summary` (the score fields are all zero)
   - carry the clock forward across plays where it's blank
   - resolve side-of-field by matching the yard-line token in `playText` against possession
4. Validate the parser: for every game, does your reconstructed final score match the box score? That check is your whole quality bar. Don't proceed until it passes on hundreds of games.

### Phase 4 — Win probability *(a semester, honestly)*

Only after Phase 3 gives you clean, validated states. Logistic regression on down, distance, field position, score differential, and time remaining is the standard starting point and is well within Business Analytics territory. The modeling is the *easy* part. Phase 3 is where projects like this die.

### Phase 5 — "Fun things"

Originally left undefined on purpose. The ideas below were raised 2026-09-08, before a real game weekend had been watched, so treat them as candidates rather than commitments — but they're recorded so they aren't lost.

Ordered by cost, cheapest first. **The order is the recommendation.**

**The strategic question, thought through 2026-09-08: why would anyone come *back*?**

A scoreboard alone doesn't earn a second visit — a parent can text another parent. The audience for D3 scores is not general sports fans; it is **families, players, classmates and alumni attached to specific people**. That points somewhere ESPN structurally cannot go.

A D1 parent has fifteen places to see their kid's stat line. **A D3 parent has none.** The data exists — `/game/{id}/boxscore` carries per-player lines with names and jersey numbers — and nobody surfaces it.

**So the sharpest idea available is: follow a player, not just a team.** "Follow #17 Brysen Delaney" → his line every week. It needs **no database**: one box score request per followed player per week, computed on demand. Roughly 4 hours. This is the recommended next bet, and the scoreboard is best understood as how people find the site, not why they return.

**0b. Shareable links — shipped 2026-09-08.** Week, conference and game now live in the URL, so any view can be texted to someone; a shared `?game=` link opens straight to that box score. This matters because word of mouth is the only distribution this site will ever have. Static Open Graph tags were added so a pasted link isn't blank — but *per-game* previews would need server-side rendering, which v1 doesn't do.

**1. Favourite teams — cheap, do this first.**
Let someone pick teams and pin them to the top, or filter to just them. Pure front-end: store the list in `localStorage`, no backend, no new API calls, no database. A couple of hours. Highest value per hour of anything on this list, because it converts a browsing site into one people reopen.

**2. A real name — cheap, but blocking.**
"d3scores" is a working title and the URL is `d3scores.vercel.app`. Worth settling before the link gets shared widely, because changing it after people bookmark it is worse than changing it now. Renaming the Vercel project changes the subdomain; a custom domain (~$12/yr) is the durable version.

**3. Standings, division-wide and per conference — medium, and the API won't help.**
**`/standings/football/d3/2026` returns 500, and `/rankings/football/d3` is stale** (served data "through Nov 15, 2025"). Both are dead ends — see CLAUDE.md. So standings must be *computed from game results*: walk every week's scoreboard, tally win/loss per team, group by `conferenceSeo`. That's ~16 proxy calls, doable without a database but too slow to do in the browser on every page load, so it needs either a cached serverless function or a nightly job. Conference records need care: only count games where both teams share a conference.

**4. Stat leaders, per conference — expensive, but the data exists.**
Validated 2026-09-08: `/game/{id}/boxscore` does contain per-player lines (`teamBoxscore[].playerStats[]`, categories `rushing` / `passing` / `receiving` / `kicking` / `punting` / `puntReturn` / `kickReturn` / `defense`). So this is not blocked on data availability — it's blocked on request volume. Division-wide leaders mean one box score **per game**, 117+ per week, aggregated. That is precisely the accumulation problem Phase 3's database exists to solve. **Do not attempt before Phase 3.**

**0. Real team colours — cheapest of the lot, and it was missed.**
Also found 2026-09-08: box scores carry `teams[].color`, a real hex school colour, on every team sampled. Harvest them once (walk one week of box scores, build a `seoname → colour` map, commit it as a static JSON file) and the scoreboard gets genuine team identity with no ongoing request cost. Watch out for near-black colours needing a lightness floor. This is numbered 0 because it's smaller than everything above it and was only missed because nobody opened the box score endpoint.

Note the pattern: 0, 1 and 2 need no new data at runtime. 3 needs derived data. 4 needs stored data. That's also the order they should ship in.

---

## What kills this project

Ranked by how likely each one is.

1. **Building the model before the scoreboard ships.** By far the biggest risk. The model is the fun part, so it's the magnet. It also has a ten-hour data-cleaning prerequisite you'll hit three hours in, right when motivation is highest and progress stops.
2. **Never deploying.** A site on localhost is a private hobby. Deploy in Phase 1 step 1, before there's anything to deploy, so the loop is proven.
3. **Skipping the CLAUDE.md update.** Two weeks off and no notes means starting over.
4. **The API disappearing.** It's one person's free project with no SLA. Mitigation: Phase 3's raw archive means you own your history even if the source goes away. Don't over-engineer for this now — just know it.
5. **Scope creep dressed as ambition.** Other divisions, live video, betting odds, user accounts. All fine ideas. All Phase 6+.

---

## Definition of done for v1

A URL you can text to someone during a game, that loads in under two seconds on a phone, shows the correct current score, and updates itself without a refresh.

That's it. Nothing about models, nothing about other divisions.
