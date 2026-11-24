import React, { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { V3 } from "../characters/types";

/** Sets the default camera every frame. Runs in a layout effect, which fires before
 *  @remotion/three's advance() (a plain effect), so the frame is drawn with this camera. */
export const CameraRig: React.FC<{ pos: V3; target: V3; fov: number; roll?: number }> = ({ pos, target, fov, roll = 0 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...pos);
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(...target);
    camera.fov = fov;
    camera.near = 0.05;
    camera.far = 200;
    camera.updateProjectionMatrix();
  });
  return null;
};

export type LightPreset = "classroom" | "hallway" | "cafeteria" | "bedroom" | "golden" | "studio" | "sunny";

/** Warm key from the "window" side, cool fill, soft shadows. One preset per set. */
export const Lights: React.FC<{ preset: LightPreset; keyPos?: V3; target?: V3 }> = ({ preset, keyPos, target = [0, 1, 0] }) => {
  const P: Record<LightPreset, { sky: string; ground: string; hemi: number; key: string; keyI: number; kp: V3; amb: number }> = {
    sunny: { sky: "#BFE0FF", ground: "#9CD08A", hemi: 1.35, key: "#FFF2D6", keyI: 2.8, kp: [-5, 9, 6], amb: 0.3 },
    studio: { sky: "#CFE0FF", ground: "#E8D3B8", hemi: 1.2, key: "#FFE8CC", keyI: 2.6, kp: [3, 6, 5], amb: 0.25 },
    classroom: { sky: "#CFDFFF", ground: "#E9D2B2", hemi: 1.15, key: "#FFE2BC", keyI: 2.6, kp: [-5, 6, 4], amb: 0.3 },
    hallway: { sky: "#D6E4FF", ground: "#D9CFC2", hemi: 1.25, key: "#FFF1DC", keyI: 2.2, kp: [2, 7, 4], amb: 0.3 },
    cafeteria: { sky: "#D8E6FF", ground: "#F0DDC4", hemi: 1.25, key: "#FFE6C4", keyI: 2.4, kp: [-4, 7, 5], amb: 0.3 },
    bedroom: { sky: "#8494DA", ground: "#4A3E78", hemi: 1.5, key: "#A9C3FF", keyI: 1.6, kp: [-3, 5, 4], amb: 0.35 },
    golden: { sky: "#FFD6A0", ground: "#7FA05A", hemi: 1.0, key: "#FFB866", keyI: 3.0, kp: [-8, 4, -2], amb: 0.25 },
  };
  const p = P[preset];
  const kp = keyPos ?? p.kp;
  return (
    <>
      <hemisphereLight args={[p.sky, p.ground, p.hemi]} />
      <ambientLight intensity={p.amb} />
      <directionalLight
        position={[target[0] + kp[0], target[1] + kp[1], target[2] + kp[2]]}
        intensity={p.keyI}
        color={p.key}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
        shadow-radius={4}
      >
        <object3D attach="target" position={target} />
      </directionalLight>
    </>
  );
};
