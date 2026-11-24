import React, { createContext, useContext, useMemo } from "react";
import * as THREE from "three";
import { plane, circle } from "../lib/geometry";
import { V3 } from "../characters/types";

/*
 * The "In This Town" star badge that floats over a head: a dark pill with 5 star slots, gold
 * for each star earned. n = 0 is Gus's "empty gray circle". The badge always faces the camera
 * (billboard), so it reads at any angle. Textures are drawn with plain canvas paths (no font),
 * once per star count, and cached for the whole render.
 */

export const CamPos = createContext<V3>([0, 1.5, 5]);

const W = 512, H = 200;
const cache = new Map<string, THREE.Texture>();

const star = (c: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  c.closePath();
};

const pill = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  const r = h / 2;
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
};

const badgeTexture = (n: number) => {
  const key = `b${n}`;
  let t = cache.get(key);
  if (t) return t;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d")!;
  if (n <= 0) {
    // Gus: an empty gray circle
    c.lineWidth = 18;
    c.strokeStyle = "#111";
    c.fillStyle = "#9AA0A8";
    c.beginPath();
    c.arc(W / 2, H / 2, 78, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillStyle = "#7C828B";
    c.beginPath();
    c.arc(W / 2, H / 2, 48, 0, Math.PI * 2);
    c.fill();
  } else {
    pill(c, 12, 22, W - 24, H - 44);
    c.fillStyle = n >= 5 ? "#2A1F05" : "#15171C";
    c.fill();
    c.lineWidth = 14;
    c.strokeStyle = n >= 5 ? "#FFD21F" : "#0A0A0A";
    c.stroke();
    for (let i = 0; i < 5; i++) {
      star(c, 76 + i * 90, H / 2, 38);
      c.fillStyle = i < n ? "#FFD21F" : "#3A3F48";
      c.fill();
      if (i < n) {
        c.lineWidth = 5;
        c.strokeStyle = "#B8860B";
        c.stroke();
      }
    }
  }
  t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(key, t);
  return t;
};

const mats = new Map<string, THREE.Material>();
const badgeMat = (n: number) => {
  const k = `m${n}`;
  let m = mats.get(k);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ map: badgeTexture(n), transparent: true, toneMapped: false, depthWrite: false });
    mats.set(k, m);
  }
  return m;
};
const haloMat = new THREE.MeshBasicMaterial({ color: "#FFE680", transparent: true, opacity: 0.4, toneMapped: false, depthWrite: false });

export const StarBadge: React.FC<{ at: V3; n: number; scale?: number; glow?: number; bob?: number }> = ({ at, n, scale = 1, glow = 0, bob = 0 }) => {
  const cam = useContext(CamPos);
  const pos: V3 = [at[0], at[1] + bob + (n <= 0 ? 0.12 : 0), at[2]];
  const q = useMemo(() => {
    const m = new THREE.Matrix4().lookAt(new THREE.Vector3(...cam), new THREE.Vector3(...pos), new THREE.Vector3(0, 1, 0));
    return new THREE.Quaternion().setFromRotationMatrix(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cam[0], cam[1], cam[2], pos[0], pos[1], pos[2]]);
  // texture is 2.56:1; the star pill fills it, the gray circle only fills the middle third
  const w = (n <= 0 ? 0.95 : 0.62) * scale;
  const h = w / 2.56;
  const hw = n <= 0 ? h * 1.15 : w;
  return (
    <group position={pos} quaternion={q}>
      {glow > 0 && (
        <mesh geometry={circle(1, 20)} material={haloMat} scale={[hw * 0.58 * (1 + glow * 0.25), h * 0.75 * (1 + glow * 0.35), 1]} position={[0, 0, -0.01]} />
      )}
      <mesh geometry={plane(1, 1)} material={badgeMat(n)} scale={[w, h, 1]} />
      {glow > 0.3 && <pointLight intensity={glow * 1.5} distance={2.5} color="#FFD970" />}
    </group>
  );
};
