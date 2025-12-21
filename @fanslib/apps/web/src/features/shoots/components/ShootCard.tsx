import type { ShootSummarySchema } from "@fanslib/server/schemas";
import { ImageIcon, VideoIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { type FC } from "react";
import { Card, CardBody } from "~/components/ui/Card";
import { MediaPreview } from "~/components/MediaPreview";

type ShootSummary = typeof ShootSummarySchema.static;

type ShootCardProps = {
  shoot: ShootSummary;
  groupedMedia: Map<string, unknown[]>;
  onUpdate: () => void;
};

export const ShootCard: FC<ShootCardProps> = ({ shoot }) => {
  const imageCount = shoot.media?.filter((m) => m.type === "image").length ?? 0;
  const videoCount = shoot.media?.filter((m) => m.type === "video").length ?? 0;
  const mediaItems = shoot.media?.slice(0, 4) ?? [];
  
  const shootDate = new Date(shoot.shootDate);
  const currentYear = new Date().getFullYear();
  const isCurrentYear = shootDate.getFullYear() === currentYear;
  const dateFormat = isCurrentYear ? "MMMM d" : "MMMM d, yyyy";

  return (
    <Link to="/shoots/$shootId" params={{ shootId: shoot.id }}>
      <Card className="overflow-hidden border-base-content cursor-pointer">
        <CardBody className="p-0">
          <div className="p-4">
            {mediaItems.length > 0 && (
              mediaItems.length === 1 ? (
                <div className="mb-3 aspect-square rounded-lg overflow-hidden bg-base-200">
                  <MediaPreview media={mediaItems[0]} className="w-full h-full" />
                </div>
              ) : (
                <div className="mb-3 aspect-square rounded-lg overflow-hidden grid grid-cols-2 gap-1">
                  {mediaItems.map((media) => (
                    <div key={media.id} className="bg-base-200 rounded-md overflow-hidden">
                      <MediaPreview media={media} className="w-full h-full" />
                    </div>
                  ))}
                </div>
              )
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold">{shoot.name}</div>
                <div className="flex items-center gap-3 text-sm text-base-content/60">
                  {imageCount > 0 && (
                    <div className="flex items-center gap-1">
                      <span>{imageCount}</span>
                      <ImageIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {videoCount > 0 && (
                    <div className="flex items-center gap-1">
                      <span>{videoCount}</span>
                      <VideoIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-base-content/70">
                <span>{format(shootDate, dateFormat)}</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
};

