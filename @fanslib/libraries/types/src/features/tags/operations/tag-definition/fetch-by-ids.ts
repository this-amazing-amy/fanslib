import type { TagDefinitionWithDimension } from "../../tag-definition";

export type FetchTagDefinitionsByIdsRequest = {
  ids: (string | number)[];
};

export type FetchTagDefinitionsByIdsResponse = TagDefinitionWithDimension[];

