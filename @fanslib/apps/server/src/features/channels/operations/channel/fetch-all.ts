import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Channel, ChannelSchema } from "../../entity";

export const FetchAllChannelsResponseSchema = t.Array(ChannelSchema);

export const fetchAllChannels = async (): Promise<Channel[]> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Channel);

  return repository.find({
    relations: { type: true, defaultHashtags: true },
  });
};

