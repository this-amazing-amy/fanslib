import type { Hashtag } from "../../hashtag";

export type FetchHashtagsByIdsRequest = {
  ids: (string | number)[];
};

export type FetchHashtagsByIdsResponse = Hashtag[];

