// Render several stills from one bundle (much faster than `remotion still` per image).
// Usage: node scripts/stills.mjs Comp:frame:out.png [Comp:frame:out.png ...] [--scale=0.5]
// Uses the same browser + GL settings as remotion.config.ts.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

process.env.TMPDIR = path.resolve("tmp");
fs.mkdirSync("tmp", { recursive: true });
const args = process.argv.slice(2);
const scale = Number((args.find((a) => a.startsWith("--scale=")) ?? "--scale=1").split("=")[1]);
const jobs = args.filter((a) => !a.startsWith("--")).map((a) => a.split(":"));
const BROWSER =
  process.env.REMOTION_BROWSER ??
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";

const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), outDir: path.resolve("tmp/bundle-stills") });
const browser = await openBrowser("chrome", { browserExecutable: BROWSER, chromiumOptions: { gl: "swangle" } });
for (const [id, frame, out] of jobs) {
  const t = Date.now();
  const composition = await selectComposition({ serveUrl, id, puppeteerInstance: browser, chromiumOptions: { gl: "swangle" } });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await renderStill({
    composition, serveUrl, output: out, frame: Number(frame), scale, puppeteerInstance: browser,
    chromiumOptions: { gl: "swangle" }, ...(out.endsWith(".png") ? { imageFormat: "png" } : { imageFormat: "jpeg", jpegQuality: 88 }),
    overwrite: true, timeoutInMilliseconds: 120000,
  });
  console.log(`${id} @${frame} -> ${out} (${((Date.now() - t) / 1000).toFixed(1)}s)`);
}
await browser.close({ silent: true });
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
