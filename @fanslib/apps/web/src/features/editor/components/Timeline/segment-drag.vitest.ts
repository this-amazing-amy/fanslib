import { describe, expect, test } from "vitest";
import { computeSegmentTrimStart, computeSegmentTrimEnd, computeSegmentReorderIndex } from "./segment-drag";
import type { Segment } from "~/features/editor/utils/sequence-engine";
import { computeSequenceTimeline } from "~/features/editor/utils/sequence-engine";

const makeSegment = (id: string, start: number, end: number): Segment => ({
  id,
  sourceMediaId: `media-${id}`,
  sourceStartFrame: start,
  sourceEndFrame: end,
});

describe("segment-drag frame math", () => {
  describe("computeSegmentTrimStart", () => {
    test("clamps to not go below 0", () => {
      const segment = makeSegment("a", 5, 100);
      const result = computeSegmentTrimStart(segment, -20);
      expect(result).toEqual({ sourceStartFrame: 0 });
    });

    test("clamps to not exceed endFrame - 1", () => {
      const segment = makeSegment("a", 80, 100);
      const result = computeSegmentTrimStart(segment, 30);
      expect(result).toEqual({ sourceStartFrame: 99 });
    });

    test("adjusts by positive delta within range", () => {
      const segment = makeSegment("a", 10, 100);
      const result = computeSegmentTrimStart(segment, 5);
      expect(result).toEqual({ sourceStartFrame: 15 });
    });
  });

  describe("computeSegmentTrimEnd", () => {
    test("clamps to not go below startFrame + 1", () => {
      const segment = makeSegment("a", 50, 60);
      const result = computeSegmentTrimEnd(segment, -20);
      expect(result).toEqual({ sourceEndFrame: 51 });
    });

    test("adjusts by positive delta", () => {
      const segment = makeSegment("a", 10, 100);
      const result = computeSegmentTrimEnd(segment, 20);
      expect(result).toEqual({ sourceEndFrame: 120 });
    });

    test("adjusts by negative delta within range", () => {
      const segment = makeSegment("a", 10, 100);
      const result = computeSegmentTrimEnd(segment, -5);
      expect(result).toEqual({ sourceEndFrame: 95 });
    });
  });

  describe("computeSegmentReorderIndex", () => {
    // Three segments: A(0-30), B(30-60), C(60-90) at 1px/frame
    const segments = [makeSegment("A", 0, 30), makeSegment("B", 0, 30), makeSegment("C", 0, 30)];
    const pixelsPerFrame = 1;
    const timeline = computeSequenceTimeline(segments);
    // positions: A=[0,30], B=[30,60], C=[60,90]
    // midpoints: A=15, B=45, C=75

    test("returns correct index when dragging to the right", () => {
      // Drag A past midpoint of B (45) and C (75) -> should land at index 2
      const result = computeSegmentReorderIndex(segments, "A", 50, pixelsPerFrame, timeline);
      expect(result).toBe(1);

      // Drag A past all midpoints
      const result2 = computeSegmentReorderIndex(segments, "A", 80, pixelsPerFrame, timeline);
      expect(result2).toBe(2);
    });

    test("returns correct index when dragging to the left", () => {
      // Drag C to before midpoint of A (15) -> should land at index 0
      const result = computeSegmentReorderIndex(segments, "C", 10, pixelsPerFrame, timeline);
      expect(result).toBe(0);

      // Drag C between A and B midpoints -> should land at index 1
      const result2 = computeSegmentReorderIndex(segments, "C", 20, pixelsPerFrame, timeline);
      expect(result2).toBe(1);
    });
  });
});
