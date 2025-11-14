import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export type TabConfig<T extends string> = {
  id: T;
  label: string;
  content: ReactNode;
};

type UseTabNavigationProps<T extends string> = {
  tabs: TabConfig<T>[];
  storageKey: string;
  defaultTabId: T;
};

export const useTabNavigation = <T extends string>({
  tabs,
  storageKey,
  defaultTabId,
}: UseTabNavigationProps<T>) => {
  const [activeTabId, setActiveTabId] = useState<T>(defaultTabId);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTab = window.localStorage.getItem(storageKey);
      if (savedTab) {
        setActiveTabId(savedTab as T);
      }
    }
  }, [storageKey]);

  const updateActiveTab = (tabId: T) => {
    setActiveTabId(tabId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, tabId);
    }
  };

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  return {
    activeTabId,
    activeTab,
    updateActiveTab,
  };
};

