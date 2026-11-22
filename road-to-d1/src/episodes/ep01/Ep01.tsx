import React from "react";
import { Episode } from "../Episode";
import { SHOTS } from "./shots";
import { MOUTH } from "./mouth";
import timeline from "./timeline.json";
import captions from "./captions.json";
import script from "./script.json";
import { CaptionWord } from "../../components/Captions";

const HIGHLIGHTS: Record<string, string[]> = Object.fromEntries(script.lines.map((l) => [l.id, l.highlights]));

export const EP01_DURATION = timeline.durationInFrames; // computed from the timeline, never hard-coded

export const Ep01: React.FC<{ safeZoneDebug?: boolean }> = ({ safeZoneDebug }) => (
  <Episode
    shots={SHOTS}
    mouth={MOUTH}
    captions={captions as unknown as CaptionWord[]}
    highlights={HIGHLIGHTS}
    blackStart={timeline.blackStart}
    endCardStart={timeline.endCardStart}
    episodeNumber={1}
    safeZoneDebug={safeZoneDebug}
  />
);
