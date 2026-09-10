// One team's season: header, record and full schedule.
//
// The roster deliberately is NOT here — it lives in /api/roster, because the
// two cannot fit in one function. Measured 2026-09-09 against a completed
// season: the week walk costs 3.3s and sixteen box scores cost 6.8s, and both
// refuse to go faster (see the concurrency note below). Together that is 10.1s
// against Vercel's 10s ceiling, so a full-season team page would have timed
// out. Split in two, each half is comfortably inside it, and the page can show
// the schedule immediately while the roster arrives.
//
// Request: /api/team?seo=juniata&year=2026

const UPSTREAM = "https://ncaa-api.henrygd.me";
const MAX_WEEK = 16;

// Every team needs the same sixteen week scoreboards, so without this each team
// page pays the same 3.3s walk over again. Module scope survives between
// invocations while Vercel keeps the instance warm, which turns the second and
// later requests into roughly one second. A cold start still pays full price.
//
// Measured 2026-09-09: concurrency is NOT the answer here. At four parallel
// requests the walk is 3.3s with zero failures; at eight it is 2.0s but drops
// six weeks, and at sixteen it loses eleven. The failures are silent, which is
// exactly how the schedule-strength numbers went wrong once before. Four stays.
const CACHE = new Map();          // url -> { at, data }
const CACHE_TTL = 10 * 60 * 1000;

// Fanning out to this API unthrottled silently loses responses — that bug made
// the schedule-strength numbers confidently wrong once already. Everything here
// goes through batches with a retry, and failures are counted and returned so
// the page can admit the data is partial.
async function getJson(url) {
  const hit = CACHE.get(url);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(url);
      if (r.ok) {
        const data = await r.json();
        CACHE.set(url, { at: Date.now(), data });
        return data;
      }
    } catch { /* fall through to retry */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  // Deliberately not cached: a failure should be retried on the next request,
  // not remembered for ten minutes.
  return null;
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

module.exports = async function handler(req, res) {
  const seo = String(req.query.seo ?? "");
  const year = String(req.query.year ?? "2026");

  // Validated before going anywhere near an upstream URL. Without this the
  // endpoint is an open proxy.
  if (!/^[a-z0-9-]{2,40}$/.test(seo)) {
    res.status(400).json({ error: "seo must be lowercase letters, digits and hyphens" });
    return;
  }
  if (!/^\d{4}$/.test(year)) {
    res.status(400).json({ error: "year must be 4 digits" });
    return;
  }

  try {
    const weeks = Array.from({ length: MAX_WEEK }, (_, i) => String(i + 1).padStart(2, "0"));

    // Every week has to be checked, because a team's games are scattered across
    // them and there is no per-team schedule endpoint. Stop once a whole batch
    // comes back empty, so mid-season doesn't pay for the unplayed weeks.
    const boards = [];
    let weeksFailed = 0;
    let seenGames = false;
    for (let i = 0; i < weeks.length; i += 4) {
      const batch = await Promise.all(
        weeks.slice(i, i + 4).map((wk) =>
          getJson(`${UPSTREAM}/scoreboard/football/d3/${year}/${wk}/all`)
        )
      );
      weeksFailed += batch.filter((b) => b === null).length;
      boards.push(...batch);
      const hadGames = batch.some((d) => d && d.games && d.games.length);
      if (hadGames) seenGames = true;
      else if (seenGames) break;
    }

    let team = null;
    const gameList = [];

    for (const data of boards) {
      if (!data || !data.games) continue;
      for (const { game: g } of data.games) {
        const isHome = g.home.names.seo === seo;
        const isAway = g.away.names.seo === seo;
        if (!isHome && !isAway) continue;

        const me = isHome ? g.home : g.away;
        const them = isHome ? g.away : g.home;
        if (!team) {
          team = {
            seo,
            name: me.names.short,
            conf: (me.conferences || []).map((c) => c.conferenceSeo).find(Boolean) || "",
          };
        }

        const played = me.score !== "" && them.score !== "";
        const final =
          g.gameState === "final" || g.finalMessage === "FINAL" || g.currentPeriod === "FINAL";
        const mine = num(me.score);
        const theirs = num(them.score);

        gameList.push({
          gameID: g.gameID,
          startDate: g.startDate,
          startTime: g.startTime,
          startTimeEpoch: g.startTimeEpoch,
          home: isHome,
          opponent: { seo: them.names.seo, name: them.names.short },
          score: played ? mine : null,
          oppScore: played ? theirs : null,
          // Only a finished game counts as a result. The feed leaves some games
          // stuck mid-quarter forever, and those have no winner.
          result: final && played ? (mine > theirs ? "w" : mine < theirs ? "l" : "t") : null,
          final,
        });
      }
    }

    if (!team) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(404).json({ error: "no games found for that team", seo, year });
      return;
    }

    gameList.sort((a, b) => num(a.startTimeEpoch) - num(b.startTimeEpoch));

    const record = { w: 0, l: 0, t: 0 };
    for (const g of gameList) {
      if (g.result === "w") record.w++;
      else if (g.result === "l") record.l++;
      else if (g.result === "t") record.t++;
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
    res.status(200).json({
      ...team,
      year,
      record,
      games: gameList,
      // The ids the page should hand to /api/roster. Only finished games have a
      // box score worth reading.
      played: gameList.filter((g) => g.final && g.score !== null).map((g) => g.gameID),
      // Surfaced so the page can say the schedule is incomplete rather than look
      // authoritative with weeks missing.
      weeksFailed,
    });
  } catch (err) {
    res.status(502).json({ error: "could not build team data", detail: String(err) });
  }
};
