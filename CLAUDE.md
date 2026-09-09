# d3scores

## Goal

A public website for live NCAA Division III football scores, and eventually live win probability. See `PLAN.md` for the full roadmap — read it alongside this file.

1. **Ship first:** an all-of-D3 scoreboard, deployed at a real URL, defaulting to the Landmark view. Mobile-first, plain HTML/CSS, no framework, no database.
2. **Then:** per-game detail (box score + scoring summary).
3. **Then:** historical play-by-play collection and parsing.
4. **Only then:** the win probability model.

Nothing from step 3 or 4 gets touched until step 1 is live on the internet and a stranger has used it. The model is the magnet that kills this project — see "What kills this project" in PLAN.md.

**Scope was widened from Landmark-only to all of D3 on 2026-09-08**, because one scoreboard request returns all 117 D3 games anyway. Landmark is a client-side filter, not a separate fetch.

## Who I am

Max — Business Analytics student, **not** a CS major. When you write code here:

- Explain your reasoning as you go, before and after the code, not just in comments.
- If I ask "what does that do," answer line by line like I've never written Python. That's not a delay, it's the point — I have to maintain this.
- Say when you're unsure. "I don't know, let's test it" is a valid answer from either of us.
- If you try the same fix three times and it keeps failing, stop and explain what you think is actually broken before trying a fourth.

## Session ritual

Read this file first. Update the "What we learned" section before the session ends. Every time. That habit is what decides whether this project is alive in week 4.

---

## Data source — VALIDATED 2026-09-08

**Use the hosted API. Do not self-host `henrygd/ncaa-api` unless it goes down.**

Base URL: `https://ncaa-api.henrygd.me`

No API key. No auth. Returns JSON. All four endpoints below were tested live and returned real D3 football data.

| What | Endpoint | Status |
|---|---|---|
| Scoreboard | `/scoreboard/football/d3/{year}/{week:02d}/all` | ✅ works |
| Box score | `/game/{gameID}/boxscore` | ✅ works |
| Play-by-play | `/game/{gameID}/play-by-play` | ✅ works |
| Scoring summary | `/game/{gameID}/scoring-summary` | ✅ works |
| Team stats | `/game/{gameID}/team-stats` | ✅ works |

Week is zero-padded (`01`, not `1`). Week 01 of 2026 returned 117 D3 games.

**Scraping Sidearm box score pages is NOT needed.** Plan B is dead. Delete it from your head.

### Scoreboard shape

```
games[] → game → { gameID, startDate, startTime, gameState, url,
                   home: { score, names{short,char6,seo}, winner, conferences[] },
                   away: { ...same... } }
```

- `gameState` is `"pre"` / `"live"` / `"final"`.
- `conferences[].conferenceSeo` is **per team and accurate** — Juniata → `landmark`, Gettysburg → `centennial`, Keystone → `diii-independent`. Filter Landmark games on this field. Do not hardcode a school list.
- Caution: `gameState` was `"pre"` on at least one already-played game that had scores populated. Trust the scores, not the state, when scores are non-empty.

### Play-by-play shape

```
periods[] → { periodNumber, periodDisplay, playbyplayStats[] }
  playbyplayStats[] → { clock, teamId, plays[] }
    plays[] → { playText, driveText, homeScore, visitorScore, clock }
```

Example play:

```json
{ "playText": "Ethan Eisenberg pass complete to Brysen Delaney for 5 yards to the JUNIATA40 (Justin Bardo).",
  "driveText": "2 and 10 at 35", "homeScore": 0, "visitorScore": 0, "clock": "" }
```

### ⚠️ Three known defects in the play-by-play — these matter for the model

1. **The running score is broken.** In the test game, all 209 plays report `homeScore: 0, visitorScore: 0`. The final was Gettysburg 24, Juniata 7. **The score fields are unusable.** Score state has to be reconstructed — either by parsing `TOUCHDOWN` / `FIELD GOAL` / `safety` / PAT text out of `playText` in order, or by cross-referencing `/scoring-summary`, which does return correct per-quarter scoring.
2. **`clock` is mostly empty.** It's populated at drive starts and on scoring plays, blank on most snaps. Time remaining has to be interpolated or carried forward from the last known clock.
3. **`driveText` doesn't say whose side of the field.** `"1 and 12 at 2"` was followed by a 98-yard touchdown run — so "at 2" meant the offense's own 2. Side of field has to come from parsing the yard-line token in `playText` (e.g. `JUNIATA35`, `GETTYSBU42`) against which team has the ball.

Down and distance parse cleanly from `driveText` via `"{down} and {distance} at {yardline}"`.

**Net:** every input a win probability model needs is obtainable, but none of it arrives ready to use. Budget a real parsing/reconstruction layer between the API and the model. That work is not scoped yet and does not start until the scoreboard ships.

