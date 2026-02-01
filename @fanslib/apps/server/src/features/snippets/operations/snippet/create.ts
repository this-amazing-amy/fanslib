import { z } from "zod";
import { IsNull } from "typeorm";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { Channel } from "../../../channels/entity";
import { CaptionSnippet, CaptionSnippetSchema } from "../../entity";

export const CreateSnippetRequestBodySchema = z.object({
  name: z.string(),
  content: z.string(),
  channelId: z.string().optional(),
});

export const CreateSnippetResponseSchema = CaptionSnippetSchema.omit({ channelId: true }).extend({
  channel: ChannelSchema.nullable(),
});

export const createSnippet = async (data: z.infer<typeof CreateSnippetRequestBodySchema>): Promise<z.infer<typeof CreateSnippetResponseSchema>> => {
  const database = await db();
  const repo = database.getRepository(CaptionSnippet);

  const existing = await repo.findOne({
    where: {
      name: data.name,
      channelId: data.channelId ?? IsNull()
    },
  });

  if (existing) {
    throw new Error(
      data.channelId
        ? "A snippet with this name already exists for this channel"
        : "A global snippet with this name already exists"
    );
  }

  const snippet = repo.create({
    ...data,
  });

  // eslint-disable-next-line functional/no-let
  let channel: Channel | null = null;
  if (data.channelId) {
    const foundChannel = await database.getRepository(Channel).findOne({ 
      where: { id: data.channelId },
      relations: ['type', 'defaultHashtags']
    });
    if (!foundChannel) {
      throw new Error(`Channel with id ${data.channelId} not found`);
    }
    snippet.channel = foundChannel;
    channel = foundChannel;
  } else {
    snippet.channel = null;
  }

  const savedSnippet = await repo.save(snippet);
  
  // Omit channelId as per the response schema and include the channel relation
  const { channelId: _, ...snippetWithoutChannelId } = savedSnippet;
  return {
    ...snippetWithoutChannelId,
    channel,
  };
};

