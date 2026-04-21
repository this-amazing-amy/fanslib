import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { walkDirectory } from "./walkDirectory";

const TEST_ROOT = path.join(tmpdir(), `walkDirectory-test-${process.pid}`);

const collect = async (dir: string): Promise<string[]> => {
  // eslint-disable-next-line functional/no-let
  let entries: string[] = [];
  // eslint-disable-next-line functional/no-loop-statements
  for await (const filePath of walkDirectory(dir)) {
    entries = [...entries, filePath];
  }
  return entries;
};

describe("walkDirectory", () => {
  beforeEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(TEST_ROOT, { recursive: true });
  });

  afterAll(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  test("skips directories whose basename starts with a dot", async () => {
    mkdirSync(path.join(TEST_ROOT, "visible"), { recursive: true });
    mkdirSync(path.join(TEST_ROOT, ".tus-incoming"), { recursive: true });

    writeFileSync(path.join(TEST_ROOT, "visible", "a.jpg"), "a");
    writeFileSync(path.join(TEST_ROOT, ".tus-incoming", "partial.bin"), "p");

    const files = await collect(TEST_ROOT);

    expect(files.some((f) => f.endsWith(path.join("visible", "a.jpg")))).toBe(true);
    expect(files.some((f) => f.includes(".tus-incoming"))).toBe(false);
  });

  test("still yields files in non-dot-prefixed directories recursively", async () => {
    mkdirSync(path.join(TEST_ROOT, "shoots", "2026-04-20_demo"), { recursive: true });
    writeFileSync(path.join(TEST_ROOT, "shoots", "2026-04-20_demo", "clip.mp4"), "v");

    const files = await collect(TEST_ROOT);

    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/shoots\/2026-04-20_demo\/clip\.mp4$/);
  });
});
