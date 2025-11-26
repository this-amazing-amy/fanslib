import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogModal,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopover,
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
    <DialogTrigger isOpen={open} onOpenChange={onOpenChange}>
      <DialogModal>
        <Dialog maxWidth="md">
          {({ close: _close }) => (
            <>
              <DialogHeader>
                <DialogTitle>Manage Filter Presets</DialogTitle>
                <DialogDescription>
                  Manage your saved filter presets. You can rename or delete existing presets.
                </DialogDescription>
              </DialogHeader>
        <div className="py-4">{
          isLoading ? (
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
                          aria-label="Filter preset name"
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
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                          <DropdownMenuPopover placement="bottom end">
                            <DropdownMenu
                              onAction={(key) => {
                                if (key === "rename") {
                                  handleStartEdit(preset.id, preset.name);
                                } else if (key === "delete") {
                                  setDeleteConfirmId(preset.id);
                                }
                              }}
                            >
                              <DropdownMenuItem id="rename">
                                <Pencil className="h-4 w-4 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem id="delete" className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenu>
                          </DropdownMenuPopover>
                        </DropdownMenuTrigger>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
            </>
          )}
        </Dialog>
      </DialogModal>
    </DialogTrigger>
  );
};
