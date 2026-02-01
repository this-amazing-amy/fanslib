import { t } from "elysia";
import { db } from "../../../../lib/db";
import { CaptionSnippet, CaptionSnippetSchema } from "../../entity";

export const FetchAllSnippetsResponseSchema = t.Array(
  t.Composite([
    t.Omit(CaptionSnippetSchema, ["channelId"]),
    t.Object({
      channel: t.Union([t.Any(), t.Null()]), // Channel is now Zod
    }),
  ])
);

export const fetchAllSnippets = async (): Promise<typeof FetchAllSnippetsResponseSchema.static> => {
  const database = await db();
  const snippetRepository = database.getRepository(CaptionSnippet);
  const snippets = await snippetRepository.find({
    relations: ["channel", "channel.type", "channel.defaultHashtags"],
    order: { updatedAt: "DESC" },
  });
  
  return snippets.map(({ channelId: _, ...snippet }) => snippet);
};
