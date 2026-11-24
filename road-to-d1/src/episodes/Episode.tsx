import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Rig } from "../characters/Rig";
import { poseAt } from "../characters/poses";
import { Expression, V3 } from "../characters/types";
import { CameraRig, Lights } from "../lib/Stage";
import { SETS } from "../sets/Sets";
import { lerp, smooth, kick, clamp } from "../lib/anim";
import { Phone } from "../props/Phone";
import { Football, Sandwich, Books, Pencil, Bottle, Spoon } from "../props/Props";
import { StarBadge, CamPos } from "../props/StarBadge";
import { Actor, HandProp, Shot } from "./types";
import { MouthTrack } from "./ep01/mouth";
import { mouthAt } from "./mouth";
import { Captions, CaptionWord } from "../components/Captions";
import { FxLayer } from "../components/Fx";
import { EndCard } from "../components/EndCard";

const handNode = (p: HandProp | undefined, frame: number): React.ReactNode => {
  if (!p) return null;
  switch (p.kind) {
    // Hand-local frame: -y runs along the forearm toward the fingertips, +z is the palm-front.
    case "phone":
      return <Phone screen={p.screen} light={p.light ?? 0} scroll={frame * 9} position={[0, -0.05, 0.06]} rotation={[-1.25, 0, 0]} scale={1.7} />;
    case "football":
      return <Football position={[0, -0.04, 0.09]} rotation={[0.3, 0, 0]} />;
    case "sandwich":
      return <Sandwich position={[0, -0.05, 0.08]} rotation={[1.2, 0, 0]} scale={0.9} />;
    case "pencil":
      return <Pencil position={[0, -0.06, 0.07]} rotation={[0.3, 0, 1.2]} scale={1.3} />;
    case "bottle":
      return <Bottle position={[0, -0.05, 0.08]} rotation={[0.2, 0, 0]} scale={1.2} />;
    case "spoon":
      return <Spoon position={[0, -0.04, 0.06]} rotation={[-0.3, 0, 0]} scale={1.4} />;
    case "books":
      return <Books position={[0, -0.1, 0.12]} rotation={[0.2, 0, 0]} scale={0.8} />;
  }
};

const lastKey = <T extends { f: number }>(keys: T[] | undefined, f: number): T | undefined => {
  if (!keys || !keys.length) return undefined;
  let k = keys[0];
  for (const x of keys) if (x.f <= f) k = x;
  return k;
};

const ActorView: React.FC<{ a: Actor; frame: number; real: number; mouth: MouthTrack[] }> = ({ a, frame, real, mouth }) => {
  const joints = poseAt(a.poses, frame);
  const e = (lastKey(a.expr, frame)?.e ?? a.who.defaultExpression) as Expression;
  // head look: ease from the previous key to the current one over `dur` frames
  let look: [number, number] = [0, 0];
  if (a.look?.length) {
    let i = 0;
    for (let n = 0; n < a.look.length; n++) if (a.look[n].f <= frame) i = n;
    const cur = a.look[i];
    const prev = i > 0 ? a.look[i - 1] : cur;
    const k = a.look[i].f > frame ? 0 : smooth((frame - cur.f) / (cur.dur ?? 8));
    look = [lerp(prev.yaw, cur.yaw, k), lerp(prev.pitch ?? 0, cur.pitch ?? 0, k)];
    if (a.look[0].f > frame) look = [0, 0];
  }
  let pos = a.pos;
  if (a.move) {
    const k = smooth((frame - a.move.f0) / (a.move.f1 - a.move.f0));
    pos = [lerp(a.pos[0], a.move.to[0], k), lerp(a.pos[1], a.move.to[1], k), lerp(a.pos[2], a.move.to[2], k)];
  }
  let yaw = a.yaw ?? 0;
  if (a.turn) yaw = lerp(yaw, a.turn.to, smooth((frame - a.turn.f0) / (a.turn.f1 - a.turn.f0)));
  const speech = a.mouth === "none" ? 0 : mouthAt(mouth, a.who.id, real);
  const chew = a.mouth === "chew" && speech < 0.05;
  let blink: number | undefined;
  for (const b of a.blinks ?? []) {
    const k = frame - b;
    if (k >= 0 && k < 5) blink = [0.5, 1, 1, 0.6, 0.2][k];
  }
  // A phone with its screen lit also lights the holder's face (needed in the night bedroom).
  const ph = a.rHand?.kind === "phone" ? a.rHand.light ?? 0 : 0;
  const hy = a.who.thigh + a.who.shin + 0.085 + a.who.torsoH + 0.06 + a.who.headH / 2;
  // "In This Town" star badge over the head
  const st = lastKey(a.stars, frame);
  const glowK = a.glow && frame >= a.glow[0] && frame <= a.glow[1] ? 0.55 + 0.45 * Math.sin((frame - a.glow[0]) * 0.5) : 0;
  return (
    <>
    {st && <StarBadge at={[pos[0], pos[1] + hy + 0.6, pos[2]]} n={st.n} glow={glowK} bob={Math.sin(frame * 0.08) * 0.015} />}
    {ph > 0 && (
      <pointLight
        position={[pos[0] + Math.sin(yaw) * 0.6, pos[1] + hy - 0.25, pos[2] + Math.cos(yaw) * 0.6]}
        intensity={ph * 0.35}
        distance={2.2}
        decay={1.5}
        color="#8FAEFF"
      />
    )}
    <Rig
      spec={a.who}
      joints={joints}
      expression={e}
      mouthOpen={speech}
      chew={chew}
      blink={blink}
      lookAt={look}
      position={pos}
      rotation={[0, yaw, 0]}
      t={frame}
      rHand={handNode(a.rHand, frame)}
      lHand={handNode(a.lHand, frame)}
    />
    </>
  );
};

