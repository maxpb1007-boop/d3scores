import React from "react";
import { Shot, Actor } from "../types";
import { GUS, TRE } from "../../characters/cast";
import { KID, KID2 } from "../../characters/extras";
import { frame as fr, HEAD } from "../../lib/camera";
import { V3 } from "../../characters/types";
import { Drone } from "../../props/Props";

/*
 * TEST A — "Popular vs. loner": Tre plans a homecoming ask for three weeks; Gus borrows a pencil.
 * Frames are global and come from testa/timeline.json word onsets.
 *   homecoming@44 three@80 | Speech@100 Choreography@125 drone@167 | pencil@249 | date@300 | HOW@345
 */
const head = (x: number, y: number, z: number, who: "gus" | "tre"): V3 => [x, y + HEAD[who], z];
const gus = (o: Partial<Actor> & { pos: V3 }): Actor => ({ who: GUS, poses: [{ f: 0, pose: "talk" }], expr: [{ f: 0, e: "neutral" }], ...o });
const tre = (o: Partial<Actor> & { pos: V3 }): Actor => ({ who: TRE, poses: [{ f: 0, pose: "idle" }], expr: [{ f: 0, e: "hyped" }], mouth: "none", ...o });

const CL_GUS: V3 = [0.2, 0, -0.6];
const CL_GIRL: V3 = [1.15, 0, -0.45];

export const SHOTS: Shot[] = [
  // Tre rehearsing in the bathroom mirror, mouthing his speech
  {
    id: "a1", start: 0, end: 62, set: "Bathroom", light: "hallway", lightTarget: [0, 1, -0.6],
    cam: fr(head(0, 0, -0.6, "tre"), 1.35, { yaw: -0.25, elev: 0.05 }), push: 0.04,
    actors: [tre({ pos: [0, 0, -0.6], poses: [{ f: 0, pose: "talk" }], mouth: "chew" })],
    fx: [{ kind: "counter", f0: 66, f1: 92, from: 1, to: 21, template: "DAY {n}" }],
  },
  {
    id: "a2", start: 62, end: 99, set: "Bathroom", light: "hallway", lightTarget: [0, 1, -0.6],
    cam: fr(head(0, 0, -0.6, "tre"), 1.15, { yaw: 0.2 }), push: 0.05,
    actors: [tre({ pos: [0, 0, -0.6], poses: [{ f: 0, pose: "armsCrossed" }], expr: [{ f: 0, e: "smug" }] })],
    fx: [{ kind: "counter", f0: 66, f1: 92, from: 1, to: 21, template: "DAY {n}" }],
  },
  // "Speech." — big hand gestures, mouthing
  {
    id: "a3", start: 99, end: 124, set: "Hallway", light: "hallway", lightTarget: [0, 1, -0.4],
    cam: fr(head(0, 0, -0.4, "tre"), 1.2, { yaw: 0.1 }), push: 0.05,
    actors: [tre({ pos: [0, 0, -0.4], poses: [{ f: 0, pose: "talk" }], mouth: "chew" })],
    fx: [{ kind: "flash", f: 99, len: 3 }, { kind: "label", f: 100, text: "SPEECH ✓" }],
  },
  // "Choreography." — Tre dancing (juke cycle)
  {
    id: "a4", start: 124, end: 157, set: "Hallway", light: "hallway", lightTarget: [0, 1, 0],
    cam: fr([0, 1.4, 0], 2.6, { yaw: -0.1, elev: 0.2, fov: 40 }), push: 0.04,
    actors: [tre({ pos: [0, 0, 0], poses: [{ f: 0, pose: "juke" }] })],
    fx: [{ kind: "flash", f: 124, len: 3 }, { kind: "label", f: 125, text: "DANCE ✓" }],
  },
  // "A drone." — field, Tre looking up at a drone, arms up
  {
    id: "a5", start: 157, end: 190, set: "Field", light: "golden", lightTarget: [0, 1, 0],
    cam: fr(head(0, 0, 0, "tre"), 2.1, { yaw: 0.2, elev: -0.6, fov: 42, headAt: 0.5 }), push: 0.05,
    actors: [tre({ pos: [0, 0, 0], poses: [{ f: 0, pose: "celebrate" }], look: [{ f: 157, yaw: 0, pitch: -0.45, dur: 1 }] })],
    extra: (f) => <Drone frame={f} position={[0.25, 2.65 + Math.sin(f / 6) * 0.04, 0.2]} rotation={[0, f * 0.02, 0.05]} scale={1.6} />,
    fx: [{ kind: "flash", f: 157, len: 3 }, { kind: "label", f: 167, text: "DRONE ✓" }],
  },
  // "I asked someone if I could borrow a pencil."
  {
    id: "a6", start: 190, end: 246, set: "Classroom", light: "classroom", lightTarget: [0.7, 1, -0.5],
    cam: fr([0.68, 1.4, -0.5], 2.05, { yaw: 0.05, elev: 0.1, fov: 38 }), push: 0.04,
    actors: [
      gus({ pos: CL_GUS, yaw: 0.6 }),
      { who: KID2, pos: CL_GIRL, yaw: -0.6, poses: [{ f: 0, pose: "idle" }], expr: [{ f: 0, e: "neutral" }] },
      { who: KID, pos: [-1.6, 0, -1.2], yaw: 0.3, poses: [{ f: 0, pose: "phoneHold" }], expr: [{ f: 0, e: "neutral" }], rHand: { kind: "phone", screen: "feed" } },
    ],
  },
  // she hands over the pencil, smitten
  {
    id: "a7", start: 246, end: 278, set: "Classroom", light: "classroom", lightTarget: [0.7, 1, -0.5],
    cam: fr([CL_GIRL[0], CL_GIRL[1] + 1.45, CL_GIRL[2]], 1.25, { yaw: -0.45 }), push: 0.05,
    actors: [{ who: KID2, pos: CL_GIRL, yaw: -0.6, poses: [{ f: 0, pose: "phoneShow" }], expr: [{ f: 0, e: "neutral" }, { f: 254, e: "hyped" }], rHand: { kind: "pencil" } }],
  },
  // "Now I have a date to homecoming."
  {
    id: "a8", start: 278, end: 341, set: "Classroom", light: "classroom", lightTarget: [0.7, 1, -0.5],
    cam: fr(head(CL_GUS[0], 0, CL_GUS[2], "gus"), 1.2, { yaw: 0.15 }), push: 0.05,
    actors: [gus({ pos: CL_GUS, poses: [{ f: 0, pose: "phoneHold" }], rHand: { kind: "pencil" } })],
  },
  // "HOW?!"
  {
    id: "a9", start: 341, end: 371, set: "Classroom", light: "classroom", lightTarget: [0, 1, 0],
    cam: fr(head(-0.4, 0, 0.4, "tre"), 1.2, { yaw: 0, elev: -0.05 }), push: 0.08,
    shake: [{ f: 345, amp: 1.0 }],
    actors: [tre({ pos: [-0.4, 0, 0.4], poses: [{ f: 0, pose: "facepalm" }, { f: 344, pose: "celebrate", blend: 3 }], expr: [{ f: 0, e: "shocked" }, { f: 350, e: "eyeTwitch" }], mouth: "auto" })],
    fx: [{ kind: "flash", f: 341, len: 4 }],
  },
];
