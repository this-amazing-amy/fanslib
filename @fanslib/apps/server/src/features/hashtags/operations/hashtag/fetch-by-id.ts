import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { Hashtag, HashtagChannelStatsSchema, HashtagSchema } from "../../entity";

export const GetHashtagByIdRequestParamsSchema = t.Object({
  id: t.String(),
});

export const GetHashtagByIdResponseSchema = t.Union([
  t.Intersect([HashtagSchema, t.Object({
    channelStats: t.Array(t.Intersect([HashtagChannelStatsSchema, t.Object({ channel: ChannelSchema })])),
  })]),
  t.Object({ error: t.String() }),
  t.Null(),
]);

export const getHashtagById = async (id: number): Promise<typeof GetHashtagByIdResponseSchema.static> => {
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

