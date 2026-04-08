import { db } from "../../../../lib/db";
import { Composition } from "../../../compositions/entity";

/**
 * Find compositions that reference a media ID in their segments.
 * Returns composition IDs, or empty array if none.
 */
export const findCompositionReferences = async (mediaId: string): Promise<string[]> => {
  const dataSource = await db();
  const repo = dataSource.getRepository(Composition);
  const compositions = await repo.find();

  return compositions
    .filter((c) => {
      const segments = c.segments as Array<{ sourceMediaId?: string }>;
      return segments.some((s) => s.sourceMediaId === mediaId);
    })
    .map((c) => c.id);
};
