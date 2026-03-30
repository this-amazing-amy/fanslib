import React from "react";
import { useCurrentFrame } from "remotion";
import type { BlurOperation } from "../types";
import { interpolateKeyframes } from "../keyframes";

type BlurRegionProps = {
  blur: BlurOperation;
};

export const BlurRegion: React.FC<BlurRegionProps> = ({ blur }) => {
  const frame = useCurrentFrame();
  const properties = ["x", "y", "width", "height"];

  // If keyframes exist, interpolate; otherwise use static values
  const values =
    blur.keyframes.length > 0
      ? interpolateKeyframes(blur.keyframes, frame, properties)
      : { x: blur.x, y: blur.y, width: blur.width, height: blur.height };

  return (
    <div
      style={{
        position: "absolute",
        left: `${values.x * 100}%`,
        top: `${values.y * 100}%`,
        width: `${values.width * 100}%`,
        height: `${values.height * 100}%`,
        backdropFilter: `blur(${blur.radius}px)`,
        WebkitBackdropFilter: `blur(${blur.radius}px)`,
      }}
    />
  );
};
