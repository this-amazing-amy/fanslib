import { t } from "elysia";
import { MediaSchema } from "~/features/library/entity";
import { db } from "../../../../lib/db";
import { Shoot, ShootSchema } from "../../entity";

export const FetchShootByIdRequestParamsSchema = t.Object({
  id: t.String(),
});

export const FetchShootByIdResponseSchema = t.Union([
  t.Intersect([ShootSchema, t.Object({ media: t.Array(MediaSchema) })]),
  t.Object({ error: t.String() }),
]);

export const getShoot = async (payload: typeof FetchShootByIdRequestParamsSchema.static): Promise<typeof FetchShootByIdResponseSchema.static> => {
  const database = await db();
  const shootRepository = database.getRepository(Shoot);

  const shoot = await shootRepository.findOne({
    where: { id: payload.id },
    relations: ["media"],
  });

  if (!shoot) {
    return { error: "Shoot not found" };
  }

  return shoot;
};

