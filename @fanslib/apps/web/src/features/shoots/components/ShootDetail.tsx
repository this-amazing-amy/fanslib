import { ShootSummarySchema, MediaSchema, UpdateShootRequestBodySchema } from "@fanslib/server/schemas";
import { useState, type FC } from "react";

type Media = typeof MediaSchema.static;
type ShootSummary = typeof ShootSummarySchema.static;
type UpdateShootRequest = typeof UpdateShootRequestBodySchema.static;
import { Button } from "~/components/ui/Button";
import { useLibraryPreferences } from "~/contexts/LibraryPreferencesContext";
import { useMediaDrag } from "~/contexts/MediaDragContext";
import { useShootAccordionState } from "~/hooks/useShootAccordionState";
import { cn } from "~/lib/cn";
import { useUpdateShootMutation } from "~/lib/queries/shoots";
import { ShootDetailDeleteButton } from "./ShootDetailDeleteButton";
import { ShootDetailDropZone } from "./ShootDetailDropZone";
import { ShootDetailEditButton } from "./ShootDetailEditButton";
import { ShootDetailMedia } from "./ShootDetailMedia";
import { ShootHeader } from "./ShootHeader";

type ShootDetailProps = {
  shoot: ShootSummary;
  groupedMedia: Map<string, Media[]>;
  onUpdate: () => void;
};

type ShootDetailContentProps = {
  shoot: ShootSummary;
  groupedMedia: Map<string, Media[]>;
  onUpdate: () => void;
};

const ShootDetailContent = ({ shoot, groupedMedia, onUpdate }: ShootDetailContentProps) => {
  const { preferences: libraryPreferences, updatePreferences } = useLibraryPreferences();
  const { isDragging } = useMediaDrag();
  const [isEditing, setIsEditing] = useState(false);
  const { isOpen, setIsOpen } = useShootAccordionState(shoot.id);
  const updateMutation = useUpdateShootMutation();

  const handleUpdate = async (payload: UpdateShootRequest) => {
    try {
      await updateMutation.mutateAsync({ id: shoot.id, updates: payload });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Failed to update shoot:", error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const renderMediaGrid = (mediaList: Media[], allMedias: Media[]) => {
    const mediaIndex = (media: Media) => allMedias.findIndex((m) => m.id === media.id);

    return (
      <div
        className={cn(
          "grid gap-2",
          libraryPreferences.view.gridSize === "large"
            ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            : "grid-cols-3 sm:grid-cols-4 md:grid-cols-6"
        )}
      >
        {mediaList.map((media) => (
          <ShootDetailMedia
            key={media.id}
            shootId={shoot.id}
            media={media}
            index={mediaIndex(media)}
            allMedias={shoot.media}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full border rounded-md">
      <div
        className={cn(
          "cursor-pointer hover:bg-muted/50 px-4 py-2",
          !isOpen && "hover:bg-muted/50"
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (isEditing) return;
          setIsOpen(!isOpen);
        }}
      >
        <ShootHeader
          shoot={shoot}
          isEditing={isEditing}
          onUpdate={handleUpdate}
          onCancel={handleCancel}
        />
      </div>
      {isOpen && (
        <div className="px-4 flex-col flex">
          <div className="flex flex-col gap-4 pb-4" onClick={(e) => e.stopPropagation()}>
            {shoot.media && (
              <div className="flex flex-col gap-6">
                {renderMediaGrid(Array.from(groupedMedia.values()).flat(), shoot.media)}
                {isDragging && <ShootDetailDropZone shoot={shoot} onUpdate={onUpdate} />}
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-between py-2">
            <Button
              variant="outline"
              onClick={() =>
                updatePreferences({
                  filter: [{ include: true, items: [{ type: "shoot", id: shoot.id }] }],
                })
              }
            >
              View in Library
            </Button>
            <div className="flex gap-2">
              <ShootDetailEditButton
                isEditing={isEditing}
                onEdit={() => setIsEditing(true)}
                onCancel={handleCancel}
              />
              <ShootDetailDeleteButton shoot={shoot} onUpdate={onUpdate} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ShootDetail: FC<ShootDetailProps> = ({ shoot, groupedMedia, onUpdate }) => <ShootDetailContent shoot={shoot} groupedMedia={groupedMedia} onUpdate={onUpdate} />;
