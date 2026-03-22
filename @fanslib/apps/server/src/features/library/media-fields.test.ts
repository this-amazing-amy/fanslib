import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import "reflect-metadata";
import { getTestDataSource, setupTestDatabase, teardownTestDatabase } from "../../lib/test-db";
import { clearAllTables } from "../../lib/test-db";
import { Media } from "./entity";

describe("Media entity new fields", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearAllTables();
  });

  test("contentRating defaults to null", async () => {
    const ds = getTestDataSource();
    const repo = ds.getRepository(Media);

    const media = repo.create({
      relativePath: "/test/photo.jpg",
      type: "image",
      name: "photo.jpg",
      size: 1024,
      fileCreationDate: new Date(),
      fileModificationDate: new Date(),
    });
    await repo.save(media);

    const saved = await repo.findOneBy({ id: media.id });
    expect(saved?.contentRating).toBeNull();
  });

  test("contentRating can be set to a valid code", async () => {
    const ds = getTestDataSource();
    const repo = ds.getRepository(Media);

    const media = repo.create({
      relativePath: "/test/photo.jpg",
      type: "image",
      name: "photo.jpg",
      size: 1024,
      contentRating: "xt",
      fileCreationDate: new Date(),
      fileModificationDate: new Date(),
    });
    await repo.save(media);

    const saved = await repo.findOneBy({ id: media.id });
    expect(saved?.contentRating).toBe("xt");
  });

  test("package defaults to null", async () => {
    const ds = getTestDataSource();
    const repo = ds.getRepository(Media);

    const media = repo.create({
      relativePath: "/test/photo.jpg",
      type: "image",
      name: "photo.jpg",
      size: 1024,
      fileCreationDate: new Date(),
      fileModificationDate: new Date(),
    });
    await repo.save(media);

    const saved = await repo.findOneBy({ id: media.id });
    expect(saved?.package).toBeNull();
  });

  test("role defaults to null", async () => {
    const ds = getTestDataSource();
    const repo = ds.getRepository(Media);

    const media = repo.create({
      relativePath: "/test/photo.jpg",
      type: "image",
      name: "photo.jpg",
      size: 1024,
      fileCreationDate: new Date(),
      fileModificationDate: new Date(),
    });
    await repo.save(media);

    const saved = await repo.findOneBy({ id: media.id });
    expect(saved?.role).toBeNull();
  });

  test("isManaged defaults to false", async () => {
    const ds = getTestDataSource();
    const repo = ds.getRepository(Media);

    const media = repo.create({
      relativePath: "/test/photo.jpg",
      type: "image",
      name: "photo.jpg",
      size: 1024,
      fileCreationDate: new Date(),
      fileModificationDate: new Date(),
    });
    await repo.save(media);

    const saved = await repo.findOneBy({ id: media.id });
    expect(saved?.isManaged).toBe(false);
  });

  test("all new fields can be set together", async () => {
    const ds = getTestDataSource();
    const repo = ds.getRepository(Media);

    const media = repo.create({
      relativePath: "/test/photo.jpg",
      type: "image",
      name: "photo.jpg",
      size: 1024,
      contentRating: "cn",
      package: "main",
      role: "content",
      isManaged: true,
      fileCreationDate: new Date(),
      fileModificationDate: new Date(),
    });
    await repo.save(media);

    const saved = await repo.findOneBy({ id: media.id });
    expect(saved?.contentRating).toBe("cn");
    expect(saved?.package).toBe("main");
    expect(saved?.role).toBe("content");
    expect(saved?.isManaged).toBe(true);
  });
});
