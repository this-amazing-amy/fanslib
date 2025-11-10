import { t } from "elysia";
import { db } from "../../../../lib/db";
import { CaptionSnippet } from "../../entity";

export const DeleteSnippetRequestParamsSchema = t.Object({
  id: t.String(),
});

export const DeleteSnippetResponseSchema = t.Object({
  success: t.Boolean(),
});

export const deleteSnippet = async (payload: typeof DeleteSnippetRequestParamsSchema.static): Promise<typeof DeleteSnippetResponseSchema.static> => {
  const database = await db();
  const snippetRepository = database.getRepository(CaptionSnippet);
  await snippetRepository.delete({ id: payload.id });
  return { success: true };
};
