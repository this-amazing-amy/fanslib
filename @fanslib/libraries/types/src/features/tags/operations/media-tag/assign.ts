import type { MediaTag } from "../../media-tag";

export type AssignTagsToMediaRequest = {
  mediaId: string;
  tagDefinitionIds: number[];
  source: "manual" | "automated" | "imported";
  confidence?: number;
};

export type AssignTagsToMediaResponse = MediaTag[];

