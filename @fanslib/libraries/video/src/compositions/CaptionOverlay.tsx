import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import type { CaptionOperation, CaptionAnimation } from "../types";

type CaptionOverlayProps = {
  caption: CaptionOperation;
  compositionWidth: number;
};

const useAnimation = (
  animation: CaptionAnimation,
  frame: number,
  startFrame: number,
  endFrame: number,
  fps: number,
  textLength: number,
) => {
  const localFrame = frame - startFrame;
  const duration = endFrame - startFrame;

  if (frame < startFrame || frame > endFrame) {
    return { opacity: 0, transform: "none" };
  }

  switch (animation) {
    case "fade-in": {
      const opacity = interpolate(localFrame, [0, Math.min(15, duration)], [0, 1], {
        extrapolateRight: "clamp",
      });
      return { opacity, transform: "" };
    }
    case "scale-in": {
      const scale = spring({ frame: localFrame, fps, config: { damping: 12 } });
      return { opacity: 1, transform: `scale(${scale})` };
    }
    case "slide-up": {
      const y = interpolate(localFrame, [0, Math.min(15, duration)], [50, 0], {
        extrapolateRight: "clamp",
      });
      return { opacity: 1, transform: `translateY(${y}px)` };
    }
    case "typewriter": {
      const charsToShow = Math.floor(
        interpolate(localFrame, [0, Math.min(duration, 60)], [0, textLength], {
          extrapolateRight: "clamp",
        }),
      );
      return { opacity: 1, transform: "", charsToShow };
    }
    default:
      return { opacity: 1, transform: "" };
  }
};

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  caption,
  compositionWidth,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const animRaw = useAnimation(
    caption.animation,
    frame,
    caption.startFrame,
    caption.endFrame,
    fps,
    caption.text.length,
  );

  if (frame < caption.startFrame || frame > caption.endFrame) return null;

  const singleFramePreview = durationInFrames <= 1;
  const anim = singleFramePreview
    ? {
        opacity: 1,
        transform: "" as const,
        charsToShow: caption.text.length,
      }
    : animRaw;

  const fontSize = caption.fontSize * compositionWidth;
  const displayText =
    caption.animation === "typewriter" && "charsToShow" in anim
      ? caption.text.slice(0, anim.charsToShow as number)
      : caption.text;

  return (
    <div
      style={{
        position: "absolute",
        left: `${caption.x * 100}%`,
        top: `${caption.y * 100}%`,
        transform: `translate(-50%, -50%) ${anim.transform}`,
        opacity: anim.opacity,
        fontSize: `${fontSize}px`,
        fontFamily: caption.fontFamily ?? "sans-serif",
        color: caption.color,
        textAlign: "center",
        whiteSpace: "pre-wrap",
        WebkitTextStroke: caption.strokeWidth
          ? `${caption.strokeWidth}px ${caption.strokeColor ?? "#000"}`
          : undefined,
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      {displayText}
    </div>
  );
};
