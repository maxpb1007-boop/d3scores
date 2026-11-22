import { Composition } from "remotion";
import { GlTest } from "./dev/GlTest";
import { Turnaround, ExpressionSheet, PoseSheet } from "./dev/Sheets";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="GlTest" component={GlTest} durationInFrames={30} fps={30} width={1080} height={1920} />
    <Composition id="Turnaround" component={Turnaround} durationInFrames={30} fps={30} width={1920} height={1080} />
    <Composition id="ExpressionSheet" component={ExpressionSheet} durationInFrames={30} fps={30} width={1080} height={1920} />
    <Composition id="PoseSheet" component={PoseSheet} durationInFrames={60} fps={30} width={1080} height={1920} />
  </>
);
