import { z } from "zod";
import { db } from "../../../../lib/db";
import { Channel, ChannelSchema } from "../../entity";

export const FetchChannelByIdRequestParamsSchema = z.object({
  id: z.string(),
});

export const FetchChannelByIdResponseSchema = ChannelSchema;

export const fetchChannelById = async (
  id: string,
): Promise<z.infer<typeof FetchChannelByIdResponseSchema> | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Channel);

  return repository.findOne({
    where: { id },
    relations: { type: true, defaultHashtags: true },
  });
};
