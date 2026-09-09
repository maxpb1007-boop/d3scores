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

### Box score contents — VALIDATED 2026-09-08 (6 live games sampled)

`/game/{gameID}/boxscore` contains two things the scoreboard endpoint does not:

1. **Real school colours.** `teams[].color` is a hex string — `montclair-st` → `#D01841`, `roanoke` → `#A30046`, `olivet` → `#9f1000`. Present on **12 of 12** teams sampled. Also present: `seoname`, `name6Char`, `nameFull`, `teamId`.
   - **Harvested 2026-09-08 into `teams.js`** (6.4 KB, `window.TEAM_COLORS`, keyed by `seoname`). Regenerate with `node tools/harvest-colors.js`, which walks weeks 1-2 with a 120 ms gap between requests. **129 requests, 14 failures, 230 of 244 teams covered.** The misses are mostly non-D3 opponents (Davidson, Butler, St. Xavier, Salisbury) whose box scores 404; they fall back to neutral grey in the UI.
   - Caution: some colours are very dark (`wooster` → `#010101`, `juniata` → `#031832`). Any UI using them needs a lightness floor or they'll read as black-on-black, and two navy teams in one game will be indistinguishable.
2. **Per-player stats.** `teamBoxscore[].playerStats[]` with `firstName`, `lastName`, `number`, and category-specific fields. Categories seen: `rushing`, `passing`, `receiving`, `kicking`, `punting`, `puntReturn`, `kickReturn`, `defense`. Not every category appears in every game.
   - So stat leaders are *possible*, but cost one request per game. Division-wide leaders = 117+ requests per week. That's the accumulation problem Phase 3's database exists for.

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

### 2026-09-08 (last) — Phase 1 steps 3, 4, 5 BUILT

`index.html` now fetches `/api/scoreboard`, groups games by conference, filters (default Landmark), and reloads every 60s. Plain HTML/CSS/JS in one file, no framework, as planned.

Things the data forced, which are not obvious from reading the code:

- **`conferenceName` is empty on every team in every game.** Only `conferenceSeo` is populated. The display names in the `CONFERENCES` map in `index.html` were written by hand and are *not* authoritative — fix any that are wrong.
- **`finalMessage` is not just for finals.** A live game had `finalMessage: "1ST"`. Treating any non-empty `finalMessage` as "game over" is wrong and was a real bug caught in testing. Only `FINAL` means final.
- Confirmed again that `gameState` lies: `Wilkes 7 @ King's (PA) 0` had `gameState: "pre"` with live scores and `currentPeriod: "1ST"`. The rule used is: FINAL only when it says FINAL; otherwise any game with a score is live.
- **`contestClock` is often `"0:00"` mid-game.** Suppressed when zeroed, or every live game reads "1ST 00:00".
- The API returns games in arbitrary order. Sorted by `startTimeEpoch`.
- Week 01 spans 08/29–09/05; week 02 spans 09/10–09/12. Week number is computed from a `SEASON_START` of Aug 31 2026. **If weeks drift, that constant is the thing to fix.**
- **Games are grouped by DAY, not by conference — a deliberate deviation from PLAN.md step 3.** Conference grouping was built first and looked wrong: in week 1, 113 of 117 games are non-conference, so it produced one giant useless bucket. Day headings ("Thu, Sep 3") are what you actually scan, and conference remains available as the filter. Revert if this turns out wrong in October, when most games are conference games.
- **Do not add generated team colours.** A version with a coloured tag per team, hue derived from the team slug, was built and rejected on sight — arbitrary colours read as decoration and made the page look cheap. The API has no logos and no team colours. Real school colours would mean hand-entering 232 schools; only do that if it's actually wanted.
- A week back/forward control was added beyond the plan, because in midweek the current week has no scores yet and there'd be nothing to look at.

**Testing without a browser:** the loopback network is blocked in the agent sandbox, so local servers can't be previewed. Instead the `<script>` is extracted from `index.html` and run in `node:vm` against a fake `document` and a stubbed `fetch` reading saved JSON. That caught both real bugs above. Worth redoing whenever the render logic changes.

### 2026-09-08 (final) — ESPN-style rebuild, real colours, favourite teams

The dark theme was rejected twice as looking generic. Rebuilt light, ESPN-shaped: white cards in a responsive grid (1 / 2 / 3 columns), Barlow + Barlow Condensed, week tabs across the top, winner marked with a caret, red used only for live games and the active week.

**Favourite teams shipped.** Star on every team row. Stored in `localStorage` under `d3scores.favourites` as an array of `seoname` — browser-only, no accounts, no server, guarded in try/catch because private browsing makes `localStorage` throw. Favourited games are pinned into a "Your teams" group at the top **and removed from the day groups below**, so no game renders twice. The conference dropdown gains a "Your teams (n)" option when at least one team is followed.

Verified in a real browser: favourites survive reload, the pinned group counts match, totals stay at 117 with no duplication, and both empty states render with a way forward.

**Preview tooling note:** the local server *does* work — the first attempt failed only because the server hadn't finished starting. `preview_start` + navigating the browser to `http://localhost:8000` allows real screenshots and DOM inspection. This is the single biggest workflow improvement of the session; design work without it was guesswork. Known limitation: `preview_click` does not reach elements inside a horizontally scrolling container (the week tabs) — use `element.click()` in `preview_eval` instead.

**Next session starts with:** looking at the live site on a phone during an actual game weekend before building anything else. Phase 1 step 6 is "ship it, send the link to one person" — that is the remaining work, and it is not code. Phase 2 (game detail: box score + scoring summary) does not start until a real game weekend has been watched on this thing.
