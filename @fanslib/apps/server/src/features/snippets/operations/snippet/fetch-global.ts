import { z } from "zod";
import { IsNull } from "typeorm";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { CaptionSnippet, CaptionSnippetSchema } from "../../entity";

export const FetchGlobalSnippetsResponseSchema = z.array(
  CaptionSnippetSchema.omit({ channelId: true }).extend({
    channel: ChannelSchema.nullable(),
  })
);

export const fetchGlobalSnippets = async (): Promise<z.infer<typeof FetchGlobalSnippetsResponseSchema>> => {
  const dataSource = await db();
  const repo = dataSource.getRepository(CaptionSnippet);
  const snippets = await repo.find({
    where: { channelId: IsNull() },
    relations: ["channel"],
    order: { updatedAt: "DESC" },
  });
  
  return snippets.map(({ channelId: _, ...snippet }) => snippet);
};
