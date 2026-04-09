import React from "react";
import { OffthreadVideo } from "remotion";
import type { Operation } from "../types";
import { VideoLayerWithOverlays } from "./VideoLayerWithOverlays";

export type VideoCompositionProps = {
  sourceUrl: string;
  /** Frame offset into the source video (for clip exports) */
  startFrom?: number;
  operations?: Operation[];
  /** Watermark asset URLs keyed by assetId */
  assetUrls?: Record<string, string>;
};

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  sourceUrl,
  startFrom = 0,
  operations = [],
  assetUrls = {},
}) => {
  return (
    <VideoLayerWithOverlays operations={operations} assetUrls={assetUrls}>
      <OffthreadVideo
        src={sourceUrl}
        startFrom={startFrom}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </VideoLayerWithOverlays>
  );
};
