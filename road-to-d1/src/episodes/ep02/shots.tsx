import React from "react";
import { Shot, Actor } from "../types";
import { GUS, TRE } from "../../characters/cast";
import { COACH, KID, KID2, LUNCH_LADY } from "../../characters/extras";
import { CharSpec, V3 } from "../../characters/types";
import { frame as fr, HEAD, Cam } from "../../lib/camera";
import { Crowd, Person, scatter, CrowdPerson } from "../../characters/Crowd";
import { Phone, Screen } from "../../props/Phone";
import { Tray, Football } from "../../props/Props";
import { lerp, smooth, clamp } from "../../lib/anim";

/*
 * EPISODE 2 — "IN THIS TOWN". Everyone's recruiting star rating floats above their head.
 * Tre (3 stars) does everything to get a 4th. Gus has an empty gray circle — until a coach
 * walks past every five-star kid and stops at the long snapper.
 *
 * Frames are global, from ep02/timeline.json word onsets (see the line comments).
 * Faster cutting than Ep 1 (~1-1.5 s) to match the "In This Town" format.
 */

// ---- helpers ------------------------------------------------------------------------------
const hy = (s: CharSpec) => s.thigh + s.shin + 0.085 + s.torsoH + 0.06 + s.headH / 2;
const head = (p: V3, who: "gus" | "tre"): V3 => [p[0], p[1] + HEAD[who], p[2]];
// close-up that leaves room for the badge above the head
const cu = (p: V3, who: "gus" | "tre", w = 1.35, o: { yaw?: number; elev?: number; fov?: number } = {}): Cam =>
  fr(head(p, who), w, { headAt: 0.47, ...o });
const yawTo = (from: V3, to: V3) => Math.atan2(to[0] - from[0], to[2] - from[2]);

const TRE_STARS = [{ f: 0, n: 3 }];
const GUS_STARS = [{ f: 0, n: 0 }];
const gus = (o: Partial<Actor> & { pos: V3 }): Actor => ({ who: GUS, poses: [{ f: 0, pose: "idle" }], expr: [{ f: 0, e: "neutral" }], stars: GUS_STARS, ...o });
const tre = (o: Partial<Actor> & { pos: V3 }): Actor => ({ who: TRE, poses: [{ f: 0, pose: "idle" }], expr: [{ f: 0, e: "hyped" }], mouth: "none", stars: TRE_STARS, ...o });

// ---- crowds ---------------------------------------------------------------------------------
const TOWN_CROWD = scatter(42, "town", [-5.2, 5.2], [-16, 3], { avoid: [0, 0, 1.4] });
const NEAR_CROWD = scatter(14, "near", [-3.2, 3.2], [-5, -0.8], { avoid: [0, 0, 1.2], faceCam: true });
// five-star kid surrounded by fans looking at him
const FAMOUS_AT: V3 = [0, 0, -0.5];
const FANS: CrowdPerson[] = scatter(12, "fans", [-2.6, 2.6], [-3.2, 1.2], { avoid: [0, -0.5, 1.1], stars: (i) => 1 + (i % 3) })
  .map((p) => ({ ...p, yaw: yawTo(p.pos, FAMOUS_AT) }));
const crowdNode = (people: CrowdPerson[]) => (f: number) => <Crowd people={people} t={f} />;

