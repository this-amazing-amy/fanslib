import { CalendarDays, LayoutList, Settings2 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Popover, PopoverTrigger } from "~/components/ui/Popover";
import { Switch } from "~/components/ui/Switch";
import { ToggleGroup } from "~/components/ui/ToggleGroup";
import { usePostPreferences, type PostViewType } from "~/contexts/PostPreferencesContext";

export const PlanViewSettings = () => {
  const { preferences, updatePreferences } = usePostPreferences();

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
            <div className="text-sm font-medium">View Type</div>
            <ToggleGroup
              value={preferences.view.viewType}
              onChange={(value) => {
                if (!value) return;
                updatePreferences({ view: { viewType: value as PostViewType } });
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
          <div className="space-y-2">
            <div className="text-sm font-medium">Show Captions</div>
            <Switch
              isSelected={preferences.view.showCaptions}
              onChange={(checked) => {
                updatePreferences({ view: { showCaptions: checked } });
              }}
            >
              {preferences.view.showCaptions ? "On" : "Off"}
            </Switch>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Open dialog on drop</div>
            <Switch
              isSelected={preferences.view.openDialogOnDrop}
              onChange={(checked) => {
                updatePreferences({ view: { openDialogOnDrop: checked } });
              }}
            >
              {preferences.view.openDialogOnDrop ? "On" : "Off"}
            </Switch>
          </div>
        </div>
      </Popover>
    </PopoverTrigger>
  );
};

