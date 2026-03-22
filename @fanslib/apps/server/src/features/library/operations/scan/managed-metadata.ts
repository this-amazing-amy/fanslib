import { db } from "../../../../lib/db";
import { Shoot } from "../../../shoots/entity";
import { Media } from "../../entity";
import { parseFilename } from "../../parse-filename";

const MANAGED_PREFIX = "library/";

const findOrCreateShoot = async (
  shootName: string,
  dateStr: string,
  mediaId: string,
): Promise<void> => {
  const dataSource = await db();
  const shootRepo = dataSource.getRepository(Shoot);

  const shootDate = new Date(dateStr);

  // Find existing shoot by name and date
  const existing = await shootRepo.find({ relations: { media: true } });
  const match = existing.find(
    (s) =>
      s.name === shootName &&
      s.shootDate.toISOString().slice(0, 10) === shootDate.toISOString().slice(0, 10),
  );

  const mediaRepo = dataSource.getRepository(Media);
  const media = await mediaRepo.findOneBy({ id: mediaId });
  if (!media) return;

  if (match) {
    const alreadyLinked = match.media.some((m) => m.id === mediaId);
    if (!alreadyLinked) {
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

  const isManaged = media.relativePath.startsWith(MANAGED_PREFIX);

  if (!isManaged) {
    if (media.isManaged) {
      media.isManaged = false;
      media.contentRating = null;
      media.package = null;
      media.role = null;
      await repo.save(media);
    }
    return;
  }

  media.isManaged = true;

  const parsed = parseFilename(media.name);
  media.contentRating = parsed.contentRating;
  media.package = parsed.package;
  media.role = parsed.role;

  await repo.save(media);

  // Auto-link to shoot if filename was parseable
  if (parsed.date && parsed.shootName) {
    await findOrCreateShoot(parsed.shootName, parsed.date, mediaId);
  }
};
