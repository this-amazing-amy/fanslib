import { ArrowLeft, Undo2, Redo2, Scissors, Droplets, Grid3x3, ZoomIn } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/Button";
import { useEditorStore } from "~/stores/editorStore";
import { useClipStore } from "~/stores/clipStore";

type EditorToolbarProps = {
  mediaId: string;
};

export const EditorToolbar = ({ mediaId }: EditorToolbarProps) => {
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.canUndo);
  const canRedo = useEditorStore((s) => s.canRedo);
  const clipMode = useClipStore((s) => s.clipMode);
  const toggleClipMode = useClipStore((s) => s.toggleClipMode);
  const addBlur = useEditorStore((s) => s.addBlur);
  const addPixelate = useEditorStore((s) => s.addPixelate);
  const addZoom = useEditorStore((s) => s.addZoom);

  return (
    <div className="h-12 border-b border-base-300 bg-base-200/50 flex items-center px-4 gap-2">
      <Link to="/content/library/media/$mediaId" params={{ mediaId }} className="flex items-center gap-1 text-sm text-base-content/60 hover:text-base-content">
        <ArrowLeft className="h-4 w-4" />
        Back to Media
      </Link>
      <div className="border-l border-base-300 h-6 mx-2" />
      <Button
        size="sm"
        variant={clipMode ? "primary" : "ghost"}
        onPress={toggleClipMode}
        aria-label="Clip tool"
      >
        <Scissors className="h-4 w-4 mr-1" />
        <span className="text-xs">Clip</span>
      </Button>
      <Button size="sm" variant="ghost" onPress={addBlur} aria-label="Add blur region">
        <Droplets className="h-4 w-4 mr-1" />
        <span className="text-xs">Blur</span>
      </Button>
      <Button size="sm" variant="ghost" onPress={addPixelate} aria-label="Add pixelate region">
        <Grid3x3 className="h-4 w-4 mr-1" />
        <span className="text-xs">Pixelate</span>
      </Button>
      <Button size="sm" variant="ghost" onPress={addZoom} aria-label="Add zoom effect">
        <ZoomIn className="h-4 w-4 mr-1" />
        <span className="text-xs">Zoom</span>
      </Button>
      <div className="flex-1" />
      <Button
        size="sm"
        variant="ghost"
        onPress={undo}
        isDisabled={!canUndo}
        aria-label="Undo"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onPress={redo}
        isDisabled={!canRedo}
        aria-label="Redo"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
