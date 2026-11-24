import React from "react";
import { Shot, Actor } from "../types";
import { DALE, INTERVIEWER } from "../../characters/extras";
import { CharSpec, V3 } from "../../characters/types";
import { frame as fr, Cam } from "../../lib/camera";
import { Person } from "../../characters/Crowd";
import { lerp, clamp } from "../../lib/anim";

/*
 * TECHNICALLY RIGHT — "The Door". Dale holds the door for someone 40 ft away... then everyone.
 * Word onsets (dalea/timeline.json):
 *   rule@32 door@81 | forty@146 away@166 | rush@205 | rushed@242 | three@291 trip@372 |
 *   Morning@392/416/440/464 | Eleven@497 door@585 | Dale?@609 nine@656 | whole@707 time@717
 */
const hy = (s: CharSpec) => s.thigh + s.shin + 0.085 + s.torsoH + 0.06 + s.headH / 2;
const DALE_AT: V3 = [-0.15, 0.12, -0.75];
const DH: V3 = [DALE_AT[0], DALE_AT[1] + hy(DALE), DALE_AT[2]];
const cu = (w = 1.3, o: { yaw?: number; elev?: number; fov?: number } = {}): Cam => fr(DH, w, o);
const dale = (o: Partial<Actor> = {}): Actor => ({
  who: DALE, pos: DALE_AT, poses: [{ f: 0, pose: "holdDoor" }], expr: [{ f: 0, e: "neutral" }], ...o,
});

// walkers along the sidewalk toward the door (x from far right to the door at x ~0, then inside)
type Walker = { seed: string; f0: number; f1: number; x0: number; z: number; scale?: number; speed?: number };
const walkerNode = (ws: Walker[]) => (f: number) => (
  <group>
    {ws.map((w) => {
      if (f < w.f0 - 2) return null;
      const k = clamp((f - w.f0) / (w.f1 - w.f0));
      const x = lerp(w.x0, 0.35, k);
      const inside = k >= 1;
      const zz = inside ? lerp(w.z, -2.6, clamp((f - w.f1) / 12)) : w.z;
      return (
        <Person key={w.seed} seed={w.seed} pos={[x, 0.12, zz]} yaw={inside ? Math.PI : -Math.PI / 2} t={f} walk={w.speed ?? 1} scale={w.scale ?? 1} />
      );
    })}
  </group>
);
const WOMAN: Walker = { seed: "woman7", f0: 60, f1: 285, x0: 13, z: 0.3, speed: 1 };
// she "rushes" for the last bit: a faster walker covering the same path
const WOMAN_RUSH = (f: number): Walker[] => (f < 236 ? [WOMAN] : [{ ...WOMAN, f0: 236 - 140, f1: 285, x0: 13, speed: 2.2 }]);
const THREE: Walker[] = [0, 1, 2].map((i) => ({ seed: `adult${i}`, f0: 290 + i * 10, f1: 400 + i * 18, x0: 9 + i * 1.3, z: 0.25 + (i % 2) * 0.3 }));
const KIDS: Walker[] = Array.from({ length: 22 }, (_, i) => ({ seed: `trip${i}`, f0: 340 + i * 9, f1: 430 + i * 14, x0: 10 + i * 0.9, z: 0.15 + (i % 3) * 0.28, scale: 0.68, speed: 1.4 }));
const TEACHER: Walker = { seed: "teacher", f0: 336, f1: 420, x0: 9, z: 0.6 };
const everyone = (f: number) => walkerNode([...WOMAN_RUSH(f), ...THREE, TEACHER, ...KIDS])(f);

