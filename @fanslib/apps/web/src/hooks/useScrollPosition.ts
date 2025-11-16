import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "calendar:scroll:position";

export const useScrollPosition = <T extends HTMLElement>(
  setCondition: boolean
): React.RefCallback<T> => {
  const [element, setElement] = useState<T | null>(null);
  const [scrollYStorage, setScrollYStorage] = useState(() => {
    if (typeof window === "undefined") return 0;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  });
  
  // Track if we're currently restoring scroll to prevent circular updates
  const isRestoringRef = useRef(false);
  // Track if we've already restored for this condition to prevent repeated restorations
  const hasRestoredRef = useRef(false);
  // Track the last condition value to detect changes
  const lastConditionRef = useRef(setCondition);

  const ref = useCallback((node: T | null) => {
    if (node !== null) {
      setElement(node);
    }
  }, []);

  // Reset hasRestored flag when condition changes
  useEffect(() => {
    if (lastConditionRef.current !== setCondition) {
      hasRestoredRef.current = false;
      lastConditionRef.current = setCondition;
    }
  }, [setCondition]);

  // Restore scroll position
  useEffect(() => {
    if (setCondition && element && !hasRestoredRef.current) {
      isRestoringRef.current = true;
      element.scrollTop = scrollYStorage;
      hasRestoredRef.current = true;
      
      // Reset the flag after a short delay to allow the scroll event to be ignored
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 100);
    }
  }, [setCondition, scrollYStorage, element]);

  // Save scroll position on scroll
  useEffect(() => {
    if (!element) return () => {};

    // eslint-disable-next-line functional/no-let
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      // Don't update state if we're currently restoring scroll position
      if (isRestoringRef.current) return;
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (typeof window === "undefined") return;
        const newScrollY = element.scrollTop;
        setScrollYStorage(newScrollY);
        window.localStorage.setItem(STORAGE_KEY, newScrollY.toString());
      }, 150);
    };

    element.addEventListener("scroll", handleScroll);

    return () => {
      clearTimeout(scrollTimeout);
      element.removeEventListener("scroll", handleScroll);
    };
  }, [element]);

  return ref;
};
