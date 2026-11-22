import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// No GPU in the cloud VM: software WebGL. See CLAUDE.md "What we learned" for why this value.
Config.setChromiumOpenGlRenderer("swangle");
// remotion.media (Chrome Headless Shell download host) is blocked by the network allowlist.
// The VM ships a Playwright headless shell; use it. Override with REMOTION_BROWSER if it moves.
Config.setBrowserExecutable(
  process.env.REMOTION_BROWSER ??
    "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell",
);
