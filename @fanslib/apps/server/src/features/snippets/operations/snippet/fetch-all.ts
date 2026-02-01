import { z } from "zod";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { CaptionSnippet, CaptionSnippetSchema } from "../../entity";

export const FetchAllSnippetsResponseSchema = z.array(
  CaptionSnippetSchema.omit({ channelId: true }).extend({
    channel: ChannelSchema.nullable(),
  })
);

export const fetchAllSnippets = async (): Promise<z.infer<typeof FetchAllSnippetsResponseSchema>> => {
  const database = await db();
  const snippetRepository = database.getRepository(CaptionSnippet);
  const snippets = await snippetRepository.find({
    relations: ["channel", "channel.type", "channel.defaultHashtags"],
    order: { updatedAt: "DESC" },
  });
  
  return snippets.map(({ channelId: _, ...snippet }) => snippet);
};
