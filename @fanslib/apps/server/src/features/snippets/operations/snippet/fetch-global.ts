import { t } from "elysia";
import { IsNull } from "typeorm";
import { db } from "../../../../lib/db";
import { CaptionSnippet, CaptionSnippetSchema } from "../../entity";

// Schemas
export const FetchGlobalSnippetsResponseSchema = t.Array(
  t.Composite([
    t.Omit(CaptionSnippetSchema, ["channelId"]),
    t.Object({
      channel: t.Union([t.Any(), t.Null()]), // Channel is now Zod
    }),
  ])
);

export const fetchGlobalSnippets = async (): Promise<typeof FetchGlobalSnippetsResponseSchema.static> => {
  const dataSource = await db();
  const repo = dataSource.getRepository(CaptionSnippet);
  const snippets = await repo.find({
    where: { channelId: IsNull() },
    relations: ["channel"],
    order: { updatedAt: "DESC" },
  });
  
  return snippets.map(({ channelId: _, ...snippet }) => snippet);
};
