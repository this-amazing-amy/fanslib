import { describe, expect, test } from "bun:test";
import { identifyFypTrackableId, isFypTrackable } from "./preview-heuristic";

describe("identifyFypTrackableId", () => {
  test("returns the only PostMedia when list has one item", () => {
    const result = identifyFypTrackableId([
      { id: "pm-1", order: 0, mediaType: "video", duration: 60 },
    ]);
    expect(result).toBe("pm-1");
  });

  test("returns the shorter video when post has two videos", () => {
    const result = identifyFypTrackableId([
      { id: "pm-preview", order: 0, mediaType: "video", duration: 15 },
      { id: "pm-full", order: 1, mediaType: "video", duration: 300 },
    ]);
    expect(result).toBe("pm-preview");
  });

  test("returns shorter video regardless of order position", () => {
    const result = identifyFypTrackableId([
      { id: "pm-full", order: 0, mediaType: "video", duration: 300 },
      { id: "pm-preview", order: 1, mediaType: "video", duration: 15 },
    ]);
    expect(result).toBe("pm-preview");
  });

  test("breaks ties by order (lowest order wins)", () => {
    const result = identifyFypTrackableId([
      { id: "pm-a", order: 1, mediaType: "video", duration: 30 },
      { id: "pm-b", order: 0, mediaType: "video", duration: 30 },
    ]);
    expect(result).toBe("pm-b");
  });

  test("returns the single video when mixed with images", () => {
    const result = identifyFypTrackableId([
      { id: "pm-img", order: 0, mediaType: "image", duration: null },
      { id: "pm-vid", order: 1, mediaType: "video", duration: 60 },
    ]);
    expect(result).toBe("pm-vid");
  });

  test("returns lowest-order item for image-only posts", () => {
    const result = identifyFypTrackableId([
      { id: "pm-2", order: 1, mediaType: "image", duration: null },
      { id: "pm-1", order: 0, mediaType: "image", duration: null },
    ]);
    expect(result).toBe("pm-1");
  });

  test("treats null duration as very long (not the preview)", () => {
    const result = identifyFypTrackableId([
      { id: "pm-unknown", order: 0, mediaType: "video", duration: null },
      { id: "pm-preview", order: 1, mediaType: "video", duration: 15 },
    ]);
    expect(result).toBe("pm-preview");
  });

  test("returns null for empty list", () => {
    const result = identifyFypTrackableId([]);
    expect(result).toBeNull();
  });

  test("handles three videos (picks shortest)", () => {
    const result = identifyFypTrackableId([
      { id: "pm-a", order: 0, mediaType: "video", duration: 120 },
      { id: "pm-b", order: 1, mediaType: "video", duration: 10 },
      { id: "pm-c", order: 2, mediaType: "video", duration: 300 },
    ]);
    expect(result).toBe("pm-b");
  });
});

describe("isFypTrackable", () => {
  test("returns true for the identified preview", () => {
    const list = [
      { id: "pm-preview", order: 0, mediaType: "video" as const, duration: 15 },
      { id: "pm-full", order: 1, mediaType: "video" as const, duration: 300 },
    ];
    expect(isFypTrackable("pm-preview", list)).toBe(true);
  });

  test("returns false for a non-preview PostMedia", () => {
    const list = [
      { id: "pm-preview", order: 0, mediaType: "video" as const, duration: 15 },
      { id: "pm-full", order: 1, mediaType: "video" as const, duration: 300 },
    ];
    expect(isFypTrackable("pm-full", list)).toBe(false);
  });

  test("returns true when there is only one PostMedia", () => {
    const list = [{ id: "pm-only", order: 0, mediaType: "video" as const, duration: 60 }];
    expect(isFypTrackable("pm-only", list)).toBe(true);
  });
});
