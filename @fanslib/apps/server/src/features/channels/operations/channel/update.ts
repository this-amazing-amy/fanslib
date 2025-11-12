import { t } from "elysia";
import { db } from "../../../../lib/db";
import { HashtagSchema } from "../../../hashtags/entity";
import { Channel, ChannelSchema, ChannelTypeSchema } from "../../entity";

export const UpdateChannelRequestParamsSchema = t.Object({
  id: t.String(),
});

export const UpdateChannelRequestBodySchema = t.Partial(t.Omit(ChannelSchema, ['id']));

export const UpdateChannelResponseSchema = t.Composite([
  ChannelSchema,
  t.Object({
    type: ChannelTypeSchema,
    defaultHashtags: t.Array(HashtagSchema),
  }),
]);

export const updateChannel = async (
  id: string,
  updates: Partial<Channel>
): Promise<typeof UpdateChannelResponseSchema.static | null> => {
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

