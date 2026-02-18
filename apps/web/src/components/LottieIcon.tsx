import { lazy, Suspense } from "react";

const Lottie = lazy(() => import("react-lottie-player"));

interface IconProps {
  isPlaying: boolean;
  index: number;
  json: object;
}

const Icon: React.FC<IconProps> = ({ isPlaying, index, json }) => {
  return (
    <Suspense fallback={<div style={{ width: 18, height: 18 }} />}>
      <Lottie
        key={index}
        animationData={json}
        play={isPlaying}
        loop={false}
        style={{ width: 18, height: 18, fill: "white" }}
        rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
      />
    </Suspense>
  );
};

export default Icon;
