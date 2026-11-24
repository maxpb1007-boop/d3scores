import React from "react";
import { B, Cyl, TileFloor, SkyDome, WallClock, Poster } from "./parts";
import { Paper, Tray } from "../props/Props";
import { FONT } from "../lib/fonts";
import { cone, plane, circle, sphere } from "../lib/geometry";
import { mat, glow } from "../lib/materials";

/*
 * All sets share one layout convention: characters stand near the origin on y = 0, facing +z,
 * and the camera normally sits on the +z side. The back wall is around z = -1.6 .. -2.
 * Every set is deterministic (no randomness at all, or a fixed index-based pattern).
 */

const pick = (arr: string[], i: number) => arr[((i % arr.length) + arr.length) % arr.length];

// ---------------------------------------------------------------- HALLWAY
export const Hallway: React.FC = () => {
  const lockers: React.ReactNode[] = [];
  const LW = 0.46;
  for (let i = -16; i <= 16; i++) {
    const x = i * LW;
    if (x > 2.9 && x < 4.3) continue; // classroom door gap
    const c = i % 7 === 0 ? "#2F5FA8" : "#3A6FC2";
    lockers.push(
      <group key={i} position={[x, 0, -1.75]}>
        <B s={[LW - 0.02, 1.95, 0.45]} p={[0, 1.075, 0]} c={c} />
        {[0, 1, 2].map((k) => (
          <B key={k} s={[0.26, 0.025, 0.02]} p={[0, 1.78 - k * 0.06, 0.23]} c="#244A86" shadow={false} />
        ))}
        {[0, 1, 2].map((k) => (
          <B key={`b${k}`} s={[0.26, 0.025, 0.02]} p={[0, 0.42 - k * 0.06, 0.23]} c="#244A86" shadow={false} />
        ))}
        <B s={[0.04, 0.14, 0.04]} p={[0.15, 1.15, 0.24]} c="#C9CED6" />
      </group>,
    );
  }
  return (
    <group>
      <color attach="background" args={["#E9E1D2"]} />
      <TileFloor nx={22} nz={8} size={0.9} a="#E6DFD1" b="#CFC6B5" z0={1.5} />
      {/* back wall, two-tone with a stripe */}
      <B s={[18, 1.2, 0.2]} p={[0, 2.65, -2.05]} c="#EFE7D6" />
      <B s={[18, 0.14, 0.22]} p={[0, 2.1, -2.03]} c="#1E8C8C" />
      <B s={[18, 0.12, 0.6]} p={[0, 0.06, -1.75]} c="#4B4B55" />
      {lockers}
      {/* classroom door with window */}
      <group position={[3.6, 0, -1.95]}>
        <B s={[1.25, 2.4, 0.12]} p={[0, 1.2, 0]} c="#8A5A3B" />
        <B s={[0.95, 2.25, 0.14]} p={[0, 1.13, 0.02]} c="#A8754F" />
        <B s={[0.4, 0.55, 0.15]} p={[0.12, 1.65, 0.03]} c="#BFE0F2" emissive shadow={false} />
        <B s={[0.08, 0.06, 0.1]} p={[-0.32, 1.05, 0.12]} c="#C9CED6" />
      </group>
      {/* bulletin board + generic spirit poster above lockers */}
      <Poster
        id="hall-poster" p={[-2.2, 2.6, -1.93]} w={1.5} h={0.7}
        draw={(c, W, H) => {
          c.fillStyle = "#FFD21F";
          c.fillRect(0, 0, W, H);
          c.fillStyle = "#1E8C8C";
          c.font = `900 ${H * 0.42}px ${FONT}`;
          c.textAlign = "center";
          c.fillText("GO TEAM!", W / 2, H * 0.62);
        }}
      />
      <Poster
        id="hall-poster2" p={[1.4, 2.6, -1.93]} w={0.9} h={0.65}
        draw={(c, W, H) => {
          c.fillStyle = "#D96C8A";
          c.fillRect(0, 0, W, H);
          c.fillStyle = "#FFFFFF";
          c.font = `900 ${H * 0.2}px ${FONT}`;
          c.textAlign = "center";
          c.fillText("SPIRIT", W / 2, H * 0.42);
          c.fillText("WEEK", W / 2, H * 0.72);
        }}
      />
      {/* ceiling + light panels */}
      <B s={[18, 0.1, 6]} p={[0, 3.3, 0.8]} c="#F3F0E8" shadow={false} />
      {[-6, -3, 0, 3, 6].map((x) => (
        <B key={x} s={[1.6, 0.04, 0.5]} p={[x, 3.24, 0.2]} c="#FFFBEA" emissive shadow={false} />
      ))}
      {/* water fountain + trash can for scale */}
      <group position={[-5.3, 0, -1.6]}>
        <B s={[0.5, 0.35, 0.35]} p={[0, 0.95, 0.15]} c="#C9CED6" />
        <B s={[0.2, 0.8, 0.2]} p={[0, 0.4, 0.1]} c="#A9AEB6" />
      </group>
      <Cyl r={0.22} h={0.6} p={[5.2, 0.3, -1.2]} c="#5C6B7A" />
    </group>
  );
};

