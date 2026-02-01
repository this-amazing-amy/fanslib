import { z } from "zod";
import { db } from "../../../../lib/db";
import { validateMediaTagAssignment } from "../../drift-prevention";
import { MediaTagSchema, TagDefinition, TagSourceSchema } from "../../entity";
import { assignTagsToMedia } from "./assign";

export const BulkAssignTagsRequestBodySchema = z.array(z.object({
  mediaId: z.string(),
  tagDefinitionIds: z.array(z.number()),
  source: TagSourceSchema,
  confidence: z.number().optional(),
}));

export const BulkAssignTagsResponseSchema = z.array(MediaTagSchema);


export const bulkAssignTags = async (payload: z.infer<typeof BulkAssignTagsRequestBodySchema>): Promise<z.infer<typeof BulkAssignTagsResponseSchema>> => {
  const validationResults = await Promise.all(
    payload.map(async (assignment) => ({
      assignment,
      validation: await validateMediaTagAssignment({
        mediaId: assignment.mediaId,
        tagDefinitionIds: assignment.tagDefinitionIds,
      }),
    }))
  );

  const invalidAssignments = validationResults.filter((result) => !result.validation.isValid);
  if (invalidAssignments.length > 0) {
    const errors = invalidAssignments.map(
      (result) => `Media ${result.assignment.mediaId}: ${result.validation.errors.join(", ")}`
    );
    throw new Error(`Bulk assignment validation failed:\n${errors.join("\n")}`);
  }

  const dataSource = await db();
  // eslint-disable-next-line functional/no-loop-statements
  for (const { assignment } of validationResults) {
    const validTagDefinitionIds = assignment.tagDefinitionIds;

    if (validTagDefinitionIds.length > 0) {
      const tagDefinitionsWithRelations = await dataSource
        .getRepository(TagDefinition)
        .createQueryBuilder("td")
        .leftJoinAndSelect("td.dimension", "dim")
        .where("td.id IN (:...ids)", { ids: validTagDefinitionIds })
        .getMany();

      const dimensionGroups = new Map<number, TagDefinition[]>();
      tagDefinitionsWithRelations.forEach((td) => {
        const existing = dimensionGroups.get(td.dimensionId) ?? [];
        existing.push(td);
        dimensionGroups.set(td.dimensionId, existing);
      });

      // eslint-disable-next-line functional/no-loop-statements
      for (const [dimensionId, tagsInDimension] of dimensionGroups) {
        const dimension = tagsInDimension[0]?.dimension;

        if (!dimension) {
          throw new Error(
            `Bulk assignment failed for media ${assignment.mediaId}: Dimension relation not loaded for dimension ${dimensionId}`
          );
        }

        if (dimension.isExclusive && tagsInDimension.length > 1) {
          throw new Error(
            `Bulk assignment failed for media ${assignment.mediaId}: Only one tag allowed per exclusive dimension. Violation in dimension: ${dimension.name}`
          );
        }
      }
    }
  }

  const results = await Promise.all(payload.map((item) => assignTagsToMedia(item)));

  return results.flat();
};

