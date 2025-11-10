import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { CaptionSnippet, CaptionSnippetSchema } from "../../entity";

export const FetchSnippetByIdRequestParamsSchema = t.Object({
  id: t.String(),
});

export const FetchSnippetByIdResponseSchema = t.Union([
  t.Intersect([
    CaptionSnippetSchema,
    t.Object({
      channel: t.Union([ChannelSchema, t.Null()]),
    }),
  ]),
  t.Object({ error: t.String() }),
]);

export const fetchSnippetById = async (payload: typeof FetchSnippetByIdRequestParamsSchema.static): Promise<typeof FetchSnippetByIdResponseSchema.static> => {
  const database = await db();
  const snippetRepository = database.getRepository(CaptionSnippet);
  const snippet = await snippetRepository.findOne({
    where: { id: payload.id },
    relations: ["channel"],
  });
  if (!snippet) {
    return { error: "Snippet not found" } as const;
  }
  return snippet;
};

