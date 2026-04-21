import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import "reflect-metadata";
import {
  clearAllTables,
  getTestDataSource,
  setupTestDatabase,
  teardownTestDatabase,
} from "../../../../lib/test-db";
import { Shoot } from "../../../shoots/entity";
import { Media } from "../../entity";
import { finalizeUploadedMedia } from "./index";

const TEST_ROOT = path.join(tmpdir(), `finalize-uploaded-media-test-${process.pid}`);

const createShoot = async (overrides: Partial<Shoot> = {}) => {
  const ds = getTestDataSource();
  const repo = ds.getRepository(Shoot);
  return repo.save(
    repo.create({
      name: "Finalize Test",
      shootDate: new Date("2026-04-20"),
      ...overrides,
    }),
  );
};

const stageFile = (filename: string, body: string) => {
  const stagedPath = path.join(TEST_ROOT, ".tus-incoming", filename);
  writeFileSync(stagedPath, body);
  return stagedPath;
};

describe("finalizeUploadedMedia", () => {
  beforeAll(async () => {
    process.env.APPDATA_PATH = TEST_ROOT;
    process.env.MEDIA_PATH = TEST_ROOT;
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
    rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  beforeEach(async () => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(path.join(TEST_ROOT, ".tus-incoming"), { recursive: true });
    await clearAllTables();
  });

  test("moves staged file into shoots/ and returns a persisted Media row attached to the shoot", async () => {
    const shoot = await createShoot();
    const staged = stageFile("tus-abc123", "image-bytes");

    const media = await finalizeUploadedMedia({
      stagedAbsolutePath: staged,
      originalName: "photo.jpg",
      shootId: shoot.id,
      category: "library",
    });

    expect(media.name).toBe("photo.jpg");
    expect(media.type).toBe("image");
    expect(media.category).toBe("library");
    expect(media.relativePath).toBe("shoots/2026-04-20_finalize-test/photo.jpg");

    const finalPath = path.join(TEST_ROOT, "shoots", "2026-04-20_finalize-test", "photo.jpg");
    expect(existsSync(finalPath)).toBe(true);
    expect(existsSync(staged)).toBe(false);

    const ds = getTestDataSource();
    const persisted = await ds.getRepository(Media).findOne({ where: { id: media.id } });
    expect(persisted).not.toBeNull();

    const shootWithMedia = await ds
      .getRepository(Shoot)
      .findOne({ where: { id: shoot.id }, relations: { media: true } });
    expect(shootWithMedia?.media.map((m) => m.id)).toContain(media.id);
  });

  test("resolves a unique filename when the target already exists", async () => {
    const shoot = await createShoot();
    const targetDir = path.join(TEST_ROOT, "shoots", "2026-04-20_finalize-test");
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(path.join(targetDir, "photo.jpg"), "existing");

    const staged = stageFile("tus-new", "new-bytes");

    const media = await finalizeUploadedMedia({
      stagedAbsolutePath: staged,
      originalName: "photo.jpg",
      shootId: shoot.id,
    });

    expect(media.name).toBe("photo_1.jpg");
    expect(media.relativePath).toBe("shoots/2026-04-20_finalize-test/photo_1.jpg");
    expect(existsSync(path.join(targetDir, "photo.jpg"))).toBe(true);
    expect(existsSync(path.join(targetDir, "photo_1.jpg"))).toBe(true);
  });

  test("rejects unsupported extensions without moving the file or creating a Media row", async () => {
    const shoot = await createShoot();
    const staged = stageFile("tus-bad", "doc-bytes");

    await expect(
      finalizeUploadedMedia({
        stagedAbsolutePath: staged,
        originalName: "notes.psd",
        shootId: shoot.id,
      }),
    ).rejects.toThrow(/Unsupported/i);

    expect(existsSync(staged)).toBe(true);
    const ds = getTestDataSource();
    const count = await ds.getRepository(Media).count();
    expect(count).toBe(0);
  });

  test("rejects a missing shoot without touching the filesystem or creating a Media row", async () => {
    const staged = stageFile("tus-noshoot", "bytes");

    await expect(
      finalizeUploadedMedia({
        stagedAbsolutePath: staged,
        originalName: "photo.jpg",
        shootId: "does-not-exist",
      }),
    ).rejects.toThrow(/not found/i);

    expect(existsSync(staged)).toBe(true);
    const ds = getTestDataSource();
    const count = await ds.getRepository(Media).count();
    expect(count).toBe(0);
  });

  test("source file is moved, not copied — no staged file remains after success", async () => {
    const shoot = await createShoot();
    const staged = stageFile("tus-move", "contents");

    await finalizeUploadedMedia({
      stagedAbsolutePath: staged,
      originalName: "moved.jpg",
      shootId: shoot.id,
    });

    expect(existsSync(staged)).toBe(false);
  });
});
