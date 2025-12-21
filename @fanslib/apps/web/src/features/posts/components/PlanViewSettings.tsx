import { Image, Layers, Settings2, Sparkles } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Popover, PopoverTrigger } from "~/components/ui/Popover";
import { Switch } from "~/components/ui/Switch";
import { ToggleGroup } from "~/components/ui/ToggleGroup";
import { usePostPreferences } from "~/contexts/PostPreferencesContext";
import type { PostTypeFilter } from "~/lib/virtual-posts";

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
            <div className="text-sm font-medium">Post Type</div>
            <ToggleGroup
              value={preferences.view.postTypeFilter}
              aria-label="Plan post type filter"
              onChange={(value) => {
                if (!value) return;
                updatePreferences({ view: { postTypeFilter: value as PostTypeFilter } });
              }}
              options={[
                {
                  value: "both",
                  icon: <Layers className="h-4 w-4" />,
                  ariaLabel: "Both",
                },
                {
                  value: "actual",
                  icon: <Image className="h-4 w-4" />,
                  ariaLabel: "Actual",
                },
                {
                  value: "virtual",
                  icon: <Sparkles className="h-4 w-4" />,
                  ariaLabel: "Virtual",
                },
              ]}
              optionsClassName="grid grid-cols-3 gap-2"
              itemClassName="w-full justify-center"
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
          <div className="space-y-2">
            <div className="text-sm font-medium">Auto-draft Bluesky on drop</div>
            <Switch
              isSelected={preferences.view.autoDraftBlueskyOnDrop}
              isDisabled={preferences.view.openDialogOnDrop}
              onChange={(checked) => {
                updatePreferences({ view: { autoDraftBlueskyOnDrop: checked } });
              }}
            >
              {preferences.view.autoDraftBlueskyOnDrop ? "On" : "Off"}
            </Switch>
          </div>
        </div>
      </Popover>
    </PopoverTrigger>
  );
};

