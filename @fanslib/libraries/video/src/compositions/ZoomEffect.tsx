import React from "react";
import { useCurrentFrame } from "remotion";
import type { ZoomOperation } from "../types";
import { interpolateKeyframes } from "../keyframes";

type ZoomEffectProps = {
  zoom: ZoomOperation;
  children: React.ReactNode;
};

/**
 * Wraps child content with a zoom/pan transform.
 * Uses keyframe interpolation for animated camera movements.
 */
export const ZoomEffect: React.FC<ZoomEffectProps> = ({ zoom, children }) => {
  const frame = useCurrentFrame();
  const properties = ["scale", "centerX", "centerY"];

  const values =
    zoom.keyframes.length > 0
      ? interpolateKeyframes(zoom.keyframes, frame, properties)
      : { scale: zoom.scale, centerX: zoom.centerX, centerY: zoom.centerY };

  const scale = values.scale ?? zoom.scale;
  // Translate so the center point stays fixed
  const centerX = values.centerX ?? zoom.centerX;
  const centerY = values.centerY ?? zoom.centerY;
  const translateX = -(centerX - 0.5) * 100 * scale;
  const translateY = -(centerY - 0.5) * 100 * scale;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
          transformOrigin: `${centerX * 100}% ${centerY * 100}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
