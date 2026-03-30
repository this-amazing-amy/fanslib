import React from "react";
import { useCurrentFrame } from "remotion";
import type { PixelateOperation } from "../types";
import { interpolateKeyframes } from "../keyframes";

type PixelateRegionProps = {
  pixelate: PixelateOperation;
};

/**
 * Renders a pixelation effect within a rectangular region using an SVG filter.
 * The pixelSize determines how large each "pixel block" appears.
 */
export const PixelateRegion: React.FC<PixelateRegionProps> = ({ pixelate }) => {
  const frame = useCurrentFrame();
  const properties = ["x", "y", "width", "height"];

  const values =
    pixelate.keyframes.length > 0
      ? interpolateKeyframes(pixelate.keyframes, frame, properties)
      : { x: pixelate.x, y: pixelate.y, width: pixelate.width, height: pixelate.height };

  const filterId = `pixelate-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <>
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id={filterId}>
            <feFlood x="0" y="0" width="1" height="1" />
            <feComposite in2="SourceGraphic" operator="in" />
            <feMorphology operator="dilate" radius={pixelate.pixelSize} />
            <feComposite in="SourceGraphic" operator="over" />
          </filter>
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          left: `${(values.x ?? 0) * 100}%`,
          top: `${(values.y ?? 0) * 100}%`,
          width: `${(values.width ?? 0) * 100}%`,
          height: `${(values.height ?? 0) * 100}%`,
          backdropFilter: `url(#${filterId})`,
          WebkitBackdropFilter: `url(#${filterId})`,
          imageRendering: "pixelated",
          overflow: "hidden",
          background: "inherit",
        }}
      />
    </>
  );
};
