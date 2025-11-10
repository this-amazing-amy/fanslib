import { t } from "elysia";
import { db } from "../../../../lib/db";
import { STICKER_DISPLAY_MODES, TagDimension, TagDimensionSchema } from "../../entity";
import { syncDenormalizedFieldsForDimension, validateExistingAssignments } from "../helpers";

export const UpdateTagDimensionParamsSchema = t.Object({
  id: t.Number(),
});

export const UpdateTagDimensionRequestBodySchema = t.Omit(TagDimensionSchema, ["id", "createdAt", "updatedAt"]);

export const UpdateTagDimensionResponseSchema = TagDimensionSchema;

export const updateTagDimension = async (
  params: typeof UpdateTagDimensionParamsSchema.static,
  payload: typeof UpdateTagDimensionRequestBodySchema.static
): Promise<typeof UpdateTagDimensionResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDimension);

  if (payload.stickerDisplay && !STICKER_DISPLAY_MODES.includes(payload.stickerDisplay)) {
    throw new Error(
      `Invalid stickerDisplay value: ${payload.stickerDisplay}. Must be 'none', 'color', or 'short'.`
    );
  }

  if (payload.isExclusive !== undefined && payload.isExclusive) {
    const currentDimension = await repository.findOne({ where: { id: params.id } });
    if (currentDimension && !currentDimension.isExclusive) {
      await validateExistingAssignments(params.id);
    }
  }

  await repository.update(params.id, payload);
  const dimension = await repository.findOne({ where: { id: params.id } });

  if (!dimension) {
    throw new Error(`TagDimension with id ${params.id} not found`);
  }

  if (payload.stickerDisplay !== undefined) {
    await syncDenormalizedFieldsForDimension(params.id);
  }

  return dimension;
};

