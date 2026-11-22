import React from "react";
import * as THREE from "three";
import { box, rbox, sphere, cyl, cone, torusArc, circle, halfDisc, ring } from "../lib/geometry";
import { mat } from "../lib/materials";
import { autoBlink, clamp } from "../lib/anim";
import { faceFor } from "./expressions";
import { poseJoints } from "./poses";
import { CharSpec, Expression, Joints, Pose, V3 } from "./types";

/**
 * The one character rig every character uses (Gus, Tre, every extra). A character is just a
 * CharSpec (colours + proportions + accessories) fed into this component, so all characters share
 * the same joints, poses, expressions and lip-sync behaviour.
 *
 * Hierarchy: root -> hips -> (legs) + spine -> torso + neck -> head -> face/hair
 *                                              spine -> shoulders -> elbows -> hands -> props
 */
export type RigProps = {
  spec: CharSpec;
  pose?: Pose;
  joints?: Joints;           // overrides `pose` (use poseAt() for keyed pose changes)
  expression?: Expression;
  mouthOpen?: number;        // 0..1 lip sync
  chew?: boolean;
  blink?: number;            // 0..1, auto-blinks when omitted
  lookAt?: [number, number]; // extra head yaw, pitch
  position?: V3;
  rotation?: V3;
  scale?: number;
  t: number;                 // frame used for idle motion, blinks and cycles
  seed?: string;
  rHand?: React.ReactNode;   // props held in the right / left hand
  lHand?: React.ReactNode;
};

type MP = { g: THREE.BufferGeometry; c: string; p?: V3; r?: V3; s?: V3; shadow?: boolean };
const M: React.FC<MP> = ({ g, c, p, r, s, shadow = true }) => (
  <mesh geometry={g} material={mat(c)} position={p} rotation={r} scale={s} castShadow={shadow} receiveShadow />
);

