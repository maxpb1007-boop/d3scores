import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { createTikTokStyleCaptions, Caption } from "@remotion/captions";
import { FONT } from "../lib/fonts";

export type CaptionWord = Caption & { line: string; sentence: number };

/** TikTok safe zone at 1080x1920: keep out of top 10 %, bottom 22 %, right 14 %. */
export const SAFE = { top: 0.1, bottom: 0.22, right: 0.14, left: 0.05 };

const STOP = new Set(["a", "an", "the", "of", "to", "in", "is", "it", "my", "i'm", "i", "he", "his", "was", "for", "at", "on", "and", "with", "us", "me", "one", "by", "if", "do"]);
const norm = (w: string) => w.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9'-]+$/g, "").replace(/^\.+/, "");

export type Page = { text: string; startMs: number; endMs: number; tokens: { text: string; fromMs: number; toMs: number }[]; key: number; line: string };

/**
 * Pages are built per sentence with @remotion/captions' createTikTokStyleCaptions, then split so a
 * page is never more than 4 words (3 when a word is long) and always breaks after a comma.
 * Each page gets exactly one highlighted word: a listed highlight for that line if present,
 * otherwise its longest non-filler word.
 */
export const buildPages = (words: CaptionWord[], highlights: Record<string, string[]>): (Page & { hi: number })[] => {
  const pages: (Page & { hi: number })[] = [];
  const groups = new Map<string, CaptionWord[]>();
  for (const w of words) {
    const k = `${w.line}|${w.sentence}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(w);
  }
  for (const [k, ws] of groups) {
    const line = k.split("|")[0];
    // Whole sentence as one TikTok-style page, then split it ourselves: break at punctuation, then
    // share each segment evenly into chunks of <= 4 words (<= 3 if wide) so no word is left orphaned.
    const { pages: tp } = createTikTokStyleCaptions({ captions: ws, combineTokensWithinMilliseconds: 60000 });
    const toks = tp.flatMap((p) => p.tokens);
    const segs: (typeof toks)[] = [[]];
    toks.forEach((t, i) => {
      segs[segs.length - 1].push(t);
      if (/[,.!?]$/.test(t.text.trim()) && i < toks.length - 1) segs.push([]);
    });
    for (const seg of segs) {
      if (!seg.length) continue;
      const chars = seg.reduce((n, t) => n + t.text.trim().length + 1, 0);
      const perChunk = chars / seg.length > 6 ? 3 : 4;
      const n = Math.ceil(seg.length / perChunk);
      for (let c = 0; c < n; c++) {
        const chunk = seg.slice(Math.round((c * seg.length) / n), Math.round(((c + 1) * seg.length) / n));
        const ct = chunk.map((t, i) => ({ ...t, text: i === 0 ? t.text.trimStart() : t.text }));
        const list = (highlights[line] ?? []).map((h) => h.toLowerCase());
        let hi = ct.findIndex((t) => list.includes(norm(t.text)));
        if (hi < 0) {
          let best = -1;
          ct.forEach((t, i) => {
            const w = norm(t.text);
            if (STOP.has(w)) return;
            if (best < 0 || w.length > norm(ct[best].text).length) best = i;
          });
          hi = best < 0 ? 0 : best;
        }
        pages.push({ text: ct.map((t) => t.text).join(""), startMs: ct[0].fromMs, endMs: ct[ct.length - 1].toMs, tokens: ct, key: pages.length, line, hi });
      }
    }
  }
  pages.sort((a, b) => a.startMs - b.startMs);
  return pages;
};

export const Captions: React.FC<{ words: CaptionWord[]; highlights: Record<string, string[]>; hideFrom: number; debug?: boolean }> = ({
  words, highlights, hideFrom, debug,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const pages = useMemo(() => buildPages(words, highlights), [words, highlights]);
  const ms = (frame / fps) * 1000;
  // a page stays up until the next page starts, or 0.45 s after its last word
  let page: (typeof pages)[number] | undefined;
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const until = Math.min(p.endMs + 450, pages[i + 1]?.startMs ?? Infinity);
    if (ms >= p.startMs - 40 && ms < until) page = p;
  }
  const left = SAFE.left * width;
  const right = SAFE.right * width;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {debug && <SafeZoneOverlay />}
      {page && frame < hideFrom && (
        <CaptionPage page={page} frame={frame} fps={fps} left={left} right={right} top={height * 0.585} />
      )}
    </AbsoluteFill>
  );
};

const CaptionPage: React.FC<{ page: Page & { hi: number }; frame: number; fps: number; left: number; right: number; top: number }> = ({
  page, frame, fps, left, right, top,
}) => {
  const f0 = Math.round((page.startMs / 1000) * fps);
  const local = frame - f0;
  const scale = interpolate(local, [0, 2, 4], [1.0, 1.08, 1.0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const long = page.text.length > 18;
  const size = long ? 84 : 100;
  return (
    <div
      style={{
        position: "absolute",
        left,
        right,
        top,
        transform: `translateY(-50%) scale(${scale})`,
        textAlign: "center",
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.05,
        textTransform: "uppercase",
        color: "#FFFFFF",
        WebkitTextStroke: "11px #000",
        paintOrder: "stroke fill",
        letterSpacing: 1,
        textShadow: "0 6px 0 rgba(0,0,0,0.35)",
      }}
    >
      {page.tokens.map((t, i) => (
        <span key={i} style={{ color: i === page.hi ? "#FFD21F" : "#FFFFFF" }}>
          {t.text}
        </span>
      ))}
    </div>
  );
};

/** Dev-only: shades the TikTok UI zones. Rendered only in the SafeZoneDebug composition. */
export const SafeZoneOverlay: React.FC = () => (
  <AbsoluteFill>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: `${SAFE.top * 100}%`, background: "rgba(255,0,0,0.35)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${SAFE.bottom * 100}%`, background: "rgba(255,0,0,0.35)" }} />
    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${SAFE.right * 100}%`, background: "rgba(255,120,0,0.35)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: "55%", height: "7%", border: "4px dashed #0f0" }} />
  </AbsoluteFill>
);
