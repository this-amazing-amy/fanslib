import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type PaneView = "library" | "shoots" | "plan";

export type OrchestrateLayout = {
  leftPane: PaneView;
  rightPane: PaneView;
};

const defaultLayout: OrchestrateLayout = {
  leftPane: "library",
  rightPane: "plan",
};

const STORAGE_KEY = "orchestrateLayout";

export const useOrchestrateLayout = () => {
  const { value: layout, setValue: setLayout } = useLocalStorage(
    STORAGE_KEY,
    defaultLayout,
    (defaults, stored) => {
      // Validate stored layout
      if (
        stored &&
        typeof stored === "object" &&
        "leftPane" in stored &&
        "rightPane" in stored &&
        ["library", "shoots", "plan"].includes(stored.leftPane as string) &&
        ["library", "shoots", "plan"].includes(stored.rightPane as string) &&
        stored.leftPane !== stored.rightPane
      ) {
        return stored as OrchestrateLayout;
      }
      return defaults;
    }
  );

  const setLeftPane = useCallback(
    (view: PaneView) => {
      if (view === layout.rightPane) {
        // Swap: move current left to right
        setLayout({ leftPane: view, rightPane: layout.leftPane });
      } else {
        setLayout({ ...layout, leftPane: view });
      }
    },
    [layout, setLayout]
  );

  const setRightPane = useCallback(
    (view: PaneView) => {
      if (view === layout.leftPane) {
        // Swap: move current right to left
        setLayout({ leftPane: layout.rightPane, rightPane: view });
      } else {
        setLayout({ ...layout, rightPane: view });
      }
    },
    [layout, setLayout]
  );

  const availableForLeft = useMemo(() => {
    const allViews: PaneView[] = ["library", "shoots", "plan"];
    return allViews.filter((view) => view !== layout.rightPane);
  }, [layout.rightPane]);

  const availableForRight = useMemo(() => {
    const allViews: PaneView[] = ["library", "shoots", "plan"];
    return allViews.filter((view) => view !== layout.leftPane);
  }, [layout.leftPane]);

  return {
    layout,
    setLeftPane,
    setRightPane,
    availableForLeft,
    availableForRight,
  };
};

