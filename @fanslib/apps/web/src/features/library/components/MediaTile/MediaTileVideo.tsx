import type { Media } from '@fanslib/server/schemas';

import { useMediaHoverStore } from "~/stores/mediaHoverStore";
import { useSfwMode } from "~/hooks/useSfwMode";
import { cn } from "~/lib/cn";
import { useVideoPreview } from "~/hooks/useVideoPreview";
import { getMediaFileUrl, getMediaThumbnailUrl } from "~/lib/media-urls";
import { MediaTileDuration } from "./MediaTileDuration";

type MediaTileVideoProps = {
  media: Media;
  withPreview: boolean;
  withDuration: boolean;
  cover?: boolean;
};

export const MediaTileVideo = ({
  media,
  withPreview,
  withDuration,
  cover,
}: MediaTileVideoProps) => {
  const isPreviewActive = useMediaHoverStore((s) => withPreview && s.hoveredMediaId === media.id);
  const { videoRef, isVideoReady } = useVideoPreview({
    isActive: isPreviewActive,
    mediaType: "video",
  });
  const { handleMouseEnter, handleMouseLeave, getBlurClassName } = useSfwMode();

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <img
        src={getMediaThumbnailUrl(media.id)}
        alt={media.name}
        className={getBlurClassName(
          cn(
            "absolute inset-0 w-full h-full bg-base-300",
            cover ? "object-cover" : "object-contain",
            isPreviewActive && isVideoReady && "invisible"
          )
        )}
        loading="lazy"
        draggable={false}
      />
      <video
        ref={videoRef}
        src={getMediaFileUrl(media.id)}
        className={getBlurClassName(
          cn(
            "absolute inset-0 w-full h-full bg-base-300",
            cover ? "object-cover" : "object-contain",
            !isPreviewActive && "hidden"
          )
        )}
        preload="none"
        draggable={false}
      />
      {withDuration && media.duration && <MediaTileDuration duration={media.duration} />}
    </div>
  );
};
