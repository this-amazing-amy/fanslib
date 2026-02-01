import { z } from "zod";
import { db } from "../../../../lib/db";
import { CaptionSnippet } from "../../entity";

export const DeleteSnippetRequestParamsSchema = z.object({
  id: z.string(),
});

export const DeleteSnippetResponseSchema = z.object({
  success: z.boolean(),
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
