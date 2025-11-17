import { useState } from "react";
import { MediaSchema } from "@fanslib/server/schemas";

type Media = typeof MediaSchema.static;
import { useSfwMode } from "~/hooks/useSfwMode";
import { cn } from "~/lib/cn";
import { getMediaFileUrl, getMediaThumbnailUrl } from "~/lib/media-urls";

type MediaTileImageProps = {
  media: Media;
  cover?: boolean;
};

export const MediaTileImage = ({ media, cover }: MediaTileImageProps) => {
  const [imageError, setImageError] = useState(false);
  const { handleMouseEnter, handleMouseLeave, getBlurClassName } = useSfwMode();

  return (
    <img
      src={imageError ? getMediaFileUrl(media.id) : getMediaThumbnailUrl(media.id)}
      alt={media.name}
      className={getBlurClassName(
        cn("w-full h-full bg-base-300", cover ? "object-cover" : "object-contain")
      )}
      onError={() => setImageError(true)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      loading="lazy"
      draggable={false}
    />
  );
};
