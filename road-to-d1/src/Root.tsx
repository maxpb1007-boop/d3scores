import { Composition } from "remotion";
import { GlTest } from "./dev/GlTest";
import { SetPreview } from "./dev/SetPreview";
import { Ep01, EP01_DURATION } from "./episodes/ep01/Ep01";
import { Ep02, EP02_DURATION } from "./episodes/ep02/Ep02";
import { Dalea, Dalea_DURATION } from "./episodes/dalea/Dalea";
import { Daleb, Daleb_DURATION } from "./episodes/daleb/Daleb";
import { Testa, Testa_DURATION } from "./episodes/testa/Testa";
import { Testb, Testb_DURATION } from "./episodes/testb/Testb";
import { Turnaround, ExpressionSheet, PoseSheet } from "./dev/Sheets";

export const RemotionRoot: React.FC = () => (
  <>
    {/* FINAL episode compositions */}
    <Composition id="Ep01" component={Ep01} durationInFrames={EP01_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="Ep02" component={Ep02} durationInFrames={EP02_DURATION} fps={30} width={1080} height={1920} />
    {/* short concept test clips */}
    <Composition id="Dalea" component={Dalea} durationInFrames={Dalea_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="Daleb" component={Daleb} durationInFrames={Daleb_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="Testa" component={Testa} durationInFrames={Testa_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="Testb" component={Testb} durationInFrames={Testb_DURATION} fps={30} width={1080} height={1920} />
    {/* DEV ONLY: same episode with the TikTok safe-zone overlay. Never render this for posting. */}
    <Composition id="SafeZoneDebug" component={Ep01} defaultProps={{ safeZoneDebug: true }} durationInFrames={EP01_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="GlTest" component={GlTest} durationInFrames={30} fps={30} width={1080} height={1920} />
    <Composition id="Turnaround" component={Turnaround} durationInFrames={30} fps={30} width={1920} height={1080} />
    <Composition id="ExpressionSheet" component={ExpressionSheet} durationInFrames={30} fps={30} width={1080} height={1920} />
    <Composition id="PoseSheet" component={PoseSheet} durationInFrames={60} fps={30} width={1080} height={1920} />
    {(["Hallway", "Classroom", "Cafeteria", "Bedroom", "Bathroom", "Field"] as const).map((k) => (
      <Composition key={k} id={`Set-${k}`} component={SetPreview} defaultProps={{ set: k }} durationInFrames={30} fps={30} width={1080} height={1920} />
    ))}
    <Composition id="Set-Bleachers" component={SetPreview} defaultProps={{ set: "Field" as const, bleachers: true }} durationInFrames={30} fps={30} width={1080} height={1920} />
  </>
);
