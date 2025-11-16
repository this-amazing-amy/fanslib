import { Settings2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import { ToggleGroup } from "~/components/ui/ToggleGroup";
import type { GridSize } from "~/contexts/LibraryPreferencesContext";
import { useLibraryPreferences } from "~/contexts/LibraryPreferencesContext";

export const GalleryViewSettings = () => {
  const { preferences, updatePreferences } = useLibraryPreferences();

  return (
    <DropdownMenu >
      <DropdownMenuTrigger>
        <button className="btn btn-ghost hover:bg-primary/20 hover:ring-2 hover:ring-primary btn-square h-9 w-9">
          <Settings2 className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>View Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2">
          <div className="mb-2 text-sm font-medium">Grid Size</div>
          <ToggleGroup
            options={[{ value: "small", label: "Small" }, { value: "large", label: "Large" }]}
            value={preferences.view.gridSize}
            onChange={(value) => {
              if (!value) return;
              updatePreferences({ view: { gridSize: value as GridSize } });
            }}
            className="grid grid-cols-2 gap-2"
          >
          </ToggleGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
