import { t } from "elysia";
import { db } from "../../../../lib/db";
import { CaptionSnippet, CaptionSnippetSchema } from "../../entity";

export const CreateSnippetRequestBodySchema = t.Object({
  name: t.String(),
  content: t.String(),
  channelId: t.Optional(t.String()),
});

export const CreateSnippetResponseSchema = CaptionSnippetSchema;

export const createSnippet = async (data: typeof CreateSnippetRequestBodySchema.static): Promise<typeof CreateSnippetResponseSchema.static> => {
  const database = await db();
  const repo = database.getRepository(CaptionSnippet);

  const existing = await repo.findOne({
    where: {
      name: data.name,
      channelId: data.channelId ?? undefined,
    },
  });

  if (existing) {
    throw new Error(
      data.channelId
        ? "A snippet with this name already exists for this channel"
        : "A global snippet with this name already exists"
    );
  }

  const snippet = repo.create(data);
  return repo.save(snippet);
};

