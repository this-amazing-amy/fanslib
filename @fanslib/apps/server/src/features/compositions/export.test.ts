import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import "reflect-metadata";
import { getTestDataSource, setupTestDatabase, teardownTestDatabase } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { Shoot } from "../shoots/entity";
import { Composition } from "./entity";
import { exportComposition } from "./operations/composition/export";

describe("exportComposition", () => {
  beforeAll(async () => {
    await setupTestDatabase();
    await resetAllFixtures();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetAllFixtures();
  });

  const createTestShoot = async () => {
    const dataSource = getTestDataSource();
    const shootRepo = dataSource.getRepository(Shoot);
    const shoot = shootRepo.create({
      name: "Test Shoot",
      shootDate: new Date("2026-04-08"),
    });
    return shootRepo.save(shoot);
  };

  const createTestComposition = async (
    shootId: string,
    overrides: Partial<Composition> = {},
  ) => {
    const dataSource = getTestDataSource();
    const compRepo = dataSource.getRepository(Composition);
    const composition = compRepo.create({
      shootId,
      name: "Test Composition",
      segments: [
        {
          id: "seg-1",
          sourceMediaId: "media-1",
          sourceStartFrame: 0,
          sourceEndFrame: 900,
        },
        {
          id: "seg-2",
          sourceMediaId: "media-2",
          sourceStartFrame: 0,
          sourceEndFrame: 600,
        },
      ],
      tracks: [
        { id: "track-1", name: "Overlays", operations: [{ type: "watermark" }] },
      ],
      exportRegions: [],
      ...overrides,
    });
    return compRepo.save(composition);
  };

  test("composition with no export regions creates one MediaEdit spanning whole timeline", async () => {
    const shoot = await createTestShoot();
    const composition = await createTestComposition(shoot.id, {
      exportRegions: [],
    });

    const edits = await exportComposition(composition.id);

    expect(edits).toHaveLength(1);
    const [edit0] = edits;
    expect(edit0?.compositionId).toBe(composition.id);
    expect(edit0?.type).toBe("composition");
    expect(edit0?.status).toBe("queued");
    expect(edit0?.segments).toEqual(composition.segments);
    expect(edit0?.tracks).toEqual(composition.tracks);
    expect(edit0?.exportRegion).toBeNull();
    expect(edit0?.operations).toEqual([]);
  });

  test("composition with two export regions creates two MediaEdits", async () => {
    const shoot = await createTestShoot();
    const composition = await createTestComposition(shoot.id, {
      exportRegions: [
        { id: "er-1", startFrame: 0, endFrame: 450 },
        { id: "er-2", startFrame: 450, endFrame: 900 },
      ],
    });

    const edits = await exportComposition(composition.id);

    expect(edits).toHaveLength(2);
    const [er0, er1] = edits;
    expect(er0?.exportRegion).toEqual({ startFrame: 0, endFrame: 450 });
    expect(er1?.exportRegion).toEqual({ startFrame: 450, endFrame: 900 });
  });

  test("each MediaEdit has correct compositionId, segments, and tracks", async () => {
    const shoot = await createTestShoot();
    const composition = await createTestComposition(shoot.id, {
      exportRegions: [
        { id: "er-1", startFrame: 0, endFrame: 450 },
      ],
    });

    const edits = await exportComposition(composition.id);

    expect(edits).toHaveLength(1);
    const [edit0] = edits;
    expect(edit0?.compositionId).toBe(composition.id);
    expect(edit0?.segments).toEqual(composition.segments);
    expect(edit0?.tracks).toEqual(composition.tracks);
  });

  test("per-region metadata is propagated to MediaEdit", async () => {
    const shoot = await createTestShoot();
    const composition = await createTestComposition(shoot.id, {
      exportRegions: [
        {
          id: "er-1",
          startFrame: 0,
          endFrame: 450,
          package: "premium",
          role: "teaser",
          contentRating: "sfw",
          quality: "1080p",
        },
      ],
    });

    const edits = await exportComposition(composition.id);

    expect(edits).toHaveLength(1);
    const [edit0] = edits;
    expect(edit0?.package).toBe("premium");
    expect(edit0?.role).toBe("teaser");
    expect(edit0?.contentRating).toBe("sfw");
    expect(edit0?.quality).toBe("1080p");
  });

  test("MediaEdits are created with queued status", async () => {
    const shoot = await createTestShoot();
    const composition = await createTestComposition(shoot.id, {
      exportRegions: [
        { id: "er-1", startFrame: 0, endFrame: 300 },
        { id: "er-2", startFrame: 300, endFrame: 600 },
      ],
    });

    const edits = await exportComposition(composition.id);

    edits.forEach((edit) => {
      expect(edit.status).toBe("queued");
    });
  });

  test("composition not found returns error", async () => {
    await expect(exportComposition("nonexistent-id")).rejects.toThrow(
      "Composition not found",
    );
  });
});
