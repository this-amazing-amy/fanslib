import { useCallback, useEffect } from "react";
import { Slice } from "lucide-react";
import { useEditorStore } from "~/stores/editorStore";

type ExportRegionTrackProps = {
  pixelsPerFrame: number;
  totalFrames: number;
};

export const ExportRegionTrack = ({ pixelsPerFrame, totalFrames }: ExportRegionTrackProps) => {
  const exportRegionMode = useEditorStore((s) => s.exportRegionMode);
  const exportRegions = useEditorStore((s) => s.exportRegions);
  const selectedExportRegionId = useEditorStore((s) => s.selectedExportRegionId);
  const pendingExportMarkIn = useEditorStore((s) => s.pendingExportMarkIn);
  const selectExportRegion = useEditorStore((s) => s.selectExportRegion);
  const removeExportRegion = useEditorStore((s) => s.removeExportRegion);

  useEffect(() => {
    if (!exportRegionMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedExportRegionId) {
          removeExportRegion(selectedExportRegionId);
        }
      } else if (e.key === "Escape") {
        selectExportRegion(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [exportRegionMode, selectedExportRegionId, removeExportRegion, selectExportRegion]);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      // Only deselect if clicking the track background, not a region block
      if ((e.target as HTMLElement).dataset.testid !== "export-region-block") {
        selectExportRegion(null);
      }
    },
    [selectExportRegion],
  );

  if (!exportRegionMode) return null;

  return (
    <div className="flex" onClick={handleTrackClick}>
      {/* Header */}
      <div className="w-32 h-10 flex items-center px-2 border-r border-base-300 shrink-0">
        <Slice className="w-3 h-3 mr-1 shrink-0" />
        <span className="text-xs truncate">Export</span>
      </div>

      {/* Track row */}
      <div
        className="relative h-10 flex items-center flex-1"
        style={{ width: `${totalFrames * pixelsPerFrame}px` }}
      >
        {exportRegions.map((region) => {
          const width = (region.endFrame - region.startFrame) * pixelsPerFrame;
          const left = region.startFrame * pixelsPerFrame;
          const selected = selectedExportRegionId === region.id;

          return (
            <div
              key={region.id}
              data-testid="export-region-block"
              className={`absolute h-8 rounded-sm border overflow-hidden whitespace-nowrap text-xs flex items-center gap-1 px-1 select-none bg-warning/30 border-warning${selected ? " ring-2 ring-base-content" : ""}`}
              style={{ width: `${width}px`, left: `${left}px`, cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                selectExportRegion(region.id);
              }}
            >
              <span className="truncate">
                {region.startFrame}-{region.endFrame}
              </span>
            </div>
          );
        })}

        {/* Pending mark-in indicator */}
        {pendingExportMarkIn !== null && (
          <div
            data-testid="pending-mark-in-indicator"
            className="absolute top-0 h-full w-0.5 bg-warning"
            style={{ left: `${pendingExportMarkIn * pixelsPerFrame}px` }}
          />
        )}
      </div>
    </div>
  );
};
