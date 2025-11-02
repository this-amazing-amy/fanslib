import type { TagDefinition } from "../../tag-definition";

export type FetchTagDefinitionsByIdsRequest = {
  ids: (string | number)[];
};

export type FetchTagDefinitionsByIdsResponse = TagDefinition[];

