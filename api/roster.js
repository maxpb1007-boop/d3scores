// Every player who has appeared for a team this season, with season totals.
//
// This is NOT a roster in the sense a school publishes one. There is no roster
// endpoint anywhere in this API — its own validator lists the only routes it
// has: `Expected ("standings" | "rankings" | "history" | "stats")`. So the list
// here is reconstructed from box scores, and it therefore contains exactly the
// players who recorded a stat in a finished game. Anyone who has not played
// does not appear, and there is no position, class year, height, weight or
// hometown to be had. The page says all of that out loud rather than passing
// this off as a team roster.
//
// It takes game ids rather than looking them up, because /api/team has already
// walked the season to build the schedule and repeating that walk here would
// push the pair past Vercel's 10s function limit.
//
// Request: /api/roster?seo=juniata&games=6606156,6606157

const UPSTREAM = "https://ncaa-api.henrygd.me";

// A completed D3 season is twelve games, plus up to five playoff rounds. Twenty
// is generous and stops the parameter being used to make us fetch arbitrarily.
const MAX_GAMES = 20;

const CACHE = new Map();          // url -> { at, data }
const CACHE_TTL = 10 * 60 * 1000;

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
  return null;
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Which fields matter per category, and how to combine them across games.
// A "Long" is a single best play, so it takes the maximum; everything else is a
// counting stat and adds up. Averages are recomputed at the end rather than
// averaged, because averaging per-game averages is wrong when the attempt
// counts differ.
const CATEGORIES = {
  passing:    { sum: ["passingAttempts", "passingCompletions", "passingYards", "passingTDs", "passingInterceptions"], max: ["passingLong"] },
  rushing:    { sum: ["rushingAttempts", "rushingYards", "rushingTDs"], max: ["rushingLong"] },
  receiving:  { sum: ["receivingReceptions", "receivingYards", "receivingTDs"], max: ["receivingLong"] },
  defense:    { sum: ["totalTackles", "soloTackles", "sacks", "lossTackles", "defenseInterceptions", "fumblesForced", "fumblesRecovered"], max: [] },
  kicking:    { sum: ["fieldGoalsMade", "fieldGoalsAttempted", "patMade", "patAttempted", "kickingPts"], max: ["fieldGoalsLong"] },
  punting:    { sum: ["puntingPunts", "puntingYards"], max: ["puntingLong"] },
  kickReturn: { sum: ["kickReturns", "kickReturnYards"], max: ["kickReturnLong"] },
  puntReturn: { sum: ["puntReturns", "puntReturnYards"], max: ["puntReturnLong"] },
};

module.exports = async function handler(req, res) {
  const seo = String(req.query.seo ?? "");
  const raw = String(req.query.games ?? "");

  // Both validated before touching an upstream URL. Without this the endpoint
  // is an open proxy.
  if (!/^[a-z0-9-]{2,40}$/.test(seo)) {
    res.status(400).json({ error: "seo must be lowercase letters, digits and hyphens" });
    return;
  }
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (!ids.length || !ids.every((id) => /^\d+$/.test(id))) {
    res.status(400).json({ error: "games must be a comma-separated list of numeric game ids" });
    return;
  }
  if (ids.length > MAX_GAMES) {
    res.status(400).json({ error: `at most ${MAX_GAMES} games` });
    return;
  }

  try {
    // Four at a time. Measured 2026-09-09 over sixteen box scores: four is 6.8s
    // with zero failures, eight is 2.0s but silently loses five, and sixteen
    // loses eleven. The same throttle applies to the scoreboard endpoint. Going
    // faster here does not mean going faster, it means being wrong.
    const boxes = [];
    for (let i = 0; i < ids.length; i += 4) {
      boxes.push(...await Promise.all(
        ids.slice(i, i + 4).map((id) => getJson(`${UPSTREAM}/game/${id}/boxscore`))
      ));
    }
    const gamesFailed = boxes.filter((b) => b === null).length;

    // key -> player. Jersey number is deliberately not part of the key: it is
    // null on some lines and changes between seasons. This matches the key the
    // page already uses for followed players, so a player starred here is the
    // same player starred from a box score.
    const players = new Map();
    let color = "";
    let counted = 0;

    for (const box of boxes) {
      if (!box || !box.teams || !box.teamBoxscore) continue;
      const mine = box.teams.find((t) => t.seoname === seo);
      if (!mine) continue;
      if (!color && mine.color) color = mine.color;

      const side = box.teamBoxscore.find((t) => String(t.teamId) === String(mine.teamId));
      if (!side || !side.playerStats) continue;
      counted++;

      // A player appears once per category he recorded a stat in, so the same
      // person shows up several times in one game. Games played counts distinct
      // people per box score, not rows.
      const seenThisGame = new Set();

      for (const row of side.playerStats) {
        const last = String(row.lastName || "").trim();
        const first = String(row.firstName || "").trim();
        if (!last && !first) continue;
        const key = [seo, last.toUpperCase(), first.toUpperCase()].join("|");

        if (!players.has(key)) {
          players.set(key, {
            key,
            // Stored exactly as the API sends them, shouted, and formatted at
            // render. Storing the pretty version froze "RJ" as "Rj" once.
            firstName: first,
            lastName: last,
            number: row.number ?? null,
            games: 0,
            stats: {},
          });
        }
        const p = players.get(key);
        // The number is missing on some lines but present on others for the
        // same player, so keep the first one that actually turns up.
        if (p.number == null && row.number != null) p.number = row.number;
        if (!seenThisGame.has(key)) {
          seenThisGame.add(key);
          p.games++;
        }

        const spec = CATEGORIES[row.category];
        if (!spec) continue;
        for (const f of spec.sum) {
          if (row[f] == null || row[f] === "") continue;
          p.stats[f] = (p.stats[f] || 0) + num(row[f]);
        }
        for (const f of spec.max) {
          if (row[f] == null || row[f] === "") continue;
          p.stats[f] = Math.max(p.stats[f] || 0, num(row[f]));
        }
      }
    }

    const roster = [...players.values()].sort((a, b) => {
      // Jersey order, the way a programme reads. Players whose number never
      // appeared sort last rather than to the front as a zero would.
      const an = a.number == null ? 9999 : num(a.number);
      const bn = b.number == null ? 9999 : num(b.number);
      if (an !== bn) return an - bn;
      return a.lastName.localeCompare(b.lastName);
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
    res.status(200).json({
      seo,
      color,
      players: roster,
      gamesRequested: ids.length,
      gamesCounted: counted,
      // Surfaced so the page can admit the totals are short rather than present
      // partial numbers as a season line.
      gamesFailed,
    });
  } catch (err) {
    res.status(502).json({ error: "could not build roster", detail: String(err) });
  }
};
