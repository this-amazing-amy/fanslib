
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

