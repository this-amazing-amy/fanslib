import { describe, expect, test } from "vitest";
import {
  pixelToRelative,
  relativeToPixel,
  getPlayerRect,
  type CanvasRect,
} from "./coordinate-mapping";

describe("coordinate-mapping", () => {
  const canvas: CanvasRect = {
    canvasWidth: 800,
    canvasHeight: 450,
    compositionWidth: 1920,
    compositionHeight: 1080,
  };

  describe("pixelToRelative", () => {
    test("converts pixel coordinates to relative 0-1 coordinates", () => {
      const result = pixelToRelative(400, 225, canvas);
      expect(result.x).toBeCloseTo(0.5, 2);
      expect(result.y).toBeCloseTo(0.5, 2);
    });

    test("top-left corner maps to 0,0", () => {
      const result = pixelToRelative(0, 0, canvas);
      expect(result.x).toBeCloseTo(0, 2);
      expect(result.y).toBeCloseTo(0, 2);
    });

    test("bottom-right corner maps to 1,1", () => {
      const result = pixelToRelative(800, 450, canvas);
      expect(result.x).toBeCloseTo(1, 2);
      expect(result.y).toBeCloseTo(1, 2);
    });

    test("clamps to 0-1 range", () => {
      const result = pixelToRelative(-50, 500, canvas);
      expect(result.x).toBe(0);
      expect(result.y).toBe(1);
    });
  });

  describe("relativeToPixel", () => {
    test("converts relative coordinates to pixel coordinates", () => {
      const result = relativeToPixel(0.5, 0.5, canvas);
      expect(result.px).toBeCloseTo(400, 0);
      expect(result.py).toBeCloseTo(225, 0);
    });

    test("0,0 maps to top-left", () => {
      const result = relativeToPixel(0, 0, canvas);
      expect(result.px).toBe(0);
      expect(result.py).toBe(0);
    });

    test("1,1 maps to bottom-right", () => {
      const result = relativeToPixel(1, 1, canvas);
      expect(result.px).toBe(800);
      expect(result.py).toBe(450);
    });
  });

  describe("getPlayerRect with letterboxing", () => {
    test("returns full canvas when aspect ratios match", () => {
      const rect = getPlayerRect(800, 450, 1920, 1080);
      expect(rect.canvasWidth).toBe(800);
      expect(rect.canvasHeight).toBe(450);
    });

    test("returns letterboxed rect when canvas is wider than composition", () => {
      // Canvas 1000x450, composition 16:9 = 1920x1080
      // 16:9 at height 450 = width 800, so letterboxed with bars on sides
      const rect = getPlayerRect(1000, 450, 1920, 1080);
      expect(rect.canvasWidth).toBe(800);
      expect(rect.canvasHeight).toBe(450);
    });

    test("returns pillarboxed rect when canvas is taller than composition", () => {
      // Canvas 800x600, composition 16:9
      // 16:9 at width 800 = height 450
      const rect = getPlayerRect(800, 600, 1920, 1080);
      expect(rect.canvasWidth).toBe(800);
      expect(rect.canvasHeight).toBe(450);
    });
  });
});
