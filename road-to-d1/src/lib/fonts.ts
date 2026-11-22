import { continueRender, delayRender, staticFile } from "remotion";

/*
 * Montserrat (variable, weights 100-900, latin) served from public/fonts/.
 * Why local: the render browser cannot reach fonts.gstatic.com through the VM proxy, so
 * @remotion/google-fonts hangs. The file is the exact Google Fonts woff2 (OFL licence),
 * downloaded once with curl. Rendering is blocked until it loads, so frame 0 never shows
 * a fallback font.
 */
export const FONT = "Montserrat";

let promise: Promise<void> | null = null;
const load = () => {
  if (!promise) {
    const handle = delayRender("Loading Montserrat");
    const face = new FontFace(FONT, `url(${staticFile("fonts/Montserrat-latin-var.woff2")}) format("woff2")`, {
      weight: "100 900",
      style: "normal",
    });
    promise = face.load().then((f) => {
      (document.fonts as unknown as { add: (f: FontFace) => void }).add(f);
      continueRender(handle);
    });
  }
  return promise;
};
if (typeof document !== "undefined") load();

export const montserrat = { waitUntilDone: load };
