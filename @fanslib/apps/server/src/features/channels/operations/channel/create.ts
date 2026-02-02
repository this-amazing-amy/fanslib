import { z } from "zod";
import { db } from "../../../../lib/db";
import { Channel, ChannelSchema } from "../../entity";

export const CreateChannelRequestBodySchema = z.object({
  name: z.string(),
  typeId: z.string(),
  description: z.string().optional(),
  eligibleMediaFilter: z.unknown().optional(),
  postCooldownHours: z.number().int().optional(),
  mediaRepostCooldownHours: z.number().int().optional(),
});

export const CreateChannelResponseSchema = ChannelSchema;

export const createChannel = async ({
  name,
  typeId,
  description,
  eligibleMediaFilter,
  postCooldownHours,
  mediaRepostCooldownHours,
}: z.infer<typeof CreateChannelRequestBodySchema>): Promise<Channel> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Channel);

  const channel = repository.create({
    name,
    typeId,
    description: description ?? null,
    eligibleMediaFilter: eligibleMediaFilter ?? null,
    postCooldownHours: postCooldownHours ?? null,
    mediaRepostCooldownHours: mediaRepostCooldownHours ?? null,
  });

  const { id } = await repository.save(channel);
  const savedChannel = await repository.findOne({
    where: { id },
    relations: { type: true, defaultHashtags: true },
  });

  if (!savedChannel) {
    throw new Error(`Channel with id ${id} not found`);
  }

  return savedChannel;
};