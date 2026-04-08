import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import "reflect-metadata";
import { setupTestDatabase, teardownTestDatabase, getTestDataSource } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { createTestMedia } from "../../test-utils/setup";
import { Media } from "../library/entity";
import { Shoot } from "../shoots/entity";
import { MediaEdit } from "./entity";
import {
  processNextQueuedEdit,
  resolveOutputPath,
  resolveManagedPath,
  resolveUnmanagedPath,
  type RenderFn,
  type ProcessResult,
} from "./render-pipeline";

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

  const createQueuedEdit = async (sourceMedia: Media, overrides: Partial<MediaEdit> = {}) => {
    const dataSource = getTestDataSource();
    const editRepo = dataSource.getRepository(MediaEdit);
    const edit = editRepo.create({
      sourceMediaId: sourceMedia.id,
      type: "transform",
      operations: [],
      status: "queued",
      ...overrides,
    });
    return editRepo.save(edit);
  };

  // A fake render function that just writes a dummy PNG file
  const fakeRenderFn: RenderFn = async ({ outputPath, onProgress }) => {
    writeFileSync(outputPath, Buffer.from("fake-render-output"));
    if (onProgress) {
      onProgress({ renderedFrames: 1, totalFrames: 1 });
    }
    return { type: "image" as const, duration: null, size: 19 };
  };

  // -----------------------------------------------------------------------
  // Existing integration tests (boundary tests through public interface)
  // -----------------------------------------------------------------------

  test("picks up a queued edit, transitions to rendering, then completed", async () => {
    const sourceMedia = await createTestMedia({ relativePath: "test-media/source.png" });
    const edit = await createQueuedEdit(sourceMedia, {
      operations: [{ type: "watermark", assetId: "a1", x: 0.5, y: 0.5, width: 0.1, opacity: 1 }],
    });

    const result = await processNextQueuedEdit(fakeRenderFn);
    expect(result).not.toBeNull();

    const dataSource = getTestDataSource();
    const editRepo = dataSource.getRepository(MediaEdit);
    const updatedEdit = await editRepo.findOne({ where: { id: edit.id } });
    expect(updatedEdit?.status).toBe("completed");
    expect(updatedEdit?.outputMediaId).not.toBeNull();
    expect(updatedEdit?.error).toBeNull();
  });

  test("creates output Media entity with derivedFromId set", async () => {
    const sourceMedia = await createTestMedia({ relativePath: "test-media/source.png" });
    await createQueuedEdit(sourceMedia, {
      operations: [{ type: "watermark", assetId: "a1", x: 0.5, y: 0.5, width: 0.1, opacity: 1 }],
    });

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
    const edit = await createQueuedEdit(sourceMedia);

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
    const edit1 = await createQueuedEdit(source1);
    const edit2 = await createQueuedEdit(source2);

    const result1 = await processNextQueuedEdit(fakeRenderFn);
    expect(result1?.editId).toBe(edit1.id);

    const result2 = await processNextQueuedEdit(fakeRenderFn);
    expect(result2?.editId).toBe(edit2.id);
  });

  // -----------------------------------------------------------------------
  // Path resolution tests
  // -----------------------------------------------------------------------

  describe("resolveOutputPath", () => {
    test("uses managed path when metadata (package, role, contentRating) is present", async () => {
      const sourceMedia = await createTestMedia({
        relativePath: "test-media/source.mp4",
        name: "source.mp4",
      });
      // Attach a shoot so managed path can use it
      const dataSource = getTestDataSource();
      const shootRepo = dataSource.getRepository(Shoot);
      const shoot = shootRepo.create({
        name: "test-shoot",
        shootDate: new Date("2026-04-08"),
        media: [sourceMedia],
      });
      await shootRepo.save(shoot);

      // Reload with shoots relation
      const mediaRepo = dataSource.getRepository(Media);
      const loaded = await mediaRepo.findOne({
        where: { id: sourceMedia.id },
        relations: { shoots: true },
      });

      expect(loaded).not.toBeNull();
      const edit = { package: "pkg1", role: "main", contentRating: "sfw" } as MediaEdit;
      const path = await resolveOutputPath(loaded as Media, edit);

      // Managed path format: YYYY/YYYY-MM-DD_shootname/YYYY-MM-DD_shootname_pkg_role_cr.ext
      expect(path).toContain("2026");
      expect(path).toContain("test-shoot");
      expect(path).toContain("pkg1");
      expect(path).toContain("main");
      expect(path).toContain("sfw");
      expect(path).toEndWith(".mp4");
    });

    test("uses unmanaged path when metadata is missing", async () => {
      const sourceMedia = await createTestMedia({
        relativePath: "some/dir/source.mp4",
        name: "source.mp4",
      });
      // Reload with shoots
      const dataSource = getTestDataSource();
      const mediaRepo = dataSource.getRepository(Media);
      const loaded = await mediaRepo.findOne({
        where: { id: sourceMedia.id },
        relations: { shoots: true },
      });

      expect(loaded).not.toBeNull();
      const edit = { package: null, role: null, contentRating: null } as unknown as MediaEdit;
      const path = await resolveOutputPath(loaded as Media, edit);

      expect(path).toStartWith("some/dir/");
      expect(path).toContain("source_edit_");
      expect(path).toEndWith(".mp4");
    });
  });

  describe("resolveManagedPath", () => {
    test("falls back to source basename when no shoot exists", async () => {
      const sourceMedia = await createTestMedia({
        relativePath: "test-media/my-clip.mp4",
        name: "my-clip.mp4",
      });
      // No shoots attached — shoots will be undefined/empty
      const dataSource = getTestDataSource();
      const mediaRepo = dataSource.getRepository(Media);
      const loaded = await mediaRepo.findOne({
        where: { id: sourceMedia.id },
        relations: { shoots: true },
      });

      expect(loaded).not.toBeNull();
      const edit = { package: "pkg", role: "role", contentRating: "nsfw" } as MediaEdit;
      const path = await resolveManagedPath(loaded as Media, edit);

      // Should use source basename as shoot name fallback
      expect(path).toContain("my-clip");
      expect(path).toContain("pkg");
      expect(path).toContain("role");
      expect(path).toContain("nsfw");
      expect(path).toEndWith(".mp4");
    });
  });

  describe("resolveUnmanagedPath", () => {
    test("appends _edit_<uuid> suffix in the source directory", () => {
      const sourceMedia = {
        relativePath: "photos/vacation/beach.jpg",
        name: "beach.jpg",
      } as Media;

      const path = resolveUnmanagedPath(sourceMedia);

      expect(path).toStartWith("photos/vacation/");
      expect(path).toContain("beach_edit_");
      expect(path).toEndWith(".jpg");
      // UUID slice is 8 chars
      expect(path).toMatch(/beach_edit_[a-f0-9]{8}\.jpg$/);
    });

    test("defaults to .mp4 extension when source has none", () => {
      const sourceMedia = {
        relativePath: "media/noext",
        name: "noext",
      } as Media;

      const path = resolveUnmanagedPath(sourceMedia);

      expect(path).toEndWith(".mp4");
    });
  });

  // -----------------------------------------------------------------------
  // Result handling tests (through public interface)
  // -----------------------------------------------------------------------

  test("output Media gets correct metadata from edit", async () => {
    const sourceMedia = await createTestMedia({ relativePath: "test-media/src.png" });
    await createQueuedEdit(sourceMedia, {
      package: "premium",
      role: "teaser",
      contentRating: "nsfw",
    });

    await processNextQueuedEdit(fakeRenderFn);

    const dataSource = getTestDataSource();
    const mediaRepo = dataSource.getRepository(Media);
    const outputs = await mediaRepo.find({ where: { derivedFromId: sourceMedia.id } });
    expect(outputs).toHaveLength(1);
    expect(outputs[0]?.package).toBe("premium");
    expect(outputs[0]?.role).toBe("teaser");
    expect(outputs[0]?.contentRating).toBe("nsfw");
    expect(outputs[0]?.isManaged).toBe(true);
  });

  test("output Media is not managed when metadata is absent", async () => {
    const sourceMedia = await createTestMedia({ relativePath: "test-media/src2.png" });
    await createQueuedEdit(sourceMedia);

    await processNextQueuedEdit(fakeRenderFn);

    const dataSource = getTestDataSource();
    const mediaRepo = dataSource.getRepository(Media);
    const outputs = await mediaRepo.find({ where: { derivedFromId: sourceMedia.id } });
    expect(outputs).toHaveLength(1);
    expect(outputs[0]?.isManaged).toBe(false);
    expect(outputs[0]?.package).toBeNull();
  });

  test("links output to same shoot as source", async () => {
    const sourceMedia = await createTestMedia({ relativePath: "test-media/src3.png" });

    // Create a shoot and link source media to it
    const dataSource = getTestDataSource();
    const shootRepo = dataSource.getRepository(Shoot);
    const shoot = shootRepo.create({
      name: "my-shoot",
      shootDate: new Date("2026-01-15"),
      media: [sourceMedia],
    });
    await shootRepo.save(shoot);

    await createQueuedEdit(sourceMedia);
    await processNextQueuedEdit(fakeRenderFn);

    // Reload shoot with media
    const updatedShoot = await shootRepo.findOne({
      where: { id: shoot.id },
      relations: { media: true },
    });
    // Should have both source and output media
    expect(updatedShoot?.media.length).toBe(2);
  });

  test("skips shoot linking when source has no shoots", async () => {
    const sourceMedia = await createTestMedia({ relativePath: "test-media/src4.png" });
    await createQueuedEdit(sourceMedia);

    const result = await processNextQueuedEdit(fakeRenderFn);
    // Should still complete successfully
    expect(result).not.toBeNull();

    const dataSource = getTestDataSource();
    const editRepo = dataSource.getRepository(MediaEdit);
    expect(result).not.toBeNull();
    const updatedEdit = await editRepo.findOne({ where: { id: (result as ProcessResult).editId } });
    expect(updatedEdit?.status).toBe("completed");
  });

  test("transitions to failed when source media does not exist", async () => {
    // Create a valid edit, then point its sourceMediaId to a nonexistent ID
    // via raw SQL to bypass the FK constraint (simulates a race condition)
    const sourceMedia = await createTestMedia({ relativePath: "test-media/ephemeral.png" });
    const edit = await createQueuedEdit(sourceMedia);

    const dataSource = getTestDataSource();
    await dataSource.query(`PRAGMA foreign_keys = OFF`);
    await dataSource.query(
      `UPDATE media_edit SET sourceMediaId = 'nonexistent-id' WHERE id = ?`,
      [edit.id],
    );
    await dataSource.query(`PRAGMA foreign_keys = ON`);

    const result = await processNextQueuedEdit(fakeRenderFn);
    expect(result).toBeNull();

    const editRepo = dataSource.getRepository(MediaEdit);
    const updatedEdit = await editRepo.findOne({ where: { id: edit.id } });
    expect(updatedEdit?.status).toBe("failed");
    expect(updatedEdit?.error).toContain("not found");
  });
});
