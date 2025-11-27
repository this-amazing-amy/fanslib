import { useEffect, useState } from "react";

type UseLocalStorageReturn<T> = {
  value: T;
  setValue: (value: T) => void;
  isHydrated: boolean;
};

// Hydration-proof localStorage hook
// Always returns default value during SSR and initial client render
// Reads from localStorage after mount via useEffect
export const useLocalStorage = <T>(
  key: string,
  defaultValue: T,
  merge?: (defaults: T, stored: T) => T
): UseLocalStorageReturn<T> => {
  const [value, setValueState] = useState<T>(defaultValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Phase 1: Initialize with defaults (runs on both server and client)
  // Phase 2: Load from localStorage after mount (client only)
  useEffect(() => {
    const stored = window.localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const finalValue = merge ? merge(defaultValue, parsed) : parsed;
        setValueState(finalValue);
      } catch (error) {
        console.error(`Failed to parse localStorage key "${key}":`, error);
      }
    }
    setIsHydrated(true);
  }, [key]);

  // Persist to localStorage on changes
  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value, isHydrated]);

  const setValue = (newValue: T) => {
    setValueState(newValue);
  };

  return { value, setValue, isHydrated };
};
