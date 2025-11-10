import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Channel, ChannelSchema, ChannelTypeSchema } from "../../entity";
import { HashtagSchema } from "../../../hashtags/entity";

export const CreateChannelRequestBodySchema = t.Object({
  name: t.String(),
  typeId: t.String(),
  description: t.Optional(t.String()),
  eligibleMediaFilter: t.Optional(t.Any()),
});

export const CreateChannelResponseSchema = t.Intersect([
  ChannelSchema,
  t.Object({
    type: ChannelTypeSchema,
    defaultHashtags: t.Array(HashtagSchema),
  }),
]);

export const createChannel = async ({
  name,
  typeId,
  description,
  eligibleMediaFilter,
}: typeof CreateChannelRequestBodySchema.static): Promise<Channel> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Channel);

  const channel = new Channel();
  channel.name = name;
  channel.typeId = typeId;
  channel.description = description;
  channel.eligibleMediaFilter = eligibleMediaFilter;

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