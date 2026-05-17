import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import "reflect-metadata";
import {
  getTestDataSource,
  setupTestDatabase,
  teardownTestDatabase,
  clearAllTables,
} from "../../../../lib/test-db";
import { Media } from "../../entity";
import { Shoot } from "../../../shoots/entity";
import { applyManagedMetadata } from "./managed-metadata";

describe("applyManagedMetadata (shoot-from-folder linker)", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearAllTables();
  });

  const createTestMedia = async (overrides: Partial<Media> = {}): Promise<Media> => {
    const ds = getTestDataSource();
    const repo = ds.getRepository(Media);
    const media = repo.create({
      relativePath: "2025-01-15_Beach Shoot/02_Content/photo.jpg",
      type: "image" as const,
      name: "photo.jpg",
      size: 1024,
      fileCreationDate: new Date("2025-01-15"),
      fileModificationDate: new Date("2025-01-15"),
      ...overrides,
    });
    return repo.save(media);
  };

  test("creates a Shoot from the folder name and links the Media", async () => {
    const media = await createTestMedia({
      relativePath: "2025-03-10_Oil Anal/02_Content/clip.mp4",
    });

    await applyManagedMetadata(media.id);

    const ds = getTestDataSource();
    const shoots = await ds.getRepository(Shoot).find({ relations: { media: true } });
    expect(shoots).toHaveLength(1);
    expect(shoots[0]?.name).toBe("Oil Anal");
    expect(shoots[0]?.shootDate).toEqual(new Date("2025-03-10"));
    expect(shoots[0]?.media.some((m: Media) => m.id === media.id)).toBe(true);
  });

  test("links to an existing Shoot with matching name and date instead of duplicating", async () => {
    const ds = getTestDataSource();
    const shootRepo = ds.getRepository(Shoot);

    const existing = shootRepo.create({
      name: "Beach Shoot",
      shootDate: new Date("2025-01-15"),
      media: [],
    });
    await shootRepo.save(existing);

    const media = await createTestMedia({
      relativePath: "2025-01-15_Beach Shoot/02_Content/photo.jpg",
    });

    await applyManagedMetadata(media.id);

    const shoots = await shootRepo.find({ relations: { media: true } });
    expect(shoots).toHaveLength(1);
    expect(shoots[0]?.id).toBe(existing.id);
    expect(shoots[0]?.media.some((m: Media) => m.id === media.id)).toBe(true);
  });

  test("two medias under the same shoot share one Shoot row", async () => {
    const m1 = await createTestMedia({
      relativePath: "2025-01-15_Beach Shoot/02_Content/a.jpg",
      name: "a.jpg",
    });
    const m2 = await createTestMedia({
      relativePath: "2025-01-15_Beach Shoot/02_Content/b.jpg",
      name: "b.jpg",
    });

    await applyManagedMetadata(m1.id);
    await applyManagedMetadata(m2.id);

    const ds = getTestDataSource();
    const shoots = await ds.getRepository(Shoot).find({ relations: { media: true } });
    expect(shoots).toHaveLength(1);
    expect(shoots[0]?.media).toHaveLength(2);
  });

  test("re-applying for the same media is idempotent (no duplicate link)", async () => {
    const media = await createTestMedia();

    await applyManagedMetadata(media.id);
    await applyManagedMetadata(media.id);

    const ds = getTestDataSource();
    const shoots = await ds.getRepository(Shoot).find({ relations: { media: true } });
    expect(shoots).toHaveLength(1);
    expect(shoots[0]?.media).toHaveLength(1);
  });

  test("does nothing for files outside the shoot layout", async () => {
    const media = await createTestMedia({
      relativePath: "Assets/Logos/logo.png",
      name: "logo.png",
    });

    await applyManagedMetadata(media.id);

    const ds = getTestDataSource();
    expect(await ds.getRepository(Shoot).count()).toBe(0);
  });

  test("does nothing for files under 01_Footage", async () => {
    const media = await createTestMedia({
      relativePath: "2025-01-15_Beach Shoot/01_Footage/raw.mov",
      name: "raw.mov",
    });

    await applyManagedMetadata(media.id);

    const ds = getTestDataSource();
    expect(await ds.getRepository(Shoot).count()).toBe(0);
  });

  test("handles deeper subfolders inside 02_Content", async () => {
    const media = await createTestMedia({
      relativePath: "2025-01-15_Beach Shoot/02_Content/raw/img.jpg",
      name: "img.jpg",
    });

    await applyManagedMetadata(media.id);

    const ds = getTestDataSource();
    const shoots = await ds.getRepository(Shoot).find({ relations: { media: true } });
    expect(shoots).toHaveLength(1);
    expect(shoots[0]?.name).toBe("Beach Shoot");
  });
});
