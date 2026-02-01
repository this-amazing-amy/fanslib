import { z } from "zod";
import { IsNull } from "typeorm";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { CaptionSnippet, CaptionSnippetSchema } from "../../entity";

export const FetchSnippetsByChannelRequestParamsSchema = z.object({
  channelId: z.string(),
});

export const FetchSnippetsByChannelResponseSchema = z.array(
  CaptionSnippetSchema.omit({ channelId: true }).extend({
    channel: ChannelSchema.nullable(),
  })
);

export const fetchSnippetsByChannel = async (channelId: string): Promise<z.infer<typeof FetchSnippetsByChannelResponseSchema>> => {
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

