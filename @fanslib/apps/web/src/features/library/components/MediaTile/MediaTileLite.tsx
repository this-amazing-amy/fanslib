import type { Media, MediaSchema } from '@fanslib/server/schemas';
import { Image as ImageIcon, Video } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "~/lib/cn";
import { getMediaFileUrl, getMediaThumbnailUrl } from "~/lib/media-urls";
import { useMediaTagsQuery } from "~/lib/queries/tags";
import { formatDuration } from "~/lib/video";


type MediaPreview = Pick<Media, "id" | "name" | "type" | "duration">;

export type MediaTileLiteProps = {
  media: MediaPreview;
  className?: string;
  onImageError?: (error: boolean) => void;
  imageError?: boolean;
  isActivePreview?: boolean;
  hideTagStickers?: boolean;
};

export const MediaTileLite = memo(
  ({
    media,
    className,
    onImageError,
    imageError: controlledImageError,
    isActivePreview = false,
    hideTagStickers = false,
  }: MediaTileLiteProps) => {
    const [localImageError, setLocalImageError] = useState(false);
    const imageError = controlledImageError ?? localImageError;
    const videoRef = useRef<HTMLVideoElement>(null);
    const previewIntervalRef = useRef<number | null>(null);

    const { data: mediaTags = [] } = useMediaTagsQuery({ mediaId: media.id });
    const stickerTags = (mediaTags ?? []).filter((mt) => mt.stickerDisplay === "color");

    const handleImageError = useCallback(() => {
      setLocalImageError(true);
      onImageError?.(true);
    }, [onImageError]);

    useEffect(() => {
      if (!videoRef.current || media.type !== "video" || !isActivePreview) return () => {};

      const video = videoRef.current;
      video.muted = true;
      video.currentTime = 0;

      const playVideo = async () => {
        try {
          video.play();
        } catch (error) {
          console.error("Failed to play video:", error);
        }
      };

      playVideo();

      // Skip forward every second
      previewIntervalRef.current = window.setInterval(() => {
        if (video.currentTime < video.duration - 2) {
          video.currentTime += 2;
        } else {
          video.currentTime = 0;
        }
      }, 1000);

      return () => {
        video.pause();
        video.currentTime = 0;
        if (previewIntervalRef.current) {
          clearInterval(previewIntervalRef.current);
        }
      };
    }, [isActivePreview, media.type]);

    return (
      <div className={cn("relative aspect-square bg-base-300 rounded-lg overflow-hidden", className)}>
        {media.type === "video" ? (
          <>
            {!isActivePreview && (
              <img
                src={getMediaThumbnailUrl(media.id)}
                alt={media.name}
                className="absolute inset-0 w-full h-full object-contain"
                onError={handleImageError}
                loading="lazy"
                draggable={false}
              />
            )}
            <video
              ref={videoRef}
              src={getMediaFileUrl(media.id)}
              className={cn(
                "absolute inset-0 w-full h-full object-contain",
                !isActivePreview && "hidden"
              )}
              preload="none"
              draggable={false}
            />
            {media.duration && (
              <div className="absolute bottom-1 right-1 bg-black/50 px-0.5 py-0.5 rounded text-[7px] text-white font-medium leading-tight">
                {formatDuration(media.duration)}
              </div>
            )}
          </>
        ) : (
          <img
            src={imageError ? getMediaFileUrl(media.id) : getMediaThumbnailUrl(media.id)}
            alt={media.name}
            className="w-full h-full object-contain"
            onError={handleImageError}
            loading="lazy"
            draggable={false}
          />
        )}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            {media.type === "video" ? (
              <Video className="w-8 h-8 text-muted-foreground" />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
        )}
        {!hideTagStickers && (
          <div className="absolute bottom-1 left-1 flex gap-1 z-10">
            {stickerTags.length > 0 && (
              <div className="size-5 p-1 rounded bg-black/50 flex items-center justify-center">
                {stickerTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color ?? "#666" }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

MediaTileLite.displayName = "MediaTileLite";
