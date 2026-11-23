import type { MouthTrack } from "./ep01/mouth";

/** Mouth openness for a speaker at a global frame (0 when that speaker isn't talking). */
export const mouthAt = (tracks: MouthTrack[], speaker: string, frame: number) => {
  for (const m of tracks) {
    if (m.speaker !== speaker) continue;
    const i = frame - m.startFrame;
    if (i >= 0 && i < m.values.length) return m.values[i];
  }
  return 0;
};
