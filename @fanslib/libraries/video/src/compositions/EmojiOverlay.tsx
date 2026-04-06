import React from "react";
import { useCurrentFrame } from "remotion";
import type { EmojiOperation } from "../types";
import { interpolateKeyframes } from "../keyframes";

type EmojiOverlayProps = {
  emojiOp: EmojiOperation;
  compositionWidth: number;
  compositionHeight: number;
};

export const EmojiOverlay: React.FC<EmojiOverlayProps> = ({
  emojiOp,
  compositionWidth,
}) => {
  const frame = useCurrentFrame();

  if (emojiOp.startFrame != null && emojiOp.endFrame != null) {
    if (frame < emojiOp.startFrame || frame >= emojiOp.endFrame) return null;
  }

  const properties = ["x", "y", "size"];

  const values =
    emojiOp.keyframes.length > 0
      ? interpolateKeyframes(emojiOp.keyframes, frame, properties)
      : { x: emojiOp.x, y: emojiOp.y, size: emojiOp.size };

  const fontSize = (values.size ?? emojiOp.size) * compositionWidth;

  return (
    <div
      style={{
        position: "absolute",
        left: `${(values.x ?? 0) * 100}%`,
        top: `${(values.y ?? 0) * 100}%`,
        fontSize: `${fontSize}px`,
        lineHeight: 1,
        transform: "translate(-50%, -50%)",
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      {emojiOp.emoji}
    </div>
  );
};
