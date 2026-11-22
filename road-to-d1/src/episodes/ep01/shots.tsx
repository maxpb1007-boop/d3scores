import React from "react";
import { Shot, Actor } from "../types";
import { GUS, TRE } from "../../characters/cast";
import { FRESHMAN, KID, KID2, LUNCH_LADY, PUNTER } from "../../characters/extras";
import { frame as fr, HEAD, SIT_Y, Cam } from "../../lib/camera";
import { V3 } from "../../characters/types";
import { Phone, Screen } from "../../props/Phone";
import { Football, Books, Paper } from "../../props/Props";
import { lerp, smooth, clamp } from "../../lib/anim";
import { random } from "remotion";

/*
 * EPISODE 1 — "THREE STARS". Shot list as data.
 * Every number here is a GLOBAL frame (30 fps) taken from timeline.json word onsets, e.g. "famous"
 * starts at 179, so the hard cut to Tre lands at 177 (2 frames early, as the style guide asks).
 * Sets: characters stand near the origin facing +z; the camera is on the +z side.
 */

const head = (x: number, y: number, z: number, who: "gus" | "tre" | "freshman" | "punter" | "lunchLady"): V3 => [x, y + HEAD[who], z];

// --- shared actor builders --------------------------------------------------
const gus = (o: Partial<Actor> & { pos: V3 }): Actor => ({ who: GUS, poses: [{ f: 0, pose: "talk" }], expr: [{ f: 0, e: "neutral" }], ...o });
const tre = (o: Partial<Actor> & { pos: V3 }): Actor => ({ who: TRE, poses: [{ f: 0, pose: "idle" }], expr: [{ f: 0, e: "hyped" }], ...o });

// A phone floating in the world for insert close-ups, gently drifting so the frame is never static.
const insertPhone = (at: V3, screen: Screen, f0: number, opts: { buzz?: [number, number]; flat?: boolean } = {}) =>
  (frame: number) => {
    const k = frame - f0;
    let jx = 0;
    if (opts.buzz && frame >= opts.buzz[0] && frame < opts.buzz[1]) jx = (frame % 2 ? 1 : -1) * 0.006;
    return (
      <group position={[at[0] + jx, at[1] + Math.sin(k / 14) * 0.004, at[2]]} rotation={opts.flat ? [-Math.PI / 2, 0, 0.3] : [0.05, Math.sin(k / 30) * 0.04, 0]}>
        <Phone screen={screen} scale={1.7} scroll={frame * 9} />
        {/* a mitten hand holding it */}
        {!opts.flat && <mesh position={[0.03, -0.14, -0.03]} rotation={[0, 0, 0.25]}><boxGeometry args={[0.11, 0.12, 0.05]} /><meshLambertMaterial color={TRE.skin} flatShading /></mesh>}
      </group>
    );
  };
const insertCam = (at: V3, w = 0.42, headAt = 0.33): Cam => fr(at, w, { fov: 30, headAt });

// --- field: the snap ----------------------------------------------------------
const YD = 0.9144;
const PUNT_Z = 15 * YD;
const BALL_START: V3 = [0, 0.13, -0.5];
const BALL_END: V3 = [0, 1.15, PUNT_Z - 0.35];
/** Ball flight progress with a slow-motion middle section (the "perfect spiral" tracking shot). */
const snapK = (f: number) => {
  if (f < 1280) return 0;
  if (f < 1300) return lerp(0, 0.28, (f - 1280) / 20);
  if (f < 1345) return lerp(0.28, 0.72, (f - 1300) / 45);
  return Math.min(1, lerp(0.72, 1, (f - 1345) / 11));
};
const ballPos = (k: number, end: V3 = BALL_END, arc = 0.9): V3 => [
  lerp(BALL_START[0], end[0], k),
  lerp(BALL_START[1], end[1], k) + Math.sin(Math.PI * k) * arc,
  lerp(BALL_START[2], end[2], k),
];
const snapBall = (frame: number) => {
  const k = snapK(frame);
  const p = k >= 1 ? ([0, 1.12, PUNT_Z - 0.3] as V3) : ballPos(k);
  return <Football position={p} rotation={[0.12, 0, frame * 0.8]} scale={1.15} />;
};
// imagination: the snap sails way over the punter's head
const badBall = (frame: number) => {
  const k = clamp((frame - 1627) / 26);
  return <Football position={ballPos(k * 1.25, [0, 5.5, PUNT_Z + 4], 2.2)} rotation={[0.6 + frame * 0.3, 0, frame * 0.5]} scale={1.15} />;
};

