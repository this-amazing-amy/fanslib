import type { TagDimension } from "../../tag-dimension";

export type CreateTagDimensionRequest = {
  name: string;
  description?: string;
  dataType: "categorical" | "numerical" | "boolean";
  validationSchema?: string;
  sortOrder?: number;
  stickerDisplay?: "none" | "color" | "short";
  isExclusive?: boolean;
};

export type CreateTagDimensionResponse = TagDimension;

