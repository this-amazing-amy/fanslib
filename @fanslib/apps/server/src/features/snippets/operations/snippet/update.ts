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

export const UpdateSnippetResponseSchema = CaptionSnippetSchema;

export const updateSnippet = async (
  params: typeof UpdateSnippetRequestParamsSchema.static,
  data: typeof UpdateSnippetRequestBodySchema.static,
): Promise<typeof UpdateSnippetResponseSchema.static> => {
  const dataSource = await db();
  const repo = dataSource.getRepository(CaptionSnippet);

  const snippet = await repo.findOneOrFail({ where: { id: params.id } });

  if (data.name && data.name !== snippet.name) {
    const existing = await repo.findOne({
      where: {
        name: data.name,
        channelId: data.channelId ?? snippet.channelId,
      },
    });

    if (existing && existing.id !== params.id) {
      throw new Error(
        data.channelId !== undefined
          ? "A snippet with this name already exists for this channel"
          : "A global snippet with this name already exists"
      );
    }
  }

  Object.assign(snippet, data);
  return repo.save(snippet);
};