// ---- recruiting day lineup (Field set) ------------------------------------------------------
const LINE_Z = 0;
const LINE_X = [-6.6, -5.5, -4.4, -3.3, -2.2, -1.1, 0.0, 1.2, 2.3, 3.4];
const TRE_X = 1.2, GUS_X = 3.4, QB_X = -3.3, TWIN_X = [-1.1, 0.0];
const lineup = (f: number, look = 0) => (
  <group>
    {LINE_X.filter((x) => x !== TRE_X && x !== GUS_X).map((x) => {
      const twin = TWIN_X.includes(x);
      return (
        <Person key={x} pos={[x, 0, LINE_Z]} seed={twin ? "twin" : `ln${x}`} stars={5} t={f} scale={x === QB_X ? 1.14 : 1}
          jersey={x === QB_X ? "#C0392B" : twin ? "#3D7BF2" : undefined} look={look ? Math.sign(GUS_X - x) * look : 0} />
      );
    })}
  </group>
);
const COACHES: CrowdPerson[] = Array.from({ length: 9 }, (_, i) => ({ pos: [-6 + i * 1.4, 0, -5] as V3, seed: `coach${i}`, cap: i % 2 ? "#22305A" : "#7A1F2B", jersey: i % 2 ? "#22305A" : "#3A3F48", yaw: 0 }));
const coachRow = (f: number) => <Crowd people={COACHES} t={f} />;
const TRE_LINE: V3 = [TRE_X, 0, LINE_Z];
const GUS_LINE: V3 = [GUS_X, 0, LINE_Z];
const COACH_Z = 1.35;
const coachAt = (f: number): V3 => [lerp(-7.5, GUS_X, clamp((f - 1118) / (1290 - 1118))), 0, COACH_Z];
const theCoach = (o: Partial<Actor> = {}): Actor => ({
  who: COACH, pos: [-7.5, 0, COACH_Z], yaw: Math.PI / 2, poses: [{ f: 0, pose: "walk" }, { f: 1290, pose: "idle", blend: 8 }],
  expr: [{ f: 0, e: "neutral" }], move: { f0: 1118, f1: 1290, to: [GUS_X, 0, COACH_Z] }, turn: { f0: 1288, f1: 1300, to: Math.PI }, ...o,
});

// ---- inserts ---------------------------------------------------------------------------------
const insertPhone = (at: V3, screen: Screen, f0: number) => (frame: number) => (
  <group position={[at[0], at[1] + Math.sin((frame - f0) / 14) * 0.004, at[2]]} rotation={[0.05, Math.sin((frame - f0) / 30) * 0.04, 0]}>
    <Phone screen={screen} scale={1.7} scroll={frame * 9} />
  </group>
);
const insertCam = (at: V3): Cam => fr(at, 0.42, { fov: 30, headAt: 0.33 });

const BED_TRE: V3 = [0.2, -0.1, -1.0];
const MIRROR: V3 = [0, 0, -0.6];
const TOWN_TRE: V3 = [0.4, 0, 0];
const TOWN_GUS: V3 = [-0.3, 0, 0];

