import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import type { PixelateOperation } from "../types";
import { interpolateKeyframes } from "../keyframes";

type PixelateRegionProps = {
  pixelate: PixelateOperation;
};

/**
 * Renders a pixelation effect within a rectangular region using an SVG filter.
 * Uses feFlood + feTile + feMorphology to sample one pixel per block and
 * dilate it to fill the block, producing a true mosaic / pixel-block look.
 */
export const PixelateRegion: React.FC<PixelateRegionProps> = ({ pixelate }) => {
  const frame = useCurrentFrame();
  const id = useId();
  const properties = ["x", "y", "width", "height"];

  const values =
    pixelate.keyframes.length > 0
      ? interpolateKeyframes(pixelate.keyframes, frame, properties)
      : { x: pixelate.x, y: pixelate.y, width: pixelate.width, height: pixelate.height };

  const filterId = `pixelate-${id.replace(/:/g, "")}`;
  const ps = Math.max(2, pixelate.pixelSize);
  const half = ps / 2;

  return (
    <>
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter
            id={filterId}
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            primitiveUnits="userSpaceOnUse"
          >
            {/* Sample a single pixel from the center of each block */}
            <feFlood x={half} y={half} width="1" height="1" />
            <feComposite width={ps} height={ps} />
            {/* Tile the sampling grid across the entire region */}
            <feTile result="grid" />
            {/* Keep only the source pixels at each sample point */}
            <feComposite in="SourceGraphic" in2="grid" operator="in" />
            {/* Expand each sampled pixel to fill its block */}
            <feMorphology operator="dilate" radius={half} />
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
          overflow: "hidden",
        }}
      />
    </>
  );
};
