import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "~/lib/cn";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]);

const isSupportedFile = (file: File): boolean => {
  const ext = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  return IMAGE_EXTENSIONS.has(ext) || VIDEO_EXTENSIONS.has(ext);
};

type DropZoneProps = {
  onFiles: (files: File[]) => void;
};

export const DropZone = ({ onFiles }: DropZoneProps) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [rejectedCount, setRejectedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = (rawFiles: File[]) => {
    const supported = rawFiles.filter(isSupportedFile);
    const rejected = rawFiles.length - supported.length;
    setRejectedCount(rejected);
    if (supported.length > 0) onFiles(supported);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const onDragLeave = () => setIsDraggingOver(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors",
          isDraggingOver
            ? "border-primary bg-primary/10"
            : "border-base-content/20 hover:border-base-content/40 hover:bg-base-200/50"
        )}
      >
        <Upload className="h-8 w-8 opacity-50" />
        <div className="text-center">
          <p className="text-sm font-medium">Drop files here or click to browse</p>
          <p className="text-xs opacity-50 mt-1">
            Images: JPG, PNG, GIF, WEBP, AVIF &middot; Videos: MP4, WEBM, MOV, AVI, MKV
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*,.mkv,.mov,.avi,.avif"
          className="hidden"
          onChange={onInputChange}
        />
      </div>
      {rejectedCount > 0 && (
        <p className="text-xs text-error">
          {rejectedCount} unsupported {rejectedCount === 1 ? "file was" : "files were"} skipped.
        </p>
      )}
    </div>
  );
};
