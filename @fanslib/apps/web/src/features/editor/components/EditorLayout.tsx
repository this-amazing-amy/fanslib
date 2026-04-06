import { useCallback, useEffect, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { shouldUseVideoElementForPreview } from "~/lib/editor-media-preview";
import { useMediaQuery } from "~/lib/queries/library";
import { useEditorStore } from "~/stores/editorStore";
import { useClipStore } from "~/stores/clipStore";
import { useMediaEditByIdQuery } from "~/lib/queries/media-edits";
import { EditorToolbar } from "./EditorToolbar";
import { EditorCanvas, type EditorCanvasHandle } from "./EditorCanvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { Timeline } from "./Timeline";

type EditorLayoutProps = {
  mediaId: string;
  editId?: string;
};

const isEditableKeyTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const { tagName } = target;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") return true;
  return target.isContentEditable;
};

export const EditorLayout = ({ mediaId, editId }: EditorLayoutProps) => {
  const { data: media, isLoading: mediaLoading } = useMediaQuery({ id: mediaId });
  const { data: existingEdit, isLoading: editLoading } = useMediaEditByIdQuery(editId ?? "");
  const operations = useEditorStore((s) => s.operations);
  const isDirty = useEditorStore((s) => s.isDirty);
  const hydrate = useEditorStore((s) => s.hydrate);
  const reset = useEditorStore((s) => s.reset);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const setSourceMediaId = useEditorStore((s) => s.setSourceMediaId);
  const setEditId = useEditorStore((s) => s.setEditId);
  const clipMode = useClipStore((s) => s.clipMode);
  const resetClips = useClipStore((s) => s.reset);
  const setSelectedOperationId = useEditorStore((s) => s.setSelectedOperationId);

  const clipHotkeysActive =
    !mediaLoading &&
    !(editId && editLoading) &&
    media &&
    !("error" in media) &&
    shouldUseVideoElementForPreview({
      type: media.type,
      relativePath: media.relativePath,
    }) &&
    clipMode;

  const [currentFrame, setCurrentFrame] = useState(0);
  const currentFrameRef = useRef(0);
  currentFrameRef.current = currentFrame;

  const canvasRef = useRef<EditorCanvasHandle>(null);
  const getPlayer = () => canvasRef.current?.getPlayerRef() ?? null;

  const [playing, setPlaying] = useState(false);

  const seekToFrame = useCallback((frame: number) => {
    const player = canvasRef.current?.getPlayerRef();
    if (player) player.seekTo(frame);
    setCurrentFrame(frame);
  }, []);

  const handlePlay = useCallback(() => {
    const player = getPlayer();
    if (player) player.play();
    setPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    const player = getPlayer();
    if (player) player.pause();
    setPlaying(false);
  }, []);

  const handleSkipBack = useCallback(() => {
    seekToFrame(0);
  }, [seekToFrame]);

  const totalFramesRef = useRef(1);

  const handleSkipForward = useCallback(() => {
    seekToFrame(Math.max(0, totalFramesRef.current - 1));
  }, [seekToFrame]);

  const handleCanvasBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        setSelectedOperationId(null);
      }
    },
    [setSelectedOperationId],
  );

  useEffect(() => {
    setSourceMediaId(mediaId);
    if (editId) {
      setEditId(editId);
    }
  }, [mediaId, editId, setSourceMediaId, setEditId]);

  useEffect(() => {
    if (existingEdit && editId) {
      hydrate(existingEdit.operations);
    }
    return () => {
      reset();
      resetClips();
    };
  }, [existingEdit, editId, hydrate, reset, resetClips]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

      if (e.key === " " && !isEditableKeyTarget(e.target)) {
        e.preventDefault();
        const player = getPlayer();
        if (!player) return;
        if (player.isPlaying()) {
          player.pause();
          setPlaying(false);
        } else {
          player.play();
          setPlaying(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    if (!clipHotkeysActive) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "i" && e.key !== "I" && e.key !== "o" && e.key !== "O") return;
      if (isEditableKeyTarget(e.target)) return;
      e.preventDefault();
      const frame = currentFrameRef.current;
      const { setMarkInAtFrame, commitMarkOutAtFrame } = useClipStore.getState();
      if (e.key === "i" || e.key === "I") {
        setMarkInAtFrame(frame);
      } else {
        commitMarkOutAtFrame(frame);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clipHotkeysActive]);

  // P key: set peak marker inside the clip range containing the playhead
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "p" && e.key !== "P") return;
      if (isEditableKeyTarget(e.target)) return;
      e.preventDefault();
      useClipStore.getState().setPeakAtFrame(currentFrameRef.current);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (clipHotkeysActive) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "i" && e.key !== "I" && e.key !== "o" && e.key !== "O") return;
      if (isEditableKeyTarget(e.target)) return;
      const {
        selectedOperationId: selId,
        operations: ops,
        updateOperationById,
      } = useEditorStore.getState();
      if (selId === null) return;
      const op = (ops as Array<{ id?: string; startFrame?: number; endFrame?: number }>).find(
        (o) => o.id === selId,
      );
      if (!op || op.startFrame === undefined || op.endFrame === undefined) return;
      e.preventDefault();
      const frame = currentFrameRef.current;
      if (e.key === "i" || e.key === "I") {
        const start = frame;
        const end = Math.max(op.endFrame, start);
        updateOperationById(selId, { ...op, startFrame: start, endFrame: end });
        return;
      }
      const start = Math.min(op.startFrame, frame);
      const end = Math.max(op.startFrame, frame);
      updateOperationById(selId, { ...op, startFrame: start, endFrame: end });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clipHotkeysActive]);

  useEffect(() => {
    if (!clipMode) return;
    setSelectedOperationId(null);
    useClipStore.getState().selectRange(null);
  }, [clipMode, setSelectedOperationId]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  if (mediaLoading || (editId && editLoading)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-base-content/60">Loading editor...</div>
      </div>
    );
  }

  if (!media || "error" in media) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-error">Media not found</div>
      </div>
    );
  }

  const isVideo = shouldUseVideoElementForPreview({
    type: media.type,
    relativePath: media.relativePath,
  });
  const totalFrames = isVideo ? Math.max(1, Math.round((media.duration ?? 30) * 30)) : 1;
  totalFramesRef.current = totalFrames;

  return (
    <div className="flex flex-col h-screen">
      <EditorToolbar mediaId={mediaId} />
      <PanelGroup direction="vertical">
        <Panel defaultSize={70} minSize={30}>
          <div className="flex flex-1 h-full overflow-hidden" onClick={handleCanvasBackgroundClick}>
            <EditorCanvas
              ref={canvasRef}
              mediaId={mediaId}
              mediaType={media.type}
              relativePath={media.relativePath}
              operations={operations}
              totalFrames={totalFrames}
              currentFrame={currentFrame}
              onPlayerFrameChange={setCurrentFrame}
            />
            <PropertiesPanel />
          </div>
        </Panel>
        <PanelResizeHandle className="h-1.5 bg-base-300 hover:bg-primary/30 cursor-row-resize" />
        <Panel defaultSize={30} minSize={15}>
          <Timeline
            currentFrame={currentFrame}
            totalFrames={totalFrames}
            fps={30}
            playing={playing}
            filename={media?.relativePath.split("/").pop() ?? undefined}
            onSeek={seekToFrame}
            onPlay={handlePlay}
            onPause={handlePause}
            onSkipBack={handleSkipBack}
            onSkipForward={handleSkipForward}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
};
