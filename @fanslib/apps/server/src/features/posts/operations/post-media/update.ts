import { t } from "elysia";
import { db } from "../../../../lib/db";
import { PostMedia, PostMediaSchema } from "../../entity";

export const UpdatePostMediaRequestParamsSchema = t.Object({
  id: t.String(),
  postMediaId: t.String(),
});

export const UpdatePostMediaRequestBodySchema = t.Object({
  fanslyStatisticsId: t.Nullable(t.String()),
});

export const UpdatePostMediaResponseSchema = PostMediaSchema;

export const updatePostMedia = async (
  postId: string,
  postMediaId: string,
  updates: typeof UpdatePostMediaRequestBodySchema.static
): Promise<typeof UpdatePostMediaResponseSchema.static | null> => {
  const dataSource = await db();
  const postMediaRepository = dataSource.getRepository(PostMedia);

  const postMedia = await postMediaRepository.findOne({
    where: { id: postMediaId, post: { id: postId } },
  });

  if (!postMedia) {
    return null;
  }

  postMedia.fanslyStatisticsId = updates.fanslyStatisticsId;
  await postMediaRepository.save(postMedia);

  return postMedia;
};

