import { t } from "elysia";
import { db } from "../../../../lib/db";
import { CaptionSnippet } from "../../entity";

export const DeleteSnippetRequestParamsSchema = t.Object({
  id: t.String(),
});

export const DeleteSnippetResponseSchema = t.Object({
  success: t.Boolean(),
});

export const deleteSnippet = async (id: string): Promise<boolean> => {
  const database = await db();
  const snippetRepository = database.getRepository(CaptionSnippet);
  const snippet = await snippetRepository.findOne({ where: { id } });
  if (!snippet) {
    return false;
  }
  await snippetRepository.delete({ id });
  return true;
};
