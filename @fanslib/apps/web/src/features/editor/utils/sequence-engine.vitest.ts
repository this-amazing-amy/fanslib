import { describe, expect, test } from "vitest";
import { computeSequenceTimeline, mapSequenceFrameToSource } from "./sequence-engine";

describe("sequence engine", () => {
  describe("computeSequenceTimeline", () => {
    test("single segment starts at frame 0", () => {
      const result = computeSequenceTimeline([
        { id: "s1", sourceMediaId: "m1", sourceStartFrame: 0, sourceEndFrame: 300 },
      ]);

      expect(result.positions).toEqual([
        { segmentId: "s1", sequenceStartFrame: 0, sequenceEndFrame: 300 },
      ]);
      expect(result.totalDuration).toBe(300);
    });

    test("crossfade transition causes segment overlap", () => {
      const result = computeSequenceTimeline([
        { id: "s1", sourceMediaId: "m1", sourceStartFrame: 0, sourceEndFrame: 300 },
        {
          id: "s2",
          sourceMediaId: "m2",
          sourceStartFrame: 0,
          sourceEndFrame: 200,
          transition: { type: "crossfade", durationFrames: 30 },
        },
      ]);

      expect(result.positions).toEqual([
        { segmentId: "s1", sequenceStartFrame: 0, sequenceEndFrame: 300 },
        { segmentId: "s2", sequenceStartFrame: 270, sequenceEndFrame: 470 },
      ]);
      expect(result.totalDuration).toBe(470);
    });

    test("three segments with mixed transitions", () => {
      const result = computeSequenceTimeline([
        { id: "s1", sourceMediaId: "m1", sourceStartFrame: 0, sourceEndFrame: 300 },
        { id: "s2", sourceMediaId: "m2", sourceStartFrame: 0, sourceEndFrame: 200 },
        {
          id: "s3",
          sourceMediaId: "m3",
          sourceStartFrame: 100,
          sourceEndFrame: 250,
          transition: { type: "crossfade", durationFrames: 20 },
        },
      ]);

      expect(result.positions).toEqual([
        { segmentId: "s1", sequenceStartFrame: 0, sequenceEndFrame: 300 },
        { segmentId: "s2", sequenceStartFrame: 300, sequenceEndFrame: 500 },
        { segmentId: "s3", sequenceStartFrame: 480, sequenceEndFrame: 630 },
      ]);
      expect(result.totalDuration).toBe(630);
    });

    test("total duration with crossfade is reduced by overlap amount", () => {
      const withoutCrossfade = computeSequenceTimeline([
        { id: "s1", sourceMediaId: "m1", sourceStartFrame: 0, sourceEndFrame: 300 },
        { id: "s2", sourceMediaId: "m2", sourceStartFrame: 0, sourceEndFrame: 200 },
      ]);

      const withCrossfade = computeSequenceTimeline([
        { id: "s1", sourceMediaId: "m1", sourceStartFrame: 0, sourceEndFrame: 300 },
        {
          id: "s2",
          sourceMediaId: "m2",
          sourceStartFrame: 0,
          sourceEndFrame: 200,
          transition: { type: "crossfade", durationFrames: 30 },
        },
      ]);

      expect(withoutCrossfade.totalDuration - withCrossfade.totalDuration).toBe(30);
    });

    test("empty segments array returns totalDuration 0 and empty positions", () => {
      const result = computeSequenceTimeline([]);

      expect(result.positions).toEqual([]);
      expect(result.totalDuration).toBe(0);
    });

    test("two segments with hard cuts are contiguous", () => {
      const result = computeSequenceTimeline([
        { id: "s1", sourceMediaId: "m1", sourceStartFrame: 0, sourceEndFrame: 300 },
        { id: "s2", sourceMediaId: "m2", sourceStartFrame: 0, sourceEndFrame: 200 },
      ]);

      expect(result.positions).toEqual([
        { segmentId: "s1", sequenceStartFrame: 0, sequenceEndFrame: 300 },
        { segmentId: "s2", sequenceStartFrame: 300, sequenceEndFrame: 500 },
      ]);
      expect(result.totalDuration).toBe(500);
    });
  });

  describe("mapSequenceFrameToSource", () => {
    test("returns correct segment and source frame for frame in first segment", () => {
      const segments = [
        { id: "s1", sourceMediaId: "m1", sourceStartFrame: 100, sourceEndFrame: 400 },
        { id: "s2", sourceMediaId: "m2", sourceStartFrame: 0, sourceEndFrame: 200 },
      ] as const;
      const timeline = computeSequenceTimeline([...segments]);

      const result = mapSequenceFrameToSource(50, timeline, [...segments]);

      expect(result).toEqual([
        { segmentId: "s1", sourceMediaId: "m1", sourceFrame: 150 },
      ]);
    });
    test("during crossfade overlap returns both segments with correct source frames", () => {
      const segments = [
        { id: "s1", sourceMediaId: "m1", sourceStartFrame: 0, sourceEndFrame: 300 },
        {
          id: "s2",
          sourceMediaId: "m2",
          sourceStartFrame: 0,
          sourceEndFrame: 200,
          transition: { type: "crossfade" as const, durationFrames: 30 },
        },
      ];
      const timeline = computeSequenceTimeline(segments);

      // s1: 0-300, s2: 270-470. Frame 280 is in the overlap region (270-300).
      const result = mapSequenceFrameToSource(280, timeline, segments);

      expect(result).toEqual([
        { segmentId: "s1", sourceMediaId: "m1", sourceFrame: 280 },
        { segmentId: "s2", sourceMediaId: "m2", sourceFrame: 10 },
      ]);
    });

    test("frame exactly at hard-cut segment boundary belongs to second segment", () => {
      const segments = [
        { id: "s1", sourceMediaId: "m1", sourceStartFrame: 0, sourceEndFrame: 300 },
        { id: "s2", sourceMediaId: "m2", sourceStartFrame: 0, sourceEndFrame: 200 },
      ];
      const timeline = computeSequenceTimeline(segments);

      // s1: [0, 300), s2: [300, 500). Frame 300 is the boundary.
      const result = mapSequenceFrameToSource(300, timeline, segments);

      expect(result).toEqual([
        { segmentId: "s2", sourceMediaId: "m2", sourceFrame: 0 },
      ]);
    });

    test("returns correct segment for frame in second segment after hard cut", () => {
      const segments = [
        { id: "s1", sourceMediaId: "m1", sourceStartFrame: 0, sourceEndFrame: 300 },
        { id: "s2", sourceMediaId: "m2", sourceStartFrame: 50, sourceEndFrame: 250 },
      ] as const;
      const timeline = computeSequenceTimeline([...segments]);

      const result = mapSequenceFrameToSource(350, timeline, [...segments]);

      expect(result).toEqual([
        { segmentId: "s2", sourceMediaId: "m2", sourceFrame: 100 },
      ]);
    });
    test("single segment with 0-duration transition is ignored", () => {
      const segments = [
        {
          id: "s1",
          sourceMediaId: "m1",
          sourceStartFrame: 0,
          sourceEndFrame: 300,
          transition: { type: "crossfade" as const, durationFrames: 0 },
        },
      ];
      const timeline = computeSequenceTimeline(segments);

      expect(timeline.positions).toEqual([
        { segmentId: "s1", sequenceStartFrame: 0, sequenceEndFrame: 300 },
      ]);
      expect(timeline.totalDuration).toBe(300);
    });
  });
});
