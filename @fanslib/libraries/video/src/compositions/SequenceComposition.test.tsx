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
