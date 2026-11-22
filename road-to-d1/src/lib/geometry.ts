import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// Shared geometry cache: the same box size is built once and reused by every mesh.
const cache = new Map<string, THREE.BufferGeometry>();
const get = (key: string, make: () => THREE.BufferGeometry) => {
  let g = cache.get(key);
  if (!g) {
    g = make();
    cache.set(key, g);
  }
  return g;
};

export const box = (w: number, h: number, d: number) =>
  get(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));

// Low-segment rounded box: 2 segments + flat shading = visible bevel facets (the "low-poly" head).
export const rbox = (w: number, h: number, d: number, r = 0.06, seg = 2) =>
  get(`r${w},${h},${d},${r},${seg}`, () => new RoundedBoxGeometry(w, h, d, seg, r));

export const sphere = (r: number, ws = 10, hs = 8) => get(`s${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs));

export const cyl = (rt: number, rb: number, h: number, seg = 8) =>
  get(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));

export const cone = (r: number, h: number, seg = 4) => get(`k${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg));

export const torusArc = (r: number, tube: number, arc: number) =>
  get(`t${r},${tube},${arc}`, () => new THREE.TorusGeometry(r, tube, 4, 10, arc));

export const plane = (w: number, h: number) => get(`p${w},${h}`, () => new THREE.PlaneGeometry(w, h));

export const circle = (r: number, seg = 14) => get(`o${r},${seg}`, () => new THREE.CircleGeometry(r, seg));

// Lower half-disc (flat top): the open "D" grin shape.
export const halfDisc = (r: number) => get(`h${r}`, () => new THREE.CircleGeometry(r, 12, Math.PI, Math.PI));

export const ring = (r: number, tube: number) => get(`g${r},${tube}`, () => new THREE.TorusGeometry(r, tube, 4, 12));
