import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import "reflect-metadata";
import { setupTestDatabase, teardownTestDatabase, getTestDataSource } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { createTestMedia } from "../../test-utils/setup";
import type { Media } from "../library/entity";
import { MediaEdit } from "./entity";
import {
  processNextQueuedEdit,
  type RenderFn,
  type RenderProgress,
  type RenderResult,
} from "./render-pipeline";

const FIXTURES_DIR = join(import.meta.dir, "..", "..", "..", "tests", "fixtures");
const TEST_MEDIA_DIR = join(FIXTURES_DIR, "test-media");

// ---------------------------------------------------------------------------
// Capturing render function — records all params passed by the pipeline
// ---------------------------------------------------------------------------

type RenderInput = {
  edit: MediaEdit;
  sourceMedia: Media;
  outputPath: string;
  quality?: string;
  onProgress?: (progress: RenderProgress) => void;
};

const capturedInputs: RenderInput[] = [];
const capturingRenderFn: RenderFn = async (params): Promise<RenderResult> => {
  capturedInputs.push(params);
  writeFileSync(params.outputPath, Buffer.from("fake output"));
  return { type: "video", duration: 10, size: 100 };
};

describe("Composition Render Pipeline", () => {
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
    capturedInputs.length = 0;
    await resetAllFixtures();
    if (existsSync(TEST_MEDIA_DIR)) rmSync(TEST_MEDIA_DIR, { recursive: true, force: true });
    mkdirSync(TEST_MEDIA_DIR, { recursive: true });
  });

  // Helper: create a composition-type queued edit with segments
  const createCompositionEdit = async (
    primarySource: Media,
    segments: unknown[],
    overrides: Partial<MediaEdit> = {},
  ) => {
    const dataSource = getTestDataSource();
    const editRepo = dataSource.getRepository(MediaEdit);
    const edit = editRepo.create({
      sourceMediaId: primarySource.id,
      type: "composition",
      operations: [],
      segments,
      status: "queued",
      ...overrides,
    });
    return editRepo.save(edit);
  };

  // -----------------------------------------------------------------------
  // Test 1: Composition-type edit is picked up and passes segments to render
  // -----------------------------------------------------------------------

  test("composition-type edit passes segments to render function", async () => {
    const sourceMedia = await createTestMedia({
      relativePath: "test-media/clip-a.mp4",
      name: "clip-a.mp4",
      type: "video",
      duration: 10,
    });

    const segments = [
      {
        id: "seg-1",
        sourceMediaId: sourceMedia.id,
        sourceStartFrame: 0,
        sourceEndFrame: 150,
      },
    ];

    await createCompositionEdit(sourceMedia, segments);

    const result = await processNextQueuedEdit(capturingRenderFn);

    expect(result).not.toBeNull();
    expect(capturedInputs).toHaveLength(1);

    const params = capturedInputs[0];
    const editSegments = (params?.edit.segments ?? []) as Array<{
      id: string;
      sourceStartFrame: number;
      sourceEndFrame: number;
    }>;
    expect(editSegments).toHaveLength(1);
    expect(editSegments[0]?.id).toBe("seg-1");
    expect(editSegments[0]?.sourceStartFrame).toBe(0);
    expect(editSegments[0]?.sourceEndFrame).toBe(150);
  });
});
