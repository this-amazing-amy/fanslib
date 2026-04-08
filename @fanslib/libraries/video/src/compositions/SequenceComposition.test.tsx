import { describe, expect, test } from "bun:test";
import type {
  SequenceCompositionProps,
  SegmentInput,
  ActiveSegmentResult,
} from "./SequenceComposition";

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

  test("operations prop is accepted alongside segments", () => {
    const props: SequenceCompositionProps = {
      segments: [
        {
          id: "seg-1",
          sourceMediaId: "media-1",
          sourceUrl: "https://example.com/video.mp4",
          sourceStartFrame: 0,
          sourceEndFrame: 300,
        },
      ],
      operations: [
        {
          type: "blur",
          id: "blur-1",
          x: 0.1,
          y: 0.1,
          width: 0.3,
          height: 0.3,
          radius: 10,
          startFrame: 0,
          endFrame: 100,
          keyframes: [],
        },
        {
          type: "emoji",
          id: "emoji-1",
          emoji: "🎉",
          x: 0.5,
          y: 0.5,
          size: 0.1,
          startFrame: 50,
          endFrame: 200,
          keyframes: [],
        },
        {
          type: "watermark",
          id: "wm-1",
          assetId: "asset-1",
          x: 0.9,
          y: 0.9,
          width: 0.1,
          opacity: 0.8,
        },
      ],
      assetUrls: { "asset-1": "https://example.com/watermark.png" },
    };
    expect(props.segments).toHaveLength(1);
    expect(props.operations).toHaveLength(3);
    expect(props.operations![0]!.type).toBe("blur");
    expect(props.operations![1]!.type).toBe("emoji");
    expect(props.operations![2]!.type).toBe("watermark");
  });

  test("SequenceCompositionProps includes operations and assetUrls fields", () => {
    // Type-level test: verify the shape includes optional operations and assetUrls
    const propsWithAll: SequenceCompositionProps = {
      segments: [],
      operations: [
        {
          type: "caption",
          id: "cap-1",
          text: "Hello",
          x: 0.5,
          y: 0.8,
          fontSize: 0.05,
          color: "#fff",
          animation: "fade-in",
          startFrame: 0,
          endFrame: 60,
        },
        {
          type: "zoom",
          id: "zoom-1",
          scale: 1.5,
          centerX: 0.5,
          centerY: 0.5,
          startFrame: 10,
          endFrame: 50,
          keyframes: [],
        },
        {
          type: "crop",
          id: "crop-1",
          x: 0.1,
          y: 0.1,
          width: 0.8,
          height: 0.8,
        },
        {
          type: "pixelate",
          id: "pix-1",
          x: 0.2,
          y: 0.2,
          width: 0.2,
          height: 0.2,
          pixelSize: 8,
          keyframes: [],
        },
      ],
      assetUrls: {},
    };

    const propsWithout: SequenceCompositionProps = {
      segments: [],
    };

    // Both forms should be valid — operations and assetUrls are optional
    expect(propsWithAll.operations).toHaveLength(4);
    expect(propsWithout.operations).toBeUndefined();
    expect(propsWithout.assetUrls).toBeUndefined();
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
    expect(result!.segments).toHaveLength(1);
    expect(result!.segments[0]!.segment.id).toBe("seg-1");
    expect(result!.segments[0]!.sourceFrame).toBe(0);
    expect(result!.segments[0]!.alpha).toBe(1);
  });

  test("first segment is active at its last frame", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    // seg1 duration = 90 frames (0..89)
    const result = computeActiveSegment(89, [seg1, seg2]);
    expect(result).not.toBeNull();
    expect(result!.segments[0]!.segment.id).toBe("seg-1");
    expect(result!.segments[0]!.sourceFrame).toBe(89);
  });

  test("second segment is active after first segment's duration", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    // seg1 duration = 90, so frame 90 is the first frame of seg2
    const result = computeActiveSegment(90, [seg1, seg2]);
    expect(result).not.toBeNull();
    expect(result!.segments[0]!.segment.id).toBe("seg-2");
    // seg2.sourceStartFrame is 30, so source frame = 30 + (90 - 90) = 30
    expect(result!.segments[0]!.sourceFrame).toBe(30);
  });

  test("correct source frame computation with non-zero sourceStartFrame", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    // Frame 100 is 10 frames into seg2 (seg1 duration = 90)
    // seg2.sourceStartFrame = 30, so source frame = 30 + 10 = 40
    const result = computeActiveSegment(100, [seg1, seg2]);
    expect(result).not.toBeNull();
    expect(result!.segments[0]!.segment.id).toBe("seg-2");
    expect(result!.segments[0]!.sourceFrame).toBe(40);
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
    expect(result!.segments[0]!.segment.id).toBe("seg-3");
    expect(result!.segments[0]!.sourceFrame).toBe(0);
  });
});

