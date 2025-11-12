import { t } from "elysia";
import { db } from "../../../../lib/db";
import { STICKER_DISPLAY_MODES, TagDimension, TagDimensionSchema } from "../../entity";
import { syncDenormalizedFieldsForDimension, validateExistingAssignments } from "../helpers";

export const UpdateTagDimensionParamsSchema = t.Object({
  id: t.String(),
});

export const UpdateTagDimensionRequestBodySchema = t.Partial(t.Omit(TagDimensionSchema, ["id", "createdAt", "updatedAt"]));

export const UpdateTagDimensionResponseSchema = TagDimensionSchema;

export const updateTagDimension = async (
  id: number,
  payload: typeof UpdateTagDimensionRequestBodySchema.static
): Promise<typeof UpdateTagDimensionResponseSchema.static | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDimension);

  if (payload.stickerDisplay && !STICKER_DISPLAY_MODES.includes(payload.stickerDisplay)) {
    throw new Error(
      `Invalid stickerDisplay value: ${payload.stickerDisplay}. Must be 'none', 'color', or 'short'.`
    );
  }

  if (payload.isExclusive !== undefined && payload.isExclusive) {
    const currentDimension = await repository.findOne({ where: { id } });
    if (currentDimension && !currentDimension.isExclusive) {
      await validateExistingAssignments(id);
    }
  }

  const updatePayload = Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => value !== undefined && key !== "tags")
  ) as Partial<Omit<TagDimension, "tags">>;

  await repository.update(id, updatePayload);
  const dimension = await repository.findOne({ where: { id } });

  if (!dimension) {
    return null;
  }

  if (payload.stickerDisplay !== undefined) {
    await syncDenormalizedFieldsForDimension(id);
  }

  return dimension;
};

