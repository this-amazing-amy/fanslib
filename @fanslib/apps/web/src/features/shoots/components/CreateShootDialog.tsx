import type { Media } from "@fanslib/types";
import { format, isSameDay, parse } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { DateTimePicker } from "~/components/DateTimePicker";
import { Button } from "~/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/Dialog";
import { Input } from "~/components/ui/Input";
import { ScrollArea } from "~/components/ui/ScrollArea";
import { useShootContext } from "~/contexts/ShootContext";
import { MediaTileLite } from "~/features/library/components/MediaTile/MediaTileLite";
import { useMediaListQuery } from "~/lib/queries/library";

const DATE_FORMATS = [
  "yyyy-MM-dd",
  "yyyyMMdd",
  "dd-MM-yyyy",
  "dd.MM.yyyy",
  "MM-dd-yyyy",
  "yyyy.MM.dd",
];

const extractDateFromFilename = (filename: string): Date | null => {
  // Remove file extension
  const nameWithoutExt = filename.split(".").slice(0, -1).join(".");

  // eslint-disable-next-line functional/no-loop-statements
  for (const format of DATE_FORMATS) {
    try {
      // Find any sequence that could be a date based on the format length
      const matches = nameWithoutExt.match(/\d{2,4}[-._]\d{2}[-._]\d{2,4}|\d{8}/g);
      if (!matches) continue;

      // eslint-disable-next-line functional/no-loop-statements
      for (const match of matches) {
        try {
          // Normalize separators to '-' for parsing
          const normalizedMatch = match.replace(/[._]/g, "-");
          const date = parse(normalizedMatch, format, new Date());

          // Validate the date is reasonable (not in the future and not too far in the past)
          if (date <= new Date() && date.getFullYear() > 2000) {
            return date;
          }
        } catch {
          continue;
        }
      }
    } catch {
      continue;
    }
  }
  return null;
};

type CreateShootDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMedia: Media[];
  onSuccess?: () => void;
};

export const CreateShootDialog = ({
  open,
  onOpenChange,
  selectedMedia,
  onSuccess,
}: CreateShootDialogProps) => {
  const { refetch: refetchLibrary } = useMediaListQuery();
  const { createShoot } = useShootContext();
  const [shootName, setShootName] = useState(`New Shoot - ${format(new Date(), "PPP")}`);
  const [shootDate, setShootDate] = useState(new Date());
  const hasSetInitialValues = useRef(false);

  useEffect(() => {
    if (!open) {
      hasSetInitialValues.current = false;
      return;
    }

    if (hasSetInitialValues.current || selectedMedia.length === 0) return;
    hasSetInitialValues.current = true;

    // First check file creation dates
    const allSameCreationDay = selectedMedia.every(
      (media, i) => i === 0 || isSameDay(media.fileCreationDate, selectedMedia[0]?.fileCreationDate ?? new Date())
    );

    if (allSameCreationDay) {
      const mediaDate = new Date(selectedMedia[0]?.fileCreationDate ?? new Date());
      setShootDate(mediaDate);
      setShootName(`New Shoot - ${format(mediaDate, "PPP")}`);
      return;
    }

    // If creation dates don't match, try to extract dates from filenames
    const datesFromFilenames = selectedMedia
      .map((media) => extractDateFromFilename(media.name))
      .filter((date): date is Date => date !== null);

    if (datesFromFilenames.length === selectedMedia.length) {
      const allSameFileNameDay = datesFromFilenames.every(
        (date, i) => i === 0 || isSameDay(date, datesFromFilenames[0] ?? new Date())
      );

      if (allSameFileNameDay) {
        const mediaDate = datesFromFilenames[0] ?? new Date();
        setShootDate(mediaDate);
        setShootName(`New Shoot - ${format(mediaDate, "PPP")}`);
      }
    }
  }, [open, selectedMedia]);

  const handleCreateShoot = async () => {
    try {
      await createShoot({
        name: shootName,
        description: "",
        shootDate,
        mediaIds: selectedMedia.map((media) => media.id),
      });
      await refetchLibrary();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create shoot:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Shoot</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={shootName}
              onChange={(value) => setShootName(value)}
              placeholder="Enter shoot name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <DateTimePicker date={shootDate} setDate={setShootDate} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Media ({selectedMedia.length} items)</label>
            <ScrollArea className="h-[300px] border rounded-md p-2">
              <div className="space-y-2">
                {selectedMedia.map((media) => (
                  <div
                    key={media.id}
                    className="grid grid-cols-[100px_1fr_auto] gap-4 items-center"
                  >
                    <div className="aspect-square">
                      <MediaTileLite media={media} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{media.name}</div>
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(media.fileCreationDate, "PPP")}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateShoot}>
            Create Shoot with {selectedMedia.length} {selectedMedia.length === 1 ? "item" : "items"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
