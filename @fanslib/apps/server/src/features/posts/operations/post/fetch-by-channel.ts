import { t } from "elysia";
import { ChannelSchema, ChannelTypeSchema } from "~/features/channels/entity";
import { MediaSchema } from "~/features/library/entity";
import { db } from "../../../../lib/db";
import { Post, PostMediaSchema, PostSchema } from "../../entity";

export const FetchPostsByChannelRequestParamsSchema = t.Object({
  channelId: t.String(),
});

export const FetchPostsByChannelResponseSchema = t.Array(t.Intersect([PostSchema, t.Object({
  postMedia: t.Array(t.Intersect([PostMediaSchema, t.Object({
    media: MediaSchema,
  })])),
  channel: t.Intersect([ChannelSchema, t.Object({
    type: ChannelTypeSchema,
  })]),
})]));

export const fetchPostsByChannel = async (channelId: string): Promise<typeof FetchPostsByChannelResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Post);

  return repository.find({
    where: { channelId },
    relations: {
      postMedia: {
        media: true,
      },
      channel: {
        type: true,
      },
    },
    order: {
      date: "DESC",
      postMedia: {
        order: "ASC",
      },
    },
  });
};

