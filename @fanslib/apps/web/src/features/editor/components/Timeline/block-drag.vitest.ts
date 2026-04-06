import { describe, expect, test } from "vitest";
import {
  computeMove,
  computeTrimStart,
  computeTrimEnd,
  detectEdge,
} from "./block-drag";

describe("block-drag frame math", () => {
  describe("computeMove", () => {
    test("shifts both startFrame and endFrame by delta", () => {
      const result = computeMove({ startFrame: 10, endFrame: 50 }, 5, 900);
      expect(result).toEqual({ startFrame: 15, endFrame: 55 });
    });

    test("clamps so startFrame does not go below 0", () => {
      const result = computeMove({ startFrame: 3, endFrame: 20 }, -10, 900);
      expect(result).toEqual({ startFrame: 0, endFrame: 17 });
    });

    test("clamps so endFrame does not exceed lastFrame", () => {
      const result = computeMove({ startFrame: 880, endFrame: 900 }, 10, 900);
      expect(result).toEqual({ startFrame: 880, endFrame: 900 });
    });
  });

  describe("computeTrimStart", () => {
    test("moves only startFrame by delta", () => {
      const result = computeTrimStart({ startFrame: 10, endFrame: 50 }, 5, 900);
      expect(result).toEqual({ startFrame: 15, endFrame: 50 });
    });

    test("clamps startFrame to 0", () => {
      const result = computeTrimStart({ startFrame: 3, endFrame: 50 }, -10, 900);
      expect(result).toEqual({ startFrame: 0, endFrame: 50 });
    });

    test("does not allow startFrame to exceed endFrame - 1", () => {
      const result = computeTrimStart({ startFrame: 40, endFrame: 50 }, 20, 900);
      expect(result).toEqual({ startFrame: 49, endFrame: 50 });
    });
  });

  describe("computeTrimEnd", () => {
    test("moves only endFrame by delta", () => {
      const result = computeTrimEnd({ startFrame: 10, endFrame: 50 }, 5, 900);
      expect(result).toEqual({ startFrame: 10, endFrame: 55 });
    });

    test("clamps endFrame to lastFrame", () => {
      const result = computeTrimEnd({ startFrame: 10, endFrame: 895 }, 10, 900);
      expect(result).toEqual({ startFrame: 10, endFrame: 900 });
    });

    test("does not allow endFrame below startFrame + 1", () => {
      const result = computeTrimEnd({ startFrame: 40, endFrame: 50 }, -20, 900);
      expect(result).toEqual({ startFrame: 40, endFrame: 41 });
    });
  });

  describe("detectEdge", () => {
    test("returns 'left' when click is within edge zone from left", () => {
      expect(detectEdge(2, 100, 5)).toBe("left");
    });

    test("returns 'right' when click is within edge zone from right", () => {
      expect(detectEdge(98, 100, 5)).toBe("right");
    });

    test("returns 'body' when click is in the middle", () => {
      expect(detectEdge(50, 100, 5)).toBe("body");
    });

    test("returns 'body' for narrow blocks where edges overlap", () => {
      // Block is 6px wide, edge zone is 5px — entire block is edges
      // Should still return body for center click
      expect(detectEdge(3, 6, 5)).toBe("body");
    });
  });
});
