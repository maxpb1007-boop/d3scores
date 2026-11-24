export type Expression = "neutral" | "annoyed" | "shocked" | "smug" | "sad" | "hyped" | "eyeTwitch";
export const EXPRESSIONS: Expression[] = ["neutral", "annoyed", "shocked", "smug", "sad", "hyped", "eyeTwitch"];

export type Pose =
  | "idle" | "talk" | "phoneHold" | "phoneShow" | "run" | "celebrate" | "facepalm" | "armsCrossed"
  | "lookOver" | "juke" | "snap" | "sit" | "chew" | "flex" | "stumble" | "walk";
export const POSES: Pose[] = [
  "idle", "talk", "phoneHold", "phoneShow", "run", "celebrate", "facepalm", "armsCrossed",
  "lookOver", "juke", "snap", "sit", "chew", "flex", "stumble", "walk",
];

export type V3 = [number, number, number];

/** Every joint rotation (radians) plus a root offset. Left = the character's own left (+x). */
export type Joints = {
  root: V3; rootRot: V3; spine: V3; neck: V3;
  lSh: V3; lEl: V3; rSh: V3; rEl: V3;
  lHip: V3; lKnee: number; rHip: V3; rKnee: number;
};

export type HairStyle = "gusMessy" | "treTwists" | "short" | "bun" | "buzz";

export type CharSpec = {
  id: string;
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  brow: string;
  // proportions (world units ~ metres)
  headW: number; headH: number; headD: number;
  torsoW: number; torsoH: number; torsoD: number;
  thigh: number; shin: number; upperArm: number; foreArm: number; limb: number;
  top: string; sleeve: string; topDark: string;
  pants: string; shoe: string; sole: string;
  extras?: {
    hood?: boolean; pocket?: boolean; drawstrings?: boolean;
    letterman?: boolean; headband?: string;
    cap?: string; whistle?: boolean; backpack?: string; apron?: boolean; hairnet?: boolean;
    glasses?: boolean; shorts?: boolean; jerseyNumber?: string;
  };
  defaultExpression: import("./types").Expression;
};
