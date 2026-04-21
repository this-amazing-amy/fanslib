import { CheckCircle2, Plus, XCircle } from "lucide-react";
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
import { Input } from "~/components/ui/Input";
import { ScrollArea } from "~/components/ui/ScrollArea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/Select";
import { DateTimePicker } from "~/components/DateTimePicker";
import { useUploadQueue } from "~/hooks/useUploadQueue";
import { QUERY_KEYS } from "~/lib/queries/query-keys";
import { useCreateShootMutation, useShootsQuery } from "~/lib/queries/shoots";
import { DropZone } from "./DropZone";
import { FileRow } from "./FileRow";

type UploadPhase = "selecting" | "uploading" | "complete";
type ShootMode = "select" | "create";

type UploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const UploadDialog = ({ open, onOpenChange }: UploadDialogProps) => {
  const [phase, setPhase] = useState<UploadPhase>("selecting");
  const [selectedShootId, setSelectedShootId] = useState<string>("");
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [shootMode, setShootMode] = useState<ShootMode>("select");
  const [newShootName, setNewShootName] = useState("");
  const [newShootDate, setNewShootDate] = useState(() => new Date());

  const queryClient = useQueryClient();
  const { data: shootsData } = useShootsQuery({ limit: 200 });
  const shoots = shootsData?.items ?? [];
  const createShootMutation = useCreateShootMutation();

  const {
    files,
    addFiles,
    removeFile,
    retryFile,
    retryAllFailed,
    startUpload,
    cancelUpload,
    pauseAll,
    resumeAll,
    isPaused,
    isUploading,
    completedCount,
    failedCount,
    totalCount,
    overallProgress,
  } = useUploadQueue();

  const allDone =
    totalCount > 0 &&
    !isUploading &&
    files.every((f) => f.status === "done" || f.status === "error");

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
    setShootMode("select");
    setNewShootName("");
    setNewShootDate(new Date());
    onOpenChange(false);
  };

  const startUploadPhase = async () => {
    if (shootMode === "create") {
      const shoot = await createShootMutation.mutateAsync({
        name: newShootName.trim(),
        shootDate: newShootDate,
      });
      setPhase("uploading");
      startUpload(shoot.id);
    } else {
      setPhase("uploading");
      startUpload(selectedShootId);
    }
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
  const shootReady = shootMode === "select" ? !!selectedShootId : newShootName.trim().length > 0;
  const canUpload = shootReady && files.length > 0 && isSelectingPhase;

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
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs opacity-50">
                        <span>
                          {completedCount} / {totalCount} done
                          {failedCount > 0 && ` · ${failedCount} failed`}
                        </span>
                        <span>{overallProgress}%</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-base-content/15">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${overallProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Complete summary */}
                  {phase === "uploading" && allDone && (
                    <div className="flex items-center gap-2 rounded-md bg-base-200 p-3 text-sm">
                      {failedCount === 0 ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                          <span>
                            All {completedCount} {completedCount === 1 ? "file" : "files"} uploaded
                            successfully.
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

                  {/* Shoot selector / create (selecting phase only) */}
                  {isSelectingPhase && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <SelectLabel className="mb-0">
                          {shootMode === "select" ? "Upload to Shoot" : "New Shoot"}
                        </SelectLabel>
                        <Button
                          size="xs"
                          variant="ghost"
                          onPress={() => {
                            setShootMode((m) => (m === "select" ? "create" : "select"));
                          }}
                        >
                          {shootMode === "select" ? (
                            <>
                              <Plus className="mr-1 h-3 w-3" />
                              New shoot
                            </>
                          ) : (
                            "Select existing"
                          )}
                        </Button>
                      </div>

                      {shootMode === "select" ? (
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
                      ) : (
                        <div className="space-y-2">
                          <Input
                            value={newShootName}
                            onChange={setNewShootName}
                            placeholder="Shoot name…"
                            aria-label="New shoot name"
                          />
                          <DateTimePicker date={newShootDate} setDate={setNewShootDate} />
                        </div>
                      )}
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
                      <Button
                        isDisabled={!canUpload || createShootMutation.isPending}
                        onPress={startUploadPhase}
                      >
                        {createShootMutation.isPending
                          ? "Creating shoot…"
                          : `Upload ${files.length > 0 ? `${files.length} ${files.length === 1 ? "file" : "files"}` : ""}`}
                      </Button>
                    </>
                  )}

                  {phase === "uploading" && !allDone && (
                    <>
                      <Button
                        variant="outline"
                        onPress={() => (isPaused ? resumeAll() : pauseAll())}
                      >
                        {isPaused ? "Resume" : "Pause"}
                      </Button>
                      <Button variant="outline" onPress={requestClose}>
                        Close
                      </Button>
                    </>
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
