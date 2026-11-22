import * as THREE from "three";

// One shared flat-shaded material per colour. Flat shading is what gives the low-poly facet look.
const cache = new Map<string, THREE.Material>();

export const mat = (color: string, opts: { emissive?: string; emissiveIntensity?: number } = {}) => {
  const key = `${color}|${opts.emissive ?? ""}|${opts.emissiveIntensity ?? 0}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({
      color,
      flatShading: true,
      emissive: opts.emissive ?? "#000000",
      emissiveIntensity: opts.emissiveIntensity ?? 0,
    });
    cache.set(key, m);
  }
  return m;
};

// Unlit material for things that glow (phone screens, ceiling lights, window light).
const basicCache = new Map<string, THREE.Material>();
export const glow = (color: string) => {
  let m = basicCache.get(color);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, toneMapped: false });
    basicCache.set(color, m);
  }
  return m;
};
