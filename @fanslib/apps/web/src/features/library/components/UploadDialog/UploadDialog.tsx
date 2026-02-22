import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogModal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/AlertDialog";
import { Button } from "~/components/ui/Button";
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogModal,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/Dialog";
import { Progress } from "~/components/ui/Progress";
import { ScrollArea } from "~/components/ui/ScrollArea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/Select";
import { useUploadQueue } from "~/hooks/useUploadQueue";
import { QUERY_KEYS } from "~/lib/queries/query-keys";
import { useShootsQuery } from "~/lib/queries/shoots";
import { DropZone } from "./DropZone";
import { FileRow } from "./FileRow";

type UploadPhase = "selecting" | "uploading" | "complete";

type UploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const UploadDialog = ({ open, onOpenChange }: UploadDialogProps) => {
  const [phase, setPhase] = useState<UploadPhase>("selecting");
  const [selectedShootId, setSelectedShootId] = useState<string>("");
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const queryClient = useQueryClient();
  const { data: shootsData } = useShootsQuery({ limit: 200 });
  const shoots = shootsData?.items ?? [];

  const {
    files,
    addFiles,
    removeFile,
    retryFile,
    retryAllFailed,
    startUpload,
    cancelUpload,
    isUploading,
    completedCount,
    failedCount,
    totalCount,
    overallProgress,
  } = useUploadQueue();

  const allDone = totalCount > 0 && !isUploading && files.every((f) => f.status === "done" || f.status === "error");

  const requestClose = () => {
    if (isUploading) {
      setConfirmCloseOpen(true);
      return;
    }
    closeDialog();
  };

  const closeDialog = () => {
    cancelUpload();
    setPhase("selecting");
    setSelectedShootId("");
    onOpenChange(false);
  };

  const startUploadPhase = () => {
    setPhase("uploading");
    startUpload(selectedShootId);
  };

  const finishAndClose = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.all });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shoots.all() });
    closeDialog();
  };

  const retryFailed = () => {
    retryAllFailed();
    startUpload(selectedShootId);
  };

  const isSelectingPhase = phase === "selecting";
  const canUpload = selectedShootId && files.length > 0 && isSelectingPhase;

  return (
    <>
      <DialogTrigger isOpen={open} onOpenChange={(isOpen) => !isOpen && requestClose()}>
        <DialogModal isDismissable={!isUploading}>
          <Dialog maxWidth="2xl" showCloseButton={!isUploading}>
            {({ close: _close }) => (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {isSelectingPhase
                      ? "Upload Files"
                      : phase === "uploading"
                      ? `Uploading ${totalCount} ${totalCount === 1 ? "file" : "files"}…`
                      : "Upload Complete"}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Overall progress bar during upload */}
                  {phase === "uploading" && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs opacity-50">
                        <span>
                          {completedCount} / {totalCount} done
                          {failedCount > 0 && ` · ${failedCount} failed`}
                        </span>
                        <span>{overallProgress}%</span>
                      </div>
                      <Progress value={overallProgress} maxValue={100} />
                    </div>
                  )}

                  {/* Complete summary */}
                  {phase === "uploading" && allDone && (
                    <div className="flex items-center gap-2 rounded-md bg-base-200 p-3 text-sm">
                      {failedCount === 0 ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                          <span>
                            All {completedCount} {completedCount === 1 ? "file" : "files"} uploaded successfully.
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-error flex-shrink-0" />
                          <span>
                            {completedCount} uploaded, {failedCount} failed.
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Shoot selector (selecting phase only) */}
                  {isSelectingPhase && (
                    <div>
                      <SelectLabel>Upload to Shoot</SelectLabel>
                      <Select
                        value={selectedShootId}
                        onValueChange={setSelectedShootId}
                        aria-label="Select shoot"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a shoot…" />
                        </SelectTrigger>
                        <SelectContent>
                          {shoots.map((shoot) => (
                            <SelectItem key={shoot.id} value={shoot.id} textValue={shoot.name}>
                              {shoot.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Drop zone (selecting phase only, or when no files yet) */}
                  {isSelectingPhase && <DropZone onFiles={addFiles} />}

                  {/* File list */}
                  {files.length > 0 && (
                    <ScrollArea maxHeight="300px">
                      <div className="space-y-2 pr-1">
                        {files.map((fileState) => (
                          <FileRow
                            key={fileState.id}
                            fileState={fileState}
                            onRemove={removeFile}
                            onRetry={retryFile}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                <DialogFooter>
                  {isSelectingPhase && (
                    <>
                      <Button variant="outline" onPress={requestClose}>
                        Cancel
                      </Button>
                      <Button isDisabled={!canUpload} onPress={startUploadPhase}>
                        Upload {files.length > 0 ? `${files.length} ${files.length === 1 ? "file" : "files"}` : ""}
                      </Button>
                    </>
                  )}

                  {phase === "uploading" && !allDone && (
                    <Button variant="outline" onPress={requestClose}>
                      Close
                    </Button>
                  )}

                  {phase === "uploading" && allDone && failedCount > 0 && (
                    <>
                      <Button variant="outline" onPress={retryFailed}>
                        Retry {failedCount} failed
                      </Button>
                      <Button onPress={finishAndClose}>Done</Button>
                    </>
                  )}

                  {phase === "uploading" && allDone && failedCount === 0 && (
                    <Button onPress={finishAndClose}>Done</Button>
                  )}
                </DialogFooter>
              </>
            )}
          </Dialog>
        </DialogModal>
      </DialogTrigger>

      {/* Close confirmation while uploading */}
      <AlertDialogTrigger isOpen={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <AlertDialogModal>
          <AlertDialog maxWidth="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel upload?</AlertDialogTitle>
            </AlertDialogHeader>
            <p className="text-sm opacity-70">
              {completedCount > 0
                ? `${completedCount} ${completedCount === 1 ? "file has" : "files have"} already been saved. The remaining uploads will be cancelled.`
                : "All in-progress uploads will be cancelled."}
            </p>
            <AlertDialogFooter>
              <Button variant="outline" onPress={() => setConfirmCloseOpen(false)}>
                Keep uploading
              </Button>
              <Button
                variant="error"
                onPress={() => {
                  setConfirmCloseOpen(false);
                  closeDialog();
                }}
              >
                Cancel upload
              </Button>
            </AlertDialogFooter>
          </AlertDialog>
        </AlertDialogModal>
      </AlertDialogTrigger>
    </>
  );
};