export const SHOTS: Shot[] = [
  // ===== 01 "In this town, everyone's recruiting rating floats above their head." (In@6 recruiting@52 floats@80 head@105)
  {
    id: "01a", start: 0, end: 50, set: "Town", light: "sunny", lightTarget: [0, 0, -6],
    cam: { pos: [0, 15, 20], target: [0, 0, -5], fov: 42 }, camEnd: { pos: [0, 9.5, 13], target: [0, 0.5, -3], fov: 42 }, push: 0,
    actors: [], extra: crowdNode(TOWN_CROWD),
  },
  {
    id: "01b", start: 50, end: 80, set: "Town", light: "sunny", lightTarget: [0, 0, -3],
    cam: fr([0, 1.7, -2], 4.2, { elev: 0.5, fov: 42 }), push: 0.05,
    actors: [], extra: crowdNode([...NEAR_CROWD, ...TOWN_CROWD]),
  },
  {
    id: "01c", start: 80, end: 115, set: "Town", light: "sunny", lightTarget: [0, 1, 0],
    cam: fr([0, 1.45 + 0.35, 0], 1.6, { yaw: 0.25, elev: -0.25, headAt: 0.5 }), push: 0.06,
    actors: [{ who: KID2, pos: [0, 0, 0], poses: [{ f: 0, pose: "idle" }], expr: [{ f: 0, e: "hyped" }], stars: [{ f: 0, n: 4 }], look: [{ f: 82, yaw: 0, pitch: -0.5, dur: 8 }] }],
    extra: crowdNode(NEAR_CROWD),
  },
  // "Five stars? You're basically famous." (Five@117 famous@167)
  {
    id: "01d", start: 115, end: 165, set: "Town", light: "sunny", lightTarget: [0, 1, 0],
    cam: fr([0, 1.6, -0.5], 3.6, { elev: 0.6, fov: 40 }), push: 0.05,
    actors: [{ who: KID, pos: FAMOUS_AT, poses: [{ f: 0, pose: "flex" }], expr: [{ f: 0, e: "smug" }], stars: [{ f: 0, n: 5 }] }],
    extra: crowdNode(FANS), fx: [{ kind: "flash", f: 115, len: 3 }],
  },
  {
    id: "01e", start: 165, end: 190, set: "Town", light: "sunny", lightTarget: [0, 1, 0],
    cam: fr([FAMOUS_AT[0], 1.5 + 0.3, FAMOUS_AT[2]], 1.5, { yaw: -0.3, elev: -0.3, headAt: 0.48 }), push: 0.08, shake: [{ f: 167, amp: 0.5 }],
    actors: [{ who: KID, pos: FAMOUS_AT, poses: [{ f: 0, pose: "celebrate" }], expr: [{ f: 0, e: "hyped" }], stars: [{ f: 0, n: 5 }], glow: [165, 190] }],
    extra: crowdNode(FANS), fx: [{ kind: "flare", f: 166 }],
  },
  // "Three stars? You're Tre." (Three@193 Tre@222)
  {
    id: "01f", start: 190, end: 239, set: "Town", light: "sunny", lightTarget: [0, 1, 0],
    cam: cu(TOWN_TRE, "tre", 1.5, { yaw: 0.15 }), push: 0.05,
    actors: [tre({ pos: TOWN_TRE, expr: [{ f: 0, e: "smug" }], look: [{ f: 196, yaw: 0, pitch: -0.5, dur: 6 }, { f: 218, yaw: 0.1, pitch: 0, dur: 6 }] })],
    extra: crowdNode(NEAR_CROWD),
  },

  // ===== 02 "Tre checks his stars like four hundred times a day. In mirrors. In windows. In spoons."
  {
    id: "02a", start: 239, end: 290, set: "Town", light: "sunny", lightTarget: [0, 1, -2],
    cam: { pos: [3.1, 2.0, 4.2], target: [3.4, 1.5, -2], fov: 40 }, camEnd: { pos: [3.1, 2.0, 5.6], target: [3.4, 1.5, -0.5], fov: 40 },
    actors: [tre({ pos: [3.4, 0.12, -3.2], yaw: 0, poses: [{ f: 0, pose: "walk" }], move: { f0: 239, f1: 290, to: [3.4, 0.12, 1.0] }, look: [{ f: 245, yaw: 0, pitch: -0.55, dur: 4 }, { f: 256, yaw: 0, pitch: 0, dur: 4 }, { f: 266, yaw: 0, pitch: -0.55, dur: 4 }, { f: 277, yaw: 0, pitch: 0, dur: 4 }] })],
    extra: crowdNode(TOWN_CROWD),
  },
  {
    id: "02b", start: 290, end: 327, set: "Town", light: "sunny", lightTarget: [0, 1, 0],
    cam: cu(TOWN_TRE, "tre", 1.35, { yaw: -0.2 }), push: 0.06,
    actors: [tre({ pos: TOWN_TRE, look: [{ f: 292, yaw: 0, pitch: -0.55, dur: 3 }, { f: 299, yaw: 0, pitch: 0, dur: 3 }, { f: 305, yaw: 0, pitch: -0.55, dur: 3 }, { f: 311, yaw: 0, pitch: 0, dur: 3 }, { f: 317, yaw: 0, pitch: -0.55, dur: 3 }] })],
    extra: crowdNode(NEAR_CROWD),
  },
  {
    id: "02c", start: 327, end: 354, set: "Bathroom", light: "hallway", lightTarget: [0, 1, -0.6],
    cam: cu(MIRROR, "tre", 1.45, { yaw: -0.25 }), push: 0.06, fx: [{ kind: "flash", f: 327, len: 3 }],
    actors: [tre({ pos: MIRROR, expr: [{ f: 0, e: "smug" }], look: [{ f: 0, yaw: 0, pitch: -0.5 }] })],
  },
  {
    id: "02d", start: 354, end: 386, set: "Hallway", light: "hallway", lightTarget: [3.6, 1, -1],
    cam: { pos: [1.2, 2.0, 1.9], target: [3.5, 1.75, -1.3], fov: 42 }, push: 0.06, fx: [{ kind: "flash", f: 354, len: 3 }],
    actors: [tre({ pos: [3.45, 0, -1.2], yaw: Math.PI * 0.82, expr: [{ f: 0, e: "smug" }], look: [{ f: 0, yaw: 0, pitch: -0.45 }] })],
  },
  {
    id: "02e", start: 386, end: 427, set: "Cafeteria", light: "cafeteria", lightTarget: [0, 1, 0],
    cam: cu([0.5, 0.49 - 0.685, -0.05], "tre", 1.25, { yaw: 0.15 }), push: 0.07, fx: [{ kind: "flash", f: 386, len: 3 }],
    actors: [tre({ pos: [0.5, 0.49 - 0.685, -0.05], poses: [{ f: 0, pose: "phoneHold" }], rHand: { kind: "spoon" }, expr: [{ f: 0, e: "smug" }], look: [{ f: 0, yaw: 0, pitch: 0.3 }] })],
  },

  // ===== 03 "And me? Zero stars. Just an empty gray circle. The lunch lady gives me extra fries out of pity."
  {
    id: "03a", start: 427, end: 449, set: "Town", light: "sunny", lightTarget: [0, 1, 0],
    cam: cu(TOWN_GUS, "gus", 1.3), push: 0.05,
    actors: [gus({ pos: TOWN_GUS, poses: [{ f: 0, pose: "talk" }] })], extra: crowdNode(NEAR_CROWD),
  },
  {
    id: "03b", start: 449, end: 498, set: "Town", light: "sunny", lightTarget: [0, 1, 0],
    cam: fr([TOWN_GUS[0], 1.6, 0], 3.4, { elev: 0.5, fov: 40 }), push: 0.05,
    actors: [gus({ pos: TOWN_GUS })], extra: crowdNode(NEAR_CROWD),
  },
  {
    id: "03c", start: 498, end: 540, set: "Town", light: "sunny", lightTarget: [0, 1, 0],
    cam: fr([TOWN_GUS[0], HEAD.gus + 0.35, TOWN_GUS[2]], 1.05, { elev: -0.45, headAt: 0.45 }), push: 0.07,
    actors: [gus({ pos: TOWN_GUS, look: [{ f: 0, yaw: 0, pitch: -0.4 }] })],
  },
  {
    id: "03d", start: 540, end: 595, set: "Cafeteria", light: "cafeteria", lightTarget: [4.8, 1, 0.4],
    cam: { pos: [3.9, 2.1, 3.7], target: [5.0, 1.25, 0.3], fov: 46 }, push: 0.04,
    actors: [
      gus({ pos: [4.15, 0, 0.55], yaw: 0.9, mouth: "none" }),
      { who: LUNCH_LADY, pos: [5.95, 0, 0.3], yaw: -1.4, poses: [{ f: 0, pose: "phoneShow" }], expr: [{ f: 0, e: "sad" }] },
    ],
    extra: (f) => <Tray position={[5.25, 1.03, 0.45]} rotation={[0, 0.3, 0]} food={false} fries={6 + clamp((f - 560) / 30) * 20} />,
  },
  {
    id: "03e", start: 595, end: 640, set: "Cafeteria", light: "cafeteria", lightTarget: [4.8, 1, 0.4],
    cam: { pos: [4.75, 1.8, 1.85], target: [5.5, 1.25, 0.35], fov: 40 }, push: 0.05,
    actors: [{ who: LUNCH_LADY, pos: [5.95, 0, 0.3], yaw: -1.4, poses: [{ f: 0, pose: "phoneShow" }], expr: [{ f: 0, e: "sad" }], look: [{ f: 0, yaw: 0, pitch: 0.15 }] }],
    extra: (f) => <Tray position={[5.25, 1.03, 0.45]} rotation={[0, 0.3, 0]} food={false} fries={26 + clamp((f - 600) / 25) * 18} />,
  },

  // ===== 04 "Tre tried everything to get a fourth star. He mewed for forty-one days. Fourteen-step skincare
  //          routine. Highlight tape at two in the morning. Nothing."
  {
    id: "04a", start: 640, end: 680, set: "Bedroom", light: "bedroom", lightTarget: [0, 1, -1],
    cam: { pos: [1.7, 1.85, 2.3], target: [-0.2, 1.2, -1.0], fov: 46 }, push: 0.05,
    actors: [tre({ pos: BED_TRE, poses: [{ f: 0, pose: "phoneHold" }], expr: [{ f: 0, e: "neutral" }], rHand: { kind: "phone", screen: "search", light: 2.2 } })],
  },
  {
    id: "04b", start: 680, end: 712, set: "Bedroom", light: "bedroom", lightTarget: [0, 1, -1],
    cam: insertCam([0.2, 1.2, 0.6]), push: 0.05, actors: [], extra: insertPhone([0.2, 1.2, 0.6], "search", 680),
  },
  {
    id: "04c", start: 712, end: 766, set: "Bathroom", light: "hallway", lightTarget: [0, 1, -0.6],
    cam: cu(MIRROR, "tre", 1.3, { yaw: 0.1, elev: -0.12 }), push: 0.07,
    actors: [tre({ pos: MIRROR, poses: [{ f: 0, pose: "armsCrossed" }], expr: [{ f: 0, e: "annoyed" }], look: [{ f: 0, yaw: 0, pitch: -0.22 }] })],
    fx: [{ kind: "counter", f0: 716, f1: 750, from: 1, to: 41, template: "DAY {n}" }],
  },
  {
    id: "04d", start: 766, end: 822, set: "Bathroom", light: "hallway", lightTarget: [0, 1, -0.6],
    cam: cu(MIRROR, "tre", 1.7, { yaw: 0.35, elev: 0.1 }), push: 0.04,
    actors: [tre({ pos: MIRROR, poses: [{ f: 0, pose: "phoneHold" }, { f: 785, pose: "facepalm", blend: 5 }, { f: 802, pose: "phoneHold", blend: 5 }], rHand: { kind: "bottle" } })],
    fx: [{ kind: "counter", f0: 768, f1: 815, from: 1, to: 14, template: "STEP {n}/14" }],
  },
  {
    id: "04e", start: 822, end: 878, set: "Bedroom", light: "bedroom", lightTarget: [0, 1, -1],
    cam: cu(BED_TRE, "tre", 1.5, { yaw: -0.3, elev: 0.1 }), push: 0.05,
    actors: [tre({ pos: BED_TRE, poses: [{ f: 0, pose: "phoneHold" }], expr: [{ f: 0, e: "hyped" }], rHand: { kind: "phone", screen: "post", light: 2.2 } })],
    fx: [{ kind: "label", f: 846, text: "2:04 AM" }],
  },
  {
    id: "04f", start: 878, end: 913, set: "Town", light: "sunny", lightTarget: [0, 1, 0],
    cam: cu(TOWN_TRE, "tre", 1.35), push: 0.06,
    actors: [tre({ pos: TOWN_TRE, expr: [{ f: 0, e: "hyped" }, { f: 896, e: "sad" }], look: [{ f: 0, yaw: 0, pitch: -0.55 }] })],
  },

  // ===== 05 TRE: "Why is it still THREE?!" (THREE@938)
  {
    id: "05a", start: 913, end: 968, set: "Town", light: "sunny", lightTarget: [0, 1, 0],
    cam: cu(TOWN_TRE, "tre", 1.15, { elev: -0.1 }), push: 0.09, shake: [{ f: 938, amp: 1.0 }],
    actors: [tre({ pos: TOWN_TRE, poses: [{ f: 0, pose: "celebrate" }], expr: [{ f: 0, e: "eyeTwitch" }], mouth: "auto", look: [{ f: 0, yaw: 0, pitch: -0.45 }] })],
    extra: crowdNode(NEAR_CROWD),
  },

  // ===== 06 "Then came recruiting day. Every coach in the state. Every five-star kid, lined up."
  {
    id: "06a", start: 968, end: 1013, set: "Field", light: "golden", lightTarget: [0, 1, 0],
    cam: { pos: [-2, 9, 13], target: [-1, 0.5, -1], fov: 44 }, camEnd: { pos: [-1, 6, 9.5], target: [-1, 0.8, -1], fov: 44 }, push: 0,
    actors: [tre({ pos: TRE_LINE }), gus({ pos: GUS_LINE })],
    extra: (f) => <>{lineup(f)}{coachRow(f)}</>,
  },
  {
    id: "06b", start: 1013, end: 1054, set: "Field", light: "golden", lightTarget: [0, 1, -5],
    cam: { pos: [-3, 2.0, 2.8], target: [-1.5, 1.4, -5], fov: 40 }, camEnd: { pos: [1.5, 2.0, 2.8], target: [3, 1.4, -5], fov: 40 }, push: 0,
    actors: [], extra: coachRow,
  },
  {
    id: "06c", start: 1054, end: 1120, set: "Field", light: "golden", lightTarget: [0, 1, 0],
    cam: { pos: [-6.5, 2.2, 3.2], target: [-5, 1.8, 0], fov: 38 }, camEnd: { pos: [2.4, 2.2, 3.2], target: [3.6, 1.8, 0], fov: 38 }, push: 0,
    actors: [tre({ pos: TRE_LINE }), gus({ pos: GUS_LINE })], extra: (f) => lineup(f),
  },

  // ===== 07 "One coach walked past all of them. Past the quarterback. Past the twins. Past Tre. And stopped at me."
  {
    id: "07a", start: 1120, end: 1179, set: "Field", light: "golden", lightTarget: [-3, 1, 0],
    cam: { pos: [-6.2, 1.8, 5.2], target: [-6.5, 1.5, 1], fov: 40 }, camEnd: { pos: [-3.6, 1.8, 5.2], target: [-3.8, 1.5, 1], fov: 40 }, push: 0,
    actors: [theCoach()], extra: (f) => lineup(f),
  },
  {
    id: "07b", start: 1179, end: 1215, set: "Field", light: "golden", lightTarget: [QB_X, 1, 0],
    cam: fr([QB_X, 2.0, LINE_Z], 1.9, { yaw: 0.2, elev: 0.0, headAt: 0.5 }), push: 0.05,
    actors: [theCoach()], extra: (f) => lineup(f),
  },
  {
    id: "07c", start: 1215, end: 1246, set: "Field", light: "golden", lightTarget: [-0.5, 1, 0],
    cam: fr([-0.55, 1.95, LINE_Z], 2.6, { yaw: 0.15, headAt: 0.5 }), push: 0.05,
    actors: [theCoach()], extra: (f) => lineup(f),
  },
  {
    id: "07d", start: 1246, end: 1282, set: "Field", light: "golden", lightTarget: TRE_LINE,
    cam: cu(TRE_LINE, "tre", 1.5, { yaw: 0.2 }), push: 0.05,
    actors: [theCoach(), tre({ pos: TRE_LINE, expr: [{ f: 0, e: "hyped" }, { f: 1262, e: "shocked" }], look: [{ f: 1250, yaw: -0.5, dur: 6 }, { f: 1262, yaw: 0.6, dur: 10 }] })],
    extra: (f) => lineup(f),
  },
  {
    id: "07e", start: 1282, end: 1331, set: "Field", light: "golden", lightTarget: GUS_LINE,
    cam: fr([GUS_X - 0.1, 1.75, 0.6], 2.6, { yaw: 1.0, elev: 0.15, fov: 38 }), push: 0.04,
    actors: [theCoach(), gus({ pos: GUS_LINE, mouth: "none", look: [{ f: 1296, yaw: 0, pitch: -0.15, dur: 8 }] })],
    extra: (f) => lineup(f),
  },

  // ===== 08 COACH: "Son. Do you long snap?"   09 GUS: "...Yeah."
  {
    id: "08a", start: 1331, end: 1395, set: "Field", light: "golden", lightTarget: GUS_LINE,
    cam: fr([GUS_X, HEAD.coach + 0.0, COACH_Z], 1.45, { yaw: Math.PI - 0.75, elev: -0.1, headAt: 0.44 }), push: 0.05,
    actors: [theCoach({ poses: [{ f: 0, pose: "idle" }] }), gus({ pos: GUS_LINE, mouth: "none" })],
  },
  {
    id: "09a", start: 1395, end: 1421, set: "Field", light: "golden", lightTarget: GUS_LINE,
    cam: cu(GUS_LINE, "gus", 1.3, { yaw: 0.1 }), push: 0.06,
    actors: [gus({ pos: GUS_LINE })], extra: (f) => lineup(f),
  },

  // ===== 10 "My circle started glowing. One star. Two. Three. Four. Five." (One@1473 Two@1501 Three@1519 Four@1539 Five@1578)
  {
    id: "10a", start: 1421, end: 1470, set: "Field", light: "golden", lightTarget: GUS_LINE,
    cam: fr([GUS_X, HEAD.gus + 0.4, LINE_Z], 1.25, { elev: -0.35, headAt: 0.46 }), push: 0.07,
    actors: [gus({ pos: GUS_LINE, mouth: "none", glow: [1440, 1700], look: [{ f: 0, yaw: 0, pitch: -0.35 }] })],
  },
  {
    id: "10b", start: 1470, end: 1565, set: "Field", light: "golden", lightTarget: GUS_LINE,
    cam: fr([GUS_X, HEAD.gus + 0.6, LINE_Z], 1.1, { elev: -0.15, headAt: 0.4 }), push: 0.08,
    shake: [{ f: 1473, amp: 0.2 }, { f: 1501, amp: 0.25 }, { f: 1519, amp: 0.3 }, { f: 1539, amp: 0.35 }],
    actors: [gus({ pos: GUS_LINE, mouth: "none", glow: [1440, 1700], look: [{ f: 0, yaw: 0, pitch: -0.35 }],
      stars: [{ f: 0, n: 0 }, { f: 1473, n: 1 }, { f: 1501, n: 2 }, { f: 1519, n: 3 }, { f: 1539, n: 4 }] })],
  },
  {
    id: "10c", start: 1565, end: 1623, set: "Field", light: "golden", lightTarget: [1, 1, 0],
    cam: fr([2.7, 1.95, 0.4], 3.3, { yaw: 0.8, elev: 0.35, fov: 40 }), push: 0.05, shake: [{ f: 1578, amp: 0.8 }],
    actors: [gus({ pos: GUS_LINE, mouth: "none", glow: [1440, 1700], stars: [{ f: 0, n: 4 }, { f: 1578, n: 5 }] }), tre({ pos: TRE_LINE, expr: [{ f: 0, e: "shocked" }], look: [{ f: 1582, yaw: 0.8, dur: 6 }] }), theCoach({ poses: [{ f: 0, pose: "idle" }] })],
    extra: (f) => lineup(f, f > 1584 ? 0.7 : 0), fx: [{ kind: "flash", f: 1578, len: 6 }, { kind: "flare", f: 1579 }],
  },

  // ===== 11 TRE: "HE DOESN'T EVEN HAVE A HIGHLIGHT TAPE!"
  {
    id: "11a", start: 1623, end: 1691, set: "Field", light: "golden", lightTarget: TRE_LINE,
    cam: cu(TRE_LINE, "tre", 1.2, { yaw: -0.15, elev: -0.08 }), push: 0.09, shake: [{ f: 1655, amp: 0.9 }],
    actors: [tre({ pos: TRE_LINE, poses: [{ f: 0, pose: "phoneShow" }], expr: [{ f: 0, e: "eyeTwitch" }], mouth: "auto", rHand: { kind: "phone", screen: "rank" } })],
    extra: (f) => lineup(f, 0.7),
  },

  // ===== 12 "I don't. I just snap the ball. Every single day."
  {
    id: "12a", start: 1691, end: 1760, set: "Field", light: "golden", lightTarget: GUS_LINE,
    cam: cu(GUS_LINE, "gus", 1.35, { yaw: 0.05 }), push: 0.05,
    actors: [gus({ pos: GUS_LINE, stars: [{ f: 0, n: 5 }], glow: [1691, 1760] })],
  },
  {
    id: "12b", start: 1760, end: 1802, set: "Field", light: "golden", lightTarget: [0, 1, 0],
    cam: { pos: [3.0, 1.5, 2.4], target: [0, 1.05, -0.2], fov: 40 }, push: 0.05,
    actors: [gus({ pos: [0, 0, 0], yaw: Math.PI, poses: [{ f: 0, pose: "snap" }], mouth: "none", stars: [{ f: 0, n: 5 }] })],
    extra: () => <Football position={[0, 0.13, -0.5]} rotation={[0.12, 0, 0]} scale={1.15} />,
  },
];
