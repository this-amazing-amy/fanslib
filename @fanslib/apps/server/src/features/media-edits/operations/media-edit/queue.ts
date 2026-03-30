import { db } from "../../../../lib/db";
import { MediaEdit } from "../../entity";

export const queueMediaEdit = async (
  id: string,
): Promise<MediaEdit | null | "not_draft"> => {
  const database = await db();
  const repo = database.getRepository(MediaEdit);

  const mediaEdit = await repo.findOne({ where: { id } });
  if (!mediaEdit) return null;

  if (mediaEdit.status !== "draft") return "not_draft";

  mediaEdit.status = "queued";
  await repo.save(mediaEdit);

  return repo.findOne({ where: { id } });
};
