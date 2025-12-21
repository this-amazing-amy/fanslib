import type { MediaSchema } from "@fanslib/server/schemas";
import { MediaTile } from "~/features/library/components/MediaTile";

type Media = typeof MediaSchema.static;

type ShootDetailMediaGridProps = {
  medias: Media[];
};

export const ShootDetailMediaGrid = ({ medias }: ShootDetailMediaGridProps) => {
  return (
    <div className="grid grid-cols-5 gap-4">
      {medias.map((media, index) => (
        <MediaTile
          key={media.id}
          media={media}
          allMedias={medias}
          withPreview
          withDragAndDrop
          withDuration
          withPostsPopover
          withNavigation
          withFileName
          withTags
          index={index}
        />
      ))}
    </div>
  );
};