// `frame` = position on the edit timeline (drives the shot); `real` = actual video frame (drives lip sync).
const ShotView: React.FC<{ shot: Shot; frame: number; real: number; mouth: MouthTrack[] }> = ({ shot, frame, real, mouth }) => {
  const S = SETS[shot.set] as React.FC<{ mode?: "field" | "bleachers" }>;
  const p = clamp((frame - shot.start) / Math.max(1, shot.end - shot.start));
  const end = shot.camEnd ?? shot.cam;
  const k = smooth(p);
  const l3 = (a: V3, b: V3): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  let pos = l3(shot.cam.pos, end.pos);
  const target = l3(shot.cam.target, end.target);
  // slow push-in on every hold (2-4 %) so no frame is ever static
  const fov = lerp(shot.cam.fov, end.fov, k) * (1 - (shot.push ?? 0.03) * p);
  let roll = 0;
  for (const s of shot.shake ?? []) {
    const j = kick(frame, s.f, s.amp, 9);
    const j2 = kick(frame + 1, s.f, s.amp, 9);
    pos = [pos[0] + j * 0.035, pos[1] + j2 * 0.025, pos[2]];
    roll += j * 0.02;
  }
  return (
    <CamPos.Provider value={pos}>
      <CameraRig pos={pos} target={target} fov={fov} roll={roll} />
      <Lights preset={shot.light} target={shot.lightTarget ?? [0, 1, 0]} />
      <S mode={shot.setMode} />
      {shot.actors.map((a, i) => (
        <ActorView key={`${shot.id}-${i}`} a={a} frame={frame} real={real} mouth={mouth} />
      ))}
      {shot.extra?.(frame)}
    </CamPos.Provider>
  );
};

export type EpisodeProps = {
  shots: Shot[];
  mouth: MouthTrack[];
  captions: CaptionWord[];
  highlights: Record<string, string[]>;
  blackStart: number;
  endCardStart: number;
  episodeNumber: number;
  endTitle?: string; // end-card overrides for one-off clips
  endCta?: string;
  captionMode?: "phrase" | "word";
  series?: [string, string];
  safeZoneDebug?: boolean;
  shotFrame?: (videoFrame: number) => number; // retime map (see retime.ts); identity if omitted
};

export const Episode: React.FC<EpisodeProps> = ({ shots, mouth, captions, highlights, blackStart, endCardStart, episodeNumber, safeZoneDebug, shotFrame, endTitle, endCta, captionMode, series }) => {
  const frame = useCurrentFrame();
  const sf = shotFrame ? shotFrame(frame) : frame;
  const { width, height } = useVideoConfig();
  const shot = shots.find((s) => sf >= s.start && sf < s.end) ?? shots[shots.length - 1];
  if (frame >= endCardStart) return <EndCard episode={episodeNumber} start={endCardStart} safeZoneDebug={safeZoneDebug} title={endTitle} cta={endCta} series={series} />;
  if (frame >= blackStart) return <AbsoluteFill style={{ background: "#000" }} />;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas key={shot.set + (shot.setMode ?? "")} width={width} height={height} shadows gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <ShotView shot={shot} frame={sf} real={frame} mouth={mouth} />
      </ThreeCanvas>
      <FxLayer fx={shot.fx ?? []} frame={sf} shotStart={shot.start} />
      <Captions words={captions} highlights={highlights} hideFrom={blackStart} debug={safeZoneDebug} mode={captionMode} />
    </AbsoluteFill>
  );
};
