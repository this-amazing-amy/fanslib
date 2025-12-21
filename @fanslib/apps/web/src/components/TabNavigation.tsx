import { cn } from "~/lib/cn";
import type { TabConfig } from "~/hooks/useTabNavigation";

type TabNavigationProps<T extends string> = {
  tabs: TabConfig<T>[];
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
              : "text-base-content/60 hover:text-base-content/80"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>;

