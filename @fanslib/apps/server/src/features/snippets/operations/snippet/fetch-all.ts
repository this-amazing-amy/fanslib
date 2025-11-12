import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { CaptionSnippet, CaptionSnippetSchema } from "../../entity";

export const FetchAllSnippetsResponseSchema = t.Array(
  t.Composite([
    t.Omit(CaptionSnippetSchema, ["channelId"]),
    t.Object({
      channel: t.Union([ChannelSchema, t.Null()]),
    }),
  ])
);

export const fetchAllSnippets = async (): Promise<typeof FetchAllSnippetsResponseSchema.static> => {
  const database = await db();
  const snippetRepository = database.getRepository(CaptionSnippet);
  return snippetRepository.find({
    relations: ["channel"],
    order: { updatedAt: "DESC" },
  });
};

