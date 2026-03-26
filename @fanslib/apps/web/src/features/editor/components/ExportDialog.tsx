import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "~/components/ui/Button";
import { useEditorStore } from "~/stores/editorStore";
import { QUERY_KEYS } from "~/lib/queries/query-keys";

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
  const setEditId = useEditorStore((s) => s.setEditId);
  const markClean = useEditorStore((s) => s.markClean);

  const [role, setRole] = useState("");
  const [pkg, setPkg] = useState("");
  const [contentRating, setContentRating] = useState("sg");
  const [quality, setQuality] = useState("pretty");
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

  const handleExport = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      // Step 1: Save the edit (create or update)
      const currentEditId = await (async () => {
        if (editId) {
          const res = await fetch(`/api/media-edits/${editId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ operations }),
          });
          if (!res.ok) throw new Error("Failed to save edit");
          markClean();
          return editId;
        }
        const res = await fetch("/api/media-edits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceMediaId,
            type: "transform",
            operations,
          }),
        });
        if (!res.ok) throw new Error("Failed to create edit");
        const data = await res.json();
        setEditId(data.id);
        markClean();
        return data.id as string;
      })();

      // Step 2: Queue the render
      const queueRes = await fetch(`/api/media-edits/${currentEditId}/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          package: pkg,
          contentRating,
          quality,
        }),
      });
      if (!queueRes.ok) throw new Error("Failed to queue render");

      // Invalidate queue query
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
    editId,
    sourceMediaId,
    operations,
    role,
    pkg,
    contentRating,
    quality,
    setEditId,
    markClean,
    onOpenChange,
    queryClient,
  ]);

  return (
    <dialog
      ref={dialogRef}
      className="modal-box bg-base-100 rounded-lg shadow-xl p-0 w-full max-w-md backdrop:bg-black/50"
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Export &amp; Render</h3>

        {success ? (
          <div className="text-success text-center py-8">
            Queued for rendering!
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-base-content/70">Role</span>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. main, alt"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-base-content/70">Package</span>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                value={pkg}
                onChange={(e) => setPkg(e.target.value)}
                placeholder="e.g. premium, free"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-base-content/70">Content Rating</span>
              <select
                className="select select-bordered select-sm w-full"
                value={contentRating}
                onChange={(e) => setContentRating(e.target.value)}
              >
                <option value="sf">SF - Safe</option>
                <option value="sg">SG - Suggestive</option>
                <option value="cn">CN - Cautionary Nudity</option>
                <option value="uc">UC - Uncensored</option>
                <option value="xt">XT - Explicit</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-base-content/70">Quality</span>
              <select
                className="select select-bordered select-sm w-full"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
              >
                <option value="fast">Fast</option>
                <option value="pretty">Pretty</option>
              </select>
            </label>

            {error && (
              <div className="text-error text-sm">{error}</div>
            )}

            <div className="flex justify-end gap-2 mt-2">
              <Button
                size="sm"
                variant="ghost"
                onPress={() => onOpenChange(false)}
                isDisabled={exporting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onPress={handleExport}
                isDisabled={exporting}
              >
                {exporting ? "Exporting..." : "Export"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
};
