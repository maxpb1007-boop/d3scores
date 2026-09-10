// Proxies the NCAA scoreboard API so the browser can read it.
//
// The upstream API sends no Access-Control-Allow-Origin header, so a page on
// d3scores.vercel.app cannot fetch it directly. This function fetches it
// server-side (where CORS does not apply) and re-serves it with that header.
//
// Request:  /api/scoreboard?year=2026&week=02
// Upstream: https://ncaa-api.henrygd.me/scoreboard/football/d3/{year}/{week}/all

const UPSTREAM = "https://ncaa-api.henrygd.me";

module.exports = async function handler(req, res) {
  const year = String(req.query.year ?? "2026");
  const week = String(req.query.week ?? "01");

  // Only ever interpolate digits into the upstream URL. Without this check the
  // endpoint could be pointed at arbitrary upstream paths by anyone who finds it.
  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(week)) {
    res.status(400).json({ error: "year must be 4 digits, week must be 2 digits" });
    return;
  }

  const url = `${UPSTREAM}/scoreboard/football/d3/${year}/${week}/all`;

  // One dropped request used to become a failed poll. This is the endpoint the
  // whole site refreshes from every 60 seconds during a game, so a single blip
  // upstream was the difference between live scores and an error. Two attempts,
  // matching what season/team/roster already do.
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const upstream = await fetch(url);

      if (!upstream.ok) {
        lastError = `upstream returned ${upstream.status}`;
        // 4xx means the request itself is wrong; retrying will not help.
        if (upstream.status < 500) break;
      } else {
        const data = await upstream.json();

        res.setHeader("Access-Control-Allow-Origin", "*");
        // Match the upstream's own 60s cache: Vercel serves the cached copy to
        // everyone inside that window, so a busy Saturday is still one call per
        // minute no matter how many people are watching.
        //
        // The long stale-while-revalidate is deliberate. If upstream goes down
        // mid-game, Vercel keeps serving the last good scoreboard for ten
        // minutes while it retries, instead of the site failing outright. That
        // is only safe because `fetchedAt` below lets the page say how old the
        // scores actually are — silently serving stale scores as current would
        // be worse than an error.
        res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");
        res.status(200).json({ ...data, fetchedAt: Date.now() });
        return;
      }
    } catch (err) {
      lastError = String(err);
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 300));
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(502).json({ error: "could not reach upstream", detail: lastError, url });
};
