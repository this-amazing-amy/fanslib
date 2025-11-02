import { db } from "../../../../lib/db";
import { Hashtag, HashtagChannelStats } from "../../entity";

export const deleteHashtag = async (id: number): Promise<void> => {
  const dataSource = await db();
  const hashtagRepository = dataSource.getRepository(Hashtag);
  const statsRepository = dataSource.getRepository(HashtagChannelStats);

  // Delete related stats first
  await statsRepository.delete({ hashtagId: id });

  // Then delete the hashtag
  await hashtagRepository.delete({ id });
};

