import { Joints, Pose, V3 } from "./types";
import { lerp, smooth } from "../lib/anim";

/*
 * Pose library. All motion is a pure function of `t` (frames), so it renders identically every time.
 * Sign conventions (character faces +z, its left is +x):
 *   shoulder x < 0  -> arm swings forward      shoulder z > 0 (left) / < 0 (right) -> arm out to the side
 *   elbow x < 0     -> forearm bends forward   hip x < 0 -> leg forward     knee > 0 -> shin bends back
 *   spine x > 0     -> lean forward            neck x > 0 -> look down      neck y > 0 -> look to own left
 */
const Z: V3 = [0, 0, 0];
const base = (): Joints => ({
  root: [0, 0, 0], rootRot: [0, 0, 0], spine: [0, 0, 0], neck: [0, 0, 0],
  lSh: [0.05, 0, 0.1], lEl: [-0.15, 0, 0], rSh: [0.05, 0, -0.1], rEl: [-0.15, 0, 0],
  lHip: [0, 0, 0.03], lKnee: 0, rHip: [0, 0, -0.03], rKnee: 0,
});

const S = Math.sin;

export const poseJoints = (pose: Pose, t: number): Joints => {
  const j = base();
  const sway = S(t / 37) * 0.02;
  j.spine = [0, 0, sway];
  j.neck = [S(t / 53) * 0.03, S(t / 71) * 0.04, 0];
  switch (pose) {
    case "idle":
    case "chew":
      break;
    case "talk": {
      j.rSh = [-0.35 + S(t / 9) * 0.12, 0, -0.22];
      j.rEl = [-0.95 + S(t / 6.5) * 0.18, 0.3, 0];
      j.lSh = [-0.1 + S(t / 11) * 0.06, 0, 0.14];
      j.lEl = [-0.4, 0, 0];
      j.neck = [S(t / 8) * 0.05, S(t / 23) * 0.06, S(t / 17) * 0.03];
      break;
    }
    case "phoneHold":
      j.rSh = [-0.55, 0, -0.05];
      j.rEl = [-1.55, 0, 0];
      j.lSh = [-0.25, 0, 0.18];
      j.lEl = [-1.3, -0.4, 0];
      j.neck = [0.32 + S(t / 29) * 0.02, 0, 0];
      j.spine = [0.06, 0, sway];
      break;
    case "phoneShow":
      // arm thrust forward holding the phone out at chest height, screen to the viewer
      j.rSh = [-1.35 + S(t / 5) * 0.04, 0.25, -0.1];
      j.rEl = [-0.35, 0, 0];
      j.lSh = [-0.2, 0, 0.25];
      j.lEl = [-0.6, 0, 0];
      j.spine = [0.12, 0, 0];
      j.neck = [-0.05, 0, 0];
      break;
    case "run": {
      const c = S(t * 0.55);
      j.root = [0, Math.abs(S(t * 0.55)) * 0.07, 0];
      j.spine = [0.22, 0, 0];
      j.lHip = [-c * 0.75, 0, 0.03];
      j.rHip = [c * 0.75, 0, -0.03];
      j.lKnee = 0.35 + Math.max(0, c) * 0.9;
      j.rKnee = 0.35 + Math.max(0, -c) * 0.9;
      j.lSh = [c * 0.8, 0, 0.12];
      j.rSh = [-c * 0.8, 0, -0.12];
      j.lEl = [-1.3, 0, 0];
      j.rEl = [-1.3, 0, 0];
      j.neck = [-0.15, 0, 0];
      break;
    }
    case "celebrate": {
      const p = S(t * 0.6);
      j.root = [0, Math.max(0, p) * 0.12, 0];
      j.lSh = [-0.2, 0, 2.55 + p * 0.25];
      j.rSh = [-0.2, 0, -2.55 - p * 0.25];
      j.lEl = [-0.35, 0, 0];
      j.rEl = [-0.35, 0, 0];
      j.neck = [-0.25, 0, 0];
      j.spine = [-0.08, 0, 0];
      j.lKnee = Math.max(0, -p) * 0.3;
      j.rKnee = Math.max(0, -p) * 0.3;
      break;
    }
    case "facepalm":
      j.rSh = [-1.85, -0.25, 0.42];
      j.rEl = [-1.9, 0, 0];
      j.lSh = [0.05, 0, 0.1];
      j.neck = [0.38 + S(t / 13) * 0.04, S(t / 9) * 0.08, 0];
      j.spine = [0.12, 0, 0];
      break;
    case "armsCrossed":
      // elbows use YXZ order: x bends the forearm forward, then y swings it across the chest
      j.lSh = [-0.3, 0, 0.18];
      j.lEl = [-1.62, -1.05, 0];
      j.rSh = [-0.42, 0, -0.18];
      j.rEl = [-1.58, 1.05, 0];
      j.spine = [-0.04, 0, sway];
      break;
    case "lookOver":
      j.neck = [0.05, 0.75, 0];
      j.spine = [0, 0.18, 0];
      break;
    case "juke": {
      const c = S(t * 0.5);
      j.root = [c * 0.22, 0, 0];
      j.rootRot = [0, c * 0.35, 0];
      j.spine = [0.25, 0, -c * 0.35];
      j.lHip = [-0.3, 0, 0.25 + Math.max(0, c) * 0.4];
      j.rHip = [-0.3, 0, -0.25 - Math.max(0, -c) * 0.4];
      j.lKnee = 0.7;
      j.rKnee = 0.7;
      j.root[1] = -0.08;
      j.lSh = [-0.4, 0, 0.6 + c * 0.3];
      j.rSh = [-0.4, 0, -0.6 + c * 0.3];
      j.lEl = [-0.8, 0, 0];
      j.rEl = [-0.8, 0, 0];
      j.neck = [-0.25, 0, c * 0.2];
      break;
    }
    case "snap":
      // long-snap stance: bent at the waist, both hands down on the ball between the feet
      j.root = [0, -0.2, 0];
      j.spine = [1.2, 0, 0];
      j.neck = [-0.95, 0, 0];
      j.lHip = [-0.75, 0, 0.28];
      j.rHip = [-0.75, 0, -0.28];
      j.lKnee = 1.05;
      j.rKnee = 1.05;
      j.lSh = [-0.95, 0, 0.12];
      j.rSh = [-0.95, 0, -0.12];
      j.lEl = [-0.15, 0, 0];
      j.rEl = [-0.15, 0, 0];
      break;
    case "sit":
      j.lHip = [-1.5, 0, 0.06];
      j.rHip = [-1.5, 0, -0.06];
      j.lKnee = 1.5;
      j.rKnee = 1.5;
      j.lSh = [-0.45, 0, 0.12];
      j.rSh = [-0.45, 0, -0.12];
      j.lEl = [-0.9, 0, 0];
      j.rEl = [-0.9, 0, 0];
      break;
    case "flex":
      j.lSh = [0, 0, 1.45];
      j.lEl = [-0.25, 0, 1.7];
      j.rSh = [0.1, 0, -0.55];
      j.rEl = [-1.9, 0, 0];
      j.spine = [-0.06, 0.25, 0.08];
      j.neck = [-0.12, -0.25, 0.1];
      j.rootRot = [0, -0.25, 0];
      j.lHip = [0, 0, 0.18];
      j.rHip = [0, 0, -0.12];
      break;
    case "stumble": {
      const c = S(t * 0.7);
      j.rootRot = [0, t * 0.25, 0];
      j.spine = [0.3, 0, 0.3 * c];
      j.lSh = [-0.4, 0, 1.6 + c * 0.4];
      j.rSh = [-0.4, 0, -1.6 + c * 0.4];
      j.lEl = [-0.5, 0, 0];
      j.rEl = [-0.5, 0, 0];
      j.lHip = [-0.4 * c, 0, 0.15];
      j.rHip = [0.4 * c, 0, -0.15];
      j.lKnee = 0.4;
      j.rKnee = 0.4;
      j.neck = [-0.3, 0, 0];
      break;
    }
  }
  return j;
};

