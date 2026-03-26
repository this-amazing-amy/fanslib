import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import "reflect-metadata";
import { setupTestDatabase, teardownTestDatabase, getTestDataSource } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { createTestMedia } from "../../test-utils/setup";
import { Media } from "../library/entity";
import { MediaEdit } from "./entity";
import { processNextQueuedEdit, type RenderFn } from "./render-pipeline";

const FIXTURES_DIR = join(import.meta.dir, "..", "..", "..", "tests", "fixtures");
const TEST_MEDIA_DIR = join(FIXTURES_DIR, "test-media");

describe("Render Pipeline", () => {
  beforeAll(async () => {
    process.env.APPDATA_PATH = FIXTURES_DIR;
    process.env.MEDIA_PATH = TEST_MEDIA_DIR;
    await setupTestDatabase();
    await resetAllFixtures();
    if (!existsSync(TEST_MEDIA_DIR)) mkdirSync(TEST_MEDIA_DIR, { recursive: true });
  });

  afterAll(async () => {
    await teardownTestDatabase();
    if (existsSync(TEST_MEDIA_DIR)) rmSync(TEST_MEDIA_DIR, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await resetAllFixtures();
    if (existsSync(TEST_MEDIA_DIR)) rmSync(TEST_MEDIA_DIR, { recursive: true, force: true });
    mkdirSync(TEST_MEDIA_DIR, { recursive: true });
  });

  const createQueuedEdit = async (sourceMedia: Media, operations: unknown[] = []) => {
    const dataSource = getTestDataSource();
    const editRepo = dataSource.getRepository(MediaEdit);
    const edit = editRepo.create({
      sourceMediaId: sourceMedia.id,
      type: "transform",
      operations,
      status: "queued",
    });
    return editRepo.save(edit);
  };

  // A fake render function that just writes a dummy PNG file
  const fakeRenderFn: RenderFn = async ({ outputPath, onProgress }) => {
    // Write a fake output file
    writeFileSync(outputPath, Buffer.from("fake-render-output"));
    // Report progress
    if (onProgress) {
      onProgress({ renderedFrames: 1, totalFrames: 1 });
    }
    return { type: "image" as const, duration: null, size: 19 };
  };

  test("picks up a queued edit, transitions to rendering, then completed", async () => {
    const sourceMedia = await createTestMedia({ relativePath: "test-media/source.png" });
    const edit = await createQueuedEdit(sourceMedia, [
      { type: "watermark", assetId: "a1", x: 0.5, y: 0.5, width: 0.1, opacity: 1 },
    ]);

    const result = await processNextQueuedEdit(fakeRenderFn);
    expect(result).not.toBeNull();

    // Verify edit status is completed
    const dataSource = getTestDataSource();
    const editRepo = dataSource.getRepository(MediaEdit);
    const updatedEdit = await editRepo.findOne({ where: { id: edit.id } });
    expect(updatedEdit?.status).toBe("completed");
    expect(updatedEdit?.outputMediaId).not.toBeNull();
    expect(updatedEdit?.error).toBeNull();
  });

  test("creates output Media entity with derivedFromId set", async () => {
    const sourceMedia = await createTestMedia({ relativePath: "test-media/source.png" });
    await createQueuedEdit(sourceMedia, [
      { type: "watermark", assetId: "a1", x: 0.5, y: 0.5, width: 0.1, opacity: 1 },
    ]);

    await processNextQueuedEdit(fakeRenderFn);

    const dataSource = getTestDataSource();
    const mediaRepo = dataSource.getRepository(Media);
    const outputMedias = await mediaRepo.find({ where: { derivedFromId: sourceMedia.id } });
    expect(outputMedias).toHaveLength(1);
    expect(outputMedias[0]?.type).toBe("image");
    expect(outputMedias[0]?.derivedFromId).toBe(sourceMedia.id);
  });

  test("returns null when no queued edits exist", async () => {
    const result = await processNextQueuedEdit(fakeRenderFn);
    expect(result).toBeNull();
  });

  test("sets error field when render fails", async () => {
    const sourceMedia = await createTestMedia({ relativePath: "test-media/source.png" });
    const edit = await createQueuedEdit(sourceMedia, []);

    const failingRenderFn: RenderFn = async () => {
      throw new Error("Render exploded");
    };

    await processNextQueuedEdit(failingRenderFn);

    const dataSource = getTestDataSource();
    const editRepo = dataSource.getRepository(MediaEdit);
    const updatedEdit = await editRepo.findOne({ where: { id: edit.id } });
    expect(updatedEdit?.status).toBe("failed");
    expect(updatedEdit?.error).toContain("Render exploded");
    expect(updatedEdit?.outputMediaId).toBeNull();
  });

  test("processes edits sequentially (oldest first)", async () => {
    const source1 = await createTestMedia({ relativePath: "test-media/s1.png" });
    const source2 = await createTestMedia({ relativePath: "test-media/s2.png" });
    const edit1 = await createQueuedEdit(source1, []);
    const edit2 = await createQueuedEdit(source2, []);

    // Process first
    const result1 = await processNextQueuedEdit(fakeRenderFn);
    expect(result1?.editId).toBe(edit1.id);

    // Process second
    const result2 = await processNextQueuedEdit(fakeRenderFn);
    expect(result2?.editId).toBe(edit2.id);
  });
});
