import { z } from "zod";
import { db } from "../../../../lib/db";
import { CaptionSnippet, CaptionSnippetSchema } from "../../entity";

export const UpdateSnippetRequestParamsSchema = z.object({
  id: z.string(),
});

export const UpdateSnippetRequestBodySchema = z.object({
  name: z.string().optional(),
  content: z.string().optional(),
  channelId: z.string().optional(),
});

export const UpdateSnippetResponseSchema = CaptionSnippetSchema.omit({ channelId: true });

export const updateSnippet = async (
  id: string,
  data: z.infer<typeof UpdateSnippetRequestBodySchema>,
): Promise<z.infer<typeof UpdateSnippetResponseSchema> | null> => {
  const dataSource = await db();
  const repo = dataSource.getRepository(CaptionSnippet);

  const snippet = await repo.findOne({ where: { id } });
  if (!snippet) {
    return null;
  }

  if (data.name && data.name !== snippet.name) {
    const existing = await repo.findOne({
      where: {
        name: data.name,
        channelId: data.channelId ?? snippet.channelId,
      },
    });

    if (existing && existing.id !== id) {
      throw new Error(
        data.channelId !== undefined
          ? "A snippet with this name already exists for this channel"
          : "A global snippet with this name already exists"
      );
    }
  }

  Object.assign(snippet, data);
  const savedSnippet = await repo.save(snippet);
  
  const { channelId: _, ...snippetWithoutChannelId } = savedSnippet;
  return snippetWithoutChannelId;
};

