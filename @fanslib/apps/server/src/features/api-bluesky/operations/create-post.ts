import { getBlueskyAgent } from "../client";
import { uploadBlob } from "./upload-blob";
import { uploadVideo } from "./upload-video";
import { resolveMediaPath } from "../../library/path-utils";
import { getVideoDimensions } from "../../../lib/video";
import type { Media } from "../../library/entity";

type CreatePostParams = {
  text: string;
  media: Media[];
  createdAt?: Date;
};

const createImageEmbed = async (media: Media[]) => {
  const uploadedBlobs = await Promise.all(
    media.slice(0, 4).map(async (m) => {
      const { blob } = await uploadBlob(m);
      return {
        image: blob,
        alt: m.name,
      };
    })
  );

  if (uploadedBlobs.length === 0) {
    return null;
  }

  return {
    $type: "app.bsky.embed.images",
    images: uploadedBlobs,
  };
};

const createVideoEmbed = async (media: Media) => {
  const videoBlob = await uploadVideo(media);
  const filePath = resolveMediaPath(media.relativePath);
  const dimensions = await getVideoDimensions(filePath);

  const embed: Record<string, unknown> = {
    $type: "app.bsky.embed.video",
    video: videoBlob,
    alt: media.name,
  };

  if (dimensions) {
    embed.aspectRatio = {
      $type: "app.bsky.embed.defs#aspectRatio",
      width: dimensions.width,
      height: dimensions.height,
    };
  }

  return embed;
};

export const createPost = async ({ text, media, createdAt }: CreatePostParams): Promise<string> => {
  const agent = await getBlueskyAgent();

  const record: Record<string, unknown> = {
    $type: "app.bsky.feed.post",
    text,
    labels: {
      $type: "com.atproto.label.defs#selfLabels",
      values: [{ val: "porn" }],
    },
    createdAt: (createdAt ?? new Date()).toISOString(),
  };

  if (media.length > 0) {
    const firstMedia = media[0];

    if (firstMedia?.type === "image") {
      const embed = await createImageEmbed(media);
      if (embed) {
        record.embed = embed;
      }
    } else if (firstMedia?.type === "video") {
      record.embed = await createVideoEmbed(firstMedia);
    }
  }

  const response = await agent.post(record);

  return response.uri;
};
