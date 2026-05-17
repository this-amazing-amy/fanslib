import { describe, expect, test } from "bun:test";
import {
  parseShootFolder,
  parseShootFromRelativePath,
  shouldEnterShootLayout,
} from "./shoot-layout";

describe("parseShootFolder", () => {
  test("parses a well-formed shoot folder name", () => {
    expect(parseShootFolder("2024-07-21_Sweaty Tits")).toEqual({
      date: "2024-07-21",
      shortName: "Sweaty Tits",
    });
  });

  test("accepts names with extra underscores", () => {
    expect(parseShootFolder("2026-03-15_Foo_Bar_Baz")).toEqual({
      date: "2026-03-15",
      shortName: "Foo_Bar_Baz",
    });
  });

  test("rejects names without a date prefix", () => {
    expect(parseShootFolder("Sweaty Tits")).toBeNull();
  });

  test("rejects names with malformed date", () => {
    expect(parseShootFolder("2024-7-21_Foo")).toBeNull();
    expect(parseShootFolder("24-07-21_Foo")).toBeNull();
  });

  test("rejects date-only names", () => {
    expect(parseShootFolder("2024-07-21")).toBeNull();
  });

  test("rejects empty short name after the date", () => {
    expect(parseShootFolder("2024-07-21_")).toBeNull();
  });
});

describe("shouldEnterShootLayout", () => {
  test("enters shoot dirs at the root", () => {
    expect(shouldEnterShootLayout("2024-07-21_Sweaty Tits")).toBe(true);
  });

  test("does not enter non-shoot dirs at the root", () => {
    expect(shouldEnterShootLayout("Assets")).toBe(false);
    expect(shouldEnterShootLayout("library")).toBe(false);
  });

  test("enters only 02_Content inside a shoot dir", () => {
    expect(shouldEnterShootLayout("2024-07-21_Sweaty Tits/02_Content")).toBe(true);
    expect(shouldEnterShootLayout("2024-07-21_Sweaty Tits/01_Footage")).toBe(false);
    expect(shouldEnterShootLayout("2024-07-21_Sweaty Tits/03_Working")).toBe(false);
  });

  test("enters subdirs inside 02_Content", () => {
    expect(shouldEnterShootLayout("2024-07-21_Sweaty Tits/02_Content/raw")).toBe(true);
    expect(shouldEnterShootLayout("2024-07-21_Sweaty Tits/02_Content/raw/deep")).toBe(true);
  });

  test("rejects anything two levels deep that's not under a valid shoot", () => {
    expect(shouldEnterShootLayout("Assets/Logos")).toBe(false);
  });
});

describe("parseShootFromRelativePath", () => {
  test("parses a file under <date>_<name>/02_Content/", () => {
    expect(
      parseShootFromRelativePath("2024-07-21_Sweaty Tits/02_Content/20240721_085159.jpg"),
    ).toEqual({
      date: "2024-07-21",
      shortName: "Sweaty Tits",
    });
  });

  test("parses files in deeper subfolders of 02_Content", () => {
    expect(
      parseShootFromRelativePath("2024-07-21_Sweaty Tits/02_Content/raw/foo.jpg"),
    ).toEqual({
      date: "2024-07-21",
      shortName: "Sweaty Tits",
    });
  });

  test("returns null when the file is under 01_Footage", () => {
    expect(
      parseShootFromRelativePath("2024-07-21_Sweaty Tits/01_Footage/foo.mov"),
    ).toBeNull();
  });

  test("returns null when path is not in a shoot folder", () => {
    expect(parseShootFromRelativePath("Assets/Logos/foo.png")).toBeNull();
  });

  test("returns null when path is too shallow", () => {
    expect(parseShootFromRelativePath("2024-07-21_Sweaty Tits/foo.jpg")).toBeNull();
  });
});
