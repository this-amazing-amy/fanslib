import type { UpdateMediaPayload } from "@fanslib/types";
import { db } from "../../../../lib/db";
import { Media } from "../../entity";

export const updateMedia = async (id: string, updates: UpdateMediaPayload) => {
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

