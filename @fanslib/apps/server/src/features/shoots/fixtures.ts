import { getTestDataSource } from "../../lib/db.test";
import type { Media } from "../library/entity";
import { Shoot as ShootEntity } from "./entity";

type Shoot = ShootEntity;

export type ShootFixture = Omit<Shoot, "createdAt" | "updatedAt" | "shootDate" | "media"> & {
  shootDate: string;
  mediaIds: string[];
};

export const SHOOT_FIXTURES: ShootFixture[] = [
  {
    id: "shoot-1",
    name: "Spring 2024",
    description: "Spring photoshoot session",
    shootDate: "2024-03-15T10:00:00Z",
    mediaIds: ["media-1", "media-2"],
  },
  {
    id: "shoot-2",
    name: "Summer Collection",
    description: "Summer video collection",
    shootDate: "2024-06-20T14:00:00Z",
    mediaIds: ["media-3", "media-4", "media-5"],
  },
];

export const seedShootFixtures = async (media: Media[]) => {
  const dataSource = getTestDataSource();
  const shootRepo = dataSource.getRepository(ShootEntity);

  const createdShoots: Shoot[] = [];

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

