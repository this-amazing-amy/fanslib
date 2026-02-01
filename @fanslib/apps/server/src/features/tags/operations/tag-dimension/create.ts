import type { z } from "zod";
import { db } from "../../../../lib/db";
import { STICKER_DISPLAY_MODES, TagDimension, TagDimensionSchema } from "../../entity";

export const CreateTagDimensionRequestBodySchema = TagDimensionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  tags: true,
}).required({ name: true, dataType: true }).partial({
  description: true,
  validationSchema: true,
  sortOrder: true,
  stickerDisplay: true,
  isExclusive: true,
});

export const CreateTagDimensionResponseSchema = TagDimensionSchema;

export const createTagDimension = async (payload: z.infer<typeof CreateTagDimensionRequestBodySchema>): Promise<z.infer<typeof CreateTagDimensionResponseSchema>> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDimension);

  if (payload.stickerDisplay && !STICKER_DISPLAY_MODES.includes(payload.stickerDisplay)) {
    throw new Error(
      `Invalid stickerDisplay value: ${payload.stickerDisplay}. Must be 'none', 'color', or 'short'.`
    );
  }

  const dimension = repository.create({
    ...payload,
    sortOrder: payload.sortOrder ?? 0,
    stickerDisplay: payload.stickerDisplay ?? "none",
    isExclusive: payload.isExclusive ?? false,
  });

  return repository.save(dimension);
};

