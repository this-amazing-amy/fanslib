import type { MediaTag } from "../../media-tag";

export type BulkAssignTagsRequest = Array<{
  mediaId: string;
  tagDefinitionIds: number[];
  source: "manual" | "automated" | "imported";
  confidence?: number;
}>;

export type BulkAssignTagsResponse = {
  success: boolean;
  assignedTags: MediaTag[];
};

