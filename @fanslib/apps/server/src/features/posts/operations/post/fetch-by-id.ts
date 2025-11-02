import { db } from "../../../../lib/db";
import { Post } from "../../entity";

export const getPostById = async (id: string): Promise<Post | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Post);

  return repository.findOne({
    where: { id },
    relations: {
      postMedia: {
        media: true,
      },
      channel: {
        type: true,
        defaultHashtags: true,
      },
      subreddit: true,
    },
    order: {
      postMedia: {
        order: "ASC",
      },
    },
  });
};

