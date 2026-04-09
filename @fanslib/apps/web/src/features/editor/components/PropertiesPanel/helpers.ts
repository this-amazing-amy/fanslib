import type {
  BlurOperation,
  PixelateOperation,
  EmojiOperation,
  ZoomOperation,
} from "@fanslib/video/types";

export const isBlurOp = (op: unknown): op is BlurOperation =>
  typeof op === "object" && op !== null && (op as { type: string }).type === "blur";

export const isPixelateOp = (op: unknown): op is PixelateOperation =>
  typeof op === "object" && op !== null && (op as { type: string }).type === "pixelate";

export const isEmojiOp = (op: unknown): op is EmojiOperation =>
  typeof op === "object" && op !== null && (op as { type: string }).type === "emoji";

export const isZoomOp = (op: unknown): op is ZoomOperation =>
  typeof op === "object" && op !== null && (op as { type: string }).type === "zoom";
