import { t } from "elysia";
import { IsNull } from "typeorm";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { CaptionSnippet, CaptionSnippetSchema } from "../../entity";

// Schemas
export const FetchGlobalSnippetsResponseSchema = t.Array(
  t.Intersect([
    CaptionSnippetSchema,
    t.Object({
      channel: t.Union([ChannelSchema, t.Null()]),
    }),
  ])
);

export const fetchGlobalSnippets = async (): Promise<typeof FetchGlobalSnippetsResponseSchema.static> => {
  const dataSource = await db();
  const repo = dataSource.getRepository(CaptionSnippet);
  return repo.find({
    where: { channelId: IsNull() },
    relations: ["channel"],
    order: { updatedAt: "DESC" },
  });
};

