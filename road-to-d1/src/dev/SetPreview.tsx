import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Rig } from "../characters/Rig";
import { GUS, TRE } from "../characters/cast";
import { CameraRig, Lights, LightPreset } from "../lib/Stage";
import { SETS } from "../sets/Sets";
import { V3 } from "../characters/types";

type K = keyof typeof SETS;
const CFG: Record<K, { light: LightPreset; cam: V3; target: V3; fov: number }> = {
  Hallway: { light: "hallway", cam: [0.6, 1.7, 5.2], target: [0, 1.3, 0], fov: 50 },
  Classroom: { light: "classroom", cam: [0.4, 1.8, 6.5], target: [0, 1.3, 0], fov: 50 },
  Cafeteria: { light: "cafeteria", cam: [0.5, 1.8, 5.5], target: [0, 1.2, 0], fov: 50 },
  Bedroom: { light: "bedroom", cam: [0.5, 1.6, 4.5], target: [0, 1.1, -0.5], fov: 50 },
  Bathroom: { light: "hallway", cam: [0.3, 1.6, 3.2], target: [0, 1.4, -0.5], fov: 50 },
  Field: { light: "golden", cam: [1.5, 1.6, 6], target: [0, 1.2, 0], fov: 50 },
  Town: { light: "sunny", cam: [1.5, 2.2, 7], target: [0, 1.2, 0], fov: 50 },
};

export const SetPreview: React.FC<{ set: K; bleachers?: boolean }> = ({ set, bleachers }) => {
  const { width, height } = useVideoConfig();
  const f = useCurrentFrame();
  const c = CFG[set];
  const S = SETS[set] as React.FC<{ mode?: "field" | "bleachers" }>;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={width} height={height} shadows>
        <CameraRig pos={bleachers ? [0.8, 2.4, 5] : c.cam} target={bleachers ? [0, 1.9, 0] : c.target} fov={c.fov} />
        <Lights preset={c.light} target={[0, 1, 0]} />
        <S mode={bleachers ? "bleachers" : "field"} />
        {bleachers ? (
          <>
            <Rig spec={GUS} pose="sit" t={f} position={[-0.5, 1.31 - 0.505, -0.05]} />
            <Rig spec={TRE} pose="sit" t={f} position={[0.55, 1.31 - 0.685, -0.05]} />
          </>
        ) : (
          <>
            <Rig spec={GUS} t={f} position={[-0.5, 0, 0]} rotation={[0, 0.3, 0]} />
            <Rig spec={TRE} t={f} position={[0.55, 0, 0]} rotation={[0, -0.3, 0]} />
          </>
        )}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
