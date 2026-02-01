import { z } from "zod";
import { db } from "../../../../lib/db";
import { Channel } from "../../entity";

export const DeleteChannelRequestParamsSchema = z.object({
  id: z.string(),
});

export const DeleteChannelResponseSchema = z.object({
  success: z.boolean(),
});

export const deleteChannel = async (id: string): Promise<boolean> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Channel);
  const channel = await repository.findOne({ where: { id } });
  if (!channel) {
    return false;
  }
  await repository.delete({ id });
  return true;
};
