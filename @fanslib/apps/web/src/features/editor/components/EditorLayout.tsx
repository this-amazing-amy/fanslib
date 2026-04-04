import { useCallback, useEffect, useRef, useState } from "react";
import { shouldUseVideoElementForPreview } from "~/lib/editor-media-preview";
import { useMediaQuery } from "~/lib/queries/library";
import { useEditorStore } from "~/stores/editorStore";
import { useClipStore } from "~/stores/clipStore";
import { useMediaEditByIdQuery } from "~/lib/queries/media-edits";
import { isCaptionOperation } from "~/features/editor/utils/caption-layout";
import { EditorToolbar } from "./EditorToolbar";
import { EditorCanvas, type EditorCanvasHandle } from "./EditorCanvas";
import { LayerPanel } from "./LayerPanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { PlaybackBar } from "./PlaybackBar";

type EditorLayoutProps = {
  mediaId: string;
  editId?: string;
};

const isEditableKeyTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const { tagName } = target;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT")
    return true;
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
  const clipRanges = useClipStore((s) => s.ranges);
  const resetClips = useClipStore((s) => s.reset);
  const setSelectedOperationIndex = useEditorStore((s) => s.setSelectedOperationIndex);

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

  const seekToFrame = useCallback((frame: number) => {
    const player = canvasRef.current?.getPlayerRef();
    if (player) player.seekTo(frame);
    setCurrentFrame(frame);
  }, []);

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
        } else {
          player.play();
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

  useEffect(() => {
    if (clipHotkeysActive) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "i" && e.key !== "I" && e.key !== "o" && e.key !== "O") return;
      if (isEditableKeyTarget(e.target)) return;
      const { selectedOperationIndex: sel, operations: ops, updateOperation } =
        useEditorStore.getState();
      if (sel === null || sel >= ops.length) return;
      const op = ops[sel];
      if (!isCaptionOperation(op)) return;
      e.preventDefault();
      const frame = currentFrameRef.current;
      if (e.key === "i" || e.key === "I") {
        const start = frame;
        const end = Math.max(op.endFrame, start);
        updateOperation(sel, { ...op, startFrame: start, endFrame: end });
        return;
      }
      const start = Math.min(op.startFrame, frame);
      const end = Math.max(op.startFrame, frame);
      updateOperation(sel, { ...op, startFrame: start, endFrame: end });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clipHotkeysActive]);

  useEffect(() => {
    if (clipRanges.length > 0) {
      setSelectedOperationIndex(null);
    }
  }, [clipRanges.length, setSelectedOperationIndex]);

  useEffect(() => {
    if (!clipMode) return;
    setSelectedOperationIndex(null);
    useClipStore.getState().selectRange(null);
  }, [clipMode, setSelectedOperationIndex]);

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
  const totalFrames = isVideo ? 900 : 1;

  return (
    <div className="flex flex-col h-screen">
      <EditorToolbar mediaId={mediaId} />
      <div className="flex flex-1 overflow-hidden">
        <LayerPanel onSeekFrame={seekToFrame} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <EditorCanvas
            ref={canvasRef}
            mediaId={mediaId}
            mediaType={media.type}
            relativePath={media.relativePath}
            operations={operations}
            totalFrames={totalFrames}
            currentFrame={currentFrame}
            onPlayerFrameChange={setCurrentFrame}
            transformEditingLocked={clipRanges.length > 0 || clipMode}
          />
        </div>
        <PropertiesPanel />
      </div>
      <PlaybackBar
        getPlayer={getPlayer}
        totalFrames={totalFrames}
        fps={30}
        isVideo={isVideo}
        currentFrame={currentFrame}
        onFrameChange={setCurrentFrame}
      />
    </div>
  );
};
