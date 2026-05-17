import { db } from "../../../../lib/db";
import { Shoot } from "../../../shoots/entity";
import { Media } from "../../entity";
import { parseShootFromRelativePath } from "../../shoot-layout";

const findOrCreateShoot = async (
  shootName: string,
  dateStr: string,
  mediaId: string,
): Promise<void> => {
  const dataSource = await db();
  const shootRepo = dataSource.getRepository(Shoot);
  const mediaRepo = dataSource.getRepository(Media);

  const media = await mediaRepo.findOneBy({ id: mediaId });
  if (!media) return;

  const shootDate = new Date(dateStr);
  const dateKey = shootDate.toISOString().slice(0, 10);

  const existing = await shootRepo.find({ relations: { media: true } });
  const match = existing.find(
    (s) => s.name === shootName && s.shootDate.toISOString().slice(0, 10) === dateKey,
  );

  if (match) {
    if (!match.media.some((m) => m.id === mediaId)) {
      match.media.push(media);
      await shootRepo.save(match);
    }
    return;
  }

  const shoot = shootRepo.create({
    name: shootName,
    shootDate,
    media: [media],
  });
  await shootRepo.save(shoot);
};

export const applyManagedMetadata = async (mediaId: string): Promise<void> => {
  const dataSource = await db();
  const repo = dataSource.getRepository(Media);

  const media = await repo.findOneBy({ id: mediaId });
  if (!media) return;

  const parsed = parseShootFromRelativePath(media.relativePath);
  if (!parsed) return;

  await findOrCreateShoot(parsed.shortName, parsed.date, mediaId);
};
