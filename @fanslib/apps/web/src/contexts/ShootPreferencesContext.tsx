import { createContext, useContext, useEffect, useState } from "react";

export type ShootViewType = "grid" | "list";
export type ShootSortField = "name" | "date" | "mediaCount";
export type ShootSortDirection = "ASC" | "DESC";

export type ShootViewPreferences = {
  view: {
    viewType: ShootViewType;
    gridSize: "small" | "large";
  };
  sort: {
    field: ShootSortField;
    direction: ShootSortDirection;
  };
};

const defaultPreferences: ShootViewPreferences = {
  view: {
    viewType: "grid",
    gridSize: "small",
  },
  sort: {
    field: "date",
    direction: "DESC",
  },
};

type ShootPreferencesContextType = {
  preferences: ShootViewPreferences;
  updatePreferences: (preferences: Partial<ShootViewPreferences>) => void;
};

const ShootPreferencesContext = createContext<ShootPreferencesContextType | null>(null);

const STORAGE_KEY = "shoot-preferences";

export const ShootPreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  const [preferences, setPreferences] = useState<ShootViewPreferences>(() => {
    if (typeof window === "undefined") return defaultPreferences;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultPreferences, ...JSON.parse(stored) };
    return defaultPreferences;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const updatePreferences = (newPreferences: Partial<ShootViewPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...newPreferences }));
  };

  return (
    <ShootPreferencesContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </ShootPreferencesContext.Provider>
  );
};

export const useShootPreferences = () => {
  const context = useContext(ShootPreferencesContext);
  if (!context) {
    throw new Error("useShootPreferences must be used within a ShootPreferencesProvider");
  }
  return context;
};