const l3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const blendJoints = (a: Joints, b: Joints, k: number): Joints => ({
  root: l3(a.root, b.root, k), rootRot: l3(a.rootRot, b.rootRot, k), spine: l3(a.spine, b.spine, k),
  neck: l3(a.neck, b.neck, k), lSh: l3(a.lSh, b.lSh, k), lEl: l3(a.lEl, b.lEl, k), rSh: l3(a.rSh, b.rSh, k),
  rEl: l3(a.rEl, b.rEl, k), lHip: l3(a.lHip, b.lHip, k), lKnee: lerp(a.lKnee, b.lKnee, k),
  rHip: l3(a.rHip, b.rHip, k), rKnee: lerp(a.rKnee, b.rKnee, k),
});

export type PoseKey = { f: number; pose: Pose; blend?: number };

/** Pose at a local frame from a key list; each change blends over `blend` frames (default 6). */
export const poseAt = (keys: PoseKey[], f: number): Joints => {
  let i = 0;
  for (let n = 0; n < keys.length; n++) if (keys[n].f <= f) i = n;
  const cur = keys[i];
  const now = poseJoints(cur.pose, f);
  if (i === 0) return now;
  const k = smooth((f - cur.f) / (cur.blend ?? 6));
  return k >= 1 ? now : blendJoints(poseJoints(keys[i - 1].pose, f), now, k);
};

export { Z };
