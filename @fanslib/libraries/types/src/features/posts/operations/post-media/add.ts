import type {
  Post,
  PostChannelSelect,
  PostMediaWithMediaSelect,
  PostSubredditSelect,
} from "../../post";

export type AddMediaToPostRequest = {
  mediaIds: string[];
};

export type AddMediaToPostResponse = (Post & {
  postMedia?: PostMediaWithMediaSelect[];
  channel?: PostChannelSelect;
  subreddit?: PostSubredditSelect;
}) | null;

