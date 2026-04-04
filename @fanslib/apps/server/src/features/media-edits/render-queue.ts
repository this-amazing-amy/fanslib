import { processNextQueuedEdit } from "./render-pipeline";
import { emitRenderEvent } from "./render-events";
import { remotionRenderFn } from "./remotion-render";

// eslint-disable-next-line functional/no-let
let isProcessing = false;

/**
 * Attempts to process the next queued MediaEdit.
 * Uses a lock to prevent parallel renders.
 */
export const processRenderQueue = async (): Promise<void> => {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const result = await processNextQueuedEdit(remotionRenderFn, (editId, progress) => {
      emitRenderEvent({
        type: "render-progress",
        editId,
        frame: progress.renderedFrames,
        percent: Math.round((progress.renderedFrames / progress.totalFrames) * 100),
      });
    });

    if (result) {
      emitRenderEvent({
        type: "render-completed",
        editId: result.editId,
        outputMediaId: result.outputMediaId,
      });
    }
  } catch (err) {
    // Errors are already handled inside processNextQueuedEdit
    console.error("[RenderQueue] Unexpected error:", err);
  } finally {
    isProcessing = false;
  }
};

/**
 * Starts the render queue watcher.
 * Polls every 5 seconds for queued edits.
 */
export const startRenderQueue = (intervalMs = 5000): (() => void) => {
  const interval = setInterval(() => {
    processRenderQueue();
  }, intervalMs);

  return () => clearInterval(interval);
};
