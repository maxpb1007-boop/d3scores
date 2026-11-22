import { V3 } from "../characters/types";

export type Cam = { pos: V3; target: V3; fov: number };
export const ASPECT = 1080 / 1920;

/**
 * Frame a subject the way the show frames everyone: given the subject's head centre and how much
 * width should be visible, return a camera that puts the head at `headAt` (fraction from the top
 * of the screen). Default 0.385 keeps the eyes well above the caption band (55-62 %).
 *   yaw  : angle around the subject (0 = straight on from +z, + = from the subject's left)
 *   elev : camera height relative to the head (m)
 */
export const frame = (
  head: V3,
  w: number,
  { yaw = 0, elev = 0, fov = 35, headAt = 0.385 }: { yaw?: number; elev?: number; fov?: number; headAt?: number } = {},
): Cam => {
  const h = w / ASPECT;
  const d = h / 2 / Math.tan(((fov / 2) * Math.PI) / 180);
  const ty = head[1] - (0.5 - headAt) * h;
  const target: V3 = [head[0], ty, head[2]];
  const pos: V3 = [head[0] + Math.sin(yaw) * d, head[1] + elev, head[2] + Math.cos(yaw) * d];
  return { pos, target, fov };
};

// Head-centre heights (standing, origin at feet). Derived from the CharSpec proportions.
export const HEAD = { gus: 1.445, tre: 1.695, freshman: 1.3, punter: 1.62, coach: 1.62, lunchLady: 1.45 };
// Bleacher sitting: root offsets put the hips on BLEACHER_SEAT_Y.
export const SIT_Y = { gus: 1.31 - 0.505, tre: 1.31 - 0.685 };
