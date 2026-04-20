import type { Media } from "@fanslib/server/schemas";
import { useCallback, useRef, useState } from "react";
import * as tus from "tus-js-client";

const BACKEND_BASE_URL = import.meta.env.VITE_API_URL ?? "";
const UPLOAD_ENDPOINT = `${BACKEND_BASE_URL}/api/media/upload`;
const CONCURRENT_UPLOADS = 2;
const CHUNK_SIZE = 8 * 1024 * 1024;
const RETRY_DELAYS = [0, 1000, 3000, 5000];

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
  pauseAll: () => void;
  resumeAll: () => void;
  isPaused: boolean;
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

const parseMediaFromResponse = (body: string): Media | undefined => {
  try {
    return JSON.parse(body) as Media;
  } catch {
    return undefined;
  }
};

export const useUploadQueue = (): UseUploadQueueResult => {
  const [files, setFiles] = useState<UploadFileState[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const uploadMapRef = useRef<Map<string, tus.Upload>>(new Map());
  const shootIdRef = useRef<string>("");
  const filesRef = useRef<UploadFileState[]>([]);
  const drainQueueRef = useRef<((shootId: string) => void) | null>(null);
  const isPausedRef = useRef(false);

  filesRef.current = files;
  isPausedRef.current = isPaused;

  const updateFile = useCallback((id: string, patch: Partial<UploadFileState>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  const startTusUpload = useCallback(
    (fileState: UploadFileState, shootId: string) => {
      updateFile(fileState.id, { status: "uploading", progress: 0, error: undefined });

      const upload = new tus.Upload(fileState.file, {
        endpoint: UPLOAD_ENDPOINT,
        chunkSize: CHUNK_SIZE,
        retryDelays: RETRY_DELAYS,
        metadata: {
          filename: fileState.file.name,
          shootId,
          category: "library",
        },
        onProgress: (bytesSent, bytesTotal) => {
          const progress = bytesTotal > 0 ? Math.round((bytesSent / bytesTotal) * 100) : 0;
          updateFile(fileState.id, { progress });
        },
        onSuccess: (payload) => {
          uploadMapRef.current.delete(fileState.id);
          const media = parseMediaFromResponse(payload.lastResponse.getBody());
          updateFile(fileState.id, { status: "done", progress: 100, media });
          drainQueueRef.current?.(shootId);
        },
        onError: (error) => {
          uploadMapRef.current.delete(fileState.id);
          updateFile(fileState.id, {
            status: "error",
            error: error instanceof Error ? error.message : "Upload failed",
          });
          drainQueueRef.current?.(shootId);
        },
      });

      uploadMapRef.current.set(fileState.id, upload);
      upload.start();
    },
    [updateFile],
  );

  const drainQueue = useCallback(
    (shootId: string) => {
      if (isPausedRef.current) return;
      const current = filesRef.current;
      const activeCount = uploadMapRef.current.size;
      const slotsAvailable = CONCURRENT_UPLOADS - activeCount;

      if (slotsAvailable <= 0) return;

      const queued = current.filter((f) => f.status === "queued");
      queued.slice(0, slotsAvailable).forEach((f) => startTusUpload(f, shootId));
    },
    [startTusUpload],
  );

  drainQueueRef.current = drainQueue;

  const addFiles = useCallback((newFiles: File[]) => {
    const entries: UploadFileState[] = newFiles.map((file) => ({
      id: self.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      status: "queued",
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...entries]);
  }, []);

  const removeFile = useCallback((id: string) => {
    const upload = uploadMapRef.current.get(id);
    if (upload) {
      upload.abort(true).catch(() => undefined);
      uploadMapRef.current.delete(id);
    }
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const retryFile = useCallback(
    (id: string) => {
      updateFile(id, { status: "queued", progress: 0, error: undefined });
      const shootId = shootIdRef.current;
      if (shootId) setTimeout(() => drainQueue(shootId), 0);
    },
    [updateFile, drainQueue],
  );

  const retryAllFailed = useCallback(() => {
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "error" ? { ...f, status: "queued", progress: 0, error: undefined } : f,
      ),
    );
    const shootId = shootIdRef.current;
    if (shootId) setTimeout(() => drainQueue(shootId), 0);
  }, [drainQueue]);

  const startUpload = useCallback(
    (shootId: string) => {
      shootIdRef.current = shootId;
      drainQueue(shootId);
    },
    [drainQueue],
  );

  const cancelUpload = useCallback(() => {
    uploadMapRef.current.forEach((upload) => {
      upload.abort(true).catch(() => undefined);
    });
    uploadMapRef.current.clear();
    setIsPaused(false);
  }, []);

  const pauseAll = useCallback(() => {
    setIsPaused(true);
    uploadMapRef.current.forEach((upload) => {
      upload.abort(false).catch(() => undefined);
    });
  }, []);

  const resumeAll = useCallback(() => {
    setIsPaused(false);
    uploadMapRef.current.forEach((upload) => {
      upload.start();
    });
    const shootId = shootIdRef.current;
    if (shootId) setTimeout(() => drainQueueRef.current?.(shootId), 0);
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
    pauseAll,
    resumeAll,
    isPaused,
    isUploading,
    completedCount,
    failedCount,
    totalCount,
    overallProgress,
  };
};
