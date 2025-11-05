import type { ShootSummary } from "@fanslib/types";
import { Trash2Icon } from "lucide-react";
import { type FC, useState } from "react";
import { Button } from "~/components/ui/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/Tooltip";
import { MediaTile } from "~/features/library/components/MediaTile";
import { cn } from "~/lib/cn";
import { useUpdateShootMutation } from "~/lib/queries/shoots";

type ShootDetailMediaProps = {
  shootId: string;
  media: ShootSummary["media"][number];
  index: number;
  allMedias: ShootSummary["media"];
  onUpdate: () => void;
};

export const ShootDetailMedia: FC<ShootDetailMediaProps> = ({
  shootId,
  media,
  index,
  allMedias,
  onUpdate,
}) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const updateMutation = useUpdateShootMutation();

  const removeMediaFromShoot = async () => {
    try {
      const updatedMediaIds = allMedias?.filter((m) => m.id !== media.id).map((m) => m.id) || [];

      await updateMutation.mutateAsync({
        id: shootId,
        updates: {
          mediaIds: updatedMediaIds,
        },
      });

      onUpdate();
    } catch (error) {
      console.error("Failed to remove media from shoot:", error);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group relative aspect-square cursor-pointer rounded-lg overflow-hidden">
            {/* <Link
              to="/content/$mediaId"
              params={{ mediaId: media.id as string }}
              className="block w-full h-full hover:opacity-90 transition-opacity"
            > */}
              <div className={cn("absolute inset-0 z-10 border-2 border-transparent rounded-lg")}>
                <MediaTile
                  media={media}
                  index={index}
                  allMedias={allMedias}
                  className="w-full h-full"
                  withPreview
                  withDragAndDrop
                  withSelection
                />
              </div>
            {/* </Link> */}
          </div>
        </TooltipTrigger>
        <TooltipContent className="flex gap-1 p-0.5 bg-background border border-border">
          <Button
            variant="ghost"
            size={confirmingDelete ? "sm" : "icon"}
            className={cn(
              "h-7 text-muted-foreground hover:text-destructive transition-all duration-100",
              confirmingDelete ? "w-[72px] px-2" : "w-7"
            )}
            onPress={() => {
              if (confirmingDelete) {
                removeMediaFromShoot();
                setConfirmingDelete(false);
              } else {
                setConfirmingDelete(true);
              }
            }}
          >
            <div className="flex items-center gap-1.5">
              <Trash2Icon size={14} />
              {confirmingDelete && <span className="text-xs">Sure?</span>}
            </div>
          </Button>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
