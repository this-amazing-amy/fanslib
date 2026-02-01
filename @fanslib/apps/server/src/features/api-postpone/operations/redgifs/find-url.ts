import { z } from "zod";
import { db } from "../../../../lib/db";
import { Media } from "../../../library/entity";
import { FIND_REDGIFS_URL } from "../../queries";
import { fetchPostpone } from "../helpers";

export const FindRedgifsURLRequestBodySchema = z.object({
  mediaId: z.string(),
});

export const FindRedgifsURLResponseSchema = z.object({
  url: z.string().nullable(),
});

type FindRedgifsUrlQueryResult = {
  media: {
    objects: Array<{
      name: string;
      hostedUrl: string;
    }>;
  };
};

type FindRedgifsUrlQueryVariables = {
  filename: string;
};

export const findRedgifsURL = async (data: z.infer<typeof FindRedgifsURLRequestBodySchema>): Promise<z.infer<typeof FindRedgifsURLResponseSchema>> => {
  const dataSource = await db();
  const mediaRepository = dataSource.getRepository(Media);
  const media = await mediaRepository.findOne({ where: { id: data.mediaId } });

  if (!media) {
    throw new Error(`Media with id ${data.mediaId} not found`);
  }

  if (media.redgifsUrl) {
    return { url: media.redgifsUrl };
  }

  const result = await fetchPostpone<FindRedgifsUrlQueryResult, FindRedgifsUrlQueryVariables>(
    FIND_REDGIFS_URL,
    {
      filename: media.name,
    }
  );

  const postponeMedia = result.media.objects[0];
  if (!postponeMedia) return { url: null };

  const isRedgifsUrl = postponeMedia.hostedUrl.includes("redgifs.com");
  if (!isRedgifsUrl) return { url: null };

  const url = postponeMedia.hostedUrl ?? null;

  if (url) {
    await mediaRepository.update(media.id, { redgifsUrl: url });
  }

  return { url };
};

