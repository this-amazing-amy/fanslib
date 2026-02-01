import { z } from "zod";
import { db } from "../../../../lib/db";
import { PostMedia } from "../../entity";
import type { PostMediaSchema } from "../../schema";

export const UpdatePostMediaRequestBodySchema = z.object({
  fanslyStatisticsId: z.string().nullable(),
});

export const updatePostMedia = async (
  postId: string,
  postMediaId: string,
  updates: z.infer<typeof UpdatePostMediaRequestBodySchema>
): Promise<z.infer<typeof PostMediaSchema> | null> => {
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

