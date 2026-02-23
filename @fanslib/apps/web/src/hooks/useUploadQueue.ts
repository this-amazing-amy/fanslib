import type { Media } from "@fanslib/server/schemas";
import { useCallback, useRef, useState } from "react";

const BACKEND_BASE_URL = import.meta.env.VITE_API_URL ?? "";
const CONCURRENT_UPLOADS = 2;

export type UploadFileStatus = "queued" | "uploading" | "processing" | "done" | "error";

export type UploadFileState = {
  id: string;
  file: File;
  status: UploadFileStatus;
  progress: number;
  error?: string;
  media?: Media;
};

type UseUploadQueueResult = {
  files: UploadFileState[];
  addFiles: (newFiles: File[]) => void;
  removeFile: (id: string) => void;
  retryFile: (id: string) => void;
  retryAllFailed: () => void;
  startUpload: (shootId: string) => void;
  cancelUpload: () => void;
  isUploading: boolean;
  completedCount: number;
  failedCount: number;
  totalCount: number;
  overallProgress: number;
};

const weightedProgress = (files: UploadFileState[]): number => {
  const totalBytes = files.reduce((sum, f) => sum + f.file.size, 0);
  if (totalBytes === 0) return 0;

  const completedBytes = files.reduce((sum, f) => {
    if (f.status === "done" || f.status === "processing") return sum + f.file.size;
    if (f.status === "uploading") return sum + (f.file.size * f.progress) / 100;
    return sum;
  }, 0);

  return Math.round((completedBytes / totalBytes) * 100);
};

export const useUploadQueue = (): UseUploadQueueResult => {
  const [files, setFiles] = useState<UploadFileState[]>([]);
  const xhrMapRef = useRef<Map<string, XMLHttpRequest>>(new Map());
  const shootIdRef = useRef<string>("");
  const filesRef = useRef<UploadFileState[]>([]);
  const drainQueueRef = useRef<((shootId: string) => void) | null>(null);

  filesRef.current = files;

  const updateFile = useCallback((id: string, patch: Partial<UploadFileState>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  const uploadFile = useCallback(
    (fileState: UploadFileState, shootId: string) => {
      updateFile(fileState.id, { status: "uploading", progress: 0, error: undefined });

      const xhr = new XMLHttpRequest();
      xhrMapRef.current.set(fileState.id, xhr);

      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        updateFile(fileState.id, { progress: Math.round((e.loaded / e.total) * 100) });
      };

      xhr.onload = () => {
        xhrMapRef.current.delete(fileState.id);

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const media = JSON.parse(xhr.responseText) as Media;
            updateFile(fileState.id, { status: "done", progress: 100, media });
          } catch {
            updateFile(fileState.id, { status: "error", error: "Invalid server response" });
          }
        } else {
          const defaultMessage = `Server error ${xhr.status}`;
          const errorMessage = (() => {
            try {
              const body = JSON.parse(xhr.responseText) as { error?: string };
              return body.error ?? defaultMessage;
            } catch {
              return defaultMessage;
            }
          })();
          updateFile(fileState.id, { status: "error", error: errorMessage });
        }

        drainQueueRef.current?.(shootId);
      };

      xhr.onerror = () => {
        xhrMapRef.current.delete(fileState.id);
        updateFile(fileState.id, { status: "error", error: "Network error" });
        drainQueueRef.current?.(shootId);
      };

      xhr.onabort = () => {
        xhrMapRef.current.delete(fileState.id);
        updateFile(fileState.id, { status: "queued", progress: 0 });
      };

      const formData = new FormData();
      formData.append("shootId", shootId);
      formData.append("file", fileState.file);

      xhr.open("POST", `${BACKEND_BASE_URL}/api/media/upload`);
      xhr.send(formData);
    },
    [updateFile]
  );

  const drainQueue = useCallback(
    (shootId: string) => {
      const current = filesRef.current;
      const activeCount = xhrMapRef.current.size;
      const slotsAvailable = CONCURRENT_UPLOADS - activeCount;

      if (slotsAvailable <= 0) return;

      const queued = current.filter((f) => f.status === "queued");
      queued.slice(0, slotsAvailable).forEach((f) => uploadFile(f, shootId));
    },
    [uploadFile] // uploadFile is stable; drainQueueRef avoids circular dep
  );

  drainQueueRef.current = drainQueue;

  const addFiles = useCallback((newFiles: File[]) => {
    const entries: UploadFileState[] = newFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "queued",
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...entries]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const retryFile = useCallback(
    (id: string) => {
      updateFile(id, { status: "queued", progress: 0, error: undefined });
      const shootId = shootIdRef.current;
      if (shootId) setTimeout(() => drainQueue(shootId), 0);
    },
    [updateFile, drainQueue]
  );

  const retryAllFailed = useCallback(() => {
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "error" ? { ...f, status: "queued", progress: 0, error: undefined } : f
      )
    );
    const shootId = shootIdRef.current;
    if (shootId) setTimeout(() => drainQueue(shootId), 0);
  }, [drainQueue]);

  const startUpload = useCallback(
    (shootId: string) => {
      shootIdRef.current = shootId;
      drainQueue(shootId);
    },
    [drainQueue]
  );

  const cancelUpload = useCallback(() => {
    xhrMapRef.current.forEach((xhr) => xhr.abort());
    xhrMapRef.current.clear();
  }, []);

  const isUploading = files.some((f) => f.status === "uploading" || f.status === "processing");
  const completedCount = files.filter((f) => f.status === "done").length;
  const failedCount = files.filter((f) => f.status === "error").length;
  const totalCount = files.length;
  const overallProgress = weightedProgress(files);

  return {
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
  };
};
