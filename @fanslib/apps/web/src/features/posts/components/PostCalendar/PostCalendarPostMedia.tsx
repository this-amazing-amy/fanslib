import type { PostMediaWithMediaSchema } from "@fanslib/server/schemas";
import { Camera } from "lucide-react";
import { MediaSelectionProvider } from "~/contexts/MediaSelectionContext";
import { cn } from "~/lib/cn";
import { MediaTile } from "~/features/library/components/MediaTile";

type PostMediaWithMedia = typeof PostMediaWithMediaSchema.static;

type PostCalendarPostMediaProps = {
  postMedia: PostMediaWithMedia[];
  isVirtual: boolean;
};

export const PostCalendarPostMedia = ({ postMedia, isVirtual }: PostCalendarPostMediaProps) => {
  const allMedias = isVirtual ? [] : postMedia.map((pm) => pm.media);

  // Show placeholder for virtual posts
  if (isVirtual) {
    return (
      <div className="w-full aspect-square rounded-md border-2 border-dashed border-base-300 bg-base-200/30 flex flex-col items-center justify-center gap-2">
        <Camera className="w-8 h-8 text-base-content/20" />
        <span className="text-[10px] text-base-content/30 font-medium">No media</span>
      </div>
    );
  }

  const mediaCount = postMedia.length;

  // Single media - show full width
  if (mediaCount === 1) {
    return (
      <MediaSelectionProvider media={allMedias}>
        <div
          className="w-full aspect-square rounded-md overflow-hidden"
          style={{ viewTransitionName: `media-${postMedia[0].media.id}` }}
        >
          <MediaTile
            media={postMedia[0].media}
            allMedias={allMedias}
            index={0}
            className="rounded-md"
            withPreview
            cover
          />
        </div>
      </MediaSelectionProvider>
    );
  }

  // Multiple media - show 2x2 grid
  return (
    <MediaSelectionProvider media={allMedias}>
      <div className="grid gap-1 grid-cols-2">
        {Array.from({ length: Math.min(4, mediaCount) }).map((_, i) => {
          const media = postMedia[i]?.media;

          return (
            <div
              className="relative aspect-square rounded-md overflow-hidden"
              key={`media-slot-${i}`}
              style={media ? { viewTransitionName: `media-${media.id}` } : undefined}
            >
              {media && (
                <MediaTile
                  media={media}
                  allMedias={allMedias}
                  index={i}
                  className="rounded-md"
                  withPreview
                  cover
                />
              )}
              {i === 3 && mediaCount > 4 && (
                <div className="absolute inset-0 bg-base-300/80 backdrop-blur-sm flex items-center justify-center rounded-md">
                  <span className="text-sm font-semibold text-base-content">
                    +{mediaCount - 4}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </MediaSelectionProvider>
  );
};
