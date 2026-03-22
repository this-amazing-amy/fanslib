import { describe, expect, test } from "bun:test";
import { parseFilename } from "./parse-filename";

describe("parseFilename", () => {
  test("parses a 5-part filename into all fields", () => {
    const result = parseFilename("2025-01-15_Beach Shoot_main_content_uc.mp4");
    expect(result).toEqual({
      date: "2025-01-15",
      shootName: "Beach Shoot",
      package: "main",
      role: "content",
      contentRating: "uc",
      seq: null,
    });
  });

  test("parses a 6-part filename with numeric sequence number", () => {
    const result = parseFilename("2025-01-15_Oil Anal_clip1_trailer_xt_3.mp4");
    expect(result).toEqual({
      date: "2025-01-15",
      shootName: "Oil Anal",
      package: "clip1",
      role: "trailer",
      contentRating: "xt",
      seq: 3,
    });
  });

  test("returns all-null for filenames with fewer than 5 parts", () => {
    const result = parseFilename("simple-photo.jpg");
    expect(result).toEqual({
      date: null,
      shootName: null,
      package: null,
      role: null,
      contentRating: null,
      seq: null,
    });
  });

  test("returns all-null for 4-part filename", () => {
    const result = parseFilename("2025-01-15_shoot_main_content.mp4");
    expect(result).toEqual({
      date: null,
      shootName: null,
      package: null,
      role: null,
      contentRating: null,
      seq: null,
    });
  });

  test("returns all-null for 6-part filename with non-numeric last part", () => {
    const result = parseFilename("2025-01-15_shoot_main_content_uc_extra.mp4");
    expect(result).toEqual({
      date: null,
      shootName: null,
      package: null,
      role: null,
      contentRating: null,
      seq: null,
    });
  });

  test("sets contentRating to null for unknown rating code", () => {
    const result = parseFilename("2025-01-15_shoot_main_content_xx.mp4");
    expect(result.contentRating).toBeNull();
    expect(result.date).toBe("2025-01-15");
  });

  test("handles various file extensions", () => {
    expect(parseFilename("2025-01-15_shoot_main_content_sf.jpg").contentRating).toBe("sf");
    expect(parseFilename("2025-01-15_shoot_main_content_sf.jpeg").contentRating).toBe("sf");
    expect(parseFilename("2025-01-15_shoot_main_content_sf.png").contentRating).toBe("sf");
    expect(parseFilename("2025-01-15_shoot_main_content_sf.webm").contentRating).toBe("sf");
  });

  test("handles filename with no extension", () => {
    const result = parseFilename("2025-01-15_shoot_main_content_cn");
    expect(result).toEqual({
      date: "2025-01-15",
      shootName: "shoot",
      package: "main",
      role: "content",
      contentRating: "cn",
      seq: null,
    });
  });

  test("returns all-null for more than 6 parts", () => {
    const result = parseFilename("2025-01-15_shoot_main_content_uc_3_extra.mp4");
    expect(result).toEqual({
      date: null,
      shootName: null,
      package: null,
      role: null,
      contentRating: null,
      seq: null,
    });
  });

  test("returns all-null for empty filename", () => {
    const result = parseFilename("");
    expect(result.date).toBeNull();
  });

  test("seq must be >= 2", () => {
    const result = parseFilename("2025-01-15_shoot_main_content_uc_1.mp4");
    expect(result).toEqual({
      date: null,
      shootName: null,
      package: null,
      role: null,
      contentRating: null,
      seq: null,
    });
  });

  test("seq rejects non-integer numbers", () => {
    const result = parseFilename("2025-01-15_shoot_main_content_uc_2.5.mp4");
    expect(result.seq).toBeNull();
  });
});
