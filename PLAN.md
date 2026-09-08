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

Deliberately undefined. Define it after Phase 2, from things you actually wished the site did while watching a game. Ideas invented now are ideas invented without evidence.

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
