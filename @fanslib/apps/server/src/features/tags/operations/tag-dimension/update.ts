import type { UpdateTagDimensionRequest } from "@fanslib/types";
import { db } from "../../../../lib/db";
import { STICKER_DISPLAY_MODES, TagDimension } from "../../entity";
import { syncDenormalizedFieldsForDimension, validateExistingAssignments } from "../helpers";

export const updateTagDimension = async (
  id: number,
  dto: UpdateTagDimensionRequest
): Promise<TagDimension> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDimension);

  if (dto.stickerDisplay && !STICKER_DISPLAY_MODES.includes(dto.stickerDisplay)) {
    throw new Error(
      `Invalid stickerDisplay value: ${dto.stickerDisplay}. Must be 'none', 'color', or 'short'.`
    );
  }

  if (dto.isExclusive !== undefined && dto.isExclusive) {
    const currentDimension = await repository.findOne({ where: { id } });
    if (currentDimension && !currentDimension.isExclusive) {
      await validateExistingAssignments(id);
    }
  }

  await repository.update(id, dto);
  const dimension = await repository.findOne({ where: { id } });

  if (!dimension) {
    throw new Error(`TagDimension with id ${id} not found`);
  }

  if (dto.stickerDisplay !== undefined) {
    await syncDenormalizedFieldsForDimension(id);
  }

  return dimension;
};

