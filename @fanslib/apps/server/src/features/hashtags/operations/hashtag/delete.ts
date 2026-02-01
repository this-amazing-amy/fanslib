import { z } from "zod";
import { db } from "../../../../lib/db";
import { Hashtag, HashtagChannelStats } from "../../entity";

export const DeleteHashtagRequestParamsSchema = z.object({
  id: z.string(),
});

export const DeleteHashtagResponseSchema = z.object({
  success: z.boolean(),
});

export const deleteHashtag = async (id: number): Promise<boolean> => {
  const dataSource = await db();
  const hashtagRepository = dataSource.getRepository(Hashtag);
  const statsRepository = dataSource.getRepository(HashtagChannelStats);
  const hashtag = await hashtagRepository.findOne({ where: { id } });
  if (!hashtag) {
    return false;
  }
  await statsRepository.delete({ hashtagId: id });
  await hashtagRepository.delete({ id });
  return true;
};

