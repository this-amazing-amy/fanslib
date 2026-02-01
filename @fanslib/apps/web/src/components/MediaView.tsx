import type { Media } from '@fanslib/server/schemas';
import { Link } from "@tanstack/react-router";
import { useSfwMode } from "~/hooks/useSfwMode";
import { cn } from "~/lib/cn";
import { getMediaFileUrl } from "~/lib/media-urls";


type MediaPreview = Pick<Media, "id" | "name" | "type">;

type MediaViewProps = {
  media: MediaPreview;
  className?: string;
  controls?: boolean;
  linkToMediaDetail?: boolean;
};

export const MediaView = ({
  media,
  className,
  controls = false,
  linkToMediaDetail = false,
}: MediaViewProps) => {
  const { handleMouseEnter, handleMouseLeave, getBlurClassName } = useSfwMode();

  const mediaContent =
    media.type === "image" ? (
      <img
        src={getMediaFileUrl(media.id)}
        alt={media.name}
        className={getBlurClassName("object-contain w-full h-full bg-base-300")}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    ) : (
      <video
        src={getMediaFileUrl(media.id)}
        controls={controls}
        className={getBlurClassName("object-contain bg-base-300 w-full h-full")}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    );

  return (
    <div className={cn("aspect-square overflow-hidden rounded-lg bg-base-300", className)}>
      {linkToMediaDetail ? (
        <Link
          to="/content/library/media/$mediaId"
          params={{ mediaId: media.id }}
          className="block w-full h-full hover:opacity-90 transition-opacity"
        >
          {mediaContent}
        </Link>
      ) : (
        mediaContent
      )}
    </div>
  );
};

