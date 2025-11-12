import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Channel } from "../../entity";

export const DeleteChannelRequestParamsSchema = t.Object({
  id: t.String(),
});

export const DeleteChannelResponseSchema = t.Object({
  success: t.Boolean(),
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

