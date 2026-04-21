import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ArrowLeft, ChevronLeft, ChevronRight, Crop, Droplets, Redo2, Smile, Type, Undo2, ZoomIn, Grid3x3 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "~/components/ui/Button";
import { shouldUseVideoElementForPreview } from "~/lib/editor-media-preview";
import { useCompositionByIdQuery } from "~/lib/queries/compositions";
import { useShootQuery } from "~/lib/queries/shoots";
import { useEditorStore } from "~/stores/editorStore";
import { useCompositionAutoSave } from "~/features/editor/hooks/useCompositionAutoSave";
import { EditorCanvas, type EditorCanvasHandle } from "./EditorCanvas";
import { Timeline } from "./Timeline";
import { PropertiesPanel } from "./PropertiesPanel";
import { TransitionProperties } from "./TransitionProperties";
import { SourceBin } from "./SourceBin";
import { computeSequenceTimeline } from "../utils/sequence-engine";

const SourceModeIndicator = () => {
  const selectedSourceId = useEditorStore((s) => s.selectedSourceId);
  const pendingSourceMarkIn = useEditorStore((s) => s.pendingSourceMarkIn);

  if (!selectedSourceId) return null;

  return (
    <div className="bg-muted/50 border-b px-4 py-2 text-sm" data-testid="source-mode-indicator">
      <span className="text-muted-foreground">Source: </span>
      <span className="font-medium">{selectedSourceId}</span>
      {pendingSourceMarkIn !== null && (
        <span className="text-muted-foreground ml-2">
          Mark In: {pendingSourceMarkIn}
        </span>
      )}
    </div>
  );
};

type CompositionEditorProps = {
  shootId: string;
  compositionId: string;
};

