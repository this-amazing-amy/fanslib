import type { CreateTagDimensionRequest } from "@fanslib/types";
import { db } from "../../../../lib/db";
import { STICKER_DISPLAY_MODES, TagDimension } from "../../entity";

export const createTagDimension = async (dto: CreateTagDimensionRequest): Promise<TagDimension> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDimension);

  if (dto.stickerDisplay && !STICKER_DISPLAY_MODES.includes(dto.stickerDisplay)) {
    throw new Error(
      `Invalid stickerDisplay value: ${dto.stickerDisplay}. Must be 'none', 'color', or 'short'.`
    );
  }

  const dimension = repository.create({
    ...dto,
    sortOrder: dto.sortOrder ?? 0,
    stickerDisplay: dto.stickerDisplay ?? "none",
    isExclusive: dto.isExclusive ?? false,
  });

  return repository.save(dimension);
};

