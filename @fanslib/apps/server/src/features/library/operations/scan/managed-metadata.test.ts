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

describe("applyManagedMetadata", () => {
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
      relativePath: "library/2025-01-15_Beach Shoot_main_content_uc.mp4",
      type: "video" as const,
      name: "2025-01-15_Beach Shoot_main_content_uc.mp4",
      size: 1024,
      fileCreationDate: new Date("2025-01-15"),
      fileModificationDate: new Date("2025-01-15"),
      ...overrides,
    });
    return repo.save(media);
  };

  test("sets isManaged=false for files outside library/", async () => {
    const media = await createTestMedia({
      relativePath: "shoots/photo.jpg",
      name: "photo.jpg",
    });

    await applyManagedMetadata(media.id);

    const ds = getTestDataSource();
    const updated = await ds.getRepository(Media).findOneBy({ id: media.id });
    expect(updated?.isManaged).toBe(false);
  });

  test("sets isManaged=true for files inside library/", async () => {
    const media = await createTestMedia({
      relativePath: "library/2025-01-15_Beach Shoot_main_content_uc.mp4",
    });

    await applyManagedMetadata(media.id);

    const ds = getTestDataSource();
    const updated = await ds.getRepository(Media).findOneBy({ id: media.id });
    expect(updated?.isManaged).toBe(true);
  });

  test("populates package, role, contentRating from valid managed filename", async () => {
    const media = await createTestMedia({
      relativePath: "library/2025-01-15_Beach Shoot_main_content_uc.mp4",
      name: "2025-01-15_Beach Shoot_main_content_uc.mp4",
    });

    await applyManagedMetadata(media.id);

    const ds = getTestDataSource();
    const updated = await ds.getRepository(Media).findOneBy({ id: media.id });
    expect(updated?.package).toBe("main");
    expect(updated?.role).toBe("content");
    expect(updated?.contentRating).toBe("uc");
  });

  test("managed file with invalid filename has null metadata but isManaged=true", async () => {
    const media = await createTestMedia({
      relativePath: "library/random-photo.jpg",
      name: "random-photo.jpg",
    });

    await applyManagedMetadata(media.id);

    const ds = getTestDataSource();
    const updated = await ds.getRepository(Media).findOneBy({ id: media.id });
    expect(updated?.isManaged).toBe(true);
    expect(updated?.package).toBeNull();
    expect(updated?.role).toBeNull();
    expect(updated?.contentRating).toBeNull();
  });

  test("auto-creates shoot for new date+shootName combination", async () => {
    const media = await createTestMedia({
      relativePath: "library/2025-03-10_Oil Anal_main_content_xt.mp4",
      name: "2025-03-10_Oil Anal_main_content_xt.mp4",
    });

    await applyManagedMetadata(media.id);

    const ds = getTestDataSource();
    const shoots = await ds.getRepository(Shoot).find({ relations: { media: true } });
    expect(shoots).toHaveLength(1);
    expect(shoots[0]?.name).toBe("Oil Anal");
    expect(shoots[0]?.shootDate).toEqual(new Date("2025-03-10"));
    expect(shoots[0]?.media.some((m: Media) => m.id === media.id)).toBe(true);
  });

  test("auto-links to existing shoot with same name and date", async () => {
    const ds = getTestDataSource();
    const shootRepo = ds.getRepository(Shoot);

    // Pre-create a shoot
    const existingShoot = shootRepo.create({
      name: "Beach Shoot",
      shootDate: new Date("2025-01-15"),
      media: [],
    });
    await shootRepo.save(existingShoot);

    const media = await createTestMedia({
      relativePath: "library/2025-01-15_Beach Shoot_main_content_uc.mp4",
      name: "2025-01-15_Beach Shoot_main_content_uc.mp4",
    });

    await applyManagedMetadata(media.id);

    const shoots = await shootRepo.find({ relations: { media: true } });
    expect(shoots).toHaveLength(1);
    expect(shoots[0]?.id).toBe(existingShoot.id);
    expect(shoots[0]?.media.some((m: Media) => m.id === media.id)).toBe(true);
  });

  test("does not create shoot for unmanaged files", async () => {
    const media = await createTestMedia({
      relativePath: "shoots/photo.jpg",
      name: "photo.jpg",
    });

    await applyManagedMetadata(media.id);

    const ds = getTestDataSource();
    const shoots = await ds.getRepository(Shoot).find();
    expect(shoots).toHaveLength(0);
  });

  test("does not create shoot for managed file with unparseable filename", async () => {
    const media = await createTestMedia({
      relativePath: "library/random-photo.jpg",
      name: "random-photo.jpg",
    });

    await applyManagedMetadata(media.id);

    const ds = getTestDataSource();
    const shoots = await ds.getRepository(Shoot).find();
    expect(shoots).toHaveLength(0);
  });

  test("second file with same shoot does not create duplicate shoot", async () => {
    const media1 = await createTestMedia({
      relativePath: "library/2025-01-15_Beach Shoot_main_content_uc.mp4",
      name: "2025-01-15_Beach Shoot_main_content_uc.mp4",
    });
    const media2 = await createTestMedia({
      relativePath: "library/2025-01-15_Beach Shoot_clip1_trailer_sf.jpg",
      name: "2025-01-15_Beach Shoot_clip1_trailer_sf.jpg",
    });

    await applyManagedMetadata(media1.id);
    await applyManagedMetadata(media2.id);

    const ds = getTestDataSource();
    const shoots = await ds.getRepository(Shoot).find({ relations: { media: true } });
    expect(shoots).toHaveLength(1);
    expect(shoots[0]?.media).toHaveLength(2);
  });

  test("re-parses metadata when relativePath and name change (rename detection)", async () => {
    const media = await createTestMedia({
      relativePath: "library/2025-01-15_Beach Shoot_main_content_uc.mp4",
      name: "2025-01-15_Beach Shoot_main_content_uc.mp4",
    });

    // First apply — should set uc rating
    await applyManagedMetadata(media.id);

    const ds = getTestDataSource();
    const repo = ds.getRepository(Media);
    const first = await repo.findOneBy({ id: media.id });
    expect(first?.contentRating).toBe("uc");
    expect(first?.package).toBe("main");

    // Simulate rename: update path and name in DB (scanner does this before calling applyManagedMetadata)
    await repo.update(media.id, {
      relativePath: "library/2025-01-15_Beach Shoot_clip1_trailer_sf.mp4",
      name: "2025-01-15_Beach Shoot_clip1_trailer_sf.mp4",
    });

    // Re-apply — should pick up new metadata from renamed file
    await applyManagedMetadata(media.id);

    const updated = await repo.findOneBy({ id: media.id });
    expect(updated?.contentRating).toBe("sf");
    expect(updated?.package).toBe("clip1");
    expect(updated?.role).toBe("trailer");
  });

  test("file moved from managed to unmanaged zone clears metadata", async () => {
    const media = await createTestMedia({
      relativePath: "library/2025-01-15_Beach Shoot_main_content_uc.mp4",
      name: "2025-01-15_Beach Shoot_main_content_uc.mp4",
    });

    await applyManagedMetadata(media.id);

    const ds = getTestDataSource();
    const repo = ds.getRepository(Media);
    const managed = await repo.findOneBy({ id: media.id });
    expect(managed?.isManaged).toBe(true);

    // Simulate move out of library/
    await repo.update(media.id, {
      relativePath: "shoots/2025-01-15_Beach Shoot_main_content_uc.mp4",
    });

    await applyManagedMetadata(media.id);

    const updated = await repo.findOneBy({ id: media.id });
    expect(updated?.isManaged).toBe(false);
    expect(updated?.contentRating).toBeNull();
    expect(updated?.package).toBeNull();
    expect(updated?.role).toBeNull();
  });

  test("managed file in nested library subfolder is detected", async () => {
    const media = await createTestMedia({
      relativePath: "library/subfolder/2025-01-15_Beach Shoot_main_content_sf.jpg",
      name: "2025-01-15_Beach Shoot_main_content_sf.jpg",
    });

    await applyManagedMetadata(media.id);

    const ds = getTestDataSource();
    const updated = await ds.getRepository(Media).findOneBy({ id: media.id });
    expect(updated?.isManaged).toBe(true);
    expect(updated?.contentRating).toBe("sf");
  });
});
