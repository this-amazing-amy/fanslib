import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import type { DataSource } from "typeorm";
import { appdataPath } from "../../lib/env";
import { Media as MediaEntity } from "./entity";
import { DEMO_MEDIA_FIXTURES } from "../analytics/fixtures-data";
import { MEDIA_FIXTURES } from "./fixtures-data";
import { resolveMediaPath } from "./path-utils";

export { MEDIA_FIXTURES } from "./fixtures-data";

const libraryFeatureDir = path.dirname(fileURLToPath(import.meta.url));
const fixturesAssetsDir = path.join(libraryFeatureDir, "fixtures", "assets");
const sampleJpegPath = path.join(fixturesAssetsDir, "sample.jpg");
const samplePngPath = path.join(fixturesAssetsDir, "sample.png");
const sampleMp4Path = path.join(fixturesAssetsDir, "sample.mp4");

const readFixtureAsset = async (label: string, filePath: string): Promise<Buffer | null> => {
  try {
    return await fs.readFile(filePath);
  } catch {
    console.warn(`FansLib: missing fixture asset "${label}" at ${filePath}`);
    return null;
  }
};

export const seedFixtureThumbnails = async (): Promise<void> => {
  const jpegBuf = await readFixtureAsset("sample.jpg", sampleJpegPath);
  if (!jpegBuf) return;

  const thumbDir = path.join(appdataPath(), "thumbnails");
  await fs.mkdir(thumbDir, { recursive: true });

  const allFixtureMedia = [...MEDIA_FIXTURES, ...DEMO_MEDIA_FIXTURES];

  await Promise.all(
    allFixtureMedia.map(async (fixture) => {
      const thumbPath = path.join(thumbDir, `${fixture.id}.jpg`);
      try {
        await fs.access(thumbPath);
      } catch {
        await fs.writeFile(thumbPath, jpegBuf);
      }
    }),
  );
};

/**
 * Writes bundled sample bytes under MEDIA_PATH for fixture `relativePath`s so GET /api/media/:id/file
 * can succeed. Covers `MEDIA_FIXTURES` (/test/...) and Fansly demo rows (`DEMO_MEDIA_FIXTURES`, /demo/...).
 */
export const seedDemoMediaFiles = async (): Promise<void> => {
  const [jpegBuf, pngBuf, videoBuf] = await Promise.all([
    readFixtureAsset("sample.jpg", sampleJpegPath),
    readFixtureAsset("sample.png", samplePngPath),
    readFixtureAsset("sample.mp4", sampleMp4Path),
  ]);

  if (!jpegBuf || !pngBuf) return;

  const seenPaths = new Set<string>();

  await Promise.all(
    [...MEDIA_FIXTURES, ...DEMO_MEDIA_FIXTURES].map(async (fixture) => {
      if (seenPaths.has(fixture.relativePath)) return;
      seenPaths.add(fixture.relativePath);

      const fullPath = resolveMediaPath(fixture.relativePath);
      try {
        await fs.access(fullPath);
        return;
      } catch {
        /* create file */
      }
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      const ext = path.extname(fixture.relativePath).toLowerCase();
      const isVideoExt = [".mp4", ".webm", ".mov", ".mkv", ".avi"].includes(ext);
      const payload = isVideoExt ? videoBuf : ext === ".png" ? pngBuf : jpegBuf;
      if (payload == null) return;
      await fs.writeFile(fullPath, payload);
    }),
  );
};

export const seedMediaFixtures = async (dataSource: DataSource) => {
  const mediaRepo = dataSource.getRepository(MediaEntity);
  const now = new Date();

  // eslint-disable-next-line functional/no-loop-statements
  for (const fixture of MEDIA_FIXTURES) {
    const existing = await mediaRepo.findOne({ where: { id: fixture.id } });
    if (!existing) {
      const media = mediaRepo.create({
        id: fixture.id,
        relativePath: fixture.relativePath,
        type: fixture.type,
        name: fixture.name,
        size: fixture.size,
        duration: fixture.duration,
        fileCreationDate: now,
        fileModificationDate: now,
      });
      await mediaRepo.save(media);
    }
  }

  return await mediaRepo.find();
};
