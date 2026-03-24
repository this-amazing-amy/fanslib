import { describe, expect, test } from "vitest";

import { inferMetadataFromFilename } from "./infer-metadata-from-filename";

describe("inferMetadataFromFilename", () => {
  test("clip sets package clip, role full, rating uc", () => {
    expect(inferMetadataFromFilename("vacation_clip.mp4")).toEqual({
      package: "clip",
      role: "full",
      contentRating: "uc",
    });
  });

  test("short or promo sets role short", () => {
    expect(inferMetadataFromFilename("teaser_short.jpg")).toEqual({ role: "short" });
    expect(inferMetadataFromFilename("promo_banner.png")).toEqual({ role: "short" });
  });

  test("full sets role full and rating uc when clip did not match", () => {
    expect(inferMetadataFromFilename("set_full_take.mkv")).toEqual({
      role: "full",
      contentRating: "uc",
    });
  });

  test("censored sets rating cn but not when filename says uncensored", () => {
    expect(inferMetadataFromFilename("extra_censored_edit.jpg")).toEqual({
      contentRating: "cn",
    });
    expect(inferMetadataFromFilename("uncensored_full.mp4")).not.toEqual(
      expect.objectContaining({ contentRating: "cn" }),
    );
    expect(inferMetadataFromFilename("uncensored_full.mp4")).toEqual({
      role: "full",
      contentRating: "uc",
    });
  });

  test("clip wins over short and full substrings", () => {
    expect(inferMetadataFromFilename("short_clip_promo.mp4")).toEqual({
      package: "clip",
      role: "full",
      contentRating: "uc",
    });
  });

  test("returns empty object when no pattern matches", () => {
    expect(inferMetadataFromFilename("IMG_001.jpg")).toEqual({});
  });
});
