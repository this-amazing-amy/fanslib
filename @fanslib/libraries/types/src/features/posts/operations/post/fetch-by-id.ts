import type {
  Post,
  PostChannelSelect,
  PostMediaWithMediaSelect,
  PostSubredditSelect,
} from "../../post";

export type FetchPostByIdRequest = never;

export type FetchPostByIdResponse = (Post & {
  postMedia?: PostMediaWithMediaSelect[];
  channel?: PostChannelSelect;
  subreddit?: PostSubredditSelect;
}) | null;