const Hair: React.FC<{ spec: CharSpec }> = ({ spec }) => {
  const { headW: w, headH: h, headD: d, hair } = spec;
  const top = h / 2;
  switch (spec.hairStyle) {
    case "gusMessy": {
      const lite = "#7D5232";
      return (
        <group>
          <M g={rbox(w + 0.05, 0.17, d + 0.05, 0.05)} c={hair} p={[0, top - 0.02, -0.005]} />
          <M g={rbox(w + 0.05, h * 0.62, 0.13, 0.04)} c={hair} p={[0, top - h * 0.3, -d / 2 + 0.03]} />
          <M g={box(0.07, h * 0.32, d * 0.75)} c={hair} p={[w / 2 + 0.01, top - 0.14, -0.06]} />
          <M g={box(0.07, h * 0.32, d * 0.75)} c={hair} p={[-w / 2 - 0.01, top - 0.14, -0.06]} />
          {/* fringe: three chunky wedges falling over the forehead */}
          <M g={box(0.2, 0.12, 0.08)} c={hair} p={[-0.17, top - 0.09, d / 2 - 0.0]} r={[0.25, 0, -0.35]} />
          <M g={box(0.22, 0.1, 0.08)} c={lite} p={[0.02, top - 0.075, d / 2 + 0.005]} r={[0.2, 0, 0.2]} />
          <M g={box(0.18, 0.11, 0.08)} c={hair} p={[0.2, top - 0.085, d / 2 - 0.01]} r={[0.25, 0, 0.4]} />
          {/* messy tufts on top */}
          <M g={cone(0.07, 0.16, 4)} c={hair} p={[-0.12, top + 0.1, 0.05]} r={[0.3, 0.4, 0.35]} />
          <M g={cone(0.08, 0.18, 4)} c={lite} p={[0.06, top + 0.11, -0.05]} r={[-0.2, 0.2, -0.3]} />
          <M g={cone(0.06, 0.14, 4)} c={hair} p={[0.2, top + 0.07, 0.1]} r={[0.35, 0, -0.6]} />
          <M g={cone(0.06, 0.13, 4)} c={hair} p={[-0.02, top + 0.07, 0.18]} r={[0.7, 0, 0.1]} />
        </group>
      );
    }
    case "treTwists": {
      const fade = "#2E211A";
      const tw: React.ReactNode[] = [];
      let n = 0;
      for (let ix = 0; ix < 4; ix++)
        for (let iz = 0; iz < 3; iz++) {
          const x = (ix - 1.5) * 0.13;
          const z = (iz - 1) * 0.14 + 0.02;
          const lean = ((n * 37) % 7) / 7 - 0.5;
          tw.push(
            <M key={n++} g={cyl(0.04, 0.05, 0.16, 5)} c={hair} p={[x, top + 0.1, z]} r={[lean * 0.4, 0, -x * 0.9]} />,
          );
        }
      return (
        <group>
          <M g={rbox(w * 0.88, 0.08, d * 0.86, 0.03)} c={hair} p={[0, top + 0.01, 0]} />
          {tw}
          {/* fade: short dark shell on the sides and back only */}
          <M g={box(0.03, h * 0.42, d * 0.8)} c={fade} p={[w / 2 + 0.008, top - h * 0.26, -0.03]} />
          <M g={box(0.03, h * 0.42, d * 0.8)} c={fade} p={[-w / 2 - 0.008, top - h * 0.26, -0.03]} />
          <M g={box(w * 0.9, h * 0.5, 0.03)} c={fade} p={[0, top - h * 0.28, -d / 2 - 0.008]} />
        </group>
      );
    }
    case "short":
      return (
        <group>
          <M g={rbox(w + 0.04, 0.12, d + 0.04, 0.04)} c={hair} p={[0, top, 0]} />
          <M g={rbox(w + 0.04, h * 0.5, 0.1, 0.03)} c={hair} p={[0, top - h * 0.24, -d / 2 + 0.02]} />
          <M g={box(0.05, h * 0.25, d * 0.6)} c={hair} p={[w / 2 + 0.01, top - 0.12, -0.08]} />
          <M g={box(0.05, h * 0.25, d * 0.6)} c={hair} p={[-w / 2 - 0.01, top - 0.12, -0.08]} />
          <M g={box(w * 0.8, 0.06, 0.06)} c={hair} p={[0, top - 0.06, d / 2]} r={[0.3, 0, 0]} />
        </group>
      );
    case "buzz":
      return <M g={rbox(w + 0.02, 0.07, d + 0.02, 0.03)} c={hair} p={[0, top - 0.01, 0]} />;
    case "bun":
      return (
        <group>
          <M g={rbox(w + 0.04, 0.12, d + 0.04, 0.04)} c={hair} p={[0, top, 0]} />
          <M g={rbox(w + 0.04, h * 0.55, 0.1, 0.03)} c={hair} p={[0, top - h * 0.26, -d / 2 + 0.02]} />
          <M g={sphere(0.13, 6, 5)} c={hair} p={[0, top + 0.08, -d / 2 + 0.02]} />
        </group>
      );
  }
};

