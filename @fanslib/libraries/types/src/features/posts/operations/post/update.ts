import type {
  Post,
  PostChannelSelect,
  PostMediaWithMediaSelect,
  PostSubredditSelect,
} from "../../post";

export type UpdatePostRequest = Partial<Post>;

export type UpdatePostResponse = (Post & {
  postMedia?: PostMediaWithMediaSelect[];
  channel?: PostChannelSelect;
  subreddit?: PostSubredditSelect;
}) | null;