export const SHOTS: Shot[] = [
  // "Dale has one rule."
  { id: "a1", start: 0, end: 50, set: "Storefront", light: "sunny", lightTarget: DALE_AT, cam: cu(1.35, { yaw: 0.35 }), push: 0.05, actors: [dale({ mouth: "none" })] },
  // "You always hold the door." — establishing wide, she appears far away
  { id: "a2", start: 50, end: 98, set: "Storefront", light: "sunny", lightTarget: [3, 1, 0], cam: { pos: [-3.0, 2.1, 3.0], target: [6, 1.1, 0.1], fov: 32 }, push: 0.04, actors: [dale({ mouth: "none", yaw: 0.5 })], extra: everyone },
  // "Even when the person is forty feet away." — long lens down the sidewalk past Dale
  {
    id: "a3", start: 98, end: 150, set: "Storefront", light: "sunny", lightTarget: [6, 1, 0],
    cam: { pos: [-2.6, 1.7, 1.6], target: [10, 1.2, 0.3], fov: 22 }, push: 0.04, actors: [dale({ mouth: "none", yaw: 0.9 })], extra: everyone,
    fx: [{ kind: "label", f: 146, text: "40 FT" }],
  },
  { id: "a4", start: 150, end: 194, set: "Storefront", light: "sunny", lightTarget: DALE_AT, cam: cu(1.2, { yaw: -0.2 }), push: 0.05, actors: [dale({ expr: [{ f: 0, e: "smug" }], mouth: "none", look: [{ f: 0, yaw: 0.6 }] })] },
  // "No rush!"
  { id: "a5", start: 194, end: 232, set: "Storefront", light: "sunny", lightTarget: DALE_AT, cam: cu(1.15, { yaw: 0.3 }), push: 0.06, actors: [dale({ expr: [{ f: 0, e: "hyped" }], look: [{ f: 0, yaw: 0.7 }] })] },
  // "She rushed." — the awkward half-jog
  { id: "a6", start: 232, end: 290, set: "Storefront", light: "sunny", lightTarget: [2, 1, 0], cam: { pos: [3.0, 1.6, 4.8], target: [1.6, 1.0, -0.2], fov: 44 }, push: 0.04, shake: [{ f: 242, amp: 0.3 }], actors: [dale({ mouth: "none", expr: [{ f: 0, e: "hyped" }] })], extra: everyone },
  // "Then three more people came."
  { id: "a7", start: 290, end: 336, set: "Storefront", light: "sunny", lightTarget: [3, 1, 0], cam: { pos: [-2.4, 1.9, 2.8], target: [4.5, 1.1, 0.1], fov: 36 }, push: 0.04, actors: [dale({ mouth: "none", yaw: 0.5 })], extra: everyone },
  // "Then a school field trip."
  { id: "a8", start: 336, end: 391, set: "Storefront", light: "sunny", lightTarget: [6, 1, 0], cam: { pos: [9, 5.5, 9], target: [6, 0.5, 0], fov: 44 }, camEnd: { pos: [7, 4.5, 8], target: [4, 0.6, 0], fov: 44 }, push: 0, actors: [dale({ mouth: "none" })], extra: everyone },
  // "Morning. Morning. Morning. Morning." — nodding at each kid
  {
    id: "a9", start: 391, end: 490, set: "Storefront", light: "sunny", lightTarget: DALE_AT, cam: cu(1.5, { yaw: 0.45 }), push: 0.05, actors: [dale({
      look: [{ f: 391, yaw: 0.5, pitch: 0.35, dur: 4 }, { f: 404, yaw: 0.5, pitch: 0, dur: 4 }, { f: 415, yaw: 0.5, pitch: 0.35, dur: 4 }, { f: 428, yaw: 0.5, pitch: 0, dur: 4 },
        { f: 439, yaw: 0.5, pitch: 0.35, dur: 4 }, { f: 452, yaw: 0.5, pitch: 0, dur: 4 }, { f: 463, yaw: 0.5, pitch: 0.35, dur: 4 }, { f: 476, yaw: 0.5, pitch: 0, dur: 4 }],
    })], extra: everyone,
  },
  // "Eleven minutes later, Dale was still holding the door."
  {
    id: "a10", start: 490, end: 545, set: "Storefront", light: "sunny", lightTarget: [2, 1, 0], cam: { pos: [2.8, 1.8, 5.2], target: [0.8, 1.1, -0.5], fov: 44 }, push: 0.05,
    actors: [dale({ mouth: "none", expr: [{ f: 0, e: "sad" }] })], extra: (f) => everyone(f + 120),
    fx: [{ kind: "counter", f0: 497, f1: 540, from: 1, to: 11, template: "{n} MIN" }],
  },
  { id: "a11", start: 545, end: 606, set: "Storefront", light: "sunny", lightTarget: DALE_AT, cam: cu(1.1, { yaw: -0.1 }), push: 0.07, actors: [dale({ mouth: "none", expr: [{ f: 0, e: "sad" }], look: [{ f: 0, yaw: 0, pitch: 0.15 }] })], fx: [{ kind: "label", f: 545, text: "11 MIN" }] },
  // "Dale? Your interview was at nine."
  {
    id: "a12", start: 606, end: 678, set: "Storefront", light: "sunny", lightTarget: DALE_AT, cam: { pos: [2.0, 1.9, 2.4], target: [0.2, 1.55, -1.0], fov: 40 }, push: 0.05,
    actors: [dale({ mouth: "none", look: [{ f: 612, yaw: 0.8, dur: 8 }] }), { who: INTERVIEWER, pos: [0.65, 0.12, -1.35], yaw: -0.5, poses: [{ f: 0, pose: "armsCrossed" }], expr: [{ f: 0, e: "annoyed" }] }],
  },
  // "I've been here the whole time."
  {
    id: "a13", start: 678, end: 752, set: "Storefront", light: "sunny", lightTarget: DALE_AT, cam: cu(1.2, { yaw: 0.05 }), push: 0.06,
    actors: [dale({ expr: [{ f: 0, e: "neutral" }] })], fx: [{ kind: "label", f: 722, text: "WHO WAS WRONG?", x: 47, color: "#FF6B6B" }],
  },
];
