import type {
  Post,
  PostChannelSelect,
  PostMediaWithMediaSelect,
} from "../../post";

export type FetchPostsByChannelRequest = never;

export type FetchPostsByChannelResponse = Array<
  Post & {
    postMedia?: PostMediaWithMediaSelect[];
    channel?: PostChannelSelect;
  }
>;

