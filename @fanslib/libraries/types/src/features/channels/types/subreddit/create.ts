import type { MediaFilters } from "../../../library/types";
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

export type CreateSubredditResponse = {
  id: string;
  name: string;
  maxPostFrequencyHours?: number;
  notes?: string;
  memberCount?: number;
  verificationStatus: VerificationStatus;
  eligibleMediaFilter?: MediaFilters;
  defaultFlair?: string;
  captionPrefix?: string;
  postingTimesData?: never;
  postingTimesLastFetched?: Date;
  postingTimesTimezone?: string;
};
