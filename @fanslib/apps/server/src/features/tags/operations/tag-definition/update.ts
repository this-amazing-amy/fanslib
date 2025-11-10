import { t } from "elysia";
import { normalizeHexColor, validateHexColor } from "../../../../lib/color";
import { db } from "../../../../lib/db";
import { TagDefinition, TagDefinitionSchema } from "../../entity";
import { syncDenormalizedFieldsForTag } from "../helpers";

export const UpdateTagDefinitionParamsSchema = t.Object({
  id: t.Number(),
});

export const UpdateTagDefinitionRequestBodySchema = t.Omit(TagDefinitionSchema, ["id", "createdAt", "updatedAt"]);

export const UpdateTagDefinitionResponseSchema = t.Intersect([
  TagDefinitionSchema,
  t.Object({
    parent: t.Optional(TagDefinitionSchema),
    children: t.Optional(t.Array(TagDefinitionSchema)),
  }),
]);

export const updateTagDefinition = async (
  params: typeof UpdateTagDefinitionParamsSchema.static,
  payload: typeof UpdateTagDefinitionRequestBodySchema.static
): Promise<typeof UpdateTagDefinitionResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDefinition);

  const currentTag = await repository.findOne({
    where: { id: params.id },
    relations: ["dimension"],
  });

  if (!currentTag) {
    throw new Error(`TagDefinition with id ${params.id} not found`);
  }

  if (payload.value && payload.value !== currentTag.value) {
    const trimmedValue = payload.value.trim();
    const existingTag = await repository.findOne({
      where: {
        dimensionId: currentTag.dimensionId,
        value: trimmedValue,
      },
    });

    if (existingTag && existingTag.id !== params.id) {
      throw new Error(
        `Tag with value "${trimmedValue}" already exists in dimension "${currentTag.dimension.name}"`
      );
    }

    payload.value = trimmedValue;
  }

  if (payload.color) {
    const colorError = validateHexColor(payload.color);
    if (colorError) {
      throw new Error(`Invalid color format: ${colorError}`);
    }
    payload.color = normalizeHexColor(payload.color);
  }

  await repository.update(params.id, payload);
  const tag = await repository.findOne({
    where: { id: params.id },
    relations: ["dimension", "parent", "children"],
  });

  if (!tag) {
    throw new Error(`TagDefinition with id ${params.id} not found`);
  }

  await syncDenormalizedFieldsForTag(params.id);

  return tag;
};

