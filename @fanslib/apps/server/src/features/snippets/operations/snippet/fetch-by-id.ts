import { z } from "zod";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { CaptionSnippet, CaptionSnippetSchema } from "../../entity";

export const FetchSnippetByIdRequestParamsSchema = z.object({
  id: z.string(),
});

export const FetchSnippetByIdResponseSchema = CaptionSnippetSchema.omit({ channelId: true }).extend({
  channel: ChannelSchema.nullable(),
});

export const fetchSnippetById = async (id: string): Promise<z.infer<typeof FetchSnippetByIdResponseSchema> | null> => {
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

