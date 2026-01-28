import { Settings2 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Popover, PopoverTrigger } from "~/components/ui/Popover";
import { ToggleGroup } from "~/components/ui/ToggleGroup";
import { useShootPreferences } from "~/contexts/ShootPreferencesContext";

export const ShootViewSettings = () => {
  const { preferences, updatePreferences } = useShootPreferences();

  return (
    <PopoverTrigger>
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Settings2 className="h-4 w-4" />
      </Button>
      <Popover placement="bottom end" className="w-56">
        <div className="space-y-3">
          <div className="text-sm font-semibold">View Settings</div>
          <div className="border-t border-base-content/20" />
          <div className="space-y-2">
            <div className="text-sm font-medium">Grid Size</div>
            <ToggleGroup
              value={preferences.view.gridSize}
              aria-label="Grid size"
              onChange={(value) => {
                if (!value) return;
                updatePreferences({
                  view: { viewType: preferences.view.viewType, gridSize: value as "small" | "large" },
                });
              }}
              options={[
                { value: "small", label: "Small" },
                { value: "large", label: "Large" },
              ]}
            />
          </div>
        </div>
      </Popover>
    </PopoverTrigger>
  );
};
