import { t } from "elysia";
import { normalizeHexColor, validateHexColor } from "../../../../lib/color";
import { db } from "../../../../lib/db";
import { TagDefinition, TagDefinitionSchema } from "../../entity";
import { syncDenormalizedFieldsForTag } from "../helpers";

export const UpdateTagDefinitionParamsSchema = t.Object({
  id: t.String(),
});

export const UpdateTagDefinitionRequestBodySchema = t.Partial(t.Omit(TagDefinitionSchema, ["id", "createdAt", "updatedAt"]));

export const UpdateTagDefinitionResponseSchema = t.Object({
  ...TagDefinitionSchema.properties,
  parent: t.Optional(t.Any()),
  children: t.Optional(t.Array(t.Any())),
});

export const updateTagDefinition = async (
  id: number,
  payload: typeof UpdateTagDefinitionRequestBodySchema.static
): Promise<typeof UpdateTagDefinitionResponseSchema.static | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDefinition);

  const currentTag = await repository.findOne({
    where: { id },
    relations: ["dimension"],
  });

  if (!currentTag) {
    return null;
  }

  if (payload.value && payload.value !== currentTag.value) {
    const trimmedValue = payload.value.trim();
    const existingTag = await repository.findOne({
      where: {
        dimensionId: currentTag.dimensionId,
        value: trimmedValue,
      },
    });

    if (existingTag && existingTag.id !== id) {
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

  const updatePayload = Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => value !== undefined && !["dimension", "parent", "children", "mediaTags"].includes(key))
  ) as Partial<Omit<TagDefinition, "dimension" | "parent" | "children" | "mediaTags">>;

  await repository.update(id, updatePayload);
  const tag = await repository.findOne({
    where: { id },
    relations: ["parent", "children"],
  });

  if (!tag) {
    return null;
  }

  await syncDenormalizedFieldsForTag(id);

  return tag as typeof UpdateTagDefinitionResponseSchema.static;
};

