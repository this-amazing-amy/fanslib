import { t } from "elysia";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { Media, MediaSchema } from "../../../library/entity";
import { Shoot, ShootSchema } from "../../entity";

export const UpdateShootRequestBodySchema = t.Object({
  name: t.Optional(t.String()),
  description: t.Optional(t.String()),
  shootDate: t.Optional(t.Date()),
  mediaIds: t.Optional(t.Array(t.String())),
});

export const UpdateShootResponseSchema = t.Union([t.Intersect([ShootSchema, t.Object({ media: t.Array(MediaSchema) })]), t.Object({ error: t.String() })]);

export const updateShoot = async (
  id: string,
  payload: typeof UpdateShootRequestBodySchema.static
): Promise<typeof UpdateShootResponseSchema.static> => {
  const database = await db();
  const shootRepository = database.getRepository(Shoot);
  const mediaRepository = database.getRepository(Media);

  const shoot = await shootRepository.findOne({
    where: { id },
    relations: ["media"],
  });

  if (!shoot) {
    return { error: "Shoot not found" } as const;
  }

  if (payload.mediaIds) {
    const media = await mediaRepository.findBy({
      id: In(payload.mediaIds),
    });
    shoot.media = media;
  }

  Object.assign(shoot, {
    name: payload.name ?? shoot.name,
    description: payload.description ?? shoot.description,
    shootDate: payload.shootDate ?? shoot.shootDate,
  });

  await shootRepository.save(shoot);
  return shoot;
};

