import { describe, expect, test } from "vitest";
import { intersectRegion } from "./region-intersection";
import type { Segment } from "./sequence-engine";
import type { Track } from "@fanslib/video/types";

const makeSegment = (
  id: string,
  sourceMediaId: string,
  sourceStartFrame: number,
  sourceEndFrame: number,
  transition?: Segment["transition"],
): Segment => ({
  id,
  sourceMediaId,
  sourceStartFrame,
  sourceEndFrame,
  ...(transition && { transition }),
});

const makeTrack = (name: string, operations: Track["operations"]): Track => ({
  id: `track-${name}`,
  name,
  operations,
});

describe("intersectRegion", () => {
  test("segment fully inside region — included with remapped frames", () => {
    const segments = [
      makeSegment("s1", "media-1", 0, 300),
    ];
    const region = { startFrame: 50, endFrame: 250 };

    const result = intersectRegion(segments, [], region);

    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]).toEqual({
      id: "s1",
      sourceMediaId: "media-1",
      sourceStartFrame: 50,
      sourceEndFrame: 250,
      sequenceStartFrame: 0,
      sequenceEndFrame: 200,
    });
  });

  test("segment fully outside region — excluded", () => {
    const segments = [
      makeSegment("s1", "media-1", 0, 100),
      makeSegment("s2", "media-2", 0, 100),
    ];
    // s1 occupies [0,100), s2 occupies [100,200) in sequence
    const region = { startFrame: 300, endFrame: 500 };

    const result = intersectRegion(segments, [], region);

    expect(result.segments).toHaveLength(0);
  });

  test("segment partially overlapping — region clips start", () => {
    // Single segment: source [100,400), sequence [0,300)
    const segments = [makeSegment("s1", "media-1", 100, 400)];
    // Region starts at 50 into the segment
    const region = { startFrame: 50, endFrame: 300 };

    const result = intersectRegion(segments, [], region);

    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]).toEqual({
      id: "s1",
      sourceMediaId: "media-1",
      sourceStartFrame: 150, // 100 + 50 clipped from start
      sourceEndFrame: 400,
      sequenceStartFrame: 0,
      sequenceEndFrame: 250,
    });
  });

  test("segment partially overlapping — region clips end", () => {
    // Single segment: source [0,300), sequence [0,300)
    const segments = [makeSegment("s1", "media-1", 0, 300)];
    const region = { startFrame: 0, endFrame: 200 };

    const result = intersectRegion(segments, [], region);

    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]).toEqual({
      id: "s1",
      sourceMediaId: "media-1",
      sourceStartFrame: 0,
      sourceEndFrame: 200,
      sequenceStartFrame: 0,
      sequenceEndFrame: 200,
    });
  });

  test("operations fully inside — included with remapped frames", () => {
    const tracks = [
      makeTrack("T1", [
        {
          type: "caption",
          id: "op1",
          text: "Hello",
          x: 0.5,
          y: 0.5,
          fontSize: 0.05,
          color: "#fff",
          animation: "fade-in" as const,
          startFrame: 150,
          endFrame: 250,
        },
      ]),
    ];
    const region = { startFrame: 100, endFrame: 400 };

    const result = intersectRegion([], tracks, region);

    expect(result.operations).toHaveLength(1);
    expect(result.operations[0].startFrame).toBe(50); // 150 - 100
    expect(result.operations[0].endFrame).toBe(150); // 250 - 100
  });

  test("operations partially overlapping — clipped and remapped", () => {
    const tracks = [
      makeTrack("T1", [
        {
          type: "caption",
          id: "op1",
          text: "Hello",
          x: 0.5,
          y: 0.5,
          fontSize: 0.05,
          color: "#fff",
          animation: "fade-in" as const,
          startFrame: 50,
          endFrame: 250,
        },
      ]),
    ];
    const region = { startFrame: 100, endFrame: 200 };

    const result = intersectRegion([], tracks, region);

    expect(result.operations).toHaveLength(1);
    expect(result.operations[0].startFrame).toBe(0); // clamped to region start
    expect(result.operations[0].endFrame).toBe(100); // clamped to region end: 200 - 100
  });

  test("operations fully outside — excluded", () => {
    const tracks = [
      makeTrack("T1", [
        {
          type: "caption",
          id: "op1",
          text: "Hello",
          x: 0.5,
          y: 0.5,
          fontSize: 0.05,
          color: "#fff",
          animation: "fade-in" as const,
          startFrame: 500,
          endFrame: 600,
        },
      ]),
    ];
    const region = { startFrame: 100, endFrame: 200 };

    const result = intersectRegion([], tracks, region);

    expect(result.operations).toHaveLength(0);
  });

  test("total duration equals region length", () => {
    const region = { startFrame: 100, endFrame: 350 };
    const result = intersectRegion([], [], region);

    expect(result.totalDuration).toBe(250);
  });

  test("empty region (startFrame === endFrame) returns empty", () => {
    const segments = [makeSegment("s1", "media-1", 0, 300)];
    const tracks = [
      makeTrack("T1", [
        {
          type: "caption",
          id: "op1",
          text: "Hello",
          x: 0.5,
          y: 0.5,
          fontSize: 0.05,
          color: "#fff",
          animation: "fade-in" as const,
          startFrame: 0,
          endFrame: 100,
        },
      ]),
    ];
    const region = { startFrame: 100, endFrame: 100 };

    const result = intersectRegion(segments, tracks, region);

    expect(result.segments).toHaveLength(0);
    expect(result.operations).toHaveLength(0);
    expect(result.totalDuration).toBe(0);
  });

  test("region spanning single segment", () => {
    // Two segments: s1 [0,200), s2 [200,500) in sequence
    const segments = [
      makeSegment("s1", "media-1", 0, 200),
      makeSegment("s2", "media-2", 0, 300),
    ];
    // Region covers only s2
    const region = { startFrame: 200, endFrame: 500 };

    const result = intersectRegion(segments, [], region);

    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]).toEqual({
      id: "s2",
      sourceMediaId: "media-2",
      sourceStartFrame: 0,
      sourceEndFrame: 300,
      sequenceStartFrame: 0,
      sequenceEndFrame: 300,
    });
  });

  test("operations without frame ranges pass through unchanged", () => {
    const tracks = [
      makeTrack("T1", [
        {
          type: "crop",
          id: "op1",
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        } as Track["operations"][0],
      ]),
    ];
    const region = { startFrame: 0, endFrame: 100 };

    const result = intersectRegion([], tracks, region);

    expect(result.operations).toHaveLength(1);
    expect((result.operations[0] as Record<string, unknown>).type).toBe("crop");
  });

  test("transition at region boundary is reduced", () => {
    // s1: source [0,200), seq [0,200)
    // s2: source [0,200), transition 30 frames crossfade, seq [170,370)
    const segments = [
      makeSegment("s1", "media-1", 0, 200),
      makeSegment("s2", "media-2", 0, 200, { type: "crossfade", durationFrames: 30 }),
    ];
    // Region starts at 180, which is 10 frames into s2's transition (which starts at 170)
    const region = { startFrame: 180, endFrame: 370 };

    const result = intersectRegion(segments, [], region);

    // s1 overlaps [170..200) mapped to [0..200), region clips to [180,200) => seq [0,20)
    // s2 overlaps [170..370), region clips to [180,370) => seq [0,190)
    const s2 = result.segments.find((s) => s.id === "s2");
    expect(s2).toBeDefined();
    // Transition originally 30 frames starting at 170. Region starts at 180, so 20 frames remain
    expect(s2!.transition).toEqual({ type: "crossfade", durationFrames: 20 });
  });

  test("transition fully inside region is preserved", () => {
    const segments = [
      makeSegment("s1", "media-1", 0, 200),
      makeSegment("s2", "media-2", 0, 200, { type: "crossfade", durationFrames: 30 }),
    ];
    // Region covers everything: [0, 370)
    const region = { startFrame: 0, endFrame: 370 };

    const result = intersectRegion(segments, [], region);

    const s2 = result.segments.find((s) => s.id === "s2");
    expect(s2).toBeDefined();
    expect(s2!.transition).toEqual({ type: "crossfade", durationFrames: 30 });
  });

  test("multiple segments and operations together", () => {
    const segments = [
      makeSegment("s1", "media-1", 0, 200),
      makeSegment("s2", "media-2", 50, 350),
    ];
    // seq: s1 [0,200), s2 [200,500)
    const tracks = [
      makeTrack("T1", [
        {
          type: "caption",
          id: "op1",
          text: "A",
          x: 0.5,
          y: 0.5,
          fontSize: 0.05,
          color: "#fff",
          animation: "fade-in" as const,
          startFrame: 100,
          endFrame: 300,
        },
        {
          type: "caption",
          id: "op2",
          text: "B",
          x: 0.5,
          y: 0.5,
          fontSize: 0.05,
          color: "#fff",
          animation: "fade-in" as const,
          startFrame: 600,
          endFrame: 700,
        },
      ]),
    ];
    const region = { startFrame: 150, endFrame: 400 };

    const result = intersectRegion(segments, tracks, region);

    // s1 overlaps: [150,200) in seq => source [150,200), remapped [0,50)
    // s2 overlaps: [200,400) in seq => source [50,250), remapped [50,250)
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].sequenceStartFrame).toBe(0);
    expect(result.segments[0].sequenceEndFrame).toBe(50);
    expect(result.segments[1].sequenceStartFrame).toBe(50);
    expect(result.segments[1].sequenceEndFrame).toBe(250);

    // op1: [100,300) intersects [150,400) => clamped [150,300) => remapped [0,150)
    // op2: fully outside
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0].startFrame).toBe(0);
    expect(result.operations[0].endFrame).toBe(150);

    expect(result.totalDuration).toBe(250);
  });
});
