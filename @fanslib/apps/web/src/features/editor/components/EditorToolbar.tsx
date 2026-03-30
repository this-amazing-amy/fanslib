import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Undo2, Redo2, ImageIcon, Save, Upload, Scissors, Crop, Type, Droplets, Smile, Grid3x3, ZoomIn } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/Button";
import { useEditorStore } from "~/stores/editorStore";
import { useClipStore } from "~/stores/clipStore";
import { useAssetsQuery } from "~/lib/queries/assets";
import { ExportDialog } from "./ExportDialog";

type EditorToolbarProps = {
  mediaId: string;
};

export const EditorToolbar = ({ mediaId }: EditorToolbarProps) => {
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.canUndo);
  const canRedo = useEditorStore((s) => s.canRedo);
  const addCrop = useEditorStore((s) => s.addCrop);
  const addCaption = useEditorStore((s) => s.addCaption);
  const isDirty = useEditorStore((s) => s.isDirty);
  const editId = useEditorStore((s) => s.editId);
  const sourceMediaId = useEditorStore((s) => s.sourceMediaId);
  const operations = useEditorStore((s) => s.operations);
  const addWatermark = useEditorStore((s) => s.addWatermark);
  const addBlur = useEditorStore((s) => s.addBlur);
  const addEmoji = useEditorStore((s) => s.addEmoji);
  const addPixelate = useEditorStore((s) => s.addPixelate);
  const addZoom = useEditorStore((s) => s.addZoom);
  const setEditId = useEditorStore((s) => s.setEditId);
  const markClean = useEditorStore((s) => s.markClean);
  const clipMode = useClipStore((s) => s.clipMode);
  const toggleClipMode = useClipStore((s) => s.toggleClipMode);
  const clipRanges = useClipStore((s) => s.ranges);

  const [watermarkOpen, setWatermarkOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const { data: assets } = useAssetsQuery("image");

  // Close popover on outside click
  useEffect(() => {
    if (!watermarkOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setWatermarkOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [watermarkOpen]);

  const handleSave = useCallback(async () => {
    const currentSourceMediaId = sourceMediaId ?? mediaId;
    setSaving(true);
    try {
      if (editId) {
        const res = await fetch(`/api/media-edits/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operations }),
        });
        if (!res.ok) throw new Error("Failed to save edit");
        markClean();
      } else {
        const res = await fetch("/api/media-edits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceMediaId: currentSourceMediaId,
            type: "transform",
            operations,
          }),
        });
        if (!res.ok) throw new Error("Failed to create edit");
        const data = await res.json();
        setEditId(data.id);
        markClean();
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  }, [editId, sourceMediaId, mediaId, operations, setEditId, markClean]);

  const canExport = operations.length > 0 || clipRanges.length > 0;

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
      <Button size="sm" variant="ghost" onPress={() => addCrop()} aria-label="Add crop">
        <Crop className="h-4 w-4 mr-1" />
        <span className="text-xs">Crop</span>
      </Button>
      <Button size="sm" variant="ghost" onPress={addCaption} aria-label="Add caption">
        <Type className="h-4 w-4 mr-1" />
        <span className="text-xs">Caption</span>
      </Button>

      {/* Watermark tool */}
      <div className="relative" ref={buttonRef}>
        <Button
          size="sm"
          variant="ghost"
          onPress={() => setWatermarkOpen((prev) => !prev)}
          aria-label="Add Watermark"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        {watermarkOpen && (
          <div
            ref={popoverRef}
            className="absolute top-full right-0 mt-1 w-56 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
          >
            <div className="p-2 text-xs font-semibold text-base-content/60 border-b border-base-300">
              Select watermark image
            </div>
            {!assets || assets.length === 0 ? (
              <div className="p-3 text-sm text-base-content/40">No image assets found</div>
            ) : (
              assets.map((asset) => (
                <button
                  key={asset.id}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-base-200 flex items-center gap-2"
                  onClick={() => {
                    addWatermark(asset.id);
                    setWatermarkOpen(false);
                  }}
                >
                  <img
                    src={`/api/assets/${asset.id}/file`}
                    alt={asset.name}
                    className="h-6 w-6 rounded object-cover"
                  />
                  <span className="truncate">{asset.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <Button size="sm" variant="ghost" onPress={addBlur} aria-label="Add blur region">
        <Droplets className="h-4 w-4 mr-1" />
        <span className="text-xs">Blur</span>
      </Button>
      <Button size="sm" variant="ghost" onPress={() => addEmoji()} aria-label="Add emoji overlay">
        <Smile className="h-4 w-4 mr-1" />
        <span className="text-xs">Emoji</span>
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
      <Button size="sm" variant="ghost" onPress={redo} isDisabled={!canRedo} aria-label="Redo">
        <Redo2 className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onPress={handleSave}
        isDisabled={!isDirty || saving}
        aria-label="Save"
      >
        <Save className="h-4 w-4" />
        <span className="ml-1 text-sm">{saving ? "Saving..." : "Save"}</span>
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onPress={() => setExportOpen(true)}
        isDisabled={!canExport}
        aria-label="Export"
      >
        <Upload className="h-4 w-4" />
        <span className="ml-1 text-sm">Export</span>
      </Button>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
};
