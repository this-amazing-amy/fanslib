import type { CreateChannelRequest } from "@fanslib/types";
import { db } from "../../../../lib/db";
import { Channel } from "../../entity";

export const createChannel = async ({
  name,
  typeId,
  description,
  eligibleMediaFilter,
}: CreateChannelRequest): Promise<Channel> => {
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