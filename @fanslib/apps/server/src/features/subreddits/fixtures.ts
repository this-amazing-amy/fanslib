import { getTestDataSource } from "../../lib/test-db";
import { Subreddit as SubredditEntity } from "./entity";
import { SUBREDDIT_FIXTURES } from "./fixtures-data";

export { SUBREDDIT_FIXTURES } from "./fixtures-data";

export const seedSubredditFixtures = async () => {
  const dataSource = getTestDataSource();
  const subredditRepo = dataSource.getRepository(SubredditEntity);

  // eslint-disable-next-line functional/no-loop-statements
  for (const fixture of SUBREDDIT_FIXTURES) {
    const existing = await subredditRepo.findOne({ where: { id: fixture.id } });
    if (!existing) {
      const subreddit = subredditRepo.create({
        id: fixture.id,
        maxPostFrequencyHours: fixture.maxPostFrequencyHours,
        notes: fixture.notes,
        memberCount: fixture.memberCount,
        verificationStatus: fixture.verificationStatus,
        defaultFlair: fixture.defaultFlair,
        captionPrefix: fixture.captionPrefix,
        channelId: fixture.channelId,
      });
      await subredditRepo.save(subreddit);
    }
  }

  return await subredditRepo.find();
};

