import { Shot, Actor } from "../types";
import { GUS, TRE } from "../../characters/cast";
import { KID, KID2 } from "../../characters/extras";
import { frame as fr, HEAD } from "../../lib/camera";
import { V3 } from "../../characters/types";

/*
 * TEST B — "Looksmaxxing": the joke is always on the trend and on Tre's effort, never on anyone's looks.
 * Word onsets (testb/timeline.json):
 *   mewing@27 forty-one@46 | Fourteen-step@82 skincare@103 night@153 | glow-up@195 |
 *   soap@274 Somebody@303 pretty@337 | Day@372 forty-two@380
 */
const head = (x: number, y: number, z: number, who: "gus" | "tre"): V3 => [x, y + HEAD[who], z];
const gus = (o: Partial<Actor> & { pos: V3 }): Actor => ({ who: GUS, poses: [{ f: 0, pose: "idle" }], expr: [{ f: 0, e: "neutral" }], ...o });
// mewing: chin up, jaw set, mouth shut
const mewing = (o: Partial<Actor> & { pos: V3 }): Actor => ({
  who: TRE, poses: [{ f: 0, pose: "armsCrossed" }], expr: [{ f: 0, e: "annoyed" }], mouth: "none",
  look: [{ f: 0, yaw: 0, pitch: -0.22 }], ...o,
});
const MIRROR: V3 = [0, 0, -0.6];

export const SHOTS: Shot[] = [
  {
    id: "b1", start: 0, end: 46, set: "Bathroom", light: "hallway", lightTarget: [0, 1, -0.6],
    cam: fr(head(MIRROR[0], 0, MIRROR[2], "tre"), 1.4, { yaw: -0.2, elev: -0.1 }), push: 0.05,
    actors: [mewing({ pos: MIRROR })],
  },
  {
    id: "b2", start: 46, end: 81, set: "Bathroom", light: "hallway", lightTarget: [0, 1, -0.6],
    cam: fr(head(MIRROR[0], 0, MIRROR[2], "tre"), 1.15, { yaw: 0.1, elev: -0.15 }), push: 0.07,
    actors: [mewing({ pos: MIRROR, blinks: [60] })],
    fx: [{ kind: "label", f: 46, text: "DAY 41" }],
  },
  // "Fourteen-step skincare routine." — counter climbs while Tre works through bottles
  {
    id: "b3", start: 81, end: 138, set: "Bathroom", light: "hallway", lightTarget: [0, 1, -0.6],
    cam: fr(head(MIRROR[0], 0, MIRROR[2], "tre"), 1.6, { yaw: 0.35, elev: 0.1 }), push: 0.04,
    actors: [{ who: TRE, pos: MIRROR, poses: [{ f: 0, pose: "phoneHold" }, { f: 104, pose: "facepalm", blend: 5 }, { f: 120, pose: "phoneHold", blend: 5 }], expr: [{ f: 0, e: "hyped" }], mouth: "none", rHand: { kind: "bottle" } }],
    fx: [{ kind: "counter", f0: 84, f1: 132, from: 1, to: 14, template: "STEP {n}/14" }],
  },
  // "Every night." — 2:13 AM, still going
  {
    id: "b4", start: 138, end: 166, set: "Bedroom", light: "bedroom", lightTarget: [0, 1, -1],
    cam: { pos: [1.7, 1.75, 2.3], target: [-0.35, 0.95, -1.0], fov: 46 }, push: 0.05,
    actors: [{ who: TRE, pos: [0.2, -0.1, -1.0], poses: [{ f: 0, pose: "sit" }, { f: 138, pose: "phoneHold", blend: 1 }], expr: [{ f: 0, e: "neutral" }], mouth: "none", rHand: { kind: "bottle" } }],
  },
  // "He calls it his glow-up." — hero pose, lens flare
  {
    id: "b5", start: 166, end: 224, set: "Hallway", light: "hallway", lightTarget: [1.2, 1, -0.7],
    cam: fr(head(1.2, 0, -0.7, "tre"), 2.0, { yaw: -0.25, elev: -0.45, fov: 40, headAt: 0.3 }),
    camEnd: fr(head(1.2, 0, -0.7, "tre"), 1.8, { yaw: -0.1, elev: -0.4, fov: 40, headAt: 0.3 }),
    shake: [{ f: 194, amp: 0.5 }],
    actors: [{ who: TRE, pos: [1.2, 0, -0.7], yaw: -0.25, poses: [{ f: 0, pose: "flex" }], expr: [{ f: 0, e: "smug" }], mouth: "none", look: [{ f: 0, yaw: 0, pitch: -0.2 }] }],
    fx: [{ kind: "flash", f: 193, len: 4 }, { kind: "flare", f: 194 }],
  },
  // "I washed my face with hand soap once."
  {
    id: "b6", start: 224, end: 300, set: "Bathroom", light: "hallway", lightTarget: [0, 1, -0.6],
    cam: fr(head(0, 0, -0.6, "gus"), 1.2, { yaw: 0.05 }), push: 0.04,
    actors: [gus({ pos: [0, 0, -0.6], poses: [{ f: 0, pose: "talk" }] })],
  },
  // "Somebody called me the pretty one." — two kids staring at Gus, impressed
  {
    id: "b7", start: 300, end: 368, set: "Hallway", light: "hallway", lightTarget: [0, 1, -0.3],
    cam: fr([0, 1.35, -0.3], 2.7, { yaw: 0, elev: 0.15, fov: 40 }), push: 0.05,
    actors: [
      gus({ pos: [0, 0, -0.3], poses: [{ f: 0, pose: "idle" }] }),
      { who: KID2, pos: [-1.0, 0, 0.1], yaw: 0.7, poses: [{ f: 0, pose: "idle" }], expr: [{ f: 0, e: "neutral" }, { f: 334, e: "hyped" }] },
      { who: KID, pos: [1.05, 0, 0.15], yaw: -0.7, poses: [{ f: 0, pose: "idle" }], expr: [{ f: 0, e: "neutral" }, { f: 338, e: "shocked" }] },
    ],
    fx: [{ kind: "flare", f: 336 }],
  },
  // "Day forty-two." — Tre, twitching, mewing harder
  {
    id: "b8", start: 368, end: 413, set: "Bathroom", light: "hallway", lightTarget: [0, 1, -0.6],
    cam: fr(head(MIRROR[0], 0, MIRROR[2], "tre"), 1.15, { yaw: -0.05, elev: -0.15 }), push: 0.08,
    shake: [{ f: 380, amp: 0.5 }],
    actors: [mewing({ pos: MIRROR, expr: [{ f: 0, e: "eyeTwitch" }], mouth: "auto", look: [{ f: 0, yaw: 0, pitch: -0.3 }] })],
    fx: [{ kind: "label", f: 380, text: "DAY 42", color: "#FF6B6B" }],
  },
];
