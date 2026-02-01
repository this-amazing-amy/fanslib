import type { Media } from '@fanslib/server/schemas';
import { Plus } from "lucide-react";
import { MediaTile } from "~/features/library/components/MediaTile";
import { cn } from "~/lib/cn";


type ShootDetailMediaGridProps = {
  medias: Media[];
  onAddMedia?: () => void;
};

export const ShootDetailMediaGrid = ({ medias, onAddMedia }: ShootDetailMediaGridProps) => <div className="grid grid-cols-5 gap-4">
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
      {onAddMedia && (
        <button
          onClick={onAddMedia}
          className={cn(
            "aspect-square rounded-2xl border-2 border-dashed border-base-300",
            "flex items-center justify-center",
            "hover:border-primary hover:bg-primary/10 transition-colors",
            "cursor-pointer"
          )}
        >
          <div className="flex flex-col items-center gap-2 text-base-content/60">
            <Plus className="h-8 w-8" />
            <span className="text-sm">Add Media</span>
          </div>
        </button>
      )}
    </div>;

