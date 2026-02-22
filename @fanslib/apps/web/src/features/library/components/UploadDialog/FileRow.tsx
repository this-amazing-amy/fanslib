import { AlertCircle, CheckCircle2, Clock, Loader2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "~/components/ui/Button";
import { Progress } from "~/components/ui/Progress";
import type { UploadFileState } from "~/hooks/useUploadQueue";

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

type FileRowProps = {
  fileState: UploadFileState;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
};

export const FileRow = ({ fileState, onRemove, onRetry }: FileRowProps) => {
  const { id, file, status, progress, error } = fileState;
  const previewUrlRef = useRef<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    if (imgRef.current) imgRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const statusIcon = {
    queued: <Clock className="h-4 w-4 text-base-content/40" />,
    uploading: null,
    processing: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
    done: <CheckCircle2 className="h-4 w-4 text-success" />,
    error: <AlertCircle className="h-4 w-4 text-error" />,
  }[status];

  const canRemove = status === "queued" || status === "error";

  return (
    <div className="flex items-center gap-3 rounded-md border border-base-content/10 p-2">
      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-base-200">
        <img
          ref={imgRef}
          alt={file.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs opacity-50">{formatBytes(file.size)}</p>

        {status === "uploading" && (
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1">
              <Progress value={progress} maxValue={100} />
            </div>
            <span className="text-xs opacity-50 w-8 text-right">{progress}%</span>
          </div>
        )}

        {status === "error" && error && (
          <p className="text-xs text-error mt-1 truncate">{error}</p>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-1">
        {statusIcon}

        {status === "error" && (
          <Button size="xs" variant="ghost" onPress={() => onRetry(id)}>
            Retry
          </Button>
        )}

        {canRemove && (
          <Button
            size="icon"
            variant="ghost"
            aria-label="Remove file"
            onPress={() => onRemove(id)}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};
