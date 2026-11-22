import { CharSpec } from "./types";

/*
 * LOCKED character designs. Do not change these between episodes — the series' identity lives here.
 * Proportions are in world units (~metres). Head ≈ 1/3 of body height on both leads.
 */
export const GUS: CharSpec = {
  id: "gus",
  skin: "#F1C7A1", hair: "#6B4426", hairStyle: "gusMessy", brow: "#4A2E1A",
  headW: 0.68, headH: 0.62, headD: 0.6,
  torsoW: 0.6, torsoH: 0.5, torsoD: 0.34,
  thigh: 0.25, shin: 0.23, upperArm: 0.25, foreArm: 0.22, limb: 0.13,
  top: "#7A1F2B", sleeve: "#7A1F2B", topDark: "#5E1520",
  pants: "#8A8F96", shoe: "#F2F2F2", sole: "#9AA0A8",
  extras: { hood: true, pocket: true, drawstrings: true },
  defaultExpression: "neutral",
};

export const TRE: CharSpec = {
  id: "tre",
  skin: "#9A6440", hair: "#141010", hairStyle: "treTwists", brow: "#1B1210",
  headW: 0.62, headH: 0.6, headD: 0.56,
  torsoW: 0.5, torsoH: 0.58, torsoD: 0.29,
  thigh: 0.34, shin: 0.32, upperArm: 0.3, foreArm: 0.27, limb: 0.11,
  top: "#1E8C8C", sleeve: "#F4F4F4", topDark: "#16706F",
  pants: "#1C1C22", shoe: "#FFFFFF", sole: "#E6E6E6",
  extras: { letterman: true, headband: "#FFFFFF" },
  defaultExpression: "hyped",
};
