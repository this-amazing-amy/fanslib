import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "~/components/ui/Button";
import { api } from "~/lib/api/hono-client";
import { useEditorStore } from "~/stores/editorStore";
import { useClipStore } from "~/stores/clipStore";
import { QUERY_KEYS } from "~/lib/queries/query-keys";
import { intersectOperationsWithClip } from "../utils/clip-intersection";
import { ExportRegionList } from "./ExportRegionList";
import type { Track } from "@fanslib/video/types";

type ExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ExportDialog = ({ open, onOpenChange }: ExportDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();

  const editId = useEditorStore((s) => s.editId);
  const sourceMediaId = useEditorStore((s) => s.sourceMediaId);
  const operations = useEditorStore((s) => s.operations);
  const tracks = useEditorStore((s) => s.tracks);
  const setEditId = useEditorStore((s) => s.setEditId);
  const markClean = useEditorStore((s) => s.markClean);
  const clipRanges = useClipStore((s) => s.ranges);

  const isClipExport = clipRanges.length > 0;

  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync dialog open/close with the `open` prop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setSuccess(false);
      setError(null);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Listen for native close (e.g. Escape key)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onOpenChange(false);
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onOpenChange]);

  const createAndQueueEdit = useCallback(
    async (type: "transform" | "clip", ops: unknown[], editTracks?: Track[]): Promise<void> => {
      if (!sourceMediaId) throw new Error("No source media selected");
      const res = await api.api["media-edits"].$post({
        json: {
          sourceMediaId,
          type,
          operations: ops,
          ...(editTracks && editTracks.length > 0 ? { tracks: editTracks } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to create edit");
      const data = (await res.json()) as { id: string };

      const queueRes = await api.api["media-edits"][":id"].queue.$post({
        param: { id: data.id },
      });
      if (!queueRes.ok) throw new Error("Failed to queue render");
    },
    [sourceMediaId],
  );

  const handleExport = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      if (isClipExport) {
        // Batch export: one MediaEdit per clip range, with intersected operations
        await clipRanges.reduce(
          (promise, range) =>
            promise.then(() => {
              const remappedTracks = intersectOperationsWithClip(tracks, range);
              return createAndQueueEdit(
                "clip",
                [{ type: "clip", startFrame: range.startFrame, endFrame: range.endFrame }],
                remappedTracks.length > 0 ? remappedTracks : undefined,
              );
            }),
          Promise.resolve(),
        );
      } else {
        // Single transform export
        const currentEditId = await (async () => {
          if (editId) {
            const res = await api.api["media-edits"][":id"].$patch({
              param: { id: editId },
              json: { operations },
            });
            if (!res.ok) throw new Error("Failed to save edit");
            markClean();
            return editId;
          }
          if (!sourceMediaId) throw new Error("No source media selected");
          const res = await api.api["media-edits"].$post({
            json: {
              sourceMediaId,
              type: "transform",
              operations,
            },
          });
          if (!res.ok) throw new Error("Failed to create edit");
          const data = (await res.json()) as { id: string };
          setEditId(data.id);
          markClean();
          return data.id;
        })();

        const queueRes = await api.api["media-edits"][":id"].queue.$post({
          param: { id: currentEditId },
        });
        if (!queueRes.ok) throw new Error("Failed to queue render");
      }

      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.mediaEdits.queue(),
      });

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }, [
    isClipExport,
    clipRanges,
    tracks,
    editId,
    sourceMediaId,
    operations,
    setEditId,
    markClean,
    onOpenChange,
    queryClient,
    createAndQueueEdit,
  ]);

  return (
    <dialog
      ref={dialogRef}
      className="modal-box bg-base-100 rounded-lg shadow-xl p-0 w-full max-w-md backdrop:bg-black/50"
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2">
          {isClipExport
            ? `Export ${clipRanges.length} Clip${clipRanges.length > 1 ? "s" : ""}`
            : "Export & Render"}
        </h3>
        {isClipExport && (
          <p className="text-xs text-base-content/50 mb-4">
            Each clip is queued as its own render. Operations (blur, watermark, etc.) that overlap
            the clip window are included with frame positions remapped to the clip.
          </p>
        )}

        {success ? (
          <div className="text-success text-center py-8">Queued for rendering!</div>
        ) : (
          <div className="flex flex-col gap-4">
            <ExportRegionList />

            {error && <div className="text-error text-sm">{error}</div>}

            <div className="flex justify-end gap-2 mt-2">
              <Button
                size="sm"
                variant="ghost"
                onPress={() => onOpenChange(false)}
                isDisabled={exporting}
              >
                Cancel
              </Button>
              <Button size="sm" variant="primary" onPress={handleExport} isDisabled={exporting}>
                {exporting
                  ? "Exporting..."
                  : isClipExport
                    ? `Export All (${clipRanges.length})`
                    : "Export"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
};
