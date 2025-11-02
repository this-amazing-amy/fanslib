import type { MediaFilters } from "../../../library/types";
import type { Subreddit } from "../../subreddit";
import type { VerificationStatus } from "../../verification-status";

export type CreateSubredditRequest = {
  name: string;
  maxPostFrequencyHours?: number;
  notes?: string;
  memberCount?: number;
  verificationStatus?: VerificationStatus;
  eligibleMediaFilter?: MediaFilters;
  defaultFlair?: string;
  captionPrefix?: string;
};

export type CreateSubredditResponse = Omit<Subreddit, "postingTimesData"> & {
  postingTimesData?: never;
};

