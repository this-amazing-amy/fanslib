import { db } from "../../../../lib/db";
import { Media } from "../../entity";

export const getMediaById = async (id: string): Promise<Media | null> => {
  const database = await db();
  return database.manager.findOne(Media, {
    where: { id },
    relations: {
      postMedia: {
        post: {
          channel: true,
          subreddit: true,
        },
      },
      mediaTags: true,
    },
  });
};