// --- hallway: books + papers falling -----------------------------------------
const spill = (origin: V3, f0: number) => (frame: number) => {
  const k = frame - f0;
  if (k < 0) return null;
  const items: React.ReactNode[] = [];
  for (let i = 0; i < 3; i++) {
    const t = clamp(k / 12);
    const dx = (random(`bk${i}`) - 0.5) * 0.9;
    const dz = (random(`bkz${i}`) - 0.2) * 0.6;
    const y = lerp(origin[1], 0.03 + i * 0.002, t * t);
    items.push(
      <Books key={`b${i}`} colors={[["#C0392B", "#2E86C1", "#F1C40F"][i]]} position={[origin[0] + dx * t, y, origin[2] + dz * t]} rotation={[0, (random(`br${i}`) - 0.5) * 3 * t, (1 - t) * 1.5]} />,
    );
  }
  for (let i = 0; i < 7; i++) {
    const t = clamp(k / (34 + i * 3));
    const sx = (random(`px${i}`) - 0.5) * 1.6;
    const sz = (random(`pz${i}`) - 0.3) * 1.2;
    const up = Math.sin(Math.min(1, k / 10) * Math.PI) * 0.5;
    const y = Math.max(0.012 + i * 0.001, lerp(origin[1] + 0.3, 0.01, smooth(t)) + up * (1 - t));
    const flutter = Math.sin(k * 0.35 + i) * (1 - t);
    items.push(
      <Paper key={`p${i}`} position={[origin[0] + sx * smooth(t) + flutter * 0.1, y, origin[2] + sz * smooth(t)]} rotation={[flutter * 0.8, i * 0.9 + k * 0.05 * (1 - t), flutter * 0.6]} />,
    );
  }
  return <group>{items}</group>;
};

// --- positions -----------------------------------------------------------------
const H_GUS: V3 = [-0.2, 0, -0.4];
const BED_TRE: V3 = [0.2, -0.1, -1.0]; // sitting up in bed against the headboard
const CAF_GUS: V3 = [-0.45, 0.49 - 0.505, -0.05];
const CAF_TRE: V3 = [0.5, 0.49 - 0.685, -0.05];
const BL_GUS: V3 = [-0.45, SIT_Y.gus, -0.05];
const BL_TRE: V3 = [0.6, SIT_Y.tre, -0.05];
const PHONE_DM: Screen = "dm";

