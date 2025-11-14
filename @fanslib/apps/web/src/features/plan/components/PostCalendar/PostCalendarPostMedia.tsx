import type { PostMediaWithMediaSelect } from "@fanslib/types";
import { cn } from "~/lib/cn";
import { MediaTile } from "~/features/library/components/MediaTile";

type PostCalendarPostMediaProps = {
  postMedia: PostMediaWithMediaSelect[];
  isVirtual: boolean;
};

export const PostCalendarPostMedia = ({ postMedia, isVirtual }: PostCalendarPostMediaProps) => {
  const allMedias = isVirtual ? [] : postMedia.map((pm) => pm.media);

  return (
    <div className={cn("grid gap-1 grid-rows-1 grid-cols-2")}>
      {Array.from({ length: 2 }).map((_, i) => {
        const media = !isVirtual ? postMedia[i]?.media : null;

        return (
          <div className="relative rounded-md" key={i}>
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
            {!media && <div className="w-full h-full"></div>}
            {i === 1 && postMedia.length > 2 && (
              <div className="absolute inset-0 bg-base-300/50 flex items-center justify-center rounded-md">
                + {postMedia.length - 2}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

