import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { Hashtag, HashtagChannelStatsSchema, HashtagSchema } from "../../entity";

export const FetchHashtagByIdRequestParamsSchema = t.Object({
  id: t.String(),
});

export const FetchHashtagByIdResponseSchema = t.Composite([
  t.Omit(HashtagSchema, ["channelStats"]),
  t.Object({
    channelStats: t.Array(t.Composite([
      HashtagChannelStatsSchema,
      t.Object({ channel: ChannelSchema }),
    ])),
  }),
]);

export const fetchHashtagById = async (id: number): Promise<typeof FetchHashtagByIdResponseSchema.static | null> => {
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

