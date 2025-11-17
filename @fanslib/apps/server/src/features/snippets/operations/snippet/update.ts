import { t } from "elysia";
import { db } from "../../../../lib/db";
import { CaptionSnippet, CaptionSnippetSchema } from "../../entity";

export const UpdateSnippetRequestParamsSchema = t.Object({
  id: t.String(),
});

export const UpdateSnippetRequestBodySchema = t.Object({
  name: t.Optional(t.String()),
  content: t.Optional(t.String()),
  channelId: t.Optional(t.String()),
});

export const UpdateSnippetResponseSchema = t.Omit(CaptionSnippetSchema, ["channelId"]);

export const updateSnippet = async (
  id: string,
  data: typeof UpdateSnippetRequestBodySchema.static,
): Promise<typeof UpdateSnippetResponseSchema.static | null> => {
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

