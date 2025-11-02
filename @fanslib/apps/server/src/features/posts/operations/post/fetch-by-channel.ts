import { db } from "../../../../lib/db";
import { Post } from "../../entity";

export const fetchPostsByChannel = async (channelId: string): Promise<Post[]> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Post);

  return repository.find({
    where: { channelId },
    relations: {
      postMedia: {
        media: true,
      },
      channel: {
        type: true,
      },
    },
    order: {
      date: "DESC",
      postMedia: {
        order: "ASC",
      },
    },
  });
};