describe("computeActiveSegment with crossfade transitions", () => {
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
    transition: {
      type: "crossfade",
      durationFrames: 10,
    },
  };

  const seg3: SegmentInput = {
    id: "seg-3",
    sourceMediaId: "media-3",
    sourceUrl: "https://example.com/c.mp4",
    sourceStartFrame: 0,
    sourceEndFrame: 60,
  };

  test("before overlap, only first segment is active", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    // seg1 duration=90, seg2 transition pulls it 10 frames earlier
    // so overlap starts at frame 80 (90 - 10)
    const result = computeActiveSegment(79, [seg1, seg2]);
    expect(result).not.toBeNull();
    expect(result!.segments).toHaveLength(1);
    expect(result!.segments[0]!.segment.id).toBe("seg-1");
    expect(result!.segments[0]!.alpha).toBe(1);
    expect(result!.segments[0]!.sourceFrame).toBe(79);
  });

  test("during crossfade overlap, returns two segments", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    // Overlap region: frames 80..89 (10 frames)
    // At frame 85 we are 5 frames into the 10-frame transition
    const result = computeActiveSegment(85, [seg1, seg2]);
    expect(result).not.toBeNull();
    expect(result!.segments).toHaveLength(2);
    expect(result!.segments[0]!.segment.id).toBe("seg-1");
    expect(result!.segments[1]!.segment.id).toBe("seg-2");
  });

  test("alpha values progress from 1->0 and 0->1 over transition (linear)", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    // At frame 80 (start of overlap): t=0/10=0
    // seg1 alpha=1, seg2 alpha=0
    const atStart = computeActiveSegment(80, [seg1, seg2]);
    expect(atStart!.segments).toHaveLength(2);
    expect(atStart!.segments[0]!.alpha).toBeCloseTo(1, 5);
    expect(atStart!.segments[1]!.alpha).toBeCloseTo(0, 5);

    // At frame 85 (midpoint): t=5/10=0.5
    const atMid = computeActiveSegment(85, [seg1, seg2]);
    expect(atMid!.segments[0]!.alpha).toBeCloseTo(0.5, 5);
    expect(atMid!.segments[1]!.alpha).toBeCloseTo(0.5, 5);

    // At frame 89 (last frame of overlap): t=9/10=0.9
    const atEnd = computeActiveSegment(89, [seg1, seg2]);
    expect(atEnd!.segments[0]!.alpha).toBeCloseTo(0.1, 5);
    expect(atEnd!.segments[1]!.alpha).toBeCloseTo(0.9, 5);
  });

  test("after overlap, only second segment is active", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    // Overlap ends at frame 90 (80 + 10)
    // After overlap, seg2 continues alone
    const result = computeActiveSegment(90, [seg1, seg2]);
    expect(result).not.toBeNull();
    expect(result!.segments).toHaveLength(1);
    expect(result!.segments[0]!.segment.id).toBe("seg-2");
    expect(result!.segments[0]!.alpha).toBe(1);
  });

  test("source frames are correct during crossfade", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    // At frame 85: seg1 sourceFrame=85, seg2 sourceFrame=30+(85-80)=35
    const result = computeActiveSegment(85, [seg1, seg2]);
    expect(result!.segments[0]!.sourceFrame).toBe(85);
    expect(result!.segments[1]!.sourceFrame).toBe(35);
  });

  test("hard cut segments still work alongside crossfaded ones", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    // seg1: 90 frames, seg2: 90 frames with 10-frame crossfade, seg3: 60 frames (hard cut)
    // Timeline: seg1 0..79 | overlap 80..89 | seg2 alone 90..169 | seg3 170..229
    // Total duration: 80 + 10 + 80 + 60 = 230 (or: 90+90+60 - 10 = 230)

    // In seg3 (hard cut after seg2)
    // seg2 effective start on timeline = 80, seg2 duration = 90, so seg2 ends at 80+90=170
    // seg3 starts at 170
    const result = computeActiveSegment(170, [seg1, seg2, seg3]);
    expect(result).not.toBeNull();
    expect(result!.segments).toHaveLength(1);
    expect(result!.segments[0]!.segment.id).toBe("seg-3");
    expect(result!.segments[0]!.sourceFrame).toBe(0);
    expect(result!.segments[0]!.alpha).toBe(1);
  });

  test("returns null past all segments with transitions", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    // Total: 90 + 90 - 10 = 170
    const result = computeActiveSegment(170, [seg1, seg2]);
    expect(result).toBeNull();
  });

  test("easing: ease-in applies t^2", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    const seg2WithEasing: SegmentInput = {
      ...seg2,
      transition: { type: "crossfade", durationFrames: 10, easing: "ease-in" },
    };
    // At frame 85: t=5/10=0.5, ease-in=0.5^2=0.25
    const result = computeActiveSegment(85, [seg1, seg2WithEasing]);
    expect(result!.segments[1]!.alpha).toBeCloseTo(0.25, 5);
    expect(result!.segments[0]!.alpha).toBeCloseTo(0.75, 5);
  });

  test("easing: ease-out applies 1-(1-t)^2", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    const seg2WithEasing: SegmentInput = {
      ...seg2,
      transition: { type: "crossfade", durationFrames: 10, easing: "ease-out" },
    };
    // At frame 85: t=0.5, ease-out=1-(1-0.5)^2=1-0.25=0.75
    const result = computeActiveSegment(85, [seg1, seg2WithEasing]);
    expect(result!.segments[1]!.alpha).toBeCloseTo(0.75, 5);
    expect(result!.segments[0]!.alpha).toBeCloseTo(0.25, 5);
  });

  test("easing: ease-in-out applies cubic bezier approximation", async () => {
    const { computeActiveSegment } = await import("./SequenceComposition");
    const seg2WithEasing: SegmentInput = {
      ...seg2,
      transition: {
        type: "crossfade",
        durationFrames: 10,
        easing: "ease-in-out",
      },
    };
    // At t=0.5, ease-in-out should be 0.5 (symmetric)
    const atMid = computeActiveSegment(85, [seg1, seg2WithEasing]);
    expect(atMid!.segments[1]!.alpha).toBeCloseTo(0.5, 5);

    // At t=0 and t=1 boundaries should approach 0 and 1
    const atStart = computeActiveSegment(80, [seg1, seg2WithEasing]);
    expect(atStart!.segments[1]!.alpha).toBeCloseTo(0, 5);
  });
});
