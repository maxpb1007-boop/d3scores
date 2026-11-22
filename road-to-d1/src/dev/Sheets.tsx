import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Rig } from "../characters/Rig";
import { GUS, TRE } from "../characters/cast";
import { EXTRAS } from "../characters/extras";
import { CameraRig, Lights } from "../lib/Stage";
import { EXPRESSIONS, POSES, Pose } from "../characters/types";
import { box } from "../lib/geometry";
import { mat } from "../lib/materials";

const Floor = () => (
  <mesh geometry={box(40, 0.1, 40)} material={mat("#D9D2C6")} position={[0, -0.05, 0]} receiveShadow />
);
const Label: React.FC<{ text: string; x: string; y: string }> = ({ text, x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translateX(-50%)", font: "700 28px sans-serif", color: "#222" }}>{text}</div>
);

/** Gus and Tre side by side: front, 3/4 and profile, plus the extras. */
export const Turnaround: React.FC = () => {
  const { width, height } = useVideoConfig();
  const f = useCurrentFrame();
  const rots = [0, -0.7, -Math.PI / 2];
  return (
    <AbsoluteFill style={{ background: "#EFE9DF" }}>
      <ThreeCanvas width={width} height={height} shadows>
        <CameraRig pos={[0, 1.6, 15]} target={[0, 1.6, 0]} fov={24} />
        <Lights preset="studio" target={[0, 1, 0]} />
        <Floor />
        {rots.map((r, i) => (
          <group key={i} position={[-2.6 + i * 2.6, 2.05, 0]}>
            <Rig spec={GUS} t={f} rotation={[0, r, 0]} position={[-0.55, 0, 0]} blink={0} />
            <Rig spec={TRE} t={f} rotation={[0, r, 0]} position={[0.55, 0, 0]} blink={0} />
          </group>
        ))}
        {Object.values(EXTRAS).map((s, i) => (
          <Rig key={s.id} spec={s} t={f} position={[-3.4 + i * 1.36, -0.25, 0]} scale={0.8} blink={0} />
        ))}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// world-to-screen helper for sheet labels (camera looks straight down -z at targetY)
const pct = (y: number, cy: number, viewH: number) => `${50 - ((y - cy) / viewH) * 100}%`;
const xpct = (x: number, viewW: number) => `${50 + (x / viewW) * 100}%`;

/** All 7 expressions for both leads, as close-up heads. */
export const ExpressionSheet: React.FC = () => {
  const { width, height } = useVideoConfig();
  const f = useCurrentFrame();
  const d = 16, fov = 30, viewH = 2 * d * Math.tan((fov / 2) * Math.PI / 180), cy = 0;
  const rowY = (i: number) => 3.6 - i * 1.22;
  return (
    <AbsoluteFill style={{ background: "#EFE9DF" }}>
      <ThreeCanvas width={width} height={height}>
        <CameraRig pos={[0, cy, d]} target={[0, cy, 0]} fov={fov} />
        <Lights preset="studio" target={[0, 0, 0]} />
        {EXPRESSIONS.map((e, i) => (
          <group key={e}>
            <Rig spec={GUS} t={f} expression={e} position={[-1.0, rowY(i) - 1.3, -i * 0.01]} blink={0} />
            <Rig spec={TRE} t={f} expression={e} position={[1.0, rowY(i) - 1.62, -i * 0.01]} blink={0} />
          </group>
        ))}
      </ThreeCanvas>
      {EXPRESSIONS.map((e, i) => (
        <Label key={e} text={e} x="50%" y={pct(rowY(i) + 0.2, cy, viewH)} />
      ))}
    </AbsoluteFill>
  );
};

/** Every pose (alternating Gus / Tre), 3 columns. */
export const PoseSheet: React.FC = () => {
  const { width, height } = useVideoConfig();
  const f = useCurrentFrame();
  const d = 25, fov = 30, viewH = 2 * d * Math.tan((fov / 2) * Math.PI / 180), cy = 0.6;
  const viewW = viewH * (width / height);
  return (
    <AbsoluteFill style={{ background: "#EFE9DF" }}>
      <ThreeCanvas width={width} height={height} shadows>
        <CameraRig pos={[0, cy, d]} target={[0, cy, 0]} fov={fov} />
        <Lights preset="studio" target={[0, 0, 0]} />
        {POSES.map((p: Pose, i) => {
          const x = (i % 3) * 2.4 - 2.4;
          const y = 5.0 - Math.floor(i / 3) * 2.75;
          return (
            <group key={p} position={[x, y - 2.1, 0]}>
              <Rig spec={i % 2 ? TRE : GUS} pose={p} t={f} rotation={[0, 0.5, 0]} blink={0} />
            </group>
          );
        })}
      </ThreeCanvas>
      {POSES.map((p, i) => (
        <Label key={p} text={p} x={xpct((i % 3) * 2.4 - 2.4, viewW)} y={pct(5.0 - Math.floor(i / 3) * 2.75 + 0.15, cy, viewH)} />
      ))}
    </AbsoluteFill>
  );
};
