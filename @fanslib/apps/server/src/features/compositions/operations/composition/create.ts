import { z } from "zod";
import { db } from "../../../../lib/db";
import { Composition } from "../../entity";

export const CreateCompositionRequestBodySchema = z.object({
  shootId: z.string(),
  name: z.string(),
});

export const createComposition = async (
  payload: z.infer<typeof CreateCompositionRequestBodySchema>,
): Promise<Composition> => {
  const database = await db();
  const repo = database.getRepository(Composition);

  const composition = repo.create({
    shootId: payload.shootId,
    name: payload.name,
    segments: [],
    tracks: [],
    exportRegions: [],
  });

  await repo.save(composition);
  const created = await repo.findOne({ where: { id: composition.id } });
  if (!created) throw new Error(`Failed to fetch created composition ${composition.id}`);
  return created;
};