const Face: React.FC<{ spec: CharSpec; expression: Expression; mouthOpen: number; blink: number; t: number; gaze: number }> = ({
  spec, expression, mouthOpen, blink, t, gaze,
}) => {
  const f = faceFor(expression, t);
  const z = spec.headD / 2;
  const ex = spec.headW * 0.19;
  const ey = 0.03;
  const eyeR = 0.055 * f.eyeScale;
  const eyeH = eyeR * 1.45;
  const skinLid = spec.skin;
  const open = clamp(Math.max(mouthOpen, f.mouthMin));
  const eye = (side: 1 | -1, i: 0 | 1) => {
    const lid = clamp(Math.max(f.lid[i], blink));
    const lidH = eyeH * 2 * lid + 0.004;
    return (
      <group position={[side * ex + gaze * 0.025, ey, z]}>
        <M g={sphere(1, 10, 8)} c="#0B0B0E" s={[eyeR, eyeH, 0.02]} shadow={false} />
        {lid > 0.01 && (
          <M g={box(1, 1, 1)} c={skinLid} p={[0, eyeH - lidH / 2 + 0.004, 0.012]} s={[eyeR * 2.5, lidH, 0.02]} shadow={false} />
        )}
      </group>
    );
  };
  const brow = (side: 1 | -1, i: 0 | 1) => (
    <M
      g={box(0.15, 0.045, 0.035)}
      c={spec.brow}
      p={[side * ex, ey + eyeH + 0.065 + f.browY[i], z + 0.01]}
      r={[0, 0, side * f.browRot[i]]}
      shadow={false}
    />
  );
  const my = -spec.headH * 0.24;
  const dark = "#2A0E12";
  let mouth: React.ReactNode;
  if (open > 0.07 && f.mouth !== "grin") {
    const h = 0.025 + open * 0.1;
    mouth = (
      <group position={[0, my, z + 0.005]}>
        <M g={circle(1, 14)} c={dark} s={[0.065, h, 1]} shadow={false} />
        {open > 0.35 && <M g={circle(1, 10)} c="#C4505A" p={[0, -h * 0.55, 0.002]} s={[0.04, h * 0.35, 1]} shadow={false} />}
      </group>
    );
  } else if (f.mouth === "grin") {
    const h = 0.03 + open * 0.09;
    mouth = (
      <group position={[0, my + 0.02, z + 0.005]}>
        <M g={halfDisc(1)} c={dark} s={[0.09, h, 1]} shadow={false} />
        <M g={box(0.15, 0.025, 0.004)} c="#F4F1EA" p={[0, -0.012, 0.003]} shadow={false} />
      </group>
    );
  } else if (f.mouth === "smile") {
    mouth = <M g={torusArc(0.06, 0.014, Math.PI)} c={dark} p={[0, my + 0.04, z]} r={[0, 0, Math.PI]} shadow={false} />;
  } else if (f.mouth === "frown") {
    mouth = <M g={torusArc(0.055, 0.013, Math.PI * 0.8)} c={dark} p={[0, my - 0.04, z]} r={[0, 0, Math.PI * 0.1]} s={[1, 0.6, 1]} shadow={false} />;
  } else if (f.mouth === "smirk") {
    mouth = <M g={box(0.12, 0.024, 0.02)} c={dark} p={[0.03, my + 0.01, z]} r={[0, 0, 0.22]} shadow={false} />;
  } else {
    mouth = <M g={box(0.13, 0.024, 0.02)} c={dark} p={[0, my, z]} shadow={false} />;
  }
  return (
    <group>
      {eye(1, 0)}
      {eye(-1, 1)}
      {brow(1, 0)}
      {brow(-1, 1)}
      {/* nose wedge */}
      <M g={cone(0.045, 0.1, 4)} c={spec.skin} p={[0, -0.04, z + 0.035]} r={[Math.PI / 2 + 0.25, Math.PI / 4, 0]} s={[1, 1, 0.8]} />
      {mouth}
    </group>
  );
};

const Arm: React.FC<{ spec: CharSpec; side: 1 | -1; sh: V3; el: V3; children?: React.ReactNode }> = ({ spec, side, sh, el, children }) => {
  const { upperArm: ua, foreArm: fa, limb, sleeve, skin } = spec;
  return (
    <group position={[side * (spec.torsoW / 2 + limb * 0.55), spec.torsoH - 0.07, 0]} rotation={sh}>
      <M g={rbox(limb * 1.08, ua + 0.04, limb * 1.08, 0.025)} c={sleeve} p={[0, -ua / 2 + 0.02, 0]} />
      <group position={[0, -ua, 0]} rotation={[el[0], el[1], el[2], "YXZ"]}>
        <M g={rbox(limb, fa + 0.02, limb, 0.025)} c={sleeve} p={[0, -fa / 2, 0]} />
        {spec.extras?.letterman && <M g={box(limb * 1.04, 0.035, limb * 1.04)} c={spec.top} p={[0, -fa + 0.02, 0]} />}
        <group position={[0, -fa - 0.06, 0]}>
          <M g={rbox(0.115, 0.13, 0.095, 0.035)} c={skin} />
          <M g={rbox(0.045, 0.07, 0.05, 0.015)} c={skin} p={[-side * 0.055, 0.015, 0.03]} r={[0, 0, -side * 0.4]} />
          {children}
        </group>
      </group>
    </group>
  );
};

const Leg: React.FC<{ spec: CharSpec; side: 1 | -1; hip: V3; knee: number }> = ({ spec, side, hip, knee }) => {
  const { thigh, shin, limb, pants, shoe, sole } = spec;
  const lw = limb * 1.35;
  const shorts = spec.extras?.shorts;
  return (
    <group position={[side * spec.torsoW * 0.24, 0, 0]} rotation={hip}>
      <M g={rbox(lw, thigh + 0.04, lw, 0.03)} c={pants} p={[0, -thigh / 2, 0]} />
      <group position={[0, -thigh, 0]} rotation={[knee, 0, 0]}>
        <M g={rbox(lw * 0.92, shin, lw * 0.92, 0.03)} c={shorts ? spec.skin : pants} p={[0, -shin / 2, 0]} />
        {shorts && <M g={box(lw * 0.95, 0.06, lw * 0.95)} c="#F2F2F2" p={[0, -shin + 0.06, 0]} />}
        <group position={[0, -shin - 0.035, 0.05]}>
          <M g={rbox(lw * 1.05, 0.1, 0.28, 0.035)} c={shoe} />
          <M g={box(lw * 1.08, 0.035, 0.29)} c={sole} p={[0, -0.05, 0]} />
        </group>
      </group>
    </group>
  );
};

