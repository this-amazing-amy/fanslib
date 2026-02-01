import type { z } from "zod";
import { validateColorFormat } from "../../../../lib/color";
import { db } from "../../../../lib/db";
import { TagDefinition, TagDefinitionSchema, TagDimension } from "../../entity";
import { assignColorForCategoricalTag } from "../helpers";

export const CreateTagDefinitionRequestBodySchema = TagDefinitionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).required({ dimensionId: true, value: true, displayName: true }).partial({
  description: true,
  metadata: true,
  color: true,
  shortRepresentation: true,
  sortOrder: true,
  parentTagId: true,
});

export const CreateTagDefinitionResponseSchema = TagDefinitionSchema;

export const createTagDefinition = async (dto: z.infer<typeof CreateTagDefinitionRequestBodySchema>): Promise<z.infer<typeof CreateTagDefinitionResponseSchema>> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDefinition);
  const dimensionRepository = dataSource.getRepository(TagDimension);

  const dimension = await dimensionRepository.findOne({ where: { id: dto.dimensionId } });

  if (!dimension) {
    throw new Error(`TagDimension with id ${dto.dimensionId} not found`);
  }

  const trimmedValue = dto.value.trim();
  const existingTag = await repository.findOne({
    where: {
      dimensionId: dto.dimensionId,
      value: trimmedValue,
    },
  });

  if (existingTag) {
    throw new Error(
      `Tag with value "${trimmedValue}" already exists in dimension "${dimension.name}"`
    );
  }

  if (dto.color) {
    const colorError = validateColorFormat(dto.color);
    if (colorError) {
      throw new Error(`Invalid color format: ${colorError}`);
    }
  }

  const assignedColor = await assignColorForCategoricalTag(dto.dimensionId, dto.color ?? undefined);

  const tag = repository.create({
    ...dto,
    value: trimmedValue,
    color: assignedColor,
    sortOrder: dto.sortOrder ?? 0,
  });
  tag.dimension = dimension;

  const saved = await repository.save(tag);

  return saved;
};

