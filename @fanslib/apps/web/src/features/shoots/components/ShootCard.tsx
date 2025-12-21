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
  const firstMedia = shoot.media?.[0];
  const totalMediaCount = shoot.media?.length ?? 0;

  return (
    <Link to="/shoots/$shootId" params={{ shootId: shoot.id }}>
      <Card className="overflow-hidden border-base-content cursor-pointer">
        <CardBody className="p-0">
          <div className="p-4">
            {firstMedia && (
              <div className="mb-3 aspect-square rounded-lg overflow-hidden bg-base-300">
                <MediaPreview media={firstMedia} className="w-full h-full" />
              </div>
            )}
            <div className="space-y-2">
              <div className="text-base font-semibold">{shoot.name}</div>
              <div className="flex items-center gap-3 text-sm text-base-content/70">
                <span>{format(new Date(shoot.shootDate), "PPP")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-base-content/60">
                {totalMediaCount > 0 && (
                  <span className="font-medium">{totalMediaCount} items</span>
                )}
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
          </div>
        </CardBody>
      </Card>
    </Link>
  );
};

