import React from "react";
import * as THREE from "three";
import { box, rbox, cyl, plane, sphere } from "../lib/geometry";
import { mat, glow } from "../lib/materials";
import { useCanvasTexture } from "../lib/canvasTex";
import { V3 } from "../characters/types";

/** A box mesh. Everything in the sets is made of these. */
export const B: React.FC<{ s: V3; p: V3; c: string; r?: V3; shadow?: boolean; rounded?: number; emissive?: boolean }> = ({
  s, p, c, r, shadow = true, rounded, emissive,
}) => (
  <mesh
    geometry={rounded ? rbox(s[0], s[1], s[2], rounded, 2) : box(s[0], s[1], s[2])}
    material={emissive ? glow(c) : mat(c)}
    position={p}
    rotation={r}
    castShadow={shadow}
    receiveShadow
  />
);

export const Cyl: React.FC<{ r: number; h: number; p: V3; c: string; rot?: V3; seg?: number }> = ({ r, h, p, c, rot, seg = 8 }) => (
  <mesh geometry={cyl(r, r, h, seg)} material={mat(c)} position={p} rotation={rot} castShadow receiveShadow />
);

/** Checkerboard floor of square tiles (two tones). */
export const TileFloor: React.FC<{ nx: number; nz: number; size: number; a: string; b: string; y?: number; z0?: number }> = ({
  nx, nz, size, a, b, y = 0, z0 = 0,
}) => {
  const tiles: React.ReactNode[] = [];
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) {
      tiles.push(
        <mesh
          key={`${i}-${j}`}
          geometry={box(size * 0.995, 0.05, size * 0.995)}
          material={mat((i + j) % 2 ? a : b)}
          position={[(i - nx / 2 + 0.5) * size, y - 0.025, z0 + (j - nz / 2 + 0.5) * size]}
          receiveShadow
        />,
      );
    }
  return (
    <group>
      <mesh geometry={box(nx * size, 0.04, nz * size)} material={mat("#555")} position={[0, y - 0.06, z0]} />
      {tiles}
    </group>
  );
};

/** Sky dome with a vertical gradient (unlit, ignores fog). */
export const SkyDome: React.FC<{ top: string; mid: string; bottom: string; radius?: number }> = ({ top, mid, bottom, radius = 160 }) => {
  const tex = useCanvasTexture(`sky-${top}-${mid}-${bottom}`, 8, 256, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, top);
    g.addColorStop(0.48, mid);
    g.addColorStop(0.55, bottom);
    g.addColorStop(1, bottom);
    c.fillStyle = g;
    c.fillRect(0, 0, 8, 256);
  });
  const m = React.useMemo(() => new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, toneMapped: false }), [tex]);
  return <mesh geometry={sphere(radius, 16, 12)} material={m} />;
};

/** Wall clock reading a given time (hands are boxes). */
export const WallClock: React.FC<{ p: V3; h?: number; m?: number; r?: V3 }> = ({ p, h = 10, m = 10, r }) => {
  const ha = -((h % 12) + m / 60) / 12 * Math.PI * 2;
  const ma = -(m / 60) * Math.PI * 2;
  return (
    <group position={p} rotation={r}>
      <Cyl r={0.33} h={0.06} p={[0, 0, 0]} c="#2B2B33" rot={[Math.PI / 2, 0, 0]} seg={12} />
      <Cyl r={0.29} h={0.065} p={[0, 0, 0.003]} c="#FAFAF5" rot={[Math.PI / 2, 0, 0]} seg={12} />
      {Array.from({ length: 12 }).map((_, i) => (
        <B key={i} s={[0.02, 0.05, 0.01]} p={[Math.sin((i / 12) * Math.PI * 2) * 0.24, Math.cos((i / 12) * Math.PI * 2) * 0.24, 0.04]} r={[0, 0, -(i / 12) * Math.PI * 2]} c="#333" shadow={false} />
      ))}
      <group rotation={[0, 0, ha]} position={[0, 0, 0.045]}>
        <B s={[0.03, 0.15, 0.01]} p={[0, 0.07, 0]} c="#222" shadow={false} />
      </group>
      <group rotation={[0, 0, ma]} position={[0, 0, 0.05]}>
        <B s={[0.02, 0.22, 0.01]} p={[0, 0.1, 0]} c="#222" shadow={false} />
      </group>
    </group>
  );
};

/** Unlit textured plane, for posters and screens drawn with canvas. */
export const Poster: React.FC<{ p: V3; w: number; h: number; id: string; draw: (c: CanvasRenderingContext2D, W: number, H: number) => void; r?: V3; lit?: boolean }> = ({
  p, w, h, id, draw, r, lit = true,
}) => {
  const W = 256, H = Math.round((256 * h) / w);
  const tex = useCanvasTexture(id, W, H, (c) => draw(c, W, H));
  const m = React.useMemo(
    () => (lit ? new THREE.MeshLambertMaterial({ map: tex }) : new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })),
    [tex, lit],
  );
  return <mesh geometry={plane(w, h)} material={m} position={p} rotation={r} receiveShadow />;
};
