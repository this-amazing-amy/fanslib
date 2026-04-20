import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync, utimesSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { cleanAbandonedTusStaging } from "./index";

const TEST_ROOT = path.join(tmpdir(), `cleanup-tus-staging-test-${process.pid}`);
const STAGING_DIR = path.join(TEST_ROOT, ".tus-incoming");

const seedFile = (name: string, ageInDays: number) => {
  const filePath = path.join(STAGING_DIR, name);
  writeFileSync(filePath, "x");
  const mtime = new Date(Date.now() - ageInDays * 24 * 60 * 60 * 1000);
  utimesSync(filePath, mtime, mtime);
  return filePath;
};

describe("cleanAbandonedTusStaging", () => {
  beforeEach(() => {
    process.env.APPDATA_PATH = TEST_ROOT;
    process.env.MEDIA_PATH = TEST_ROOT;
    rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(STAGING_DIR, { recursive: true });
  });

  afterAll(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  test("deletes files older than 7 days and keeps newer files", async () => {
    const old = seedFile("old-chunk", 8);
    const olderSidecar = seedFile("old-chunk.json", 8);
    const fresh = seedFile("fresh-chunk", 1);
    const freshSidecar = seedFile("fresh-chunk.json", 1);

    await cleanAbandonedTusStaging();

    expect(existsSync(old)).toBe(false);
    expect(existsSync(olderSidecar)).toBe(false);
    expect(existsSync(fresh)).toBe(true);
    expect(existsSync(freshSidecar)).toBe(true);
  });

  test("is a no-op if the staging directory does not exist", async () => {
    rmSync(STAGING_DIR, { recursive: true, force: true });
    await expect(cleanAbandonedTusStaging()).resolves.toBeUndefined();
  });
});
