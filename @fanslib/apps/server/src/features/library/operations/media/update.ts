import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Media, MediaSchema, MediaTypeSchema } from "../../entity";

export const UpdateMediaRequestParamsSchema = t.Object({
  id: t.String(),
});

export const UpdateMediaRequestBodySchema = t.Partial(t.Object({
  relativePath: t.String(),
  type: MediaTypeSchema,
  name: t.String(),
  size: t.Number(),
  duration: t.Optional(t.Number()),
  redgifsUrl: t.Union([t.String(), t.Null()]),
  fileCreationDate: t.Date(),
  fileModificationDate: t.Date(),
}));

export const UpdateMediaResponseSchema = t.Union([MediaSchema, t.Null()]);

export const updateMedia = async (id: string, updates: typeof UpdateMediaRequestBodySchema.static): Promise<typeof UpdateMediaResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Media);

  const media = await repository.findOne({
    where: { id },
    relations: {
      postMedia: {
        post: {
          channel: true,
        },
      },
      shoots: true,
    },
  });

  if (!media) return null;

  Object.assign(media, updates);
  await repository.save(media);

  return repository.findOne({
    where: { id },
    relations: {
      postMedia: true,
      shoots: true,
    },
  });
};

