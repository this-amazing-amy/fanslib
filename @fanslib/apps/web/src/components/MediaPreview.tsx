import type { Media, MediaSchema } from '@fanslib/server/schemas';


import { memo, useCallback, useState } from "react";
import { cn } from "~/lib/cn";
import { useSfwMode } from "~/hooks/useSfwMode";
import { getMediaFileUrl, getMediaThumbnailUrl } from "~/lib/media-urls";

export type MediaPreviewProps = {
  media: Media;
  className?: string;
  onImageError?: (error: boolean) => void;
  imageError?: boolean;
};

export const MediaPreview = memo(
  ({ media, className, onImageError, imageError: controlledImageError }: MediaPreviewProps) => {
    const [localImageError, setLocalImageError] = useState(false);
    const imageError = controlledImageError ?? localImageError;
    const { handleMouseEnter, handleMouseLeave, getBlurClassName } = useSfwMode();

    const handleImageError = useCallback(() => {
      setLocalImageError(true);
      onImageError?.(true);
    }, [onImageError]);

    return (
      <div
        className={cn("relative aspect-square bg-muted rounded-md overflow-hidden", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={imageError ? getMediaFileUrl(media.id) : getMediaThumbnailUrl(media.id)}
          alt={media.name}
          className={getBlurClassName("w-full h-full object-contain")}
          onError={handleImageError}
          loading="lazy"
          draggable={false}
        />
      </div>
    );
  }
);

MediaPreview.displayName = "MediaPreview";
