import { describe, expect, it } from "bun:test";
import { flattenTracks } from "./flatten-tracks";

describe("flattenTracks", () => {
  it("flattens operations from tracks when tracks are provided", () => {
    const tracks = [
      { id: "t1", name: "Track 1", operations: [{ type: "blur", id: "op1" }] },
      {
        id: "t2",
        name: "Track 2",
        operations: [
          { type: "crop", id: "op2" },
          { type: "watermark", id: "op3" },
        ],
      },
    ];
    const legacyOps = [{ type: "old", id: "legacy" }];

    const result = flattenTracks(tracks, legacyOps);

    expect(result).toEqual([
      { type: "blur", id: "op1" },
      { type: "crop", id: "op2" },
      { type: "watermark", id: "op3" },
    ]);
  });

  it("falls back to operations when tracks is null", () => {
    const legacyOps = [{ type: "watermark", id: "op1" }];

    const result = flattenTracks(null, legacyOps);

    expect(result).toEqual(legacyOps);
  });

  it("falls back to operations when tracks is undefined", () => {
    const legacyOps = [{ type: "blur", id: "op1" }];

    const result = flattenTracks(undefined, legacyOps);

    expect(result).toEqual(legacyOps);
  });

  it("falls back to operations when tracks is an empty array", () => {
    const legacyOps = [{ type: "crop", id: "op1" }];

    const result = flattenTracks([], legacyOps);

    expect(result).toEqual(legacyOps);
  });

  it("falls back to operations when tracks contains non-track objects", () => {
    const notTracks = [{ foo: "bar" }];
    const legacyOps = [{ type: "watermark", id: "op1" }];

    const result = flattenTracks(notTracks, legacyOps);

    expect(result).toEqual(legacyOps);
  });

  it("returns empty array when both tracks and operations are empty", () => {
    const result = flattenTracks([], []);

    expect(result).toEqual([]);
  });

  it("handles tracks with empty operations arrays", () => {
    const tracks = [
      { id: "t1", name: "Track 1", operations: [] },
      { id: "t2", name: "Track 2", operations: [{ type: "blur", id: "op1" }] },
    ];

    const result = flattenTracks(tracks, []);

    expect(result).toEqual([{ type: "blur", id: "op1" }]);
  });
});
