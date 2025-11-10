import { t } from "elysia";
import { db } from "../../../../lib/db";
import { STICKER_DISPLAY_MODES, TagDimension, TagDimensionSchema } from "../../entity";

export const CreateTagDimensionRequestBodySchema = t.Omit(TagDimensionSchema, ["id", "createdAt", "updatedAt"]);

export const CreateTagDimensionResponseSchema = TagDimensionSchema;

export const createTagDimension = async (payload: typeof CreateTagDimensionRequestBodySchema.static): Promise<typeof CreateTagDimensionResponseSchema.static> => {
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

