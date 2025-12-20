import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Channel, ChannelSchema } from "../../entity";
import { findOrCreateHashtags } from "../../../hashtags/operations/hashtag/find-or-create";

export const UpdateChannelRequestParamsSchema = t.Object({
  id: t.String(),
});

export const UpdateChannelRequestBodySchema = t.Partial(
  t.Object({
    name: t.String(),
    description: t.Nullable(t.String()),
    typeId: t.String(),
    eligibleMediaFilter: t.Nullable(t.Any()),
    defaultHashtags: t.Array(t.String()),
  })
);

export const UpdateChannelResponseSchema = ChannelSchema;

export const updateChannel = async (
  id: string,
  updates: typeof UpdateChannelRequestBodySchema.static
): Promise<typeof UpdateChannelResponseSchema.static | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Channel);

  const channel = await repository.findOne({
    where: { id },
    relations: { type: true, defaultHashtags: true },
  });

  if (!channel) return null;

  // Extract defaultHashtags from updates to handle separately
  const { defaultHashtags, ...otherUpdates } = updates;

  // Update basic fields
  Object.assign(channel, otherUpdates);

  // Handle defaultHashtags ManyToMany relationship
  if (defaultHashtags !== undefined) {
    if (defaultHashtags.length === 0) {
      // Clear all default hashtags
      channel.defaultHashtags = [];
    } else {
      // Find or create hashtags by names
      const hashtags = await findOrCreateHashtags(defaultHashtags);
      channel.defaultHashtags = hashtags;
    }
  }

  await repository.save(channel);

  return repository.findOne({
    where: { id },
    relations: { type: true, defaultHashtags: true },
  });
};

