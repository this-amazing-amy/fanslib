import { t } from "elysia";
import { IsNull } from "typeorm";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { CaptionSnippet, CaptionSnippetSchema } from "../../entity";

export const FetchSnippetsByChannelRequestParamsSchema = t.Object({
  channelId: t.String(),
});

export const FetchSnippetsByChannelResponseSchema = t.Array(
  t.Composite([
    t.Omit(CaptionSnippetSchema, ["channelId"]),
    t.Object({
      channel: t.Union([ChannelSchema, t.Null()]),
    }),
  ])
);

export const fetchSnippetsByChannel = async (channelId: string): Promise<typeof FetchSnippetsByChannelResponseSchema.static> => {
  const dataSource = await db();
  const repo = dataSource.getRepository(CaptionSnippet);
  return repo.find({
    where: [
      { channelId },
      { channelId: IsNull() },
    ],
    relations: ["channel"],
    order: { updatedAt: "DESC" },
  });
};

