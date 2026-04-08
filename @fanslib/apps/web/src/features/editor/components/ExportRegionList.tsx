import { useEditorStore, type ExportRegion } from "~/stores/editorStore";
import { ExportRegionMetadata } from "./ExportRegionMetadata";

const WHOLE_TIMELINE_REGION: ExportRegion = {
  id: "__whole_timeline__",
  startFrame: 0,
  endFrame: 0,
};

export const ExportRegionList = () => {
  const exportRegions = useEditorStore((s) => s.exportRegions);
  const updateExportRegion = useEditorStore((s) => s.updateExportRegion);

  if (exportRegions.length === 0) {
    return (
      <ExportRegionMetadata
        region={WHOLE_TIMELINE_REGION}
        onUpdate={() => {}}
        showHeader={false}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {exportRegions.map((region) => (
        <ExportRegionMetadata
          key={region.id}
          region={region}
          onUpdate={(updates) => updateExportRegion(region.id, updates)}
        />
      ))}
    </div>
  );
};
