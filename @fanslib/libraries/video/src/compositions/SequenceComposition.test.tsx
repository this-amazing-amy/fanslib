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
