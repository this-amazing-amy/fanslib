import { describe, expect, test } from "vitest";
import { intersectOperationsWithClip } from "./clip-intersection";
import type { Track } from "@fanslib/video/types";
import type { ClipRange } from "~/stores/clipStore";

const makeTrack = (name: string, operations: Track["operations"]): Track => ({
  id: `track-${name}`,
  name,
  operations,
});

const clip: ClipRange = { startFrame: 100, endFrame: 400 };

describe("intersectOperationsWithClip", () => {
  test("includes operation fully inside clip with remapped frames", () => {
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
          endFrame: 300,
        },
      ]),
    ];

    const result = intersectOperationsWithClip(tracks, clip);

    expect(result).toHaveLength(1);
    expect(result[0].operations).toHaveLength(1);
    const op = result[0].operations[0] as { startFrame: number; endFrame: number };
    expect(op.startFrame).toBe(50); // 150 - 100
    expect(op.endFrame).toBe(200); // 300 - 100
  });

  test("excludes operation fully outside clip", () => {
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

    const result = intersectOperationsWithClip(tracks, clip);

    expect(result).toHaveLength(0); // empty track excluded
  });

  test("clamps partially overlapping operation to clip boundaries", () => {
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

    const result = intersectOperationsWithClip(tracks, clip);

    expect(result).toHaveLength(1);
    const op = result[0].operations[0] as { startFrame: number; endFrame: number };
    expect(op.startFrame).toBe(0); // clamped to clip start
    expect(op.endFrame).toBe(150); // 250 - 100
  });

  test("remaps keyframes by clip start offset", () => {
    const tracks = [
      makeTrack("T1", [
        {
          type: "zoom",
          id: "op1",
          scale: 1.5,
          centerX: 0.5,
          centerY: 0.5,
          startFrame: 100,
          endFrame: 400,
          keyframes: [
            { frame: 150, values: { scale: 1 } },
            { frame: 300, values: { scale: 2 } },
          ],
        },
      ]),
    ];

    const result = intersectOperationsWithClip(tracks, clip);

    expect(result).toHaveLength(1);
    const op = result[0].operations[0] as { keyframes: Array<{ frame: number }> };
    expect(op.keyframes[0].frame).toBe(50); // 150 - 100
    expect(op.keyframes[1].frame).toBe(200); // 300 - 100
  });

  test("preserves track structure with id and name", () => {
    const tracks = [
      makeTrack("My Track", [
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
          endFrame: 300,
        },
      ]),
    ];

    const result = intersectOperationsWithClip(tracks, clip);

    expect(result[0].id).toBe("track-My Track");
    expect(result[0].name).toBe("My Track");
  });

  test("excludes empty tracks from output", () => {
    const tracks = [
      makeTrack("Empty", [
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
      makeTrack("HasOps", [
        {
          type: "caption",
          id: "op2",
          text: "World",
          x: 0.5,
          y: 0.5,
          fontSize: 0.05,
          color: "#fff",
          animation: "fade-in" as const,
          startFrame: 150,
          endFrame: 300,
        },
      ]),
    ];

    const result = intersectOperationsWithClip(tracks, clip);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("HasOps");
  });

  test("handles empty tracks input", () => {
    const result = intersectOperationsWithClip([], clip);
    expect(result).toHaveLength(0);
  });

  test("handles multiple tracks with mixed overlap", () => {
    const tracks = [
      makeTrack("T1", [
        {
          type: "caption",
          id: "op1",
          text: "Inside",
          x: 0.5,
          y: 0.5,
          fontSize: 0.05,
          color: "#fff",
          animation: "fade-in" as const,
          startFrame: 200,
          endFrame: 300,
        },
        {
          type: "caption",
          id: "op2",
          text: "Outside",
          x: 0.5,
          y: 0.5,
          fontSize: 0.05,
          color: "#fff",
          animation: "fade-in" as const,
          startFrame: 500,
          endFrame: 600,
        },
      ]),
      makeTrack("T2", [
        {
          type: "caption",
          id: "op3",
          text: "Overlap",
          x: 0.5,
          y: 0.5,
          fontSize: 0.05,
          color: "#fff",
          animation: "fade-in" as const,
          startFrame: 350,
          endFrame: 500,
        },
      ]),
    ];

    const result = intersectOperationsWithClip(tracks, clip);

    expect(result).toHaveLength(2);
    expect(result[0].operations).toHaveLength(1); // only op1
    expect(result[1].operations).toHaveLength(1); // op3 clamped
    const op3 = result[1].operations[0] as { startFrame: number; endFrame: number };
    expect(op3.startFrame).toBe(250); // 350 - 100
    expect(op3.endFrame).toBe(300); // clamped to 400 - 100 = 300
  });

  test("handles boundary: operation starts exactly at clip start", () => {
    const tracks = [
      makeTrack("T1", [
        {
          type: "caption",
          id: "op1",
          text: "Boundary",
          x: 0.5,
          y: 0.5,
          fontSize: 0.05,
          color: "#fff",
          animation: "fade-in" as const,
          startFrame: 100,
          endFrame: 200,
        },
      ]),
    ];

    const result = intersectOperationsWithClip(tracks, clip);

    expect(result).toHaveLength(1);
    const op = result[0].operations[0] as { startFrame: number; endFrame: number };
    expect(op.startFrame).toBe(0);
    expect(op.endFrame).toBe(100);
  });

  test("handles boundary: operation ends exactly at clip end", () => {
    const tracks = [
      makeTrack("T1", [
        {
          type: "caption",
          id: "op1",
          text: "Boundary",
          x: 0.5,
          y: 0.5,
          fontSize: 0.05,
          color: "#fff",
          animation: "fade-in" as const,
          startFrame: 300,
          endFrame: 400,
        },
      ]),
    ];

    const result = intersectOperationsWithClip(tracks, clip);

    expect(result).toHaveLength(1);
    const op = result[0].operations[0] as { startFrame: number; endFrame: number };
    expect(op.startFrame).toBe(200);
    expect(op.endFrame).toBe(300);
  });
});
