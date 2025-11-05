import { useState } from "react";
import type { MediaFilters } from "@fanslib/types";
import { Button } from "~/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/Dialog";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";
import { useFilterPresetContext } from "~/contexts/FilterPresetContext";

type SavePresetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: MediaFilters;
};

export const SavePresetDialog = ({ open, onOpenChange, filters }: SavePresetDialogProps) => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { createPreset } = useFilterPresetContext();

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await createPreset(name.trim(), filters);
      setName("");
      onOpenChange(false);
    } catch {
      // Error is handled by the mutation's onError callback
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Filter Preset</DialogTitle>
          <DialogDescription>
            Save your current filter configuration as a preset to quickly apply it later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="preset-name" className="text-right">
              Name
            </Label>
            <Input
              id="preset-name"
              value={name}
              onChange={setName}
              className="col-span-3"
              placeholder="Enter preset name..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  handleSave();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onPress={handleCancel} isDisabled={isLoading}>
            Cancel
          </Button>
          <Button onPress={handleSave} isDisabled={!name.trim() || isLoading}>
            {isLoading ? "Saving..." : "Save Preset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
