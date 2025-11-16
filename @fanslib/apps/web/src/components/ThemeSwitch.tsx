import { Switch } from "~/components/ui/Switch";
import { useTheme } from "~/contexts/ThemeContext";
import { useSaveSettingsMutation } from "~/lib/queries/settings";

export const ThemeSwitch = () => {
  const { theme, setTheme } = useTheme();
  const { mutateAsync: saveSettings } = useSaveSettingsMutation();

  const updateTheme = async (checked: boolean) => {
    const newTheme = checked ? "dark" : "light";
    setTheme(newTheme);

    try {
      await saveSettings({ theme: newTheme });
    } catch (error) {
      console.error("Failed to save theme preference:", error);
      setTheme(theme);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch id="theme-mode" isSelected={theme === "dark"} onChange={updateTheme}>
        Dark Mode
      </Switch>
    </div>
  );
};
