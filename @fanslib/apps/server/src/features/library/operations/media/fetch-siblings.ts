import { db } from "../../../../lib/db";
import { Media } from "../../entity";

export const fetchSiblings = async (mediaId: string): Promise<Media[] | null> => {
  const database = await db();
  const mediaRepo = database.getRepository(Media);

  const media = await mediaRepo.findOne({
    where: { id: mediaId },
    relations: { shoots: true },
  });

  if (!media) return null;

  if (!media.package || media.shoots.length === 0) {
    return [];
  }

  const shootIds = media.shoots.map((s) => s.id);

  const siblings = await mediaRepo
    .createQueryBuilder("media")
    .innerJoin("media.shoots", "shoot", "shoot.id IN (:...shootIds)", { shootIds })
    .where("media.package = :package", { package: media.package })
    .andWhere("media.id != :mediaId", { mediaId })
    .getMany();

  return siblings;
};