export const SHOTS: Shot[] = [
  // ===== 01 HALLWAY — "My best friend is a three-star receiver. I'm the long snapper. Guess which one of us thinks he's famous."
  {
    id: "01a", start: 0, end: 82, set: "Hallway", light: "hallway", lightTarget: H_GUS,
    cam: fr(head(H_GUS[0], 0, H_GUS[2], "gus"), 1.3, { yaw: 0.12, elev: 0.04 }), push: 0.04,
    actors: [gus({ pos: H_GUS }), { who: KID, pos: [2.6, 0, -1.1], yaw: -0.4, poses: [{ f: 0, pose: "phoneHold" }], expr: [{ f: 0, e: "neutral" }], rHand: { kind: "phone", screen: "feed" } }],
  },
  {
    id: "01b", start: 82, end: 131, set: "Hallway", light: "hallway", lightTarget: H_GUS,
    cam: fr(head(H_GUS[0], 0, H_GUS[2], "gus"), 1.95, { yaw: -0.38, elev: 0.1 }), push: 0.035,
    actors: [gus({ pos: H_GUS, yaw: -0.15, lHand: { kind: "football" } })],
  },
  {
    id: "01c", start: 131, end: 177, set: "Hallway", light: "hallway", lightTarget: H_GUS,
    cam: fr(head(H_GUS[0], 0, H_GUS[2], "gus"), 1.0, { yaw: 0.04, elev: 0.02 }), push: 0.05,
    actors: [gus({ pos: H_GUS, poses: [{ f: 0, pose: "idle" }], expr: [{ f: 0, e: "neutral" }, { f: 160, e: "annoyed" }] })],
  },
  // hard cut on "famous" (179): Tre striking a pose by the lockers, lens flare
  {
    id: "01d", start: 177, end: 216, set: "Hallway", light: "hallway", lightTarget: [1.2, 1, -0.7],
    cam: fr(head(1.2, 0, -0.7, "tre"), 2.0, { yaw: -0.25, elev: -0.45, fov: 40, headAt: 0.3 }),
    camEnd: fr(head(1.2, 0, -0.7, "tre"), 1.8, { yaw: -0.1, elev: -0.4, fov: 40, headAt: 0.3 }),
    shake: [{ f: 177, amp: 0.7 }],
    actors: [tre({ pos: [1.2, 0, -0.7], yaw: -0.25, poses: [{ f: 0, pose: "flex" }], expr: [{ f: 0, e: "smug" }] })],
    fx: [{ kind: "flash", f: 177, len: 4 }, { kind: "flare", f: 178 }],
  },

  // ===== 02 BEDROOM 2:13 AM — "This is Tre. Tre checks his phone like four hundred times a day. Not for girls. For coaches."
  {
    id: "02a", start: 216, end: 262, set: "Bedroom", light: "bedroom", lightTarget: [0, 1, -1],
    cam: { pos: [1.7, 1.75, 2.3], target: [-0.35, 0.95, -1.0], fov: 46 }, push: 0.04,
    actors: [tre({ pos: BED_TRE, poses: [{ f: 0, pose: "sit" }, { f: 216, pose: "phoneHold", blend: 1 }], expr: [{ f: 0, e: "neutral" }], rHand: { kind: "phone", screen: "feed", light: 2.2 } })],
  },
  // montage: refresh x3, half a second each
  {
    id: "02b", start: 262, end: 277, set: "Bedroom", light: "bedroom", lightTarget: [0, 1, -1],
    cam: fr(head(BED_TRE[0], BED_TRE[1], BED_TRE[2], "tre"), 1.2, { yaw: 0.25, elev: 0.1 }), push: 0.05,
    actors: [tre({ pos: BED_TRE, poses: [{ f: 0, pose: "phoneHold" }], expr: [{ f: 0, e: "hyped" }], rHand: { kind: "phone", screen: "feed", light: 2.2 } })],
    fx: [{ kind: "flash", f: 262, len: 3 }],
  },
  {
    id: "02c", start: 277, end: 292, set: "Bathroom", light: "hallway", lightTarget: [0, 1, -0.6],
    cam: fr(head(0, 0, -0.6, "tre"), 1.2, { yaw: -0.2, elev: 0.05 }), push: 0.05,
    actors: [tre({ pos: [0, 0, -0.6], poses: [{ f: 0, pose: "phoneHold" }], expr: [{ f: 0, e: "hyped" }], rHand: { kind: "phone", screen: "feed" } })],
    fx: [{ kind: "flash", f: 277, len: 3 }],
  },
  {
    id: "02d", start: 292, end: 310, set: "Cafeteria", light: "cafeteria", lightTarget: [4.3, 1, 0.3],
    cam: fr([4.95, 1.6, 0.25], 2.4, { yaw: -0.75, elev: 0.15, fov: 38 }), push: 0.05,
    actors: [
      tre({ pos: [4.15, 0, 0.4], yaw: 0.35, poses: [{ f: 0, pose: "phoneHold" }], expr: [{ f: 0, e: "hyped" }], rHand: { kind: "phone", screen: "feed" } }),
      { who: LUNCH_LADY, pos: [5.95, 0, 0.0], yaw: -1.4, poses: [{ f: 0, pose: "armsCrossed" }], expr: [{ f: 0, e: "annoyed" }] },
    ],
    fx: [{ kind: "flash", f: 292, len: 3 }],
  },
  {
    id: "02e", start: 310, end: 366, set: "Bedroom", light: "bedroom", lightTarget: [0, 1, -1],
    cam: fr(head(BED_TRE[0], BED_TRE[1], BED_TRE[2], "tre"), 1.35, { yaw: -0.3, elev: 0.15 }), push: 0.04,
    actors: [tre({ pos: BED_TRE, poses: [{ f: 0, pose: "phoneHold" }], expr: [{ f: 0, e: "neutral" }, { f: 340, e: "smug" }], rHand: { kind: "phone", screen: "feed", light: 2.2 } })],
  },
  {
    id: "02f", start: 366, end: 406, set: "Bedroom", light: "bedroom", lightTarget: [0, 1, -1],
    cam: fr(head(BED_TRE[0], BED_TRE[1], BED_TRE[2], "tre"), 1.1, { yaw: 0.08, elev: -0.02 }), push: 0.06,
    actors: [tre({ pos: BED_TRE, poses: [{ f: 0, pose: "phoneHold" }], expr: [{ f: 0, e: "hyped" }], rHand: { kind: "phone", screen: "feed", light: 2.6 } })],
  },

  // ===== 03 — TRE (whisper): "Bro. A coach looked at my story."
  {
    id: "03a", start: 406, end: 436, set: "Bedroom", light: "bedroom", lightTarget: [0, 1, -1],
    cam: fr(head(BED_TRE[0], BED_TRE[1], BED_TRE[2], "tre"), 1.05, { yaw: -0.1, elev: 0.0 }), push: 0.07,
    actors: [tre({ pos: BED_TRE, poses: [{ f: 0, pose: "phoneHold" }], expr: [{ f: 0, e: "shocked" }], rHand: { kind: "phone", screen: "lock", light: 2.6 } })],
  },
  {
    id: "03b", start: 436, end: 484, set: "Bedroom", light: "bedroom", lightTarget: [0, 1, -1],
    cam: insertCam([0.2, 1.2, 0.6]), push: 0.05,
    actors: [],
    extra: insertPhone([0.2, 1.2, 0.6], "lock", 436),
  },

  // ===== 04 — GUS: "It was a grad assistant. From a school with no football team."
  {
    id: "04a", start: 484, end: 541, set: "Classroom", light: "classroom", lightTarget: [0.8, 1, -0.9],
    cam: fr(head(0.8, 0, -0.9, "gus"), 1.2, { yaw: -0.22, elev: 0.05 }), push: 0.04,
    actors: [gus({ pos: [0.8, 0, -0.9], poses: [{ f: 0, pose: "armsCrossed" }] })],
  },
  {
    id: "04b", start: 541, end: 625, set: "Bedroom", light: "bedroom", lightTarget: [0, 1, -1],
    cam: fr(head(BED_TRE[0], BED_TRE[1], BED_TRE[2], "tre"), 1.15, { yaw: 0.2, elev: 0.05 }), push: 0.05,
    shake: [{ f: 597, amp: 0.35 }],
    actors: [tre({ pos: BED_TRE, poses: [{ f: 0, pose: "phoneHold" }], expr: [{ f: 0, e: "hyped" }, { f: 572, e: "neutral" }, { f: 584, e: "sad" }], rHand: { kind: "phone", screen: "lock", light: 2.2 } })],
  },

  // ===== 05 HALLWAY — "Tre runs routes in the hallway. Between classes. With no ball."
  {
    id: "05a", start: 625, end: 687, set: "Hallway", light: "hallway", lightTarget: [0, 1, 0],
    cam: { pos: [-1.6, 1.6, 5.6], target: [-1.6, 1.15, -0.3], fov: 46 },
    camEnd: { pos: [0.9, 1.6, 5.4], target: [0.9, 1.15, -0.3], fov: 46 },
    actors: [
      tre({ pos: [-3.6, 0, 0.1], yaw: Math.PI / 2, poses: [{ f: 0, pose: "run" }], expr: [{ f: 0, e: "hyped" }], move: { f0: 625, f1: 687, to: [2.4, 0, 0.1] } }),
      { who: KID, pos: [-2.4, 0, -1.15], yaw: 0.3, poses: [{ f: 0, pose: "idle" }], expr: [{ f: 0, e: "neutral" }], look: [{ f: 640, yaw: 0.7, dur: 10 }] },
      { who: KID2, pos: [1.9, 0, -1.1], yaw: -0.3, poses: [{ f: 0, pose: "phoneHold" }], expr: [{ f: 0, e: "neutral" }], rHand: { kind: "phone", screen: "feed" } },
      gus({ pos: [-0.6, 0, -1.05], poses: [{ f: 0, pose: "idle" }], mouth: "none" }),
    ],
  },
  {
    id: "05b", start: 687, end: 734, set: "Hallway", light: "hallway", lightTarget: [0.6, 1, 0],
    cam: fr([0.65, 1.45, 0], 2.7, { yaw: 0.1, elev: 0.1, fov: 38 }), push: 0.04,
    actors: [
      tre({ pos: [0.0, 0, 0.0], yaw: 0.9, poses: [{ f: 0, pose: "juke" }], expr: [{ f: 0, e: "smug" }] }),
      { who: FRESHMAN, pos: [1.35, 0, 0.15], yaw: -1.1, poses: [{ f: 0, pose: "phoneHold" }], expr: [{ f: 0, e: "neutral" }, { f: 705, e: "shocked" }], lHand: { kind: "books" } },
    ],
  },
  {
    id: "05c", start: 734, end: 790, set: "Hallway", light: "hallway", lightTarget: [1.35, 1, 0.15],
    cam: fr(head(1.35, 0, 0.15, "freshman"), 2.1, { yaw: -0.3, elev: 0.35, fov: 38 }), push: 0.04,
    shake: [{ f: 745, amp: 0.4 }],
    actors: [
      { who: FRESHMAN, pos: [1.35, 0, 0.15], yaw: -0.6, poses: [{ f: 0, pose: "phoneHold" }, { f: 738, pose: "stumble", blend: 3 }, { f: 762, pose: "sit", blend: 6 }], expr: [{ f: 0, e: "shocked" }], move: { f0: 760, f1: 768, to: [1.35, -0.455, 0.15] } },
      tre({ pos: [0.6, 0, 0.3], yaw: 1.3, poses: [{ f: 0, pose: "juke" }, { f: 744, pose: "run" }], move: { f0: 744, f1: 790, to: [3.8, 0, 0.6] } }),
    ],
    extra: spill([1.45, 1.0, 0.3], 742),
  },

  // ===== 06 HALLWAY WIDE — "He's undefeated against freshmen."
  {
    id: "06a", start: 790, end: 861, set: "Hallway", light: "hallway", lightTarget: [0, 1, 0],
    cam: fr([0.2, 1.25, -0.2], 3.4, { yaw: 0.05, elev: 0.5, fov: 42 }), push: 0.035,
    actors: [
      tre({ pos: [-0.65, 0, 0.55], yaw: 0.2, poses: [{ f: 0, pose: "celebrate" }], expr: [{ f: 0, e: "hyped" }] }),
      gus({ pos: [1.25, 0, -0.95], yaw: -0.3, poses: [{ f: 0, pose: "idle" }, { f: 806, pose: "facepalm", blend: 8 }], mouth: "none" }),
      { who: FRESHMAN, pos: [0.55, -0.455, -0.2], yaw: 0.4, poses: [{ f: 0, pose: "sit" }], expr: [{ f: 0, e: "sad" }] },
    ],
    extra: (f) => spill([0.75, 1.0, 0.0], 700)(f + 60),
  },

  // ===== 07 CAFETERIA — "He posted his own highlight tape at two in the morning. Eleven slow-mo replays of the same catch."
  {
    id: "07a", start: 861, end: 912, set: "Cafeteria", light: "cafeteria", lightTarget: [0, 1, 0],
    cam: fr([0.02, 1.5, -0.05], 2.7, { yaw: 0.05, elev: 0.25, fov: 38 }), push: 0.035,
    actors: [
      gus({ pos: CAF_GUS, poses: [{ f: 0, pose: "phoneHold" }], mouth: "chew", rHand: { kind: "sandwich" }, look: [{ f: 0, yaw: 0.45, pitch: 0.1 }] }),
      tre({ pos: CAF_TRE, yaw: -0.55, poses: [{ f: 0, pose: "phoneShow" }], expr: [{ f: 0, e: "hyped" }], rHand: { kind: "phone", screen: "post" } }),
    ],
  },
  {
    id: "07b", start: 912, end: 950, set: "Cafeteria", light: "cafeteria", lightTarget: [0, 1, 0],
    cam: fr([CAF_TRE[0], CAF_TRE[1] + HEAD.tre, CAF_TRE[2]], 1.15, { yaw: -0.25, elev: 0.0 }), push: 0.05,
    actors: [tre({ pos: CAF_TRE, yaw: -0.3, poses: [{ f: 0, pose: "talk" }], expr: [{ f: 0, e: "smug" }], mouth: "none" })],
  },
  {
    id: "07c", start: 950, end: 1000, set: "Cafeteria", light: "cafeteria", lightTarget: [0, 1, 0],
    cam: insertCam([0.1, 1.3, 1.6]), push: 0.06,
    actors: [], extra: insertPhone([0.1, 1.3, 1.6], "post", 950),
  },
  {
    id: "07d", start: 1000, end: 1035, set: "Cafeteria", light: "cafeteria", lightTarget: [0, 1, 0],
    cam: fr([CAF_TRE[0], CAF_TRE[1] + HEAD.tre, CAF_TRE[2]], 1.3, { yaw: 0.2, elev: -0.05 }), push: 0.05,
    actors: [tre({ pos: CAF_TRE, yaw: -0.2, poses: [{ f: 0, pose: "celebrate" }], expr: [{ f: 0, e: "hyped" }], mouth: "none" })],
  },

  // ===== 08 — GUS: "Four likes. One was his mom. One was me. By accident."
  {
    id: "08a", start: 1035, end: 1072, set: "Cafeteria", light: "cafeteria", lightTarget: [0, 1, 0],
    cam: insertCam([0.1, 1.3 - 0.104, 1.6], 0.36, 0.36), push: 0.07,
    actors: [], extra: insertPhone([0.1, 1.3, 1.6], "post", 1035),
  },
  {
    id: "08b", start: 1072, end: 1110, set: "Cafeteria", light: "cafeteria", lightTarget: [0, 1, 0],
    cam: fr([CAF_GUS[0], CAF_GUS[1] + HEAD.gus, CAF_GUS[2]], 1.1, { yaw: 0.25, elev: 0.03 }), push: 0.04,
    actors: [gus({ pos: CAF_GUS, poses: [{ f: 0, pose: "phoneHold" }], mouth: "chew", rHand: { kind: "sandwich" } })],
  },
  {
    id: "08c", start: 1110, end: 1150, set: "Cafeteria", light: "cafeteria", lightTarget: [0, 1, 0],
    cam: fr([CAF_TRE[0], CAF_TRE[1] + HEAD.tre, CAF_TRE[2]], 1.15, { yaw: 0.3, elev: 0.0 }), push: 0.05,
    actors: [tre({ pos: CAF_TRE, yaw: 0, poses: [{ f: 0, pose: "phoneHold" }], expr: [{ f: 0, e: "neutral" }, { f: 1126, e: "annoyed" }], rHand: { kind: "phone", screen: "post" }, look: [{ f: 1114, yaw: -0.7, pitch: 0.05, dur: 16 }] })],
  },
  {
    id: "08d", start: 1150, end: 1209, set: "Cafeteria", light: "cafeteria", lightTarget: [0, 1, 0],
    cam: fr([CAF_GUS[0], CAF_GUS[1] + HEAD.gus, CAF_GUS[2]], 0.95, { yaw: 0.05, elev: 0.0 }), push: 0.05,
    actors: [gus({ pos: CAF_GUS, poses: [{ f: 0, pose: "phoneHold" }], mouth: "chew", rHand: { kind: "sandwich" } })],
  },

  // ===== 09 FIELD, GOLDEN HOUR — "Meanwhile, I snap a ball fifteen yards backwards, between my legs, perfect spiral, every single day. Nobody claps."
  {
    id: "09a", start: 1209, end: 1262, set: "Field", light: "golden", lightTarget: [0, 1, 6],
    cam: { pos: [1.0, 4.2, PUNT_Z + 6.5], target: [0.2, 0.3, 4.5], fov: 42 },
    camEnd: { pos: [0.8, 3.9, PUNT_Z + 6.0], target: [0.2, 0.3, 4.2], fov: 42 },
    actors: [
      gus({ pos: [0, 0, 0], yaw: Math.PI, poses: [{ f: 0, pose: "snap" }], mouth: "none" }),
      { who: PUNTER, pos: [0, 0, PUNT_Z], yaw: Math.PI, poses: [{ f: 0, pose: "idle" }], expr: [{ f: 0, e: "neutral" }] },
    ],
    extra: snapBall,
  },
  {
    id: "09b", start: 1262, end: 1300, set: "Field", light: "golden", lightTarget: [0, 1, 0],
    cam: { pos: [1.7, 0.55, 2.3], target: [0, 0.45, -0.1], fov: 38 }, push: 0.04,
    actors: [gus({ pos: [0, 0, 0], yaw: Math.PI, poses: [{ f: 0, pose: "snap" }], mouth: "none" })],
    extra: snapBall,
  },
  {
    id: "09c", start: 1300, end: 1345, set: "Field", light: "golden", lightTarget: [0, 1, 6],
    cam: { pos: [ballPos(0.28)[0] + 0.9, ballPos(0.28)[1] + 0.15, ballPos(0.28)[2] + 1.1], target: ballPos(0.28), fov: 34 },
    camEnd: { pos: [ballPos(0.72)[0] + 0.9, ballPos(0.72)[1] + 0.15, ballPos(0.72)[2] + 1.1], target: ballPos(0.72), fov: 34 },
    push: 0,
    actors: [
      gus({ pos: [0, 0, 0], yaw: Math.PI, poses: [{ f: 0, pose: "snap" }], mouth: "none" }),
      { who: PUNTER, pos: [0, 0, PUNT_Z], yaw: Math.PI, poses: [{ f: 0, pose: "idle" }], expr: [{ f: 0, e: "neutral" }] },
    ],
    extra: snapBall,
  },
  {
    id: "09d", start: 1345, end: 1410, set: "Field", light: "golden", lightTarget: [0, 1, PUNT_Z],
    cam: { pos: [1.3, 2.5, PUNT_Z + 3.8], target: [-0.2, 0.8, PUNT_Z - 5], fov: 40 }, push: 0.04,
    actors: [
      gus({ pos: [0, 0, 0], yaw: Math.PI, poses: [{ f: 0, pose: "snap" }, { f: 1372, pose: "idle", blend: 12 }], mouth: "none", turn: { f0: 1380, f1: 1400, to: 0 } }),
      { who: PUNTER, pos: [0, 0, PUNT_Z], yaw: Math.PI, poses: [{ f: 0, pose: "phoneShow" }, { f: 1362, pose: "idle", blend: 10 }], expr: [{ f: 0, e: "neutral" }], rHand: { kind: "football" } },
    ],
    extra: (f) => (f < 1356 ? snapBall(f) : null),
  },
  {
    id: "09e", start: 1410, end: 1498, set: "Field", light: "golden", lightTarget: [0, 1, 0],
    cam: fr(head(0, 0, 0, "gus"), 1.25, { yaw: 0.0, elev: 0.02, fov: 33 }), push: 0.04,
    actors: [gus({ pos: [0, 0, 0], poses: [{ f: 0, pose: "idle" }], expr: [{ f: 0, e: "neutral" }] })],
  },

  // ===== 10 — "If I do my job, nobody knows my name. If I mess up once..."
  {
    id: "10a", start: 1498, end: 1560, set: "Field", light: "golden", lightTarget: [0, 1, 0],
    cam: fr(head(0, 0, 0, "gus"), 1.6, { yaw: 0.35, elev: 0.08, fov: 33 }), push: 0.035,
    actors: [gus({ pos: [0, 0, 0], poses: [{ f: 0, pose: "talk" }] })],
  },
  {
    id: "10b", start: 1560, end: 1625, set: "Field", light: "golden", lightTarget: [0, 1, 0],
    cam: fr(head(0, 0, 0, "gus"), 1.15, { yaw: -0.05, fov: 33 }),
    camEnd: fr(head(0, 0, 0, "gus"), 0.85, { yaw: -0.05, fov: 33 }), push: 0,
    actors: [gus({ pos: [0, 0, 0], poses: [{ f: 0, pose: "idle" }], expr: [{ f: 0, e: "neutral" }, { f: 1600, e: "sad" }] })],
  },
  // imagination: the snap sails over the punter, crowd gasps, flash
  {
    id: "10c", start: 1625, end: 1658, set: "Field", light: "golden", lightTarget: [0, 1, 6],
    cam: { pos: [2.2, 1.3, PUNT_Z + 8], target: [0, 2.8, PUNT_Z - 1], fov: 50 }, push: 0.05,
    shake: [{ f: 1646, amp: 0.6 }],
    actors: [
      gus({ pos: [0, 0, 0], yaw: Math.PI, poses: [{ f: 0, pose: "snap" }], mouth: "none" }),
      { who: PUNTER, pos: [0, 0, PUNT_Z], yaw: Math.PI, poses: [{ f: 0, pose: "idle" }, { f: 1636, pose: "celebrate", blend: 4 }], expr: [{ f: 0, e: "shocked" }], look: [{ f: 1634, yaw: 0, pitch: -0.6, dur: 6 }] },
    ],
    extra: badBall,
    fx: [{ kind: "dream" }, { kind: "flash", f: 1625, len: 5 }, { kind: "flash", f: 1650, len: 8 }],
  },

  // ===== 11 — "...everybody knows my name."  (dead serious)
  {
    id: "11a", start: 1658, end: 1715, set: "Field", light: "golden", lightTarget: [0, 1, 0],
    cam: fr(head(0, 0, 0, "gus"), 0.82, { yaw: 0, elev: 0, fov: 30 }), push: 0.06,
    actors: [gus({ pos: [0, 0, 0], poses: [{ f: 0, pose: "idle" }], expr: [{ f: 0, e: "annoyed" }] })],
    fx: [{ kind: "vignette", strength: 0.5 }],
  },

  // ===== 12 BLEACHERS — TRE: "They moved a FOUR-STAR ahead of me! He runs a four-seven!"
  {
    id: "12a", start: 1715, end: 1748, set: "Field", setMode: "bleachers", light: "golden", lightTarget: [0, 1.5, 1],
    cam: fr([0.3, 2.0, 1.0], 3.3, { yaw: 0.05, elev: 0.3, fov: 42, headAt: 0.34 }), push: 0.04,
    shake: [{ f: 1740, amp: 0.9 }],
    actors: [
      gus({ pos: BL_GUS, poses: [{ f: 0, pose: "sit" }], mouth: "none", look: [{ f: 1722, yaw: -0.5, dur: 10 }] }),
      tre({ pos: [3.6, 0, 2.4], yaw: -Math.PI / 2, poses: [{ f: 0, pose: "run" }, { f: 1731, pose: "phoneShow", blend: 4 }], expr: [{ f: 0, e: "shocked" }, { f: 1738, e: "eyeTwitch" }], rHand: { kind: "phone", screen: "feed" }, move: { f0: 1715, f1: 1732, to: [0.7, 0, 2.4] }, turn: { f0: 1728, f1: 1736, to: -0.35 } }),
    ],
  },
  {
    id: "12b", start: 1748, end: 1812, set: "Field", setMode: "bleachers", light: "golden", lightTarget: [0, 1.5, 1],
    cam: fr(head(0.7, 0, 2.4, "tre"), 1.25, { yaw: 0.1, elev: -0.1, fov: 34 }), push: 0.05,
    shake: [{ f: 1787, amp: 0.6 }],
    actors: [tre({ pos: [0.7, 0, 2.4], yaw: -0.2, poses: [{ f: 0, pose: "phoneShow" }], expr: [{ f: 0, e: "eyeTwitch" }], rHand: { kind: "phone", screen: "feed" } })],
  },

  // ===== 13 — GUS: "I'm not even ranked. There's no ranking for long snappers. There's like six of us."
  {
    id: "13a", start: 1812, end: 1870, set: "Field", setMode: "bleachers", light: "golden", lightTarget: [0, 1.5, 0],
    cam: fr([BL_GUS[0], BL_GUS[1] + HEAD.gus, BL_GUS[2]], 1.15, { yaw: 0.15, elev: 0.0 }), push: 0.04,
    actors: [gus({ pos: BL_GUS, poses: [{ f: 0, pose: "sit" }] })],
  },
  {
    id: "13b", start: 1870, end: 1925, set: "Field", setMode: "bleachers", light: "golden", lightTarget: [0, 1.5, 0],
    cam: fr([0.07, 2.27, -0.05], 2.0, { yaw: 0.0, elev: 0.1, fov: 36 }), push: 0.04,
    actors: [
      gus({ pos: BL_GUS, poses: [{ f: 0, pose: "sit" }] }),
      tre({ pos: BL_TRE, poses: [{ f: 0, pose: "sit" }], expr: [{ f: 0, e: "shocked" }], look: [{ f: 0, yaw: -0.55 }], mouth: "none" }),
    ],
  },
  {
    id: "13c", start: 1925, end: 1962, set: "Field", setMode: "bleachers", light: "golden", lightTarget: [0, 1.5, 0],
    cam: fr([BL_GUS[0], BL_GUS[1] + HEAD.gus, BL_GUS[2]], 0.95, { yaw: -0.1 }), push: 0.05,
    actors: [gus({ pos: BL_GUS, poses: [{ f: 0, pose: "sit" }] })],
  },
  {
    id: "13d", start: 1962, end: 1989, set: "Field", setMode: "bleachers", light: "golden", lightTarget: [0, 1.5, 0],
    cam: fr([BL_TRE[0], BL_TRE[1] + HEAD.tre, BL_TRE[2]], 1.0, { yaw: -0.15 }), push: 0.04,
    actors: [tre({ pos: BL_TRE, poses: [{ f: 0, pose: "sit" }], expr: [{ f: 0, e: "neutral" }], look: [{ f: 0, yaw: -0.35 }], blinks: [1966, 1976], mouth: "none" })],
  },

  // ===== 14 — "Then my phone buzzed."  (phone on the bleacher, then the DM)
  {
    id: "14a", start: 1989, end: 2020, set: "Field", setMode: "bleachers", light: "golden", lightTarget: [0, 1.5, 0],
    cam: { pos: [-1.15, 2.25, 0.55], target: [-1.15, 1.32, -0.02], fov: 34 }, push: 0.05,
    shake: [{ f: 2003, amp: 0.25 }],
    actors: [gus({ pos: BL_GUS, poses: [{ f: 0, pose: "sit" }], mouth: "none" })],
    extra: insertPhone([-1.15, 1.335, -0.02], PHONE_DM, 1989, { buzz: [2002, 2020], flat: true }),
  },
  {
    id: "14b", start: 2020, end: 2060, set: "Field", setMode: "bleachers", light: "golden", lightTarget: [0, 1.5, 0],
    cam: insertCam([-0.45, 2.2, 1.2], 0.5, 0.33), push: 0.06,
    actors: [], extra: insertPhone([-0.45, 2.2, 1.2], PHONE_DM, 2020),
  },

  // ===== 15 — GUS: "...Who's Coach Briggs?"  TRE: "...WHO'S Coach Briggs?"  -> smash cut
  {
    id: "15a", start: 2060, end: 2104, set: "Field", setMode: "bleachers", light: "golden", lightTarget: [0, 1.5, 0],
    cam: fr([0.07, 2.27, -0.05], 2.0, { yaw: -0.08, elev: 0.15, fov: 36 }), push: 0.04,
    actors: [
      gus({ pos: BL_GUS, poses: [{ f: 0, pose: "sit" }, { f: 2060, pose: "phoneHold", blend: 1 }], rHand: { kind: "phone", screen: PHONE_DM } }),
      tre({ pos: BL_TRE, poses: [{ f: 0, pose: "sit" }], expr: [{ f: 0, e: "neutral" }], mouth: "none" }),
    ],
  },
  {
    id: "15b", start: 2104, end: 2162, set: "Field", setMode: "bleachers", light: "golden", lightTarget: [0, 1.5, 0],
    cam: fr([0.1, 2.3, -0.05], 1.85, { yaw: 0.1, elev: 0.05, fov: 34 }), push: 0.07,
    actors: [
      gus({ pos: BL_GUS, poses: [{ f: 0, pose: "phoneHold" }], rHand: { kind: "phone", screen: PHONE_DM }, mouth: "none" }),
      tre({ pos: BL_TRE, poses: [{ f: 0, pose: "sit" }], expr: [{ f: 0, e: "neutral" }, { f: 2112, e: "eyeTwitch" }], look: [{ f: 2104, yaw: 0, pitch: 0 }, { f: 2106, yaw: -0.75, pitch: 0.25, dur: 30 }] }),
    ],
  },
];
