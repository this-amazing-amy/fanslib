import type {
  Post,
  PostChannelSelect,
  PostMediaWithMediaSelect,
  PostSubredditSelect,
} from "../../post";

export type RemoveMediaFromPostRequest = {
  mediaIds: string[];
};

export type RemoveMediaFromPostResponse = (Post & {
  postMedia?: PostMediaWithMediaSelect[];
  channel?: PostChannelSelect;
  subreddit?: PostSubredditSelect;
}) | null;

