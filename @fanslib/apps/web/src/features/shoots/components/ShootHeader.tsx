import type { ShootSummarySchema, UpdateShootRequestBodySchema } from "@fanslib/server/schemas";
import { ImageIcon, VideoIcon } from "lucide-react";
import { MediaPreview } from "~/components/MediaPreview";
import { ShootDetailDate } from "./ShootDetailDate";
import { ShootDetailTitle } from "./ShootDetailTitle";

type ShootSummary = typeof ShootSummarySchema.static;
type UpdateShootRequest = typeof UpdateShootRequestBodySchema.static;

type ShootHeaderProps = {
  shoot: ShootSummary;
  isEditing: boolean;
  onUpdate: (payload: UpdateShootRequest) => Promise<void>;
  onCancel: () => void;
};

export const ShootHeader = ({ shoot, isEditing, onUpdate, onCancel }: ShootHeaderProps) => {
  const imageCount = shoot.media?.filter((m) => m.type === "image").length ?? 0;
  const videoCount = shoot.media?.filter((m) => m.type === "video").length ?? 0;
  const firstMedia = shoot.media?.[0];

  return (
    <div className="flex flex-row justify-between w-full py-4">
      <div className="flex flex-row gap-4">
        {firstMedia && (
          <div className="w-16 h-16">
            <MediaPreview media={firstMedia} />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <div className="text-left">
            <ShootDetailTitle
              shoot={shoot}
              isEditing={isEditing}
              onUpdate={onUpdate}
              onCancel={onCancel}
            />
          </div>
          <div>
            <div className="flex items-center group gap-4 text-sm text-muted-foreground">
              <ShootDetailDate shoot={shoot} isEditing={isEditing} onUpdate={onUpdate} />
              <div className="flex gap-1 text-sm text-muted-foreground items-center">
                {imageCount > 0 && (
                  <div className="flex items-center gap-1">
                    <span>{imageCount}</span>
                    <ImageIcon className="w-4 h-4" />
                  </div>
                )}
                {videoCount > 0 && (
                  <div className="flex items-center gap-1">
                    <span>{videoCount}</span>
                    <VideoIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
