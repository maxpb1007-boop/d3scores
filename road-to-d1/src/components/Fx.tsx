import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { FONT } from "../lib/fonts";

const sticker = (text: string, k: number, x = 30, y = 15.5, color = "#FFD21F"): React.ReactNode => {
  const s = interpolate(k, [0, 3, 6], [0.6, 1.12, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: `translate(-50%,-50%) scale(${s}) rotate(-4deg)`, fontFamily: FONT, fontWeight: 900, fontSize: 76, color: "#111", background: color, padding: "10px 30px", borderRadius: 18, border: "6px solid #111", whiteSpace: "nowrap" }}>
      {text}
    </div>
  );
};
import { Fx } from "../episodes/types";

/** 2D overlays drawn over the 3D frame (under captions). All driven by the frame number. */
export const FxLayer: React.FC<{ fx: Fx[]; frame: number; shotStart: number }> = ({ fx, frame, shotStart }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {fx.map((f, i) => {
      switch (f.kind) {
        case "flash": {
          const len = f.len ?? 6;
          const o = interpolate(frame - f.f, [0, 1, len], [0.95, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          if (frame < f.f) return null;
          return <AbsoluteFill key={i} style={{ background: f.color ?? "#FFFFFF", opacity: o }} />;
        }
        case "flare": {
          // fake anamorphic lens flare sweeping across the pose
          const k = frame - f.f;
          if (k < 0) return null;
          const x = interpolate(k, [0, 18], [18, 72], { extrapolateRight: "clamp" });
          const o = interpolate(k, [0, 3, 22, 40], [0, 1, 0.75, 0.35], { extrapolateRight: "clamp" });
          return (
            <AbsoluteFill key={i} style={{ opacity: o, mixBlendMode: "screen" }}>
              <div style={{ position: "absolute", left: `${x}%`, top: "26%", width: 520, height: 520, transform: "translate(-50%,-50%)", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,230,160,0.55) 18%, rgba(255,200,90,0.0) 60%)" }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: "26%", height: 22, transform: "translateY(-50%)", background: "linear-gradient(90deg, rgba(120,200,255,0) 0%, rgba(160,220,255,0.85) 50%, rgba(120,200,255,0) 100%)" }} />
              {[0.35, 0.55, 0.8].map((t, j) => (
                <div key={j} style={{ position: "absolute", left: `${100 - x * t - 10}%`, top: `${40 + j * 9}%`, width: 70 + j * 50, height: 70 + j * 50, borderRadius: "50%", transform: "translate(-50%,-50%)", background: ["rgba(120,255,220,0.35)", "rgba(255,160,220,0.3)", "rgba(255,240,140,0.3)"][j] }} />
              ))}
            </AbsoluteFill>
          );
        }
        case "dream": {
          // "imagination" cut: cool tint, heavy vignette, wobbling soft frame
          const k = frame - shotStart;
          const wob = Math.sin(k * 0.6) * 6;
          return (
            <AbsoluteFill key={i}>
              <AbsoluteFill style={{ boxShadow: `inset 0 0 ${160 + wob * 5}px ${30 + wob * 3}px rgba(200,215,255,0.5)` }} />
            </AbsoluteFill>
          );
        }
        case "tint":
          return <AbsoluteFill key={i} style={{ background: f.color, opacity: f.opacity, mixBlendMode: "multiply" }} />;
        case "label":
          return frame < f.f ? null : <React.Fragment key={i}>{sticker(f.text, frame - f.f, f.x, f.y, f.color)}</React.Fragment>;
        case "counter": {
          if (frame < f.f0) return null;
          const n = Math.round(interpolate(frame, [f.f0, f.f1], [f.from, f.to], { extrapolateRight: "clamp" }));
          return <React.Fragment key={i}>{sticker(f.template.replace("{n}", String(n)), frame - f.f0, f.x, f.y)}</React.Fragment>;
        }
        case "vignette":
          return <AbsoluteFill key={i} style={{ boxShadow: `inset 0 0 260px 60px rgba(0,0,0,${f.strength ?? 0.45})` }} />;
      }
    })}
  </AbsoluteFill>
);
