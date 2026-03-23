import { promises as fs } from "fs";
import path from "path";
import type { DataSource } from "typeorm";
import { appdataPath } from "../../lib/env";
import { Media as MediaEntity } from "./entity";
import { DEMO_MEDIA_FIXTURES } from "../analytics/fixtures-data";
import { MEDIA_FIXTURES } from "./fixtures-data";

export { MEDIA_FIXTURES } from "./fixtures-data";

const PLACEHOLDER_JPEG_B64 =
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABsSFBcUERsXFhceHBsgKEIrKCUlKFE6PTBCYFVlZF9VXVtqeJmBanGQc1tdhbWGkJ6jq62rZ4C8ybqmx5moq6T/2wBDARweHigjKE4rK06kbl1upKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKT/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCaiiiqNz//2Q==";

export const seedFixtureThumbnails = async (): Promise<void> => {
  const thumbDir = path.join(appdataPath(), "thumbnails");
  await fs.mkdir(thumbDir, { recursive: true });

  const jpegBuf = Buffer.from(PLACEHOLDER_JPEG_B64, "base64");
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
