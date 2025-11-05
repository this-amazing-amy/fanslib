import { useCallback, useState } from "react";

const STORAGE_KEY = "shoot:accordion:state";

export const useShootAccordionState = (shootId: string) => {
  const [isOpen, setIsOpen] = useState(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const openShoots = new Set(JSON.parse(stored));
      return openShoots.has(shootId);
    }
    return false;
  });

  const updateOpenState = useCallback(
    (open: boolean) => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const openShoots = new Set(stored ? JSON.parse(stored) : []);

      if (open) {
        openShoots.add(shootId);
      } else {
        openShoots.delete(shootId);
      }

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(openShoots)));
      setIsOpen(open);
    },
    [shootId]
  );

  return {
    isOpen,
    setIsOpen: updateOpenState,
  };
};
