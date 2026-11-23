import React from "react";
import { Episode } from "../Episode";
import { SHOTS } from "./shots";
import { MOUTH } from "./mouth";
import timeline from "./timeline.json";
import captions from "./captions.json";
import script from "./script.json";
import { CaptionWord } from "../../components/Captions";

const HIGHLIGHTS: Record<string, string[]> = Object.fromEntries(script.lines.map((l) => [l.id, l.highlights]));
export const Testa_DURATION = timeline.durationInFrames;

/** Short test clip (not a numbered episode): end card says "Road to D1 / Follow for more". */
export const Testa: React.FC<{ safeZoneDebug?: boolean }> = ({ safeZoneDebug }) => (
  <Episode
    shots={SHOTS}
    mouth={MOUTH}
    captions={captions as unknown as CaptionWord[]}
    highlights={HIGHLIGHTS}
    blackStart={timeline.blackStart}
    endCardStart={timeline.endCardStart}
    episodeNumber={0}
    endTitle="NEW SERIES"
    endCta="for more"
    safeZoneDebug={safeZoneDebug}
  />
);
