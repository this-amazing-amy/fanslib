import { useEffect, useState } from "react";
import { useMediaQuery } from "~/lib/queries/library";
import { useEditorStore } from "~/stores/editorStore";
import { useMediaEditByIdQuery } from "~/lib/queries/media-edits";
import { EditorToolbar } from "./EditorToolbar";
import { EditorCanvas } from "./EditorCanvas";
import { KeyframeTimeline } from "./KeyframeTimeline";
import { LayerPanel } from "./LayerPanel";
import { PropertiesPanel } from "./PropertiesPanel";

type EditorLayoutProps = {
  mediaId: string;
  editId?: string;
};

export const EditorLayout = ({ mediaId, editId }: EditorLayoutProps) => {
  const { data: media, isLoading: mediaLoading } = useMediaQuery({ id: mediaId });
  const { data: existingEdit, isLoading: editLoading } = useMediaEditByIdQuery(editId ?? "");
  const operations = useEditorStore((s) => s.operations);
  const hydrate = useEditorStore((s) => s.hydrate);
  const reset = useEditorStore((s) => s.reset);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const [currentFrame, setCurrentFrame] = useState(0);

  // Hydrate from existing edit
  useEffect(() => {
    if (existingEdit && editId) {
      hydrate(existingEdit.operations);
    }
    return () => reset();
  }, [existingEdit, editId, hydrate, reset]);

  // Keyboard shortcuts
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
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

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

  const isVideo = media.type === "video";
  const totalFrames = isVideo ? 900 : 1; // Default to 30s at 30fps for video

  return (
    <div className="flex flex-col h-screen">
      <EditorToolbar mediaId={mediaId} />
      <div className="flex flex-1 overflow-hidden">
        <LayerPanel />
        <div className="flex-1 flex flex-col overflow-hidden">
          <EditorCanvas
            mediaId={mediaId}
            mediaType={media.type}
            operations={operations}
          />
          {isVideo && (
            <KeyframeTimeline
              totalFrames={totalFrames}
              currentFrame={currentFrame}
              onSeek={setCurrentFrame}
            />
          )}
        </div>
        <PropertiesPanel />
      </div>
    </div>
  );
};
