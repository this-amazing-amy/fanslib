import type {
  Post,
  PostChannelSelect,
  PostFilters,
  PostMediaWithMediaSelect,
  PostSubredditSelect,
} from "../../post";

export type FetchAllPostsRequest = {
  filters?: PostFilters;
};

export type FetchAllPostsResponse = Array<
  Post & {
    postMedia?: PostMediaWithMediaSelect[];
    channel?: PostChannelSelect;
    subreddit?: PostSubredditSelect;
  }
>;

