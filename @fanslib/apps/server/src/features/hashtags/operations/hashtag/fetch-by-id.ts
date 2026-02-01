import { z } from "zod";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { Hashtag, HashtagChannelStatsSchema, HashtagSchema } from "../../entity";

export const FetchHashtagByIdRequestParamsSchema = z.object({
  id: z.string(),
});

export const FetchHashtagByIdResponseSchema = HashtagSchema.omit({ channelStats: true }).extend({
  channelStats: z.array(
    HashtagChannelStatsSchema.extend({
      channel: ChannelSchema,
    })
  ),
});

export const fetchHashtagById = async (id: number): Promise<z.infer<typeof FetchHashtagByIdResponseSchema> | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Hashtag);

  return repository.findOne({
    where: { id },
    relations: {
      channelStats: {
        channel: {
          type: true,
          defaultHashtags: true,
        },
      },
    },
  });
};

