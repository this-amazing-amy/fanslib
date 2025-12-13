import { Bookmark, Check, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { MediaFilterSummary } from "~/components/MediaFilterSummary";
import { Button } from "~/components/ui/Button";
import {
    Dialog,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogModal,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/Dialog";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";
import { ScrollArea } from "~/components/ui/ScrollArea";
import { Tooltip } from "~/components/ui/Tooltip";
import { useFilterPresetContext } from "~/contexts/FilterPresetContext";
import { filtersFromFilterPreset } from "~/features/library/filter-helpers";
import { useHydrated } from "~/hooks/useHydrated";
import { useMediaFilters } from "./MediaFiltersContext";

type FilterPresetDialogProps = {
  disabled?: boolean;
};

export const FilterPresetDialog = ({ disabled = false }: FilterPresetDialogProps) => {
  const { presets, isLoading, applyPreset, createPreset, deletePreset } = useFilterPresetContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [armedDeletePresetId, setArmedDeletePresetId] = useState<string | null>(null);
  const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null);
  const { filters, hasActiveFilters } = useMediaFilters();
  const isHydrated = useHydrated();

  useEffect(() => {
    if (!armedDeletePresetId) return;
    if (deletingPresetId === armedDeletePresetId) return;

    const timeoutId = window.setTimeout(() => {
      setArmedDeletePresetId(null);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [armedDeletePresetId, deletingPresetId]);

  const savePreset = async () => {
    const trimmedName = presetName.trim();
    if (!trimmedName) return;

    setIsSaving(true);
    try {
      await createPreset(trimmedName, filters);
      setPresetName("");
    } finally {
      setIsSaving(false);
    }
  };

  const armOrDeletePreset = async (presetId: string) => {
    if (armedDeletePresetId !== presetId) {
      setArmedDeletePresetId(presetId);
      return;
    }

    setDeletingPresetId(presetId);
    try {
      await deletePreset(presetId);
      setArmedDeletePresetId(null);
    } finally {
      setDeletingPresetId(null);
    }
  };

  return (
    <DialogTrigger isOpen={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <Button variant="ghost" size="icon" className="h-9 w-9" isDisabled={disabled || isLoading}>
        <Bookmark className="h-4 w-4" />
      </Button>
      <DialogModal>
        <Dialog maxWidth="2xl">
          {({ close }) => (
            <>
              <DialogHeader>
                <DialogTitle>Filter Presets</DialogTitle>
                <DialogDescription>
                  Apply a preset, or save your current filters as a new preset.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="rounded-lg border p-4">
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="filter-preset-name">Preset name</Label>
                      <Input
                        id="filter-preset-name"
                        value={presetName}
                        onChange={setPresetName}
                        placeholder="Enter preset name..."
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          if (!presetName.trim()) return;
                          savePreset();
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <MediaFilterSummary mediaFilters={filters} className="max-w-[65%]" />
                      <Button
                        size="sm"
                        variant="ghost"
                        onPress={savePreset}
                        isDisabled={!hasActiveFilters || !isHydrated || !presetName.trim() || isSaving}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? "Saving..." : "Save filters as preset"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border">
                  {presets.length === 0 ? (
                    <div className="p-6 text-sm text-base-content/70">No presets saved yet.</div>
                  ) : (
                    <ScrollArea className="h-[360px]">
                      <div className="p-2">
                        <div className="grid gap-2">
                          {presets.map((preset) => {
                            const presetFilters = filtersFromFilterPreset(preset);
                            const isArmed = armedDeletePresetId === preset.id;
                            const isDeleting = deletingPresetId === preset.id;
                            return (
                              <div
                                key={preset.id}
                                className="flex items-start justify-between gap-3 rounded-lg border px-3 py-3"
                              >
                                <div className="grid gap-2 text-left">
                                  <div className="font-medium">{preset.name}</div>
                                  <MediaFilterSummary mediaFilters={presetFilters} />
                                </div>

                                <div className="flex items-center gap-2">
                                  <Tooltip content={<p>Apply preset</p>} openDelayMs={0}>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      aria-label="Apply preset"
                                      onPress={() => {
                                        setArmedDeletePresetId(null);
                                        applyPreset(presetFilters);
                                        close();
                                      }}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  </Tooltip>

                                  <Tooltip
                                    content={<p>{isArmed ? "Confirm delete" : "Delete preset"}</p>}
                                    openDelayMs={0}
                                  >
                                    <Button
                                      size="icon"
                                      variant={isArmed ? "error" : "ghost"}
                                      aria-label={isArmed ? "Confirm delete preset" : "Delete preset"}
                                      className={!isArmed ? "text-destructive" : undefined}
                                      onPress={() => armOrDeletePreset(preset.id)}
                                      isDisabled={isDeleting}
                                    >
                                      {isArmed ? (
                                        <Check className="h-4 w-4" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </Tooltip>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onPress={close}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </Dialog>
      </DialogModal>
    </DialogTrigger>
  );
};
