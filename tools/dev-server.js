// Local dev server. Not part of the deployed site — Vercel ignores it.
//
// Serves the static files AND routes /api/* through the real api/*.js handlers,
// so the page under test runs the same code Vercel runs. That has caught real
// bugs that a stubbed fetch would have hidden.
//
// This used to live in the agent scratchpad and was deleted three times, taking
// the ability to preview anything with it. It lives in the repo now.
//
//   node tools/dev-server.js     then open http://localhost:8000

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT) || 8000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" });
    res.end();
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    const name = url.pathname.slice("/api/".length);
    const file = path.join(ROOT, "api", `${name}.js`);
    if (!/^[a-z-]+$/.test(name) || !fs.existsSync(file)) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "no such function" }));
      return;
    }
    // Reloaded per request so edits to api/*.js take effect without a restart.
    delete require.cache[require.resolve(file)];
    const handler = require(file);

    // Vercel's request/response shape, reduced to what the handlers use.
    const fakeReq = { query: Object.fromEntries(url.searchParams), method: req.method };
    const fakeRes = {
      _status: 200,
      setHeader: (k, v) => res.setHeader(k, v),
      status(code) { this._status = code; return this; },
      json(body) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.writeHead(this._status);
        res.end(JSON.stringify(body));
      },
    };
    try {
      await handler(fakeReq, fakeRes);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(err) }));
    }
    return;
  }

  const rel = url.pathname === "/" ? "/index.html" : url.pathname;
  const file = path.normalize(path.join(ROOT, rel));
  // Directory traversal blocked: a request for /../../etc/passwd resolves
  // outside ROOT and is refused.
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found");
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => console.log(`dev server on http://localhost:${PORT}`));
