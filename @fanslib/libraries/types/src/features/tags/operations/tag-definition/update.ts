import type { TagDefinition } from "../../tag-definition";

export type UpdateTagDefinitionRequest = {
  value?: string;
  displayName?: string;
  description?: string;
  metadata?: string;
  color?: string;
  shortRepresentation?: string;
  sortOrder?: number;
  parentTagId?: number;
};

export type UpdateTagDefinitionResponse = TagDefinition;

