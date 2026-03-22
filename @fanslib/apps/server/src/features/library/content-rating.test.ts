import { describe, expect, test } from "bun:test";
import {
  ContentRatingSchema,
  type ContentRating,
  compareContentRating,
  CONTENT_RATINGS,
} from "./content-rating";

describe("Content Rating", () => {
  describe("ContentRatingSchema", () => {
    test("accepts valid content rating codes", () => {
      (["xt", "uc", "cn", "sg", "sf"] as const).forEach((code) => {
        expect(ContentRatingSchema.parse(code)).toBe(code);
      });
    });

    test("rejects invalid content rating codes", () => {
      expect(() => ContentRatingSchema.parse("invalid")).toThrow();
      expect(() => ContentRatingSchema.parse("")).toThrow();
      expect(() => ContentRatingSchema.parse("XX")).toThrow();
    });
  });

  describe("CONTENT_RATINGS", () => {
    test("contains all five ratings in descending order", () => {
      expect(CONTENT_RATINGS).toEqual(["xt", "uc", "cn", "sg", "sf"]);
    });
  });

  describe("compareContentRating", () => {
    test("xt is greater than all others", () => {
      expect(compareContentRating("xt", "uc")).toBeGreaterThan(0);
      expect(compareContentRating("xt", "cn")).toBeGreaterThan(0);
      expect(compareContentRating("xt", "sg")).toBeGreaterThan(0);
      expect(compareContentRating("xt", "sf")).toBeGreaterThan(0);
    });

    test("sf is less than all others", () => {
      expect(compareContentRating("sf", "xt")).toBeLessThan(0);
      expect(compareContentRating("sf", "uc")).toBeLessThan(0);
      expect(compareContentRating("sf", "cn")).toBeLessThan(0);
      expect(compareContentRating("sf", "sg")).toBeLessThan(0);
    });

    test("equal ratings return zero", () => {
      (["xt", "uc", "cn", "sg", "sf"] as ContentRating[]).forEach((code) => {
        expect(compareContentRating(code, code)).toBe(0);
      });
    });

    test("maintains full ordering xt > uc > cn > sg > sf", () => {
      expect(compareContentRating("xt", "uc")).toBeGreaterThan(0);
      expect(compareContentRating("uc", "cn")).toBeGreaterThan(0);
      expect(compareContentRating("cn", "sg")).toBeGreaterThan(0);
      expect(compareContentRating("sg", "sf")).toBeGreaterThan(0);
    });

    test("can be used to sort an array of ratings", () => {
      const shuffled: ContentRating[] = ["sf", "xt", "cn", "sg", "uc"];
      const sorted = [...shuffled].sort((a, b) => compareContentRating(b, a));
      expect(sorted).toEqual(["xt", "uc", "cn", "sg", "sf"]);
    });
  });
});
