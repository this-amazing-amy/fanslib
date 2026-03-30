import { GripVertical, Eye, Trash2, Layers } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useEditorStore } from "~/stores/editorStore";

export const LayerPanel = () => {
  const operations = useEditorStore((s) => s.operations);
  const selectedIndex = useEditorStore((s) => s.selectedOperationIndex);
  const setSelectedIndex = useEditorStore((s) => s.setSelectedOperationIndex);
  const removeOperation = useEditorStore((s) => s.removeOperation);

  if (operations.length === 0) {
    return (
      <div className="w-64 border-r border-base-300 bg-base-200/30 p-4 flex flex-col items-center justify-center text-base-content/40">
        <Layers className="h-8 w-8 mb-2" />
        <p className="text-sm text-center">No operations yet</p>
        <p className="text-xs text-center">Add a tool from the toolbar to get started</p>
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-base-300 bg-base-200/30 p-2 overflow-y-auto">
      <h3 className="text-sm font-semibold px-2 py-1 mb-1">Layers</h3>
      <div className="space-y-1">
        {operations.map((op, index) => {
          const opObj = op as { type?: string };
          const label = opObj.type ?? `Operation ${index + 1}`;
          const isSelected = selectedIndex === index;

          return (
            <div
              key={index}
              className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-sm ${
                isSelected ? "bg-base-300 text-base-content" : "text-base-content/70 hover:bg-base-300/50"
              }`}
              onClick={() => setSelectedIndex(isSelected ? null : index)}
            >
              <GripVertical className="h-3 w-3 text-base-content/30 cursor-grab" />
              <span className="flex-1 truncate capitalize">{label}</span>
              <Eye className="h-3 w-3 text-base-content/30" />
              <Button
                size="sm"
                variant="ghost"
                onPress={() => removeOperation(index)}
              >
                <Trash2 className="h-3 w-3 text-error" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
