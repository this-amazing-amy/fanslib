import { useEffect, useRef, useState } from "react";
import { useHydrated } from "./useHydrated";

type UseLocalStorageReturn<T> = {
  value: T;
  setValue: (value: T) => void;
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
  const isHydrated = useHydrated();
  const hasLoadedRef = useRef(false);
  const defaultValueRef = useRef(defaultValue);
  const mergeRef = useRef(merge);

  useEffect(() => {
    defaultValueRef.current = defaultValue;
    mergeRef.current = merge;
  }, [defaultValue, merge]);

  // Load from localStorage after hydration (only once)
  useEffect(() => {
    if (!isHydrated || hasLoadedRef.current) return;

    const stored = window.localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const finalValue = mergeRef.current
          ? mergeRef.current(defaultValueRef.current, parsed)
          : parsed;
        setValueState(finalValue);
      } catch (error) {
        console.error(`Failed to parse localStorage key "${key}":`, error);
      }
    }
    hasLoadedRef.current = true;
  }, [key, isHydrated]);

  // Persist to localStorage on changes
  useEffect(() => {
    if (!isHydrated || !hasLoadedRef.current) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value, isHydrated]);

  const setValue = (newValue: T) => {
    setValueState(newValue);
  };

  return { value, setValue };
};
