import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Channel, ChannelSchema, ChannelTypeSchema } from "../../entity";
import { HashtagSchema } from "../../../hashtags/entity";

export const UpdateChannelRequestParamsSchema = t.Object({
  id: t.String(),
});

export const UpdateChannelRequestBodySchema = t.Partial(t.Omit(ChannelSchema, ['id']));

export const UpdateChannelResponseSchema = t.Union([
  t.Intersect([
    ChannelSchema,
    t.Object({
      type: ChannelTypeSchema,
      defaultHashtags: t.Array(HashtagSchema),
    }),
  ]),
  t.Object({ error: t.String() }),
]);

export const updateChannel = async (
  id: string,
  updates: Partial<Channel>
): Promise<Channel | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Channel);

  const channel = await repository.findOne({
    where: { id },
    relations: { type: true, defaultHashtags: true },
  });

  if (!channel) return null;

  Object.assign(channel, updates);
  await repository.save(channel);

  return repository.findOne({
    where: { id },
    relations: { type: true, defaultHashtags: true },
  });
};

