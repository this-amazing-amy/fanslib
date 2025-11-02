import type { TagDefinition } from "../../tag-definition";

export type CreateTagDefinitionRequest = {
  dimensionId: number;
  value: string;
  displayName: string;
  description?: string;
  metadata?: string;
  color?: string;
  shortRepresentation?: string;
  sortOrder?: number;
  parentTagId?: number;
};

export type CreateTagDefinitionResponse = TagDefinition;

