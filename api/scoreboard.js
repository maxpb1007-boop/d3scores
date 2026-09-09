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

  try {
    const upstream = await fetch(url);

    if (!upstream.ok) {
      res.status(502).json({ error: `upstream returned ${upstream.status}`, url });
      return;
    }

    const data = await upstream.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    // Match the upstream's own 60s cache. Vercel serves the cached copy to
    // everyone during that window, so a busy Saturday is still one call per minute.
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: "could not reach upstream", detail: String(err) });
  }
};
