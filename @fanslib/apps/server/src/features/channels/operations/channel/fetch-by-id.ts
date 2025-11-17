import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Channel, ChannelSchema } from "../../entity";

export const FetchChannelByIdRequestParamsSchema = t.Object({
  id: t.String(),
});

export const FetchChannelByIdResponseSchema = ChannelSchema;

export const fetchChannelById = async (id: string): Promise<typeof FetchChannelByIdResponseSchema.static | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Channel);

  return repository.findOne({
    where: { id },
    relations: { type: true, defaultHashtags: true },
  });
};

