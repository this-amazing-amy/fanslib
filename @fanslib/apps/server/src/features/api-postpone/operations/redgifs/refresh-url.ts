import type { RefreshRedgifsURLRequest } from "@fanslib/types";
import { db } from "../../../../lib/db";
import { Media } from "../../../library/entity";
import { FIND_REDGIFS_URL } from "../../queries";
import { fetchPostpone } from "../helpers";

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

export const refreshRedgifsURL = async (data: RefreshRedgifsURLRequest) => {
  const dataSource = await db();
  const mediaRepository = dataSource.getRepository(Media);
  const media = await mediaRepository.findOne({ where: { id: data.mediaId } });

  if (!media) {
    throw new Error(`Media with id ${data.mediaId} not found`);
  }

  await mediaRepository.update(media.id, { redgifsUrl: undefined });

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

