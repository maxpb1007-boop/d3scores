import React from "react";
import { Shot, Actor } from "../types";
import { DALE, WAITER } from "../../characters/extras";
import { CharSpec, V3 } from "../../characters/types";
import { frame as fr, Cam } from "../../lib/camera";
import { box, cyl, sphere } from "../../lib/geometry";
import { mat } from "../../lib/materials";

/*
 * TECHNICALLY RIGHT — "You Too". The waiter says "enjoy your meal"; Dale says "you too".
 * Word onsets (daleb/timeline.json):
 *   meal@31 | too@57 | eating@130 | fix@188 back@241 | shift@291 | Worse@319 | second@398 waiter@434 |
 *   Sir@466 can't@494 | even@549
 */
const hy = (s: CharSpec) => s.thigh + s.shin + 0.085 + s.torsoH + 0.06 + s.headH / 2;
const SEAT = 0.485;
const DALE_AT: V3 = [0, SEAT - (DALE.thigh + DALE.shin + 0.085 - 0.06), -0.6];
const DH: V3 = [DALE_AT[0], DALE_AT[1] + hy(DALE), DALE_AT[2]];
const W_AT: V3 = [0.95, 0, 0.2];
const WH: V3 = [W_AT[0], hy(WAITER), W_AT[2]];

const dale = (o: Partial<Actor> = {}): Actor => ({ who: DALE, pos: DALE_AT, poses: [{ f: 0, pose: "sit" }], expr: [{ f: 0, e: "neutral" }], ...o });
const waiter = (o: Partial<Actor> = {}): Actor => ({ who: WAITER, pos: W_AT, yaw: -1.25, poses: [{ f: 0, pose: "idle" }], expr: [{ f: 0, e: "neutral" }], ...o });
const daleCU = (w = 1.2, o: { yaw?: number; elev?: number } = {}): Cam => fr(DH, w, o);
const waiterCU = (w = 1.2, o: { yaw?: number; elev?: number } = {}): Cam => fr(WH, w, { yaw: -0.6, ...o });

const Plate: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <mesh geometry={cyl(0.17, 0.15, 0.025, 14)} material={mat("#FFFFFF")} castShadow />
    <mesh geometry={box(0.14, 0.05, 0.09)} material={mat("#8E5A3C")} position={[-0.03, 0.035, 0]} />
    <mesh geometry={sphere(0.04, 6, 5)} material={mat("#6DBE45")} position={[0.07, 0.04, 0.03]} />
    <mesh geometry={sphere(0.035, 6, 5)} material={mat("#F2D16B")} position={[0.06, 0.04, -0.05]} />
  </group>
);
const myPlate = () => <Plate p={[0, 0.82, -0.25]} />;
const both = () => <>{myPlate()}<Plate p={[0, 0.82, 0.22]} /></>;

export const SHOTS: Shot[] = [
  // "Enjoy your meal."
  { id: "b1", start: 0, end: 46, set: "Restaurant", light: "warm", cam: fr([0.45, 1.35, -0.2], 2.3, { yaw: 0.25, elev: 0.25, fov: 40 }), push: 0.04, actors: [dale({ mouth: "none" }), waiter({ poses: [{ f: 0, pose: "phoneShow" }, { f: 30, pose: "idle", blend: 10 }] })], extra: myPlate },
  // "You too."
  { id: "b2", start: 46, end: 88, set: "Restaurant", light: "warm", cam: daleCU(1.2, { yaw: 0.25 }), push: 0.05, actors: [dale({ expr: [{ f: 0, e: "hyped" }], look: [{ f: 0, yaw: -0.5 }] })], extra: myPlate },
  // "The waiter was not eating." — waiter walks off, then Dale realises
  { id: "b3", start: 88, end: 126, set: "Restaurant", light: "warm", cam: { pos: [-0.6, 1.7, 3.2], target: [1.6, 1.2, 0.6], fov: 44 }, push: 0.04, actors: [waiter({ yaw: 0.4, poses: [{ f: 0, pose: "walk" }], move: { f0: 92, f1: 126, to: [2.6, 0, 1.6] } })], extra: myPlate },
  { id: "b4", start: 126, end: 164, set: "Restaurant", light: "warm", cam: daleCU(1.1, { yaw: 0.05 }), push: 0.08, shake: [{ f: 130, amp: 0.35 }], actors: [dale({ mouth: "none", expr: [{ f: 0, e: "shocked" }] })], extra: myPlate },
  // "Dale had to fix it."
  { id: "b5", start: 164, end: 207, set: "Restaurant", light: "warm", cam: daleCU(1.25, { yaw: -0.3 }), push: 0.05, actors: [dale({ mouth: "none", expr: [{ f: 0, e: "annoyed" }] })], extra: myPlate },
  // "So when the waiter came back..."
  { id: "b6", start: 207, end: 262, set: "Restaurant", light: "warm", cam: fr([0.6, 1.35, 0.2], 2.6, { yaw: 0.6, elev: 0.3, fov: 40 }), push: 0.04, actors: [dale({ mouth: "none", look: [{ f: 0, yaw: -0.5 }] }), waiter({ yaw: -2.2, poses: [{ f: 0, pose: "walk" }, { f: 255, pose: "idle", blend: 6 }], pos: [2.6, 0, 1.6], move: { f0: 207, f1: 255, to: W_AT }, turn: { f0: 245, f1: 258, to: -1.25 } })], extra: myPlate },
  // "Enjoy your... shift."
  { id: "b7", start: 262, end: 318, set: "Restaurant", light: "warm", cam: daleCU(1.15, { yaw: 0.25 }), push: 0.05, actors: [dale({ poses: [{ f: 0, pose: "sit" }], expr: [{ f: 0, e: "hyped" }], look: [{ f: 0, yaw: -0.5 }] })], extra: myPlate },
  // "Worse."
  { id: "b8", start: 318, end: 358, set: "Restaurant", light: "warm", cam: waiterCU(1.15), push: 0.07, actors: [waiter({ mouth: "none", blinks: [328, 338] })], extra: myPlate },
  // "So Dale ordered a second meal. For the waiter."
  { id: "b9", start: 358, end: 421, set: "Restaurant", light: "warm", cam: daleCU(1.3, { yaw: 0.15 }), push: 0.05, actors: [dale({ mouth: "none", expr: [{ f: 0, e: "smug" }], look: [{ f: 0, yaw: -0.4 }] })], extra: myPlate, fx: [{ kind: "label", f: 398, text: "+1 MEAL" }] },
  { id: "b10", start: 421, end: 464, set: "Restaurant", light: "warm", cam: fr([0.45, 1.25, 0], 2.3, { yaw: 0.35, elev: 0.5, fov: 40 }), push: 0.04, actors: [dale({ mouth: "none", expr: [{ f: 0, e: "smug" }] }), waiter({ mouth: "none", look: [{ f: 0, yaw: 0.2, pitch: 0.4 }] })], extra: both },
  // "Sir... I can't eat this."
  { id: "b11", start: 464, end: 534, set: "Restaurant", light: "warm", cam: waiterCU(1.2), push: 0.06, actors: [waiter({ expr: [{ f: 0, e: "sad" }] })], extra: both },
  // "Then we're even."
  { id: "b12", start: 534, end: 589, set: "Restaurant", light: "warm", cam: daleCU(1.2, { yaw: 0.05 }), push: 0.06, actors: [dale({ expr: [{ f: 0, e: "smug" }] })], extra: both, fx: [{ kind: "label", f: 556, text: "WHO WAS WRONG?", x: 47, color: "#FF6B6B" }] },
];
