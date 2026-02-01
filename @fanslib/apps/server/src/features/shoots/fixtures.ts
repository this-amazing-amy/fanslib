import { getTestDataSource } from "../../lib/test-db";
import type { Media } from "../library/entity";
import { Shoot as ShootEntity } from "./entity";
import { SHOOT_FIXTURES } from "./fixtures-data";

export { SHOOT_FIXTURES } from "./fixtures-data";

export const seedShootFixtures = async (media: Media[]) => {
  const dataSource = getTestDataSource();
  const shootRepo = dataSource.getRepository(ShootEntity);

  const createdShoots: ShootEntity[] = [];

  // eslint-disable-next-line functional/no-loop-statements
  for (const fixture of SHOOT_FIXTURES) {
    // eslint-disable-next-line functional/no-let
    let shoot = await shootRepo.findOne({ where: { id: fixture.id } });
    if (!shoot) {
      const shootMedia = media.filter((m) => fixture.mediaIds.includes(m.id));
      shoot = shootRepo.create({
        id: fixture.id,
        name: fixture.name,
        description: fixture.description,
        shootDate: new Date(fixture.shootDate),
        media: shootMedia,
      });
      shoot = await shootRepo.save(shoot);
    }
    createdShoots.push(shoot);
  }

  return await shootRepo.find({
    relations: { media: true },
  });
};

