import { describe, expect, test } from "bun:test";
import {
  resolveSequenceSegments,
  sequenceDurationInFrames,
} from "./remotion-render";

describe("resolveSequenceSegments", () => {
  test("resolves source URLs for every segment source media id", () => {
    const baseUrl = "http://localhost:6970";
    const segments = [
      {
        id: "segment-1",
        sourceMediaId: "media-a",
        sourceStartFrame: 0,
        sourceEndFrame: 120,
      },
      {
        id: "segment-2",
        sourceMediaId: "media-b",
        sourceStartFrame: 30,
        sourceEndFrame: 150,
        transition: {
          type: "crossfade" as const,
          durationFrames: 15,
          easing: "ease-in-out",
        },
      },
    ];

    const resolvedSegments = resolveSequenceSegments(segments, baseUrl);

    expect(resolvedSegments).toHaveLength(2);
    expect(resolvedSegments[0]?.sourceUrl).toBe("http://localhost:6970/api/media/media-a/file");
    expect(resolvedSegments[1]?.sourceUrl).toBe("http://localhost:6970/api/media/media-b/file");
  });
});

describe("sequenceDurationInFrames", () => {
  test("subtracts overlap from total duration when transitions exist", () => {
    const segments = [
      {
        id: "segment-1",
        sourceMediaId: "media-a",
        sourceStartFrame: 0,
        sourceEndFrame: 120,
      },
      {
        id: "segment-2",
        sourceMediaId: "media-b",
        sourceStartFrame: 0,
        sourceEndFrame: 90,
        transition: {
          type: "crossfade" as const,
          durationFrames: 20,
          easing: "linear",
        },
      },
      {
        id: "segment-3",
        sourceMediaId: "media-c",
        sourceStartFrame: 0,
        sourceEndFrame: 60,
      },
    ];

    expect(sequenceDurationInFrames(segments)).toBe(250);
  });
});
