// Season-to-date records and strength of schedule for every D3 team.
//
// Why this exists as a serverless function rather than in the browser: it needs
// every week's scoreboard, which is ~16 upstream requests. Doing that from the
// page would mean 16 round trips on every visit. Here it's one request for the
// browser, and Vercel caches the result.
//
// The upstream /standings endpoint returns 500, so records are computed from
// results. See CLAUDE.md.
//
// Request: /api/season?year=2026

const UPSTREAM = "https://ncaa-api.henrygd.me";
const MAX_WEEK = 16;

// D3 teams schedule opponents from other divisions, and those opponents turn up
// in this feed carrying only the one game they played against D3. Bucknell
// looked like a 1-0 team with a perfect record. Ranking is therefore restricted
// to these conference slugs, and out-of-division opponents are left out of the
// opponents'-record maths entirely — which is also what the NCAA does for D3.
const D3_CONFERENCES = new Set([
  "american-rivers", "asc", "cciw", "centennial", "cne", "diii-independent",
  "empire-8", "hcac", "landmark", "liberty-league", "mascac", "miac",
  "michigan-intercol. ath. assn.", "middle-atlantic", "mwc", "nacc", "ncac",
  "newmac", "njac", "nwc", "oac", "odac", "pac", "saa", "scac", "sciac",
  "umac", "usa-south", "wiac",
]);

const isD3 = (conf) => D3_CONFERENCES.has(conf);

const pct = (w, l, t) => {
  const games = w + l + t;
  return games ? (w + t / 2) / games : 0;
};

module.exports = async function handler(req, res) {
  const year = String(req.query.year ?? "2026");
  if (!/^\d{4}$/.test(year)) {
    res.status(400).json({ error: "year must be 4 digits" });
    return;
  }

  const weeks = Array.from({ length: MAX_WEEK }, (_, i) => String(i + 1).padStart(2, "0"));

  // Firing all 16 at once gets throttled upstream and silently loses weeks,
  // which produced confidently wrong records. Four at a time, with one retry.
  async function fetchWeek(wk) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetch(`${UPSTREAM}/scoreboard/football/d3/${year}/${wk}/all`);
        if (r.ok) return await r.json();
      } catch { /* fall through to retry */ }
      await new Promise((r) => setTimeout(r, 250));
    }
    return null;
  }

  // Mid-season, the weeks after the current one are empty, and fetching all 16
  // every time pushed this close to Vercel's 10s function limit. Stop once a
  // whole batch comes back with no games, having already seen some.
  async function fetchSeason(list, size) {
    const out = [];
    let seenGames = false;
    for (let i = 0; i < list.length; i += size) {
      const batch = await Promise.all(list.slice(i, i + size).map(fetchWeek));
      out.push(...batch);
      const batchHadGames = batch.some((d) => d && d.games && d.games.length);
      if (batchHadGames) seenGames = true;
      else if (seenGames) break;
    }
    return out;
  }

  try {
    const responses = await fetchSeason(weeks, 4);
    const weeksFailed = responses.filter((r) => r === null).length;

    // seo -> { name, conf, w, l, t, opponents: [{ seo, result }] }
    const teams = new Map();
    const seen = (side) => {
      const seo = side.names.seo;
      if (!teams.has(seo)) {
        teams.set(seo, {
          seo,
          name: side.names.short,
          conf: (side.conferences || []).map(c => c.conferenceSeo).find(Boolean) || "",
          w: 0, l: 0, t: 0,
          opponents: [],
        });
      }
      return teams.get(seo);
    };

    let counted = 0;
    let weeksWithResults = 0;

    for (const data of responses) {
      if (!data || !data.games) continue;
      let anyThisWeek = false;

      for (const { game: g } of data.games) {
        const hs = g.home.score, as = g.away.score;
        if (hs === "" || as === "") continue;          // not played
        const h = Number(hs), a = Number(as);
        if (!Number.isFinite(h) || !Number.isFinite(a)) continue;

        // Trust scores over gameState, which is unreliable, but require the
        // game to actually be over before it counts toward a record.
        const finished = g.gameState === "final" || g.finalMessage === "FINAL" || g.currentPeriod === "FINAL";
        if (!finished) continue;

        const home = seen(g.home), away = seen(g.away);
        if (h > a) { home.w++; away.l++; home.opponents.push({ seo: away.seo, r: "w" }); away.opponents.push({ seo: home.seo, r: "l" }); }
        else if (a > h) { away.w++; home.l++; away.opponents.push({ seo: home.seo, r: "w" }); home.opponents.push({ seo: away.seo, r: "l" }); }
        else { home.t++; away.t++; home.opponents.push({ seo: away.seo, r: "t" }); away.opponents.push({ seo: home.seo, r: "t" }); }

        counted++;
        anyThisWeek = true;
      }
      if (anyThisWeek) weeksWithResults++;
    }

    // Opponents' winning percentage, with the games against this team removed —
    // otherwise beating someone lowers their record and so lowers your own
    // strength of schedule.
    const owpOf = (team) => {
      const vals = [];
      for (const { seo, r } of team.opponents) {
        const o = teams.get(seo);
        if (!o || !isD3(o.conf)) continue;   // out-of-division records are not comparable
        const w = o.w - (r === "l" ? 1 : 0);
        const l = o.l - (r === "w" ? 1 : 0);
        const t = o.t - (r === "t" ? 1 : 0);
        if (w + l + t === 0) continue;                 // only ever played this team
        vals.push(pct(w, l, t));
      }
      return vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : 0;
    };

    const owp = new Map();
    for (const team of teams.values()) owp.set(team.seo, owpOf(team));

    const rows = [...teams.values()].filter(t => isD3(t.conf)).map((team) => {
      const oppOwps = team.opponents
        .filter(o => teams.has(o.seo) && isD3(teams.get(o.seo).conf))
        .map(o => owp.get(o.seo))
        .filter(v => v !== undefined);
      const oowp = oppOwps.length ? oppOwps.reduce((x, y) => x + y, 0) / oppOwps.length : 0;
      const o = owp.get(team.seo) || 0;
      return {
        seo: team.seo,
        name: team.name,
        conf: team.conf,
        w: team.w, l: team.l, t: team.t,
        gp: team.w + team.l + team.t,
        wp: Number(pct(team.w, team.l, team.t).toFixed(4)),
        owp: Number(o.toFixed(4)),
        oowp: Number(oowp.toFixed(4)),
        // The usual RPI weighting for schedule strength: opponents count twice
        // as much as opponents' opponents.
        sos: Number(((2 * o + oowp) / 3).toFixed(4)),
        // How many of this team's games were against D3 opposition. When it's
        // 0, strength of schedule is undefined rather than zero.
        d3Games: team.opponents.filter(x => teams.has(x.seo) && isD3(teams.get(x.seo).conf)).length,
      };
    }).sort((x, y) => y.sos - x.sos);

    res.setHeader("Access-Control-Allow-Origin", "*");
    // Results only change on game days, so this can cache far longer than the
    // live scoreboard does.
    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
    res.status(200).json({
      year,
      gamesCounted: counted,
      weeksWithResults,
      // Surfaced deliberately: if a week failed to load, every record below is
      // incomplete and the page should say so rather than look authoritative.
      weeksFailed,
      teams: rows.length,
      data: rows,
    });
  } catch (err) {
    res.status(502).json({ error: "could not build season data", detail: String(err) });
  }
};
