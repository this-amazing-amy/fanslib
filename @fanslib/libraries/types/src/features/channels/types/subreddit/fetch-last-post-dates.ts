export type FetchLastPostDatesForSubredditsRequest = {
  subredditIds: string[];
};

export type FetchLastPostDatesForSubredditsResponse = Array<{
  subredditId: string;
  lastPostDate: Date | null;
}>;
