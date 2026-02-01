import { z } from "zod";
import { validateColorFormat } from "../../../../lib/color";
import { db } from "../../../../lib/db";
import { TagDefinition, TagDefinitionSchema } from "../../entity";
import { syncDenormalizedFieldsForTag } from "../helpers";

export const UpdateTagDefinitionParamsSchema = z.object({
  id: z.string(),
});

export const UpdateTagDefinitionRequestBodySchema = TagDefinitionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const UpdateTagDefinitionResponseSchema = TagDefinitionSchema.extend({
  parent: z.any().optional(),
  children: z.array(z.any()).optional(),
});

export const updateTagDefinition = async (
  id: number,
  payload: z.infer<typeof UpdateTagDefinitionRequestBodySchema>
): Promise<z.infer<typeof UpdateTagDefinitionResponseSchema> | null> => {
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
    const colorError = validateColorFormat(payload.color);
    if (colorError) {
      throw new Error(`Invalid color format: ${colorError}`);
    }
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

  return tag as z.infer<typeof UpdateTagDefinitionResponseSchema>;
};

