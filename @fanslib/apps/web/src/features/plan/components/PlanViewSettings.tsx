import { CalendarDays, LayoutList, Settings2 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import { ToggleGroup } from "~/components/ui/ToggleGroup";
import { Switch } from "~/components/ui/Switch";
import { usePlanPreferences, type PlanViewType } from "~/contexts/PlanPreferencesContext";

export const PlanViewSettings = () => {
  const { preferences, updatePreferences } = usePlanPreferences();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>View Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2">
          <div className="mb-2 text-sm font-medium">View Type</div>
          <ToggleGroup
            value={preferences.view.viewType}
            onValueChange={(value) => {
              if (!value) return;
              updatePreferences({ view: { viewType: value as PlanViewType } });
            }}
            options={[
              {
                value: "timeline",
                label: "Timeline",
                icon: <LayoutList className="h-4 w-4" />,
              },
              {
                value: "calendar",
                label: "Calendar",
                icon: <CalendarDays className="h-4 w-4" />,
              },
            ]}
            className="grid grid-cols-2 gap-2"
          />
        </div>
        <div className="p-2">
          <div className="mb-2 text-sm font-medium">Show Captions</div>
          <Switch
            isSelected={preferences.view.showCaptions}
            onChange={(checked) => {
              updatePreferences({ view: { showCaptions: checked } });
            }}
          >
            {preferences.view.showCaptions ? "On" : "Off"}
          </Switch>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

