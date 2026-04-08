import React, { type ReactNode } from "react";
import { AbsoluteFill, Html5Video, Img, useCurrentFrame } from "remotion";
import { CaptionOverlay } from "@fanslib/video/compositions";
import type { CaptionOperation } from "@fanslib/video/types";
import type { CropOperation } from "../../utils/crop-operation";
import { isOutsideFrameRange } from "./helpers";

export type BlurRegionPreview = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  startFrame?: number;
  endFrame?: number;
};

export type PixelateRegionPreview = {
  x: number;
  y: number;
  width: number;
  height: number;
  pixelSize: number;
  startFrame?: number;
  endFrame?: number;
};

export type EmojiPreview = {
  emoji: string;
  x: number;
  y: number;
  size: number;
  startFrame?: number;
  endFrame?: number;
};

export type PreviewCompositionInputProps = {
  sourceUrl: string;
  watermark?: { x: number; y: number; width: number; opacity: number; startFrame?: number; endFrame?: number };
  watermarkUrl?: string;
  blurRegions?: BlurRegionPreview[];
  pixelateRegions?: PixelateRegionPreview[];
  emojis?: EmojiPreview[];
  crops?: CropOperation[];
  captions?: CaptionOperation[];
};

/** Same geometry as @fanslib/video CropFrame (normalized rect in composition space). */
export const CropRectPreviewFrame = ({ crop, children }: { crop: CropOperation; children: ReactNode }) => {
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

export const wrapWithCropChain = (crops: CropOperation[], inner: ReactNode): ReactNode =>
  crops.reduce(
    (acc, crop, i) => (
      <CropRectPreviewFrame key={`crop-${i}`} crop={crop}>
        {acc}
      </CropRectPreviewFrame>
    ),
    inner,
  );

const PreviewOverlays = ({
  watermark,
  watermarkUrl,
  blurRegions = [],
  pixelateRegions = [],
  emojis = [],
  captions = [],
  compositionWidth,
}: PreviewCompositionInputProps & { compositionWidth: number }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {blurRegions.map((blur, i) =>
        isOutsideFrameRange(frame, blur.startFrame, blur.endFrame) ? null : (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${blur.x * 100}%`,
              top: `${blur.y * 100}%`,
              width: `${blur.width * 100}%`,
              height: `${blur.height * 100}%`,
              backdropFilter: `blur(${blur.radius}px)`,
              WebkitBackdropFilter: `blur(${blur.radius}px)`,
            }}
          />
        ),
      )}
      {pixelateRegions.map((px, i) => {
        if (isOutsideFrameRange(frame, px.startFrame, px.endFrame)) return null;
        const ps = Math.max(2, px.pixelSize);
        const half = ps / 2;
        const filterId = `px-preview-${i}`;
        return (
          <React.Fragment key={`px-${i}`}>
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
                  <feFlood x={half} y={half} width="1" height="1" />
                  <feComposite width={ps} height={ps} />
                  <feTile result="grid" />
                  <feComposite in="SourceGraphic" in2="grid" operator="in" />
                  <feMorphology operator="dilate" radius={half} />
                </filter>
              </defs>
            </svg>
            <div
              style={{
                position: "absolute",
                left: `${px.x * 100}%`,
                top: `${px.y * 100}%`,
                width: `${px.width * 100}%`,
                height: `${px.height * 100}%`,
                backdropFilter: `url(#${filterId})`,
                WebkitBackdropFilter: `url(#${filterId})`,
                overflow: "hidden",
              }}
            />
          </React.Fragment>
        );
      })}
      {watermark && watermarkUrl && !isOutsideFrameRange(frame, watermark.startFrame, watermark.endFrame) && (
        <Img
          src={watermarkUrl}
          style={{
            position: "absolute",
            left: `${watermark.x * 100}%`,
            top: `${watermark.y * 100}%`,
            width: `${watermark.width * 100}%`,
            opacity: watermark.opacity,
          }}
        />
      )}
      {emojis.map((em, i) =>
        isOutsideFrameRange(frame, em.startFrame, em.endFrame) ? null : (
          <div
            key={`em-${i}`}
            style={{
              position: "absolute",
              left: `${em.x * 100}%`,
              top: `${em.y * 100}%`,
              fontSize: `${em.size * 1920}px`,
              lineHeight: 1,
              transform: "translate(-50%, -50%)",
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            {em.emoji}
          </div>
        ),
      )}
      {captions.map((cap, i) => (
        <CaptionOverlay key={`cap-${i}`} caption={cap} compositionWidth={compositionWidth} />
      ))}
    </>
  );
};

export const PreviewCompositionImage = (props: PreviewCompositionInputProps & { compositionWidth: number }) => {
  const crops = props.crops ?? [];
  const inner = (
    <>
      <Img src={props.sourceUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      <PreviewOverlays {...props} />
    </>
  );
  return (
    <AbsoluteFill>{crops.length === 0 ? inner : wrapWithCropChain(crops, inner)}</AbsoluteFill>
  );
};

export const PreviewCompositionVideo = (props: PreviewCompositionInputProps & { compositionWidth: number }) => {
  const crops = props.crops ?? [];
  const inner = (
    <>
      <Html5Video
        src={props.sourceUrl}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
      <PreviewOverlays {...props} />
    </>
  );
  return (
    <AbsoluteFill>{crops.length === 0 ? inner : wrapWithCropChain(crops, inner)}</AbsoluteFill>
  );
};
