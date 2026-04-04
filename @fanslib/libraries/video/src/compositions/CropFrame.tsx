import React from "react";
import type { CropOperation } from "../types";

type CropFrameProps = {
  crop: CropOperation;
  children: React.ReactNode;
};

/**
 * Clips children so the sub-rectangle (x,y,width,height) in normalized composition space
 * fills the viewport (same math as the web editor crop preview).
 */
export const CropFrame: React.FC<CropFrameProps> = ({ crop, children }) => {
  const { x, y, width: w, height: h } = crop;

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
          left: `${-(x / w) * 100}%`,
          top: `${-(y / h) * 100}%`,
          width: `${100 / w}%`,
          height: `${100 / h}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
