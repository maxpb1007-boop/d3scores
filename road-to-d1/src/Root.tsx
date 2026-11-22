import { Composition } from "remotion";
import { GlTest } from "./dev/GlTest";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="GlTest" component={GlTest} durationInFrames={30} fps={30} width={1080} height={1920} />
  </>
);
