import type { StickerDisplayMode } from "./sticker-display-mode";
import type { TagDefinition } from "./tag-definition";

export type TagDimension = {
  id: number;
  name: string;
  description?: string;
  dataType: "categorical" | "numerical" | "boolean";
  validationSchema?: string;
  sortOrder: number;
  stickerDisplay: StickerDisplayMode;
  isExclusive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TagDimensionWithTags = TagDimension & { tags: TagDefinition[] };

