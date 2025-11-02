import { db } from "../../../../lib/db";
import { Hashtag } from "../../entity";

export const getHashtagById = async (id: number): Promise<Hashtag | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Hashtag);

  return repository.findOne({
    where: { id },
    relations: {
      channelStats: {
        channel: true,
      },
    },
  });
};

