import { join } from "path";
import { bundle } from "@remotion/bundler";
import { renderStill, renderMedia, selectComposition } from "@remotion/renderer";
import type { RenderFn } from "./render-pipeline";
import { flattenTracks } from "./flatten-tracks";

type ClipOperation = {
  type: "clip";
  id: string;
  startFrame: number;
  endFrame: number;
};

type WatermarkOperation = {
  type: "watermark";
  assetId: string;
  x: number;
  y: number;
  width: number;
  opacity: number;
};

type Operation = { type: string; [key: string]: unknown };
type CompositionSegment = {
  id: string;
  sourceMediaId: string;
  sourceStartFrame: number;
  sourceEndFrame: number;
  transition?: {
    type: "crossfade";
    durationFrames: number;
    easing?: string;
  };
};

const log = (msg: string, data?: Record<string, unknown>) =>
  console.log(`[render:remotion] ${msg}`, data ? JSON.stringify(data) : "");

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
  if (cachedServeUrl) {
    log("using cached serve URL");
    return cachedServeUrl;
  }
  log("bundling Remotion entry", { entryPath: VIDEO_ENTRY_PATH });
  cachedServeUrl = await bundle({ entryPoint: VIDEO_ENTRY_PATH });
  log("bundle ready", { serveUrl: cachedServeUrl });
  return cachedServeUrl;
};

/**
 * Real Remotion render function. Uses VideoComposition for video/clip renders
 * and WatermarkComposition for still image watermarks.
 */
export const remotionRenderFn: RenderFn = async ({ edit, sourceMedia, outputPath, quality, onProgress }) => {
  const operations = flattenTracks(edit.tracks, edit.operations) as Operation[];

  log("preparing render", {
    editId: edit.id,
    type: sourceMedia.type,
    operationCount: operations.length,
    operationTypes: [...new Set(operations.map((o) => o.type))],
  });

  const port = process.env.API_PORT ?? "6970";
  const baseUrl = `http://localhost:${port}`;
  const sourceUrl = `${baseUrl}/api/media/${sourceMedia.id}/file`;

  const serveUrl = await getServeUrl();
  const chromiumOptions = { disableWebSecurity: true };
  const isImage = sourceMedia.type === "image";
  const fps = 30;
  const width = sourceMedia.width ?? 1920;
  const height = sourceMedia.height ?? 1080;
  const compositionSegments = (edit.segments ?? []) as CompositionSegment[];
  const isCompositionRender = edit.type === "composition" && compositionSegments.length > 0;

  // Extract clip operation if present
  const clipOp = operations.find((op): op is ClipOperation => op.type === "clip");
  // Non-clip operations (for overlays)
  const overlayOps = operations.filter((op) => op.type !== "clip");

  if (isImage && !clipOp) {
    // Still image render (legacy WatermarkComposition path)
    const watermarkOp = overlayOps.find((op): op is WatermarkOperation => op.type === "watermark");
    const watermarkUrl = watermarkOp
      ? `${baseUrl}/api/assets/${watermarkOp.assetId}/file`
      : undefined;

    log("rendering still image");

    const inputProps = {
      sourceUrl,
      ...(watermarkOp ? { watermark: watermarkOp, watermarkUrl } : {}),
    };

    const composition = await selectComposition({
      serveUrl,
      id: "WatermarkComposition",
      inputProps,
      chromiumOptions,
    });
    composition.durationInFrames = 1;
    composition.width = width;
    composition.height = height;

    await renderStill({
      composition,
      serveUrl,
      output: outputPath,
      inputProps,
      chromiumOptions,
    });

    const file = Bun.file(outputPath);
    log("still render complete", { size: file.size });
    return { type: "image", duration: null, size: file.size };
  }

  if (isCompositionRender) {
    const segments = compositionSegments.map((segment) => ({
      ...segment,
      sourceUrl: `${baseUrl}/api/media/${segment.sourceMediaId}/file`,
    }));
    const durationInFrames = Math.max(
      1,
      segments.reduce(
        (totalDuration, segment) => totalDuration + (segment.sourceEndFrame - segment.sourceStartFrame),
        0,
      ),
    );
    const assetUrls = overlayOps.reduce<Record<string, string>>(
      (urls, operation) =>
        operation.type === "watermark"
          ? {
              ...urls,
              [(operation as WatermarkOperation).assetId]:
                `${baseUrl}/api/assets/${(operation as WatermarkOperation).assetId}/file`,
            }
          : urls,
      {},
    );
    const inputProps = {
      segments,
      operations: overlayOps,
      assetUrls,
    };
    const composition = await selectComposition({
      serveUrl,
      id: "SequenceComposition",
      inputProps,
      chromiumOptions,
    });
    composition.durationInFrames = durationInFrames;
    composition.fps = fps;
    composition.width = width;
    composition.height = height;

    await renderMedia({
      composition,
      serveUrl,
      outputLocation: outputPath,
      codec: "h264",
      crf: quality === "fast" ? 28 : 18,
      inputProps,
      chromiumOptions,
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
    const duration = composition.durationInFrames / composition.fps;
    return {
      type: "video",
      duration,
      size: file.size,
    };
  }

  // Video render (with or without clip)
  const durationInFrames = clipOp
    ? clipOp.endFrame - clipOp.startFrame
    : Math.max(1, Math.round((sourceMedia.duration ?? 1) * fps));

  const startFrom = clipOp ? clipOp.startFrame : 0;

  // Resolve asset URLs for watermark operations
  const assetUrls = overlayOps.reduce<Record<string, string>>(
    (urls, operation) =>
      operation.type === "watermark"
        ? {
            ...urls,
            [(operation as WatermarkOperation).assetId]:
              `${baseUrl}/api/assets/${(operation as WatermarkOperation).assetId}/file`,
          }
        : urls,
    {},
  );

  const inputProps = {
    sourceUrl,
    startFrom,
    operations: overlayOps,
    assetUrls,
  };

  log("resolved paths", {
    sourceUrl,
    outputPath,
    startFrom,
    clipDuration: clipOp ? `${durationInFrames} frames` : "full",
    overlayCount: overlayOps.length,
  });

  log("selecting composition for video");
  const composition = await selectComposition({
    serveUrl,
    id: "VideoComposition",
    inputProps,
    chromiumOptions,
  });
  composition.durationInFrames = durationInFrames;
  composition.fps = fps;
  composition.width = width;
  composition.height = height;

  log("starting video render", {
    durationInFrames: composition.durationInFrames,
    fps: composition.fps,
    width: composition.width,
    height: composition.height,
    codec: "h264",
    crf: quality === "fast" ? 28 : 18,
  });

  await renderMedia({
    composition,
    serveUrl,
    outputLocation: outputPath,
    codec: "h264",
    crf: quality === "fast" ? 28 : 18,
    inputProps,
    chromiumOptions,
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
  const duration = composition.durationInFrames / composition.fps;
  log("video render complete", { size: file.size, duration });

  return {
    type: "video",
    duration,
    size: file.size,
  };
};
