import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Channel, ChannelSchema } from "../../entity";

export const CreateChannelRequestBodySchema = t.Object({
  name: t.String(),
  typeId: t.String(),
  description: t.Optional(t.String()),
  eligibleMediaFilter: t.Optional(t.Any()),
});

export const CreateChannelResponseSchema = ChannelSchema;

export const createChannel = async ({
  name,
  typeId,
  description,
  eligibleMediaFilter,
}: typeof CreateChannelRequestBodySchema.static): Promise<Channel> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Channel);

  const channel = repository.create({
    name,
    typeId,
    description: description ?? null,
    eligibleMediaFilter: eligibleMediaFilter ?? null,
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