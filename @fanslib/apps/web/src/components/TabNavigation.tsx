import { cn } from "~/lib/cn";

type TabItem<T extends string> = {
  id: T;
  label: string;
};

type TabNavigationProps<T extends string> = {
  tabs: TabItem<T>[];
  activeTabId: T;
  onTabChange: (tabId: T) => void;
  className?: string;
  textSize?: "text-lg" | "text-xl" | "text-2xl";
};

export const TabNavigation = <T extends string,>({
  tabs,
  activeTabId,
  onTabChange,
  className = "",
  textSize = "text-2xl",
}: TabNavigationProps<T>) => <div className={cn("flex items-center gap-4", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            textSize,
            "font-bold transition-colors cursor-pointer",
            activeTabId === tab.id
              ? "text-base-content"
              : "text-base-content/40 hover:text-base-content/60"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>;

