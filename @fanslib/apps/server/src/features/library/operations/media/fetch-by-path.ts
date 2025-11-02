import { db } from "../../../../lib/db";
import { Media } from "../../entity";

export const fetchMediaByPath = async (relativePath: string): Promise<Media | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Media);

  return repository.findOne({
    where: { relativePath },
    relations: {
      postMedia: {
        post: {
          channel: true,
        },
      },
    },
  });
};
