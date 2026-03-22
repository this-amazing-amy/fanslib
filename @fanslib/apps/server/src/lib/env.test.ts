import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import "reflect-metadata";

describe("env()", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear relevant env vars before each test
    delete process.env.MEDIA_PATH;
    delete process.env.LIBRARY_PATH;
    // Reset module cache so env() re-reads process.env
    delete require.cache[require.resolve("./env")];
  });

  afterEach(() => {
    // Restore original env
    process.env.MEDIA_PATH = originalEnv.MEDIA_PATH;
    process.env.LIBRARY_PATH = originalEnv.LIBRARY_PATH;
  });

  test("uses MEDIA_PATH when set", async () => {
    process.env.MEDIA_PATH = "/media/path";
    process.env.APPDATA_PATH = process.env.APPDATA_PATH ?? "/tmp/appdata";
    // Dynamic import to get fresh module
    const { env } = await import("./env");
    expect(env().mediaPath).toBe("/media/path");
  });

  test("falls back to LIBRARY_PATH when MEDIA_PATH is not set", async () => {
    process.env.LIBRARY_PATH = "/library/path";
    process.env.APPDATA_PATH = process.env.APPDATA_PATH ?? "/tmp/appdata";
    const { env } = await import("./env");
    expect(env().mediaPath).toBe("/library/path");
  });

  test("MEDIA_PATH takes precedence over LIBRARY_PATH", async () => {
    process.env.MEDIA_PATH = "/media/path";
    process.env.LIBRARY_PATH = "/library/path";
    process.env.APPDATA_PATH = process.env.APPDATA_PATH ?? "/tmp/appdata";
    const { env } = await import("./env");
    expect(env().mediaPath).toBe("/media/path");
  });

  test("throws when neither MEDIA_PATH nor LIBRARY_PATH is set", async () => {
    process.env.APPDATA_PATH = process.env.APPDATA_PATH ?? "/tmp/appdata";
    const { env } = await import("./env");
    expect(() => env()).toThrow();
  });
});
