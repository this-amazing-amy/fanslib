import { t } from "elysia";
import { validateColorFormat } from "../../../../lib/color";
import { db } from "../../../../lib/db";
import { TagDefinition, TagDefinitionSchema, TagDimension } from "../../entity";
import { assignColorForCategoricalTag } from "../helpers";

export const CreateTagDefinitionRequestBodySchema = t.Intersect([
  t.Required(t.Pick(t.Omit(TagDefinitionSchema, ["id", "createdAt", "updatedAt"]), ["dimensionId", "value", "displayName"])),
  t.Partial(t.Omit(TagDefinitionSchema, ["id", "createdAt", "updatedAt", "dimensionId", "value", "displayName"])),
]);

export const CreateTagDefinitionResponseSchema = TagDefinitionSchema;

export const createTagDefinition = async (dto: typeof CreateTagDefinitionRequestBodySchema.static): Promise<typeof CreateTagDefinitionResponseSchema.static> => {
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

