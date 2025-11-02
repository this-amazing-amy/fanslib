import { db } from "../../../../lib/db";
import { Channel } from "../../entity";

export const fetchAllChannels = async (): Promise<Channel[]> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Channel);

  return repository.find({
    relations: { type: true, defaultHashtags: true },
  });
};

