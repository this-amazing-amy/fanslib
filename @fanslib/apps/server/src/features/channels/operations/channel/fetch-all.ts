import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Channel, ChannelSchema, ChannelTypeSchema } from "../../entity";
import { HashtagSchema } from "../../../hashtags/entity";

export const FetchAllChannelsResponseSchema = t.Array(
  t.Intersect([
    ChannelSchema,
    t.Object({
      type: ChannelTypeSchema,
      defaultHashtags: t.Array(HashtagSchema),
    }),
  ])
);

export const fetchAllChannels = async (): Promise<Channel[]> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Channel);

  return repository.find({
    relations: { type: true, defaultHashtags: true },
  });
};

