import { useState } from "react";
import type { Media } from "@fanslib/types";
import { useSfwMode } from "~/hooks/useSfwMode";
import { cn } from "~/lib/cn";
import { mediaApi } from "~/lib/api/media";

type MediaTileImageProps = {
  media: Media;
  cover?: boolean;
};

export const MediaTileImage = ({ media, cover }: MediaTileImageProps) => {
  const [imageError, setImageError] = useState(false);
  const { handleMouseEnter, handleMouseLeave, getBlurClassName } = useSfwMode();

  return (
    <img
      src={imageError ? mediaApi.getFileUrl(media.id) : mediaApi.getThumbnailUrl(media.id)}
      alt={media.name}
      className={getBlurClassName(cn("w-full h-full", cover ? "object-cover" : "object-contain"))}
      onError={() => setImageError(true)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      loading="lazy"
      draggable={false}
    />
  );
};
