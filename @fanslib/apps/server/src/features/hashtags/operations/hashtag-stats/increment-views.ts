import { db } from "../../../../lib/db";
import { Hashtag, HashtagChannelStats } from "../../entity";

export const incrementHashtagViews = async (
  hashtagId: number,
  channelId: string,
  viewCount: number
): Promise<HashtagChannelStats> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(HashtagChannelStats);
  const hashtagRepository = dataSource.getRepository(Hashtag);

  const hashtag = await hashtagRepository.findOne({ where: { id: hashtagId } });
  if (!hashtag) {
    throw new Error(`Hashtag with id ${hashtagId} not found`);
  }

  // eslint-disable-next-line functional/no-let
  let stats = await repository.findOne({
    where: { hashtagId, channelId },
  });

  if (!stats) {
    stats = repository.create({
      hashtagId,
      channelId,
      views: viewCount,
      hashtag,
    });
  } else {
    stats.views = viewCount;
  }

  return repository.save(stats);
};

