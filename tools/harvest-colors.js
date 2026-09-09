// One-time harvest: walk box scores to collect real school colours.
// Writes teams.js into the repo. Deliberately slow — this hits someone's
// free API, and CLAUDE.md says not to hammer it.
const fs = require("fs");

const BASE = "https://ncaa-api.henrygd.me";
const OUT = "/Users/claude/Documents/d3scores/teams.js";
const GAP_MS = 120;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

(async () => {
  // 1. Which teams exist, from the cheap scoreboard calls.
  const wanted = new Map();               // seo -> short name
  const gamesByWeek = {};
  for (const wk of ["01", "02"]) {
    const d = await getJSON(`${BASE}/scoreboard/football/d3/2026/${wk}/all`);
    gamesByWeek[wk] = d.games.map((x) => x.game);
    for (const g of gamesByWeek[wk]) {
      for (const side of [g.home, g.away]) {
        const seo = side.names.seo;
        if (seo) wanted.set(seo, side.names.short);
      }
    }
  }
  console.log(`teams seen across weeks 1-2: ${wanted.size}`);

  const colors = {};
  let done = 0, failed = 0;

  async function sweep(week, label) {
    const list = gamesByWeek[week];
    for (const g of list) {
      // Skip games where we already know both teams.
      const a = g.away.names.seo, h = g.home.names.seo;
      if (colors[a] && colors[h]) continue;
      try {
        const d = await getJSON(`${BASE}/game/${g.gameID}/boxscore`);
        for (const t of d.teams || []) {
          if (t.seoname && t.color && !colors[t.seoname]) colors[t.seoname] = t.color;
        }
      } catch (e) {
        failed++;
      }
      done++;
      if (done % 20 === 0) {
        console.log(`  ${label}: ${done} requests, ${Object.keys(colors).length} colours, ${failed} failures`);
      }
      await sleep(GAP_MS);
    }
  }

  await sweep("01", "week 1");
  await sweep("02", "week 2 top-up");

  const missing = [...wanted.keys()].filter((s) => !colors[s]);
  console.log(`\nrequests made : ${done}  (failures: ${failed})`);
  console.log(`colours found : ${Object.keys(colors).length}`);
  console.log(`still missing : ${missing.length}`);
  if (missing.length) console.log("  " + missing.slice(0, 25).join(", "));

  const sorted = Object.keys(colors).sort();
  const body = sorted.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(colors[k])},`).join("\n");
  fs.writeFileSync(OUT,
`// Real school colours, harvested once from /game/{id}/boxscore, which is the
// only endpoint that carries them. The scoreboard endpoint does not.
// Regenerate with the harvest script if teams are missing.
// Generated ${new Date().toISOString().slice(0, 10)} — ${sorted.length} teams.
window.TEAM_COLORS = {
${body}
};
`);
  console.log(`\nwrote ${OUT}`);
})();
