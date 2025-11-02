import type { UpdateTagDefinitionRequest } from "@fanslib/types";
import { normalizeHexColor, validateHexColor } from "../../../../lib/color";
import { db } from "../../../../lib/db";
import { TagDefinition } from "../../entity";
import { syncDenormalizedFieldsForTag } from "../helpers";

export const updateTagDefinition = async (
  id: number,
  dto: UpdateTagDefinitionRequest
): Promise<TagDefinition> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDefinition);

  const currentTag = await repository.findOne({
    where: { id },
    relations: ["dimension"],
  });

  if (!currentTag) {
    throw new Error(`TagDefinition with id ${id} not found`);
  }

  if (dto.value && dto.value !== currentTag.value) {
    const trimmedValue = dto.value.trim();
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

    dto.value = trimmedValue;
  }

  if (dto.color) {
    const colorError = validateHexColor(dto.color);
    if (colorError) {
      throw new Error(`Invalid color format: ${colorError}`);
    }
    dto.color = normalizeHexColor(dto.color);
  }

  await repository.update(id, dto);
  const tag = await repository.findOne({
    where: { id },
    relations: ["dimension", "parent", "children"],
  });

  if (!tag) {
    throw new Error(`TagDefinition with id ${id} not found`);
  }

  await syncDenormalizedFieldsForTag(id);

  return tag;
};

