import { random } from "remotion";

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

/**
 * Deterministic auto-blink. Returns 0..1 (1 = eyes closed) for a global frame.
 * Blinks every 0.6-2.4 s (18-72 frames at 30 fps), each lasting 5 frames.
 * Uses Remotion's seeded random(), never Math.random(), so renders are repeatable.
 */
export const autoBlink = (frame: number, seed: string) => {
  let t = Math.floor(random(`${seed}-o`) * 30);
  for (let i = 0; i < 400 && t <= frame + 5; i++) {
    if (frame >= t && frame < t + 5) {
      const k = frame - t; // 0..4
      return [0.5, 1, 1, 0.6, 0.2][k];
    }
    t += 18 + Math.floor(random(`${seed}-${i}`) * 54);
  }
  return 0;
};

// Camera shake that flips sign every frame and decays — reads as an impact, not a wobble.
export const kick = (frame: number, at: number, amp = 1, len = 8) => {
  const k = frame - at;
  if (k < 0 || k >= len) return 0;
  return amp * (k % 2 === 0 ? 1 : -1) * (1 - k / len);
};
