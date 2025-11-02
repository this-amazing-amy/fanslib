import type { MediaFilters } from "../../../library/types";
import type { VerificationStatus } from "../verification-status";
import type { SubredditPostingTime } from "./posting-time";

export type UpdateSubredditRequest = {
  name: string;
  maxPostFrequencyHours?: number;
  notes?: string;
  memberCount?: number;
  verificationStatus?: VerificationStatus;
  eligibleMediaFilter?: MediaFilters;
  defaultFlair?: string;
  captionPrefix?: string;
  postingTimesData?: SubredditPostingTime[];
  postingTimesLastFetched?: Date;
  postingTimesTimezone?: string;
};

export type UpdateSubredditResponse = {
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
} | null;