### Reference game saved

`game_6606156_play_by_play.json` and `game_6606156_boxscore.json` — Gettysburg 24 @ Juniata 7, 09/03/2026, 209 plays. Use this as the fixture for any parser work so you're not hammering the API in a loop.

---

## What we learned

### 2026-09-08 — Phase 0 validation

- Hosted `ncaa-api` returns D3 football scoreboards, box scores, **and** play-by-play. All three questions answered yes. Phase 0 passed on path A.
- No scraping required. No local install required.
- Landmark teams are identifiable straight from the API via `conferenceSeo == "landmark"`.
- Play-by-play running score is broken (always 0-0); clock is sparse; field position is ambiguous. See defects above.
- One full game saved to disk as a fixture.

### 2026-09-08 (later) — scope and architecture decided

- One scoreboard call returns **117 games, 232 teams, 30 conferences**. All-of-D3 costs the same as Landmark-only. Scope widened accordingly.
- **The API sends no CORS headers.** A browser cannot call it directly. v1 therefore needs a thin serverless proxy — see PLAN.md. This is the single most important architectural constraint.
- `/standings/football/d3/2026` returns **500**. `/rankings/football/d3` returns 200 but is **stale** (data "through Nov 15, 2025"). Build neither feature on this API. Compute standings from game results if wanted.
- No database in v1. SQLite/Postgres arrives in Phase 3, for accumulating play-by-play.
- Decision: deploy to Vercel or Cloudflare Pages, free tier. Fallback if that fights us: GitHub Actions writing `data.json` every 5 min + GitHub Pages, accepting a 5-minute lag.

### 2026-09-08 (later still) — Phase 1 step 1 SHIPPED

**The site is live: https://d3scores.vercel.app** — placeholder page only, no features. Repo: https://github.com/maxpb1007-boop/d3scores (public, branch `main`).

The deploy loop is proven. `git push` → Vercel rebuilds automatically. Nothing else to configure.

Machine setup, so a future session doesn't rediscover it:

- **Node v24.20.0 / npm 11.19.0, installed via nvm**, not Homebrew. Homebrew is NOT installed and isn't needed. nvm lives in `~/.nvm` and is loaded by `~/.zshrc`, which did not exist before this session and had to be created by hand — the nvm installer skipped it and silently left Node working in one terminal only.
- **`gh` (GitHub CLI) v2.100.0 is at `.tools/gh` inside this repo, gitignored.** Invoke it as `./.tools/gh` from the project root; it is not on PATH. It's there because the official `.pkg` triggered a Gatekeeper "unidentified developer" block, so we downloaded the `.zip` build with `curl` and extracted it — files fetched via curl skip the quarantine flag entirely. Authenticated as `maxpb1007-boop` over HTTPS with git credential helper enabled, so plain `git push` needs no password.
- Vercel project settings: **Framework Preset = "Other", build command and output directory empty.** Correct for plain HTML; filling those in is the usual way this breaks.
- git identity: `Max <maxpb1007@gmail.com>`, set globally.

Process note: several steps failed on the first attempt (Homebrew command with no Homebrew, Gatekeeper block, sandbox refusing writes outside the project folder). None were data problems — all environment setup. The API work from earlier sessions still stands untouched.

### 2026-09-08 (later still) — Phase 1 step 2 SHIPPED

**The proxy is live: https://d3scores.vercel.app/api/scoreboard** — see `api/scoreboard.js`.

Verified live: 117 games with no params, 106 with `?week=02`, `400` on malformed year/week, `access-control-allow-origin: *` present, and `x-vercel-cache: HIT` on repeat requests. The CORS wall is gone; the browser can now read scores.

Notes for future work on this file:

- **Use `module.exports`, not `export default`.** There is no `package.json`, so Vercel treats `.js` as CommonJS. `export default` will crash the function. If a `package.json` with `"type": "module"` is ever added, this flips.
- Year and week are regex-validated as digits *before* being interpolated into the upstream URL. Keep that. Without it the endpoint is an open proxy.
- `s-maxage=60` matches upstream's own 60s cache. Vercel strips `s-maxage` from the response header (it shows as bare `public`) and applies it internally — confirmed working via `x-vercel-cache: HIT`, so don't "fix" the missing header.
- Upstream week 01 = 117 games, week 02 = 106 games, as of 2026-09-08. Useful sanity numbers.
- The handler can be tested locally with plain `node` by passing a fake `{ query }` and a stub `res` with `setHeader`/`status`/`json`. No `vercel dev` and no npm install required. Do this before deploying.

**Next session starts with:** Phase 1, step 3 — `index.html` fetches `/api/scoreboard` and renders games grouped by conference (teams, scores, status, clock). Then step 4, the conference filter defaulting to Landmark. Then step 5, 60s auto-refresh.
