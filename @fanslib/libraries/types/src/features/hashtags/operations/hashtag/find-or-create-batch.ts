import type { Hashtag } from "../../hashtag";

export type FindOrCreateHashtagsBatchRequest = {
  names: string[];
};

export type FindOrCreateHashtagsBatchResponse = Hashtag[];

