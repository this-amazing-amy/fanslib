import { z } from "zod";
import { db } from "../../../../lib/db";
import { MediaSchema } from "../../../library/schema";
import { Shoot, ShootSchema } from "../../entity";

export const FetchShootByIdRequestParamsSchema = z.object({
  id: z.string(),
});

export const FetchShootByIdResponseSchema = ShootSchema.extend({
  media: z.array(MediaSchema),
});

export const fetchShootById = async (id: string): Promise<z.infer<typeof FetchShootByIdResponseSchema> | null> => {
  const database = await db();
  const shootRepository = database.getRepository(Shoot);

  const shoot = await shootRepository.findOne({
    where: { id },
    relations: ["media"],
  });

  return shoot;
};

