import React from "react";
import type { CropOperation, AspectRatioPreset } from "../types";

type CropFrameProps = {
  crop: CropOperation;
  compositionWidth: number;
  compositionHeight: number;
  children: React.ReactNode;
};

const ASPECT_RATIOS: Record<AspectRatioPreset, number> = {
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "1:1": 1,
  "4:5": 4 / 5,
};

/**
 * Clips the source content to the specified aspect ratio centered at the given position.
 * The crop window defines the output viewport.
 */
export const CropFrame: React.FC<CropFrameProps> = ({
  crop,
  compositionWidth,
  compositionHeight,
  children,
}) => {
  const sourceAspect = compositionWidth / compositionHeight;
  const targetAspect = ASPECT_RATIOS[crop.aspectRatio];

  // Calculate crop window dimensions (in relative coordinates)
  const cropWidth = targetAspect > sourceAspect ? 1 : targetAspect / sourceAspect;
  const cropHeight = targetAspect > sourceAspect ? sourceAspect / targetAspect : 1;

  // Calculate offset based on center position
  const offsetX = (crop.centerX - 0.5) * (1 - cropWidth);
  const offsetY = (crop.centerY - 0.5) * (1 - cropHeight);

  const left = ((1 - cropWidth) / 2 + offsetX) * 100;
  const top = ((1 - cropHeight) / 2 + offsetY) * 100;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: `${-left}%`,
          top: `${-top}%`,
          width: `${100 / cropWidth}%`,
          height: `${100 / cropHeight}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
