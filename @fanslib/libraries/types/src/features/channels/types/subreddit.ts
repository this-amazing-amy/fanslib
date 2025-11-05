import type { MediaFilters } from "../../library/types";
import type { SubredditPostingTime } from "../subreddit/posting-time";
import type { VerificationStatus } from "../verification-status";

export type Subreddit = {
  id: string;
  name: string;
  maxPostFrequencyHours?: number;
  notes?: string;
  memberCount?: number;
  verificationStatus: VerificationStatus;
  eligibleMediaFilter?: MediaFilters;
  defaultFlair?: string;
  captionPrefix?: string;
  postingTimesData?: SubredditPostingTime[];
  postingTimesLastFetched?: Date;
  postingTimesTimezone?: string;
};