// ---------------------------------------------------------------- CLASSROOM
export const Classroom: React.FC = () => {
  const desks: React.ReactNode[] = [];
  for (let r = 0; r < 3; r++)
    for (let k = -2; k <= 2; k++) {
      const x = k * 1.5;
      const z = 1.2 + r * 1.5;
      desks.push(
        <group key={`${r}${k}`} position={[x, 0, z]}>
          <B s={[0.9, 0.05, 0.6]} p={[0, 0.76, 0]} c="#D8B27A" />
          {[[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]].map(([a, b]) => (
            <B key={`${a}${b}`} s={[0.04, 0.74, 0.04]} p={[a, 0.37, b]} c="#6E737B" />
          ))}
          <B s={[0.5, 0.05, 0.45]} p={[0, 0.46, 0.55]} c="#3D7BF2" />
          <B s={[0.5, 0.45, 0.05]} p={[0, 0.72, 0.78]} c="#3D7BF2" />
        </group>,
      );
    }
  const papers = [
    [-0.55, 0.15, "#FFFFFF", 0.05], [-0.2, 0.2, "#FFF4B0", -0.08], [0.15, 0.12, "#FFFFFF", 0.1], [0.5, 0.18, "#CDE9FF", -0.04],
    [-0.4, -0.22, "#FFD6E0", -0.1], [0.05, -0.2, "#FFFFFF", 0.06], [0.45, -0.24, "#E3F7D4", 0.12],
  ] as const;
  return (
    <group>
      <color attach="background" args={["#EADFC9"]} />
      <B s={[14, 0.1, 12]} p={[0, -0.05, 2]} c="#B88A5A" />
      {Array.from({ length: 14 }).map((_, i) => (
        <B key={i} s={[0.02, 0.005, 12]} p={[-7 + i, 0.002, 2]} c="#9E7448" shadow={false} />
      ))}
      <B s={[14, 3.4, 0.2]} p={[0, 1.7, -2.1]} c="#F1E6CF" />
      <B s={[14, 0.12, 0.22]} p={[0, 1.0, -2.0]} c="#C7B48F" />
      <B s={[14, 0.1, 12]} p={[0, 3.4, 2]} c="#F3F0E8" shadow={false} />
      {[-3, 0, 3].map((x) => (
        <B key={x} s={[1.6, 0.04, 0.5]} p={[x, 3.34, 0.8]} c="#FFFBEA" emissive shadow={false} />
      ))}
      {/* whiteboard */}
      <B s={[3.2, 1.3, 0.06]} p={[-1.2, 1.85, -1.97]} c="#FAFAFA" />
      <B s={[3.3, 0.06, 0.12]} p={[-1.2, 1.17, -1.93]} c="#9AA0A8" />
      {/* corkboard with pinned papers */}
      <group position={[2.4, 1.85, -1.97]}>
        <B s={[1.7, 1.15, 0.06]} p={[0, 0, 0]} c="#B98A55" />
        <B s={[1.8, 1.25, 0.04]} p={[0, 0, -0.02]} c="#6E4B2E" />
        {papers.map(([x, y, col, rot], i) => (
          <group key={i} position={[x, y, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <Paper rotation={[0, rot, 0]} color={col} scale={0.9} />
          </group>
        ))}
        {papers.map(([x, y], i) => (
          <mesh key={`pin${i}`} geometry={cone(0.02, 0.03, 4)} material={mat(pick(["#E74C3C", "#3498DB", "#F1C40F"], i))} position={[x, y + 0.1, 0.06]} rotation={[Math.PI / 2, 0, 0]} />
        ))}
      </group>
      <WallClock p={[0.6, 2.95, -1.96]} h={10} m={10} />
      {/* window wall on the left: the key light's source */}
      <B s={[0.2, 3.4, 12]} p={[-5.5, 1.7, 2]} c="#F1E6CF" />
      {[-0.5, 1.8, 4.1].map((z) => (
        <group key={z} position={[-5.38, 1.9, z]}>
          <B s={[0.05, 1.5, 1.6]} p={[0, 0, 0]} c="#CFEAFF" emissive shadow={false} />
          <B s={[0.08, 0.06, 1.7]} p={[0, 0, 0]} c="#FFFFFF" />
          <B s={[0.08, 1.6, 0.06]} p={[0, 0, 0]} c="#FFFFFF" />
        </group>
      ))}
      {desks}
    </group>
  );
};

// ---------------------------------------------------------------- CAFETERIA
export const Cafeteria: React.FC = () => {
  const tables: React.ReactNode[] = [];
  const spots: [number, number][] = [[0, 0.75], [-2.8, 0.75], [2.8, 0.75], [-1.4, -0.9], [1.4, 3.0], [-3.4, 3.2]];
  spots.forEach(([x, z], i) =>
    tables.push(
      <group key={i} position={[x, 0, z]}>
        <B s={[2.2, 0.06, 0.85]} p={[0, 0.76, 0]} c="#F7F7F2" rounded={0.02} />
        <B s={[0.08, 0.72, 0.5]} p={[-0.8, 0.37, 0]} c="#8D939C" />
        <B s={[0.08, 0.72, 0.5]} p={[0.8, 0.37, 0]} c="#8D939C" />
        <B s={[2.2, 0.06, 0.32]} p={[0, 0.46, 0.72]} c="#E9E6DE" />
        <B s={[2.2, 0.06, 0.32]} p={[0, 0.46, -0.72]} c="#E9E6DE" />
        {i > 0 && <Tray position={[(i % 2 ? -0.5 : 0.5), 0.8, 0.1]} rotation={[0, i * 0.4, 0]} />}
        {i % 3 === 1 && <Tray position={[0.4, 0.8, -0.15]} rotation={[0, -0.3, 0]} food={false} />}
      </group>,
    ),
  );
  return (
    <group>
      <color attach="background" args={["#EAE6DA"]} />
      <TileFloor nx={18} nz={10} size={0.9} a="#F0EBDF" b="#D5E3E6" z0={1.5} />
      <B s={[16, 3.6, 0.2]} p={[0, 1.8, -2.6]} c="#F2EDE2" />
      <B s={[16, 0.9, 0.22]} p={[0, 0.45, -2.55]} c="#F08A24" />
      {/* big windows */}
      {[-4.5, -1.5, 1.5, 4.5].map((x) => (
        <group key={x} position={[x, 2.2, -2.48]}>
          <B s={[2.2, 1.6, 0.05]} p={[0, 0, 0]} c="#CFEAFF" emissive shadow={false} />
          <B s={[2.3, 0.08, 0.1]} p={[0, 0, 0.02]} c="#FFFFFF" />
          <B s={[0.08, 1.7, 0.1]} p={[0, 0, 0.02]} c="#FFFFFF" />
        </group>
      ))}
      {/* serving counter on the right (lunch line) */}
      <group position={[5.2, 0, 0.5]}>
        <B s={[0.9, 0.95, 5]} p={[0, 0.475, 0]} c="#BCC3CB" />
        <B s={[1.1, 0.06, 5.1]} p={[0, 0.98, 0]} c="#DDE2E7" />
        {[-1.5, -0.5, 0.5, 1.5].map((z) => (
          <B key={z} s={[0.6, 0.08, 0.7]} p={[0.05, 1.02, z]} c={pick(["#F2D16B", "#8E5A3C", "#6DBE45", "#D9534F"], z * 2 + 3)} />
        ))}
      </group>
      {/* ceiling lights */}
      <B s={[16, 0.1, 8]} p={[0, 3.6, 1]} c="#F5F3EE" shadow={false} />
      {[-4, 0, 4].map((x) => (
        <B key={x} s={[1.8, 0.04, 0.6]} p={[x, 3.54, 0.8]} c="#FFFBEA" emissive shadow={false} />
      ))}
      {tables}
    </group>
  );
};

// ---------------------------------------------------------------- BEDROOM (night)
export const Bedroom: React.FC = () => (
  <group>
    <color attach="background" args={["#0E1024"]} />
    <B s={[10, 0.1, 8]} p={[0, -0.05, 1]} c="#3A3350" />
    <B s={[10, 3.2, 0.2]} p={[0, 1.6, -2.1]} c="#2D3566" />
    <B s={[0.2, 3.2, 8]} p={[-3.4, 1.6, 1]} c="#262C58" />
    {/* window with moonlight */}
    <group position={[-1.6, 1.95, -1.98]}>
      <B s={[1.3, 1.1, 0.04]} p={[0, 0, 0]} c="#1C2E66" emissive shadow={false} />
      <mesh geometry={plane(0.22, 0.22)} material={glow("#F4F1D0")} position={[0.3, 0.25, 0.03]} />
      {[[-0.4, -0.2], [-0.1, 0.3], [0.1, -0.1], [-0.3, 0.1]].map(([x, y], i) => (
        <mesh key={i} geometry={plane(0.025, 0.025)} material={glow("#FFFFFF")} position={[x, y, 0.03]} />
      ))}
      <B s={[1.4, 0.07, 0.1]} p={[0, 0, 0.03]} c="#C9CCE0" />
      <B s={[0.07, 1.2, 0.1]} p={[0, 0, 0.03]} c="#C9CCE0" />
      <B s={[1.5, 0.08, 0.2]} p={[0, -0.6, 0.06]} c="#C9CCE0" />
    </group>
    {/* poster: generic football silhouette */}
    <Poster
      id="bed-poster" p={[1.4, 2.0, -1.99]} w={0.8} h={1.1}
      draw={(c, W, H) => {
        c.fillStyle = "#1E8C8C";
        c.fillRect(0, 0, W, H);
        c.fillStyle = "#FFD21F";
        c.beginPath();
        c.ellipse(W / 2, H * 0.45, W * 0.32, W * 0.2, -0.5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#FFFFFF";
        c.font = `900 ${W * 0.16}px ${FONT}`;
        c.textAlign = "center";
        c.fillText("D1", W / 2, H * 0.85);
      }}
    />
    {/* bed */}
    <group position={[0.2, 0, -0.6]}>
      <B s={[2.0, 0.35, 2.4]} p={[0, 0.2, 0]} c="#5B4636" />
      <B s={[1.9, 0.22, 2.3]} p={[0, 0.48, 0]} c="#E8E4F2" rounded={0.05} />
      <B s={[1.95, 0.12, 1.6]} p={[0, 0.62, 0.35]} c="#3D7BF2" rounded={0.05} />
      <B s={[0.8, 0.16, 0.45]} p={[-0.45, 0.68, -0.85]} c="#F4F1EA" rounded={0.06} />
      <B s={[2.05, 1.0, 0.12]} p={[0, 0.65, -1.2]} c="#4A3829" />
    </group>
    {/* nightstand + digital clock 2:13 AM */}
    <group position={[-1.35, 0, -1.3]}>
      <B s={[0.6, 0.6, 0.5]} p={[0, 0.3, 0]} c="#6B5241" />
      <B s={[0.4, 0.18, 0.15]} p={[0, 0.7, 0]} c="#151518" />
      <Poster
        id="clock-213" p={[0, 0.7, 0.077]} w={0.36} h={0.14} lit={false}
        draw={(c, W, H) => {
          c.fillStyle = "#0B0B0D";
          c.fillRect(0, 0, W, H);
          c.fillStyle = "#FF3B3B";
          c.font = `800 ${H * 0.72}px ${FONT}`;
          c.textAlign = "center";
          c.fillText("2:13", W * 0.42, H * 0.78);
          c.font = `800 ${H * 0.3}px ${FONT}`;
          c.fillText("AM", W * 0.84, H * 0.78);
        }}
      />
      <pointLight position={[0, 0.75, 0.25]} intensity={0.25} distance={1.2} color="#FF5050" />
    </group>
    {/* desk with a lamp off */}
    <group position={[2.4, 0, -1.4]}>
      <B s={[1.4, 0.06, 0.7]} p={[0, 0.75, 0]} c="#6B5241" />
      <B s={[0.06, 0.74, 0.6]} p={[-0.6, 0.37, 0]} c="#594434" />
      <B s={[0.06, 0.74, 0.6]} p={[0.6, 0.37, 0]} c="#594434" />
    </group>
  </group>
);

// ---------------------------------------------------------------- BATHROOM MIRROR (montage)
export const Bathroom: React.FC = () => {
  const tiles: React.ReactNode[] = [];
  for (let i = -6; i <= 6; i++)
    for (let j = 0; j < 10; j++)
      tiles.push(<B key={`${i}${j}`} s={[0.3, 0.3, 0.04]} p={[i * 0.31, 0.15 + j * 0.31, -1.7]} c={(i + j) % 2 ? "#DDEFF0" : "#F4FAFA"} shadow={false} />);
  return (
    <group>
      <color attach="background" args={["#DDEFF0"]} />
      <B s={[8, 0.1, 6]} p={[0, -0.05, 0.5]} c="#9FB7BA" />
      <B s={[8, 3.4, 0.1]} p={[0, 1.7, -1.78]} c="#CFE3E5" />
      {tiles}
      {/* mirror */}
      <B s={[1.5, 1.1, 0.05]} p={[0, 2.0, -1.66]} c="#E4F2F7" emissive shadow={false} />
      <B s={[1.6, 1.2, 0.03]} p={[0, 2.0, -1.68]} c="#8A8F96" />
      {/* sink counter */}
      <B s={[1.8, 0.9, 0.55]} p={[0, 0.45, -1.4]} c="#7E9C9F" />
      <B s={[1.9, 0.06, 0.6]} p={[0, 0.93, -1.4]} c="#F4F4F4" />
      <Cyl r={0.04} h={0.25} p={[0, 1.08, -1.6]} c="#C9CED6" />
      <B s={[1.2, 0.04, 0.4]} p={[0, 3.0, -1.4]} c="#FFFBEA" emissive shadow={false} />
    </group>
  );
};

// ---------------------------------------------------------------- PRACTICE FIELD (golden hour)
/**
 * Field runs along z (the snap shots look down the field). `bleachers` moves a bank of
 * bleachers so that a character sitting at the origin is on the third row, looking out at the
 * field (+z), with the stands and the sky behind them.
 */
/** Seat height of the bleacher row the characters sit on, in "bleachers" mode. */
export const BLEACHER_SEAT_Y = 1.31;

export const Field: React.FC<{ mode?: "field" | "bleachers" }> = ({ mode = "field" }) => {
  const YD = 0.9144;
  const lines: React.ReactNode[] = [];
  for (let k = -10; k <= 10; k++) {
    const z = k * 5 * YD;
    lines.push(<B key={k} s={[24, 0.012, 0.1]} p={[0, 0.006, z]} c="#F4F4EC" shadow={false} />);
    for (let h = 1; h < 5; h++) {
      lines.push(<B key={`${k}h${h}`} s={[0.35, 0.012, 0.06]} p={[-2.8, 0.006, z + h * YD]} c="#F4F4EC" shadow={false} />);
      lines.push(<B key={`${k}g${h}`} s={[0.35, 0.012, 0.06]} p={[2.8, 0.006, z + h * YD]} c="#F4F4EC" shadow={false} />);
    }
  }
  const stripes: React.ReactNode[] = [];
  for (let k = -12; k < 12; k++)
    stripes.push(<B key={k} s={[60, 0.01, 5 * YD]} p={[0, -0.005, (k + 0.5) * 5 * YD]} c={k % 2 ? "#5E9A3C" : "#6AA845"} shadow={false} />);
  const trees: React.ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const r = 70 + ((i * 37) % 11);
    const h = 9 + ((i * 53) % 7);
    trees.push(
      <mesh key={i} geometry={cone(3.5, h, 5)} material={mat(i % 2 ? "#3F6B3A" : "#4C7A3F")} position={[Math.cos(a) * r, h / 2, Math.sin(a) * r]} />,
    );
  }
  const bleachers = (
    <group>
      {[0, 1, 2, 3, 4, 5].map((r) => (
        <group key={r} position={[0, 0.28 + r * 0.42, -r * 0.8]}>
          <B s={[9, 0.08, 0.38]} p={[0, 0.15, 0]} c="#C3CAD2" />
          <B s={[9, 0.05, 0.3]} p={[0, -0.12, 0.38]} c="#9AA3AD" />
          <B s={[9, 0.42 + r * 0.42, 0.06]} p={[0, -(0.42 + r * 0.42) / 2 + 0.1, -0.16]} c="#7F8892" shadow={false} />
        </group>
      ))}
      {[-4.4, 0, 4.4].map((x) => (
        <B key={x} s={[0.1, 3.2, 0.1]} p={[x, 1.6, -4.3]} c="#7F8892" />
      ))}
      <B s={[9, 0.08, 0.08]} p={[0, 3.2, -4.3]} c="#7F8892" />
    </group>
  );
  return (
    <group>
      <SkyDome top="#7FA3D9" mid="#FFC88A" bottom="#E9A66A" />
      <fog attach="fog" args={["#F2C08A", 30, 120]} />
      <mesh geometry={plane(400, 400)} material={mat("#5E8F3A")} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow />
      {stripes}
      {lines}
      {trees}
      {/* sun disc low on the horizon behind the bleachers side */}
      <mesh geometry={circle(7, 20)} material={glow("#FFE7B0")} position={[-40, 9, -110]} />
      {/* goalpost at the far end */}
      <group position={[0, 0, -50 * YD - 1]}>
        <Cyl r={0.12} h={3} p={[0, 1.5, 0]} c="#F2C230" />
        <B s={[5.6, 0.18, 0.18]} p={[0, 3, 0]} c="#F2C230" />
        <Cyl r={0.08} h={6} p={[-2.8, 6, 0]} c="#F2C230" />
        <Cyl r={0.08} h={6} p={[2.8, 6, 0]} c="#F2C230" />
      </group>
      <group position={[0, 0, 50 * YD + 1]}>
        <Cyl r={0.12} h={3} p={[0, 1.5, 0]} c="#F2C230" />
        <B s={[5.6, 0.18, 0.18]} p={[0, 3, 0]} c="#F2C230" />
        <Cyl r={0.08} h={6} p={[-2.8, 6, 0]} c="#F2C230" />
        <Cyl r={0.08} h={6} p={[2.8, 6, 0]} c="#F2C230" />
      </group>
      {mode === "field" ? (
        <group position={[-16, 0, -6]} rotation={[0, Math.PI / 2, 0]}>
          {bleachers}
        </group>
      ) : (
        <group position={[0, 0, 1.6]}>{bleachers}</group>
      )}
    </group>
  );
};


// ---------------------------------------------------------------- TOWN STREET ("In this town")
/** A bright toy-town street running along z: road, sidewalks, two rows of colourful houses, trees,
 *  lamp posts. Characters stand on the sidewalk/road near the origin; aerials look down the street. */
export const Town: React.FC = () => {
  const HOUSE = ["#F2C14E", "#7FB7E6", "#E88D9B", "#9CD08A", "#C8A2E8", "#F4A261", "#EDEDED"];
  const ROOF = ["#C0392B", "#2E5C8A", "#6B4F3A", "#3E6B4A", "#8A3A5C"];
  const houses: React.ReactNode[] = [];
  for (let i = -6; i <= 6; i++)
    for (const side of [-1, 1]) {
      const k = i * 7 + side * 3 + 50;
      const z = i * 5.2;
      const w = 3.4 + (k % 3) * 0.4, h = 2.6 + (k % 2) * 0.9;
      const x = side * (6.4 + w / 2);
      houses.push(
        <group key={`${i}${side}`} position={[x, 0, z]} rotation={[0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
          <B s={[w, h, 3.6]} p={[0, h / 2, 0]} c={pick(HOUSE, k)} />
          <mesh geometry={cone(Math.max(w, 3.6) * 0.78, 1.6, 4)} material={mat(pick(ROOF, k))} position={[0, h + 0.8, 0]} rotation={[0, Math.PI / 4, 0]} castShadow />
          <B s={[0.8, 1.5, 0.08]} p={[0, 0.75, 1.82]} c="#7A4E33" />
          <B s={[0.7, 0.6, 0.06]} p={[-w * 0.3, h * 0.62, 1.82]} c="#CFEAFF" emissive shadow={false} />
          <B s={[0.7, 0.6, 0.06]} p={[w * 0.3, h * 0.62, 1.82]} c="#CFEAFF" emissive shadow={false} />
        </group>,
      );
      // tree + lamp in front of every other house
      if (k % 2 === 0) {
        houses.push(
          <group key={`t${i}${side}`} position={[side * 4.6, 0, z + 2.2]}>
            <Cyl r={0.12} h={1.2} p={[0, 0.6, 0]} c="#7A4E33" />
            <mesh geometry={sphere(0.9, 6, 5)} material={mat(k % 4 === 0 ? "#4FA24A" : "#6ABF4B")} position={[0, 1.7, 0]} castShadow />
          </group>,
        );
      } else {
        houses.push(
          <group key={`l${i}${side}`} position={[side * 4.7, 0, z]}>
            <Cyl r={0.05} h={3.2} p={[0, 1.6, 0]} c="#3A3F48" />
            <B s={[0.25, 0.18, 0.25]} p={[0, 3.25, 0]} c="#FFF3C4" emissive shadow={false} />
          </group>,
        );
      }
    }
  return (
    <group>
      <SkyDome top="#5EA6F2" mid="#CFE8FF" bottom="#9CD08A" />
      <fog attach="fog" args={["#CFE8FF", 30, 110]} />
      <mesh geometry={plane(400, 400)} material={mat("#7CC35A")} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow />
      <B s={[6, 0.02, 80]} p={[0, 0.0, 0]} c="#4A4E58" shadow={false} />
      {Array.from({ length: 16 }).map((_, i) => (
        <B key={i} s={[0.15, 0.025, 1.6]} p={[0, 0.012, -38 + i * 5]} c="#F2C230" shadow={false} />
      ))}
      <B s={[2.6, 0.12, 80]} p={[-4.3, 0.06, 0]} c="#D8D4CC" />
      <B s={[2.6, 0.12, 80]} p={[4.3, 0.06, 0]} c="#D8D4CC" />
      {[-1.1, -0.55, 0, 0.55, 1.1].map((x) => (
        <B key={x} s={[0.35, 0.025, 2.2]} p={[x, 0.013, 6]} c="#F4F4F4" shadow={false} />
      ))}
      {houses}
    </group>
  );
};

// ---------------------------------------------------------------- STOREFRONT (office building entrance)
/** Glass double door at x 0 in a building facade at z -1.8; the left door panel stands open toward
 *  the camera (+z). Sidewalk runs along x so people can approach from far away (x +14). */
export const Storefront: React.FC = () => (
  <group>
    <SkyDome top="#6FB0F2" mid="#D6ECFF" bottom="#B9C7D6" />
    <fog attach="fog" args={["#D6ECFF", 30, 120]} />
    <mesh geometry={plane(400, 400)} material={mat("#8A8F96")} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow />
    <B s={[40, 0.12, 4.5]} p={[0, 0.06, 0.4]} c="#D8D4CC" />
    <B s={[40, 0.02, 6]} p={[0, 0.01, 5.6]} c="#4A4E58" shadow={false} />
    {/* facade */}
    <B s={[40, 8, 0.4]} p={[0, 4, -2.0]} c="#B9A58A" />
    {[-12, -8, -4, 4, 8, 12].map((x) => (
      <B key={x} s={[2.6, 1.8, 0.06]} p={[x, 1.6, -1.78]} c="#9CC7E8" emissive shadow={false} />
    ))}
    {[-12, -8, -4, 0, 4, 8, 12].map((x) => (
      <B key={`u${x}`} s={[2.6, 1.5, 0.06]} p={[x, 4.6, -1.78]} c="#9CC7E8" emissive shadow={false} />
    ))}
    <Poster id="bldg-sign" p={[0, 3.35, -1.77]} w={2.6} h={0.5}
      draw={(c, W, H) => { c.fillStyle = "#2E3A59"; c.fillRect(0, 0, W, H); c.fillStyle = "#FFFFFF"; c.font = `800 ${H * 0.5}px ${FONT}`; c.textAlign = "center"; c.fillText("BUILDING 9", W / 2, H * 0.68); }} />
    {/* door frame + fixed right panel + open left panel */}
    <B s={[2.3, 2.7, 0.3]} p={[0, 1.35, -1.85]} c="#3A3F48" />
    <B s={[1.0, 2.4, 0.06]} p={[0.52, 1.22, -1.66]} c="#BFE3F7" emissive shadow={false} />
    <group position={[-1.02, 0, -1.66]} rotation={[0, -1.35, 0]}>
      <B s={[1.0, 2.4, 0.06]} p={[0.5, 1.22, 0]} c="#BFE3F7" />
      <B s={[1.04, 2.44, 0.03]} p={[0.5, 1.22, -0.03]} c="#3A3F48" />
      <B s={[0.05, 0.5, 0.08]} p={[0.88, 1.1, 0.06]} c="#C9CED6" />
    </group>
    <B s={[1.0, 2.4, 0.05]} p={[-0.52, 1.22, -1.8]} c="#2A2E36" shadow={false} />
    {/* planters */}
    {[-2.2, 2.2].map((x) => (
      <group key={x} position={[x, 0, -1.2]}>
        <B s={[0.7, 0.6, 0.7]} p={[0, 0.3, 0]} c="#6B4F3A" />
        <mesh geometry={sphere(0.45, 6, 5)} material={mat("#4FA24A")} position={[0, 0.9, 0]} castShadow />
      </group>
    ))}
    {[-9, 9, 15].map((x) => (
      <group key={`t${x}`} position={[x, 0, 2.4]}>
        <Cyl r={0.12} h={1.4} p={[0, 0.7, 0]} c="#7A4E33" />
        <mesh geometry={sphere(1.0, 6, 5)} material={mat("#6ABF4B")} position={[0, 1.9, 0]} castShadow />
      </group>
    ))}
  </group>
);

// ---------------------------------------------------------------- RESTAURANT (warm, evening)
/** One table at the origin (top y 0.78). Diner sits on the far side (z -0.55) facing +z; the waiter
 *  stands at the side. Background tables, pendant lights and a window for depth. */
export const Restaurant: React.FC = () => {
  const table = (x: number, z: number, k: string) => (
    <group key={k} position={[x, 0, z]}>
      <B s={[1.2, 0.05, 0.9]} p={[0, 0.78, 0]} c="#F7F3EA" />
      <B s={[1.24, 0.22, 0.94]} p={[0, 0.66, 0]} c="#F2EDE2" shadow={false} />
      <B s={[0.1, 0.6, 0.1]} p={[0, 0.3, 0]} c="#3A2A22" />
      <B s={[0.5, 0.05, 0.45]} p={[0, 0.46, -0.65]} c="#7A3E2A" />
      <B s={[0.5, 0.55, 0.06]} p={[0, 0.74, -0.86]} c="#7A3E2A" />
    </group>
  );
  return (
    <group>
      <color attach="background" args={["#2A1A14"]} />
      <B s={[14, 0.1, 10]} p={[0, -0.05, 1]} c="#6B4630" />
      <B s={[14, 3.4, 0.2]} p={[0, 1.7, -2.2]} c="#C9A27A" />
      <B s={[14, 1.0, 0.24]} p={[0, 0.5, -2.1]} c="#7A3E2A" />
      <B s={[0.2, 3.4, 10]} p={[-4.5, 1.7, 1]} c="#BC956E" />
      <group position={[1.6, 1.9, -2.08]}>
        <B s={[1.6, 1.1, 0.04]} p={[0, 0, 0]} c="#2B3E6E" emissive shadow={false} />
        <B s={[1.7, 0.06, 0.08]} p={[0, 0, 0.02]} c="#3A2A22" />
        <B s={[0.06, 1.2, 0.08]} p={[0, 0, 0.02]} c="#3A2A22" />
      </group>
      <Poster id="rest-art" p={[-1.8, 2.0, -2.08]} w={0.9} h={0.7}
        draw={(c, W, H) => { c.fillStyle = "#E9D8B4"; c.fillRect(0, 0, W, H); c.fillStyle = "#C0392B"; c.beginPath(); c.arc(W * 0.4, H * 0.55, H * 0.25, 0, 6.28); c.fill(); c.fillStyle = "#3E6B4A"; c.fillRect(W * 0.6, H * 0.3, W * 0.15, H * 0.5); }} />
      {table(0, 0, "main")}
      {table(-2.6, -0.6, "b1")}
      {table(2.8, -0.4, "b2")}
      {table(-1.6, 2.6, "b3")}
      {/* place settings + candle on the main table */}
      <Cyl r={0.15} h={0.02} p={[0, 0.81, -0.25]} c="#FFFFFF" seg={14} />
      <Cyl r={0.04} h={0.12} p={[0.35, 0.87, 0.05]} c="#F4EFE3" />
      <mesh geometry={sphere(0.025, 6, 5)} material={glow("#FFC46B")} position={[0.35, 0.95, 0.05]} />
      <pointLight position={[0.35, 1.05, 0.05]} intensity={0.6} distance={2} color="#FFB060" />
      {[-2.6, 0, 2.8].map((x) => (
        <group key={x} position={[x, 2.6, x === 0 ? 0 : -0.5]}>
          <Cyl r={0.01} h={0.8} p={[0, 0.4, 0]} c="#222" />
          <mesh geometry={cone(0.22, 0.2, 8)} material={mat("#2E2A26")} />
          <mesh geometry={sphere(0.08, 6, 5)} material={glow("#FFD9A0")} position={[0, -0.1, 0]} />
        </group>
      ))}
    </group>
  );
};

export const SETS = { Hallway, Classroom, Cafeteria, Bedroom, Bathroom, Field, Town, Storefront, Restaurant };
