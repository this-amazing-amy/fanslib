import type { TagDimension } from "./tag-dimension";

export type TagDefinition = {
  id: number;
  dimensionId: number;
  value: string;
  displayName: string;
  description?: string;
  metadata?: string;
  color?: string;
  shortRepresentation?: string;
  sortOrder: number;
  parentTagId?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TagDefinitionWithDimension = TagDefinition & { dimension: TagDimension };

export type TagDefinitionWithParentChildren = TagDefinition & {
  parent?: TagDefinition;
  children: TagDefinition[];
};

