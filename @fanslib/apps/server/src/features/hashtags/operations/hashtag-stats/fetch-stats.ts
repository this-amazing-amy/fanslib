import { db } from "../../../../lib/db";
import { HashtagChannelStats } from "../../entity";

export const getHashtagStats = async (hashtagId: number): Promise<HashtagChannelStats[]> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(HashtagChannelStats);

  return repository.find({
    where: { hashtagId },
    relations: {
      channel: true,
    },
  });
};

