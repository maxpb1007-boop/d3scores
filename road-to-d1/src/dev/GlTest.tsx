import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const GlTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <div style={{ width, height, background: "#223" }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 5], fov: 40 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={1.5} />
        <mesh rotation={[0.4, frame * 0.05, 0]}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshLambertMaterial color="#e0702a" flatShading />
        </mesh>
      </ThreeCanvas>
    </div>
  );
};
