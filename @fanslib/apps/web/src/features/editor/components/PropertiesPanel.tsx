import { Settings2 } from "lucide-react";
import { useEditorStore } from "~/stores/editorStore";

export const PropertiesPanel = () => {
  const operations = useEditorStore((s) => s.operations);
  const selectedIndex = useEditorStore((s) => s.selectedOperationIndex);

  if (selectedIndex === null || selectedIndex >= operations.length) {
    return (
      <div className="w-72 border-l border-base-300 bg-base-200/30 p-4 flex flex-col items-center justify-center text-base-content/40">
        <Settings2 className="h-8 w-8 mb-2" />
        <p className="text-sm text-center">Select an operation to edit its properties</p>
      </div>
    );
  }

  const op = operations[selectedIndex] as Record<string, unknown>;

  return (
    <div className="w-72 border-l border-base-300 bg-base-200/30 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold mb-3 capitalize">{String(op.type ?? "Properties")}</h3>
      <div className="space-y-3 text-sm">
        {Object.entries(op)
          .filter(([key]) => key !== "type")
          .map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-base-content/60 capitalize">{key}</span>
              <span className="font-mono text-xs">{String(value)}</span>
            </div>
          ))}
      </div>
    </div>
  );
};
