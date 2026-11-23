import React from "react";
import { CharSpec, Expression, V3 } from "../characters/types";
import { PoseKey } from "../characters/poses";
import { Cam } from "../lib/camera";
import { LightPreset } from "../lib/Stage";
import { Screen } from "../props/Phone";

export type SetName = "Hallway" | "Classroom" | "Cafeteria" | "Bedroom" | "Bathroom" | "Field";

export type HandProp =
  | { kind: "phone"; screen: Screen; light?: number }
  | { kind: "football" }
  | { kind: "sandwich" }
  | { kind: "books" }
  | { kind: "pencil" }
  | { kind: "bottle" };

export type ExprKey = { f: number; e: Expression };
export type LookKey = { f: number; yaw: number; pitch?: number; dur?: number };

/** All frame numbers in a shot are GLOBAL episode frames, so they line up with timeline.json. */
export type Actor = {
  who: CharSpec;
  pos: V3;
  yaw?: number;
  poses: PoseKey[];
  expr: ExprKey[];
  look?: LookKey[];
  mouth?: "auto" | "chew" | "none";
  rHand?: HandProp;
  lHand?: HandProp;
  move?: { f0: number; f1: number; to: V3 };       // slide position over a frame range
  turn?: { f0: number; f1: number; to: number };   // rotate yaw over a frame range
  blinks?: number[];                                // forced blinks at these frames
};

export type Fx =
  | { kind: "flare"; f: number }
  | { kind: "flash"; f: number; color?: string; len?: number }
  | { kind: "dream" }
  | { kind: "tint"; color: string; opacity: number }
  | { kind: "vignette"; strength?: number }
  // on-screen sticker text (e.g. "DAY 41"); x/y are % of the frame, keep inside the safe zone
  | { kind: "label"; f: number; text: string; x?: number; y?: number; color?: string }
  // counting sticker: "{n}" in template counts from `from` to `to` between f0 and f1
  | { kind: "counter"; f0: number; f1: number; from: number; to: number; template: string; x?: number; y?: number };

export type Shot = {
  id: string;
  start: number;
  end: number;
  set: SetName;
  setMode?: "field" | "bleachers";
  light: LightPreset;
  lightTarget?: V3;
  cam: Cam;
  camEnd?: Cam;          // optional move; otherwise the shot pushes in by `push`
  push?: number;         // fraction of FOV to tighten over the shot (default 0.03)
  shake?: { f: number; amp: number }[];
  actors: Actor[];
  extra?: (frame: number) => React.ReactNode; // extra 3D objects (props in the world, ball flight)
  fx?: Fx[];
};
