import { getTestDataSource } from "../../lib/test-db";
import { Media as MediaEntity } from "./entity";
import { MEDIA_FIXTURES } from "./fixtures-data";

export { MEDIA_FIXTURES } from "./fixtures-data";

export const seedMediaFixtures = async () => {
  const dataSource = getTestDataSource();
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

