import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Hashtag, HashtagChannelStats } from "../../entity";

export const DeleteHashtagRequestParamsSchema = t.Object({
  id: t.String(),
});

export const DeleteHashtagResponseSchema = t.Object({
  success: t.Boolean(),
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

