import type { MediaSchema, ShootSchema } from "@fanslib/server/schemas";
import { format } from "date-fns";
import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/Button";
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogModal,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/Dialog";
import { ScrollArea } from "~/components/ui/ScrollArea";
import { MediaTileLite } from "~/features/library/components/MediaTile/MediaTileLite";
import { cn } from "~/lib/cn";
import { useMediaListQuery } from "~/lib/queries/library";
import { useShootsQuery, useUpdateShootMutation } from "~/lib/queries/shoots";

type Media = typeof MediaSchema.static;
type Shoot = typeof ShootSchema.static;

type AddToShootDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMedia: Media[];
  onSuccess?: () => void;
};

export const AddToShootDialog = ({
  open,
  onOpenChange,
  selectedMedia,
  onSuccess,
}: AddToShootDialogProps) => {
  const [selectedShootId, setSelectedShootId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { data: shootsData, isLoading } = useShootsQuery();
  const { refetch: refetchLibrary } = useMediaListQuery();
  const updateMutation = useUpdateShootMutation();

  const shoots = (shootsData?.items as Shoot[] | undefined) ?? [];

  const filteredShoots = useMemo(() => {
    if (!search) return shoots;
    const searchLower = search.toLowerCase();
    return shoots.filter((shoot) => shoot.name.toLowerCase().includes(searchLower));
  }, [shoots, search]);

  const selectedShoot = useMemo(
    () => shoots.find((shoot) => shoot.id === selectedShootId),
    [shoots, selectedShootId]
  );

  const handleAddToShoot = async () => {
    if (!selectedShootId || !selectedShoot) return;

    const existingMediaIds = selectedShoot.media?.map((m) => m.id) ?? [];
    const newMediaIds = selectedMedia
      .filter((media) => !existingMediaIds.includes(media.id))
      .map((media) => media.id);

    if (newMediaIds.length === 0) {
      onOpenChange(false);
      onSuccess?.();
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: selectedShootId,
        updates: {
          mediaIds: [...existingMediaIds, ...newMediaIds],
        },
      });
      await refetchLibrary();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to add media to shoot:", error);
    }
  };

  const handleShootSelect = (shootId: string) => {
    setSelectedShootId(shootId);
  };

  const mediaCountToAdd = selectedShoot
    ? selectedMedia.filter((media) => !selectedShoot.media?.some((m) => m.id === media.id)).length
    : selectedMedia.length;

  return (
    <DialogTrigger isOpen={open} onOpenChange={onOpenChange}>
      <DialogModal>
        <Dialog>
          {({ close }) => (
            <>
              <DialogHeader>
                <DialogTitle>Add Media to Shoot</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Shoot</label>
                  <div className="border rounded-md overflow-hidden">
                    <div className="flex items-center border-b px-3 py-2 gap-2">
                      <Search className="h-4 w-4 text-base-content/60" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-base-content/50"
                        placeholder="Search shoots..."
                      />
                    </div>
                    <ScrollArea className="h-[200px]">
                      {!isLoading && filteredShoots.length === 0 ? (
                        <div className="py-6 text-center text-sm text-base-content/60">
                          No shoots found.
                        </div>
                      ) : (
                        <div className="p-1">
                          {filteredShoots.map((shoot) => (
                            <button
                              key={shoot.id}
                              type="button"
                              onClick={() => handleShootSelect(shoot.id)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                                "hover:bg-base-200",
                                selectedShootId === shoot.id && "bg-base-200"
                              )}
                            >
                              <Check
                                className={cn(
                                  "h-4 w-4 shrink-0",
                                  selectedShootId === shoot.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{shoot.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Media to Add ({mediaCountToAdd} {mediaCountToAdd === 1 ? "item" : "items"})
                  </label>
                  <ScrollArea className="h-[200px] border rounded-md p-2">
                    <div className="space-y-2">
                      {selectedMedia
                        .filter((media) => !selectedShoot?.media?.some((m) => m.id === media.id))
                        .map((media) => (
                          <div
                            key={media.id}
                            className="grid grid-cols-[60px_1fr_auto] gap-3 items-center"
                          >
                            <div className="aspect-square">
                              <MediaTileLite media={media} />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">{media.name}</div>
                            </div>
                            <div className="text-xs text-base-content/60 whitespace-nowrap">
                              {format(media.fileCreationDate, "PP")}
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onPress={close}>
                  Cancel
                </Button>
                <Button
                  onPress={handleAddToShoot}
                  isDisabled={!selectedShootId || updateMutation.isPending || mediaCountToAdd === 0}
                >
                  {updateMutation.isPending
                    ? "Adding..."
                    : `Add ${mediaCountToAdd} ${mediaCountToAdd === 1 ? "item" : "items"}`}
                </Button>
              </DialogFooter>
            </>
          )}
        </Dialog>
      </DialogModal>
    </DialogTrigger>
  );
};
