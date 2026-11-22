import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useDelayRender } from "remotion";
import { montserrat } from "./fonts";

/**
 * A CanvasTexture for posters, screens and the sky.
 *
 * Gotcha this solves: @remotion/three only redraws the 3D scene when the frame number changes.
 * If a texture is drawn after the font loads, the frame has already been captured with a black
 * texture. So: draw immediately, redraw once the font is ready, force an R3F redraw with
 * advance(), and only then release the frame (continueRender).
 */
export const useCanvasTexture = (key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
  const { delayRender, continueRender } = useDelayRender();
  const advance = useThree((s) => s.advance);
  const [handle] = useState(() => delayRender(`canvas texture ${key}`));
  const { tex, ctx } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext("2d")!;
    draw(c);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return { tex: t, ctx: c };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, w, h]);
  useEffect(() => {
    let live = true;
    montserrat.waitUntilDone().then(() => {
      if (!live) return;
      ctx.clearRect(0, 0, w, h);
      draw(ctx);
      tex.needsUpdate = true;
      requestAnimationFrame(() => {
        advance(performance.now());
        continueRender(handle);
      });
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex]);
  return tex;
};

export const roundRect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
};
