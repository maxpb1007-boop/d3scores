import React from "react";
import { box, rbox, sphere, cyl } from "../lib/geometry";
import { mat } from "../lib/materials";
import { V3 } from "../characters/types";

type P = { position?: V3; rotation?: V3; scale?: number };

/** Low-poly football: stretched 8-sided sphere + white laces. */
export const Football: React.FC<P> = ({ position, rotation, scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh geometry={sphere(1, 8, 6)} material={mat("#7A3B1E")} scale={[0.085, 0.085, 0.145]} castShadow />
    <mesh geometry={box(0.012, 0.01, 0.09)} material={mat("#F4F4F4")} position={[0, 0.083, 0]} />
    {[-0.03, -0.01, 0.01, 0.03].map((z) => (
      <mesh key={z} geometry={box(0.035, 0.01, 0.008)} material={mat("#F4F4F4")} position={[0, 0.084, z]} />
    ))}
  </group>
);

export const Sandwich: React.FC<P> = ({ position, rotation, scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh geometry={rbox(0.16, 0.035, 0.13, 0.012)} material={mat("#E7C27A")} position={[0, 0.045, 0]} />
    <mesh geometry={box(0.17, 0.018, 0.14)} material={mat("#6DBE45")} position={[0, 0.022, 0]} />
    <mesh geometry={box(0.155, 0.02, 0.125)} material={mat("#D9534F")} position={[0, 0.005, 0]} />
    <mesh geometry={rbox(0.16, 0.035, 0.13, 0.012)} material={mat("#E7C27A")} position={[0, -0.02, 0]} />
  </group>
);

export const Books: React.FC<P & { colors?: string[] }> = ({ position, rotation, scale = 1, colors = ["#C0392B", "#2E86C1", "#F1C40F"] }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {colors.map((c, i) => (
      <group key={c} position={[i * 0.01, i * 0.05, 0]} rotation={[0, i * 0.15, 0]}>
        <mesh geometry={box(0.22, 0.045, 0.3)} material={mat(c)} castShadow />
        <mesh geometry={box(0.2, 0.035, 0.29)} material={mat("#F7F3E8")} position={[0.012, 0, 0]} />
      </group>
    ))}
  </group>
);

export const Paper: React.FC<P & { color?: string }> = ({ position, rotation, scale = 1, color = "#F7F5EE" }) => (
  <mesh geometry={box(0.21, 0.004, 0.28)} material={mat(color)} position={position} rotation={rotation} scale={scale} castShadow />
);

export const Tray: React.FC<P & { food?: boolean }> = ({ position, rotation, scale = 1, food = true }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh geometry={rbox(0.46, 0.03, 0.34, 0.01)} material={mat("#F08A24")} receiveShadow castShadow />
    {food && (
      <>
        <mesh geometry={cyl(0.07, 0.07, 0.03, 8)} material={mat("#F2D16B")} position={[-0.12, 0.03, 0.03]} />
        <mesh geometry={rbox(0.12, 0.05, 0.1, 0.02)} material={mat("#8E5A3C")} position={[0.1, 0.04, -0.05]} />
        <mesh geometry={cyl(0.035, 0.03, 0.12, 6)} material={mat("#F4F4F4")} position={[0.15, 0.08, 0.09]} />
        <mesh geometry={sphere(0.045, 6, 5)} material={mat("#D9534F")} position={[-0.08, 0.05, -0.09]} />
      </>
    )}
  </group>
);

export const Backpack: React.FC<P & { color?: string }> = ({ position, rotation, scale = 1, color = "#2E86C1" }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh geometry={rbox(0.36, 0.45, 0.2, 0.05)} material={mat(color)} castShadow />
    <mesh geometry={box(0.26, 0.16, 0.06)} material={mat("#2C2C34")} position={[0, -0.08, 0.12]} />
  </group>
);

export const Pencil: React.FC<P> = ({ position, rotation, scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh geometry={cyl(0.012, 0.012, 0.17, 6)} material={mat("#F2C230")} castShadow />
    <mesh geometry={cyl(0.013, 0.013, 0.03, 6)} material={mat("#E58A9A")} position={[0, 0.095, 0]} />
    <mesh geometry={cyl(0.0, 0.012, 0.03, 6)} material={mat("#E9C9A0")} position={[0, -0.1, 0]} />
  </group>
);

/** Generic skincare bottle (no brand). */
export const Bottle: React.FC<P & { color?: string }> = ({ position, rotation, scale = 1, color = "#9FD8D0" }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh geometry={cyl(0.035, 0.035, 0.13, 8)} material={mat(color)} castShadow />
    <mesh geometry={cyl(0.018, 0.018, 0.04, 8)} material={mat("#F4F4F4")} position={[0, 0.085, 0]} />
    <mesh geometry={box(0.05, 0.05, 0.004)} material={mat("#FFFFFF")} position={[0, 0, 0.035]} />
  </group>
);

/** Small quad-copter for the over-the-top homecoming ask. Rotors spin with the frame. */
export const Drone: React.FC<P & { frame: number }> = ({ position, rotation, scale = 1, frame }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh geometry={rbox(0.22, 0.07, 0.22, 0.02)} material={mat("#2B2F36")} castShadow />
    <mesh geometry={box(0.06, 0.03, 0.02)} material={mat("#7FD4FF")} position={[0, 0, 0.115]} />
    {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([x, z], i) => (
      <group key={i} position={[x * 0.17, 0.03, z * 0.17]}>
        <mesh geometry={box(0.2, 0.02, 0.02)} material={mat("#2B2F36")} position={[-x * 0.08, -0.02, -z * 0.08]} rotation={[0, x * z * Math.PI / 4, 0]} />
        <mesh geometry={box(0.2, 0.006, 0.03)} material={mat("#C9CED6")} position={[0, 0.02, 0]} rotation={[0, frame * 1.3 + i, 0]} />
      </group>
    ))}
  </group>
);
