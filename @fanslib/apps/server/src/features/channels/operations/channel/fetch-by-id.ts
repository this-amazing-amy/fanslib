import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Channel, ChannelSchema, ChannelTypeSchema } from "../../entity";
import { HashtagSchema } from "../../../hashtags/entity";

export const FetchChannelByIdRequestParamsSchema = t.Object({
  id: t.String(),
});

export const FetchChannelByIdResponseSchema = t.Union([
  t.Intersect([
    ChannelSchema,
    t.Object({
      type: ChannelTypeSchema,
      defaultHashtags: t.Array(HashtagSchema),
    }),
  ]),
  t.Object({ error: t.String() }),
]);

export const fetchChannelById = async (id: string): Promise<Channel | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Channel);

  return repository.findOne({
    where: { id },
    relations: { type: true, defaultHashtags: true },
  });
};

