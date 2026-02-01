import { z } from "zod";
import { db } from "../../../../lib/db";
import { Channel, ChannelSchema } from "../../entity";
import { findOrCreateHashtags } from "../../../hashtags/operations/hashtag/find-or-create";

export const UpdateChannelRequestParamsSchema = z.object({
  id: z.string(),
});

export const UpdateChannelRequestBodySchema = z
  .object({
    name: z.string(),
    description: z.string().nullable(),
    typeId: z.string(),
    eligibleMediaFilter: z.unknown().nullable(),
    defaultHashtags: z.array(z.string()),
  })
  .partial();

export const UpdateChannelResponseSchema = ChannelSchema;

export const updateChannel = async (
  id: string,
  updates: z.infer<typeof UpdateChannelRequestBodySchema>,
): Promise<z.infer<typeof UpdateChannelResponseSchema> | null> => {
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
      // Type assertion needed because findOrCreateHashtags returns HashtagSchema[]
      // which may have optional relations, but Channel expects Hashtag[]
      channel.defaultHashtags = hashtags as typeof channel.defaultHashtags;
    }
  }

  await repository.save(channel);

  return repository.findOne({
    where: { id },
    relations: { type: true, defaultHashtags: true },
  });
};
