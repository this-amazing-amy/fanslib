import { db } from "../../../../lib/db";
import { Hashtag } from "../../entity";

export const getHashtagsByIds = async (ids: number[]): Promise<Hashtag[]> => {
  if (ids.length === 0) return [];

  const dataSource = await db();
  const repository = dataSource.getRepository(Hashtag);

  return repository.find({
    where: ids.map((id) => ({ id })),
    relations: {
      channelStats: true,
    },
  });
};

