import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "../lib/fonts";
import { SafeZoneOverlay } from "./Captions";

/** Series end card. Everything sits inside the TikTok safe zone (x 5-86 %, y 10-78 %). */
export const EndCard: React.FC<{ episode: number; start: number; safeZoneDebug?: boolean; title?: string; cta?: string }> = ({ episode, start, safeZoneDebug, title, cta }) => {
  const frame = useCurrentFrame() - start;
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 11, stiffness: 180 } });
  const pop2 = spring({ frame: frame - 6, fps, config: { damping: 12, stiffness: 160 } });
  const pop3 = spring({ frame: frame - 12, fps, config: { damping: 12, stiffness: 160 } });
  const stripe = interpolate(frame, [0, 54], [0, 40]);
  const text: React.CSSProperties = { fontFamily: FONT, fontWeight: 900, color: "#fff", WebkitTextStroke: "10px #000", paintOrder: "stroke fill", textAlign: "center" };
  return (
    <AbsoluteFill style={{ background: "#1E8C8C", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(-35deg, rgba(255,255,255,0.07) 0 60px, rgba(0,0,0,0) 60px 120px)`,
          backgroundPosition: `${stripe}px 0`,
        }}
      />
      <div style={{ position: "absolute", left: "-10%", right: "-10%", top: "58%", height: "44%", background: "#7A1F2B", transform: "rotate(-8deg)" }} />
      <div style={{ position: "absolute", left: "5%", right: "14%", top: "24%", display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <div style={{ ...text, fontSize: 70, color: "#FFD21F", transform: `scale(${pop2})` }}>{title ?? `EP. ${episode}`}</div>
        <div style={{ ...text, fontSize: 158, lineHeight: 0.95, transform: `scale(${pop}) rotate(-3deg)` }}>
          ROAD<br />TO D1
        </div>
        <div
          style={{
            ...text, fontSize: 52, WebkitTextStroke: "7px #000", marginTop: 70, transform: `scale(${pop3})`,
            background: "#000", padding: "18px 34px", borderRadius: 18,
          }}
        >
          <span style={{ color: "#FFD21F" }}>Follow</span> {cta ?? `for Ep. ${episode + 1}`}
        </div>
      </div>
      {safeZoneDebug && <SafeZoneOverlay />}
    </AbsoluteFill>
  );
};
