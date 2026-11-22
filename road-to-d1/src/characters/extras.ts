import { CharSpec } from "./types";
import { GUS } from "./cast";

/* Background extras: the same rig with different colours, hair and accessories. */
const kidBase: CharSpec = { ...GUS, extras: {}, defaultExpression: "neutral" };

export const FRESHMAN: CharSpec = {
  ...kidBase, id: "freshman",
  skin: "#E8B98F", hair: "#C58B3E", hairStyle: "short", brow: "#8A5E2A",
  headW: 0.64, headH: 0.6, headD: 0.56, torsoW: 0.46, torsoH: 0.42, torsoD: 0.28,
  thigh: 0.22, shin: 0.21, upperArm: 0.22, foreArm: 0.2, limb: 0.1,
  top: "#3E8E4A", sleeve: "#3E8E4A", topDark: "#2F6E39", pants: "#3B4B6B",
  shoe: "#E25A3A", sole: "#F2F2F2",
  extras: { backpack: "#E0A23A", glasses: true },
};

export const LUNCH_LADY: CharSpec = {
  ...kidBase, id: "lunchLady",
  skin: "#C98B62", hair: "#3B2A22", hairStyle: "bun", brow: "#3B2A22",
  torsoW: 0.62, torsoH: 0.52, top: "#D96C8A", sleeve: "#D96C8A", topDark: "#B4566F",
  pants: "#4B4E5A", shoe: "#FFFFFF", sole: "#BBBBBB",
  extras: { apron: true, hairnet: true },
};

export const COACH: CharSpec = {
  ...kidBase, id: "coach",
  skin: "#D9A47A", hair: "#5A5A5A", hairStyle: "buzz", brow: "#4A4A4A",
  headW: 0.66, torsoW: 0.66, torsoH: 0.56, torsoD: 0.38, thigh: 0.3, shin: 0.28,
  top: "#22305A", sleeve: "#22305A", topDark: "#1A2546", pants: "#C9B48A",
  shoe: "#2A2A2A", sole: "#555",
  extras: { cap: "#22305A", whistle: true, shorts: true },
};

export const PUNTER: CharSpec = {
  ...kidBase, id: "punter",
  skin: "#B97E55", hair: "#2A1C14", hairStyle: "short", brow: "#2A1C14",
  torsoW: 0.5, torsoH: 0.52, torsoD: 0.3, thigh: 0.3, shin: 0.29, upperArm: 0.27, foreArm: 0.24, limb: 0.11,
  top: "#F2F2F2", sleeve: "#F2F2F2", topDark: "#1E8C8C", pants: "#E9E9E9",
  shoe: "#1C1C22", sole: "#F2F2F2",
  extras: { jerseyNumber: "7", shorts: false },
};

export const KID: CharSpec = {
  ...kidBase, id: "kid",
  skin: "#7A4E33", hair: "#1A1412", hairStyle: "short", brow: "#1A1412",
  torsoW: 0.52, torsoH: 0.48, top: "#E2B33C", sleeve: "#E2B33C", topDark: "#B98F2B", pants: "#3D5A80",
  shoe: "#F2F2F2", sole: "#999",
  extras: {},
};

export const KID2: CharSpec = {
  ...KID, id: "kid2", skin: "#F0C8A8", hair: "#B5462F", hairStyle: "bun", brow: "#8A3322",
  top: "#6A4FB3", sleeve: "#6A4FB3", topDark: "#533D8E", pants: "#2E2E36",
};

export const EXTRAS = { FRESHMAN, LUNCH_LADY, COACH, PUNTER, KID, KID2 };
