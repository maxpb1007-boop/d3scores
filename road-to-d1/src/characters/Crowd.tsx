import React from "react";
import { random } from "remotion";
import { box, rbox } from "../lib/geometry";
import { mat } from "../lib/materials";
import { StarBadge } from "../props/StarBadge";
import { V3 } from "./types";

/*
 * Background crowd: a cheap figure (~9 meshes instead of ~70 for the full rig) in the same blocky
 * style, so 30-60 people stay fast to render. Look comes from a seed, deterministic per person.
 * Each person can carry a star badge and a little idle bob / head turn.
 */
const SKIN = ["#F1C7A1", "#E0AC82", "#C98B62", "#9A6440", "#7A4E33", "#5C3A26"];
const HAIR = ["#1A1412", "#3B2A22", "#6B4426", "#C58B3E", "#B5462F", "#2E211A"];
const TOPS = ["#E2B33C", "#3D7BF2", "#D96C8A", "#3E8E4A", "#6A4FB3", "#F08A24", "#22305A", "#E25A3A", "#1E8C8C", "#F4F4F4"];
const PANTS = ["#3B4B6B", "#2E2E36", "#4B4E5A", "#8A8F96", "#C9B48A"];
const pick = <T,>(a: T[], s: string) => a[Math.floor(random(s) * a.length) % a.length];

export type CrowdPerson = { pos: V3; yaw?: number; seed: string; stars?: number; cap?: string; scale?: number; jersey?: string; look?: number };

export const Person: React.FC<CrowdPerson & { t: number }> = ({ pos, yaw = 0, seed, stars, cap, scale = 1, jersey, t, look = 0 }) => {
  const skin = pick(SKIN, seed + "s");
  const hair = pick(HAIR, seed + "h");
  const top = jersey ?? pick(TOPS, seed + "t");
  const pants = pick(PANTS, seed + "p");
  const tall = 0.9 + random(seed + "z") * 0.25;
  const ph = random(seed + "ph") * 6.28;
  const bob = Math.abs(Math.sin(t * 0.12 + ph)) * 0.02;
  const headYaw = Math.sin(t * 0.03 + ph) * 0.15 + look;
  const legH = 0.62 * tall;
  return (
    <group position={pos} rotation={[0, yaw, 0]} scale={scale}>
      <group position={[0, bob, 0]}>
        <mesh geometry={box(0.15, legH, 0.17)} material={mat(pants)} position={[0.12, legH / 2, 0]} castShadow />
        <mesh geometry={box(0.15, legH, 0.17)} material={mat(pants)} position={[-0.12, legH / 2, 0]} castShadow />
        <mesh geometry={rbox(0.5, 0.52, 0.3, 0.05)} material={mat(top)} position={[0, legH + 0.26, 0]} castShadow />
        <mesh geometry={box(0.12, 0.46, 0.13)} material={mat(top)} position={[0.32, legH + 0.26, 0]} rotation={[0, 0, 0.12]} castShadow />
        <mesh geometry={box(0.12, 0.46, 0.13)} material={mat(top)} position={[-0.32, legH + 0.26, 0]} rotation={[0, 0, -0.12]} castShadow />
        <group position={[0, legH + 0.52 + 0.33, 0]} rotation={[0, headYaw, 0]}>
          <mesh geometry={rbox(0.6, 0.56, 0.54, 0.09, 2)} material={mat(skin)} castShadow />
          <mesh geometry={rbox(0.64, 0.14, 0.58, 0.05)} material={mat(cap ?? hair)} position={[0, 0.27, -0.01]} />
          {cap && <mesh geometry={box(0.45, 0.03, 0.2)} material={mat(cap)} position={[0, 0.21, 0.33]} />}
          <mesh geometry={box(0.075, 0.11, 0.02)} material={mat("#0B0B0E")} position={[0.12, 0.03, 0.275]} />
          <mesh geometry={box(0.075, 0.11, 0.02)} material={mat("#0B0B0E")} position={[-0.12, 0.03, 0.275]} />
          <mesh geometry={box(0.12, 0.025, 0.02)} material={mat("#2A0E12")} position={[0, -0.14, 0.275]} />
        </group>
      </group>
      {stars !== undefined && <StarBadge at={[0, legH + 0.52 + 0.33 + 0.62 + bob, 0]} n={stars} scale={0.85} />}
    </group>
  );
};

export const Crowd: React.FC<{ people: CrowdPerson[]; t: number }> = ({ people, t }) => (
  <group>
    {people.map((p) => (
      <Person key={p.seed} {...p} t={t} />
    ))}
  </group>
);

/** Scatter a crowd over a rectangle, avoiding a clear zone, deterministic. */
export const scatter = (n: number, seed: string, x: [number, number], z: [number, number], o: { stars?: (i: number) => number; avoid?: [number, number, number]; faceCam?: boolean } = {}): CrowdPerson[] => {
  const out: CrowdPerson[] = [];
  for (let i = 0; out.length < n && i < n * 6; i++) {
    const px = x[0] + random(`${seed}x${i}`) * (x[1] - x[0]);
    const pz = z[0] + random(`${seed}z${i}`) * (z[1] - z[0]);
    if (o.avoid && Math.hypot(px - o.avoid[0], pz - o.avoid[1]) < o.avoid[2]) continue;
    if (out.some((p) => Math.hypot(p.pos[0] - px, p.pos[2] - pz) < 0.75)) continue;
    const st = o.stars ? o.stars(out.length) : Math.floor(random(`${seed}st${i}`) * 5) + 1;
    out.push({ pos: [px, 0, pz], yaw: o.faceCam ? (random(`${seed}y${i}`) - 0.5) * 0.8 : random(`${seed}y${i}`) * 6.28, seed: `${seed}-${i}`, stars: st });
  }
  return out;
};
