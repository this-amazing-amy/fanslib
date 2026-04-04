import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import "reflect-metadata";
import { setupTestDatabase, teardownTestDatabase } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { devalueMiddleware } from "../../lib/devalue-middleware";
import { parseResponse, createTestMedia } from "../../test-utils/setup";
import { organizeRoutes } from "./organize-routes";
import { Shoot } from "../shoots/entity";
import { Media } from "./entity";
import { getTestDataSource } from "../../lib/test-db";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

type UnmanagedGroup = {
  folder: string;
  media: Array<{ id: string; name: string; relativePath: string }>;
};

type OrganizeResponse = {
  results: Array<{ mediaId: string; finalPath: string }>;
  errors: Array<{ mediaId: string; error: string }>;
};

describe("Organize Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Hono;

  beforeAll(async () => {
    await setupTestDatabase();
    app = new Hono().use("*", devalueMiddleware()).route("/", organizeRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetAllFixtures();
  });

  describe("GET /api/library/unmanaged", () => {
    test("returns unmanaged media grouped by containing folder", async () => {
      await createTestMedia({
        id: "unmanaged-1",
        name: "video1.mp4",
        relativePath: "inbox/video1.mp4",
        isManaged: false,
      });
      await createTestMedia({
        id: "unmanaged-2",
        name: "video2.mp4",
        relativePath: "inbox/video2.mp4",
        isManaged: false,
      });
      await createTestMedia({
        id: "unmanaged-3",
        name: "photo.jpg",
        relativePath: "downloads/photo.jpg",
        isManaged: false,
      });
      await createTestMedia({
        id: "managed-1",
        name: "managed.mp4",
        relativePath: "library/2026/managed.mp4",
        isManaged: true,
      });

      const response = await app.request("/api/library/unmanaged");
      expect(response.status).toBe(200);

      const data = await parseResponse<UnmanagedGroup[]>(response);
      expect(data).toBeDefined();

      const inboxGroup = data?.find((g) => g.folder === "inbox");
      const downloadsGroup = data?.find((g) => g.folder === "downloads");

      expect(inboxGroup).toBeDefined();
      expect(inboxGroup?.media).toHaveLength(2);
      expect(downloadsGroup).toBeDefined();
      expect(downloadsGroup?.media).toHaveLength(1);

      const allMediaIds = data?.flatMap((g) => g.media.map((m) => m.id)) ?? [];
      expect(allMediaIds).not.toContain("managed-1");
    });
  });

  describe("GET /api/library/known-roles", () => {
    test("returns distinct role values from managed media", async () => {
      await createTestMedia({
        id: "role-1",
        name: "a.mp4",
        relativePath: "lib/a.mp4",
        isManaged: true,
        role: "content",
      });
      await createTestMedia({
        id: "role-2",
        name: "b.mp4",
        relativePath: "lib/b.mp4",
        isManaged: true,
        role: "trailer",
      });
      await createTestMedia({
        id: "role-3",
        name: "c.mp4",
        relativePath: "lib/c.mp4",
        isManaged: true,
        role: "content",
      });
      await createTestMedia({
        id: "role-4",
        name: "d.mp4",
        relativePath: "lib/d.mp4",
        isManaged: false,
        role: "unmanaged-role",
      });

      const response = await app.request("/api/library/known-roles");
      expect(response.status).toBe(200);

      const data = await parseResponse<string[]>(response);
      expect(data).toBeDefined();
      expect(data).toContain("content");
      expect(data).toContain("trailer");
      expect(data).toHaveLength(2);
      expect(data).not.toContain("unmanaged-role");
    });
  });

  describe("GET /api/library/known-packages", () => {
    test("returns distinct package values for media linked to a shoot", async () => {
      const ds = getTestDataSource();
      const shootRepo = ds.getRepository(Shoot);

      const shoot = shootRepo.create({
        id: "shoot-1",
        name: "Test Shoot",
        shootDate: new Date("2026-01-15"),
      });
      await shootRepo.save(shoot);

      const media1 = await createTestMedia({
        id: "pkg-1",
        name: "a.mp4",
        relativePath: "lib/a.mp4",
        isManaged: true,
        package: "main",
      });
      const media2 = await createTestMedia({
        id: "pkg-2",
        name: "b.mp4",
        relativePath: "lib/b.mp4",
        isManaged: true,
        package: "clip1",
      });
      const media3 = await createTestMedia({
        id: "pkg-3",
        name: "c.mp4",
        relativePath: "lib/c.mp4",
        isManaged: true,
        package: "main",
      });

      shoot.media = [media1, media2, media3];
      await shootRepo.save(shoot);

      const response = await app.request("/api/library/known-packages?shootId=shoot-1");
      expect(response.status).toBe(200);

      const data = await parseResponse<string[]>(response);
      expect(data).toBeDefined();
      expect(data).toContain("main");
      expect(data).toContain("clip1");
      expect(data).toHaveLength(2);
    });
  });

  describe("POST /api/library/organize", () => {
    // eslint-disable-next-line functional/no-let
    let tmpDir: string;

    beforeEach(async () => {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "fanslib-test-"));
      process.env.MEDIA_PATH = tmpDir;
      process.env.LIBRARY_PATH = tmpDir;
      process.env.APPDATA_PATH = process.env.APPDATA_PATH ?? tmpDir;
    });

    test("renames, moves file and updates media record", async () => {
      const ds = getTestDataSource();
      const shootRepo = ds.getRepository(Shoot);

      const shoot = shootRepo.create({
        id: "shoot-org-1",
        name: "Oil Anal",
        shootDate: new Date("2026-01-15"),
      });
      await shootRepo.save(shoot);

      const sourceDir = path.join(tmpDir, "inbox");
      await fs.mkdir(sourceDir, { recursive: true });
      await fs.writeFile(path.join(sourceDir, "raw-clip.mp4"), "fake-video-data");

      await createTestMedia({
        id: "org-media-1",
        name: "raw-clip.mp4",
        relativePath: "inbox/raw-clip.mp4",
        type: "video",
        isManaged: false,
      });

      const response = await app.request("/api/library/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: [
            {
              mediaId: "org-media-1",
              shootId: "shoot-org-1",
              package: "main",
              role: "content",
              contentRating: "uc",
            },
          ],
        }),
      });

      expect(response.status).toBe(200);
      const data = await parseResponse<OrganizeResponse>(response);

      expect(data).toBeDefined();
      expect(data?.results).toHaveLength(1);
      expect(data?.errors).toHaveLength(0);

      const result = data?.results[0];
      expect(result?.finalPath).toBe(
        "2026/20260115_Oil Anal/20260115_Oil Anal_main_content_uc.mp4",
      );

      // File should exist at new location
      const newAbsPath = path.join(tmpDir, result?.finalPath ?? "");
      const fileExists = await fs
        .access(newAbsPath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);

      // Old file should be gone
      const oldExists = await fs
        .access(path.join(sourceDir, "raw-clip.mp4"))
        .then(() => true)
        .catch(() => false);
      expect(oldExists).toBe(false);

      // Media record should be updated
      const mediaRepo = ds.getRepository(Media);
      const updated = await mediaRepo.findOne({ where: { id: "org-media-1" } });
      expect(updated?.isManaged).toBe(true);
      expect(updated?.relativePath).toBe(result?.finalPath);
      expect(updated?.package).toBe("main");
      expect(updated?.role).toBe("content");
      expect(updated?.contentRating).toBe("uc");
    });

    test("appends sequence number starting at _2 on filename collision", async () => {
      const ds = getTestDataSource();
      const shootRepo = ds.getRepository(Shoot);

      const shoot = shootRepo.create({
        id: "shoot-col-1",
        name: "Shower",
        shootDate: new Date("2026-02-20"),
      });
      await shootRepo.save(shoot);

      const targetDir = path.join(tmpDir, "2026", "20260220_Shower");
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(
        path.join(targetDir, "20260220_Shower_main_content_sf.mp4"),
        "existing-file",
      );

      const sourceDir = path.join(tmpDir, "inbox");
      await fs.mkdir(sourceDir, { recursive: true });
      await fs.writeFile(path.join(sourceDir, "new-clip.mp4"), "new-file-data");

      await createTestMedia({
        id: "col-media-1",
        name: "new-clip.mp4",
        relativePath: "inbox/new-clip.mp4",
        type: "video",
        isManaged: false,
      });

      const response = await app.request("/api/library/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: [
            {
              mediaId: "col-media-1",
              shootId: "shoot-col-1",
              package: "main",
              role: "content",
              contentRating: "sf",
            },
          ],
        }),
      });

      expect(response.status).toBe(200);
      const data = await parseResponse<OrganizeResponse>(response);

      expect(data?.results).toHaveLength(1);
      expect(data?.results[0].finalPath).toBe(
        "2026/20260220_Shower/20260220_Shower_main_content_sf_2.mp4",
      );
    });

    test("reports missing files in errors array", async () => {
      const ds = getTestDataSource();
      const shootRepo = ds.getRepository(Shoot);

      const shoot = shootRepo.create({
        id: "shoot-miss-1",
        name: "Missing",
        shootDate: new Date("2026-03-01"),
      });
      await shootRepo.save(shoot);

      await createTestMedia({
        id: "miss-media-1",
        name: "gone.mp4",
        relativePath: "inbox/gone.mp4",
        type: "video",
        isManaged: false,
      });

      const response = await app.request("/api/library/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: [
            {
              mediaId: "miss-media-1",
              shootId: "shoot-miss-1",
              package: "main",
              role: "content",
              contentRating: "uc",
            },
          ],
        }),
      });

      expect(response.status).toBe(200);
      const data = await parseResponse<OrganizeResponse>(response);

      expect(data?.results).toHaveLength(0);
      expect(data?.errors).toHaveLength(1);
      expect(data?.errors[0].mediaId).toBe("miss-media-1");
      expect(data?.errors[0].error).toBe("File not found on disk");
    });

    test("rejects invalid content rating", async () => {
      const response = await app.request("/api/library/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: [
            {
              mediaId: "any-id",
              shootId: "any-shoot",
              package: "main",
              role: "content",
              contentRating: "invalid",
            },
          ],
        }),
      });

      expect(response.status).toBe(422);
    });

    test("auto-links media to shoot", async () => {
      const ds = getTestDataSource();
      const shootRepo = ds.getRepository(Shoot);

      const shoot = shootRepo.create({
        id: "shoot-link-1",
        name: "Link Test",
        shootDate: new Date("2026-04-10"),
      });
      await shootRepo.save(shoot);

      const sourceDir = path.join(tmpDir, "inbox");
      await fs.mkdir(sourceDir, { recursive: true });
      await fs.writeFile(path.join(sourceDir, "link-test.mp4"), "video-data");

      await createTestMedia({
        id: "link-media-1",
        name: "link-test.mp4",
        relativePath: "inbox/link-test.mp4",
        type: "video",
        isManaged: false,
      });

      const response = await app.request("/api/library/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: [
            {
              mediaId: "link-media-1",
              shootId: "shoot-link-1",
              package: "main",
              role: "content",
              contentRating: "cn",
            },
          ],
        }),
      });

      expect(response.status).toBe(200);

      const updatedShoot = await shootRepo.findOne({
        where: { id: "shoot-link-1" },
        relations: { media: true },
      });
      const linkedIds = updatedShoot?.media.map((m) => m.id) ?? [];
      expect(linkedIds).toContain("link-media-1");
    });
  });
});
