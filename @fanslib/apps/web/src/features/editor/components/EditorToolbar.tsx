import { ArrowLeft, Undo2, Redo2, Droplets, Smile } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/Button";
import { useEditorStore } from "~/stores/editorStore";

type EditorToolbarProps = {
  mediaId: string;
};

export const EditorToolbar = ({ mediaId }: EditorToolbarProps) => {
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.canUndo);
  const canRedo = useEditorStore((s) => s.canRedo);
  const addBlur = useEditorStore((s) => s.addBlur);
  const addEmoji = useEditorStore((s) => s.addEmoji);

  return (
    <div className="h-12 border-b border-base-300 bg-base-200/50 flex items-center px-4 gap-2">
      <Link to="/content/library/media/$mediaId" params={{ mediaId }} className="flex items-center gap-1 text-sm text-base-content/60 hover:text-base-content">
        <ArrowLeft className="h-4 w-4" />
        Back to Media
      </Link>
      <div className="border-l border-base-300 h-6 mx-2" />
      <Button size="sm" variant="ghost" onPress={addBlur} aria-label="Add blur region">
        <Droplets className="h-4 w-4 mr-1" />
        <span className="text-xs">Blur</span>
      </Button>
      <Button size="sm" variant="ghost" onPress={() => addEmoji()} aria-label="Add emoji overlay">
        <Smile className="h-4 w-4 mr-1" />
        <span className="text-xs">Emoji</span>
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
