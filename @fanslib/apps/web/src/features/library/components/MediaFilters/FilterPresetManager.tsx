import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import { Input } from "~/components/ui/Input";
import { ScrollArea } from "~/components/ui/ScrollArea";
import { useFilterPresetContext } from "~/contexts/FilterPresetContext";
import { filtersFromFilterPreset } from "~/features/library/filter-helpers";

type FilterPresetManagerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type EditingPreset = {
  id: string;
  name: string;
};

export const FilterPresetManager = ({ open, onOpenChange }: FilterPresetManagerProps) => {
  const { presets, isLoading, updatePreset, deletePreset } = useFilterPresetContext();
  const [editingPreset, setEditingPreset] = useState<EditingPreset | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingPreset({ id, name: currentName });
  };

  const handleSaveEdit = async () => {
    if (!editingPreset?.name.trim()) return;

    try {
      await updatePreset(editingPreset.id, editingPreset.name.trim());
      setEditingPreset(null);
    } catch {
      // Error is handled by the mutation's onError callback
    }
  };

  const handleCancelEdit = () => {
    setEditingPreset(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePreset(id);
      setDeleteConfirmId(null);
    } catch {
      // Error is handled by the mutation's onError callback
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Filter Presets</DialogTitle>
          <DialogDescription>
            Manage your saved filter presets. You can rename or delete existing presets.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading presets...</div>
          ) : presets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No presets saved yet. Create filters and save them as presets to manage them here.
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      {editingPreset?.id === preset.id ? (
                        <Input
                          value={editingPreset.name}
                          onChange={(value) =>
                            setEditingPreset({ ...editingPreset, name: value })
                          }
                          onKeyDown={handleKeyDown}
                          onBlur={handleSaveEdit}
                          autoFocus
                          className="h-8"
                        />
                      ) : (
                        <div>
                          <div className="font-medium truncate">{preset.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {filtersFromFilterPreset(preset).length} filter group
                            {filtersFromFilterPreset(preset).length !== 1 ? "s" : ""}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {deleteConfirmId === preset.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="error"
                            onClick={() => handleDelete(preset.id)}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleStartEdit(preset.id, preset.name)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteConfirmId(preset.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
