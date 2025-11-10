import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Media } from "../../../library/entity";
import { validateMediaTagAssignment } from "../../drift-prevention";
import { MediaTag, MediaTagSchema, TagDefinition, TagSourceSchema } from "../../entity";
import { populateDenormalizedFields } from "../helpers";

export const AssignTagsToMediaRequestBodySchema = t.Object({
  mediaId: t.String(),
  tagDefinitionIds: t.Array(t.Number()),
  source: TagSourceSchema,
  confidence: t.Optional(t.Number()),
});

export const AssignTagsToMediaResponseSchema = t.Array(MediaTagSchema);


export const assignTagsToMedia = async (payload: typeof AssignTagsToMediaRequestBodySchema.static): Promise<typeof AssignTagsToMediaResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(MediaTag);

  const validation = await validateMediaTagAssignment({
    mediaId: payload.mediaId,
    tagDefinitionIds: payload.tagDefinitionIds,
  });

  if (!validation.isValid) {
    throw new Error(`Tag assignment validation failed: ${validation.errors.join(", ")}`);
  }

  const validTagDefinitionIds = validation.validTagDefinitionIds;

  if (validTagDefinitionIds.length === 0) {
    console.warn(`No valid tag definitions found for assignment to media ${payload.mediaId}`);
    return [];
  }

  const media = await dataSource.getRepository(Media).findOne({ where: { id: payload.mediaId } });
  const tagDefinitionsWithRelations = await dataSource
    .getRepository(TagDefinition)
    .createQueryBuilder("td")
    .leftJoinAndSelect("td.dimension", "dim")
    .where("td.id IN (:...ids)", { ids: validTagDefinitionIds })
    .getMany();

  if (!media) {
    throw new Error(`Media with id ${payload.mediaId} not found`);
  }

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
      throw new Error(`Dimension relation not loaded for tag definitions in dimension ${dimensionId}`);
    }

    if (dimension.isExclusive) {
      if (tagsInDimension.length > 1) {
        throw new Error(
          `Only one tag allowed per exclusive dimension. Violations in dimension: ${dimension.name}`
        );
      }

      await repository
        .createQueryBuilder()
        .delete()
        .where("mediaId = :mediaId", { mediaId: payload.mediaId })
        .andWhere(
          "tagDefinitionId IN (SELECT id FROM tag_definition WHERE dimensionId = :dimensionId)",
          { dimensionId }
        )
        .execute();
    } else {
      const tagDefinitionIds = tagsInDimension.map((td) => td.id);
      await repository
        .createQueryBuilder()
        .delete()
        .where("mediaId = :mediaId", { mediaId: payload.mediaId })
        .andWhere("tagDefinitionId IN (:...tagDefinitionIds)", { tagDefinitionIds })
        .execute();
    }
  }

  const mediaTags = tagDefinitionsWithRelations.map((tagDefinition) => {
    const mediaTagData = {
      mediaId: payload.mediaId,
      media: media,
      tagDefinitionId: tagDefinition.id,
      tag: tagDefinition,
      source: payload.source,
      confidence: payload.confidence,
    };

    populateDenormalizedFields(mediaTagData, tagDefinition);

    return repository.create(mediaTagData);
  });

  return repository.save(mediaTags);
};

