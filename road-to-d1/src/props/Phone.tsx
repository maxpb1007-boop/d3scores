import React from "react";
import * as THREE from "three";
import { rbox, plane } from "../lib/geometry";
import { mat } from "../lib/materials";
import { useCanvasTexture, roundRect } from "../lib/canvasTex";
import { FONT } from "../lib/fonts";

/*
 * Generic phone. Screens are deliberately generic: no real app UI, logos or brand colours.
 *   lock     : clock + one notification card ("viewed your story")
 *   post     : a generic video post with play button, slow-mo tag and "4 likes"
 *   dm       : a generic incoming-message card from Coach Briggs
 *   feed     : abstract scrolling cards (used in the refresh montage)
 *   glow     : plain bright screen (light source at night)
 */
export type Screen = "lock" | "post" | "dm" | "feed" | "glow" | "off" | "rank" | "search";

const W = 540, H = 1080;
const drawScreen = (c: CanvasRenderingContext2D, s: Screen, scroll: number) => {
  const bg = c.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1D2B4A");
  bg.addColorStop(1, "#0F1528");
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);
  c.textAlign = "center";
  c.fillStyle = "#FFFFFF";
  if (s === "glow") {
    c.fillStyle = "#DDEBFF";
    c.fillRect(0, 0, W, H);
    return;
  }
  if (s === "off") {
    c.fillStyle = "#0A0A0E";
    c.fillRect(0, 0, W, H);
    return;
  }
  if (s === "lock") {
    c.font = `800 150px ${FONT}`;
    c.fillText("2:13", W / 2, 300);
    c.font = `600 38px ${FONT}`;
    c.fillStyle = "#B8C6E8";
    c.fillText("Tuesday", W / 2, 360);
    c.fillStyle = "rgba(255,255,255,0.94)";
    roundRect(c, 30, 470, W - 60, 230, 36);
    c.fill();
    c.fillStyle = "#3D7BF2";
    roundRect(c, 60, 505, 80, 80, 20);
    c.fill();
    c.fillStyle = "#FFFFFF";
    c.font = `900 50px ${FONT}`;
    c.fillText("!", 100, 563);
    c.textAlign = "left";
    c.fillStyle = "#1A1A22";
    c.font = `800 38px ${FONT}`;
    c.fillText("coach_gradasst", 160, 540);
    c.font = `600 34px ${FONT}`;
    c.fillStyle = "#3A3A48";
    c.fillText("viewed your story", 160, 590);
    c.fillStyle = "#8A8A99";
    c.font = `600 28px ${FONT}`;
    c.fillText("now", 160, 650);
    return;
  }
  if (s === "post") {
    c.fillStyle = "#2B6B3A";
    c.fillRect(0, 120, W, 600);
    // a tiny field + player silhouette
    c.fillStyle = "#3C8A4C";
    for (let i = 0; i < 6; i++) c.fillRect(0, 120 + i * 100, W, 50);
    c.fillStyle = "#1E8C8C";
    c.fillRect(250, 330, 50, 120);
    c.fillStyle = "#9A6440";
    c.fillRect(255, 280, 40, 45);
    c.fillStyle = "rgba(0,0,0,0.45)";
    c.beginPath();
    c.arc(W / 2, 420, 80, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#FFFFFF";
    c.beginPath();
    c.moveTo(W / 2 - 25, 380);
    c.lineTo(W / 2 + 40, 420);
    c.lineTo(W / 2 - 25, 460);
    c.fill();
    c.fillStyle = "#FFD21F";
    roundRect(c, 24, 140, 210, 56, 14);
    c.fill();
    c.fillStyle = "#111";
    c.font = `900 32px ${FONT}`;
    c.textAlign = "center";
    c.fillText("SLOW-MO x11", 129, 180);
    c.textAlign = "left";
    c.fillStyle = "#FFFFFF";
    c.font = `800 40px ${FONT}`;
    c.fillText("MY HIGHLIGHTS", 36, 790);
    c.font = `600 30px ${FONT}`;
    c.fillStyle = "#AAB6D6";
    c.fillText("posted 2:04 AM", 36, 840);
    c.fillStyle = "#FF5A6E";
    c.beginPath();
    const hx = 60, hy = 930;
    c.moveTo(hx, hy + 12);
    c.bezierCurveTo(hx, hy - 20, hx - 40, hy - 20, hx - 40, hy + 5);
    c.bezierCurveTo(hx - 40, hy + 30, hx, hy + 45, hx, hy + 60);
    c.bezierCurveTo(hx, hy + 45, hx + 40, hy + 30, hx + 40, hy + 5);
    c.bezierCurveTo(hx + 40, hy - 20, hx, hy - 20, hx, hy + 12);
    c.fill();
    c.fillStyle = "#FFFFFF";
    c.font = `900 56px ${FONT}`;
    c.fillText("4 likes", 120, 975);
    return;
  }
  if (s === "dm") {
    c.textAlign = "center";
    c.font = `700 34px ${FONT}`;
    c.fillStyle = "#B8C6E8";
    c.fillText("Messages", W / 2, 120);
    c.fillStyle = "rgba(255,255,255,0.96)";
    roundRect(c, 26, 300, W - 52, 420, 40);
    c.fill();
    c.fillStyle = "#22305A";
    c.beginPath();
    c.arc(W / 2, 400, 62, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#FFFFFF";
    c.font = `900 56px ${FONT}`;
    c.fillText("CB", W / 2, 420);
    c.fillStyle = "#6A6A7A";
    c.font = `700 32px ${FONT}`;
    c.fillText("New message from", W / 2, 520);
    c.fillStyle = "#111118";
    c.font = `900 54px ${FONT}`;
    c.fillText("Coach Briggs", W / 2, 585);
    c.fillStyle = "#3A3A48";
    c.font = `700 28px ${FONT}`;
    c.fillText("Special Teams Coordinator", W / 2, 640);
    c.fillStyle = "#3D7BF2";
    roundRect(c, 140, 760, W - 280, 90, 45);
    c.fill();
    c.fillStyle = "#FFFFFF";
    c.font = `800 38px ${FONT}`;
    c.fillText("Open", W / 2, 818);
    return;
  }
  if (s === "rank") {
    // generic recruiting rankings list (fictional names, no real service)
    c.textAlign = "left";
    c.fillStyle = "#FFD21F";
    c.font = `900 46px ${FONT}`;
    c.fillText("TOP RECRUITS", 34, 110);
    const rows: [string, string, number][] = [["1", "J. Hollis", 5], ["2", "M. Okafor", 5], ["3", "D. Reyes", 5], ["4", "T. Banks", 5]];
    rows.forEach(([r, name, n], i) => {
      const y = 170 + i * 120;
      c.fillStyle = "rgba(255,255,255,0.1)";
      roundRect(c, 24, y, W - 48, 100, 20);
      c.fill();
      c.fillStyle = "#FFFFFF";
      c.font = `800 34px ${FONT}`;
      c.fillText(`${r}. ${name}`, 46, y + 60);
      c.fillStyle = "#FFD21F";
      c.font = `900 30px ${FONT}`;
      c.fillText("★".repeat(n), 330, y + 62);
    });
    c.fillStyle = "#AAB6D6";
    c.font = `900 60px ${FONT}`;
    c.textAlign = "center";
    c.fillText("⋮", W / 2, 720);
    c.fillStyle = "#1E8C8C";
    roundRect(c, 24, 790, W - 48, 130, 22);
    c.fill();
    c.textAlign = "left";
    c.fillStyle = "#FFFFFF";
    c.font = `900 38px ${FONT}`;
    c.fillText("4,812. Tre", 46, 870);
    c.fillStyle = "#FFD21F";
    c.font = `900 32px ${FONT}`;
    c.fillText("★★★", 340, 870);
    return;
  }
  if (s === "search") {
    c.fillStyle = "#FFFFFF";
    roundRect(c, 24, 90, W - 48, 90, 45);
    c.fill();
    c.fillStyle = "#222";
    c.textAlign = "left";
    c.font = `700 32px ${FONT}`;
    c.fillText("how to get 4th star", 60, 148);
    const res: [string, string][] = [["MEWING", "#E74C3C"], ["SKINCARE", "#F1C40F"], ["HIGHLIGHT TAPE", "#3D7BF2"], ["4TH STAR FAST", "#9B59B6"]];
    res.forEach(([t, col], i) => {
      const y = 230 + i * 190;
      c.fillStyle = col;
      roundRect(c, 24, y, W - 48, 160, 20);
      c.fill();
      c.fillStyle = "#FFFFFF";
      c.textAlign = "center";
      c.font = `900 44px ${FONT}`;
      c.fillText(t, W / 2, y + 98);
    });
    return;
  }
  // feed: abstract cards that scroll
  for (let i = -1; i < 6; i++) {
    const y = 60 + i * 230 - (scroll % 230);
    c.fillStyle = "rgba(255,255,255,0.12)";
    roundRect(c, 30, y, W - 60, 200, 24);
    c.fill();
    c.fillStyle = ["#1E8C8C", "#E2B33C", "#D96C8A", "#3D7BF2"][((i % 4) + 4) % 4];
    roundRect(c, 50, y + 20, 160, 160, 18);
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.6)";
    c.fillRect(230, y + 40, 220, 26);
    c.fillRect(230, y + 90, 160, 22);
  }
};

export const Phone: React.FC<{ screen?: Screen; scroll?: number; light?: number; position?: [number, number, number]; rotation?: [number, number, number]; scale?: number }> = ({
  screen = "glow", scroll = 0, light = 0, position, rotation, scale = 1,
}) => {
  const step = screen === "feed" ? Math.floor(scroll / 8) * 8 : 0; // re-draw feed every few px only
  const tex = useCanvasTexture(`phone-${screen}-${step}`, W, H, (c) => drawScreen(c, screen, step));
  const screenMat = React.useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [tex]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={rbox(0.085, 0.17, 0.012, 0.006, 1)} material={mat("#15161B")} castShadow />
      <mesh geometry={plane(0.077, 0.155)} material={screenMat} position={[0, 0, 0.0065]} />
      {light > 0 && <pointLight position={[0, 0, 0.25]} intensity={light} distance={2.5} color="#BBD4FF" />}
    </group>
  );
};
