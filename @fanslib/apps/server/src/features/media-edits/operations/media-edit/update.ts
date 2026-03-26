import { z } from "zod";
import { db } from "../../../../lib/db";
import { MediaEdit, MediaEditStatusSchema } from "../../entity";

export const UpdateMediaEditRequestBodySchema = z.object({
  operations: z.array(z.unknown()).optional(),
  status: MediaEditStatusSchema.optional(),
  outputMediaId: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
});

export const updateMediaEdit = async (
  id: string,
  payload: z.infer<typeof UpdateMediaEditRequestBodySchema>,
): Promise<MediaEdit | null> => {
  const database = await db();
  const repo = database.getRepository(MediaEdit);

  const mediaEdit = await repo.findOne({ where: { id } });
  if (!mediaEdit) {
    return null;
  }

  if (payload.operations !== undefined) mediaEdit.operations = payload.operations;
  if (payload.status !== undefined) mediaEdit.status = payload.status;
  if (payload.outputMediaId !== undefined) mediaEdit.outputMediaId = payload.outputMediaId;
  if (payload.error !== undefined) mediaEdit.error = payload.error;

  await repo.save(mediaEdit);

  return repo.findOne({ where: { id } });
};
