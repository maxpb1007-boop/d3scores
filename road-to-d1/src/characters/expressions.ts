import { Expression } from "./types";

export type MouthShape = "flat" | "smile" | "frown" | "smirk" | "o" | "grin";

/** Face settings. Brow rotation is "angry-positive": + = inner ends down (mirrored per side). */
export type Face = {
  lid: [number, number];   // top-lid closure per eye (0 open .. 1 shut). Gus's deadpan = ~0.45
  eyeScale: number;
  browY: [number, number]; // vertical offset of each brow
  browRot: [number, number];
  mouth: MouthShape;
  mouthMin: number;        // minimum open amount (shock keeps the mouth open)
};

export const faceFor = (e: Expression, t: number): Face => {
  switch (e) {
    case "neutral":
      return { lid: [0.46, 0.46], eyeScale: 1, browY: [-0.005, -0.005], browRot: [0.04, 0.04], mouth: "flat", mouthMin: 0 };
    case "annoyed":
      return { lid: [0.52, 0.52], eyeScale: 1, browY: [-0.02, -0.02], browRot: [0.32, 0.32], mouth: "frown", mouthMin: 0 };
    case "shocked":
      return { lid: [0, 0], eyeScale: 1.3, browY: [0.065, 0.065], browRot: [-0.18, -0.18], mouth: "o", mouthMin: 0.55 };
    case "smug":
      return { lid: [0.38, 0.38], eyeScale: 1, browY: [0.04, -0.01], browRot: [-0.2, 0.22], mouth: "smirk", mouthMin: 0 };
    case "sad":
      return { lid: [0.3, 0.3], eyeScale: 0.95, browY: [0.015, 0.015], browRot: [-0.38, -0.38], mouth: "frown", mouthMin: 0 };
    case "hyped":
      return { lid: [0, 0], eyeScale: 1.12, browY: [0.05, 0.05], browRot: [-0.12, -0.12], mouth: "grin", mouthMin: 0.3 };
    case "eyeTwitch": {
      // a fast irregular spasm on the left lid and brow; deterministic from t
      const tw = Math.max(0, Math.sin(t * 2.3) * Math.sin(t * 0.71 + 1)) ;
      return { lid: [0.12 + tw * 0.55, 0], eyeScale: 1.2, browY: [-0.01 - tw * 0.02, 0.07], browRot: [0.35 + tw * 0.15, -0.2], mouth: "flat", mouthMin: 0 };
    }
  }
};
