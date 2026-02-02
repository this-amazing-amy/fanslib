import type { Subreddit } from "./entity";
import { VERIFICATION_STATUS } from "./entity";

export type SubredditFixture = Omit<Subreddit, "eligibleMediaFilter" | "postingTimesData" | "postingTimesLastFetched" | "postingTimesTimezone" | "channel">;

export const SUBREDDIT_FIXTURES: SubredditFixture[] = [
  {
    id: "subreddit-1",
    name: "r/TestSubreddit",
    maxPostFrequencyHours: 24,
    memberCount: 10000,
    verificationStatus: VERIFICATION_STATUS.UNKNOWN,
    defaultFlair: "OC",
    captionPrefix: "Check this out!",
    notes: null,
    channelId: "channel-3",
  },
  {
    id: "subreddit-2",
    name: "r/AnotherSub",
    maxPostFrequencyHours: 12,
    memberCount: 5000,
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    notes: "Verified subreddit",
    defaultFlair: "OC",
    captionPrefix: "Check this out!",
    channelId: null,
  },
];
