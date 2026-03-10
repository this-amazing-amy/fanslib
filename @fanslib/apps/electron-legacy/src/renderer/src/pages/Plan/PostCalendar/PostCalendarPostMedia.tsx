import { MediaTile } from "@renderer/components/MediaTile";
import { cn } from "@renderer/lib/utils";
import { PostMedia } from "../../../../../features/posts/entity";

type PostCalendarPostMediaProps = {
  postMedia: PostMedia[];
  isVirtual: boolean;
};

export const PostCalendarPostMedia = ({ postMedia, isVirtual }: PostCalendarPostMediaProps) => {
  const allMedias = isVirtual ? [] : postMedia.map((pm) => pm.media);

  return (
    <div className={cn("grid gap-1 grid-rows-1 grid-cols-2")}>
      {Array.from({ length: 2 }).map((_, i) => {
        const media = !isVirtual ? postMedia[i]?.media : null;

        return (
          <div className="relative rounded-md overflow-hidden" key={i}>
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
              <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                + {postMedia.length - 2}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
