import { t } from "elysia";
import { Channel, ChannelSchema } from "~/features/channels/entity";
import { db } from "../../../../lib/db";
import { CaptionSnippet, CaptionSnippetSchema } from "../../entity";

export const CreateSnippetRequestBodySchema = t.Object({
  name: t.String(),
  content: t.String(),
  channelId: t.Optional(t.String()),
});

export const CreateSnippetResponseSchema = t.Composite([
  t.Omit(CaptionSnippetSchema, ["channelId"]),
  t.Object({
    channel: t.Nullable(ChannelSchema)
  }),
]);

export const createSnippet = async (data: typeof CreateSnippetRequestBodySchema.static): Promise<typeof CreateSnippetResponseSchema.static> => {
  const database = await db();
  const repo = database.getRepository(CaptionSnippet);

  const existing = await repo.findOne({
    where: {
      name: data.name,
      channelId: data.channelId || null
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

  if (data.channelId) {
    const channel = await database.getRepository(Channel).findOne({ where: { id: data.channelId } });
    if (!channel) {
      throw new Error(`Channel with id ${data.channelId} not found`);
    }
    snippet.channel = channel;
  } else {
    snippet.channel = null;
  }

  const savedSnippet = await repo.save(snippet);
  return savedSnippet;
};

