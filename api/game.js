// Proxies per-game endpoints so the browser can read them.
//
// Same reason as api/scoreboard.js: the upstream API sends no
// Access-Control-Allow-Origin header, so the page cannot fetch it directly.
//
// Request:  /api/game?id=6606156&resource=boxscore
// Upstream: https://ncaa-api.henrygd.me/game/{id}/{resource}

const UPSTREAM = "https://ncaa-api.henrygd.me";

// Only these may be requested. Without a whitelist, the `resource` value would
// let anyone point this endpoint at arbitrary upstream paths.
const ALLOWED = new Set(["boxscore", "scoring-summary", "team-stats", "play-by-play"]);

module.exports = async function handler(req, res) {
  const id = String(req.query.id ?? "");
  const resource = String(req.query.resource ?? "boxscore");

  if (!/^\d+$/.test(id)) {
    res.status(400).json({ error: "id must be digits" });
    return;
  }
  if (!ALLOWED.has(resource)) {
    res.status(400).json({ error: `resource must be one of: ${[...ALLOWED].join(", ")}` });
    return;
  }

  const url = `${UPSTREAM}/game/${id}/${resource}`;

  try {
    const upstream = await fetch(url);

    if (!upstream.ok) {
      res.status(502).json({ error: `upstream returned ${upstream.status}`, url });
      return;
    }

    const data = await upstream.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    // Finished games never change, but we can't tell reliably from here, so
    // this matches the scoreboard's 60s window.
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: "could not reach upstream", detail: String(err) });
  }
};
