import type { Hashtag } from "../../hashtag";

export type FindOrCreateHashtagRequest = {
  name: string;
};

export type FindOrCreateHashtagResponse = Hashtag;

