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
  const properties = ["x", "y", "size"];

  const values =
    emojiOp.keyframes.length > 0
      ? interpolateKeyframes(emojiOp.keyframes, frame, properties)
      : { x: emojiOp.x, y: emojiOp.y, size: emojiOp.size };

  const fontSize = values.size * compositionWidth;

  return (
    <div
      style={{
        position: "absolute",
        left: `${values.x * 100}%`,
        top: `${values.y * 100}%`,
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
