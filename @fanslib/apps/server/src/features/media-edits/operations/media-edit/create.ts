import { z } from "zod";
import { db } from "../../../../lib/db";
import { MediaEdit, MediaEditTypeSchema } from "../../entity";

export const CreateMediaEditRequestBodySchema = z.object({
  sourceMediaId: z.string(),
  type: MediaEditTypeSchema,
  operations: z.array(z.unknown()).default([]),
});

export const createMediaEdit = async (
  payload: z.infer<typeof CreateMediaEditRequestBodySchema>,
): Promise<MediaEdit> => {
  const database = await db();
  const repo = database.getRepository(MediaEdit);

  const mediaEdit = repo.create({
    sourceMediaId: payload.sourceMediaId,
    type: payload.type,
    operations: payload.operations,
    status: "draft",
  });

  await repo.save(mediaEdit);

  const created = await repo.findOne({ where: { id: mediaEdit.id } });
  if (!created) {
    throw new Error(`Failed to fetch created MediaEdit with id ${mediaEdit.id}`);
  }
  return created;
};
