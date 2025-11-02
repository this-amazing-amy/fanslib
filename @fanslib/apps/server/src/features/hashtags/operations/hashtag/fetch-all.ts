import { db } from "../../../../lib/db";
import { Hashtag } from "../../entity";

export const getAllHashtags = async (): Promise<Hashtag[]> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Hashtag);

  return repository.find({
    relations: {
      channelStats: true,
    },
  });
};

