import type { Media } from "@fanslib/server/schemas";
import { Film, Trash2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "~/components/ui/Button";
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogModal,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/Dialog";
import { EmptyState } from "~/components/ui/EmptyState";
import { backendBaseUrl } from "~/lib/config";
import { getMediaThumbnailUrl } from "~/lib/media-urls";
import { useDeleteMediaMutation, useUpdateMediaMutation } from "~/lib/queries/library";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "~/lib/queries/query-keys";

type ShootFootageProps = {
  shootId: string;
  footage: Media[];
};

export const ShootFootage = ({ shootId, footage }: ShootFootageProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const updateMediaMutation = useUpdateMediaMutation();
  const deleteMediaMutation = useDeleteMediaMutation();
  const queryClient = useQueryClient();
  const [deleteWarning, setDeleteWarning] = useState<{
    mediaId: string;
    compositionIds: string[];
  } | null>(null);

  const handleUpload = useCallback(
    async (files: FileList) => {
      setIsUploading(true);
      try {
        await Array.from(files).reduce(async (prev, file) => {
          await prev;
          const formData = new FormData();
          formData.append("file", file);
          formData.append("shootId", shootId);
          formData.append("category", "footage");

          await fetch(`${backendBaseUrl}/api/media/upload`, {
            method: "POST",
            body: formData,
          });
        }, Promise.resolve());
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shoots.all() });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [shootId, queryClient],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleUpload(e.target.files);
      }
    },
    [handleUpload],
  );

  const handleDelete = useCallback(
    async (mediaId: string) => {
      try {
        await deleteMediaMutation.mutateAsync({ id: mediaId });
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shoots.all() });
      } catch (error: unknown) {
        // Check for 409 conflict (media referenced by composition)
        if (error && typeof error === "object" && "response" in error) {
          const response = (error as { response: Response }).response;
          if (response.status === 409) {
            const body = await response.json();
            setDeleteWarning({
              mediaId,
              compositionIds: body.compositionIds ?? [],
            });
            return;
          }
        }
        throw error;
      }
    },
    [deleteMediaMutation, queryClient],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Footage</h2>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            isLoading={isUploading}
            onPress={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {footage.length === 0 ? (
        <EmptyState icon={<Film className="h-12 w-12" />} title="No footage uploaded" />
      ) : (
        <div className="flex flex-col gap-2">
          {footage.map((media) => (
            <FootageItem
              key={media.id}
              media={media}
              onNoteChange={(note) =>
                updateMediaMutation.mutateAsync({
                  id: media.id,
                  updates: { note: note || null },
                })
              }
              onDelete={() => handleDelete(media.id)}
            />
          ))}
        </div>
      )}

      <DialogTrigger isOpen={deleteWarning !== null} onOpenChange={() => setDeleteWarning(null)}>
        <DialogModal>
          <Dialog>
            {({ close }) => (
              <>
                <DialogHeader>
                  <DialogTitle>Cannot Delete Footage</DialogTitle>
                </DialogHeader>
                <p className="py-4">
                  This footage is referenced by {deleteWarning?.compositionIds.length ?? 0}{" "}
                  composition(s) and cannot be deleted. Remove it from the composition(s) first.
                </p>
                <DialogFooter>
                  <Button variant="ghost" onPress={close}>
                    OK
                  </Button>
                </DialogFooter>
              </>
            )}
          </Dialog>
        </DialogModal>
      </DialogTrigger>
    </div>
  );
};

type FootageItemProps = {
  media: Media;
  onNoteChange: (note: string) => void;
  onDelete: () => void;
};

const FootageItem = ({ media, onNoteChange, onDelete }: FootageItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [noteValue, setNoteValue] = useState(media.note ?? "");

  const handleSaveNote = useCallback(() => {
    setIsEditing(false);
    if (noteValue !== (media.note ?? "")) {
      onNoteChange(noteValue);
    }
  }, [noteValue, media.note, onNoteChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSaveNote();
      } else if (e.key === "Escape") {
        setNoteValue(media.note ?? "");
        setIsEditing(false);
      }
    },
    [handleSaveNote, media.note],
  );

  return (
    <div className="flex items-center gap-3 rounded-lg border border-base-300 p-3">
      <div className="w-16 h-16 flex-shrink-0 rounded bg-base-200 overflow-hidden">
        <img
          src={getMediaThumbnailUrl(media.id)}
          alt={media.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{media.name}</div>
        {isEditing ? (
          <input
            type="text"
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            onBlur={handleSaveNote}
            onKeyDown={handleKeyDown}
            className="input input-sm input-bordered w-full mt-1"
            placeholder="Add a note..."
            autoFocus
          />
        ) : (
          <button
            type="button"
            className="text-sm text-base-content/50 hover:text-base-content cursor-pointer mt-1"
            onClick={() => setIsEditing(true)}
          >
            {media.note || "Add a note..."}
          </button>
        )}
      </div>

      <Button variant="ghost" size="icon" onPress={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