export const CompositionEditor = ({ shootId, compositionId }: CompositionEditorProps) => {
  const navigate = useNavigate();
  const { data: composition, isLoading, error } = useCompositionByIdQuery(compositionId);
  const { data: shoot } = useShootQuery({ id: shootId });
  const hydrate = useEditorStore((s) => s.hydrate);
  const reset = useEditorStore((s) => s.reset);
  const storeOperations = useEditorStore((s) => s.operations);
  const operations = useMemo(() => storeOperations ?? [], [storeOperations]);
  const storeSegments = useEditorStore((s) => s.segments);
  const segments = useMemo(() => storeSegments ?? [], [storeSegments]);
  const selectedSourceId = useEditorStore((s) => s.selectedSourceId) ?? null;
  const setSelectedOperationId = useEditorStore((s) => s.setSelectedOperationId);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.canUndo);
  const canRedo = useEditorStore((s) => s.canRedo);
  const addCrop = useEditorStore((s) => s.addCrop);
  const addCaption = useEditorStore((s) => s.addCaption);
  const addBlur = useEditorStore((s) => s.addBlur);
  const addEmoji = useEditorStore((s) => s.addEmoji);
  const addPixelate = useEditorStore((s) => s.addPixelate);
  const addZoom = useEditorStore((s) => s.addZoom);
  const { isSaving, lastSaveError } = useCompositionAutoSave(composition ? compositionId : null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [isSourceBinCollapsed, setIsSourceBinCollapsed] = useState(false);
  const canvasRef = useRef<EditorCanvasHandle>(null);
  const hydratedCompositionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!composition) return;
    if (hydratedCompositionIdRef.current === composition.id) return;
    hydrate({
      tracks: composition.tracks,
      segments: composition.segments,
    } as Parameters<typeof hydrate>[0]);
    hydratedCompositionIdRef.current = composition.id;
  }, [composition, hydrate]);

  useEffect(() => {
    hydratedCompositionIdRef.current = null;
  }, [compositionId]);

  useEffect(() => () => {
    hydratedCompositionIdRef.current = null;
    reset();
  }, [reset]);

  const sourceMedia = useMemo(
    () =>
      ((shoot as { media?: Array<{ id: string; type: "image" | "video"; relativePath: string; duration: number | null }> })
        ?.media ?? []),
    [shoot],
  );
  const mediaById = useMemo(() => new Map(sourceMedia.map((media) => [media.id, media])), [sourceMedia]);
  const fallbackSourceId = segments.at(0)?.sourceMediaId ?? sourceMedia.at(0)?.id ?? null;
  const previewSourceId = selectedSourceId ?? fallbackSourceId;
  const previewSource = previewSourceId ? (mediaById.get(previewSourceId) ?? null) : null;

  const sequenceDurationFrames = useMemo(
    () => Math.max(1, computeSequenceTimeline(segments).totalDuration),
    [segments],
  );
  const previewSourceFrames =
    previewSource && shouldUseVideoElementForPreview({
      type: previewSource.type,
      relativePath: previewSource.relativePath,
    })
      ? Math.max(1, Math.round((previewSource.duration ?? 0) * 30))
      : 1;
  const totalFrames = Math.max(sequenceDurationFrames, previewSourceFrames);

  const seekToFrame = useCallback((frame: number) => {
    const player = canvasRef.current?.getPlayerRef();
    if (player) player.seekTo(frame);
    setCurrentFrame(frame);
  }, []);

  const play = useCallback(() => {
    const player = canvasRef.current?.getPlayerRef();
    if (!player) return;
    player.play();
    setPlaying(true);
  }, []);

  const pause = useCallback(() => {
    const player = canvasRef.current?.getPlayerRef();
    if (!player) return;
    player.pause();
    setPlaying(false);
  }, []);

  const skipBack = useCallback(() => seekToFrame(0), [seekToFrame]);
  const skipForward = useCallback(
    () => seekToFrame(Math.max(0, totalFrames - 1)),
    [seekToFrame, totalFrames],
  );
  const toggleSourceBin = useCallback(() => {
    setIsSourceBinCollapsed((collapsed) => !collapsed);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center" data-testid="composition-loading">
        <p className="text-muted-foreground">Loading composition...</p>
      </div>
    );
  }

  if (error || !composition) {
    return (
      <div className="flex h-full items-center justify-center" data-testid="composition-error">
        <p className="text-destructive">
          {error?.message ?? "Composition not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col" data-testid="composition-editor">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">{composition.name}</h1>
          <span className="text-muted-foreground text-xs" data-testid="save-status">
            {lastSaveError ? (
              <span className="text-destructive">Save failed</span>
            ) : isSaving ? (
              "Saving..."
            ) : (
              "Saved"
            )}
          </span>
        </div>
        <p className="text-muted-foreground text-sm">
          Shoot: {shootId} &middot; {composition.segments.length} segment{composition.segments.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="h-12 bg-base-100 flex items-center px-4 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onPress={() => navigate({ to: "/shoots/$shootId", params: { shootId } })}
          aria-label="Back to shoot"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-6 w-px mx-2 bg-transparent" />
        <Button
          size="icon"
          variant="ghost"
          onPress={toggleSourceBin}
          aria-label={isSourceBinCollapsed ? "Expand media drawer" : "Collapse media drawer"}
        >
          {isSourceBinCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
        <Button size="icon" variant="ghost" onPress={addCrop} aria-label="Crop">
          <Crop className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onPress={addCaption} aria-label="Caption">
          <Type className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onPress={addBlur} aria-label="Blur region">
          <Droplets className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onPress={() => addEmoji()} aria-label="Emoji overlay">
          <Smile className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onPress={addPixelate} aria-label="Pixelate">
          <Grid3x3 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onPress={addZoom} aria-label="Zoom">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button size="icon" variant="ghost" onPress={undo} isDisabled={!canUndo} aria-label="Undo">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onPress={redo} isDisabled={!canRedo} aria-label="Redo">
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>
      <PanelGroup direction="vertical" className="min-h-0 flex-1">
        <Panel defaultSize={70} minSize={30}>
          <div className="flex h-full min-h-0 flex-1">
            <aside
              className={`shrink-0 overflow-y-auto transition-[width] duration-200 ${
                isSourceBinCollapsed ? "w-0" : "w-56"
              }`}
            >
              <SourceBin shootId={shootId} />
            </aside>
            <PanelGroup direction="horizontal" className="min-h-0 min-w-0 flex-1">
              <Panel defaultSize={72} minSize={40}>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  <SourceModeIndicator />
                  <div
                    className="flex h-full flex-1 overflow-hidden"
                    onClick={(event) => {
                      if (event.target !== event.currentTarget) return;
                      setSelectedOperationId(null);
                    }}
                  >
                    {previewSource ? (
                      <EditorCanvas
                        ref={canvasRef}
                        mediaId={previewSource.id}
                        mediaType={previewSource.type}
                        relativePath={previewSource.relativePath}
                        operations={operations}
                        totalFrames={totalFrames}
                        currentFrame={currentFrame}
                        onPlayerFrameChange={setCurrentFrame}
                      />
                    ) : (
                      <div className="flex flex-1 items-center justify-center bg-base-300 text-base-content/60">
                        Select a source to preview
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle className="w-1.5 bg-transparent hover:bg-primary/20 cursor-col-resize" />
              <Panel defaultSize={28} minSize={18}>
                <aside className="h-full min-h-0 overflow-y-auto">
                  <TransitionProperties />
                  <PropertiesPanel />
                </aside>
              </Panel>
            </PanelGroup>
          </div>
        </Panel>
        <PanelResizeHandle className="h-1.5 bg-transparent hover:bg-primary/20 cursor-row-resize" />
        <Panel defaultSize={30} minSize={15}>
          <Timeline
            currentFrame={currentFrame}
            totalFrames={totalFrames}
            fps={30}
            playing={playing}
            filename={previewSource?.relativePath.split("/").pop()}
            onSeek={seekToFrame}
            onPlay={play}
            onPause={pause}
            onSkipBack={skipBack}
            onSkipForward={skipForward}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
};
