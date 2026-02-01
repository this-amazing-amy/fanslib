import { t } from "elysia";
import { db } from "../../../../lib/db";
import { CaptionSnippet, CaptionSnippetSchema } from "../../entity";

export const FetchSnippetByIdRequestParamsSchema = t.Object({
  id: t.String(),
});

export const FetchSnippetByIdResponseSchema = t.Composite([
  t.Omit(CaptionSnippetSchema, ["channelId"]),
  t.Object({
    channel: t.Nullable(t.Any()), // Channel is now Zod
  }),
]);

export const fetchSnippetById = async (id: string): Promise<typeof FetchSnippetByIdResponseSchema.static | null> => {
  const database = await db();
  const snippetRepository = database.getRepository(CaptionSnippet);
  const snippet = await snippetRepository.findOne({
    where: { id },
    relations: ["channel", "channel.type", "channel.defaultHashtags"],
  });
  if (!snippet) {
    return null;
  }
  
  const { channelId: _, ...snippetWithoutChannelId } = snippet;
  return snippetWithoutChannelId;
};

