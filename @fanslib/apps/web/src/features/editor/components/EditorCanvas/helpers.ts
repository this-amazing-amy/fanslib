import type { CaptionOperation } from "@fanslib/video/types";

export type WatermarkOp = {
  type: "watermark";
  assetId: string;
  x: number;
  y: number;
  width: number;
  opacity: number;
};

export const isWatermarkOp = (op: unknown): op is WatermarkOp =>
  typeof op === "object" &&
  op !== null &&
  "type" in op &&
  (op as { type: string }).type === "watermark";

export const isCaptionOp = (op: unknown): op is CaptionOperation =>
  typeof op === "object" &&
  op !== null &&
  "type" in op &&
  (op as { type: string }).type === "caption" &&
  typeof (op as CaptionOperation).text === "string";

export const toAbsoluteFileUrl = (path: string) =>
  typeof window === "undefined" ? path : new URL(path, window.location.origin).href;

export const isEditableKeyTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const { tagName } = target;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") return true;
  return target.isContentEditable;
};

/** Returns true when the current frame is outside [startFrame, endFrame). */
export const isOutsideFrameRange = (
  frame: number,
  startFrame?: number,
  endFrame?: number,
): boolean => {
  if (startFrame != null && endFrame != null) {
    return frame < startFrame || frame >= endFrame;
  }
  return false;
};
