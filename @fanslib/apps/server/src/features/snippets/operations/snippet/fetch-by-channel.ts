import { t } from "elysia";
import { IsNull } from "typeorm";
import { db } from "../../../../lib/db";
import { CaptionSnippet, CaptionSnippetSchema } from "../../entity";

export const FetchSnippetsByChannelRequestParamsSchema = t.Object({
  channelId: t.String(),
});

export const FetchSnippetsByChannelResponseSchema = t.Array(
  t.Composite([
    t.Omit(CaptionSnippetSchema, ["channelId"]),
    t.Object({
      channel: t.Union([t.Any(), t.Null()]), // Channel is now Zod
    }),
  ])
);

export const fetchSnippetsByChannel = async (channelId: string): Promise<typeof FetchSnippetsByChannelResponseSchema.static> => {
  const dataSource = await db();
  const repo = dataSource.getRepository(CaptionSnippet);
  const snippets = await repo.find({
    where: [
      { channelId },
      { channelId: IsNull() },
    ],
    relations: ["channel", "channel.type", "channel.defaultHashtags"],
    order: { updatedAt: "DESC" },
  });
  
  return snippets.map(({ channelId: _, ...snippet }) => snippet);
};

