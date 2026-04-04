import { join } from "path";
import { bundle } from "@remotion/bundler";
import { renderStill, renderMedia, selectComposition } from "@remotion/renderer";
import type { RenderFn } from "./render-pipeline";
import { appdataPath } from "../../lib/env";

type WatermarkOperation = {
  type: "watermark";
  assetId: string;
  x: number;
  y: number;
  width: number;
  opacity: number;
};

type Operation = WatermarkOperation;

const VIDEO_ENTRY_PATH = join(
  import.meta.dir,
  "..",
  "..",
  "..",
  "..",
  "..",
  "libraries",
  "video",
  "src",
  "entry.ts",
);

// Cache the bundled serve URL across renders for performance
// eslint-disable-next-line functional/no-let
let cachedServeUrl: string | null = null;

const getServeUrl = async (): Promise<string> => {
  if (cachedServeUrl) return cachedServeUrl;
  cachedServeUrl = await bundle({ entryPoint: VIDEO_ENTRY_PATH });
  return cachedServeUrl;
};

/**
 * Real Remotion render function. Calls `renderStill` for images and `renderMedia` for video.
 * Uses the WatermarkComposition from @fanslib/video.
 */
export const remotionRenderFn: RenderFn = async ({ edit, sourceMedia, outputPath, onProgress }) => {
  const operations = edit.operations as Operation[];

  // Resolve asset URLs for watermark operations
  const watermarkOp = operations.find((op) => op.type === "watermark");

  // Build the source file URL (file:// for local rendering)
  const mediaBasePath = process.env.MEDIA_PATH ?? process.env.LIBRARY_PATH ?? "";
  const sourceUrl = `file://${join(mediaBasePath, sourceMedia.relativePath)}`;

  // Resolve watermark asset URL
  const watermarkUrl = watermarkOp
    ? `file://${join(appdataPath(), "assets", watermarkOp.assetId)}`
    : undefined;

  const serveUrl = await getServeUrl();

  const inputProps = {
    sourceUrl,
    ...(watermarkOp ? { watermark: watermarkOp, watermarkUrl } : {}),
  };

  const isImage = sourceMedia.type === "image";

  if (isImage) {
    const composition = await selectComposition({
      serveUrl,
      id: "WatermarkComposition",
      inputProps,
    });

    await renderStill({
      composition,
      serveUrl,
      output: outputPath,
      inputProps,
    });

    const file = Bun.file(outputPath);
    return { type: "image", duration: null, size: file.size };
  }

  // Video rendering
  const composition = await selectComposition({
    serveUrl,
    id: "WatermarkComposition",
    inputProps,
  });

  await renderMedia({
    composition,
    serveUrl,
    outputLocation: outputPath,
    codec: "h264",
    inputProps,
    onProgress: (progress: { renderedFrames: number }) => {
      if (onProgress) {
        onProgress({
          renderedFrames: progress.renderedFrames,
          totalFrames: composition.durationInFrames,
        });
      }
    },
  });

  const file = Bun.file(outputPath);
  return {
    type: "video",
    duration: composition.durationInFrames / composition.fps,
    size: file.size,
  };
};
