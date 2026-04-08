import { describe, expect, test } from "bun:test";
import type { SequenceCompositionProps, SegmentInput } from "./SequenceComposition";

describe("SequenceComposition", () => {
  test("exports the component", async () => {
    const mod = await import("./SequenceComposition");
    expect(mod.SequenceComposition).toBeDefined();
    expect(typeof mod.SequenceComposition).toBe("function");
  });

  test("SegmentInput type accepts valid segment", () => {
    const segment: SegmentInput = {
      id: "seg-1",
      sourceMediaId: "media-1",
      sourceUrl: "https://example.com/video.mp4",
      sourceStartFrame: 0,
      sourceEndFrame: 150,
    };
    expect(segment.id).toBe("seg-1");
    expect(segment.sourceEndFrame - segment.sourceStartFrame).toBe(150);
  });

  test("SequenceCompositionProps accepts single-segment input", () => {
    const props: SequenceCompositionProps = {
      segments: [
        {
          id: "seg-1",
          sourceMediaId: "media-1",
          sourceUrl: "https://example.com/video.mp4",
          sourceStartFrame: 30,
          sourceEndFrame: 180,
        },
      ],
    };
    expect(props.segments).toHaveLength(1);
    expect(props.segments[0]!.sourceStartFrame).toBe(30);
  });

  test("SequenceCompositionProps accepts optional operations and assetUrls", () => {
    const props: SequenceCompositionProps = {
      segments: [],
      operations: [],
      assetUrls: { "asset-1": "https://example.com/asset.png" },
    };
    expect(props.operations).toEqual([]);
    expect(props.assetUrls).toBeDefined();
  });
});

describe("computeActiveSegment", () => {
  const seg1: SegmentInput = {
    id: "seg-1",
    sourceMediaId: "media-1",
    sourceUrl: "https://example.com/a.mp4",
    sourceStartFrame: 0,
    sourceEndFrame: 90,
  };

  const seg2: SegmentInput = {
    id: "seg-2",
    sourceMediaId: "media-2",
    sourceUrl: "https://example.com/b.mp4",
    sourceStartFrame: 30,
    sourceEndFrame: 120,
  };

  const seg3: SegmentInput = {
    id: "seg-3",
    sourceMediaId: "media-3",
    sourceUrl: "https://example.com/c.mp4",
    sourceStartFrame: 0,
    sourceEndFrame: 60,
  };

  test("first segment is active at frame 0", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    const result = computeActiveSegment(0, [seg1, seg2]);
    expect(result).not.toBeNull();
    expect(result!.segment.id).toBe("seg-1");
    expect(result!.sourceFrame).toBe(0);
  });

  test("first segment is active at its last frame", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    // seg1 duration = 90 frames (0..89)
    const result = computeActiveSegment(89, [seg1, seg2]);
    expect(result).not.toBeNull();
    expect(result!.segment.id).toBe("seg-1");
    expect(result!.sourceFrame).toBe(89);
  });

  test("second segment is active after first segment's duration", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    // seg1 duration = 90, so frame 90 is the first frame of seg2
    const result = computeActiveSegment(90, [seg1, seg2]);
    expect(result).not.toBeNull();
    expect(result!.segment.id).toBe("seg-2");
    // seg2.sourceStartFrame is 30, so source frame = 30 + (90 - 90) = 30
    expect(result!.sourceFrame).toBe(30);
  });

  test("correct source frame computation with non-zero sourceStartFrame", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    // Frame 100 is 10 frames into seg2 (seg1 duration = 90)
    // seg2.sourceStartFrame = 30, so source frame = 30 + 10 = 40
    const result = computeActiveSegment(100, [seg1, seg2]);
    expect(result).not.toBeNull();
    expect(result!.segment.id).toBe("seg-2");
    expect(result!.sourceFrame).toBe(40);
  });

  test("returns null past all segments", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    // Total duration = 90 + 90 = 180
    const result = computeActiveSegment(180, [seg1, seg2]);
    expect(result).toBeNull();
  });

  test("returns null for empty segments array", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    const result = computeActiveSegment(0, []);
    expect(result).toBeNull();
  });

  test("handles three segments correctly", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    // seg1: 90 frames, seg2: 90 frames, seg3: 60 frames
    // Frame 180 should be first frame of seg3
    const result = computeActiveSegment(180, [seg1, seg2, seg3]);
    expect(result).not.toBeNull();
    expect(result!.segment.id).toBe("seg-3");
    expect(result!.sourceFrame).toBe(0);
  });
});
