import type { TagDimension } from "../../tag-dimension";

export type UpdateTagDimensionRequest = {
  name?: string;
  description?: string;
  validationSchema?: string;
  sortOrder?: number;
  stickerDisplay?: "none" | "color" | "short";
  isExclusive?: boolean;
};

export type UpdateTagDimensionResponse = TagDimension;

