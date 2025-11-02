import type { Channel as ChannelType } from "@fanslib/types";
import { db } from "../../../../lib/db";
import { Channel } from "../../entity";

export const updateChannel = async (
  id: string,
  updates: Partial<Omit<ChannelType, "id" | "type">>
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