export const Rig: React.FC<RigProps> = ({
  spec, pose = "idle", joints, expression, mouthOpen = 0, chew, blink, lookAt = [0, 0], position = [0, 0, 0],
  rotation = [0, 0, 0], scale = 1, t, seed, rHand, lHand,
}) => {
  const j = joints ?? poseJoints(pose, t);
  const legLen = spec.thigh + spec.shin + 0.085;
  const breath = 1 + Math.sin((t / 96) * Math.PI * 2) * 0.015;
  const b = blink ?? autoBlink(t, seed ?? spec.id);
  const mo = chew ? 0.12 + Math.abs(Math.sin(t * 0.42)) * 0.28 : mouthOpen;
  const e = expression ?? spec.defaultExpression;
  const { torsoW: tw, torsoH: th, torsoD: td, headW, headH, headD, top, topDark, skin } = spec;
  const x = spec.extras ?? {};
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group position={[j.root[0], legLen + j.root[1], j.root[2]]} rotation={j.rootRot}>
        <Leg spec={spec} side={1} hip={j.lHip} knee={j.lKnee} />
        <Leg spec={spec} side={-1} hip={j.rHip} knee={j.rKnee} />
        {/* hips block */}
        <M g={rbox(tw * 0.92, 0.14, td * 0.95, 0.03)} c={spec.pants} p={[0, 0.02, 0]} />
        <group rotation={j.spine}>
          {/* torso with breathing */}
          <group scale={[breath, 1 + (breath - 1) * 0.5, breath]}>
            <M g={rbox(tw, th, td, 0.06)} c={top} p={[0, th / 2, 0]} />
            {x.pocket && <M g={box(tw * 0.62, 0.13, 0.02)} c={topDark} p={[0, th * 0.25, td / 2 + 0.005]} />}
            {x.hood && <M g={rbox(tw * 0.72, 0.16, 0.16, 0.05)} c={topDark} p={[0, th - 0.02, -td / 2 - 0.02]} />}
            {x.drawstrings && (
              <>
                <M g={box(0.018, 0.14, 0.015)} c="#EDEDED" p={[0.06, th - 0.11, td / 2 + 0.008]} />
                <M g={box(0.018, 0.12, 0.015)} c="#EDEDED" p={[-0.06, th - 0.1, td / 2 + 0.008]} />
              </>
            )}
            {x.letterman && (
              <>
                <M g={box(tw * 0.62, 0.05, td * 1.02)} c="#F4F4F4" p={[0, th - 0.02, 0]} />
                <M g={box(tw * 1.02, 0.06, td * 1.02)} c="#F4F4F4" p={[0, 0.04, 0]} />
                <M g={box(tw * 1.03, 0.022, td * 1.03)} c={top} p={[0, 0.04, 0]} />
                {[0.12, 0.24, 0.36].map((yy) => (
                  <M key={yy} g={box(0.03, 0.03, 0.01)} c="#F4F4F4" p={[0, th * yy + 0.05, td / 2 + 0.005]} />
                ))}
                {/* generic chenille letter patch (fictional school) */}
                <M g={box(0.13, 0.13, 0.012)} c="#F4F4F4" p={[tw * 0.24, th * 0.62, td / 2 + 0.006]} />
                <M g={box(0.1, 0.025, 0.006)} c={top} p={[tw * 0.24, th * 0.62 + 0.035, td / 2 + 0.014]} />
                <M g={box(0.028, 0.08, 0.006)} c={top} p={[tw * 0.24, th * 0.62 - 0.01, td / 2 + 0.014]} />
              </>
            )}
            {x.apron && <M g={box(tw * 0.7, th * 0.85, 0.02)} c="#F3F3EE" p={[0, th * 0.42, td / 2 + 0.006]} />}
            {x.whistle && (
              <>
                <M g={box(0.012, 0.18, 0.01)} c="#222" p={[0, th - 0.1, td / 2 + 0.008]} />
                <M g={cyl(0.025, 0.025, 0.06, 6)} c="#C9CED6" p={[0, th - 0.2, td / 2 + 0.03]} r={[Math.PI / 2, 0, 0]} />
              </>
            )}
            {x.jerseyNumber && <M g={box(tw * 0.5, th * 0.35, 0.01)} c={topDark} p={[0, th * 0.55, td / 2 + 0.006]} />}
            {x.backpack && (
              <>
                <M g={rbox(tw * 0.85, th * 1.0, 0.26, 0.05)} c={x.backpack} p={[0, th * 0.5, -td / 2 - 0.13]} />
                <M g={box(tw * 0.6, th * 0.35, 0.06)} c="#2C2C34" p={[0, th * 0.3, -td / 2 - 0.27]} />
                <M g={box(0.05, th * 0.7, 0.02)} c="#2C2C34" p={[tw * 0.3, th * 0.6, td / 2 + 0.008]} />
                <M g={box(0.05, th * 0.7, 0.02)} c="#2C2C34" p={[-tw * 0.3, th * 0.6, td / 2 + 0.008]} />
              </>
            )}
          </group>
          <Arm spec={spec} side={1} sh={j.lSh} el={j.lEl}>{lHand}</Arm>
          <Arm spec={spec} side={-1} sh={j.rSh} el={j.rEl}>{rHand}</Arm>
          {/* neck + head */}
          <group position={[0, th, 0]} rotation={[j.neck[0] + lookAt[1], j.neck[1] + lookAt[0], j.neck[2]]}>
            <M g={cyl(0.075, 0.085, 0.12, 6)} c={skin} p={[0, 0.03, 0]} />
            <group position={[0, 0.06 + headH / 2, 0.01]}>
              <M g={rbox(headW, headH, headD, 0.1, 2)} c={skin} />
              {/* ears */}
              <M g={rbox(0.06, 0.13, 0.09, 0.02)} c={skin} p={[headW / 2 + 0.015, -0.01, 0]} />
              <M g={rbox(0.06, 0.13, 0.09, 0.02)} c={skin} p={[-headW / 2 - 0.015, -0.01, 0]} />
              <Hair spec={spec} />
              {x.headband && (
                <group position={[0, headH / 2 - 0.035, 0]}>
                  <M g={box(headW + 0.03, 0.075, 0.03)} c={x.headband} p={[0, 0, headD / 2 - 0.005]} />
                  <M g={box(0.03, 0.07, headD + 0.02)} c={x.headband} p={[headW / 2 + 0.005, 0, 0]} />
                  <M g={box(0.03, 0.07, headD + 0.02)} c={x.headband} p={[-headW / 2 - 0.005, 0, 0]} />
                  <M g={box(headW + 0.03, 0.07, 0.03)} c={x.headband} p={[0, 0, -headD / 2 + 0.005]} />
                </group>
              )}
              {x.hairnet && <M g={sphere(headW * 0.5, 8, 5)} c="#B9D3E6" p={[0, headH * 0.42, -0.06]} s={[1.05, 0.45, 1]} />}
              {x.cap && (
                <group position={[0, headH / 2 + 0.02, 0]}>
                  <M g={rbox(headW + 0.06, 0.16, headD + 0.06, 0.06)} c={x.cap} p={[0, 0.02, 0]} />
                  <M g={box(headW * 0.75, 0.03, 0.22)} c={x.cap} p={[0, -0.05, headD / 2 + 0.09]} r={[-0.12, 0, 0]} />
                </group>
              )}
              {x.glasses && (
                <group position={[0, 0.03, headD / 2 + 0.03]}>
                  <M g={ring(0.085, 0.012)} c="#222" p={[headW * 0.19, 0, 0]} shadow={false} />
                  <M g={ring(0.085, 0.012)} c="#222" p={[-headW * 0.19, 0, 0]} shadow={false} />
                  <M g={box(0.07, 0.015, 0.015)} c="#222" shadow={false} />
                </group>
              )}
              <Face spec={spec} expression={e} mouthOpen={mo} blink={b} t={t} gaze={lookAt[0] * 0.5} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};
