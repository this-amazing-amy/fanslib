import { t } from "elysia";
import { db } from "../../../../lib/db";
import { MediaSchema } from "../../../library/schema";
import { Shoot, ShootSchema } from "../../entity";

export const FetchShootByIdRequestParamsSchema = t.Object({
  id: t.String(),
});

export const FetchShootByIdResponseSchema = t.Composite([
  ShootSchema,
  t.Object({ media: t.Array(MediaSchema) }),
]);

export const fetchShootById = async (id: string): Promise<typeof FetchShootByIdResponseSchema.static | null> => {
  const database = await db();
  const shootRepository = database.getRepository(Shoot);

  const shoot = await shootRepository.findOne({
    where: { id },
    relations: ["media"],
  });

  return shoot;
};

