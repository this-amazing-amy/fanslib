import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { MediaSchema } from "../../../library/entity";
import { Post, PostMediaSchema, PostSchema } from "../../entity";

export const FetchPostsByChannelRequestParamsSchema = t.Object({
  channelId: t.String(),
});

export const FetchPostsByChannelResponseSchema = t.Array(t.Composite([
  PostSchema,
  t.Object({
    postMedia: t.Array(t.Composite([
      PostMediaSchema,
      t.Object({
        media: MediaSchema,
      }),
    ])),
    channel: ChannelSchema,
  }),
]));

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
        defaultHashtags: true,
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

