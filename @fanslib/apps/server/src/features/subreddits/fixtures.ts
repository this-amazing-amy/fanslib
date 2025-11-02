import type { Subreddit } from "@fanslib/types";
import { VERIFICATION_STATUS } from "@fanslib/types";
import { getTestDataSource } from "../../lib/db.test";
import { Subreddit as SubredditEntity } from "./entity";

export type SubredditFixture = Omit<Subreddit, "eligibleMediaFilter" | "postingTimesData" | "postingTimesLastFetched" | "postingTimesTimezone">;

export const SUBREDDIT_FIXTURES: SubredditFixture[] = [
  {
    id: "subreddit-1",
    name: "r/TestSubreddit",
    maxPostFrequencyHours: 24,
    memberCount: 10000,
    verificationStatus: VERIFICATION_STATUS.UNKNOWN,
    defaultFlair: "OC",
    captionPrefix: "Check this out!",
  },
  {
    id: "subreddit-2",
    name: "r/AnotherSub",
    maxPostFrequencyHours: 12,
    memberCount: 5000,
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    notes: "Verified subreddit",
  },
];

export const seedSubredditFixtures = async () => {
  const dataSource = getTestDataSource();
  const subredditRepo = dataSource.getRepository(SubredditEntity);

  // eslint-disable-next-line functional/no-loop-statements
  for (const fixture of SUBREDDIT_FIXTURES) {
    const existing = await subredditRepo.findOne({ where: { id: fixture.id } });
    if (!existing) {
      const subreddit = subredditRepo.create({
        id: fixture.id,
        name: fixture.name,
        maxPostFrequencyHours: fixture.maxPostFrequencyHours,
        notes: fixture.notes,
        memberCount: fixture.memberCount,
        verificationStatus: fixture.verificationStatus,
        defaultFlair: fixture.defaultFlair,
        captionPrefix: fixture.captionPrefix,
      });
      await subredditRepo.save(subreddit);
    }
  }

  return await subredditRepo.find();
};

