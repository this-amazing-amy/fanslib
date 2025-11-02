import type { StickerDisplayMode } from "./sticker-display-mode";

export type MediaTag = {
  id: number;
  mediaId: string;
  tagDefinitionId: number;
  dimensionId: number;
  dimensionName: string;
  dataType: "categorical" | "numerical" | "boolean";
  tagValue: string;
  tagDisplayName: string;
  color?: string;
  stickerDisplay: StickerDisplayMode;
  shortRepresentation?: string;
  numericValue?: number;
  booleanValue?: boolean;
  confidence?: number;
  source: "manual" | "automated" | "imported";
  assignedAt: Date;
};

