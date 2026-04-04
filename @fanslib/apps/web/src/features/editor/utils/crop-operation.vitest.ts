import { describe, expect, test } from "vitest";
import {
  CROP_COMPOSITION_WIDTH,
  cropOperationWithPixelRect,
  cropRectPixelsFromOperation,
  pixelHeightFromWidthForPreset,
} from "./crop-operation";

describe("crop-operation", () => {
  const baseCrop = {
    type: "crop" as const,
    x: 0.1,
    y: 0.1,
    width: 0.5,
    height: 0.5,
    applied: false,
    aspectPreset: "free" as const,
  };

  test("cropRectPixelsFromOperation maps normalized rect to composition pixels", () => {
    const p = cropRectPixelsFromOperation(baseCrop);
    expect(p.xPx).toBeCloseTo(0.1 * CROP_COMPOSITION_WIDTH, 4);
    expect(p.yPx).toBeCloseTo(108, 4);
    expect(p.wPx).toBeCloseTo(0.5 * CROP_COMPOSITION_WIDTH, 4);
    expect(p.hPx).toBeCloseTo(540, 4);
  });

  test("cropOperationWithPixelRect round-trips a pixel tweak", () => {
    const next = cropOperationWithPixelRect(baseCrop, { xPx: 100, yPx: 200 });
    const p = cropRectPixelsFromOperation(next);
    expect(p.xPx).toBeCloseTo(100, 2);
    expect(p.yPx).toBeCloseTo(200, 2);
  });

  test("1:1 preset uses equal width and height in pixels", () => {
    expect(pixelHeightFromWidthForPreset("1:1", 640)).toBe(640);
  });
});
